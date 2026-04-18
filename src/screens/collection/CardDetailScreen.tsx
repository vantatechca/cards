import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Linking, Alert, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCard, useUpdateCard, useDeleteCard } from '../../hooks/useCards';
import { usePriceCard, usePriceHistory } from '../../hooks/usePricing';
import { getRecommendation } from '../../services/ai/recommendationService';
import { CardPhoto } from '../../components/cards/CardPhoto';
import { ConfidenceBadge } from '../../components/cards/ConfidenceBadge';
import { RecommendationBadge } from '../../components/cards/RecommendationBadge';
import { PriceDisplay } from '../../components/cards/PriceDisplay';
import { ConditionBar } from '../../components/cards/ConditionBar';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { formatDate, formatUsd, formatRelativeDate } from '../../utils/formatters';
import { COLLECTION_LABELS } from '../../utils/constants';

// Shared param list shape — works in both CollectionStack and SearchStack
type CardDetailParamList = {
  CardDetail: { cardId: string };
  CardEdit: { cardId: string };
};

type Props = {
  route: { params: { cardId: string } };
  navigation: NativeStackNavigationProp<CardDetailParamList, 'CardDetail'>;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value ?? 'N/A'}</Text>
    </View>
  );
}

export function CardDetailScreen({ route, navigation }: Props) {
  const { cardId } = route.params;
  const { data: card, isLoading, refetch } = useCard(cardId);
  const priceCard = usePriceCard();
  const updateCard = useUpdateCard();
  const deleteCard = useDeleteCard();
  const { data: priceHistory = [] } = usePriceHistory(cardId);

  const [refreshing, setRefreshing] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [showManualPrice, setShowManualPrice] = useState(false);
  const [manualPriceInput, setManualPriceInput] = useState('');

  if (isLoading || !card) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const isHighValue = (card.estimated_value_usd ?? 0) >= 1000;
  const daysSincePrice = card.last_valued_at
    ? Math.floor((Date.now() - new Date(card.last_valued_at).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const isStalePrice = daysSincePrice === null || daysSincePrice > 30;

  const handleRefreshPrice = async () => {
    setRefreshing(true);
    try {
      const result = await priceCard.mutateAsync(card);

      // Also refresh recommendation (best-effort)
      let recUpdate: Record<string, any> = {};
      try {
        const rec = await getRecommendation({
          card_name: card.card_name,
          set_name: card.set_name ?? '',
          year: card.year ?? 0,
          edition: card.edition ?? '',
          psa_estimate: card.condition_psa_estimate ?? 5,
          condition_simple: card.condition_simple ?? 'Good',
          estimated_value_usd: result.estimatedValueUsd ?? 0,
          value_confidence_pct: result.confidencePct,
        });
        recUpdate = {
          ai_recommendation: rec.recommendation,
          ai_recommendation_reasoning: rec.reasoning,
        };
      } catch {
        // Non-blocking
      }

      await updateCard.mutateAsync({
        id: card.id,
        data: {
          estimated_value_usd: result.estimatedValueUsd,
          estimated_value_cad: result.estimatedValueCad,
          value_confidence_pct: result.confidencePct,
          proof_links: result.proofLinks,
          value_source_breakdown: result.breakdown as any,
          last_valued_at: new Date().toISOString(),
          ...recUpdate,
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refetch();
    } catch (err) {
      Alert.alert('Pricing Failed', 'Could not refresh the price. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleManualPrice = async () => {
    const value = parseFloat(manualPriceInput);
    if (isNaN(value) || value < 0) {
      Alert.alert('Invalid Price', 'Enter a valid USD amount.');
      return;
    }
    try {
      await updateCard.mutateAsync({
        id: card.id,
        data: {
          estimated_value_usd: value,
          estimated_value_cad: Math.round(value * 1.36 * 100) / 100,
          value_confidence_pct: 100,
          last_valued_at: new Date().toISOString(),
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowManualPrice(false);
      setManualPriceInput('');
      refetch();
    } catch {
      Alert.alert('Error', 'Could not save manual price.');
    }
  };

  const handleDelete = async () => {
    setDeleteDialogVisible(false);
    try {
      await deleteCard.mutateAsync(card.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Delete Failed', 'Could not delete the card. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* High Value Banner */}
      {isHighValue && (
        <View style={styles.highValueBanner}>
          <Text style={styles.highValueTitle}>High Value Card</Text>
          <Text style={styles.highValueText}>
            Estimated at {formatUsd(card.estimated_value_usd)}. Consider professional grading if raw.
          </Text>
        </View>
      )}

      {/* Stale Price Banner */}
      {isStalePrice && (
        <TouchableOpacity style={styles.staleBanner} onPress={handleRefreshPrice} disabled={refreshing}>
          <Text style={styles.staleBannerText}>
            {daysSincePrice === null
              ? 'Price has never been checked.'
              : `Price is ${daysSincePrice} days old.`}
            {' '}Tap to refresh.
          </Text>
        </TouchableOpacity>
      )}

      {/* Photos */}
      {card.photo_url_front && <CardPhoto uri={card.photo_url_front} />}
      {card.photo_url_back && (
        <View style={styles.backPhotoContainer}>
          <Text style={styles.backPhotoLabel}>Back</Text>
          <CardPhoto uri={card.photo_url_back} />
        </View>
      )}

      {/* Identification */}
      <Section title="Card Information">
        <InfoRow label="Name" value={card.card_name} />
        <InfoRow label="Collection" value={COLLECTION_LABELS[card.collection_type]} />
        <InfoRow label="Set" value={card.set_name} />
        <InfoRow label="Year" value={card.year?.toString()} />
        <InfoRow label="Number" value={card.card_number} />
        <InfoRow label="Edition" value={card.edition} />
        <InfoRow label="Rarity" value={card.rarity} />
        <InfoRow label="Language" value={card.language} />
      </Section>

      {/* Condition */}
      <Section title="Condition">
        <ConditionBar psaEstimate={card.condition_psa_estimate} />
        <View style={{ height: 8 }} />
        <InfoRow label="Grade" value={card.condition_simple} />
        {card.condition_notes && <Text style={styles.notes}>{card.condition_notes}</Text>}
        {card.is_graded && (
          <>
            <InfoRow label="Grading Company" value={card.grading_company} />
            <InfoRow label="Graded Score" value={card.graded_score?.toString()} />
            <InfoRow label="Cert #" value={card.grading_cert_number} />
          </>
        )}
      </Section>

      {/* Valuation */}
      <Section title="Valuation">
        <PriceDisplay usd={card.estimated_value_usd} cad={card.estimated_value_cad} size="large" />
        <View style={{ height: 8 }} />
        <ConfidenceBadge confidence={card.value_confidence_pct} />
        <InfoRow label="Last Priced" value={card.last_valued_at ? formatRelativeDate(card.last_valued_at) : 'Never'} />

        <View style={styles.valuationActions}>
          <TouchableOpacity
            style={[styles.refreshBtn, refreshing && styles.refreshBtnDisabled]}
            onPress={handleRefreshPrice}
            disabled={refreshing}
          >
            {refreshing ? (
              <View style={styles.refreshRow}>
                <ActivityIndicator size="small" color="#2563eb" />
                <Text style={styles.refreshText}> Refreshing...</Text>
              </View>
            ) : (
              <Text style={styles.refreshText}>Refresh Price</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.manualBtn}
            onPress={() => setShowManualPrice(!showManualPrice)}
          >
            <Text style={styles.manualBtnText}>
              {showManualPrice ? 'Cancel' : 'Set Manual Price'}
            </Text>
          </TouchableOpacity>
        </View>

        {showManualPrice && (
          <View style={styles.manualPriceRow}>
            <Text style={styles.manualDollar}>$</Text>
            <TextInput
              style={styles.manualInput}
              value={manualPriceInput}
              onChangeText={setManualPriceInput}
              placeholder="0.00"
              keyboardType="decimal-pad"
              autoFocus
            />
            <TouchableOpacity style={styles.manualSaveBtn} onPress={handleManualPrice}>
              <Text style={styles.manualSaveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        )}
      </Section>

      {/* Source Breakdown */}
      {card.value_source_breakdown && (
        <Section title="Price Sources">
          {card.value_source_breakdown.ebay && (
            <InfoRow label="eBay (median)" value={formatUsd(card.value_source_breakdown.ebay.median)} />
          )}
          {card.value_source_breakdown.tcgplayer && (
            <InfoRow label="TCGPlayer (market)" value={formatUsd(card.value_source_breakdown.tcgplayer.market)} />
          )}
          {card.value_source_breakdown.cardmarket && (
            <InfoRow label="CardMarket (trend)" value={formatUsd(card.value_source_breakdown.cardmarket.trend)} />
          )}
        </Section>
      )}

      {/* Proof Links */}
      {card.proof_links && card.proof_links.length > 0 && (
        <Section title="Price Proof">
          {card.proof_links.slice(0, 10).map((link, i) => (
            <TouchableOpacity key={i} style={styles.proofLink} onPress={() => Linking.openURL(link.url)}>
              <Text style={styles.proofTitle} numberOfLines={1}>{link.title}</Text>
              <Text style={styles.proofPrice}>{formatUsd(link.price)} - {link.date}</Text>
            </TouchableOpacity>
          ))}
        </Section>
      )}

      {/* Price History */}
      {priceHistory.length > 0 && (
        <Section title="Price History">
          {priceHistory.slice(0, 10).map((check) => (
            <View key={check.id} style={styles.historyRow}>
              <View>
                <Text style={styles.historySource}>{check.source.replace('_', ' ').toUpperCase()}</Text>
                <Text style={styles.historyDate}>{formatDate(check.checked_at)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.historyPrice}>{formatUsd(check.median_sold_price_usd)}</Text>
                <Text style={styles.historyCount}>{check.results_found} results</Text>
              </View>
            </View>
          ))}
        </Section>
      )}

      {/* Recommendation */}
      <Section title="Recommendation">
        <RecommendationBadge recommendation={card.ai_recommendation} />
        {card.ai_recommendation_reasoning && (
          <Text style={styles.reasoning}>{card.ai_recommendation_reasoning}</Text>
        )}
      </Section>

      {/* Details */}
      <Section title="Details">
        <InfoRow label="Location" value={card.location} />
        <InfoRow label="Tags" value={card.tags?.join(', ') || 'None'} />
        {card.notes && <Text style={styles.notes}>{card.notes}</Text>}
        <InfoRow label="Added" value={formatDate(card.created_at)} />
      </Section>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionBtn, styles.editBtn]} onPress={() => navigation.navigate('CardEdit', { cardId: card.id })}>
          <Text style={styles.editBtnText}>Edit Card</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={handleRefreshPrice} disabled={refreshing}>
          <Text style={styles.actionText}>Refresh Price</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.dangerBtn]} onPress={() => setDeleteDialogVisible(true)}>
          <Text style={styles.dangerText}>Delete Card</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />

      {/* Delete Confirmation */}
      <ConfirmDialog
        visible={deleteDialogVisible}
        title="Delete Card"
        message={`Are you sure you want to delete "${card.card_name}"? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  highValueBanner: { backgroundColor: '#fef3c7', padding: 14, borderBottomWidth: 1, borderBottomColor: '#fcd34d' },
  highValueTitle: { fontSize: 15, fontWeight: '700', color: '#92400e' },
  highValueText: { fontSize: 13, color: '#92400e', marginTop: 4 },
  backPhotoContainer: { borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  backPhotoLabel: { fontSize: 12, fontWeight: '600', color: '#9ca3af', textAlign: 'center', paddingTop: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  staleBanner: { backgroundColor: '#fff7ed', padding: 12, borderBottomWidth: 1, borderBottomColor: '#fed7aa' },
  staleBannerText: { fontSize: 13, fontWeight: '500', color: '#c2410c', textAlign: 'center' },
  section: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabel: { fontSize: 14, color: '#6b7280' },
  infoValue: { fontSize: 14, color: '#111827', fontWeight: '500', maxWidth: '60%', textAlign: 'right' } as any,
  notes: { fontSize: 13, color: '#6b7280', lineHeight: 20, marginTop: 8 },
  reasoning: { fontSize: 14, color: '#374151', lineHeight: 22, marginTop: 8 },
  valuationActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  refreshBtn: { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#eff6ff', borderRadius: 8 },
  refreshBtnDisabled: { opacity: 0.6 },
  refreshRow: { flexDirection: 'row', alignItems: 'center' },
  refreshText: { color: '#2563eb', fontWeight: '600', fontSize: 14 },
  manualBtn: { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#f3f4f6', borderRadius: 8 },
  manualBtnText: { color: '#374151', fontWeight: '600', fontSize: 14 },
  manualPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, backgroundColor: '#f9fafb', padding: 12, borderRadius: 10 },
  manualDollar: { fontSize: 18, fontWeight: '700', color: '#374151' },
  manualInput: { flex: 1, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 18, fontWeight: '600', color: '#111827', borderWidth: 1, borderColor: '#d1d5db' },
  manualSaveBtn: { backgroundColor: '#059669', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  manualSaveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  proofLink: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  proofTitle: { fontSize: 13, color: '#2563eb' },
  proofPrice: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  historySource: { fontSize: 12, fontWeight: '600', color: '#374151', textTransform: 'capitalize' } as any,
  historyDate: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  historyPrice: { fontSize: 14, fontWeight: '700', color: '#111827' },
  historyCount: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  actions: { padding: 16, gap: 10 },
  actionBtn: { paddingVertical: 14, paddingHorizontal: 16, backgroundColor: '#f3f4f6', borderRadius: 10, alignItems: 'center' },
  actionText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  editBtn: { backgroundColor: '#eff6ff' },
  editBtnText: { fontSize: 15, fontWeight: '600', color: '#2563eb' },
  dangerBtn: { backgroundColor: '#fef2f2' },
  dangerText: { fontSize: 15, fontWeight: '600', color: '#dc2626' },
});
