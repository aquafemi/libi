import React, { useState, useEffect, useRef } from 'react';
import { Animated, Text } from 'react-native';
import ThemedText from '../ThemedText';

/**
 * A component that animates counting up to a value
 * 
 * @param {Object} props
 * @param {string|number} props.value - The target value to count to
 * @param {Object} props.style - The style to apply to the text
 * @param {string} props.suffix - Text to display after the number (e.g., "plays")
 * @param {string} props.prefix - Text to display before the number (e.g., "$")
 * @param {number} props.duration - Animation duration in milliseconds
 * @param {number} props.delay - Delay before starting animation in milliseconds
 * @param {number} props.decimalPlaces - Number of decimal places to display
 */
const AnimatedCount = ({ 
  value, 
  style, 
  suffix = '', 
  prefix = '', 
  duration = 1500, 
  delay = 0, 
  decimalPlaces = 0 
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState('0');
  
  useEffect(() => {
    // Parse the initial value from string to number
    const finalValue = parseFloat(value) || 0;
    
    // Reset animation when value changes
    animatedValue.setValue(0);
    
    // Start animation after specified delay
    Animated.timing(animatedValue, {
      toValue: finalValue,
      duration: duration,
      delay: delay,
      useNativeDriver: false,
    }).start();
    
    // Update display value during animation
    const listener = animatedValue.addListener(({ value }) => {
      if (decimalPlaces > 0) {
        setDisplayValue(value.toFixed(decimalPlaces));
      } else {
        setDisplayValue(Math.floor(value).toLocaleString());
      }
    });
    
    // Clean up listener
    return () => {
      animatedValue.removeListener(listener);
    };
  }, [value, duration, delay, decimalPlaces]);
  
  return <ThemedText style={style}>{prefix}{displayValue}{suffix}</ThemedText>;
};

export default AnimatedCount;