import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useCards } from '../../hooks/useCards';
import { Card } from '../../types/card';
import { formatUsd } from '../../utils/formatters';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfidenceBadge } from '../../components/cards/ConfidenceBadge';

function SellCardRow({ card, feePct }: { card: Card; feePct: number }) {
  const value = card.estimated_value_usd ?? 0;
  const fees = Math.round(value * feePct) / 100;
  const net = value - fees;

  return (
    <View style={styles.cardRow}>
      <View style={styles.cardRowLeft}>
        {card.photo_url_front ? (
          <Image source={{ uri: card.photo_url_front }} style={styles.thumb} />
        ) : (
          <View style={styles.thumbPlaceholder} />
        )}
        <View style={styles.cardRowInfo}>
          <Text style={styles.cardName} numberOfLines={1}>{card.card_name}</Text>
          <Text style={styles.cardSet} numberOfLines={1}>
            {card.set_name} {card.year ? `(${card.year})` : ''}
          </Text>
          <ConfidenceBadge confidence={card.value_confidence_pct} size="small" />
        </View>
      </View>
      <View style={styles.cardRowRight}>
        <Text style={styles.estPrice}>{formatUsd(value)}</Text>
        <Text style={styles.fees}>Fees ~{formatUsd(fees)}</Text>
        <Text style={styles.netPrice}>Net: {formatUsd(net)}</Text>
      </View>
    </View>
  );
}

function PrioritySection({
  title,
  description,
  bgColor,
  textColor,
  cards,
}: {
  title: string;
  description: string;
  bgColor: string;
  textColor: string;
  cards: Card[];
}) {
  const totalValue = cards.reduce((s, c) => s + (c.estimated_value_usd ?? 0), 0);

  return (
    <View style={styles.prioritySection}>
      <View style={[styles.priorityHeader, { backgroundColor: bgColor }]}>
        <Text style={[styles.priorityLabel, { color: textColor }]}>{title}</Text>
        <Text style={styles.priorityDesc}>{description}</Text>
        {cards.length > 0 && (
          <Text style={[styles.priorityTotal, { color: textColor }]}>
            {cards.length} cards - Total: {formatUsd(totalValue)}
          </Text>
        )}
      </View>
      {cards.length === 0 ? (
        <Text style={styles.emptyText}>No cards in this category.</Text>
      ) : (
        cards.map((card) => (
          <SellCardRow key={card.id} card={card} feePct={13} />
        ))
      )}
    </View>
  );
}

export function SellDecisionScreen() {
  const { data: allCards = [] } = useCards();

  const sellNowCards = allCards.filter((c) => c.ai_recommendation === 'sell_now');
  const watchCards = allCards.filter((c) => c.ai_recommendation === 'watch');

  // Priority 1: sell_now (simulating "declining" trend for demo)
  const priority1 = sellNowCards.slice(0, Math.ceil(sellNowCards.length / 2));
  // Priority 2: remaining sell_now (stable)
  const priority2 = sellNowCards.slice(Math.ceil(sellNowCards.length / 2));
  // Priority 3: watch cards
  const priority3 = watchCards;

  const totalSellValue = sellNowCards.reduce((s, c) => s + (c.estimated_value_usd ?? 0), 0);
  const totalFees = Math.round(totalSellValue * 0.13 * 100) / 100;
  const totalNet = totalSellValue - totalFees;

  if (sellNowCards.length === 0 && watchCards.length === 0) {
    return (
      <EmptyState
        title="No Sell Recommendations"
        message="Once you have cards scanned and priced, sell recommendations will appear here sorted by urgency."
      />
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Summary */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Sell Value</Text>
          <Text style={styles.summaryValue}>{formatUsd(totalSellValue)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Est. Fees (~13%)</Text>
          <Text style={[styles.summaryValue, { color: '#dc2626' }]}>-{formatUsd(totalFees)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Net Proceeds</Text>
          <Text style={[styles.summaryValue, { color: '#059669' }]}>{formatUsd(totalNet)}</Text>
        </View>
      </View>

      <PrioritySection
        title="Priority 1 - Sell Immediately"
        description="Price trend declining - sell ASAP"
        bgColor="#fef2f2"
        textColor="#dc2626"
        cards={priority1}
      />

      <PrioritySection
        title="Priority 2 - Sell When Ready"
        description="Price stable - sell at your convenience"
        bgColor="#fefce8"
        textColor="#ca8a04"
        cards={priority2}
      />

      <PrioritySection
        title="Priority 3 - Monitor"
        description="Watch list - may become sell candidates"
        bgColor="#f3f4f6"
        textColor="#6b7280"
        cards={priority3}
      />

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  summaryBar: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: '#6b7280', fontWeight: '500' },
  summaryValue: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 4 },
  prioritySection: { marginBottom: 8 },
  priorityHeader: { padding: 16, marginHorizontal: 16, marginTop: 16, borderRadius: 10 },
  priorityLabel: { fontSize: 16, fontWeight: '700' },
  priorityDesc: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  priorityTotal: { fontSize: 14, fontWeight: '600', marginTop: 8 },
  emptyText: { fontSize: 14, color: '#9ca3af', fontStyle: 'italic', paddingHorizontal: 16, paddingVertical: 12 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 8, padding: 12, borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1, elevation: 1 },
  cardRowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  thumb: { width: 36, height: 50, borderRadius: 4 },
  thumbPlaceholder: { width: 36, height: 50, borderRadius: 4, backgroundColor: '#e5e7eb' },
  cardRowInfo: { marginLeft: 10, flex: 1 },
  cardName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  cardSet: { fontSize: 12, color: '#6b7280', marginTop: 2, marginBottom: 4 },
  cardRowRight: { alignItems: 'flex-end', marginLeft: 8 },
  estPrice: { fontSize: 15, fontWeight: '700', color: '#111827' },
  fees: { fontSize: 11, color: '#dc2626', marginTop: 2 },
  netPrice: { fontSize: 12, fontWeight: '600', color: '#059669', marginTop: 2 },
});
