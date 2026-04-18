import { ConfidenceFactors } from '../../types/pricing';

const SCORE_MAP: { key: keyof ConfidenceFactors; points: number }[] = [
  // Positive signals
  { key: 'ebayDataExists', points: 30 },
  { key: 'ebayThreePlusSales', points: 15 },
  { key: 'ebayTenPlusSales', points: 10 },
  { key: 'tcgplayerExists', points: 15 },
  { key: 'cardmarketExists', points: 10 },
  { key: 'sourcesAgreeWithin20Pct', points: 10 },
  { key: 'aiConfidenceAbove90', points: 5 },
  { key: 'exactCardMatch', points: 5 },
  // Penalties
  { key: 'sourcesDisagreeOver50Pct', points: -20 },
  { key: 'onlyOneSoldListing', points: -15 },
  { key: 'oldestSaleOver6Months', points: -10 },
  { key: 'aiConfidenceBelow70', points: -15 },
];

export function calculateConfidence(factors: ConfidenceFactors): number {
  let score = 0;

  for (const { key, points } of SCORE_MAP) {
    if (factors[key]) {
      score += points;
    }
  }

  return Math.max(0, Math.min(100, score));
}
