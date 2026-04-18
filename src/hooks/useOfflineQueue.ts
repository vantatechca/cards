import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import NetInfo from '@react-native-community/netinfo';
import {
  QueueStatus,
  getQueueStatus,
  processQueue as processQueueService,
  subscribeToQueueChanges,
} from '../services/offlineQueue';

/**
 * React hook that exposes network connectivity and offline queue status.
 *
 * - `isOnline`      – current connectivity state
 * - `queueStatus`   – { pending, processing, failed } counts
 * - `processQueue`  – manually trigger queue processing
 */
export function useOfflineQueue() {
  const [isOnline, setIsOnline] = useState(true);

  // Track connectivity via NetInfo
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });

    // Fetch initial state
    NetInfo.fetch().then((state) => {
      setIsOnline(state.isConnected ?? false);
    });

    return unsubscribe;
  }, []);

  // Subscribe to queue changes so the component re-renders when items change.
  // useSyncExternalStore gives us tear-safe reads of the external queue state.
  const queueStatus: QueueStatus = useSyncExternalStore(
    subscribeToQueueChanges,
    getQueueStatus,
    getQueueStatus, // server snapshot (same for RN)
  );

  const processQueue = useCallback(() => {
    processQueueService();
  }, []);

  return { isOnline, queueStatus, processQueue } as const;
}
