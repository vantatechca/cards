/**
 * Expo Router index route.
 * Renders the React Navigation app inside NavigationIndependentTree.
 */
import React from 'react';
import { StatusBar, View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import { RootNavigator } from '../src/core/navigation/RootNavigator';
import { useAppStore } from '../src/stores/useAppStore';

export default function Index() {
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
    <NavigationIndependentTree>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" />
        <RootNavigator />
      </NavigationContainer>
    </NavigationIndependentTree>
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
