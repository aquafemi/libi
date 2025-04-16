import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { DefaultTheme as NavigationDefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Custom themes
const customLightTheme = {
  ...NavigationDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    primary: '#6200ee',
    accent: '#03dac4',
    background: '#f5f5f5',
    surface: '#ffffff',
    text: '#000000',
    // Add any other colors you want to customize
  },
  dark: false,
};

const customDarkTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    primary: '#bb86fc',
    accent: '#03dac6',
    background: '#121212',
    surface: '#1e1e1e',
    text: '#ffffff',
    // Add any other colors you want to customize
  },
  dark: true,
};

// Storage key
const THEME_MODE_KEY = 'theme_mode';

// Create the context
const ThemeContext = createContext({
  isDarkMode: false,
  toggleTheme: () => {},
  theme: customLightTheme,
});

// Provider component
export const ThemeProvider = ({ children }) => {
  // Get device theme preference
  const colorScheme = useColorScheme();
  
  // State for dark mode toggle
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Load saved theme preference when app starts
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedThemeMode = await AsyncStorage.getItem(THEME_MODE_KEY);
        
        if (savedThemeMode !== null) {
          // Use saved preference
          setIsDarkMode(savedThemeMode === 'dark');
        } else {
          // Default to device preference if nothing is saved
          setIsDarkMode(colorScheme === 'dark');
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
        // Default to light mode if there's an error
        setIsDarkMode(false);
      }
    };
    
    loadThemePreference();
  }, [colorScheme]);
  
  // Toggle theme function
  const toggleTheme = async () => {
    try {
      const newThemeMode = !isDarkMode ? 'dark' : 'light';
      await AsyncStorage.setItem(THEME_MODE_KEY, newThemeMode);
      setIsDarkMode(!isDarkMode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };
  
  // Current theme based on dark mode state
  const theme = isDarkMode ? customDarkTheme : customLightTheme;
  
  // Context value
  const contextValue = {
    isDarkMode,
    toggleTheme,
    theme,
  };
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);