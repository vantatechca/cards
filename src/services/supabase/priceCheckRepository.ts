import { API_CONFIG } from '../../config/api';
import type { PriceCheck, PriceSource } from '../../types/card';

let mockPriceChecks: PriceCheck[] = [];

function generateId(): string {
  return `mock-pc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_CONFIG.apiBaseUrl}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(await res.text());
  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function createPriceCheck(data: Partial<PriceCheck>): Promise<PriceCheck> {
  if (API_CONFIG.useMocks) {
    const record: PriceCheck = {
      id: generateId(),
      card_id: data.card_id ?? '',
      checked_at: data.checked_at ?? new Date().toISOString(),
      source: data.source ?? 'ebay_sold',
      search_query_used: data.search_query_used ?? '',
      results_found: data.results_found ?? 0,
      avg_sold_price_usd: data.avg_sold_price_usd ?? null,
      median_sold_price_usd: data.median_sold_price_usd ?? null,
      min_sold_price_usd: data.min_sold_price_usd ?? null,
      max_sold_price_usd: data.max_sold_price_usd ?? null,
      sample_listings: data.sample_listings ?? [],
      raw_response: data.raw_response ?? null,
      confidence_contribution: data.confidence_contribution ?? 0,
    };
    mockPriceChecks.push(record);
    return record;
  }
  return apiFetch<PriceCheck>('/api/price-checks', { method: 'POST', body: JSON.stringify(data) });
}

export async function getPriceChecksForCard(cardId: string): Promise<PriceCheck[]> {
  if (API_CONFIG.useMocks) {
    return mockPriceChecks
      .filter((pc) => pc.card_id === cardId)
      .sort((a, b) => b.checked_at.localeCompare(a.checked_at));
  }
  return apiFetch<PriceCheck[]>(`/api/price-checks?card_id=${cardId}`);
}

export async function getLatestPriceCheck(cardId: string, source: PriceSource): Promise<PriceCheck | null> {
  if (API_CONFIG.useMocks) {
    const matches = mockPriceChecks
      .filter((pc) => pc.card_id === cardId && pc.source === source)
      .sort((a, b) => b.checked_at.localeCompare(a.checked_at));
    return matches[0] ?? null;
  }
  return apiFetch<PriceCheck | null>(`/api/price-checks/latest?card_id=${cardId}&source=${source}`);
}
