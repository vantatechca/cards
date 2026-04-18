import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ScanStackParamList } from '../../types/navigation';
import { CameraScreen } from '../../screens/scan/CameraScreen';
import { ConfirmationScreen } from '../../screens/scan/ConfirmationScreen';

const Stack = createNativeStackNavigator<ScanStackParamList>();

export function ScanStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Camera"
        component={CameraScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Confirmation"
        component={ConfirmationScreen}
        options={{ title: 'Confirm Card' }}
      />
    </Stack.Navigator>
  );
}
