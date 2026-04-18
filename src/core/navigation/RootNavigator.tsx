import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useAppStore } from '../../stores/useAppStore';
import { LockScreen } from '../../screens/auth/LockScreen';
import { OnboardingScreen } from '../../screens/onboarding/OnboardingScreen';
import { BottomTabNavigator } from './BottomTabNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const isLocked = useAppStore((s) => s.isLocked);
  const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isLocked ? (
        <Stack.Screen name="Lock" component={LockScreen} />
      ) : !hasCompletedOnboarding ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <Stack.Screen name="Main" component={BottomTabNavigator} />
      )}
    </Stack.Navigator>
  );
}
