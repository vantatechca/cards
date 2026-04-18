import { getConfidenceLabel, getConfidenceColor } from '../types/pricing';

describe('getConfidenceLabel', () => {
  it('returns Highly Accurate for 90+', () => {
    expect(getConfidenceLabel(90)).toBe('Highly Accurate');
    expect(getConfidenceLabel(100)).toBe('Highly Accurate');
  });

  it('returns Reliable Estimate for 70-89', () => {
    expect(getConfidenceLabel(70)).toBe('Reliable Estimate');
    expect(getConfidenceLabel(89)).toBe('Reliable Estimate');
  });

  it('returns Moderate Confidence for 50-69', () => {
    expect(getConfidenceLabel(50)).toBe('Moderate Confidence');
    expect(getConfidenceLabel(69)).toBe('Moderate Confidence');
  });

  it('returns Low Confidence for 25-49', () => {
    expect(getConfidenceLabel(25)).toBe('Low Confidence');
    expect(getConfidenceLabel(49)).toBe('Low Confidence');
  });

  it('returns Insufficient Data for below 25', () => {
    expect(getConfidenceLabel(0)).toBe('Insufficient Data');
    expect(getConfidenceLabel(24)).toBe('Insufficient Data');
  });
});

describe('getConfidenceColor', () => {
  it('returns green for 90+', () => {
    expect(getConfidenceColor(95)).toBe('#22c55e');
  });

  it('returns blue for 70-89', () => {
    expect(getConfidenceColor(75)).toBe('#3b82f6');
  });

  it('returns yellow for 50-69', () => {
    expect(getConfidenceColor(55)).toBe('#eab308');
  });

  it('returns orange for 25-49', () => {
    expect(getConfidenceColor(30)).toBe('#f97316');
  });

  it('returns red for below 25', () => {
    expect(getConfidenceColor(10)).toBe('#ef4444');
  });
});
