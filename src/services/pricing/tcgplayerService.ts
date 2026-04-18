import { API_CONFIG } from '../../config/api';
import { PricingSourceResult } from '../../types/pricing';
import { SoldListing } from '../../types/card';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

function generateMockTcgResult(
  cardName: string,
  setName?: string,
  edition?: string,
): PricingSourceResult {
  const basePrice = 3 + Math.random() * 80;
  const low = Math.round(basePrice * 0.7 * 100) / 100;
  const mid = Math.round(basePrice * 100) / 100;
  const high = Math.round(basePrice * 1.4 * 100) / 100;
  const market = Math.round(basePrice * 0.95 * 100) / 100;

  const queryParts = [cardName];
  if (setName) queryParts.push(setName);
  if (edition) queryParts.push(edition);
  const searchQuery = queryParts.join(' ');

  const listings: SoldListing[] = [
    {
      title: `${cardName} - Market Price`,
      price: market,
      date: new Date().toISOString(),
      url: `https://www.tcgplayer.com/product/search?q=${encodeURIComponent(searchQuery)}`,
      condition: 'Near Mint',
    },
    {
      title: `${cardName} - Low`,
      price: low,
      date: new Date().toISOString(),
      url: `https://www.tcgplayer.com/product/search?q=${encodeURIComponent(searchQuery)}`,
      condition: 'Near Mint',
    },
    {
      title: `${cardName} - Mid`,
      price: mid,
      date: new Date().toISOString(),
      url: `https://www.tcgplayer.com/product/search?q=${encodeURIComponent(searchQuery)}`,
      condition: 'Near Mint',
    },
    {
      title: `${cardName} - High`,
      price: high,
      date: new Date().toISOString(),
      url: `https://www.tcgplayer.com/product/search?q=${encodeURIComponent(searchQuery)}`,
      condition: 'Near Mint',
    },
  ];

  return {
    source: 'tcgplayer',
    searchQuery,
    resultsFound: 4,
    avgPrice: mid,
    medianPrice: market,
    minPrice: low,
    maxPrice: high,
    sampleListings: listings,
    confidenceContribution: 15,
  };
}

// ---------------------------------------------------------------------------
// Real TCGPlayer API implementation
// ---------------------------------------------------------------------------

async function searchTcgPlayerReal(
  cardName: string,
  setName?: string,
  edition?: string,
): Promise<PricingSourceResult> {
  const queryParts = [cardName];
  if (setName) queryParts.push(setName);
  if (edition) queryParts.push(edition);
  const searchQuery = queryParts.join(' ');

  // Step 1: Search for the product
  const searchUrl = `${API_CONFIG.tcgplayer.baseUrl}/catalog/products?productName=${encodeURIComponent(cardName)}${setName ? `&groupName=${encodeURIComponent(setName)}` : ''}`;

  const searchRes = await fetch(searchUrl, {
    headers: {
      Authorization: `Bearer ${API_CONFIG.tcgplayer.apiKey}`,
      Accept: 'application/json',
    },
  });

  if (!searchRes.ok) {
    return {
      source: 'tcgplayer',
      searchQuery,
      resultsFound: 0,
      avgPrice: null,
      medianPrice: null,
      minPrice: null,
      maxPrice: null,
      sampleListings: [],
      confidenceContribution: 0,
      error: `TCGPlayer API error: ${searchRes.status} ${searchRes.statusText}`,
    };
  }

  const searchData = await searchRes.json();
  const products = searchData.results ?? [];

  if (products.length === 0) {
    return {
      source: 'tcgplayer',
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

  // Step 2: Get pricing for the first matching product
  const productId = products[0].productId;
  const priceUrl = `${API_CONFIG.tcgplayer.baseUrl}/pricing/product/${productId}`;

  const priceRes = await fetch(priceUrl, {
    headers: {
      Authorization: `Bearer ${API_CONFIG.tcgplayer.apiKey}`,
      Accept: 'application/json',
    },
  });

  if (!priceRes.ok) {
    return {
      source: 'tcgplayer',
      searchQuery,
      resultsFound: 0,
      avgPrice: null,
      medianPrice: null,
      minPrice: null,
      maxPrice: null,
      sampleListings: [],
      confidenceContribution: 0,
      error: `TCGPlayer pricing error: ${priceRes.status} ${priceRes.statusText}`,
    };
  }

  const priceData = await priceRes.json();
  const prices = priceData.results ?? [];

  if (prices.length === 0) {
    return {
      source: 'tcgplayer',
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

  // Use the first price point (usually Normal, Near Mint)
  const p = prices[0];
  const market = p.marketPrice ?? null;
  const low = p.lowPrice ?? null;
  const mid = p.midPrice ?? null;
  const high = p.highPrice ?? null;

  const productUrl = `https://www.tcgplayer.com/product/${productId}`;

  const listings: SoldListing[] = [];
  if (market != null) {
    listings.push({
      title: `${cardName} - Market Price`,
      price: market,
      date: new Date().toISOString(),
      url: productUrl,
      condition: 'Near Mint',
    });
  }
  if (low != null) {
    listings.push({
      title: `${cardName} - Low`,
      price: low,
      date: new Date().toISOString(),
      url: productUrl,
      condition: 'Near Mint',
    });
  }
  if (mid != null) {
    listings.push({
      title: `${cardName} - Mid`,
      price: mid,
      date: new Date().toISOString(),
      url: productUrl,
      condition: 'Near Mint',
    });
  }
  if (high != null) {
    listings.push({
      title: `${cardName} - High`,
      price: high,
      date: new Date().toISOString(),
      url: productUrl,
      condition: 'Near Mint',
    });
  }

  return {
    source: 'tcgplayer',
    searchQuery,
    resultsFound: listings.length,
    avgPrice: mid,
    medianPrice: market,
    minPrice: low,
    maxPrice: high,
    sampleListings: listings,
    confidenceContribution: listings.length > 0 ? 15 : 0,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function searchTcgPlayer(
  cardName: string,
  setName?: string,
  edition?: string,
): Promise<PricingSourceResult> {
  if (API_CONFIG.useMocks) {
    await new Promise((r) => setTimeout(r, 200 + Math.random() * 300));
    return generateMockTcgResult(cardName, setName, edition);
  }

  return searchTcgPlayerReal(cardName, setName, edition);
}
