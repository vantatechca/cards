import { CollectionType } from '../../types/card';
import {
  PricingResult,
  PricingSourceResult,
  ConfidenceFactors,
  getConfidenceLabel,
  getConfidenceColor,
} from '../../types/pricing';
import { searchEbaySold } from './ebayService';
import { searchTcgPlayer } from './tcgplayerService';
import { searchCardMarket } from './cardmarketService';
import { calculateConfidence } from './confidenceCalculator';
import { getUsdToCadRate } from '../currency/currencyService';
import { createPriceCheck } from '../supabase/priceCheckRepository';
import type { PriceSource } from '../../types/card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CardInput {
  card_id?: string; // If provided, price check audit records are created
  card_name: string;
  set_name: string | null;
  collection_type: CollectionType;
  card_number: string | null;
  edition: string | null;
  condition_psa_estimate: number | null;
  ai_confidence_identification: number | null;
}

// ---------------------------------------------------------------------------
// Query builders (different format per card type)
// ---------------------------------------------------------------------------

function buildEbayQuery(card: CardInput): string {
  const parts: string[] = [];

  switch (card.collection_type) {
    case 'hockey': {
      // Hockey: "Year Set Player #Number"
      if (card.set_name) parts.push(card.set_name);
      parts.push(card.card_name);
      if (card.card_number) parts.push(`#${card.card_number}`);
      parts.push('hockey card');
      break;
    }
    case 'magic': {
      // Magic: "CardName [SetName] [Edition] MTG"
      parts.push(card.card_name);
      if (card.set_name) parts.push(card.set_name);
      if (card.edition) parts.push(card.edition);
      parts.push('MTG');
      break;
    }
    case 'yugioh': {
      // Yugioh: "CardName SetCode [Edition] Yugioh"
      parts.push(card.card_name);
      if (card.card_number) parts.push(card.card_number);
      if (card.edition) parts.push(card.edition);
      parts.push('Yugioh');
      break;
    }
  }

  return parts.join(' ');
}

function mapConditionToEbayFilter(psa: number | null): string | undefined {
  if (psa == null) return undefined;
  if (psa >= 9) return 'Brand New';
  if (psa >= 7) return 'Like New';
  if (psa >= 5) return 'Very Good';
  if (psa >= 3) return 'Good';
  return 'Acceptable';
}

// ---------------------------------------------------------------------------
// Aggregation helpers
// ---------------------------------------------------------------------------

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Check whether all non-null values agree within a given percentage tolerance. */
function valuesAgreeWithinPct(values: number[], pct: number): boolean {
  if (values.length < 2) return false;
  const max = Math.max(...values);
  const min = Math.min(...values);
  if (max === 0) return true;
  return (max - min) / max <= pct / 100;
}

function oldestListingOverMonths(
  sources: PricingSourceResult[],
  months: number,
): boolean {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);

  for (const src of sources) {
    for (const listing of src.sampleListings) {
      if (new Date(listing.date) < cutoff) return true;
    }
  }
  return false;
}

function totalListingCount(sources: PricingSourceResult[]): number {
  return sources.reduce((sum, s) => sum + s.resultsFound, 0);
}

// ---------------------------------------------------------------------------
// Weighted value calculation
// ---------------------------------------------------------------------------

