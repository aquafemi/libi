import React from 'react';
import { View, StyleSheet } from 'react-native';
import ThemedText from '../ThemedText';
import AnimatedCount from './AnimatedCount';
import AnimatedEarnings from './AnimatedEarnings';

/**
 * A row displaying entity name and stats (plays and earnings)
 * 
 * @param {Object} props
 * @param {string} props.label - The label to display (e.g., "Track", "Artist")
 * @param {string} props.name - The name to display 
 * @param {number} props.playCount - Number of plays
 * @param {string} props.earnings - Earnings amount formatted as string
 * @param {Object} props.theme - Theme object for styling
 * @param {string} props.earningsBackground - Background color for earnings badge
 * @param {number} props.animationDelay - Delay for animation in ms
 * @param {boolean} props.showDivider - Whether to show a divider at the bottom
 */
const StatRow = ({ 
  label, 
  name, 
  playCount, 
  earnings, 
  theme,
  earningsBackground,
  animationDelay = 0,
  showDivider = false
}) => {
  return (
    <View style={[
      styles.statRow, 
      showDivider && { 
        borderBottomWidth: 1, 
        borderBottomColor: 'rgba(0,0,0,0.05)',
        paddingBottom: 10,
        marginBottom: 12 
      }
    ]}>
      <View style={styles.nameContainer}>
        <ThemedText style={styles.labelText}>{label}</ThemedText>
        <ThemedText style={styles.nameText} numberOfLines={1}>{name}</ThemedText>
      </View>
      
      <View style={styles.statsContainer}>
        <AnimatedCount 
          value={playCount} 
          style={[styles.countText, { color: theme.colors.text }]}
          duration={1800}
          delay={animationDelay}
          suffix={playCount === 1 ? " play" : " plays"}
        />
        
        <AnimatedEarnings 
          value={earnings} 
          style={[styles.earningsText, { backgroundColor: earningsBackground }]} 
          duration={1800}
          delay={animationDelay + 300}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginVertical: 6,
  },
  nameContainer: {
    flex: 3,
    paddingRight: 8,
  },
  statsContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  labelText: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 2,
  },
  nameText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  countText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
  },
  earningsText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    overflow: 'hidden',
    fontFamily: 'monospace',
    marginTop: 4,
  }
});

export default StatRow;