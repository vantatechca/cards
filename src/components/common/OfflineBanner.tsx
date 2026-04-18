import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useOfflineQueue } from '../../hooks/useOfflineQueue';

/**
 * Compact banner displayed at the top of screens when the device is offline.
 * Shows pending queue count when items are waiting to sync.
 */
export function OfflineBanner() {
  const { isOnline, queueStatus } = useOfflineQueue();

  if (isOnline && queueStatus.pending === 0) return null;

  const pendingTotal = queueStatus.pending + queueStatus.processing;

  return (
    <View style={styles.container}>
      {!isOnline && (
        <Text style={styles.text}>
          You're offline. Changes will sync when connected.
        </Text>
      )}
      {pendingTotal > 0 && (
        <Text style={styles.count}>
          {pendingTotal} {pendingTotal === 1 ? 'item' : 'items'} waiting to sync
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: '#78350f',
  },
  count: {
    fontSize: 13,
    fontWeight: '500',
    color: '#92400e',
  },
});
