import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../utils/themeContext';

/**
 * A wrapper component that applies the current theme to its children
 * This can be reused across all screens to maintain consistent theming
 */
const ThemeAwareScreen = ({ children, style }) => {
  const { theme } = useTheme();
  
  return (
    <View style={[
      styles.container,
      { backgroundColor: theme.colors.background },
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
});

export default ThemeAwareScreen;