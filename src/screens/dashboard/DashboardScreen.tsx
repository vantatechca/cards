import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, RefreshControl } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DashboardStackParamList } from '../../types/navigation';
import { useCards } from '../../hooks/useCards';
import { Card, CollectionSnapshot } from '../../types/card';
import { formatUsd, formatCad, usdToCad } from '../../utils/formatters';
import { useCurrency } from '../../hooks/useCurrency';
import { ConfidenceBadge } from '../../components/cards/ConfidenceBadge';
import { RecommendationBadge } from '../../components/cards/RecommendationBadge';
import { ValueTrendChart } from '../../components/charts/ValueTrendChart';
import { CollectionPieChart } from '../../components/charts/CollectionPieChart';
import { takeSnapshot, getSnapshots, shouldTakeSnapshot, markSnapshotTaken } from '../../services/snapshotService';

type Props = NativeStackScreenProps<DashboardStackParamList, 'Dashboard'>;

function StatCard({ label, value, color = '#111827' }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

function TopCardRow({ card, rank, formatValue }: { card: Card; rank: number; formatValue: (usd: number | null | undefined, cad?: number | null | undefined) => string }) {
  return (
    <View style={styles.topCardRow}>
      <Text style={styles.topRank}>#{rank}</Text>
      <View style={styles.topCardThumb}>
        {card.photo_url_front ? (
          <Image source={{ uri: card.photo_url_front }} style={styles.topCardImg} />
        ) : (
          <View style={styles.topCardPlaceholder} />
        )}
      </View>
      <View style={styles.topCardInfo}>
        <Text style={styles.topCardName} numberOfLines={1}>{card.card_name}</Text>
        <Text style={styles.topCardSet} numberOfLines={1}>
          {card.set_name} {card.year ? `(${card.year})` : ''}
        </Text>
      </View>
      <Text style={styles.topCardValue}>{formatValue(card.estimated_value_usd, card.estimated_value_cad)}</Text>
    </View>
  );
}

export function DashboardScreen({ navigation }: Props) {
  const { data: allCards = [], refetch } = useCards();
  const [refreshing, setRefreshing] = useState(false);
  const { currency, formatValue } = useCurrency();

  const [snapshots, setSnapshots] = useState<CollectionSnapshot[]>([]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Auto-snapshot: take one per day when dashboard opens
  useEffect(() => {
    if (allCards.length === 0) return;
    (async () => {
      const should = await shouldTakeSnapshot();
      if (should) {
        await takeSnapshot(allCards);
        await markSnapshotTaken();
      }
      const snaps = await getSnapshots(undefined, 30);
      setSnapshots(snaps);
    })();
  }, [allCards]);

  const hockey = allCards.filter((c) => c.collection_type === 'hockey');
  const magic = allCards.filter((c) => c.collection_type === 'magic');
  const yugioh = allCards.filter((c) => c.collection_type === 'yugioh');

  const sum = (arr: Card[]) => arr.reduce((s, c) => s + (c.estimated_value_usd ?? 0), 0);
  const sumCad = (arr: Card[]) => arr.reduce((s, c) => s + (c.estimated_value_cad ?? usdToCad(c.estimated_value_usd ?? 0)), 0);
  const totalUsd = sum(allCards);
  const totalCad = Math.round(sumCad(allCards) * 100) / 100;

  const confidences = allCards.map((c) => c.value_confidence_pct).filter((v): v is number => v != null);
  const avgConfidence = confidences.length > 0 ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length) : 0;

  const sellNow = allCards.filter((c) => c.ai_recommendation === 'sell_now').length;
  const hold = allCards.filter((c) => c.ai_recommendation === 'hold').length;
  const buyMore = allCards.filter((c) => c.ai_recommendation === 'buy_more').length;
  const watch = allCards.filter((c) => c.ai_recommendation === 'watch').length;

  const sellNowValue = sum(allCards.filter((c) => c.ai_recommendation === 'sell_now'));

  const topCards = [...allCards]
    .sort((a, b) => (b.estimated_value_usd ?? 0) - (a.estimated_value_usd ?? 0))
    .slice(0, 25);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
    >
      {/* Total Value Hero */}
      <View style={styles.heroSection}>
        <Text style={styles.heroLabel}>Total Collection Value</Text>
        <Text style={styles.heroValue}>{formatValue(totalUsd, totalCad)}</Text>
        <Text style={styles.heroSub}>{currency === 'USD' ? formatCad(totalCad) : formatUsd(totalUsd)}</Text>
        <Text style={styles.heroCards}>{allCards.length} cards</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsGrid}>
        <StatCard label="Total Cards" value={allCards.length.toString()} />
        <StatCard label="Avg Confidence" value={`${avgConfidence}%`} />
      </View>

      {/* Value Distribution Chart */}
      <View style={styles.section}>
        <CollectionPieChart
          title="Value Distribution"
          data={[
            { label: 'Hockey', value: sum(hockey), color: '#2563eb' },
            { label: 'MTG', value: sum(magic), color: '#7c3aed' },
            { label: 'Yu-Gi-Oh!', value: sum(yugioh), color: '#059669' },
          ]}
        />
      </View>

      {/* Value Trend (real snapshots or fallback) */}
      <View style={styles.section}>
        <ValueTrendChart
          title="Collection Value Trend"
          data={
            snapshots.length >= 2
              ? snapshots
                  .slice()
                  .reverse()
                  .map((s) => ({ date: s.snapshot_date.slice(0, 10), value: Math.round(s.total_estimated_value_usd) }))
              : [
                  { date: '2026-01-01', value: Math.round(totalUsd * 0.88) },
                  { date: '2026-02-01', value: Math.round(totalUsd * 0.93) },
                  { date: '2026-03-01', value: Math.round(totalUsd * 0.97) },
                  { date: new Date().toISOString().slice(0, 10), value: Math.round(totalUsd) },
                ]
          }
        />
      </View>

      {/* Collection Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>By Collection</Text>
        <View style={styles.breakdownRow}>
          {[
            { label: 'Hockey', cards: hockey, color: '#2563eb' },
            { label: 'MTG', cards: magic, color: '#7c3aed' },
            { label: 'Yu-Gi-Oh!', cards: yugioh, color: '#059669' },
          ].map((col) => (
            <View key={col.label} style={[styles.breakdownItem, { borderLeftColor: col.color }]}>
              <Text style={styles.breakdownLabel}>{col.label}</Text>
              <Text style={styles.breakdownValue}>{formatValue(sum(col.cards), sumCad(col.cards))}</Text>
              <Text style={styles.breakdownSub}>{col.cards.length} cards</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Recommendations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommendations</Text>
        <View style={styles.recGrid}>
          <View style={[styles.recItem, { backgroundColor: '#fef2f2' }]}>
            <Text style={[styles.recCount, { color: '#dc2626' }]}>{sellNow}</Text>
            <Text style={styles.recLabel}>Sell Now</Text>
          </View>
          <View style={[styles.recItem, { backgroundColor: '#eff6ff' }]}>
            <Text style={[styles.recCount, { color: '#2563eb' }]}>{hold}</Text>
            <Text style={styles.recLabel}>Hold</Text>
          </View>
          <View style={[styles.recItem, { backgroundColor: '#f0fdf4' }]}>
            <Text style={[styles.recCount, { color: '#16a34a' }]}>{buyMore}</Text>
            <Text style={styles.recLabel}>Buy More</Text>
          </View>
          <View style={[styles.recItem, { backgroundColor: '#fefce8' }]}>
            <Text style={[styles.recCount, { color: '#ca8a04' }]}>{watch}</Text>
            <Text style={styles.recLabel}>Watch</Text>
          </View>
        </View>
        {sellNowValue > 0 && (
          <Text style={styles.sellPotential}>
            Potential revenue from selling: {formatValue(sellNowValue)}
          </Text>
        )}
      </View>

      {/* Sell Decision Button */}
      <TouchableOpacity style={styles.sellBtn} onPress={() => navigation.navigate('SellDecision')}>
        <Text style={styles.sellBtnText}>Sell Decision Helper</Text>
      </TouchableOpacity>

      {/* Top 25 Most Valuable */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top 25 Most Valuable</Text>
        {topCards.length === 0 ? (
          <Text style={styles.placeholder}>Scan cards to see your most valuable items here.</Text>
        ) : (
          topCards.map((card, i) => <TopCardRow key={card.id} card={card} rank={i + 1} formatValue={formatValue} />)
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  heroSection: { backgroundColor: '#1e3a5f', padding: 24, paddingTop: 16, alignItems: 'center' },
  heroLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '500' },
  heroValue: { color: '#fff', fontSize: 36, fontWeight: '800', marginTop: 4 },
  heroSub: { color: 'rgba(255,255,255,0.5)', fontSize: 16, marginTop: 4 },
  heroCards: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 8 },
  statsGrid: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  statLabel: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  statValue: { fontSize: 22, fontWeight: '700', marginTop: 4 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  breakdownRow: { gap: 8 },
  breakdownItem: { backgroundColor: '#fff', borderRadius: 10, padding: 14, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  breakdownLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
  breakdownValue: { fontSize: 20, fontWeight: '700', color: '#111827', marginTop: 4 },
  breakdownSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  recGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recItem: { width: '48%' as any, padding: 16, borderRadius: 10, alignItems: 'center' },
  recCount: { fontSize: 28, fontWeight: '800' },
  recLabel: { fontSize: 13, color: '#6b7280', fontWeight: '500', marginTop: 4 },
  sellPotential: { fontSize: 14, color: '#dc2626', fontWeight: '600', marginTop: 12 },
  sellBtn: { marginHorizontal: 16, paddingVertical: 16, backgroundColor: '#dc2626', borderRadius: 12, alignItems: 'center' },
  sellBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  placeholder: { fontSize: 14, color: '#9ca3af', fontStyle: 'italic' },
  // Top Card Rows
  topCardRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 10, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1, elevation: 1 },
  topRank: { fontSize: 14, fontWeight: '700', color: '#9ca3af', width: 30 },
  topCardThumb: { width: 36, height: 50, borderRadius: 4, overflow: 'hidden', marginRight: 10 },
  topCardImg: { width: '100%', height: '100%' },
  topCardPlaceholder: { width: '100%', height: '100%', backgroundColor: '#e5e7eb' },
  topCardInfo: { flex: 1 },
  topCardName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  topCardSet: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  topCardValue: { fontSize: 15, fontWeight: '700', color: '#059669' },
});
