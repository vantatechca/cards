import { CollectionType, ConditionSimple, Recommendation } from '../types/card';

export const COLLECTION_LABELS: Record<CollectionType, string> = {
  hockey: 'Hockey',
  magic: 'Magic: The Gathering',
  yugioh: 'Yu-Gi-Oh!',
};

export const CONDITION_LABELS: Record<ConditionSimple, string> = {
  Mint: 'Mint (PSA 10)',
  'Near Mint': 'Near Mint (PSA 8-9)',
  Excellent: 'Excellent (PSA 6-7)',
  Good: 'Good (PSA 4-5)',
  Fair: 'Fair (PSA 2-3)',
  Poor: 'Poor (PSA 1)',
};

export const RECOMMENDATION_CONFIG: Record<Recommendation, { label: string; color: string; bg: string }> = {
  sell_now: { label: 'Sell Now', color: '#dc2626', bg: '#fef2f2' },
  hold: { label: 'Hold', color: '#2563eb', bg: '#eff6ff' },
  buy_more: { label: 'Buy More', color: '#16a34a', bg: '#f0fdf4' },
  watch: { label: 'Watch', color: '#ca8a04', bg: '#fefce8' },
};

export const SORT_OPTIONS = [
  { key: 'value_desc', label: 'Value (High-Low)' },
  { key: 'value_asc', label: 'Value (Low-High)' },
  { key: 'date_desc', label: 'Date Added (Newest)' },
  { key: 'date_asc', label: 'Date Added (Oldest)' },
  { key: 'name_asc', label: 'Name (A-Z)' },
  { key: 'confidence_desc', label: 'Confidence (High-Low)' },
  { key: 'psa_desc', label: 'PSA Estimate (High-Low)' },
  { key: 'recommendation', label: 'Recommendation (Sell First)' },
] as const;

export type SortKey = (typeof SORT_OPTIONS)[number]['key'];

export const USD_TO_CAD_RATE = 1.36; // Update via currency service
export const IMAGE_MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
export const THUMBNAIL_WIDTH = 200;
export const THUMBNAIL_HEIGHT = 280;
export const PRICE_CACHE_HOURS = 24;
