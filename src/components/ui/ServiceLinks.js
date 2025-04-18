import React from 'react';
import { View, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import ThemedText from '../ThemedText';
import IconComponent from './IconComponent';

/**
 * Component to display music service links (streaming or purchase)
 * 
 * @param {Object} props
 * @param {string} props.title - Section title (e.g., "Stream", "Buy")
 * @param {Array} props.links - Array of link objects with icon, url, etc.
 */
const ServiceLinks = ({ title, links = [] }) => {
  const openUrl = (url) => {
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        console.log("Don't know how to open URI: " + url);
      }
    });
  };

  if (!links || links.length === 0) return null;

  return (
    <View style={styles.sectionContainer}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      <View style={styles.linksRow}>
        {links.map(link => (
          <TouchableOpacity 
            key={link.name}
            onPress={() => openUrl(link.url)}
            style={[styles.linkButton, { backgroundColor: link.color }]}
            activeOpacity={0.7}
          >
            <IconComponent 
              iconSet={link.iconSet} 
              name={link.icon} 
              size={20} 
              color="white" 
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    width: 50,
    marginRight: 4,
  },
  linksRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  linkButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    elevation: 2,
  },
});

export default ServiceLinks;