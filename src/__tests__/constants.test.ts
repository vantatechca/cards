import {
  COLLECTION_LABELS,
  CONDITION_LABELS,
  RECOMMENDATION_CONFIG,
  SORT_OPTIONS,
  USD_TO_CAD_RATE,
  IMAGE_MAX_SIZE_BYTES,
} from '../utils/constants';

describe('COLLECTION_LABELS', () => {
  it('has all three collection types', () => {
    expect(COLLECTION_LABELS.hockey).toBe('Hockey');
    expect(COLLECTION_LABELS.magic).toBe('Magic: The Gathering');
    expect(COLLECTION_LABELS.yugioh).toBe('Yu-Gi-Oh!');
  });

  it('has exactly 3 entries', () => {
    expect(Object.keys(COLLECTION_LABELS)).toHaveLength(3);
  });
});

describe('CONDITION_LABELS', () => {
  it('has all six conditions', () => {
    expect(CONDITION_LABELS.Mint).toContain('PSA 10');
    expect(CONDITION_LABELS['Near Mint']).toContain('PSA 8-9');
    expect(CONDITION_LABELS.Excellent).toContain('PSA 6-7');
    expect(CONDITION_LABELS.Good).toContain('PSA 4-5');
    expect(CONDITION_LABELS.Fair).toContain('PSA 2-3');
    expect(CONDITION_LABELS.Poor).toContain('PSA 1');
  });

  it('has exactly 6 entries', () => {
    expect(Object.keys(CONDITION_LABELS)).toHaveLength(6);
  });
});

describe('RECOMMENDATION_CONFIG', () => {
  it('has all four recommendation types', () => {
    expect(RECOMMENDATION_CONFIG.sell_now.label).toBe('Sell Now');
    expect(RECOMMENDATION_CONFIG.hold.label).toBe('Hold');
    expect(RECOMMENDATION_CONFIG.buy_more.label).toBe('Buy More');
    expect(RECOMMENDATION_CONFIG.watch.label).toBe('Watch');
  });

  it('each has color and bg properties', () => {
    for (const config of Object.values(RECOMMENDATION_CONFIG)) {
      expect(config.color).toBeTruthy();
      expect(config.bg).toBeTruthy();
      expect(config.color).toMatch(/^#[0-9a-f]{6}$/);
      expect(config.bg).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

describe('SORT_OPTIONS', () => {
  it('has 8 sort options', () => {
    expect(SORT_OPTIONS).toHaveLength(8);
  });

  it('all have key and label', () => {
    for (const opt of SORT_OPTIONS) {
      expect(opt.key).toBeTruthy();
      expect(opt.label).toBeTruthy();
    }
  });

  it('has unique keys', () => {
    const keys = SORT_OPTIONS.map((o) => o.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('global constants', () => {
  it('USD_TO_CAD_RATE is reasonable', () => {
    expect(USD_TO_CAD_RATE).toBeGreaterThan(1);
    expect(USD_TO_CAD_RATE).toBeLessThan(2);
  });

  it('IMAGE_MAX_SIZE_BYTES is 2MB', () => {
    expect(IMAGE_MAX_SIZE_BYTES).toBe(2 * 1024 * 1024);
  });
});
