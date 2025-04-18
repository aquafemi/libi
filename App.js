import React from 'react';
import { StatusBar } from 'react-native';
import { Provider as PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/utils/themeContext';
import { UserProvider } from './src/utils/userContext';

// Main App component that uses the theme context
const Main = () => {
  // Get the current theme from context
  const { theme, isDarkMode } = useTheme();
  
  // Use the appropriate Paper theme based on dark mode state
  const paperTheme = isDarkMode ? 
    { ...MD3DarkTheme, colors: { ...MD3DarkTheme.colors, primary: theme.colors.primary } } : 
    { ...MD3LightTheme, colors: { ...MD3LightTheme.colors, primary: theme.colors.primary } };
  
  return (
    <PaperProvider theme={paperTheme}>
      <SafeAreaProvider>
        <StatusBar
          barStyle={isDarkMode ? "light-content" : "dark-content"}
          backgroundColor="transparent"
          translucent={true}
        />
        <AppNavigator />
      </SafeAreaProvider>
    </PaperProvider>
  );
};

// Root component that wraps everything with the ThemeProvider and UserProvider
export default function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <Main />
      </UserProvider>
    </ThemeProvider>
  );
}