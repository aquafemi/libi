import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Animated,
  Keyboard,
  Text,
  Linking,
  ActivityIndicator as RNActivityIndicator
} from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph, 
  ActivityIndicator, 
  List, 
  Avatar, 
  useTheme as usePaperTheme,
  Searchbar,
  Divider,
  Button
} from 'react-native-paper';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { 
  searchArtists, 
  getArtistInfo, 
  getMusicBrainzArtistInfo, 
  getTrackInfo,
  getUserTopArtists
} from '../api/lastfm';
import { getUsername } from '../utils/storage';
import { getArtistImage } from '../utils/imageHelper';
import { useTheme } from '../utils/themeContext';
import ThemeAwareScreen from '../components/ThemeAwareScreen';
import ThemedText from '../components/ThemedText';

// Animated count component for number animation
const AnimatedCount = ({ value, style, suffix = '', prefix = '', duration = 1500, delay = 0, decimalPlaces = 0 }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState('0');
  
  useEffect(() => {
    // Parse the initial value from string to number
    const finalValue = parseFloat(value) || 0;
    
    // Reset animation when value changes
    animatedValue.setValue(0);
    
    // Start animation after specified delay
    Animated.timing(animatedValue, {
      toValue: finalValue,
      duration: duration,
      delay: delay,
      useNativeDriver: false,
    }).start();
    
    // Update display value during animation
    const listener = animatedValue.addListener(({ value }) => {
      if (decimalPlaces > 0) {
        setDisplayValue(value.toFixed(decimalPlaces));
      } else {
        setDisplayValue(Math.floor(value).toLocaleString());
      }
    });
    
    // Clean up listener
    return () => {
      animatedValue.removeListener(listener);
    };
  }, [value, duration, delay, decimalPlaces]);
  
  return <ThemedText style={style}>{prefix}{displayValue}{suffix}</ThemedText>;
};

// Animated earnings component with counting up effect
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

// IconComponent to handle different icon types
const IconComponent = ({ iconSet, name, size, color }) => {
  switch(iconSet) {
    case 'fa5':
      return <FontAwesome5 name={name} size={size} color={color} />;
    case 'mc':
    default:
      return <MaterialCommunityIcons name={name} size={size} color={color} />;
  }
};

// Fun loading animation component
const LoadingAnimation = () => {
  const animations = Array(3).fill(0).map(() => useRef(new Animated.Value(0)).current);
  const [emoji] = useState(['🎵', '🎧', '🎸', '🎹', '🥁', '🎺', '🎻'][Math.floor(Math.random() * 7)]);
  
  useEffect(() => {
    const animations_sequence = animations.map((animation, i) => {
      return Animated.sequence([
        Animated.delay(i * 150),
        Animated.loop(
          Animated.sequence([
            Animated.timing(animation, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(animation, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ])
        )
      ]);
    });
    
    Animated.parallel(animations_sequence).start();
    
    return () => {
      animations.forEach(anim => anim.stopAnimation());
    };
  }, []);

  return (
    <View style={styles.loadingContainer}>
      <ThemedText style={styles.loadingText}>Loading your music data</ThemedText>
      <View style={styles.loadingIconsContainer}>
        {animations.map((anim, index) => (
          <Animated.Text 
            key={index}
            style={[
              styles.loadingEmoji,
              {
                opacity: anim,
                transform: [{
                  translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -15]
                  })
                }]
              }
            ]}
          >
            {emoji}
          </Animated.Text>
        ))}
      </View>
    </View>
  );
};

const StatsScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [artistData, setArtistData] = useState(null);
  const [topTracks, setTopTracks] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [topArtistsLoading, setTopArtistsLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [username, setUsername] = useState('');

  useEffect(() => {
    // Load saved username when component mounts
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
    const fetchTopArtists = async () => {
      if (!username) return;
      
      try {
        setTopArtistsLoading(true);
        
        // Get user's top artists
        const topArtistsData = await getUserTopArtists(username, 'overall', 20);
        
        if (topArtistsData?.topartists?.artist) {
          // Process each top artist with additional data
          const processedArtists = await Promise.all(
            topArtistsData.topartists.artist.map(async (artist, index) => {
              try {
                // Calculate streaming earnings
                const playCount = parseInt(artist.playcount, 10) || 0;
                const earnings = (playCount * 0.004).toFixed(4);
                
                // Get artist info with user stats
                const artistInfo = await getArtistInfo(artist.name, username);
                
                return {
                  ...artist,
                  rank: index + 1,
                  earnings,
                  image: artistInfo?.artist?.image || artist.image || [],
                  genre: artistInfo?.artist?.tags?.tag?.[0]?.name || 'Music',
                  streamingLinks: [
                    { 
                      name: 'Spotify', 
                      icon: 'spotify', 
                      iconSet: 'fa5',
                      url: `https://open.spotify.com/search/${encodeURIComponent(artist.name)}`,
                      color: '#1DB954'
                    },
                    { 
                      name: 'Apple Music', 
                      icon: 'apple', 
                      iconSet: 'mc',
                      url: `https://music.apple.com/search?term=${encodeURIComponent(artist.name)}`,
                      color: '#fa243c'
                    },
                    { 
                      name: 'YouTube Music', 
                      icon: 'youtube', 
                      iconSet: 'mc',
                      url: `https://music.youtube.com/search?q=${encodeURIComponent(artist.name)}`,
                      color: '#ff0000'
                    },
                    { 
                      name: 'Amazon Music', 
                      icon: 'amazon',
                      iconSet: 'fa5',
                      url: `https://music.amazon.com/search/${encodeURIComponent(artist.name)}`,
                      color: '#00A8E1'
                    },
                  ],
                  purchaseLinks: [
                    { 
                      name: 'Amazon', 
                      icon: 'shopping-cart', 
                      iconSet: 'fa5', 
                      url: `https://www.amazon.com/s?k=${encodeURIComponent(artist.name)}+music&i=digital-music`,
                      color: '#ff9900'
                    },
                  ]
                };
              } catch (error) {
                console.error(`Error processing top artist ${artist.name}:`, error);
                
                // Return basic artist info if processing fails
                return {
                  ...artist,
                  rank: index + 1,
                  earnings: (parseInt(artist.playcount, 10) * 0.004).toFixed(4)
                };
              }
            }).slice(0, 10) // Process only top 10 for performance
          );
          
          setTopArtists(processedArtists);
        }
      } catch (err) {
        console.error('Error fetching top artists:', err);
      } finally {
        setTopArtistsLoading(false);
      }
    };
    
    fetchTopArtists();
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
      
      const results = await searchArtists(searchQuery);
      if (results?.results?.artistmatches?.artist) {
        setSearchResults(results.results.artistmatches.artist);
      } else {
        setSearchResults([]);
      }
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
      
      // Get artist info with user's play count
      const artistInfo = await getArtistInfo(artist.name, username);
      
      // Get MusicBrainz data if available
      let mbInfo = null;
      if (artist.mbid) {
        mbInfo = await getMusicBrainzArtistInfo(artist.mbid);
      }
      
      // Get top tracks for this artist
      const topTracksData = [];
      if (artistInfo?.artist?.tracks?.track) {
        // Fetch user play count for each track
        for (const track of artistInfo.artist.tracks.track.slice(0, 5)) {
          try {
            const trackInfo = await getTrackInfo(artist.name, track.name, username);
            if (trackInfo?.track) {
              const playCount = parseInt(trackInfo.track.userplaycount || '0', 10);
              const earnings = (playCount * 0.004).toFixed(4);
              
              topTracksData.push({
                ...track,
                userplaycount: playCount,
                earnings
              });
            }
          } catch (e) {
            console.error(`Error fetching track info for ${track.name}:`, e);
          }
        }
      }
      
      // Calculate streaming revenue estimate
      let artistPlayCount = 0;
      if (artistInfo?.artist?.stats?.userplaycount) {
        artistPlayCount = parseInt(artistInfo.artist.stats.userplaycount, 10);
      }
      const estimatedEarnings = (artistPlayCount * 0.004).toFixed(4);
      
      // Create links to streaming and purchase platforms
      const streamingLinks = [
        { 
          name: 'Spotify', 
          icon: 'spotify', 
          iconSet: 'fa5',
          url: `https://open.spotify.com/search/${encodeURIComponent(artist.name)}`,
          color: '#1DB954'
        },
        { 
          name: 'Apple Music', 
          icon: 'apple', 
          iconSet: 'mc',
          url: `https://music.apple.com/search?term=${encodeURIComponent(artist.name)}`,
          color: '#fa243c'
        },
        { 
          name: 'YouTube Music', 
          icon: 'youtube', 
          iconSet: 'mc',
          url: `https://music.youtube.com/search?q=${encodeURIComponent(artist.name)}`,
          color: '#ff0000'
        },
        { 
          name: 'Amazon Music', 
          icon: 'amazon',
          iconSet: 'fa5',
          url: `https://music.amazon.com/search/${encodeURIComponent(artist.name)}`,
          color: '#00A8E1'
        },
      ];
      
      const purchaseLinks = [
        { 
          name: 'Amazon', 
          icon: 'shopping-cart', 
          iconSet: 'fa5', 
          url: `https://www.amazon.com/s?k=${encodeURIComponent(artist.name)}+music&i=digital-music`,
          color: '#ff9900'
        },
      ];
      
      // Set the artist data
      setArtistData({
        ...artistInfo?.artist,
        image: artistInfo?.artist?.image || [],
        mbInfo,
        playCount: artistPlayCount,
        earnings: estimatedEarnings,
        streamingLinks,
        purchaseLinks
      });
      
      setTopTracks(topTracksData);
      setError(null);
    } catch (err) {
      console.error('Error fetching artist details:', err);
      setError('Failed to fetch artist details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const { theme } = useTheme();
  const paperTheme = usePaperTheme();
  
  // Function to open URLs
  const openUrl = (url) => {
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        console.log("Don't know how to open URI: " + url);
      }
    });
  };

  // Render artist detail view
  const renderArtistDetails = () => {
    if (!artistData) return null;
    
    return (
      <View style={styles.artistDetails}>
        <Card style={[styles.artistCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Cover
            source={{ uri: getArtistImage(artistData) }}
            style={styles.artistImage}
            resizeMode="cover"
          />
          <Card.Content style={styles.artistContent}>
            <Title style={[styles.artistName, { color: theme.colors.text }]}>
              {artistData.name}
            </Title>
            
            {artistData.bio && artistData.bio.summary && (
              <Paragraph style={[styles.artistBio, { color: theme.colors.text, opacity: 0.9 }]}>
                {artistData.bio.summary.replace(/<[^>]*>/g, '')}
              </Paragraph>
            )}
            
            <View style={styles.statsContainer}>
              <View style={styles.statsRow}>
                <ThemedText style={styles.statsLabel}>Plays:</ThemedText>
                <AnimatedCount
                  value={artistData.playCount || 0}
                  style={[styles.statsValue, { color: theme.colors.text }]}
                  duration={1800}
                />
              </View>
              
              <View style={styles.statsRow}>
                <ThemedText style={styles.statsLabel}>Earnings:</ThemedText>
                <AnimatedEarnings
                  value={artistData.earnings || '0.0000'}
                  style={[styles.earnings, { backgroundColor: theme.colors.primary, color: 'white' }]}
                  duration={2000}
                  delay={300}
                />
              </View>
            </View>
            
            {/* Streaming Links */}
            <View style={styles.linksContainer}>
              <View style={styles.linksSectionHeader}>
                <ThemedText style={styles.linksSectionTitle}>Stream</ThemedText>
                <View style={styles.linksRow}>
                  {artistData.streamingLinks?.map(link => (
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
              
              <View style={styles.linksSectionHeader}>
                <ThemedText style={styles.linksSectionTitle}>Buy</ThemedText>
                <View style={styles.linksRow}>
                  {artistData.purchaseLinks?.map(link => (
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
            </View>
          </Card.Content>
        </Card>
        
        {/* Top Tracks Section */}
        {topTracks.length > 0 && (
          <View style={styles.topTracksSection}>
            <ThemedText style={styles.sectionTitle}>Top Tracks</ThemedText>
            {topTracks.map((track, index) => (
              <Card 
                key={`track-${index}`}
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
                    <View style={styles.statsRow}>
                      <ThemedText style={styles.statsLabel}>Plays:</ThemedText>
                      <AnimatedCount
                        value={track.userplaycount || 0}
                        style={[styles.statsValue, { color: theme.colors.text }]}
                        duration={1500}
                        delay={index * 200}
                      />
                    </View>
                    
                    <View style={styles.statsRow}>
                      <ThemedText style={styles.statsLabel}>Earnings:</ThemedText>
                      <AnimatedEarnings
                        value={track.earnings || '0.0000'}
                        style={[styles.earnings, { backgroundColor: theme.colors.accent, color: 'white' }]}
                        duration={1800}
                        delay={300 + (index * 200)}
                      />
                    </View>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}
        
        <Button 
          mode="outlined"
          onPress={() => setSelectedArtist(null)}
          style={styles.backButton}
        >
          Back to Search
        </Button>
      </View>
    );
  };
  
  // Render top artists
  const renderTopArtists = () => {
    return (
      <View style={styles.topArtistsContainer}>
        <ThemedText style={styles.sectionTitle}>Your Top Artists</ThemedText>
        
        {topArtistsLoading ? (
          <LoadingAnimation />
        ) : (
          <>
            {/* Featured top 3 artists in cards */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.featuredArtistsScroll}
            >
              {topArtists.slice(0, 3).map((artist, index) => (
                <TouchableOpacity
                  key={`featured-${artist.mbid || index}`}
                  onPress={() => fetchArtistDetails(artist)}
                  activeOpacity={0.8}
                >
                  <Card style={styles.featuredArtistCard}>
                    <Card.Cover 
                      source={{ uri: getArtistImage(artist) }} 
                      style={styles.featuredArtistImage}
                    />
                    <View style={[styles.rankBadge, { backgroundColor: theme.colors.primary }]}>
                      <ThemedText style={styles.rankBadgeText}>#{artist.rank}</ThemedText>
                    </View>
                    <Card.Content style={styles.featuredArtistContent}>
                      <Title 
                        numberOfLines={1} 
                        style={[styles.featuredArtistTitle, { color: theme.colors.text }]}
                      >
                        {artist.name}
                      </Title>
                      <View style={styles.statsRow}>
                        <Text style={[styles.playCountLabel, { color: theme.colors.text }]}>
                          {parseInt(artist.playcount).toLocaleString()} plays
                        </Text>
                        <Text style={[styles.earningsLabel, { color: theme.colors.primary }]}>
                          ${artist.earnings}
                        </Text>
                      </View>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {/* Remaining top artists as list */}
            <View style={styles.remainingArtistsContainer}>
              {topArtists.slice(3, 10).map((artist, index) => (
                <TouchableOpacity 
                  key={`remaining-${artist.mbid || index}`}
                  onPress={() => fetchArtistDetails(artist)}
                  style={[styles.topArtistItem, { backgroundColor: theme.colors.surface }]}
                >
                  <List.Item
                    title={artist.name}
                    description={`${parseInt(artist.playcount).toLocaleString()} plays · $${artist.earnings}`}
                    titleStyle={{ color: theme.colors.text }}
                    descriptionStyle={{ color: theme.colors.text, opacity: 0.7 }}
                    left={props => (
                      <Avatar.Image
                        {...props}
                        size={50}
                        source={{ uri: getArtistImage(artist) }}
                      />
                    )}
                    right={props => (
                      <View style={styles.rankContainer}>
                        <Text style={[styles.rankNumber, { color: theme.colors.text }]}>
                          #{artist.rank}
                        </Text>
                      </View>
                    )}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>
    );
  };

  // Render search results
  const renderSearchResults = () => {
    return (
      <View style={styles.searchResultsContainer}>
        <View style={styles.searchResultsHeader}>
          <ThemedText style={styles.resultsTitle}>Search Results</ThemedText>
          <Button 
            mode="text" 
            onPress={clearSearch}
            style={styles.clearButton}
          >
            Clear
          </Button>
        </View>
        
        {searchResults.length === 0 && !searchLoading && (
          <ThemedText style={styles.noResultsText}>No artists found. Try a different search term.</ThemedText>
        )}
        
        {searchLoading ? (
          <LoadingAnimation />
        ) : (
          <ScrollView style={styles.resultsList}>
            {searchResults.map((artist, index) => (
              <TouchableOpacity 
                key={`result-${artist.mbid || index}`}
                onPress={() => fetchArtistDetails(artist)}
                style={[styles.resultItem, { backgroundColor: theme.colors.surface }]}
              >
                <List.Item
                  title={artist.name}
                  description={`Listeners: ${parseInt(artist.listeners).toLocaleString()}`}
                  titleStyle={{ color: theme.colors.text }}
                  descriptionStyle={{ color: theme.colors.text, opacity: 0.7 }}
                  left={props => (
                    <Avatar.Image
                      {...props}
                      size={50}
                      source={{ uri: artist.image?.[1]?.['#text'] || 'https://lastfm.freetls.fastly.net/i/u/avatar170s/818148bf682d429dc215c1705eb27b98' }}
                    />
                  )}
                  right={props => (
                    <MaterialCommunityIcons
                      {...props}
                      name="chevron-right"
                      size={24}
                      color={theme.colors.text}
                      style={{ marginTop: 12 }}
                    />
                  )}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

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
        
        {/* Search bar */}
        {!selectedArtist && (
          <View style={styles.searchContainer}>
            <Searchbar
              placeholder="Search for an artist"
              onChangeText={setSearchQuery}
              value={searchQuery}
              onSubmitEditing={handleSearch}
              style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
              iconColor={theme.colors.text}
              inputStyle={{ color: theme.colors.text }}
              placeholderTextColor={theme.colors.text + '88'}
              onClearIconPress={clearSearch}
            />
            <Button 
              mode="contained" 
              onPress={handleSearch} 
              style={styles.searchButton}
              disabled={searchLoading}
            >
              Search
            </Button>
            
            <ThemedText style={styles.instructionsText}>
              Search for an artist to see your play counts and estimated streaming earnings.
            </ThemedText>
          </View>
        )}
        
        {/* Error message */}
        {error && (
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        )}
        
        {/* Loading indicator for artist details */}
        {loading && (
          <View style={styles.centered}>
            <LoadingAnimation />
          </View>
        )}
        
        {/* Artist details view */}
        {selectedArtist && !loading && renderArtistDetails()}
        
        {/* Search results */}
        {!selectedArtist && searchResults.length > 0 && renderSearchResults()}
        
        {/* Top artists when no search is active */}
        {!selectedArtist && searchResults.length === 0 && !searchQuery && renderTopArtists()}
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
  // Search section
  searchContainer: {
    padding: 16,
  },
  searchBar: {
    marginBottom: 8,
    elevation: 2,
  },
  searchButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  instructionsText: {
    fontSize: 14,
    opacity: 0.8,
    textAlign: 'center',
    marginTop: 8,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 16,
  },
  // Search results
  searchResultsContainer: {
    padding: 16,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  resultsList: {
    marginTop: 8,
  },
  resultItem: {
    marginBottom: 8,
    borderRadius: 8,
    elevation: 2,
  },
  noResultsText: {
    textAlign: 'center',
    marginTop: 24,
    opacity: 0.7,
  },
  loadingIndicator: {
    marginTop: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  loadingText: {
    fontSize: 18,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  loadingIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingEmoji: {
    fontSize: 24,
    marginHorizontal: 8,
  },
  // Artist details
  artistDetails: {
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
  // Stats styling
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
  // Links styling
  linksContainer: {
    marginTop: 16,
  },
  linksSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  linksSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 60,
    marginRight: 8,
  },
  linksRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  linkButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    elevation: 2,
  },
  // Top tracks section
  topTracksSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
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
  // Back button
  backButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  // Top artists styles
  topArtistsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  featuredArtistsScroll: {
    marginBottom: 24,
  },
  featuredArtistCard: {
    width: 180,
    marginRight: 16,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 4,
  },
  featuredArtistImage: {
    height: 180,
  },
  featuredArtistContent: {
    padding: 12,
  },
  featuredArtistTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  rankBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  rankBadgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  playCountLabel: {
    fontSize: 12,
    opacity: 0.8,
  },
  earningsLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  remainingArtistsContainer: {
    marginTop: 8,
  },
  topArtistItem: {
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2,
  },
  rankContainer: {
    justifyContent: 'center',
    paddingRight: 8,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    opacity: 0.7,
  },
  searchResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearButton: {
    marginTop: -8,
  }
});

export default StatsScreen;