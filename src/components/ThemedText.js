import React from 'react';
import { Text } from 'react-native';
import { useTheme } from '../utils/themeContext';

/**
 * A Text component that automatically applies the current theme's text color
 */
const ThemedText = ({ style, children, ...props }) => {
  const { theme } = useTheme();
  
  return (
    <Text 
      style={[{ color: theme.colors.text }, style]} 
      {...props}
    >
      {children}
    </Text>
  );
};

export default ThemedText;