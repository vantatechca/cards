import { API_CONFIG } from '../../config/api';
import { PricingSourceResult } from '../../types/pricing';

const MOCK_RESULT: PricingSourceResult = {
  source: 'tcgplayer',
  searchQuery: 'mock',
  resultsFound: 3,
  avgPrice: 15.0,
  medianPrice: 15.0,
  minPrice: 10.0,
  maxPrice: 20.0,
  sampleListings: [
    { title: 'TCG API Market Price', price: 15.0, url: 'https://tcgapi.dev', date: new Date().toISOString() },
  ],
  confidenceContribution: 25,
};

export async function searchTcgApi(
  cardName: string,
  game: 'magic' | 'yugioh',
  setName?: string | null,
): Promise<PricingSourceResult> {
  if (API_CONFIG.useMocks) return MOCK_RESULT;

  try {
    const params = new URLSearchParams({
      q: cardName,
      game,
      per_page: '3',
      sort: 'relevance',
    });
    if (setName) params.set('set_name', setName);

    const res = await fetch(`${API_CONFIG.apiBaseUrl}/api/tcgapi/search?${params}`);
    if (!res.ok) return emptyResult(cardName);

    const data = await res.json();
    const cards = data?.data;
    if (!cards || cards.length === 0) return emptyResult(cardName);

    const card = cards[0];
    const prices = card.prices?.normal ?? card.prices?.foil;
    if (!prices) return emptyResult(cardName);

    const market = prices.market_price ?? 0;
    const low = prices.low_price ?? market;
    const median = prices.median_price ?? market;

    if (market === 0) return emptyResult(cardName);

    return {
      source: 'tcgplayer',
      searchQuery: cardName,
      resultsFound: prices.total_listings ?? 1,
      avgPrice: market,
      medianPrice: median,
      minPrice: low,
      maxPrice: market,
      sampleListings: [
        {
          title: `${card.name} (${card.set_name}) — TCG API`,
          price: market,
          url: `https://tcgapi.dev`,
          date: prices.price_updated_at ?? new Date().toISOString(),
        },
      ],
      confidenceContribution: 25,
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
