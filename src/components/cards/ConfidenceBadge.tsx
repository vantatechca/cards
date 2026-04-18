import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getConfidenceColor, getConfidenceLabel } from '../../types/pricing';

interface Props {
  confidence: number | null;
  size?: 'small' | 'medium';
}

export function ConfidenceBadge({ confidence, size = 'medium' }: Props) {
  if (confidence == null) {
    return (
      <View style={[styles.badge, { backgroundColor: '#f3f4f6' }]}>
        <Text style={[styles.text, size === 'small' && styles.textSmall, { color: '#6b7280' }]}>
          N/A
        </Text>
      </View>
    );
  }

  const color = getConfidenceColor(confidence);
  const label = getConfidenceLabel(confidence);

  return (
    <View style={[styles.badge, { backgroundColor: color + '15' }]}>
      <Text style={[styles.text, size === 'small' && styles.textSmall, { color }]}>
        {confidence}% - {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
  textSmall: {
    fontSize: 11,
  },
});
