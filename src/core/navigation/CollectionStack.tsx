import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CollectionStackParamList } from '../../types/navigation';
import { CollectionGridScreen } from '../../screens/collection/CollectionGridScreen';
import { CardDetailScreen } from '../../screens/collection/CardDetailScreen';
import { CardEditScreen } from '../../screens/collection/CardEditScreen';

const Stack = createNativeStackNavigator<CollectionStackParamList>();

export function CollectionStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="CollectionGrid"
        component={CollectionGridScreen}
        options={{ title: 'Collection' }}
      />
      <Stack.Screen
        name="CardDetail"
        component={CardDetailScreen}
        options={{ title: 'Card Details' }}
      />
      <Stack.Screen
        name="CardEdit"
        component={CardEditScreen}
        options={{ title: 'Edit Card' }}
      />
    </Stack.Navigator>
  );
}
