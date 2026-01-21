import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ClientsScreen } from '../screens/ClientsScreen';
import { QuotesScreen } from '../screens/QuotesScreen';
import { AgendaScreen } from '../screens/AgendaScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';

const Tab = createBottomTabNavigator();

const icons = {
  Dashboard: '🏠',
  Clients: '👥',
  Quotes: '📄',
  Agenda: '📆',
  Notifications: '🔔',
};

const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => (
  <View style={styles.icon}>
    <Text style={{ color: focused ? Colors.primary : Colors.muted }}>{icons[name]}</Text>
  </View>
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

const styles = StyleSheet.create({
  icon: {
    width: 24,
    alignItems: 'center',
  },
});