function computeWeightedValue(breakdown: {
  ebay?: { median: number; count: number };
  tcgplayer?: { market: number };
  cardmarket?: { trend: number };
}): number | null {
  // Weights: eBay 50%, TCGPlayer 30%, Cardmarket 20%
  // If a source is missing, redistribute proportionally.
  const entries: { value: number; weight: number }[] = [];

  if (breakdown.ebay) {
    entries.push({ value: breakdown.ebay.median, weight: 50 });
  }
  if (breakdown.tcgplayer) {
    entries.push({ value: breakdown.tcgplayer.market, weight: 30 });
  }
  if (breakdown.cardmarket) {
    entries.push({ value: breakdown.cardmarket.trend, weight: 20 });
  }

  if (entries.length === 0) return null;

  const totalWeight = entries.reduce((s, e) => s + e.weight, 0);
  const weighted = entries.reduce(
    (s, e) => s + e.value * (e.weight / totalWeight),
    0,
  );

  return Math.round(weighted * 100) / 100;
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

export async function priceCard(card: CardInput): Promise<PricingResult> {
  // 1. Build queries
  const ebayQuery = buildEbayQuery(card);
  const conditionFilter = mapConditionToEbayFilter(card.condition_psa_estimate);

  // 2. Determine which sources to query
  const skipTcgPlayer = card.collection_type === 'hockey';

  // 3. Fire all applicable sources in parallel
  const promises: [
    Promise<PromiseSettledResult<PricingSourceResult>>,
    Promise<PromiseSettledResult<PricingSourceResult>>,
    Promise<PromiseSettledResult<PricingSourceResult>>,
  ] = [
    Promise.allSettled([searchEbaySold(ebayQuery, conditionFilter)]).then(
      (r) => r[0],
    ),
    skipTcgPlayer
      ? Promise.resolve({
          status: 'rejected' as const,
          reason: 'TCGPlayer not applicable for hockey',
        })
      : Promise.allSettled([
          searchTcgPlayer(card.card_name, card.set_name ?? undefined, card.edition ?? undefined),
        ]).then((r) => r[0]),
    Promise.allSettled([
      searchCardMarket(card.card_name, card.set_name ?? undefined),
    ]).then((r) => r[0]),
  ];

  const [ebayResult, tcgResult, cmResult] = await Promise.all(promises);

  // 4. Extract successful results
  const ebay: PricingSourceResult | null =
    ebayResult.status === 'fulfilled' ? ebayResult.value : null;
  const tcg: PricingSourceResult | null =
    tcgResult.status === 'fulfilled' ? tcgResult.value : null;
  const cm: PricingSourceResult | null =
    cmResult.status === 'fulfilled' ? cmResult.value : null;

  const allSources: PricingSourceResult[] = [ebay, tcg, cm].filter(
    (s): s is PricingSourceResult => s != null,
  );

  // 5. Build the breakdown
  const breakdown: PricingResult['breakdown'] = {};

  if (ebay && ebay.medianPrice != null) {
    breakdown.ebay = {
      median: ebay.medianPrice,
      count: ebay.resultsFound,
    };
  }
  if (tcg && tcg.medianPrice != null) {
    breakdown.tcgplayer = { market: tcg.medianPrice };
  }
  if (cm && cm.medianPrice != null) {
    breakdown.cardmarket = { trend: cm.medianPrice };
  }

  // 6. Compute weighted estimated value
  const estimatedValueUsd = computeWeightedValue(breakdown);

  // 7. Convert to CAD
  const cadRate = await getUsdToCadRate();
  const estimatedValueCad =
    estimatedValueUsd != null
      ? Math.round(estimatedValueUsd * cadRate * 100) / 100
      : null;

  // 8. Gather price values for agreement checks
  const priceValues: number[] = [];
  if (breakdown.ebay) priceValues.push(breakdown.ebay.median);
  if (breakdown.tcgplayer) priceValues.push(breakdown.tcgplayer.market);
  if (breakdown.cardmarket) priceValues.push(breakdown.cardmarket.trend);

  // 9. Build confidence factors
  const factors: ConfidenceFactors = {
    ebayDataExists: ebay != null && ebay.resultsFound > 0,
    ebayThreePlusSales: ebay != null && ebay.resultsFound >= 3,
    ebayTenPlusSales: ebay != null && ebay.resultsFound >= 10,
    tcgplayerExists: tcg != null && tcg.resultsFound > 0,
    cardmarketExists: cm != null && cm.resultsFound > 0,
    sourcesAgreeWithin20Pct: valuesAgreeWithinPct(priceValues, 20),
    aiConfidenceAbove90:
      card.ai_confidence_identification != null &&
      card.ai_confidence_identification >= 90,
    exactCardMatch:
      card.card_number != null && card.card_number.trim().length > 0,
    // Penalties
    sourcesDisagreeOver50Pct:
      priceValues.length >= 2 && !valuesAgreeWithinPct(priceValues, 50),
    onlyOneSoldListing: totalListingCount(allSources) === 1,
    oldestSaleOver6Months: oldestListingOverMonths(allSources, 6),
    aiConfidenceBelow70:
      card.ai_confidence_identification != null &&
      card.ai_confidence_identification < 70,
  };

  const confidencePct = calculateConfidence(factors);

  // 10. Collect proof links from all sources
  const proofLinks = allSources.flatMap((s) => s.sampleListings);

  // 11. Create price check audit records (best-effort, don't block pricing)
  if (card.card_id) {
    const now = new Date().toISOString();
    const sourceEntries: Array<{ source: PriceSource; result: PricingSourceResult | null }> = [
      { source: 'ebay_sold', result: ebay },
      { source: 'tcgplayer', result: tcg },
      { source: 'cardmarket', result: cm },
    ];

    for (const entry of sourceEntries) {
      if (entry.result) {
        const r = entry.result;
        createPriceCheck({
          card_id: card.card_id,
          checked_at: now,
          source: entry.source,
          search_query_used: r.searchQuery,
          results_found: r.resultsFound,
          avg_sold_price_usd: r.avgPrice,
          median_sold_price_usd: r.medianPrice,
          min_sold_price_usd: r.minPrice,
          max_sold_price_usd: r.maxPrice,
          sample_listings: r.sampleListings,
          raw_response: null,
          confidence_contribution: r.confidenceContribution,
        }).catch(() => {}); // fire and forget
      }
    }
  }

  return {
    estimatedValueUsd,
    estimatedValueCad,
    confidencePct,
    confidenceLabel: getConfidenceLabel(confidencePct),
    confidenceColor: getConfidenceColor(confidencePct),
    sources: allSources,
    proofLinks,
    breakdown,
  };
}
