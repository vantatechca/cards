/**
 * Tests for the AI identification service in mock mode.
 * Verifies the mock returns realistic card data across all three collection types.
 */
import { identifyCard } from '../services/ai/identificationService';

jest.setTimeout(60000);

describe('identifyCard (mock mode)', () => {
  it('returns a valid CardIdentificationResult', async () => {
    const result = await identifyCard('file:///test/front.jpg');

    expect(result).toBeDefined();
    expect(result.card_name).toBeTruthy();
    expect(result.set_name).toBeTruthy();
    expect(typeof result.year).toBe('number');
    expect(result.card_type).toMatch(/^(hockey|magic|yugioh)$/);
    expect(result.identification_confidence).toBeGreaterThan(0);
    expect(result.identification_confidence).toBeLessThanOrEqual(1);
  });

  it('returns different cards on multiple calls (randomized)', async () => {
    const results = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const result = await identifyCard('file:///test/front.jpg');
      results.add(result.card_name);
    }
    // With 12 possible cards and 20 calls, we should see more than 1 unique
    expect(results.size).toBeGreaterThan(1);
  });

  it('includes required fields for each card type', async () => {
    // Run multiple times to test various card types
    for (let i = 0; i < 10; i++) {
      const result = await identifyCard('file:///test/front.jpg');

      expect(result.card_name).toBeTruthy();
      expect(result.set_name).toBeTruthy();
      expect(result.year).toBeGreaterThan(1900);
      expect(result.language).toBeTruthy();
      expect(result.rarity).toBeTruthy();
    }
  });
});
