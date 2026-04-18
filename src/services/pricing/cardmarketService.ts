import { API_CONFIG } from '../../config/api';
import { PricingSourceResult } from '../../types/pricing';
import { SoldListing } from '../../types/card';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Approximate EUR -> USD conversion used by mock data. */
const EUR_TO_USD = 1.09;

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

function generateMockCardMarketResult(
  cardName: string,
  setName?: string,
): PricingSourceResult {
  const queryParts = [cardName];
  if (setName) queryParts.push(setName);
  const searchQuery = queryParts.join(' ');

  const basePriceEur = 2 + Math.random() * 70;
  const trendEur = Math.round(basePriceEur * 100) / 100;
  const avg30Eur = Math.round(basePriceEur * 1.05 * 100) / 100;
  const lowEur = Math.round(basePriceEur * 0.65 * 100) / 100;

  // Convert to USD
  const trend = Math.round(trendEur * EUR_TO_USD * 100) / 100;
  const avg30 = Math.round(avg30Eur * EUR_TO_USD * 100) / 100;
  const low = Math.round(lowEur * EUR_TO_USD * 100) / 100;

  const baseUrl = `https://www.cardmarket.com/en/search?searchString=${encodeURIComponent(searchQuery)}`;

  const listings: SoldListing[] = [
    {
      title: `${cardName} - Trend Price`,
      price: trend,
      date: new Date().toISOString(),
      url: baseUrl,
      condition: 'Near Mint',
    },
    {
      title: `${cardName} - 30-Day Average`,
      price: avg30,
      date: new Date().toISOString(),
      url: baseUrl,
      condition: 'Near Mint',
    },
    {
      title: `${cardName} - Low Price`,
      price: low,
      date: new Date().toISOString(),
      url: baseUrl,
      condition: 'Near Mint',
    },
  ];

  return {
    source: 'cardmarket',
    searchQuery,
    resultsFound: 3,
    avgPrice: avg30,
    medianPrice: trend,
    minPrice: low,
    maxPrice: avg30,
    sampleListings: listings,
    confidenceContribution: 10,
  };
}

// ---------------------------------------------------------------------------
// Real Cardmarket API implementation
// ---------------------------------------------------------------------------

async function searchCardMarketReal(
  cardName: string,
  setName?: string,
): Promise<PricingSourceResult> {
  const queryParts = [cardName];
  if (setName) queryParts.push(setName);
  const searchQuery = queryParts.join(' ');

  // Cardmarket uses OAuth 1.0a; we send a simplified request here.
  const encodedName = encodeURIComponent(cardName);
  const searchUrl = `${API_CONFIG.cardmarket.baseUrl}/products/find?search=${encodedName}${setName ? `&idExpansion=${encodeURIComponent(setName)}` : ''}`;

  const res = await fetch(searchUrl, {
    headers: {
      Authorization: `Bearer ${API_CONFIG.cardmarket.appToken}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    return {
      source: 'cardmarket',
      searchQuery,
      resultsFound: 0,
      avgPrice: null,
      medianPrice: null,
      minPrice: null,
      maxPrice: null,
      sampleListings: [],
      confidenceContribution: 0,
      error: `Cardmarket API error: ${res.status} ${res.statusText}`,
    };
  }

  const data = await res.json();
  const products = data.product ? [data.product] : data.products ?? [];

  if (products.length === 0) {
    return {
      source: 'cardmarket',
      searchQuery,
      resultsFound: 0,
      avgPrice: null,
      medianPrice: null,
      minPrice: null,
      maxPrice: null,
      sampleListings: [],
      confidenceContribution: 0,
    };
  }

  const product = products[0];
  const priceGuide = product.priceGuide ?? {};

  // Cardmarket prices are in EUR; convert to USD
  const trendEur: number | null = priceGuide.TREND ?? null;
  const avg30Eur: number | null = priceGuide.AVG30 ?? null;
  const lowEur: number | null = priceGuide.LOW ?? null;

  const trend = trendEur != null ? Math.round(trendEur * EUR_TO_USD * 100) / 100 : null;
  const avg30 = avg30Eur != null ? Math.round(avg30Eur * EUR_TO_USD * 100) / 100 : null;
  const low = lowEur != null ? Math.round(lowEur * EUR_TO_USD * 100) / 100 : null;

  const productUrl = `https://www.cardmarket.com/en/Products/${product.idProduct}`;

  const listings: SoldListing[] = [];
  if (trend != null) {
    listings.push({
      title: `${cardName} - Trend Price`,
      price: trend,
      date: new Date().toISOString(),
      url: productUrl,
      condition: 'Near Mint',
    });
  }
  if (avg30 != null) {
    listings.push({
      title: `${cardName} - 30-Day Average`,
      price: avg30,
      date: new Date().toISOString(),
      url: productUrl,
      condition: 'Near Mint',
    });
  }
  if (low != null) {
    listings.push({
      title: `${cardName} - Low Price`,
      price: low,
      date: new Date().toISOString(),
      url: productUrl,
      condition: 'Near Mint',
    });
  }

  return {
    source: 'cardmarket',
    searchQuery,
    resultsFound: listings.length,
    avgPrice: avg30,
    medianPrice: trend,
    minPrice: low,
    maxPrice: avg30 ?? trend,
    sampleListings: listings,
    confidenceContribution: listings.length > 0 ? 10 : 0,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function searchCardMarket(
  cardName: string,
  setName?: string,
): Promise<PricingSourceResult> {
  if (API_CONFIG.useMocks) {
    await new Promise((r) => setTimeout(r, 250 + Math.random() * 350));
    return generateMockCardMarketResult(cardName, setName);
  }

  return searchCardMarketReal(cardName, setName);
}
