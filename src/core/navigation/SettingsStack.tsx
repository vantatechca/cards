import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../../types/navigation';
import { SettingsScreen } from '../../screens/settings/SettingsScreen';
import { BatchRepriceScreen } from '../../screens/settings/BatchRepriceScreen';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <Stack.Screen
        name="BatchReprice"
        component={BatchRepriceScreen}
        options={{ title: 'Batch Re-Price' }}
      />
    </Stack.Navigator>
  );
}
