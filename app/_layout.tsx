/**
 * Expo Router root layout.
 * Renders providers and <Slot /> so child routes (app/index.tsx) mount.
 */
import React from 'react';
import { Slot } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryProvider } from '../src/core/providers/QueryProvider';
import { AuthProvider } from '../src/core/providers/AuthProvider';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <AuthProvider>
          <Slot />
        </AuthProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}
