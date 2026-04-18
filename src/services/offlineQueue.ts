import NetInfo, { NetInfoSubscription } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { identifyCard } from './ai/identificationService';
import { priceCard } from './pricing/pricingEngine';
import { createCard, updateCard } from './supabase/cardRepository';
import { saveToLocal } from './camera/imageService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type QueueOperationType =
  | 'upload_image'
  | 'identify_card'
  | 'price_card'
  | 'save_card';

export type QueueItemStatus = 'pending' | 'processing' | 'failed';

export interface QueueItem {
  id: string;
  type: QueueOperationType;
  payload: unknown;
  status: QueueItemStatus;
  retryCount: number;
  createdAt: string;
}

export interface QueueStatus {
  pending: number;
  processing: number;
  failed: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 1_000; // 1 second
const STORAGE_KEY = '@cardvault_offline_queue';

// ---------------------------------------------------------------------------
// In-memory queue (hydrated from AsyncStorage on init)
// ---------------------------------------------------------------------------

let queue: QueueItem[] = [];
let isProcessing = false;
let netInfoUnsubscribe: NetInfoSubscription | null = null;
let statusListeners: Array<() => void> = [];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function notifyListeners(): void {
  for (const listener of statusListeners) {
    listener();
  }
  persistQueue();
}

async function persistQueue(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // Persistence is best-effort
  }
}

async function hydrateQueue(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const items: QueueItem[] = JSON.parse(stored);
      // Reset any "processing" items back to "pending" (app was killed mid-process)
      queue = items.map((item) =>
        item.status === 'processing' ? { ...item, status: 'pending' as QueueItemStatus } : item,
      );
    }
  } catch {
    queue = [];
  }
}

/** Exponential backoff: 1s, 2s, 4s ... */
function backoffDelay(retryCount: number): number {
  return BASE_BACKOFF_MS * Math.pow(2, retryCount);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Queue operations
// ---------------------------------------------------------------------------

/**
 * Add a new operation to the offline queue.
 * Returns the generated queue item id.
 */
export function enqueue(
  type: QueueOperationType,
  payload: unknown,
): string {
  const item: QueueItem = {
    id: generateId(),
    type,
    payload,
    status: 'pending',
    retryCount: 0,
    createdAt: new Date().toISOString(),
  };

  queue.push(item);
  notifyListeners();
  return item.id;
}

/**
 * Process all pending items sequentially.
 * Failed items are retried up to MAX_RETRIES times with exponential backoff.
 */
export async function processQueue(): Promise<void> {
  if (isProcessing) return;

  const state = await NetInfo.fetch();
  if (!state.isConnected) return;

  isProcessing = true;
  notifyListeners();

  try {
    // Process items one at a time in FIFO order
    for (const item of queue) {
      if (item.status !== 'pending') continue;

      item.status = 'processing';
      notifyListeners();

      try {
        await executeOperation(item);

        // Success -- remove from queue
        queue = queue.filter((q) => q.id !== item.id);
        notifyListeners();
      } catch (error) {
        item.retryCount += 1;

        if (item.retryCount >= MAX_RETRIES) {
          item.status = 'failed';
        } else {
          item.status = 'pending';
          // Wait with exponential backoff before the next item
          await wait(backoffDelay(item.retryCount));
        }

        notifyListeners();
      }
    }
  } finally {
    isProcessing = false;
    notifyListeners();
  }
}

/**
 * Return a snapshot of the current queue status.
 * Cached to maintain referential equality for useSyncExternalStore.
 */
let cachedStatus: QueueStatus = { pending: 0, processing: 0, failed: 0 };

export function getQueueStatus(): QueueStatus {
  let pending = 0;
  let processing = 0;
  let failed = 0;

  for (const item of queue) {
    switch (item.status) {
      case 'pending':
        pending++;
        break;
      case 'processing':
        processing++;
        break;
      case 'failed':
        failed++;
        break;
    }
  }

  if (
    pending !== cachedStatus.pending ||
    processing !== cachedStatus.processing ||
    failed !== cachedStatus.failed
  ) {
    cachedStatus = { pending, processing, failed };
  }

  return cachedStatus;
}

/**
 * Remove all items from the queue.
 */
export function clearQueue(): void {
  queue = [];
  isProcessing = false;
  notifyListeners();
}

// ---------------------------------------------------------------------------
// Listener management (used by the React hook)
// ---------------------------------------------------------------------------

export function subscribeToQueueChanges(listener: () => void): () => void {
  statusListeners.push(listener);
  return () => {
    statusListeners = statusListeners.filter((l) => l !== listener);
  };
}

// ---------------------------------------------------------------------------
// Operation executor
// ---------------------------------------------------------------------------

/**
 * Dispatch the actual work for a given queue item.
 * Each branch calls the appropriate service function.
 */
async function executeOperation(item: QueueItem): Promise<void> {
  const p = item.payload as Record<string, any>;
  switch (item.type) {
    case 'upload_image': {
      // Save image from temp URI to persistent local storage
      const { uri, filename } = p as { uri: string; filename: string };
      await saveToLocal(uri, filename);
      break;
    }
    case 'identify_card': {
      const { frontUri, backUri } = p as { frontUri: string; backUri?: string };
      await identifyCard(frontUri, backUri);
      break;
    }
    case 'price_card': {
      const { card_name, set_name, collection_type, card_number, edition, condition_psa_estimate, ai_confidence_identification } = p;
      await priceCard({ card_name, set_name, collection_type, card_number, edition, condition_psa_estimate, ai_confidence_identification });
      break;
    }
    case 'save_card': {
      const { id, data } = p as { id?: string; data: Record<string, any> };
      if (id) {
        await updateCard(id, data);
      } else {
        await createCard(data);
      }
      break;
    }
    default: {
      const _exhaustive: never = item.type;
      throw new Error(`Unknown queue operation type: ${_exhaustive}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

/**
 * Subscribe to NetInfo connectivity changes.
 * When the device comes back online, automatically process the queue.
 * Call this once at app startup.
 */
export function initOfflineQueue(): () => void {
  // Avoid double-subscribing
  if (netInfoUnsubscribe) {
    netInfoUnsubscribe();
  }

  // Restore any queued items from a previous session
  hydrateQueue().then(() => {
    notifyListeners();
    processQueue();
  });

  netInfoUnsubscribe = NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      processQueue();
    }
  });

  return () => {
    if (netInfoUnsubscribe) {
      netInfoUnsubscribe();
      netInfoUnsubscribe = null;
    }
  };
}
