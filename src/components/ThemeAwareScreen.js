import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../utils/themeContext';

/**
 * A wrapper component that applies the current theme to its children
 * This can be reused across all screens to maintain consistent theming
 */
const ThemeAwareScreen = ({ children, style }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[
      styles.container,
      { 
        backgroundColor: theme.colors.background,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right
      },
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