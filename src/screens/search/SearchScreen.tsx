import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SearchStackParamList } from '../../types/navigation';
import { useSearchCards, useCards } from '../../hooks/useCards';
import { Card, Recommendation } from '../../types/card';
import { CardThumbnail } from '../../components/cards/CardThumbnail';
import { EmptyState } from '../../components/common/EmptyState';
import { formatUsd } from '../../utils/formatters';

type Props = NativeStackScreenProps<SearchStackParamList, 'Search'>;

const SMART_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'high_value', label: '$100+' },
  { key: 'sell_now', label: 'Sell Now' },
  { key: 'low_confidence', label: 'Low Confidence' },
  { key: 'graded', label: 'Graded' },
  { key: 'favorites', label: 'Favorites' },
] as const;

type SmartFilter = (typeof SMART_FILTERS)[number]['key'];

export function SearchScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<SmartFilter>('all');
  const { data: searchResults = [] } = useSearchCards(query);
  const { data: allCards = [] } = useCards();

  // Apply smart filter on top of search
  const filteredCards = useMemo(() => {
    const base = query.length >= 2 ? searchResults : allCards;

    switch (activeFilter) {
      case 'high_value':
        return base.filter((c) => (c.estimated_value_usd ?? 0) >= 100);
      case 'sell_now':
        return base.filter((c) => c.ai_recommendation === 'sell_now');
      case 'low_confidence':
        return base.filter((c) => (c.value_confidence_pct ?? 0) < 50);
      case 'graded':
        return base.filter((c) => c.is_graded);
      case 'favorites':
        return base.filter((c) => c.tags.includes('keeper') || c.tags.includes('favorites'));
      default:
        return base;
    }
  }, [query, searchResults, allCards, activeFilter]);

  const totalValue = filteredCards.reduce((s, c) => s + (c.estimated_value_usd ?? 0), 0);

  const renderCard = useCallback(
    ({ item }: { item: Card }) => (
      <CardThumbnail
        card={item}
        onPress={() => navigation.navigate('CardDetail', { cardId: item.id })}
      />
    ),
    [navigation]
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Search cards by name, set, tags..."
          placeholderTextColor="#9ca3af"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Smart Filters */}
      <View style={styles.filterRow}>
        {SMART_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
            onPress={() => setActiveFilter(f.key)}
          >
            <Text style={[styles.filterChipText, activeFilter === f.key && styles.filterChipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Results Summary */}
      <View style={styles.resultsSummary}>
        <Text style={styles.resultsCount}>{filteredCards.length} cards</Text>
        <Text style={styles.resultsValue}>Total: {formatUsd(totalValue)}</Text>
      </View>

      {/* Results */}
      {filteredCards.length === 0 ? (
        <EmptyState
          title="No Results"
          message={query.length >= 2 ? `No cards found matching "${query}".` : 'No cards match the selected filter.'}
        />
      ) : (
        <FlatList
          data={filteredCards}
          renderItem={renderCard}
          numColumns={3}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.grid}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  searchIcon: { marginRight: 10 },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  resultsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  resultsCount: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  resultsValue: { fontSize: 13, color: '#059669', fontWeight: '600' },
  grid: { paddingHorizontal: 12, paddingTop: 4 },
});
