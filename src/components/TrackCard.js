import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title } from 'react-native-paper';
import { getTrackImage } from '../utils/imageHelper';
import { formatRelativeTime } from '../utils/formatters/dateFormatter';
import StatRow from './ui/StatRow';
import ServiceLinks from './ui/ServiceLinks';

/**
 * A card component displaying track information including artist info and play stats
 * 
 * @param {Object} props
 * @param {Object} props.track - Track data object
 * @param {Object} props.theme - Theme object for styling
 */
const TrackCard = ({ track, theme }) => {
  if (!track) return null;

  return (
    <Card 
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
      mode="elevated"
    >
      <Card.Cover 
        source={{ uri: getTrackImage(track) }} 
        style={styles.albumArt}
        resizeMode="cover"
      />
      <Card.Content style={styles.cardContent}>
        <Title 
          numberOfLines={1} 
          style={[styles.cardTitle, { color: theme.colors.text }]}
        >
          {track.date ? formatRelativeTime(track.date) : (track.nowPlaying ? 'Now Playing' : 'Recently')}
        </Title>
        
        <View style={styles.infoContainer}>
          <View style={styles.statsContainer}>
            {/* Track stats row */}
            <StatRow
              label="Track"
              name={track.name}
              playCount={track.playCount}
              earnings={track.earnings}
              theme={theme}
              earningsBackground={theme.colors.accent}
              animationDelay={200}
              showDivider={true}
            />
            
            {/* Artist stats row */}
            <StatRow
              label="Artist"
              name={track.artistName}
              playCount={track.artistPlayCount}
              earnings={track.artistEarnings}
              theme={theme}
              earningsBackground={theme.colors.primary}
              animationDelay={400}
            />
          </View>
          
          <View style={styles.linksContainer}>
            <ServiceLinks title="Stream" links={track.streamingLinks} />
            <ServiceLinks title="Buy" links={track.purchaseLinks} />
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    marginHorizontal: 8,
    elevation: 3,
    borderRadius: 10,
    overflow: 'hidden',
  },
  albumArt: {
    height: 220,
  },
  cardContent: {
    paddingVertical: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  infoContainer: {
    marginTop: 10,
  },
  statsContainer: {
    marginTop: 6,
  },
  linksContainer: {
    marginTop: 12,
  },
});

export default TrackCard;