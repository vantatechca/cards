import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  flash: 'off' | 'on' | 'auto';
  onToggle: () => void;
}

const FLASH_ICONS: Record<string, string> = {
  off: 'OFF',
  on: 'ON',
  auto: 'AUTO',
};

export function FlashToggle({ flash, onToggle }: Props) {
  return (
    <TouchableOpacity style={styles.button} onPress={onToggle}>
      <Text style={styles.icon}>Flash: {FLASH_ICONS[flash]}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  icon: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
