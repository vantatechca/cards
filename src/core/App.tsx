import React from 'react';
import { StatusBar, View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryProvider } from './providers/QueryProvider';
import { AuthProvider } from './providers/AuthProvider';
import { RootNavigator } from './navigation/RootNavigator';
import { useAppStore } from '../stores/useAppStore';

function AppContent() {
  // Zustand persist middleware sets _hasHydrated once AsyncStorage is loaded.
  // useAppStore itself is created with `persist`, so we check hydration.
  const hasHydrated = useAppStore.persist?.hasHydrated?.() ?? true;

  if (!hasHydrated) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashTitle}>CardVault</Text>
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <QueryProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar barStyle="dark-content" />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </QueryProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppContent />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#1e3a5f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
});
