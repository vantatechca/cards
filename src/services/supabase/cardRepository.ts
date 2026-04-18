import { API_CONFIG } from '../../config/api';
import type { Card, CollectionType, CollectionSummary, Recommendation } from '../../types/card';
import { MOCK_CARDS } from '../mockData';

export interface CardFilters {
  condition_simple?: string;
  is_graded?: boolean;
  rarity?: string;
  min_value?: number;
  max_value?: number;
}

export type CardSortBy =
  | 'card_name'
  | 'estimated_value_usd'
  | 'created_at'
  | 'updated_at'
  | 'year';

let mockCards = [...MOCK_CARDS];

const base = () => API_CONFIG.apiBaseUrl;

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base()}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(await res.text());
  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function getCards(
  collectionType?: CollectionType,
  sortBy: CardSortBy = 'created_at',
  filters?: CardFilters,
): Promise<Card[]> {
  if (API_CONFIG.useMocks) {
    let cards = [...mockCards];
    if (collectionType) cards = cards.filter((c) => c.collection_type === collectionType);
    if (filters?.condition_simple) cards = cards.filter((c) => c.condition_simple === filters.condition_simple);
    if (filters?.is_graded !== undefined) cards = cards.filter((c) => c.is_graded === filters.is_graded);
    if (filters?.rarity) cards = cards.filter((c) => c.rarity === filters.rarity);
    if (filters?.min_value !== undefined) cards = cards.filter((c) => (c.estimated_value_usd ?? 0) >= filters.min_value!);
    if (filters?.max_value !== undefined) cards = cards.filter((c) => (c.estimated_value_usd ?? 0) <= filters.max_value!);
    cards.sort((a, b) => {
      switch (sortBy) {
        case 'card_name': return a.card_name.localeCompare(b.card_name);
        case 'estimated_value_usd': return (b.estimated_value_usd ?? 0) - (a.estimated_value_usd ?? 0);
        case 'year': return (b.year ?? 0) - (a.year ?? 0);
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    return cards;
  }

  const params = new URLSearchParams({ sort_by: sortBy });
  if (collectionType) params.set('collection_type', collectionType);
  if (filters?.condition_simple) params.set('condition_simple', filters.condition_simple);
  if (filters?.is_graded !== undefined) params.set('is_graded', String(filters.is_graded));
  if (filters?.rarity) params.set('rarity', filters.rarity);
  if (filters?.min_value !== undefined) params.set('min_value', String(filters.min_value));
  if (filters?.max_value !== undefined) params.set('max_value', String(filters.max_value));

  return apiFetch<Card[]>(`/api/cards?${params}`);
}

export async function getCardById(id: string): Promise<Card | null> {
  if (API_CONFIG.useMocks) {
    return mockCards.find((c) => c.id === id) ?? null;
  }
  return apiFetch<Card | null>(`/api/cards/${id}`);
}

export async function createCard(card: Partial<Card>): Promise<Card> {
  if (API_CONFIG.useMocks) {
    const newCard: Card = {
      id: Math.random().toString(36).slice(2),
      collection_type: card.collection_type ?? 'hockey',
      card_name: card.card_name ?? 'Unknown',
      set_name: card.set_name ?? null,
      year: card.year ?? null,
      card_number: card.card_number ?? null,
      edition: card.edition ?? null,
      rarity: card.rarity ?? null,
      language: card.language ?? 'English',
      photo_url_front: card.photo_url_front ?? '',
      photo_url_back: card.photo_url_back ?? null,
      ai_identification_raw: card.ai_identification_raw ?? null,
      ai_confidence_identification: card.ai_confidence_identification ?? null,
      condition_psa_estimate: card.condition_psa_estimate ?? null,
      condition_simple: card.condition_simple ?? null,
      condition_notes: card.condition_notes ?? null,
      is_graded: card.is_graded ?? false,
      grading_company: card.grading_company ?? null,
      graded_score: card.graded_score ?? null,
      grading_cert_number: card.grading_cert_number ?? null,
      estimated_value_usd: card.estimated_value_usd ?? null,
      estimated_value_cad: card.estimated_value_cad ?? null,
      value_confidence_pct: card.value_confidence_pct ?? null,
      value_source_breakdown: card.value_source_breakdown ?? null,
      proof_links: card.proof_links ?? null,
      last_valued_at: card.last_valued_at ?? null,
      ai_recommendation: card.ai_recommendation ?? null,
      ai_recommendation_reasoning: card.ai_recommendation_reasoning ?? null,
      tags: card.tags ?? [],
      notes: card.notes ?? null,
      location: card.location ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockCards.unshift(newCard);
    return newCard;
  }
  const payload = { ...card };
  if (Array.isArray(payload.tags) && payload.tags.length === 0) delete payload.tags;
  return apiFetch<Card>('/api/cards', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateCard(id: string, updates: Partial<Card>): Promise<Card> {
  if (API_CONFIG.useMocks) {
    const idx = mockCards.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Card not found');
    mockCards[idx] = { ...mockCards[idx], ...updates, updated_at: new Date().toISOString() };
    return mockCards[idx];
  }
  return apiFetch<Card>(`/api/cards/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
}

export async function deleteCard(id: string): Promise<void> {
  if (API_CONFIG.useMocks) {
    mockCards = mockCards.filter((c) => c.id !== id);
    return;
  }
  return apiFetch<void>(`/api/cards/${id}`, { method: 'DELETE' });
}

export async function deleteAllCards(): Promise<void> {
  if (API_CONFIG.useMocks) {
    mockCards = [];
    return;
  }
  return apiFetch<void>('/api/cards', { method: 'DELETE' });
}

export async function searchCards(query: string): Promise<Card[]> {
  if (API_CONFIG.useMocks) {
    const q = query.toLowerCase();
    return mockCards.filter(
      (c) =>
        c.card_name.toLowerCase().includes(q) ||
        (c.set_name?.toLowerCase().includes(q) ?? false) ||
        (c.notes?.toLowerCase().includes(q) ?? false) ||
        c.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }
  return apiFetch<Card[]>(`/api/cards/search?q=${encodeURIComponent(query)}`);
}

export async function getCollectionSummary(type?: CollectionType): Promise<CollectionSummary> {
  const cards = await getCards(type);
  const totalValueUsd = cards.reduce((sum, c) => sum + (c.estimated_value_usd ?? 0), 0);
  const totalValueCad = cards.reduce((sum, c) => sum + (c.estimated_value_cad ?? 0), 0);
  const confidences = cards.map((c) => c.value_confidence_pct).filter((v): v is number => v !== null);
  const avgConfidence = confidences.length > 0
    ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length)
    : 0;
  const mostValuableCard = cards.length > 0
    ? cards.reduce((best, c) => (c.estimated_value_usd ?? 0) > (best.estimated_value_usd ?? 0) ? c : best)
    : null;
  const recommendationBreakdown = cards.reduce(
    (acc, c) => {
      if (c.ai_recommendation) acc[c.ai_recommendation] = (acc[c.ai_recommendation] || 0) + 1;
      return acc;
    },
    { sell_now: 0, hold: 0, buy_more: 0, watch: 0 } as Record<Recommendation, number>,
  );
  return { type: type ?? 'all', totalCards: cards.length, totalValueUsd, totalValueCad, avgConfidence, mostValuableCard, recommendationBreakdown };
}

export function checkDuplicate(cardName: string, setName: string | null, cardNumber: string | null, edition: string | null): Card | null {
  if (API_CONFIG.useMocks) {
    return mockCards.find(
      (c) =>
        c.card_name.toLowerCase() === cardName.toLowerCase() &&
        (c.set_name ?? '').toLowerCase() === (setName ?? '').toLowerCase() &&
        (c.card_number ?? '') === (cardNumber ?? '') &&
        (c.edition ?? '').toLowerCase() === (edition ?? '').toLowerCase(),
    ) ?? null;
  }
  return null;
}
