import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { SORT_OPTIONS, SortKey } from '../../utils/constants';

interface Props {
  value: SortKey;
  onChange: (sort: SortKey) => void;
}

export function SortPicker({ value, onChange }: Props) {
  const [visible, setVisible] = useState(false);
  const current = SORT_OPTIONS.find((o) => o.key === value);

  return (
    <>
      <TouchableOpacity style={styles.button} onPress={() => setVisible(true)}>
        <Text style={styles.buttonText}>{current?.label ?? 'Sort'}</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide">
        <TouchableOpacity style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={styles.sheet}>
            <Text style={styles.title}>Sort By</Text>
            {SORT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.option, opt.key === value && styles.activeOption]}
                onPress={() => {
                  onChange(opt.key);
                  setVisible(false);
                }}
              >
                <Text style={[styles.optionText, opt.key === value && styles.activeOptionText]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: '#111827',
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeOption: {
    backgroundColor: '#eff6ff',
  },
  optionText: {
    fontSize: 15,
    color: '#374151',
  },
  activeOptionText: {
    color: '#2563eb',
    fontWeight: '600',
  },
});
