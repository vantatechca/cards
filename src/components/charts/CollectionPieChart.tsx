import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Slice {
  label: string;
  value: number;
  color: string;
}

interface Props {
  data: Slice[];
  title?: string;
}

export function CollectionPieChart({ data, title }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No data to display.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}

      {/* Simple horizontal bar representation */}
      <View style={styles.barContainer}>
        {data.map((slice) => {
          const pct = (slice.value / total) * 100;
          if (pct === 0) return null;
          return (
            <View
              key={slice.label}
              style={[styles.barSegment, { width: `${pct}%`, backgroundColor: slice.color }] as any}
            />
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {data.map((slice) => {
          const pct = total > 0 ? ((slice.value / total) * 100).toFixed(1) : '0.0';
          return (
            <View key={slice.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: slice.color }]} />
              <Text style={styles.legendLabel}>{slice.label}</Text>
              <Text style={styles.legendPct}>{pct}%</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
  },
  barContainer: {
    flexDirection: 'row',
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  barSegment: {
    height: '100%',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  legendPct: {
    fontSize: 12,
    color: '#9ca3af',
  },
  empty: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});
