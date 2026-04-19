export type CollectionType = 'hockey' | 'magic' | 'yugioh';

export type ConditionSimple = 'Mint' | 'Near Mint' | 'Excellent' | 'Good' | 'Fair' | 'Poor';

export type Recommendation = 'sell_now' | 'hold' | 'buy_more' | 'watch';

export type PriceSource = 'ebay_sold' | 'tcgplayer' | 'cardmarket' | 'scrape' | 'manual' | 'scryfall' | 'ygoprodeck';

export interface SoldListing {
  title: string;
  price: number;
  date: string;
  url: string;
  condition?: string;
  seller?: string;
}

export interface ValueSourceBreakdown {
  ebay?: {
    median: number;
    avg: number;
    count: number;
    lastChecked: string;
  };
  tcgplayer?: {
    market: number;
    low: number;
    mid: number;
    high: number;
    lastChecked: string;
  };
  cardmarket?: {
    trend: number;
    avg30: number;
    availableFrom: number;
    lastChecked: string;
  };
}

export interface Card {
  id: string;
  collection_type: CollectionType;
  card_name: string;
  set_name: string | null;
  year: number | null;
  card_number: string | null;
  edition: string | null;
  rarity: string | null;
  language: string;
  photo_url_front: string;
  photo_url_back: string | null;
  ai_identification_raw: Record<string, unknown> | null;
  ai_confidence_identification: number | null;
  condition_psa_estimate: number | null;
  condition_simple: ConditionSimple | null;
  condition_notes: string | null;
  is_graded: boolean;
  grading_company: string | null;
  graded_score: number | null;
  grading_cert_number: string | null;
  estimated_value_usd: number | null;
  estimated_value_cad: number | null;
  value_confidence_pct: number | null;
  value_source_breakdown: ValueSourceBreakdown | null;
  proof_links: SoldListing[] | null;
  last_valued_at: string | null;
  ai_recommendation: Recommendation | null;
  ai_recommendation_reasoning: string | null;
  tags: string[];
  notes: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
}

export interface PriceCheck {
  id: string;
  card_id: string;
  checked_at: string;
  source: PriceSource;
  search_query_used: string;
  results_found: number;
  avg_sold_price_usd: number | null;
  median_sold_price_usd: number | null;
  min_sold_price_usd: number | null;
  max_sold_price_usd: number | null;
  sample_listings: SoldListing[];
  raw_response: Record<string, unknown> | null;
  confidence_contribution: number;
}

export interface CollectionSnapshot {
  id: string;
  snapshot_date: string;
  collection_type: CollectionType | null;
  total_cards: number;
  total_estimated_value_usd: number;
  total_estimated_value_cad: number;
  avg_confidence_pct: number;
  top_10_cards: Array<{ id: string; name: string; value: number }>;
  created_at: string;
}

export interface CollectionSummary {
  type: CollectionType | 'all';
  totalCards: number;
  totalValueUsd: number;
  totalValueCad: number;
  avgConfidence: number;
  mostValuableCard: Card | null;
  recommendationBreakdown: Record<Recommendation, number>;
}
