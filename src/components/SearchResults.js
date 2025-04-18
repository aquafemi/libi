import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button } from 'react-native-paper';
import ThemedText from './ThemedText';
import ArtistListItem from './ArtistListItem';
import LoadingAnimation from './ui/LoadingAnimation';

/**
 * Component for displaying artist search results
 * 
 * @param {Object} props
 * @param {Array} props.results - Array of search result objects
 * @param {boolean} props.loading - Whether search is loading
 * @param {Function} props.onSelectArtist - Function to call when an artist is selected
 * @param {Function} props.onClear - Function to call when search is cleared
 * @param {Object} props.theme - Theme object for styling
 */
const SearchResults = ({ 
  results, 
  loading, 
  onSelectArtist, 
  onClear,
  theme 
}) => {
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Search Results</ThemedText>
          <Button mode="text" onPress={onClear}>Clear</Button>
        </View>
        <LoadingAnimation />
      </View>
    );
  }
  
  if (!results || results.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Search Results</ThemedText>
          <Button mode="text" onPress={onClear}>Clear</Button>
        </View>
        <ThemedText style={styles.emptyText}>
          No artists found. Try a different search term.
        </ThemedText>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Search Results</ThemedText>
        <Button mode="text" onPress={onClear}>Clear</Button>
      </View>
      
      <ScrollView style={styles.list}>
        {results.map((artist, index) => (
          <ArtistListItem
            key={`result-${artist.mbid || index}`}
            artist={artist}
            onPress={onSelectArtist}
            theme={theme}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  list: {
    marginTop: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 24,
    opacity: 0.7,
  }
});

export default SearchResults;