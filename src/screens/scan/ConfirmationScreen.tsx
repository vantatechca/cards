import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
  Linking,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScanStackParamList } from '../../types/navigation';
import { CardIdentificationResult, ConditionGradingResult } from '../../types/ai';
import { PricingResult } from '../../types/pricing';
import { Card } from '../../types/card';
import { identifyCard } from '../../services/ai/identificationService';
import { gradeCard } from '../../services/ai/gradingService';
import { getRecommendation } from '../../services/ai/recommendationService';
import { priceCard } from '../../services/pricing/pricingEngine';
import { checkDuplicate } from '../../services/supabase/cardRepository';
import { useCreateCard, useUpdateCard } from '../../hooks/useCards';
import { ConfidenceBadge } from '../../components/cards/ConfidenceBadge';
import { ConditionBar } from '../../components/cards/ConditionBar';
import { PriceDisplay } from '../../components/cards/PriceDisplay';
import { RecommendationBadge } from '../../components/cards/RecommendationBadge';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';
import { useScanStore } from '../../stores/useScanStore';
import { formatUsd } from '../../utils/formatters';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = NativeStackScreenProps<ScanStackParamList, 'Confirmation'>;

type ScreenPhase =
  | 'ai_processing'
  | 'review'
  | 'pricing'
  | 'priced'
  | 'saving'
  | 'saved';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function EditableField({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={`Enter ${label.toLowerCase()}`}
      />
    </View>
  );
}

function DuplicateBanner({
  existingCard,
  onAddDuplicate,
  onUpdateExisting,
}: {
  existingCard: Card;
  onAddDuplicate: () => void;
  onUpdateExisting: () => void;
}) {
  return (
    <View style={styles.duplicateBanner}>
      <Text style={styles.duplicateBannerTitle}>Duplicate Detected</Text>
      <Text style={styles.duplicateBannerText}>
        You already have this card in your collection.
      </Text>
      <View style={styles.duplicateBannerActions}>
        <TouchableOpacity
          style={styles.duplicateBtnAdd}
          onPress={onAddDuplicate}
        >
          <Text style={styles.duplicateBtnAddText}>Add as Duplicate</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.duplicateBtnUpdate}
          onPress={onUpdateExisting}
        >
          <Text style={styles.duplicateBtnUpdateText}>Update Existing</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function HighValueBanner() {
  return (
    <View style={styles.highValueBanner}>
      <Text style={styles.highValueTitle}>High Value Card!</Text>
      <Text style={styles.highValueText}>
        Consider professional grading if raw. A graded copy may command a
        significant premium.
      </Text>
    </View>
  );
}

function ProofLinkRow({
  title,
  price,
  url,
}: {
  title: string;
  price: number;
  url: string;
}) {
  return (
    <TouchableOpacity
      style={styles.proofRow}
      onPress={() => Linking.openURL(url)}
    >
      <Text style={styles.proofTitle} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.proofPrice}>{formatUsd(price)}</Text>
    </TouchableOpacity>
  );
}

