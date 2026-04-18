import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RootTabParamList } from '../../types/navigation';
import { CollectionStack } from './CollectionStack';
import { ScanStack } from './ScanStack';
import { DashboardStack } from './DashboardStack';
import { SearchStack } from './SearchStack';
import { SettingsStack } from './SettingsStack';
import { OfflineBanner } from '../../components/common/OfflineBanner';
import { initOfflineQueue } from '../../services/offlineQueue';

const Tab = createBottomTabNavigator<RootTabParamList>();

export function BottomTabNavigator() {
  // Initialize offline queue listener on mount
  useEffect(() => {
    const unsubscribe = initOfflineQueue();
    return unsubscribe;
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner />
      <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="CollectionTab"
        component={CollectionStack}
        options={{
          tabBarLabel: 'Collection',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="DashboardTab"
        component={DashboardStack}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ScanTab"
        component={ScanStack}
        options={{
          tabBarLabel: '',
          tabBarIcon: () => (
            <View style={styles.scanButton}>
              <Ionicons name="camera" size={28} color="#fff" />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchStack}
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStack}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopColor: '#e5e7eb',
    height: 85,
    paddingBottom: 20,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  scanButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});
