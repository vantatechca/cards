import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  psaEstimate: number | null;
  showLabel?: boolean;
}

function getBarColor(score: number): string {
  if (score >= 9) return '#22c55e';
  if (score >= 7) return '#3b82f6';
  if (score >= 5) return '#eab308';
  if (score >= 3) return '#f97316';
  return '#ef4444';
}

export function ConditionBar({ psaEstimate, showLabel = true }: Props) {
  const score = psaEstimate ?? 0;
  const pct = (score / 10) * 100;
  const color = getBarColor(score);

  return (
    <View style={styles.container}>
      {showLabel && (
        <Text style={styles.label}>PSA {score > 0 ? score.toFixed(1) : 'N/A'}</Text>
      )}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <View style={styles.scale}>
        <Text style={styles.scaleText}>1</Text>
        <Text style={styles.scaleText}>5</Text>
        <Text style={styles.scaleText}>10</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  track: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  scale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scaleText: {
    fontSize: 10,
    color: '#9ca3af',
  },
});
