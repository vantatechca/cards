import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../../hooks/useAuth';

export function LockScreen() {
  const { verifyPin, authenticateWithBiometrics, biometricEnabled } = useAuth();
  const [pin, setPin] = useState('');

  useEffect(() => {
    if (biometricEnabled) {
      authenticateWithBiometrics();
    }
  }, []);

  const handlePinSubmit = async () => {
    const ok = await verifyPin(pin);
    if (!ok) {
      Alert.alert('Incorrect PIN', 'Please try again.');
      setPin('');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CardVault</Text>
      <Text style={styles.subtitle}>Enter PIN to unlock</Text>

      <TextInput
        style={styles.input}
        value={pin}
        onChangeText={setPin}
        placeholder="Enter PIN"
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
        onSubmitEditing={handlePinSubmit}
      />

      <TouchableOpacity style={styles.button} onPress={handlePinSubmit}>
        <Text style={styles.buttonText}>Unlock</Text>
      </TouchableOpacity>

      {biometricEnabled && (
        <TouchableOpacity style={styles.bioButton} onPress={authenticateWithBiometrics}>
          <Text style={styles.bioText}>Use Face ID / Fingerprint</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 40,
  },
  input: {
    width: '100%',
    height: 52,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 20,
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 20,
  },
  button: {
    width: '100%',
    height: 52,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  bioButton: {
    marginTop: 20,
    padding: 12,
  },
  bioText: {
    color: '#2563eb',
    fontSize: 15,
    fontWeight: '500',
  },
});
