import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { CollectionStackParamList } from '../../types/navigation';
import { Card, CollectionType, Recommendation } from '../../types/card';
import { useCards, useDeleteCard, useUpdateCard } from '../../hooks/useCards';
import { useCollectionStore } from '../../stores/useCollectionStore';
import { SortKey } from '../../utils/constants';
import { CardThumbnail } from '../../components/cards/CardThumbnail';
import { CollectionTabs } from '../../components/filters/CollectionTabs';
import { SortPicker } from '../../components/filters/SortPicker';
import { EmptyState } from '../../components/common/EmptyState';
import { useCurrency } from '../../hooks/useCurrency';
import { usdToCad, formatUsd, formatCad } from '../../utils/formatters';

type Props = NativeStackScreenProps<CollectionStackParamList, 'CollectionGrid'>;

function CollectionSummary({ cards }: { cards: Card[] }) {
  const { currency, formatValue } = useCurrency();
  const totalUsd = cards.reduce((s, c) => s + (Number(c.estimated_value_usd) || 0), 0);
  const totalCad = cards.reduce((s, c) => s + (Number(c.estimated_value_cad) || usdToCad(Number(c.estimated_value_usd) || 0)), 0);
  const confidences = cards.map((c) => c.value_confidence_pct).filter((v): v is number => v != null);
  const avgConf = confidences.length > 0 ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length) : 0;

  return (
    <View style={styles.summary}>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryValue}>{cards.length}</Text>
        <Text style={styles.summaryLabel}>Cards</Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryItem}>
        <Text style={styles.summaryValue}>{formatValue(totalUsd, totalCad)}</Text>
        <Text style={styles.summaryLabel}>{currency === 'USD' ? formatCad(totalCad) : formatUsd(totalUsd)}</Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryItem}>
        <Text style={styles.summaryValue}>{avgConf}%</Text>
        <Text style={styles.summaryLabel}>Avg Confidence</Text>
      </View>
    </View>
  );
}

