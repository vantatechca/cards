import { CollectionType } from '../types/card';

export const queryKeys = {
  cards: {
    all: ['cards'] as const,
    list: (type?: CollectionType) => ['cards', 'list', type] as const,
    detail: (id: string) => ['cards', 'detail', id] as const,
    search: (query: string) => ['cards', 'search', query] as const,
  },
  pricing: {
    card: (cardId: string) => ['pricing', cardId] as const,
    history: (cardId: string) => ['pricing', 'history', cardId] as const,
  },
  snapshots: {
    all: ['snapshots'] as const,
    byType: (type: CollectionType) => ['snapshots', type] as const,
  },
  summary: {
    all: ['summary'] as const,
    byType: (type: CollectionType) => ['summary', type] as const,
  },
} as const;
