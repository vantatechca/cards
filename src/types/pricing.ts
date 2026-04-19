import { SoldListing, PriceSource } from './card';

export interface PricingSourceResult {
  source: PriceSource;
  searchQuery: string;
  resultsFound: number;
  avgPrice: number | null;
  medianPrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  sampleListings: SoldListing[];
  confidenceContribution: number;
  error?: string;
}

export interface PricingResult {
  estimatedValueUsd: number | null;
  estimatedValueCad: number | null;
  confidencePct: number;
  confidenceLabel: string;
  confidenceColor: string;
  sources: PricingSourceResult[];
  proofLinks: SoldListing[];
  breakdown: {
    ebay?: { median: number; count: number };
    tcgplayer?: { market: number };
    cardmarket?: { trend: number };
    scryfall?: { market: number };
    ygoprodeck?: { market: number };
  };
}

export interface ConfidenceFactors {
  ebayDataExists: boolean;
  ebayThreePlusSales: boolean;
  ebayTenPlusSales: boolean;
  tcgplayerExists: boolean;
  cardmarketExists: boolean;
  sourcesAgreeWithin20Pct: boolean;
  aiConfidenceAbove90: boolean;
  exactCardMatch: boolean;
  sourcesDisagreeOver50Pct: boolean;
  onlyOneSoldListing: boolean;
  oldestSaleOver6Months: boolean;
  aiConfidenceBelow70: boolean;
}

export function getConfidenceLabel(pct: number): string {
  if (pct >= 90) return 'Highly Accurate';
  if (pct >= 70) return 'Reliable Estimate';
  if (pct >= 50) return 'Moderate Confidence';
  if (pct >= 25) return 'Low Confidence';
  return 'Insufficient Data';
}

export function getConfidenceColor(pct: number): string {
  if (pct >= 90) return '#22c55e'; // green
  if (pct >= 70) return '#3b82f6'; // blue
  if (pct >= 50) return '#eab308'; // yellow
  if (pct >= 25) return '#f97316'; // orange
  return '#ef4444'; // red
}
