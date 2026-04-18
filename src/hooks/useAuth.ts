import { useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useAppStore } from '../stores/useAppStore';

const PIN_KEY = 'cardvault_pin';

export function useAuth() {
  const { isLocked, pinEnabled, biometricEnabled, unlock, lock } = useAppStore();

  const setPin = useCallback(async (pin: string) => {
    await SecureStore.setItemAsync(PIN_KEY, pin);
  }, []);

  const verifyPin = useCallback(async (pin: string): Promise<boolean> => {
    const stored = await SecureStore.getItemAsync(PIN_KEY);
    if (stored === pin) {
      unlock();
      return true;
    }
    return false;
  }, [unlock]);

  const authenticateWithBiometrics = useCallback(async (): Promise<boolean> => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return false;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock CardVault',
      fallbackLabel: 'Use PIN',
      disableDeviceFallback: false,
    });

    if (result.success) {
      unlock();
      return true;
    }
    return false;
  }, [unlock]);

  return {
    isLocked,
    pinEnabled,
    biometricEnabled,
    setPin,
    verifyPin,
    authenticateWithBiometrics,
    lock,
    unlock,
  };
}
