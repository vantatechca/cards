import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardStackParamList } from '../../types/navigation';
import { DashboardScreen } from '../../screens/dashboard/DashboardScreen';
import { SellDecisionScreen } from '../../screens/dashboard/SellDecisionScreen';

const Stack = createNativeStackNavigator<DashboardStackParamList>();

export function DashboardStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Stack.Screen
        name="SellDecision"
        component={SellDecisionScreen}
        options={{ title: 'Sell Decision Helper' }}
      />
    </Stack.Navigator>
  );
}
