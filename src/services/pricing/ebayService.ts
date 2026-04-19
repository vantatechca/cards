import { API_CONFIG } from '../../config/api';
import { PricingSourceResult } from '../../types/pricing';
import { SoldListing } from '../../types/card';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function randomDate(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_TITLES = [
  '{query} - Great Condition',
  '{query} NM/M Card',
  '{query} Trading Card Lot',
  '{query} - Pack Fresh',
  '{query} PSA Ready',
  '{query} Single Card',
  '{query} - Excellent',
  '{query} Near Mint',
  '{query} Rare Card',
  '{query} - Nice Centering',
  '{query} Card NM+',
  '{query} Collectible TCG',
  '{query} Game Card',
  '{query} - Sharp Corners',
  '{query} PSA 9 Candidate',
];

const MOCK_CONDITIONS = [
  'Brand New',
  'Like New',
  'Very Good',
  'Good',
  'Acceptable',
];

function generateMockListings(
  query: string,
  condition?: string,
): SoldListing[] {
  const count = Math.floor(Math.random() * 11) + 5; // 5-15
  const basePrice = 5 + Math.random() * 95; // $5 - $100 range

  return Array.from({ length: count }, (_, i) => {
    const title = MOCK_TITLES[i % MOCK_TITLES.length].replace('{query}', query);
    const priceMultiplier = 0.6 + Math.random() * 0.8; // 60%-140% of base
    const price = Math.round(basePrice * priceMultiplier * 100) / 100;

    return {
      title,
      price,
      date: randomDate(90),
      url: `https://www.ebay.com/itm/${100000000000 + Math.floor(Math.random() * 900000000000)}`,
      condition: condition || MOCK_CONDITIONS[Math.floor(Math.random() * MOCK_CONDITIONS.length)],
      seller: `seller_${Math.random().toString(36).substring(2, 8)}`,
    };
  });
}

// ---------------------------------------------------------------------------
// Real eBay Browse API implementation
// ---------------------------------------------------------------------------

async function searchEbayReal(
  query: string,
  condition?: string,
): Promise<PricingSourceResult> {
  const filterParts: string[] = [
    'buyingOptions:{FIXED_PRICE|AUCTION}',
    'priceCurrency:USD',
  ];

  if (condition) {
    filterParts.push(`conditionIds:{${mapConditionToEbayId(condition)}}`);
  }

  const params = new URLSearchParams({
    q: query,
    filter: filterParts.join(','),
    sort: 'endDate',
    limit: '50',
  });

  const res = await fetch(`${API_CONFIG.apiBaseUrl}/api/ebay/search?${params}`);

  if (!res.ok) {
    return {
      source: 'ebay_sold',
      searchQuery: query,
      resultsFound: 0,
      avgPrice: null,
      medianPrice: null,
      minPrice: null,
      maxPrice: null,
      sampleListings: [],
      confidenceContribution: 0,
      error: `eBay API error: ${res.status} ${res.statusText}`,
    };
  }

  const data = await res.json();
  const items: SoldListing[] = (data.itemSummaries ?? []).map(
    (item: Record<string, unknown>) => ({
      title: item.title as string,
      price: parseFloat((item.price as Record<string, string>)?.value ?? '0'),
      date: (item.itemEndDate as string) ?? new Date().toISOString(),
      url: item.itemWebUrl as string,
      condition: item.condition as string | undefined,
      seller: (item.seller as Record<string, string>)?.username,
    }),
  );

  return buildResult(query, items);
}

function mapConditionToEbayId(condition: string): string {
  const map: Record<string, string> = {
    'Brand New': '1000',
    'Like New': '3000',
    'Very Good': '4000',
    Good: '5000',
    Acceptable: '6000',
  };
  return map[condition] ?? '3000';
}

// ---------------------------------------------------------------------------
// Shared result builder
// ---------------------------------------------------------------------------

function buildResult(query: string, listings: SoldListing[]): PricingSourceResult {
  if (listings.length === 0) {
    return {
      source: 'ebay_sold',
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

  const prices = listings.map((l) => l.price);
  const avg = Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100;
  const med = median(prices);
  const min = Math.min(...prices);
  const max = Math.max(...prices);

  let confidence = 30; // base for data existing
  if (prices.length >= 3) confidence += 15;
  if (prices.length >= 10) confidence += 10;

  return {
    source: 'ebay_sold',
    searchQuery: query,
    resultsFound: listings.length,
    avgPrice: avg,
    medianPrice: med,
    minPrice: min,
    maxPrice: max,
    sampleListings: listings,
    confidenceContribution: confidence,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function searchEbaySold(
  query: string,
  condition?: string,
): Promise<PricingSourceResult> {
  if (API_CONFIG.useMocks) {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));
    const listings = generateMockListings(query, condition);
    return buildResult(query, listings);
  }

  return searchEbayReal(query, condition);
}
