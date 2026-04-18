import React from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { formatUsd } from '../../utils/formatters';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface DataPoint {
  date: string;
  value: number;
}

interface Props {
  data: DataPoint[];
  title?: string;
  color?: string;
  height?: number;
}

export function ValueTrendChart({ data, title, color = '#2563eb', height = 200 }: Props) {
  if (data.length < 2) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Not enough data for a trend chart yet.</Text>
      </View>
    );
  }

  // Show at most 12 data points for readability
  const trimmed = data.length > 12 ? data.slice(data.length - 12) : data;
  const labels = trimmed.map((d) => {
    const date = new Date(d.date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });
  const values = trimmed.map((d) => d.value);

  const first = values[0];
  const last = values[values.length - 1];
  const change = last - first;
  const changePct = first > 0 ? ((change / first) * 100).toFixed(1) : '0.0';
  const isUp = change >= 0;

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}

      <View style={styles.summaryRow}>
        <Text style={styles.currentValue}>{formatUsd(last)}</Text>
        <View style={[styles.changeBadge, { backgroundColor: isUp ? '#f0fdf4' : '#fef2f2' }]}>
          <Text style={[styles.changeText, { color: isUp ? '#16a34a' : '#dc2626' }]}>
            {isUp ? '+' : ''}{changePct}%
          </Text>
        </View>
      </View>

      <LineChart
        data={{
          labels,
          datasets: [{ data: values, color: () => color, strokeWidth: 2 }],
        }}
        width={SCREEN_WIDTH - 48}
        height={height}
        chartConfig={{
          backgroundColor: '#fff',
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          decimalPlaces: 0,
          color: () => color,
          labelColor: () => '#9ca3af',
          propsForDots: {
            r: '3',
            strokeWidth: '1',
            stroke: color,
          },
          propsForBackgroundLines: {
            stroke: '#f3f4f6',
          },
          formatYLabel: (val) => {
            const num = Number(val);
            if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
            return val;
          },
        }}
        bezier
        style={styles.chart}
        withInnerLines={true}
        withOuterLines={false}
        withVerticalLabels={true}
        withHorizontalLabels={true}
        fromZero={false}
      />
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
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  currentValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  changeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  changeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  chart: {
    marginLeft: -16,
    borderRadius: 8,
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
