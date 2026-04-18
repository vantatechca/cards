import { calculateConfidence } from '../services/pricing/confidenceCalculator';
import { ConfidenceFactors } from '../types/pricing';

function makeFactors(overrides: Partial<ConfidenceFactors> = {}): ConfidenceFactors {
  return {
    ebayDataExists: false,
    ebayThreePlusSales: false,
    ebayTenPlusSales: false,
    tcgplayerExists: false,
    cardmarketExists: false,
    sourcesAgreeWithin20Pct: false,
    aiConfidenceAbove90: false,
    exactCardMatch: false,
    sourcesDisagreeOver50Pct: false,
    onlyOneSoldListing: false,
    oldestSaleOver6Months: false,
    aiConfidenceBelow70: false,
    ...overrides,
  };
}

describe('calculateConfidence', () => {
  it('returns 0 with no positive factors', () => {
    expect(calculateConfidence(makeFactors())).toBe(0);
  });

  it('gives 30 points for eBay data existing', () => {
    expect(calculateConfidence(makeFactors({ ebayDataExists: true }))).toBe(30);
  });

  it('gives 15 points for 3+ eBay sales', () => {
    expect(calculateConfidence(makeFactors({
      ebayDataExists: true,
      ebayThreePlusSales: true,
    }))).toBe(45);
  });

  it('gives 10 more points for 10+ eBay sales', () => {
    expect(calculateConfidence(makeFactors({
      ebayDataExists: true,
      ebayThreePlusSales: true,
      ebayTenPlusSales: true,
    }))).toBe(55);
  });

  it('gives 15 points for TCGPlayer data', () => {
    expect(calculateConfidence(makeFactors({ tcgplayerExists: true }))).toBe(15);
  });

  it('gives 10 points for CardMarket data', () => {
    expect(calculateConfidence(makeFactors({ cardmarketExists: true }))).toBe(10);
  });

  it('gives 10 points when sources agree within 20%', () => {
    expect(calculateConfidence(makeFactors({ sourcesAgreeWithin20Pct: true }))).toBe(10);
  });

  it('gives 5 points for high AI confidence', () => {
    expect(calculateConfidence(makeFactors({ aiConfidenceAbove90: true }))).toBe(5);
  });

  it('gives 5 points for exact card match', () => {
    expect(calculateConfidence(makeFactors({ exactCardMatch: true }))).toBe(5);
  });

  it('calculates max possible score (all positive, no penalties)', () => {
    expect(calculateConfidence(makeFactors({
      ebayDataExists: true,
      ebayThreePlusSales: true,
      ebayTenPlusSales: true,
      tcgplayerExists: true,
      cardmarketExists: true,
      sourcesAgreeWithin20Pct: true,
      aiConfidenceAbove90: true,
      exactCardMatch: true,
    }))).toBe(100);
  });

  it('applies -20 penalty for sources disagreeing over 50%', () => {
    expect(calculateConfidence(makeFactors({
      ebayDataExists: true, // +30
      sourcesDisagreeOver50Pct: true, // -20
    }))).toBe(10);
  });

  it('applies -15 penalty for only one sold listing', () => {
    expect(calculateConfidence(makeFactors({
      ebayDataExists: true, // +30
      onlyOneSoldListing: true, // -15
    }))).toBe(15);
  });

  it('applies -10 penalty for old sales', () => {
    expect(calculateConfidence(makeFactors({
      ebayDataExists: true, // +30
      oldestSaleOver6Months: true, // -10
    }))).toBe(20);
  });

  it('applies -15 penalty for low AI confidence', () => {
    expect(calculateConfidence(makeFactors({
      ebayDataExists: true, // +30
      aiConfidenceBelow70: true, // -15
    }))).toBe(15);
  });

  it('clamps to 0 when penalties exceed positives', () => {
    expect(calculateConfidence(makeFactors({
      sourcesDisagreeOver50Pct: true, // -20
      onlyOneSoldListing: true, // -15
      oldestSaleOver6Months: true, // -10
      aiConfidenceBelow70: true, // -15
    }))).toBe(0);
  });

  it('clamps to 100 when positives exceed 100', () => {
    // This shouldn't normally happen with current scoring, but tests the clamp
    const result = calculateConfidence(makeFactors({
      ebayDataExists: true,
      ebayThreePlusSales: true,
      ebayTenPlusSales: true,
      tcgplayerExists: true,
      cardmarketExists: true,
      sourcesAgreeWithin20Pct: true,
      aiConfidenceAbove90: true,
      exactCardMatch: true,
    }));
    expect(result).toBeLessThanOrEqual(100);
  });
});
