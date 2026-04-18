import { queryKeys } from '../utils/queryKeys';

describe('queryKeys', () => {
  describe('cards', () => {
    it('has a stable all key', () => {
      expect(queryKeys.cards.all).toEqual(['cards']);
    });

    it('creates list key without type', () => {
      expect(queryKeys.cards.list()).toEqual(['cards', 'list', undefined]);
    });

    it('creates list key with type', () => {
      expect(queryKeys.cards.list('hockey')).toEqual(['cards', 'list', 'hockey']);
    });

    it('creates detail key', () => {
      expect(queryKeys.cards.detail('abc-123')).toEqual(['cards', 'detail', 'abc-123']);
    });

    it('creates search key', () => {
      expect(queryKeys.cards.search('gretzky')).toEqual(['cards', 'search', 'gretzky']);
    });
  });

  describe('pricing', () => {
    it('creates card pricing key', () => {
      expect(queryKeys.pricing.card('abc-123')).toEqual(['pricing', 'abc-123']);
    });

    it('creates history key', () => {
      expect(queryKeys.pricing.history('abc-123')).toEqual(['pricing', 'history', 'abc-123']);
    });
  });

  describe('snapshots', () => {
    it('has a stable all key', () => {
      expect(queryKeys.snapshots.all).toEqual(['snapshots']);
    });

    it('creates byType key', () => {
      expect(queryKeys.snapshots.byType('magic')).toEqual(['snapshots', 'magic']);
    });
  });

  describe('summary', () => {
    it('has a stable all key', () => {
      expect(queryKeys.summary.all).toEqual(['summary']);
    });

    it('creates byType key', () => {
      expect(queryKeys.summary.byType('yugioh')).toEqual(['summary', 'yugioh']);
    });
  });
});
