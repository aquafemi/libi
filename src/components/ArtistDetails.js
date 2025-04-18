import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import { getArtistImage } from '../utils/imageHelper';
import ThemedText from './ThemedText';
import AnimatedCount from './ui/AnimatedCount';
import AnimatedEarnings from './ui/AnimatedEarnings';
import ServiceLinks from './ui/ServiceLinks';
import TrackListItem from './TrackListItem';

/**
 * Component for displaying detailed artist information
 * 
 * @param {Object} props
 * @param {Object} props.artist - Artist data object with details
 * @param {Function} props.onBack - Function to call when back button is pressed
 * @param {Object} props.theme - Theme object for styling
 */
const ArtistDetails = ({ artist, onBack, theme }) => {
  if (!artist) return null;

  return (
    <View style={styles.container}>
      <Card style={[styles.artistCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Cover
          source={{ uri: getArtistImage(artist) }}
          style={styles.artistImage}
          resizeMode="cover"
        />
        <Card.Content style={styles.artistContent}>
          <Title style={[styles.artistName, { color: theme.colors.text }]}>
            {artist.name}
          </Title>
          
          {artist.bio && artist.bio.summary && (
            <Paragraph style={[styles.artistBio, { color: theme.colors.text, opacity: 0.9 }]}>
              {artist.bio.summary.replace(/<[^>]*>/g, '')}
            </Paragraph>
          )}
          
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <ThemedText style={styles.statsLabel}>Plays:</ThemedText>
              <AnimatedCount
                value={artist.playCount || 0}
                style={[styles.statsValue, { color: theme.colors.text }]}
                duration={1800}
              />
            </View>
            
            <View style={styles.statsRow}>
              <ThemedText style={styles.statsLabel}>Earnings:</ThemedText>
              <AnimatedEarnings
                value={artist.earnings || '0.0000'}
                style={[styles.earnings, { backgroundColor: theme.colors.primary, color: 'white' }]}
                duration={2000}
                delay={300}
              />
            </View>
          </View>
          
          {/* Streaming and Purchase Links */}
          <View style={styles.linksContainer}>
            <ServiceLinks title="Stream" links={artist.streamingLinks} />
            <ServiceLinks title="Buy" links={artist.purchaseLinks} />
          </View>
        </Card.Content>
      </Card>
      
      {/* Top Tracks Section */}
      {artist.topTracks && artist.topTracks.length > 0 && (
        <View style={styles.topTracksSection}>
          <ThemedText style={styles.sectionTitle}>Top Tracks</ThemedText>
          {artist.topTracks.map((track, index) => (
            <TrackListItem
              key={`track-${index}`}
              track={track}
              index={index}
              theme={theme}
            />
          ))}
        </View>
      )}
      
      <Button 
        mode="outlined"
        onPress={onBack}
        style={styles.backButton}
      >
        Back to Search
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  artistCard: {
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 3,
    marginBottom: 24,
  },
  artistImage: {
    height: 200,
  },
  artistContent: {
    padding: 16,
  },
  artistName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  artistBio: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  statsContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  statsLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
    width: 75,
  },
  statsValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  earnings: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    fontFamily: 'monospace',
  },
  linksContainer: {
    marginTop: 16,
  },
  topTracksSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  backButton: {
    marginTop: 8,
    marginBottom: 24,
  },
});

export default ArtistDetails;