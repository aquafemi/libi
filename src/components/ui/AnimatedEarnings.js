import React from 'react';
import AnimatedCount from './AnimatedCount';

/**
 * A specialized AnimatedCount component for displaying earnings with currency symbol
 * 
 * @param {Object} props
 * @param {string|number} props.value - The earnings value to display
 * @param {Object} props.style - The style to apply to the text
 * @param {number} props.duration - Animation duration in milliseconds
 * @param {number} props.delay - Delay before starting animation in milliseconds
 */
const AnimatedEarnings = ({ value, style, duration = 1500, delay = 0 }) => {
  return (
    <AnimatedCount 
      value={value} 
      style={style} 
      prefix="$" 
      duration={duration}
      delay={delay}
      decimalPlaces={4} 
    />
  );
};

export default AnimatedEarnings;