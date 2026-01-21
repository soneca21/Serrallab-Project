import React from 'react';
import { StatusBar } from 'react-native';
import { Colors } from './theme';
import { AppNavigator } from './navigation/AppNavigator';

export default function App() {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <AppNavigator />
    </>
  );
}
