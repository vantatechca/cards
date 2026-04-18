import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppState {
  isLocked: boolean;
  pinEnabled: boolean;
  biometricEnabled: boolean;
  defaultCurrency: 'USD' | 'CAD';
  photoQuality: 'high' | 'medium' | 'low';
  hasCompletedOnboarding: boolean;

  unlock: () => void;
  lock: () => void;
  setPinEnabled: (enabled: boolean) => void;
  setBiometricEnabled: (enabled: boolean) => void;
  setDefaultCurrency: (currency: 'USD' | 'CAD') => void;
  setPhotoQuality: (quality: 'high' | 'medium' | 'low') => void;
  completeOnboarding: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isLocked: false,
      pinEnabled: false,
      biometricEnabled: false,
      defaultCurrency: 'USD',
      photoQuality: 'high',
      hasCompletedOnboarding: false,

      unlock: () => set({ isLocked: false }),
      lock: () => set({ isLocked: true }),
      setPinEnabled: (enabled) => set({ pinEnabled: enabled }),
      setBiometricEnabled: (enabled) => set({ biometricEnabled: enabled }),
      setDefaultCurrency: (currency) => set({ defaultCurrency: currency }),
      setPhotoQuality: (quality) => set({ photoQuality: quality }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
    }),
    {
      name: 'cardvault-app-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        pinEnabled: state.pinEnabled,
        biometricEnabled: state.biometricEnabled,
        defaultCurrency: state.defaultCurrency,
        photoQuality: state.photoQuality,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
      // Auto-lock on rehydrate when PIN or biometric is enabled
      merge: (persisted, current) => {
        const merged = { ...current, ...(persisted as Partial<AppState>) };
        if (merged.pinEnabled || merged.biometricEnabled) {
          merged.isLocked = true;
        }
        return merged;
      },
    },
  ),
);