export function CollectionGridScreen({ navigation }: Props) {
  const rootNavigation = useNavigation<any>();
  const { activeTab, sortBy, selectedCardIds, isMultiSelectMode, setActiveTab, setSortBy, toggleCardSelection, clearSelection, setMultiSelectMode } = useCollectionStore();
  const collectionType = activeTab === 'all' ? undefined : activeTab;
  const { data: allCards = [], refetch: refetchAll } = useCards();
  const { data: cards = [], isLoading, refetch: refetchFiltered } = useCards(collectionType);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchAll(), refetchFiltered()]);
    setRefreshing(false);
  }, [refetchAll, refetchFiltered]);
  const deleteCard = useDeleteCard();
  const updateCard = useUpdateCard();

  const RECOMMENDATION_ORDER: Record<Recommendation, number> = {
    sell_now: 0,
    watch: 1,
    hold: 2,
    buy_more: 3,
  };

  const sortedCards = useMemo(() => {
    const sorted = [...cards];
    switch (sortBy) {
      case 'value_desc':
        sorted.sort((a, b) => (b.estimated_value_usd ?? 0) - (a.estimated_value_usd ?? 0));
        break;
      case 'value_asc':
        sorted.sort((a, b) => (a.estimated_value_usd ?? 0) - (b.estimated_value_usd ?? 0));
        break;
      case 'date_desc':
        sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
        break;
      case 'date_asc':
        sorted.sort((a, b) => a.created_at.localeCompare(b.created_at));
        break;
      case 'name_asc':
        sorted.sort((a, b) => a.card_name.localeCompare(b.card_name));
        break;
      case 'confidence_desc':
        sorted.sort((a, b) => (b.value_confidence_pct ?? 0) - (a.value_confidence_pct ?? 0));
        break;
      case 'psa_desc':
        sorted.sort((a, b) => (b.condition_psa_estimate ?? 0) - (a.condition_psa_estimate ?? 0));
        break;
      case 'recommendation':
        sorted.sort((a, b) =>
          (RECOMMENDATION_ORDER[a.ai_recommendation ?? 'hold'] ?? 2) -
          (RECOMMENDATION_ORDER[b.ai_recommendation ?? 'hold'] ?? 2)
        );
        break;
    }
    return sorted;
  }, [cards, sortBy]);

  const counts = useMemo(() => ({
    all: allCards.length,
    hockey: allCards.filter((c) => c.collection_type === 'hockey').length,
    magic: allCards.filter((c) => c.collection_type === 'magic').length,
    yugioh: allCards.filter((c) => c.collection_type === 'yugioh').length,
  }), [allCards]);

  const handleCardPress = useCallback((card: Card) => {
    if (isMultiSelectMode) {
      toggleCardSelection(card.id);
    } else {
      navigation.navigate('CardDetail', { cardId: card.id });
    }
  }, [isMultiSelectMode, navigation, toggleCardSelection]);

  const handleLongPress = useCallback((card: Card) => {
    if (!isMultiSelectMode) {
      setMultiSelectMode(true);
      toggleCardSelection(card.id);
    }
  }, [isMultiSelectMode, setMultiSelectMode, toggleCardSelection]);

  const handleBulkDelete = () => {
    Alert.alert(
      'Delete Selected',
      `Delete ${selectedCardIds.length} selected cards? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            for (const id of selectedCardIds) {
              await deleteCard.mutateAsync(id);
            }
            clearSelection();
          },
        },
      ]
    );
  };

  const handleBulkTag = () => {
    Alert.prompt?.(
      'Add Tag',
      'Enter a tag to add to all selected cards:',
      async (tag: string) => {
        if (!tag.trim()) return;
        for (const id of selectedCardIds) {
          const card = cards.find((c) => c.id === id);
          if (card) {
            await updateCard.mutateAsync({
              id,
              data: { tags: [...card.tags, tag.trim()] },
            });
          }
        }
        clearSelection();
      }
    ) ?? Alert.alert('Tag', 'Tagging feature — enter tags via card detail for now.');
  };

  const renderCard = useCallback(
    ({ item }: { item: Card }) => (
      <CardThumbnail
        card={item}
        onPress={() => handleCardPress(item)}
        onLongPress={() => handleLongPress(item)}
        isSelected={selectedCardIds.includes(item.id)}
      />
    ),
    [handleCardPress, handleLongPress, selectedCardIds]
  );

  return (
    <View style={styles.container}>
      {/* Multi-select toolbar */}
      {isMultiSelectMode && (
        <View style={styles.multiSelectBar}>
          <Text style={styles.multiSelectText}>{selectedCardIds.length} selected</Text>
          <View style={styles.multiSelectActions}>
            <TouchableOpacity style={styles.msBtn} onPress={handleBulkTag}>
              <Ionicons name="pricetag-outline" size={18} color="#2563eb" />
              <Text style={styles.msBtnText}>Tag</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.msBtn} onPress={handleBulkDelete}>
              <Ionicons name="trash-outline" size={18} color="#dc2626" />
              <Text style={[styles.msBtnText, { color: '#dc2626' }]}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.msBtn} onPress={clearSelection}>
              <Ionicons name="close" size={18} color="#6b7280" />
              <Text style={styles.msBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <CollectionTabs activeTab={activeTab} onTabChange={setActiveTab} counts={counts} />
      <CollectionSummary cards={sortedCards} />

      <View style={styles.toolbar}>
        <SortPicker value={sortBy} onChange={setSortBy} />
      </View>

      {sortedCards.length === 0 && !isLoading ? (
        <EmptyState
          title="No Cards Yet"
          message="Start scanning cards with the camera to build your collection."
          actionLabel="Scan a Card"
          onAction={() => rootNavigation.navigate('ScanTab')}
        />
      ) : (
        <FlatList
          data={sortedCards}
          renderItem={renderCard}
          numColumns={3}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          keyExtractor={(item) => item.id}
          extraData={selectedCardIds}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  multiSelectBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#bfdbfe',
  },
  multiSelectText: { fontSize: 14, fontWeight: '600', color: '#2563eb' },
  multiSelectActions: { flexDirection: 'row', gap: 16 },
  msBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  msBtnText: { fontSize: 13, fontWeight: '500', color: '#2563eb' },
  summary: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 4,
    borderRadius: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, backgroundColor: '#e5e7eb' },
  summaryValue: { fontSize: 16, fontWeight: '700', color: '#111827' },
  summaryLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  toolbar: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingVertical: 8 },
  grid: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  row: { gap: 8 },
});
