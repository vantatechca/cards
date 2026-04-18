import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../../types/navigation';
import { useCards, useUpdateCard } from '../../hooks/useCards';
import { priceCard } from '../../services/pricing/pricingEngine';
import { Card } from '../../types/card';
import { formatUsd } from '../../utils/formatters';

type Props = NativeStackScreenProps<SettingsStackParamList, 'BatchReprice'>;

type RepriceStatus = 'idle' | 'running' | 'done';

interface CardRepriceState {
  cardId: string;
  status: 'pending' | 'pricing' | 'done' | 'error';
  oldValue: number | null;
  newValue: number | null;
  error?: string;
}

export function BatchRepriceScreen({ navigation }: Props) {
  const { data: cards = [] } = useCards();
  const updateCard = useUpdateCard();
  const [status, setStatus] = useState<RepriceStatus>('idle');
  const [progress, setProgress] = useState<CardRepriceState[]>([]);
  const [processedCount, setProcessedCount] = useState(0);

  const totalCards = cards.length;
  const totalOldValue = cards.reduce((s, c) => s + (c.estimated_value_usd ?? 0), 0);
  const totalNewValue = progress.reduce((s, p) => s + (p.newValue ?? p.oldValue ?? 0), 0);
  const valueDiff = status === 'done' ? totalNewValue - totalOldValue : 0;

  const startReprice = useCallback(async () => {
    if (cards.length === 0) {
      Alert.alert('No Cards', 'Add cards to your collection before re-pricing.');
      return;
    }

    Alert.alert(
      'Re-price All Cards',
      `This will re-price all ${cards.length} cards in your collection. This may take a while.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: async () => {
            setStatus('running');
            const initialStates: CardRepriceState[] = cards.map((c) => ({
              cardId: c.id,
              status: 'pending',
              oldValue: c.estimated_value_usd,
              newValue: null,
            }));
            setProgress(initialStates);
            setProcessedCount(0);

            for (let i = 0; i < cards.length; i++) {
              const card = cards[i];
              setProgress((prev) =>
                prev.map((p) =>
                  p.cardId === card.id ? { ...p, status: 'pricing' } : p,
                ),
              );

              try {
                const result = await priceCard({
                  card_name: card.card_name,
                  set_name: card.set_name,
                  collection_type: card.collection_type,
                  card_number: card.card_number,
                  edition: card.edition,
                  condition_psa_estimate: card.condition_psa_estimate,
                  ai_confidence_identification: card.ai_confidence_identification,
                });

                await updateCard.mutateAsync({
                  id: card.id,
                  data: {
                    estimated_value_usd: result.estimatedValueUsd,
                    estimated_value_cad: result.estimatedValueCad,
                    value_confidence_pct: result.confidencePct,
                    value_source_breakdown: result.breakdown as any,
                    proof_links: result.proofLinks,
                    last_valued_at: new Date().toISOString(),
                  },
                });

                setProgress((prev) =>
                  prev.map((p) =>
                    p.cardId === card.id
                      ? { ...p, status: 'done', newValue: result.estimatedValueUsd }
                      : p,
                  ),
                );
              } catch (err) {
                setProgress((prev) =>
                  prev.map((p) =>
                    p.cardId === card.id
                      ? { ...p, status: 'error', error: 'Failed to price' }
                      : p,
                  ),
                );
              }

              setProcessedCount(i + 1);
            }

            setStatus('done');
          },
        },
      ],
    );
  }, [cards, updateCard]);

  const getCardName = (cardId: string) =>
    cards.find((c) => c.id === cardId)?.card_name ?? 'Unknown';

  const renderItem = useCallback(
    ({ item }: { item: CardRepriceState }) => {
      const statusIcon =
        item.status === 'done'
          ? 'checkmark-circle'
          : item.status === 'error'
            ? 'alert-circle'
            : item.status === 'pricing'
              ? 'sync'
              : 'time-outline';

      const statusColor =
        item.status === 'done'
          ? '#059669'
          : item.status === 'error'
            ? '#dc2626'
            : item.status === 'pricing'
              ? '#2563eb'
              : '#9ca3af';

      const priceChange = item.newValue != null && item.oldValue != null
        ? item.newValue - item.oldValue
        : null;

      return (
        <View style={styles.cardRow}>
          <Ionicons name={statusIcon} size={20} color={statusColor} />
          <View style={styles.cardRowInfo}>
            <Text style={styles.cardName} numberOfLines={1}>
              {getCardName(item.cardId)}
            </Text>
            <Text style={styles.cardPrice}>
              {formatUsd(item.oldValue)}
              {item.newValue != null && (
                <>
                  {' -> '}{formatUsd(item.newValue)}
                  {priceChange != null && priceChange !== 0 && (
                    <Text style={{ color: priceChange > 0 ? '#059669' : '#dc2626' }}>
                      {' '}({priceChange > 0 ? '+' : ''}{formatUsd(priceChange)})
                    </Text>
                  )}
                </>
              )}
            </Text>
          </View>
          {item.status === 'pricing' && (
            <ActivityIndicator size="small" color="#2563eb" />
          )}
        </View>
      );
    },
    [cards],
  );

  return (
    <View style={styles.container}>
      {/* Summary Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Batch Re-Price</Text>
        <Text style={styles.headerSub}>
          Re-price all {totalCards} cards against current market data
        </Text>
      </View>

      {/* Progress Bar */}
      {status === 'running' && (
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${totalCards > 0 ? (processedCount / totalCards) * 100 : 0}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {processedCount} / {totalCards} cards processed
          </Text>
        </View>
      )}

      {/* Results Summary */}
      {status === 'done' && (
        <View style={styles.resultsSummary}>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Previous</Text>
            <Text style={styles.resultValue}>{formatUsd(totalOldValue)}</Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color="#6b7280" />
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Updated</Text>
            <Text style={styles.resultValue}>{formatUsd(totalNewValue)}</Text>
          </View>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Change</Text>
            <Text
              style={[
                styles.resultValue,
                { color: valueDiff >= 0 ? '#059669' : '#dc2626' },
              ]}
            >
              {valueDiff >= 0 ? '+' : ''}{formatUsd(valueDiff)}
            </Text>
          </View>
        </View>
      )}

      {/* Card List */}
      {progress.length > 0 && (
        <FlatList
          data={progress}
          renderItem={renderItem}
          keyExtractor={(item) => item.cardId}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Start Button */}
      {status === 'idle' && (
        <View style={styles.ctaSection}>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#2563eb" />
            <Text style={styles.infoText}>
              Cards are re-priced sequentially. You can leave this screen and come back — pricing happens in the background.
            </Text>
          </View>
          <TouchableOpacity style={styles.startBtn} onPress={startReprice}>
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.startBtnText}>
              Re-Price {totalCards} Cards
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Done button */}
      {status === 'done' && (
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    backgroundColor: '#1e3a5f',
    padding: 24,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  headerSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  progressSection: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  resultsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  resultItem: { alignItems: 'center' },
  resultLabel: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  resultValue: { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 2 },
  list: { padding: 12 },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardRowInfo: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  cardPrice: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  ctaSection: { padding: 24, gap: 16 },
  infoBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#eff6ff',
    padding: 14,
    borderRadius: 10,
  },
  infoText: { flex: 1, fontSize: 13, color: '#1e40af', lineHeight: 20 },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#2563eb',
    borderRadius: 14,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  startBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  doneBtn: {
    marginHorizontal: 24,
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: '#059669',
    borderRadius: 14,
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
});
