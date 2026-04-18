import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CollectionType } from '../../types/card';
import { COLLECTION_LABELS } from '../../utils/constants';

type TabKey = CollectionType | 'all';

interface Props {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  counts?: Record<TabKey, number>;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'hockey', label: 'Hockey' },
  { key: 'magic', label: 'MTG' },
  { key: 'yugioh', label: 'Yu-Gi-Oh!' },
];

export function CollectionTabs({ activeTab, onTabChange, counts }: Props) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, activeTab === tab.key && styles.activeTab]}
          onPress={() => onTabChange(tab.key)}
        >
          <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
            {tab.label}
          </Text>
          {counts && counts[tab.key] != null && (
            <Text style={[styles.count, activeTab === tab.key && styles.activeCount]}>
              {counts[tab.key]}
            </Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 3,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#111827',
    fontWeight: '600',
  },
  count: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  activeCount: {
    color: '#6b7280',
  },
});