function SuccessOverlay({
  card,
  pricing,
  onScanAnother,
}: {
  card: Card;
  pricing: PricingResult;
  onScanAnother: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.successOverlay,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.successCheckCircle}>
        <Text style={styles.successCheckMark}>✓</Text>
      </View>
      <Text style={styles.successTitle}>Card Saved!</Text>
      <Text style={styles.successSummary}>
        Added: {card.card_name}
        {card.set_name ? ` (${card.set_name}` : ''}
        {card.card_number ? ` #${card.card_number})` : card.set_name ? ')' : ''}
        {' — '}Estimated: {formatUsd(pricing.estimatedValueUsd)} (
        {pricing.confidencePct}% confidence)
      </Text>
      <TouchableOpacity style={styles.scanAnotherBtn} onPress={onScanAnother}>
        <Text style={styles.scanAnotherText}>Scan Another</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export function ConfirmationScreen({ route, navigation }: Props) {
  const { frontUri, backUri } = route.params;
  const { setStep, reset: resetScanStore } = useScanStore();
  const createCard = useCreateCard();
  const updateCard = useUpdateCard();

  // Phase & loading
  const [phase, setPhase] = useState<ScreenPhase>('ai_processing');
  const [loadingMessage, setLoadingMessage] = useState('Identifying card...');
  const [loadingStep, setLoadingStep] = useState(0);

  // AI results
  const [identification, setIdentification] =
    useState<CardIdentificationResult | null>(null);
  const [grading, setGrading] = useState<ConditionGradingResult | null>(null);

  // Editable fields
  const [cardName, setCardName] = useState('');
  const [setName, setSetName] = useState('');
  const [year, setYear] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [edition, setEdition] = useState('');
  const [rarity, setRarity] = useState('');

  // Pricing
  const [pricing, setPricing] = useState<PricingResult | null>(null);
  const [pricingError, setPricingError] = useState<string | null>(null);

  // Recommendation (fetched after pricing)
  const [recommendation, setRecommendation] = useState<Awaited<ReturnType<typeof getRecommendation>> | null>(null);

  // Duplicate detection
  const [duplicateCard, setDuplicateCard] = useState<Card | null>(null);
  const [duplicateTarget, setDuplicateTarget] = useState<Card | null>(null); // preserved for update
  const [duplicateAction, setDuplicateAction] = useState<
    'add' | 'update' | null
  >(null);

  // Saved card
  const [savedCard, setSavedCard] = useState<Card | null>(null);

  // -----------------------------------------------------------------------
  // AI identification + grading
  // -----------------------------------------------------------------------

  useEffect(() => {
    runAI();
  }, []);

  async function runAI() {
    try {
      setStep('identifying');
      setLoadingMessage('Identifying card...');
      setLoadingStep(0);
      const idResult = await identifyCard(frontUri, backUri);
      setIdentification(idResult);
      setCardName(idResult.card_name);
      setSetName(idResult.set_name);
      setYear(idResult.year?.toString() ?? '');
      setCardNumber(idResult.card_number);
      setEdition(idResult.edition);
      setRarity(idResult.rarity);

      // Duplicate check right after identification
      setLoadingStep(1);
      setLoadingMessage('Checking for duplicates...');
      const existing = checkDuplicate(
        idResult.card_name,
        idResult.set_name,
        idResult.card_number,
        idResult.edition,
      );
      setDuplicateCard(existing);

      setStep('grading');
      setLoadingStep(2);
      setLoadingMessage('Grading condition...');
      const gradeResult = await gradeCard(frontUri, backUri);
      setGrading(gradeResult);
    } catch (err) {
      console.error('AI processing failed:', err);
    } finally {
      setPhase('review');
      setStep('confirming');
    }
  }

  // -----------------------------------------------------------------------
  // Pricing
  // -----------------------------------------------------------------------

  const handleConfirmAndPrice = useCallback(async () => {
    if (!identification) return;

    setPhase('pricing');
    setStep('pricing');
    setPricingError(null);

    try {
      const result = await priceCard({
        card_name: cardName,
        set_name: setName || null,
        collection_type: identification.card_type,
        card_number: cardNumber || null,
        edition: edition || null,
        condition_psa_estimate: grading?.psa_estimate ?? null,
        ai_confidence_identification: identification
          ? Math.round(identification.identification_confidence * 100)
          : null,
      });
      setPricing(result);
      setPhase('priced');

      // Fetch recommendation in background (best-effort, shown before save)
      getRecommendation({
        card_name: cardName,
        set_name: setName || '',
        year: year ? parseInt(year, 10) : 0,
        edition: edition || '',
        psa_estimate: grading?.psa_estimate ?? 5,
        condition_simple: grading?.simple_grade ?? 'Good',
        estimated_value_usd: result.estimatedValueUsd ?? 0,
        value_confidence_pct: result.confidencePct,
      })
        .then(setRecommendation)
        .catch(() => {});
    } catch (err) {
      console.error('Pricing failed:', err);
      setPricingError('Pricing failed. Please try again.');
      setPhase('review');
    }
  }, [
    identification,
    grading,
    cardName,
    setName,
    cardNumber,
    edition,
    setStep,
  ]);

  // -----------------------------------------------------------------------
  // Save card
  // -----------------------------------------------------------------------

  const handleSaveToCollection = useCallback(async () => {
    if (!identification || !pricing) return;

    setPhase('saving');
    setStep('saving');

    try {
      const cardData: Partial<Card> = {
        collection_type: identification.card_type,
        card_name: cardName,
        set_name: setName || null,
        year: year ? parseInt(year, 10) : null,
        card_number: cardNumber || null,
        edition: edition || null,
        rarity: rarity || null,
        language: identification.language ?? 'English',
        photo_url_front: frontUri,
        photo_url_back: backUri ?? null,
        ai_identification_raw:
          identification as unknown as Record<string, unknown>,
        ai_confidence_identification: identification.identification_confidence,
        condition_psa_estimate: grading?.psa_estimate ?? null,
        condition_simple: grading?.simple_grade ?? null,
        condition_notes: grading?.condition_notes ?? null,
        is_graded: false,
        estimated_value_usd: pricing.estimatedValueUsd,
        estimated_value_cad: pricing.estimatedValueCad,
        value_confidence_pct: pricing.confidencePct,
        value_source_breakdown: pricing.breakdown as Card['value_source_breakdown'],
        proof_links: pricing.proofLinks,
        last_valued_at: new Date().toISOString(),
        ai_recommendation: recommendation?.recommendation ?? null,
        ai_recommendation_reasoning: recommendation?.reasoning ?? null,
        tags: [],
      };

      let saved: Card;
      if (duplicateAction === 'update' && duplicateTarget) {
        // Update existing card with new photo + pricing data
        saved = await updateCard.mutateAsync({
          id: duplicateTarget.id,
          data: cardData,
        });
      } else {
        saved = await createCard.mutateAsync(cardData);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSavedCard(saved);
      setPhase('saved');
      setStep('done');
    } catch (err) {
      console.error('Save failed:', err);
      Alert.alert('Save Failed', 'Could not save card. Please try again.');
      setPhase('priced');
    }
  }, [
    identification,
    grading,
    pricing,
    cardName,
    setName,
    year,
    cardNumber,
    edition,
    rarity,
    frontUri,
    backUri,
    createCard,
    setStep,
  ]);

  // -----------------------------------------------------------------------
  // Navigation helpers
  // -----------------------------------------------------------------------

  const handleScanAnother = useCallback(() => {
    resetScanStore();
    navigation.popToTop();
  }, [resetScanStore, navigation]);

  const handleDuplicateAdd = useCallback(() => {
    setDuplicateAction('add');
    setDuplicateCard(null); // dismiss banner, proceed normally
  }, []);

  const handleDuplicateUpdate = useCallback(() => {
    setDuplicateTarget(duplicateCard); // keep reference for save
    setDuplicateAction('update');
    setDuplicateCard(null); // dismiss banner
  }, [duplicateCard]);

  // -----------------------------------------------------------------------
  // Render: loading overlay
  // -----------------------------------------------------------------------

  if (phase === 'ai_processing') {
    return (
      <LoadingOverlay
        message={loadingMessage}
        steps={['Identifying card', 'Checking duplicates', 'Grading condition']}
        currentStep={loadingStep}
      />
    );
  }

  // -----------------------------------------------------------------------
  // Render: success state
  // -----------------------------------------------------------------------

  if (phase === 'saved' && savedCard && pricing) {
    return (
      <View style={styles.successContainer}>
        <SuccessOverlay
          card={savedCard}
          pricing={pricing}
          onScanAnother={handleScanAnother}
        />
      </View>
    );
  }

  // -----------------------------------------------------------------------
  // Render: review / priced
  // -----------------------------------------------------------------------

  const isPricing = phase === 'pricing';
  const isSaving = phase === 'saving';
  const isHighValue =
    pricing != null &&
    pricing.estimatedValueUsd != null &&
    pricing.estimatedValueUsd > 1000;

  return (
    <ScrollView style={styles.container}>
      {/* Card Photo */}
      <Image
        source={{ uri: frontUri }}
        style={styles.cardImage}
        resizeMode="contain"
      />

      {/* Duplicate Banner */}
      {duplicateCard && (
        <DuplicateBanner
          existingCard={duplicateCard}
          onAddDuplicate={handleDuplicateAdd}
          onUpdateExisting={handleDuplicateUpdate}
        />
      )}

      {/* AI Confidence */}
      {identification && (
        <View style={styles.confidenceRow}>
          <Text style={styles.confidenceLabel}>AI Confidence:</Text>
          <ConfidenceBadge
            confidence={Math.round(
              identification.identification_confidence * 100,
            )}
          />
        </View>
      )}

      {/* Editable Card Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Card Information</Text>
        <EditableField
          label="Card Name"
          value={cardName}
          onChangeText={setCardName}
        />
        <EditableField
          label="Set Name"
          value={setName}
          onChangeText={setSetName}
        />
        <EditableField label="Year" value={year} onChangeText={setYear} />
        <EditableField
          label="Card Number"
          value={cardNumber}
          onChangeText={setCardNumber}
        />
        <EditableField
          label="Edition"
          value={edition}
          onChangeText={setEdition}
        />
        <EditableField
          label="Rarity"
          value={rarity}
          onChangeText={setRarity}
        />
      </View>

      {/* Condition */}
      {grading && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Condition Assessment</Text>
          <ConditionBar psaEstimate={grading.psa_estimate} />
          <View style={styles.gradeRow}>
            <Text style={styles.gradeLabel}>
              Grade: {grading.simple_grade}
            </Text>
            <ConfidenceBadge
              confidence={Math.round(grading.grading_confidence * 100)}
              size="small"
            />
          </View>
          <View style={styles.subScores}>
            <Text style={styles.subScore}>
              Centering: {grading.centering_score}/10
            </Text>
            <Text style={styles.subScore}>
              Corners: {grading.corners_score}/10
            </Text>
            <Text style={styles.subScore}>
              Edges: {grading.edges_score}/10
            </Text>
            <Text style={styles.subScore}>
              Surface: {grading.surface_score}/10
            </Text>
          </View>
          {grading.condition_notes && (
            <Text style={styles.conditionNotes}>
              {grading.condition_notes}
            </Text>
          )}
        </View>
      )}

      {/* High Value Alert */}
      {isHighValue && <HighValueBanner />}

      {/* Pricing Results (shown after pricing completes) */}
      {pricing && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing Estimate</Text>

          <View style={styles.priceRow}>
            <PriceDisplay
              usd={pricing.estimatedValueUsd}
              cad={pricing.estimatedValueCad}
              size="large"
            />
            <ConfidenceBadge confidence={pricing.confidencePct} />
          </View>

          {/* Source Breakdown */}
          {pricing.breakdown && (
            <View style={styles.breakdownContainer}>
              {pricing.breakdown.ebay && (
                <View style={styles.breakdownItem}>
                  <Text style={styles.breakdownSource}>eBay Sold</Text>
                  <Text style={styles.breakdownValue}>
                    {formatUsd(pricing.breakdown.ebay.median)} median (
                    {pricing.breakdown.ebay.count} sales)
                  </Text>
                </View>
              )}
              {pricing.breakdown.tcgplayer && (
                <View style={styles.breakdownItem}>
                  <Text style={styles.breakdownSource}>TCGPlayer</Text>
                  <Text style={styles.breakdownValue}>
                    {formatUsd(pricing.breakdown.tcgplayer.market)} market
                  </Text>
                </View>
              )}
              {pricing.breakdown.cardmarket && (
                <View style={styles.breakdownItem}>
                  <Text style={styles.breakdownSource}>Cardmarket</Text>
                  <Text style={styles.breakdownValue}>
                    {formatUsd(pricing.breakdown.cardmarket.trend)} trend
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Proof Links */}
          {pricing.proofLinks.length > 0 && (
            <View style={styles.proofLinksContainer}>
              <Text style={styles.proofLinksTitle}>Recent Sales</Text>
              {pricing.proofLinks.slice(0, 5).map((link, idx) => (
                <ProofLinkRow
                  key={idx}
                  title={link.title}
                  price={link.price}
                  url={link.url}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* Recommendation (shown after pricing) */}
      {recommendation && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendation</Text>
          <RecommendationBadge recommendation={recommendation.recommendation} />
          {recommendation.reasoning && (
            <Text style={styles.conditionNotes}>{recommendation.reasoning}</Text>
          )}
        </View>
      )}

      {/* Pricing Error */}
      {pricingError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{pricingError}</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {/* Before pricing: show Confirm & Price */}
        {phase === 'review' && (
          <>
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleConfirmAndPrice}
            >
              <Text style={styles.confirmText}>Confirm & Price</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.retakeBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.retakeText}>Retake Photo</Text>
            </TouchableOpacity>
          </>
        )}

        {/* While pricing: show spinner button */}
        {isPricing && (
          <View style={[styles.confirmBtn, styles.disabledBtn]}>
            <Text style={styles.confirmText}>Pricing...</Text>
          </View>
        )}

        {/* After pricing: show Save to Collection */}
        {phase === 'priced' && (
          <>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSaveToCollection}
            >
              <Text style={styles.saveBtnText}>Save to Collection</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.repricingBtn}
              onPress={handleConfirmAndPrice}
            >
              <Text style={styles.repricingText}>Re-price</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.retakeBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.retakeText}>Retake Photo</Text>
            </TouchableOpacity>
          </>
        )}

        {/* While saving: show spinner button */}
        {isSaving && (
          <View style={[styles.saveBtn, styles.disabledBtn]}>
            <Text style={styles.saveBtnText}>Saving...</Text>
          </View>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  cardImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#f3f4f6',
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
  },
  confidenceLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  field: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
  },
  gradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  gradeLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  subScores: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  subScore: {
    fontSize: 13,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  conditionNotes: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
    marginTop: 12,
  },

  // Pricing results
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  breakdownContainer: {
    gap: 8,
    marginBottom: 16,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  breakdownSource: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  breakdownValue: {
    fontSize: 13,
    color: '#6b7280',
  },

  // Proof links
  proofLinksContainer: {
    marginTop: 4,
  },
  proofLinksTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  proofRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  proofTitle: {
    flex: 1,
    fontSize: 13,
    color: '#2563eb',
    marginRight: 12,
  },
  proofPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },

  // Duplicate banner
  duplicateBanner: {
    backgroundColor: '#fef9c3',
    borderLeftWidth: 4,
    borderLeftColor: '#eab308',
    margin: 16,
    marginBottom: 0,
    padding: 14,
    borderRadius: 8,
  },
  duplicateBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#854d0e',
    marginBottom: 4,
  },
  duplicateBannerText: {
    fontSize: 13,
    color: '#713f12',
    marginBottom: 12,
  },
  duplicateBannerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  duplicateBtnAdd: {
    flex: 1,
    backgroundColor: '#eab308',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  duplicateBtnAddText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  duplicateBtnUpdate: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eab308',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  duplicateBtnUpdateText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#854d0e',
  },

  // High value banner
  highValueBanner: {
    backgroundColor: '#fef3c7',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    margin: 16,
    marginBottom: 0,
    padding: 14,
    borderRadius: 8,
  },
  highValueTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 4,
  },
  highValueText: {
    fontSize: 13,
    color: '#78350f',
    lineHeight: 20,
  },

  // Error
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    margin: 16,
    marginBottom: 0,
    padding: 14,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#991b1b',
  },

  // Actions
  actions: {
    padding: 16,
    gap: 12,
  },
  confirmBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  repricingBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2563eb',
    backgroundColor: '#fff',
  },
  repricingText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2563eb',
  },
  retakeBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  retakeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  disabledBtn: {
    opacity: 0.6,
  },

  // Success overlay
  successContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  successOverlay: {
    alignItems: 'center',
    width: '100%',
  },
  successCheckCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successCheckMark: {
    fontSize: 40,
    color: '#16a34a',
    fontWeight: '700',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  successSummary: {
    fontSize: 15,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  scanAnotherBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  scanAnotherText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
