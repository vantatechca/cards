import React, { useEffect } from 'react';
import { useAppStore } from '../../stores/useAppStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { pinEnabled, biometricEnabled } = useAppStore();

  useEffect(() => {
    // Lock on mount if security is enabled
    if (pinEnabled || biometricEnabled) {
      useAppStore.getState().lock();
    }
  }, []);

  return <>{children}</>;
}
