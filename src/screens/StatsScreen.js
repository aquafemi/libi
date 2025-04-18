import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Keyboard } from 'react-native';
import { useTheme as usePaperTheme } from 'react-native-paper';
import { getUsername } from '../utils/storage';
import { useTheme } from '../utils/themeContext';
import ThemeAwareScreen from '../components/ThemeAwareScreen';
import ThemedText from '../components/ThemedText';
import SearchBar from '../components/SearchBar';
import SearchResults from '../components/SearchResults';
import ArtistDetails from '../components/ArtistDetails';
import TopArtistsSection from '../components/TopArtistsSection';
import { searchForArtists, getDetailedArtistInfo, fetchTopArtists } from '../services/artistService';

/**
 * Screen for displaying artist statistics and search
 */
const StatsScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [artistData, setArtistData] = useState(null);
  const [topArtists, setTopArtists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [topArtistsLoading, setTopArtistsLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [username, setUsername] = useState('');
  const { theme } = useTheme();
  const paperTheme = usePaperTheme();

  // Load username when component mounts
  useEffect(() => {
    const loadUsername = async () => {
      const storedUsername = await getUsername();
      if (storedUsername) {
        setUsername(storedUsername);
      }
    };

    loadUsername();
  }, []);
  
  // Fetch top artists when username changes
  useEffect(() => {
    const loadTopArtists = async () => {
      if (!username) return;
      
      try {
        setTopArtistsLoading(true);
        
        // Get user's top artists
        const artists = await fetchTopArtists(username, 'overall', 10);
        setTopArtists(artists);
      } catch (err) {
        console.error('Error fetching top artists:', err);
      } finally {
        setTopArtistsLoading(false);
      }
    };
    
    loadTopArtists();
  }, [username]);

  // Function to search for artists
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      // Clear search results if search is empty
      setSearchResults([]);
      return;
    }
    
    try {
      setSearchLoading(true);
      Keyboard.dismiss();
      
      const results = await searchForArtists(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error('Error searching artists:', err);
      setError('Failed to search artists. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };
  
  // Clear search function
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  // Function to fetch artist details
  const fetchArtistDetails = async (artist) => {
    if (!artist || !username) return;
    
    try {
      setLoading(true);
      setSelectedArtist(artist);
      
      // Get detailed artist info
      const detailedArtist = await getDetailedArtistInfo(artist, username);
      setArtistData(detailedArtist);
      setError(null);
    } catch (err) {
      console.error('Error fetching artist details:', err);
      setError('Failed to fetch artist details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Return to search/top artists view
  const handleBackToSearch = () => {
    setSelectedArtist(null);
    setArtistData(null);
  };

  // Username not set
  if (!username) {
    return (
      <ThemeAwareScreen>
        <View style={styles.centered}>
          <ThemedText>Please set your Last.fm username in the Profile tab.</ThemedText>
        </View>
      </ThemeAwareScreen>
    );
  }

  return (
    <ThemeAwareScreen>
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedText style={styles.header}>Artist Stats</ThemedText>
        
        {/* Search bar - show only when no artist is selected */}
        {!selectedArtist && (
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmit={handleSearch}
            onClear={clearSearch}
            loading={searchLoading}
            theme={theme}
          />
        )}
        
        {/* Error message */}
        {error && (
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        )}
        
        {/* Artist details view */}
        {selectedArtist && !loading && artistData && (
          <ArtistDetails 
            artist={artistData} 
            onBack={handleBackToSearch}
            theme={theme}
          />
        )}
        
        {/* Loading indicator for artist details */}
        {loading && (
          <View style={styles.centered}>
            <TopArtistsSection
              artists={[]}
              loading={true}
              onSelectArtist={() => {}}
              theme={theme}
            />
          </View>
        )}
        
        {/* Search results */}
        {!selectedArtist && searchResults.length > 0 && (
          <SearchResults
            results={searchResults}
            loading={searchLoading}
            onSelectArtist={fetchArtistDetails}
            onClear={clearSearch}
            theme={theme}
          />
        )}
        
        {/* Top artists when no search is active */}
        {!selectedArtist && searchResults.length === 0 && !searchQuery && (
          <TopArtistsSection
            artists={topArtists}
            loading={topArtistsLoading}
            onSelectArtist={fetchArtistDetails}
            theme={theme}
          />
        )}
      </ScrollView>
    </ThemeAwareScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 16,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 16,
  },
});

export default StatsScreen;