import { API_CONFIG } from '../../config/api';
import { PricingSourceResult } from '../../types/pricing';

const MOCK_RESULT: PricingSourceResult = {
  source: 'scryfall',
  searchQuery: 'mock',
  resultsFound: 3,
  avgPrice: 12.5,
  medianPrice: 12.5,
  minPrice: 8.0,
  maxPrice: 17.0,
  sampleListings: [
    { title: 'Scryfall Market Price', price: 12.5, url: 'https://scryfall.com', date: new Date().toISOString() },
  ],
  confidenceContribution: 20,
};

export async function searchScryfall(
  cardName: string,
  setName?: string | null,
): Promise<PricingSourceResult> {
  if (API_CONFIG.useMocks) return MOCK_RESULT;

  try {
    const params = new URLSearchParams({ exact: cardName });
    if (setName) params.set('set', setName.toLowerCase().replace(/\s+/g, ''));

    const res = await fetch(`https://api.scryfall.com/cards/named?${params}`);

    if (!res.ok) {
      // Try fuzzy search if exact fails
      const fuzzyParams = new URLSearchParams({ fuzzy: cardName });
      const fuzzyRes = await fetch(`https://api.scryfall.com/cards/named?${fuzzyParams}`);
      if (!fuzzyRes.ok) return emptyResult(cardName);
      const card = await fuzzyRes.json();
      return extractPricing(card, cardName);
    }

    const card = await res.json();
    return extractPricing(card, cardName);
  } catch {
    return emptyResult(cardName);
  }
}

function extractPricing(card: any, query: string): PricingSourceResult {
  const usd = parseFloat(card.prices?.usd ?? '0') || 0;
  const usdFoil = parseFloat(card.prices?.usd_foil ?? '0') || 0;
  const price = usd > 0 ? usd : usdFoil;

  if (price === 0) return emptyResult(query);

  return {
    source: 'scryfall',
    searchQuery: query,
    resultsFound: 1,
    avgPrice: price,
    medianPrice: price,
    minPrice: price,
    maxPrice: usdFoil > 0 ? usdFoil : price,
    sampleListings: [
      {
        title: `${card.name} (${card.set_name}) — Scryfall Market`,
        price,
        url: card.scryfall_uri ?? 'https://scryfall.com',
        date: new Date().toISOString(),
      },
    ],
    confidenceContribution: 20,
  };
}

function emptyResult(query: string): PricingSourceResult {
  return {
    source: 'scryfall',
    searchQuery: query,
    resultsFound: 0,
    avgPrice: null,
    medianPrice: null,
    minPrice: null,
    maxPrice: null,
    sampleListings: [],
    confidenceContribution: 0,
  };
}
