import { Card, CollectionSnapshot, CollectionType } from '../types/card';
import { API_CONFIG } from '../config/api';
import * as snapshotRepo from './supabase/snapshotRepository';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SNAPSHOTS_KEY = '@cardvault_snapshots';
const LAST_SNAPSHOT_KEY = '@cardvault_last_snapshot_date';

// In-memory mock store
let mockSnapshots: CollectionSnapshot[] = [];

/**
 * Build a snapshot record for a set of cards.
 */
function buildSnapshotData(
  cards: Card[],
  collectionType: CollectionType | null,
): Partial<CollectionSnapshot> {
  const totalUsd = cards.reduce((s, c) => s + (c.estimated_value_usd ?? 0), 0);
  const totalCad = Math.round(totalUsd * 1.36 * 100) / 100;
  const confidences = cards.map((c) => c.value_confidence_pct).filter((v): v is number => v != null);
  const avgConf = confidences.length > 0 ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length) : 0;

  const sorted = [...cards].sort((a, b) => (b.estimated_value_usd ?? 0) - (a.estimated_value_usd ?? 0));
  const top10 = sorted.slice(0, 10).map((c) => ({
    id: c.id,
    name: c.card_name,
    value: c.estimated_value_usd ?? 0,
  }));

  return {
    snapshot_date: new Date().toISOString(),
    collection_type: collectionType,
    total_cards: cards.length,
    total_estimated_value_usd: Math.round(totalUsd * 100) / 100,
    total_estimated_value_cad: totalCad,
    avg_confidence_pct: avgConf,
    top_10_cards: top10,
  };
}

async function saveMockSnapshot(data: Partial<CollectionSnapshot>): Promise<CollectionSnapshot> {
  const snapshot: CollectionSnapshot = {
    id: Math.random().toString(36).slice(2),
    snapshot_date: data.snapshot_date!,
    collection_type: data.collection_type ?? null,
    total_cards: data.total_cards!,
    total_estimated_value_usd: data.total_estimated_value_usd!,
    total_estimated_value_cad: data.total_estimated_value_cad!,
    avg_confidence_pct: data.avg_confidence_pct!,
    top_10_cards: data.top_10_cards!,
    created_at: new Date().toISOString(),
  };
  mockSnapshots.push(snapshot);
  return snapshot;
}

/**
 * Create snapshots: one global + one per collection type that has cards.
 */
export async function takeSnapshot(cards: Card[]): Promise<CollectionSnapshot> {
  // Global snapshot
  const globalData = buildSnapshotData(cards, null);
  let globalSnap: CollectionSnapshot;

  if (API_CONFIG.useMocks) {
    globalSnap = await saveMockSnapshot(globalData);

    // Per-collection-type snapshots
    const types: CollectionType[] = ['hockey', 'magic', 'yugioh'];
    for (const type of types) {
      const subset = cards.filter((c) => c.collection_type === type);
      if (subset.length > 0) {
        await saveMockSnapshot(buildSnapshotData(subset, type));
      }
    }
    await persistSnapshots();
    return globalSnap;
  }

  globalSnap = await snapshotRepo.createSnapshot(globalData);

  const types: CollectionType[] = ['hockey', 'magic', 'yugioh'];
  for (const type of types) {
    const subset = cards.filter((c) => c.collection_type === type);
    if (subset.length > 0) {
      await snapshotRepo.createSnapshot(buildSnapshotData(subset, type));
    }
  }

  return globalSnap;
}

/**
 * Get stored snapshots (for trend charts).
 */
export async function getSnapshots(type?: CollectionType, limit = 30): Promise<CollectionSnapshot[]> {
  if (API_CONFIG.useMocks) {
    await hydrateSnapshots();
    let result = [...mockSnapshots];
    if (type) result = result.filter((s) => s.collection_type === type);
    return result
      .sort((a, b) => new Date(b.snapshot_date).getTime() - new Date(a.snapshot_date).getTime())
      .slice(0, limit);
  }
  return snapshotRepo.getSnapshots(type, limit);
}

/**
 * Check if a snapshot should be taken (at most once per day).
 */
export async function shouldTakeSnapshot(): Promise<boolean> {
  try {
    const last = await AsyncStorage.getItem(LAST_SNAPSHOT_KEY);
    if (!last) return true;
    const lastDate = new Date(last);
    const now = new Date();
    return lastDate.toDateString() !== now.toDateString();
  } catch {
    return true;
  }
}

/**
 * Record that a snapshot was taken today.
 */
export async function markSnapshotTaken(): Promise<void> {
  await AsyncStorage.setItem(LAST_SNAPSHOT_KEY, new Date().toISOString());
}

// Persistence helpers for mock mode
async function persistSnapshots(): Promise<void> {
  try {
    await AsyncStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(mockSnapshots));
  } catch { /* best-effort */ }
}

async function hydrateSnapshots(): Promise<void> {
  if (mockSnapshots.length > 0) return;
  try {
    const stored = await AsyncStorage.getItem(SNAPSHOTS_KEY);
    if (stored) mockSnapshots = JSON.parse(stored);
  } catch {
    mockSnapshots = [];
  }
}
