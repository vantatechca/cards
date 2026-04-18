import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Recommendation } from '../../types/card';
import { RECOMMENDATION_CONFIG } from '../../utils/constants';

interface Props {
  recommendation: Recommendation | null;
}

export function RecommendationBadge({ recommendation }: Props) {
  if (!recommendation) {
    return (
      <View style={[styles.badge, { backgroundColor: '#f3f4f6' }]}>
        <Text style={[styles.text, { color: '#6b7280' }]}>No Recommendation</Text>
      </View>
    );
  }

  const config = RECOMMENDATION_CONFIG[recommendation];

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
  },
});
