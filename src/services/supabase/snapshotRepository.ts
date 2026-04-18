import { API_CONFIG } from '../../config/api';
import type { CollectionSnapshot, CollectionType } from '../../types/card';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_CONFIG.apiBaseUrl}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(await res.text());
  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function createSnapshot(data: Partial<CollectionSnapshot>): Promise<CollectionSnapshot> {
  return apiFetch<CollectionSnapshot>('/api/snapshots', { method: 'POST', body: JSON.stringify(data) });
}

export async function getSnapshots(type?: CollectionType, limit = 30): Promise<CollectionSnapshot[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (type) params.set('type', type);
  return apiFetch<CollectionSnapshot[]>(`/api/snapshots?${params}`);
}

export async function getLatestSnapshot(type?: CollectionType): Promise<CollectionSnapshot | null> {
  const params = type ? `?type=${type}` : '';
  return apiFetch<CollectionSnapshot | null>(`/api/snapshots/latest${params}`);
}
