import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Card } from '../../types/card';
import { formatUsd } from '../../utils/formatters';
import { ConfidenceBadge } from './ConfidenceBadge';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 3; // 3 columns with padding
const CARD_HEIGHT = CARD_WIDTH * 1.4;

interface Props {
  card: Card;
  onPress: () => void;
  onLongPress?: () => void;
  isSelected?: boolean;
}

function isPriceStale(lastValued: string | null): boolean {
  if (!lastValued) return true;
  const daysSince = (Date.now() - new Date(lastValued).getTime()) / (1000 * 60 * 60 * 24);
  return daysSince > 30;
}

export function CardThumbnail({ card, onPress, onLongPress, isSelected }: Props) {
  const stale = isPriceStale(card.last_valued_at);

  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.selected]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        {card.photo_url_front ? (
          <Image source={{ uri: card.photo_url_front }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
        {stale && (
          <View style={styles.staleBadge}>
            <Text style={styles.staleBadgeText}>Stale</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {card.card_name}
        </Text>
        <Text style={[styles.price, stale && styles.priceStale]}>
          {formatUsd(card.estimated_value_usd)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selected: {
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  imageContainer: {
    width: '100%',
    height: CARD_HEIGHT,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#9ca3af',
    fontSize: 11,
  },
  info: {
    padding: 6,
  },
  name: {
    fontSize: 11,
    fontWeight: '600',
    color: '#111827',
  },
  price: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
    marginTop: 2,
  },
  priceStale: {
    color: '#d97706',
  },
  staleBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#f59e0b',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  staleBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
});
