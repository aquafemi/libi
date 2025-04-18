import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title } from 'react-native-paper';
import AnimatedCount from './ui/AnimatedCount';
import AnimatedEarnings from './ui/AnimatedEarnings';
import StatRow from './ui/StatRow';

/**
 * Component for displaying a track in a list
 * 
 * @param {Object} props
 * @param {Object} props.track - Track data
 * @param {number} props.index - Track index for animation delay
 * @param {Object} props.theme - Theme object for styling
 */
const TrackListItem = ({ track, index, theme }) => {
  return (
    <Card 
      style={[styles.trackCard, { backgroundColor: theme.colors.surface }]}
    >
      <Card.Content style={styles.trackContent}>
        <View style={styles.trackHeader}>
          <View style={styles.trackInfo}>
            <Title style={[styles.trackTitle, { color: theme.colors.text }]}>
              {track.name}
            </Title>
          </View>
        </View>
        
        <View style={styles.trackStats}>
          <StatRow
            label="Plays"
            name={`${track.userplaycount || 0}`}
            playCount={track.userplaycount || 0}
            earnings={track.earnings || '0.0000'}
            theme={theme}
            earningsBackground={theme.colors.accent}
            animationDelay={index * 200}
          />
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  trackCard: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  trackContent: {
    padding: 12,
  },
  trackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 18,
    marginBottom: 2,
  },
  trackStats: {
    marginTop: 8,
  },
});

export default TrackListItem;