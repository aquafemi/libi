import React from 'react';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

/**
 * A wrapper component that renders different icon types
 * 
 * @param {Object} props
 * @param {string} props.iconSet - The icon set to use ('fa5' for FontAwesome5, 'mc' for MaterialCommunityIcons)
 * @param {string} props.name - The name of the icon to display
 * @param {number} props.size - The size of the icon
 * @param {string} props.color - The color of the icon
 */
const IconComponent = ({ iconSet, name, size, color }) => {
  switch(iconSet) {
    case 'fa5':
      return <FontAwesome5 name={name} size={size} color={color} />;
    case 'mc':
    default:
      return <MaterialCommunityIcons name={name} size={size} color={color} />;
  }
};

export default IconComponent;