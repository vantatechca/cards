import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SearchStackParamList } from '../../types/navigation';
import { SearchScreen } from '../../screens/search/SearchScreen';
import { CardDetailScreen } from '../../screens/collection/CardDetailScreen';
import { CardEditScreen } from '../../screens/collection/CardEditScreen';

const Stack = createNativeStackNavigator<SearchStackParamList>();

export function SearchStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{ title: 'Search' }}
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
