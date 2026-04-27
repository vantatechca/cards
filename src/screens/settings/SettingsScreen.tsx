import React, { useState } from 'react';
import { View, Text, ScrollView, Switch, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../../types/navigation';
import { useAppStore } from '../../stores/useAppStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useCards, useDeleteAllCards } from '../../hooks/useCards';
import { cardsToCSV, cardsToJSON, exportAndShare } from '../../services/exportService';

type Props = NativeStackScreenProps<SettingsStackParamList, 'Settings'>;

function SettingRow({
  label,
  description,
  right,
}: {
  label: string;
  description?: string;
  right: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowInfo}>
        <Text style={styles.rowLabel}>{label}</Text>
        {description && <Text style={styles.rowDesc}>{description}</Text>}
      </View>
      {right}
    </View>
  );
}

export function SettingsScreen({ navigation }: Props) {
  const { data: cards = [] } = useCards();
  const deleteAllCards = useDeleteAllCards();
  const [exporting, setExporting] = useState(false);
  const { user, clearAuth } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => clearAuth() },
    ]);
  };

  const handleExport = async (format: 'csv' | 'json') => {
    setExporting(true);
    try {
      const content = format === 'csv' ? cardsToCSV(cards) : cardsToJSON(cards);
      const filename = `cardvault_export_${new Date().toISOString().slice(0, 10)}.${format}`;
      await exportAndShare(content, filename);
    } catch (err) {
      Alert.alert('Export Failed', 'Could not export collection. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const {
    pinEnabled,
    biometricEnabled,
    defaultCurrency,
    photoQuality,
    setPinEnabled,
    setBiometricEnabled,
    setDefaultCurrency,
    setPhotoQuality,
  } = useAppStore();

  return (
    <ScrollView style={styles.container}>
      {/* Account */}
      <Text style={styles.sectionTitle}>Account</Text>
      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>Signed in as</Text>
            <Text style={styles.rowDesc}>{user?.email}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.actionRow} onPress={handleLogout}>
          <Text style={[styles.actionLabel, { color: '#dc2626' }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Security */}
      <Text style={styles.sectionTitle}>Security</Text>
      <View style={styles.section}>
        <SettingRow
          label="PIN Lock"
          description="Require PIN to open app"
          right={<Switch value={pinEnabled} onValueChange={setPinEnabled} />}
        />
        <SettingRow
          label="Biometric Lock"
          description="Use Face ID or Fingerprint"
          right={<Switch value={biometricEnabled} onValueChange={setBiometricEnabled} />}
        />
      </View>

      {/* Display */}
      <Text style={styles.sectionTitle}>Display</Text>
      <View style={styles.section}>
        <SettingRow
          label="Primary Currency"
          right={
            <TouchableOpacity
              style={styles.chipBtn}
              onPress={() =>
                setDefaultCurrency(defaultCurrency === 'USD' ? 'CAD' : 'USD')
              }
            >
              <Text style={styles.chipText}>{defaultCurrency}</Text>
            </TouchableOpacity>
          }
        />
        <SettingRow
          label="Photo Quality"
          description="Higher quality uses more storage"
          right={
            <TouchableOpacity
              style={styles.chipBtn}
              onPress={() => {
                const options: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];
                const current = options.indexOf(photoQuality);
                setPhotoQuality(options[(current + 1) % 3]);
              }}
            >
              <Text style={styles.chipText}>{photoQuality}</Text>
            </TouchableOpacity>
          }
        />
      </View>

      {/* Pricing */}
      <Text style={styles.sectionTitle}>Pricing</Text>
      <View style={styles.section}>
        <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('BatchReprice')}>
          <Text style={styles.actionLabel}>Re-Price All Cards ({cards.length})</Text>
        </TouchableOpacity>
      </View>

      {/* Data */}
      <Text style={styles.sectionTitle}>Data</Text>
      <View style={styles.section}>
        <TouchableOpacity style={styles.actionRow} onPress={() => handleExport('csv')} disabled={exporting}>
          <Text style={styles.actionLabel}>
            {exporting ? 'Exporting...' : `Export Collection (CSV) - ${cards.length} cards`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionRow} onPress={() => handleExport('json')} disabled={exporting}>
          <Text style={styles.actionLabel}>
            {exporting ? 'Exporting...' : `Export Collection (JSON) - ${cards.length} cards`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionRow} onPress={() => Alert.alert('Backup', 'Backup feature coming soon')}>
          <Text style={styles.actionLabel}>Backup to Cloud</Text>
        </TouchableOpacity>
      </View>

      {/* Danger Zone */}
      <Text style={[styles.sectionTitle, { color: '#dc2626' }]}>Danger Zone</Text>
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.actionRow}
          onPress={() =>
            Alert.alert('Clear All Data', 'This will permanently delete your entire collection. This cannot be undone.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete Everything',
                style: 'destructive',
                onPress: () =>
                  Alert.alert('Are you sure?', 'This is your last chance to cancel.', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Yes, Delete All',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await deleteAllCards.mutateAsync();
                          Alert.alert('Done', 'All cards have been deleted.');
                        } catch {
                          Alert.alert('Error', 'Failed to delete all cards.');
                        }
                      },
                    },
                  ]),
              },
            ])
          }
        >
          <Text style={[styles.actionLabel, { color: '#dc2626' }]}>
            Clear All Data
          </Text>
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>CardVault v1.0.0</Text>
        <Text style={styles.footerText}>Built for Andrei Dutescu</Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
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
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  rowInfo: {
    flex: 1,
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  rowDesc: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  chipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
    textTransform: 'capitalize',
  },
  actionRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  actionLabel: {
    fontSize: 15,
    color: '#2563eb',
    fontWeight: '500',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 13,
    color: '#9ca3af',
  },
});
