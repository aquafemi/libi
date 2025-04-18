import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import ArtistCard from './ArtistCard';
import ArtistListItem from './ArtistListItem';
import ThemedText from './ThemedText';
import LoadingAnimation from './ui/LoadingAnimation';

/**
 * Component for displaying user's top artists
 * 
 * @param {Object} props
 * @param {Array} props.artists - Array of top artist objects
 * @param {boolean} props.loading - Whether top artists are loading
 * @param {Function} props.onSelectArtist - Function to call when an artist is selected
 * @param {Object} props.theme - Theme object for styling
 */
const TopArtistsSection = ({ artists, loading, onSelectArtist, theme }) => {
  if (loading) {
    return <LoadingAnimation />;
  }
  
  if (!artists || artists.length === 0) {
    return <ThemedText style={styles.emptyText}>No top artists found</ThemedText>;
  }
  
  return (
    <View style={styles.container}>
      <ThemedText style={styles.sectionTitle}>Your Top Artists</ThemedText>
      
      {/* Featured top 3 artists in cards */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.featuredScroll}
      >
        {artists.slice(0, 3).map((artist, index) => (
          <ArtistCard 
            key={`featured-${artist.mbid || index}`}
            artist={artist}
            onPress={onSelectArtist}
            theme={theme}
          />
        ))}
      </ScrollView>
      
      {/* Remaining top artists as list */}
      <View style={styles.remainingContainer}>
        {artists.slice(3).map((artist, index) => (
          <ArtistListItem
            key={`remaining-${artist.mbid || index}`}
            artist={artist}
            onPress={onSelectArtist}
            theme={theme}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  featuredScroll: {
    marginBottom: 24,
  },
  remainingContainer: {
    marginTop: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 24,
    opacity: 0.7,
  }
});

export default TopArtistsSection;