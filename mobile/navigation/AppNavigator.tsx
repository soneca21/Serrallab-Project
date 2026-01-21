import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Colors } from '../theme';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ClientsScreen } from '../screens/ClientsScreen';
import { QuotesScreen } from '../screens/QuotesScreen';
import { AgendaScreen } from '../screens/AgendaScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import Ionicons from '@expo/vector-icons/Ionicons';

const Tab = createBottomTabNavigator();

const tabIcons: Record<string, string> = {
  Dashboard: 'speedometer-outline',
  Clients: 'people-outline',
  Quotes: 'document-text-outline',
  Agenda: 'calendar-outline',
  Notifications: 'notifications-outline',
};

const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => (
  <Ionicons name={tabIcons[name]} size={20} color={focused ? Colors.primary : Colors.muted} />
);

export const AppNavigator = () => (
  <NavigationContainer>
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: Colors.surface, borderTopColor: Colors.border },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.muted,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Clients" component={ClientsScreen} />
      <Tab.Screen name="Quotes" component={QuotesScreen} />
      <Tab.Screen name="Agenda" component={AgendaScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
    </Tab.Navigator>
  </NavigationContainer>
);
