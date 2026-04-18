import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  onApply: () => void;
  onClear: () => void;
  children: React.ReactNode;
}

export function FilterSheet({ visible, onClose, onApply, onClear, children }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <Text style={styles.title}>Filters</Text>
            <TouchableOpacity onPress={onClear}>
              <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>{children}</ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={onApply}>
              <Text style={styles.applyText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  clearText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '500',
  },
  content: {
    padding: 20,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  applyBtn: {
    flex: 2,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#2563eb',
  },
  applyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
