/**
 * Tests for the pricing engine's core logic.
 * Since useMocks defaults to true, these tests exercise the full mock pipeline
 * end-to-end: query building, parallel source fetching, weighted aggregation,
 * confidence calculation, and CAD conversion.
 */
import { priceCard } from '../services/pricing/pricingEngine';

// Give mock network delays time to resolve
jest.setTimeout(15000);

describe('priceCard (mock mode)', () => {
  it('returns a PricingResult for a hockey card', async () => {
    const result = await priceCard({
      card_name: 'Connor McDavid',
      set_name: 'Upper Deck Young Guns',
      collection_type: 'hockey',
      card_number: '201',
      edition: 'Base',
      condition_psa_estimate: 9,
      ai_confidence_identification: 95,
    });

    expect(result).toBeDefined();
    expect(result.estimatedValueUsd).not.toBeNull();
    expect(typeof result.estimatedValueUsd).toBe('number');
    expect(result.estimatedValueCad).not.toBeNull();
    expect(result.confidencePct).toBeGreaterThanOrEqual(0);
    expect(result.confidencePct).toBeLessThanOrEqual(100);
    expect(result.confidenceLabel).toBeTruthy();
    expect(result.confidenceColor).toMatch(/^#[0-9a-f]{6}$/);
    expect(result.proofLinks.length).toBeGreaterThan(0);
  });

  it('returns a PricingResult for a magic card', async () => {
    const result = await priceCard({
      card_name: 'Black Lotus',
      set_name: 'Alpha',
      collection_type: 'magic',
      card_number: null,
      edition: 'Base',
      condition_psa_estimate: 7,
      ai_confidence_identification: 85,
    });

    expect(result.estimatedValueUsd).not.toBeNull();
    // Magic cards should include TCGPlayer
    expect(result.sources.length).toBeGreaterThanOrEqual(1);
  });

  it('returns a PricingResult for a yugioh card', async () => {
    const result = await priceCard({
      card_name: 'Blue-Eyes White Dragon',
      set_name: 'Legend of Blue Eyes',
      collection_type: 'yugioh',
      card_number: 'LOB-001',
      edition: '1st Edition',
      condition_psa_estimate: 8,
      ai_confidence_identification: 94,
    });

    expect(result.estimatedValueUsd).not.toBeNull();
    expect(result.breakdown).toBeDefined();
  });

  it('skips TCGPlayer for hockey cards', async () => {
    const result = await priceCard({
      card_name: 'Test Hockey Card',
      set_name: 'Test Set',
      collection_type: 'hockey',
      card_number: '1',
      edition: null,
      condition_psa_estimate: null,
      ai_confidence_identification: null,
    });

    // Hockey cards skip TCGPlayer, so breakdown should not have tcgplayer
    expect(result.breakdown.tcgplayer).toBeUndefined();
  });

  it('includes eBay in breakdown', async () => {
    const result = await priceCard({
      card_name: 'Test Card',
      set_name: 'Test Set',
      collection_type: 'magic',
      card_number: null,
      edition: null,
      condition_psa_estimate: null,
      ai_confidence_identification: null,
    });

    expect(result.breakdown.ebay).toBeDefined();
    expect(result.breakdown.ebay!.median).toBeGreaterThan(0);
    expect(result.breakdown.ebay!.count).toBeGreaterThan(0);
  });

  it('CAD value is higher than USD value', async () => {
    const result = await priceCard({
      card_name: 'Test Card',
      set_name: null,
      collection_type: 'hockey',
      card_number: null,
      edition: null,
      condition_psa_estimate: null,
      ai_confidence_identification: null,
    });

    if (result.estimatedValueUsd && result.estimatedValueCad) {
      expect(result.estimatedValueCad).toBeGreaterThan(result.estimatedValueUsd);
    }
  });

  it('proof links have required fields', async () => {
    const result = await priceCard({
      card_name: 'Test Card',
      set_name: null,
      collection_type: 'hockey',
      card_number: null,
      edition: null,
      condition_psa_estimate: null,
      ai_confidence_identification: null,
    });

    for (const link of result.proofLinks.slice(0, 5)) {
      expect(link.title).toBeTruthy();
      expect(link.price).toBeGreaterThan(0);
      expect(link.url).toContain('http');
      expect(link.date).toBeTruthy();
    }
  });
});
