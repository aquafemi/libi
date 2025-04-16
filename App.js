import React from 'react';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';

// Define theme
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6200ee',
    accent: '#03dac4',
  },
};

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <AppNavigator />
    </PaperProvider>
  );
}