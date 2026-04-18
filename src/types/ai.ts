import { CollectionType, ConditionSimple } from './card';

export interface CardIdentificationResult {
  card_type: CollectionType;
  card_name: string;
  set_name: string;
  year: number;
  card_number: string;
  edition: string;
  rarity: string;
  language: string;
  identification_confidence: number;
  notes: string;
  // Hockey-specific
  team?: string;
  position?: string;
  is_rookie?: boolean;
  // Magic-specific
  mana_cost?: string;
  card_type_mtg?: string;
  power_toughness?: string;
  // Yu-Gi-Oh-specific
  card_type_ygo?: string;
  attribute?: string;
  level_rank?: number;
  atk_def?: string;
}

export interface ConditionGradingResult {
  psa_estimate: number;
  simple_grade: ConditionSimple;
  centering_score: number;
  corners_score: number;
  edges_score: number;
  surface_score: number;
  condition_notes: string;
  grading_confidence: number;
}

export type RecommendationType = 'sell_now' | 'hold' | 'buy_more' | 'watch';
export type PriceTrend = 'rising' | 'stable' | 'declining';
export type DemandLevel = 'high' | 'medium' | 'low';
export type RarityAssessment = 'very_rare' | 'rare' | 'uncommon' | 'common';

export interface RecommendationResult {
  recommendation: RecommendationType;
  reasoning: string;
  price_trend: PriceTrend;
  demand_level: DemandLevel;
  rarity_assessment: RarityAssessment;
  suggested_sell_price_usd: number;
  best_platform_to_sell: 'ebay' | 'tcgplayer' | 'cardmarket' | 'local_shop' | 'facebook_groups';
}
