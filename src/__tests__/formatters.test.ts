import { formatUsd, formatCad, usdToCad, formatDate, formatRelativeDate, formatConfidence, formatPsa } from '../utils/formatters';

describe('formatUsd', () => {
  it('formats a positive amount', () => {
    expect(formatUsd(1234.56)).toBe('$1,234.56');
  });

  it('formats zero', () => {
    expect(formatUsd(0)).toBe('$0.00');
  });

  it('returns N/A for null', () => {
    expect(formatUsd(null)).toBe('N/A');
  });

  it('returns N/A for undefined', () => {
    expect(formatUsd(undefined)).toBe('N/A');
  });

  it('formats small amounts', () => {
    expect(formatUsd(0.5)).toBe('$0.50');
  });
});

describe('formatCad', () => {
  it('formats a positive amount', () => {
    const result = formatCad(100);
    expect(result).toContain('100.00');
  });

  it('returns N/A for null', () => {
    expect(formatCad(null)).toBe('N/A');
  });
});

describe('usdToCad', () => {
  it('converts using default rate', () => {
    const result = usdToCad(100);
    expect(result).toBe(136); // 100 * 1.36
  });

  it('converts using custom rate', () => {
    expect(usdToCad(100, 1.5)).toBe(150);
  });

  it('rounds to 2 decimal places', () => {
    const result = usdToCad(33.33);
    expect(result).toBe(45.33); // 33.33 * 1.36 = 45.3288 → 45.33
  });
});

describe('formatDate', () => {
  it('formats a valid ISO date', () => {
    const result = formatDate('2025-03-15T12:00:00Z');
    expect(result).toContain('Mar');
    expect(result).toContain('15');
    expect(result).toContain('2025');
  });

  it('returns N/A for null', () => {
    expect(formatDate(null)).toBe('N/A');
  });

  it('returns N/A for undefined', () => {
    expect(formatDate(undefined)).toBe('N/A');
  });
});

describe('formatRelativeDate', () => {
  it('returns Today for current time', () => {
    expect(formatRelativeDate(new Date().toISOString())).toBe('Today');
  });

  it('returns Yesterday for 1 day ago', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeDate(yesterday)).toBe('Yesterday');
  });

  it('returns days for recent dates', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeDate(threeDaysAgo)).toBe('3 days ago');
  });

  it('returns weeks for 7-29 day range', () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeDate(twoWeeksAgo)).toBe('2 weeks ago');
  });

  it('returns months for 30+ days', () => {
    const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeDate(twoMonthsAgo)).toBe('2 months ago');
  });
});

describe('formatConfidence', () => {
  it('formats a percentage', () => {
    expect(formatConfidence(85)).toBe('85%');
  });

  it('returns N/A for null', () => {
    expect(formatConfidence(null)).toBe('N/A');
  });
});

describe('formatPsa', () => {
  it('formats a PSA score', () => {
    expect(formatPsa(9)).toBe('PSA 9.0');
  });

  it('formats a half-point PSA score', () => {
    expect(formatPsa(8.5)).toBe('PSA 8.5');
  });

  it('returns N/A for null', () => {
    expect(formatPsa(null)).toBe('N/A');
  });
});
