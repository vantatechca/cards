/**
 * Tests for the AI grading service in mock mode.
 */
import { gradeCard } from '../services/ai/gradingService';

jest.setTimeout(60000);

describe('gradeCard (mock mode)', () => {
  it('returns a valid ConditionGradingResult', async () => {
    const result = await gradeCard('file:///test/front.jpg');

    expect(result).toBeDefined();
    expect(result.psa_estimate).toBeGreaterThanOrEqual(1);
    expect(result.psa_estimate).toBeLessThanOrEqual(10);
    expect(result.simple_grade).toMatch(/^(Mint|Near Mint|Excellent|Good|Fair|Poor)$/);
    expect(result.centering_score).toBeGreaterThanOrEqual(1);
    expect(result.centering_score).toBeLessThanOrEqual(10);
    expect(result.corners_score).toBeGreaterThanOrEqual(1);
    expect(result.corners_score).toBeLessThanOrEqual(10);
    expect(result.edges_score).toBeGreaterThanOrEqual(1);
    expect(result.edges_score).toBeLessThanOrEqual(10);
    expect(result.surface_score).toBeGreaterThanOrEqual(1);
    expect(result.surface_score).toBeLessThanOrEqual(10);
    expect(result.condition_notes).toBeTruthy();
    expect(result.grading_confidence).toBeGreaterThan(0);
    expect(result.grading_confidence).toBeLessThanOrEqual(1);
  });

  it('works with optional back image URI', async () => {
    const result = await gradeCard('file:///test/front.jpg', 'file:///test/back.jpg');
    expect(result.psa_estimate).toBeDefined();
  });

  it('returns varied results across calls', async () => {
    const scores = new Set<number>();
    for (let i = 0; i < 15; i++) {
      const result = await gradeCard('file:///test/front.jpg');
      scores.add(result.psa_estimate);
    }
    expect(scores.size).toBeGreaterThan(1);
  });
});
