import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatUsd, formatCad } from '../../utils/formatters';

interface Props {
  usd: number | null;
  cad?: number | null;
  size?: 'small' | 'large';
}

export function PriceDisplay({ usd, cad, size = 'small' }: Props) {
  return (
    <View>
      <Text style={[styles.usd, size === 'large' && styles.usdLarge]}>
        {formatUsd(usd)}
      </Text>
      {cad != null && (
        <Text style={styles.cad}>{formatCad(cad)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  usd: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  usdLarge: {
    fontSize: 28,
  },
  cad: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
});
