import { create } from 'zustand';
import { CollectionType, ConditionSimple, Recommendation } from '../types/card';
import { SortKey } from '../utils/constants';

interface CollectionFilters {
  conditionMin?: ConditionSimple;
  conditionMax?: ConditionSimple;
  valueMin?: number;
  valueMax?: number;
  confidenceMin?: number;
  rarity?: string;
  set?: string;
  yearMin?: number;
  yearMax?: number;
  tags?: string[];
  isGraded?: boolean;
  recommendation?: Recommendation;
}

interface CollectionState {
  activeTab: CollectionType | 'all';
  sortBy: SortKey;
  filters: CollectionFilters;
  searchQuery: string;
  selectedCardIds: string[];
  isMultiSelectMode: boolean;

  setActiveTab: (tab: CollectionType | 'all') => void;
  setSortBy: (sort: SortKey) => void;
  setFilters: (filters: CollectionFilters) => void;
  clearFilters: () => void;
  setSearchQuery: (query: string) => void;
  toggleCardSelection: (id: string) => void;
  clearSelection: () => void;
  setMultiSelectMode: (enabled: boolean) => void;
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  activeTab: 'all',
  sortBy: 'date_desc',
  filters: {},
  searchQuery: '',
  selectedCardIds: [],
  isMultiSelectMode: false,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSortBy: (sort) => set({ sortBy: sort }),
  setFilters: (filters) => set({ filters }),
  clearFilters: () => set({ filters: {} }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleCardSelection: (id) =>
    set((state) => ({
      selectedCardIds: state.selectedCardIds.includes(id)
        ? state.selectedCardIds.filter((cid) => cid !== id)
        : [...state.selectedCardIds, id],
    })),
  clearSelection: () => set({ selectedCardIds: [], isMultiSelectMode: false }),
  setMultiSelectMode: (enabled) =>
    set({ isMultiSelectMode: enabled, selectedCardIds: enabled ? [] : [] }),
}));
