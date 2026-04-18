/**
 * Tests for the AI recommendation service in mock mode.
 */
import { getRecommendation } from '../services/ai/recommendationService';

jest.setTimeout(60000);

const SAMPLE_INPUT = {
  card_name: 'Connor McDavid',
  set_name: 'Upper Deck Young Guns',
  year: 2015,
  edition: 'Base',
  psa_estimate: 9,
  condition_simple: 'Mint',
  estimated_value_usd: 500,
  value_confidence_pct: 85,
};

describe('getRecommendation (mock mode)', () => {
  it('returns a valid RecommendationResult', async () => {
    const result = await getRecommendation(SAMPLE_INPUT);

    expect(result).toBeDefined();
    expect(result.recommendation).toMatch(/^(sell_now|hold|buy_more|watch)$/);
    expect(result.reasoning).toBeTruthy();
    expect(result.reasoning.length).toBeGreaterThan(50);
    expect(result.price_trend).toMatch(/^(rising|declining|stable)$/);
    expect(result.demand_level).toMatch(/^(high|medium|low)$/);
  });

  it('includes a suggested sell price', async () => {
    const result = await getRecommendation(SAMPLE_INPUT);
    expect(result.suggested_sell_price_usd).toBeGreaterThan(0);
  });

  it('includes a best platform', async () => {
    const result = await getRecommendation(SAMPLE_INPUT);
    expect(result.best_platform_to_sell).toBeTruthy();
  });

  it('returns varied recommendations across calls', async () => {
    const recs = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const result = await getRecommendation(SAMPLE_INPUT);
      recs.add(result.recommendation);
    }
    // With 7 mock options and 20 calls, we should see variety
    expect(recs.size).toBeGreaterThan(1);
  });
});
