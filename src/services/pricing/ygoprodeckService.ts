import { API_CONFIG } from '../../config/api';
import { PricingSourceResult } from '../../types/pricing';

const MOCK_RESULT: PricingSourceResult = {
  source: 'ygoprodeck',
  searchQuery: 'mock',
  resultsFound: 3,
  avgPrice: 8.5,
  medianPrice: 8.5,
  minPrice: 5.0,
  maxPrice: 12.0,
  sampleListings: [
    { title: 'YGOPRODeck TCGPlayer Price', price: 8.5, url: 'https://ygoprodeck.com', date: new Date().toISOString() },
  ],
  confidenceContribution: 20,
};

export async function searchYGOProDeck(
  cardName: string,
): Promise<PricingSourceResult> {
  if (API_CONFIG.useMocks) return MOCK_RESULT;

  try {
    const params = new URLSearchParams({ name: cardName });
    const res = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?${params}`);

    if (!res.ok) {
      // Try fuzzy search
      const fuzzyParams = new URLSearchParams({ fname: cardName.split(' ').slice(0, 2).join(' ') });
      const fuzzyRes = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?${fuzzyParams}`);
      if (!fuzzyRes.ok) return emptyResult(cardName);
      const data = await fuzzyRes.json();
      return extractPricing(data, cardName);
    }

    const data = await res.json();
    return extractPricing(data, cardName);
  } catch {
    return emptyResult(cardName);
  }
}

function extractPricing(data: any, query: string): PricingSourceResult {
  const card = data?.data?.[0];
  if (!card) return emptyResult(query);

  const prices = card.card_prices?.[0];
  if (!prices) return emptyResult(query);

  const tcgPrice = parseFloat(prices.tcgplayer_price ?? '0') || 0;
  const ebayPrice = parseFloat(prices.ebay_price ?? '0') || 0;
  const amazonPrice = parseFloat(prices.amazon_price ?? '0') || 0;

  const validPrices = [tcgPrice, ebayPrice, amazonPrice].filter((p) => p > 0);
  if (validPrices.length === 0) return emptyResult(query);

  const avg = validPrices.reduce((a, b) => a + b, 0) / validPrices.length;
  const sorted = [...validPrices].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];

  const listings = [];
  if (tcgPrice > 0) listings.push({ title: `${card.name} — TCGPlayer`, price: tcgPrice, url: 'https://www.tcgplayer.com', date: new Date().toISOString() });
  if (ebayPrice > 0) listings.push({ title: `${card.name} — eBay`, price: ebayPrice, url: 'https://www.ebay.com', date: new Date().toISOString() });
  if (amazonPrice > 0) listings.push({ title: `${card.name} — Amazon`, price: amazonPrice, url: 'https://www.amazon.com', date: new Date().toISOString() });

  return {
    source: 'ygoprodeck',
    searchQuery: query,
    resultsFound: validPrices.length,
    avgPrice: Math.round(avg * 100) / 100,
    medianPrice: Math.round(median * 100) / 100,
    minPrice: Math.min(...validPrices),
    maxPrice: Math.max(...validPrices),
    sampleListings: listings,
    confidenceContribution: 20,
  };
}

function emptyResult(query: string): PricingSourceResult {
  return {
    source: 'ygoprodeck',
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
