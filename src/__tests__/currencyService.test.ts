/**
 * Tests for the currency conversion service.
 */
import { getUsdToCadRate } from '../services/currency/currencyService';

describe('getUsdToCadRate (mock mode)', () => {
  it('returns a number', async () => {
    const rate = await getUsdToCadRate();
    expect(typeof rate).toBe('number');
  });

  it('returns a reasonable CAD rate', async () => {
    const rate = await getUsdToCadRate();
    expect(rate).toBeGreaterThan(1);
    expect(rate).toBeLessThan(2);
  });

  it('returns 1.36 in mock mode', async () => {
    const rate = await getUsdToCadRate();
    expect(rate).toBe(1.36);
  });
});
