/**
 * Tests for the price check repository in mock mode.
 * Verifies CRUD operations work with the in-memory mock store.
 */
import { createPriceCheck, getPriceChecksForCard, getLatestPriceCheck } from '../services/supabase/priceCheckRepository';

describe('priceCheckRepository (mock mode)', () => {
  const cardId = 'test-card-001';

  it('creates a price check record', async () => {
    const record = await createPriceCheck({
      card_id: cardId,
      source: 'ebay_sold',
      search_query_used: 'Connor McDavid Young Guns',
      results_found: 12,
      median_sold_price_usd: 450.0,
      avg_sold_price_usd: 475.0,
      min_sold_price_usd: 350.0,
      max_sold_price_usd: 625.0,
      sample_listings: [],
      raw_response: null,
      confidence_contribution: 55,
    });

    expect(record.id).toBeTruthy();
    expect(record.card_id).toBe(cardId);
    expect(record.source).toBe('ebay_sold');
    expect(record.results_found).toBe(12);
    expect(record.median_sold_price_usd).toBe(450.0);
    expect(record.checked_at).toBeTruthy();
  });

  it('retrieves price checks for a card', async () => {
    // Create a second record
    await createPriceCheck({
      card_id: cardId,
      source: 'tcgplayer',
      search_query_used: 'Connor McDavid',
      results_found: 5,
      median_sold_price_usd: 420.0,
      sample_listings: [],
      confidence_contribution: 15,
    });

    const checks = await getPriceChecksForCard(cardId);
    expect(checks.length).toBeGreaterThanOrEqual(2);
    expect(checks.every((c) => c.card_id === cardId)).toBe(true);
  });

  it('returns empty array for unknown card', async () => {
    const checks = await getPriceChecksForCard('nonexistent-card');
    expect(checks).toEqual([]);
  });

  it('retrieves the latest price check by source', async () => {
    const latest = await getLatestPriceCheck(cardId, 'ebay_sold');
    expect(latest).not.toBeNull();
    expect(latest!.source).toBe('ebay_sold');
  });

  it('returns null for unknown source', async () => {
    const latest = await getLatestPriceCheck(cardId, 'manual');
    expect(latest).toBeNull();
  });

  it('creates records with default values for omitted fields', async () => {
    const record = await createPriceCheck({
      card_id: 'minimal-card',
    });

    expect(record.source).toBe('ebay_sold');
    expect(record.results_found).toBe(0);
    expect(record.median_sold_price_usd).toBeNull();
    expect(record.sample_listings).toEqual([]);
  });
});
