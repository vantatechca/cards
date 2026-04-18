import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCard, useUpdateCard } from '../../hooks/useCards';
import { ConditionSimple, CollectionType } from '../../types/card';

type Props = {
  route: { params: { cardId: string } };
  navigation: NativeStackNavigationProp<{ CardEdit: { cardId: string } }, 'CardEdit'>;
};

const CONDITIONS: ConditionSimple[] = ['Mint', 'Near Mint', 'Excellent', 'Good', 'Fair', 'Poor'];
const COLLECTION_TYPES: { key: CollectionType; label: string }[] = [
  { key: 'hockey', label: 'Hockey' },
  { key: 'magic', label: 'Magic: The Gathering' },
  { key: 'yugioh', label: 'Yu-Gi-Oh!' },
];

function FieldLabel({ label }: { label: string }) {
  return <Text style={styles.label}>{label}</Text>;
}

export function CardEditScreen({ route, navigation }: Props) {
  const { cardId } = route.params;
  const { data: card, isLoading } = useCard(cardId);
  const updateCard = useUpdateCard();
  const [saving, setSaving] = useState(false);

  // Form fields
  const [cardName, setCardName] = useState('');
  const [setName, setSetName] = useState('');
  const [year, setYear] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [edition, setEdition] = useState('');
  const [rarity, setRarity] = useState('');
  const [language, setLanguage] = useState('');
  const [collectionType, setCollectionType] = useState<CollectionType>('hockey');
  const [conditionSimple, setConditionSimple] = useState<ConditionSimple | ''>('');
  const [conditionNotes, setConditionNotes] = useState('');
  const [isGraded, setIsGraded] = useState(false);
  const [gradingCompany, setGradingCompany] = useState('');
  const [gradedScore, setGradedScore] = useState('');
  const [gradingCertNumber, setGradingCertNumber] = useState('');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState('');

  // Populate form when card loads
  useEffect(() => {
    if (card) {
      setCardName(card.card_name);
      setSetName(card.set_name ?? '');
      setYear(card.year?.toString() ?? '');
      setCardNumber(card.card_number ?? '');
      setEdition(card.edition ?? '');
      setRarity(card.rarity ?? '');
      setLanguage(card.language ?? 'English');
      setCollectionType(card.collection_type);
      setConditionSimple(card.condition_simple ?? '');
      setConditionNotes(card.condition_notes ?? '');
      setIsGraded(card.is_graded);
      setGradingCompany(card.grading_company ?? '');
      setGradedScore(card.graded_score?.toString() ?? '');
      setGradingCertNumber(card.grading_cert_number ?? '');
      setTags(card.tags.join(', '));
      setNotes(card.notes ?? '');
      setLocation(card.location ?? '');
    }
  }, [card]);

  if (isLoading || !card) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const handleSave = async () => {
    if (!cardName.trim()) {
      Alert.alert('Required', 'Card name cannot be empty.');
      return;
    }

    setSaving(true);
    try {
      await updateCard.mutateAsync({
        id: cardId,
        data: {
          card_name: cardName.trim(),
          set_name: setName.trim() || null,
          year: year ? parseInt(year, 10) || null : null,
          card_number: cardNumber.trim() || null,
          edition: edition.trim() || null,
          rarity: rarity.trim() || null,
          language: language.trim() || 'English',
          collection_type: collectionType,
          condition_simple: conditionSimple || null,
          condition_notes: conditionNotes.trim() || null,
          is_graded: isGraded,
          grading_company: isGraded ? gradingCompany.trim() || null : null,
          graded_score: isGraded && gradedScore ? parseFloat(gradedScore) || null : null,
          grading_cert_number: isGraded ? gradingCertNumber.trim() || null : null,
          tags: tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          notes: notes.trim() || null,
          location: location.trim() || null,
        },
      });
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Card Identity */}
      <Text style={styles.sectionTitle}>Card Information</Text>
      <View style={styles.section}>
        <FieldLabel label="Card Name *" />
        <TextInput style={styles.input} value={cardName} onChangeText={setCardName} placeholder="Card name" />

        <FieldLabel label="Collection Type" />
        <View style={styles.chipRow}>
          {COLLECTION_TYPES.map((ct) => (
            <TouchableOpacity
              key={ct.key}
              style={[styles.chip, collectionType === ct.key && styles.chipActive]}
              onPress={() => setCollectionType(ct.key)}
            >
              <Text style={[styles.chipText, collectionType === ct.key && styles.chipTextActive]}>
                {ct.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FieldLabel label="Set" />
        <TextInput style={styles.input} value={setName} onChangeText={setSetName} placeholder="Set name" />

        <View style={styles.row}>
          <View style={styles.halfField}>
            <FieldLabel label="Year" />
            <TextInput style={styles.input} value={year} onChangeText={setYear} placeholder="2024" keyboardType="numeric" />
          </View>
          <View style={styles.halfField}>
            <FieldLabel label="Card #" />
            <TextInput style={styles.input} value={cardNumber} onChangeText={setCardNumber} placeholder="#123" />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <FieldLabel label="Edition" />
            <TextInput style={styles.input} value={edition} onChangeText={setEdition} placeholder="1st Edition" />
          </View>
          <View style={styles.halfField}>
            <FieldLabel label="Rarity" />
            <TextInput style={styles.input} value={rarity} onChangeText={setRarity} placeholder="Rare" />
          </View>
        </View>

        <FieldLabel label="Language" />
        <TextInput style={styles.input} value={language} onChangeText={setLanguage} placeholder="English" />
      </View>

      {/* Condition */}
      <Text style={styles.sectionTitle}>Condition</Text>
      <View style={styles.section}>
        <FieldLabel label="Condition" />
        <View style={styles.chipRow}>
          {CONDITIONS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, conditionSimple === c && styles.chipActive]}
              onPress={() => setConditionSimple(conditionSimple === c ? '' : c)}
            >
              <Text style={[styles.chipText, conditionSimple === c && styles.chipTextActive]}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FieldLabel label="Condition Notes" />
        <TextInput
          style={[styles.input, styles.multiline]}
          value={conditionNotes}
          onChangeText={setConditionNotes}
          placeholder="Any defects, whitening, etc."
          multiline
          numberOfLines={3}
        />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Professionally Graded</Text>
          <Switch value={isGraded} onValueChange={setIsGraded} />
        </View>

        {isGraded && (
          <>
            <FieldLabel label="Grading Company" />
            <TextInput style={styles.input} value={gradingCompany} onChangeText={setGradingCompany} placeholder="PSA, BGS, CGC..." />

            <View style={styles.row}>
              <View style={styles.halfField}>
                <FieldLabel label="Score" />
                <TextInput style={styles.input} value={gradedScore} onChangeText={setGradedScore} placeholder="9.5" keyboardType="decimal-pad" />
              </View>
              <View style={styles.halfField}>
                <FieldLabel label="Cert #" />
                <TextInput style={styles.input} value={gradingCertNumber} onChangeText={setGradingCertNumber} placeholder="12345678" />
              </View>
            </View>
          </>
        )}
      </View>

      {/* Organization */}
      <Text style={styles.sectionTitle}>Organization</Text>
      <View style={styles.section}>
        <FieldLabel label="Tags (comma-separated)" />
        <TextInput style={styles.input} value={tags} onChangeText={setTags} placeholder="keeper, pc, trade" />

        <FieldLabel label="Notes" />
        <TextInput
          style={[styles.input, styles.multiline]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Personal notes about this card..."
          multiline
          numberOfLines={3}
        />

        <FieldLabel label="Storage Location" />
        <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="Binder 3, Page 12" />
      </View>

      {/* Save */}
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveBtnText}>Save Changes</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  section: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
  },
  multiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: { flex: 1 },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  chipActive: {
    backgroundColor: '#2563eb',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  chipTextActive: {
    color: '#fff',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  saveBtn: {
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    backgroundColor: '#2563eb',
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
});
