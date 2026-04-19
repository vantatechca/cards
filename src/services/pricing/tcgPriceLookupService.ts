import { API_CONFIG } from '../../config/api';
import { PricingSourceResult } from '../../types/pricing';

const MOCK_RESULT: PricingSourceResult = {
  source: 'tcgplayer',
  searchQuery: 'mock',
  resultsFound: 2,
  avgPrice: 18.0,
  medianPrice: 18.0,
  minPrice: 12.0,
  maxPrice: 24.0,
  sampleListings: [
    { title: 'TCG Price Lookup Market Price', price: 18.0, url: 'https://tcgpricelookup.com', date: new Date().toISOString() },
  ],
  confidenceContribution: 20,
};

export async function searchTcgPriceLookup(
  cardName: string,
  game: 'magic' | 'yugioh',
): Promise<PricingSourceResult> {
  if (API_CONFIG.useMocks) return MOCK_RESULT;

  // Disabled until correct endpoint is confirmed
  return emptyResult(cardName);

  try {
    const params = new URLSearchParams({ name: cardName, game });
    const res = await fetch(`${API_CONFIG.apiBaseUrl}/api/tcgpricelookup/search?${params}`);
    if (!res.ok) return emptyResult(cardName);

    const data = await res.json();
    const cards = data?.data ?? data?.results ?? data?.cards;
    if (!cards || cards.length === 0) return emptyResult(cardName);

    const card = cards[0];
    const price = parseFloat(card.market_price ?? card.price ?? card.value ?? '0') || 0;
    if (price === 0) return emptyResult(cardName);

    return {
      source: 'tcgplayer',
      searchQuery: cardName,
      resultsFound: cards.length,
      avgPrice: price,
      medianPrice: price,
      minPrice: parseFloat(card.low_price ?? card.min_price ?? String(price)) || price,
      maxPrice: parseFloat(card.high_price ?? card.max_price ?? String(price)) || price,
      sampleListings: [
        {
          title: `${card.name ?? cardName} — TCG Price Lookup`,
          price,
          url: 'https://tcgpricelookup.com',
          date: new Date().toISOString(),
        },
      ],
      confidenceContribution: 20,
    };
  } catch {
    return emptyResult(cardName);
  }
}

function emptyResult(query: string): PricingSourceResult {
  return {
    source: 'tcgplayer',
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
