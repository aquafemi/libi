import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList, StyleSheet, Linking, Text, TouchableOpacity, Animated } from 'react-native';
import { Card, Title, Paragraph, ActivityIndicator, useTheme as usePaperTheme } from 'react-native-paper';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { getUserRecentTracks, getMusicBrainzArtistInfo, getArtistInfo, getUserTopArtists, getTrackInfo } from '../api/lastfm';
import { getUsername } from '../utils/storage';
import { getArtistImage, getTrackImage } from '../utils/imageHelper';
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
  
  return <Text style={style}>{prefix}{displayValue}{suffix}</Text>;
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

const RecommendationsScreen = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [username, setUsername] = useState('');
  const { theme } = useTheme();
  const paperTheme = usePaperTheme();

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

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!username) return;
      
      try {
        setLoading(true);
        
        // Just fetch recent tracks - limit to 25 for better performance
        const recentTracksData = await getUserRecentTracks(username, 25);
        
        if (!recentTracksData?.recenttracks?.track?.length) {
          throw new Error('No recent tracks found');
        }
        
        // Extract unique artists from recent tracks
        const artistSet = new Set();
        const artistToTracksMap = {};
        
        // Organize recent tracks by artist
        recentTracksData.recenttracks.track.forEach(track => {
          const artistName = track.artist['#text'] || track.artist.name;
          
          if (artistName) {
            const artistKey = artistName.toLowerCase();
            
            // Store tracks for each artist (for album art and display)
            if (!artistToTracksMap[artistKey]) {
              artistToTracksMap[artistKey] = [];
            }
            artistToTracksMap[artistKey].push(track);
          }
        });
        
        // Create array to hold artists and prepare for batch processing
        const uniqueArtists = [];
        const apiPromises = [];
        
        // Process each unique artist from recent tracks (limit to 10 for speed)
        let count = 0;
        
        for (const track of recentTracksData.recenttracks.track) {
          const artistName = track.artist['#text'] || track.artist.name;
          if (artistName && !artistSet.has(artistName.toLowerCase())) {
            const artistKey = artistName.toLowerCase();
            artistSet.add(artistKey);
            
            // Get recent track for this artist (first one in the list)
            const artistTracks = artistToTracksMap[artistKey] || [];
            const recentTrack = artistTracks.length > 0 ? artistTracks[0] : null;
            
            if (!recentTrack) continue;
            
            // Create artist object with default values
            const artist = {
              name: artistName,
              playCount: 0,
              earnings: "0.0000",
              mbid: track.artist.mbid || '',
              recentTrack: recentTrack,
              trackPlayCount: 0,
              trackEarnings: "0.0000",
              genre: 'Recently played',
              streamingLinks: [
                { 
                  name: 'Spotify', 
                  icon: 'spotify', 
                  iconSet: 'fa5',
                  url: `https://open.spotify.com/search/${encodeURIComponent(artistName)}`,
                  color: '#1DB954'
                },
                { 
                  name: 'Apple Music', 
                  icon: 'apple', 
                  iconSet: 'mc',
                  url: `https://music.apple.com/search?term=${encodeURIComponent(artistName)}`,
                  color: '#fa243c'
                },
                { 
                  name: 'YouTube Music', 
                  icon: 'youtube', 
                  iconSet: 'mc',
                  url: `https://music.youtube.com/search?q=${encodeURIComponent(artistName)}`,
                  color: '#ff0000'
                },
                { 
                  name: 'Amazon Music', 
                  icon: 'amazon',
                  iconSet: 'fa5',
                  url: `https://music.amazon.com/search/${encodeURIComponent(artistName)}`,
                  color: '#00A8E1'
                },
              ],
              purchaseLinks: [
                { 
                  name: 'Amazon', 
                  icon: 'shopping-cart', 
                  iconSet: 'fa5', 
                  url: `https://www.amazon.com/s?k=${encodeURIComponent(artistName)}+music&i=digital-music`,
                  color: '#ff9900'
                },
              ]
            };
            
            uniqueArtists.push(artist);
            
            // Store the index of this artist
            const artistIndex = uniqueArtists.length - 1;
            
            // Create promises for the API calls
            const artistInfoPromise = getArtistInfo(artistName, username)
              .then(info => {
                if (info?.artist) {
                  // Update artist play count
                  if (info.artist.stats?.userplaycount) {
                    const playCount = parseInt(info.artist.stats.userplaycount, 10) || 0;
                    uniqueArtists[artistIndex].playCount = playCount;
                    uniqueArtists[artistIndex].earnings = (playCount * 0.004).toFixed(4);
                  }
                  
                  // Update artist metadata
                  uniqueArtists[artistIndex].image = info.artist.image || [];
                  uniqueArtists[artistIndex].mbid = info.artist.mbid || uniqueArtists[artistIndex].mbid;
                  uniqueArtists[artistIndex].genre = info.artist.tags?.tag?.[0]?.name || 'Recently played';
                }
              })
              .catch(err => console.error(`Error fetching artist info for ${artistName}:`, err));
            
            // Track info promise
            const trackInfoPromise = getTrackInfo(recentTrack.artist['#text'] || recentTrack.artist.name, recentTrack.name, username)
              .then(info => {
                if (info?.track?.userplaycount) {
                  const playCount = parseInt(info.track.userplaycount, 10) || 0;
                  uniqueArtists[artistIndex].trackPlayCount = playCount;
                  uniqueArtists[artistIndex].trackEarnings = (playCount * 0.004).toFixed(4);
                }
              })
              .catch(err => console.error(`Error fetching track info for ${recentTrack.name}:`, err));
            
            apiPromises.push(artistInfoPromise, trackInfoPromise);
            
            count++;
            if (count >= 10) break; // Limit to 10 artists for speed
          }
        }
        
        // Set initial recommendations immediately
        setRecommendations([...uniqueArtists]);
        setLoading(false);
        
        // Then wait for all API calls to finish and update the state
        await Promise.all(apiPromises);
        
        // Update recommendations with the data from API calls
        setRecommendations([...uniqueArtists]);
        setError(null);
      } catch (err) {
        setError('Failed to fetch recommendations. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [username]);

  const openUrl = (url) => {
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        console.log("Don't know how to open URI: " + url);
      }
    });
  };

  const renderArtistItem = ({ item }) => (
    <Card 
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
      mode="elevated"
    >
      <Card.Cover 
        source={{ uri: item.recentTrack ? getTrackImage(item.recentTrack) : getArtistImage(item) }} 
        style={styles.albumArt}
        resizeMode="cover"
      />
      <Card.Content style={styles.cardContent}>
        <Title 
          numberOfLines={1} 
          style={[styles.trackTitle, { color: theme.colors.text }]}
        >
          {item.name}
        </Title>
        <View style={styles.infoContainer}>
          <Paragraph 
            numberOfLines={1} 
            style={[styles.artistInfo, { color: theme.colors.text }]}
          >
            {item.genre || 'Recently played'}
          </Paragraph>
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>Artist:</Text>
              <View style={styles.statsValueContainer}>
                <View style={styles.playCountContainer}>
                  <AnimatedCount 
                    value={item.playCount} 
                    style={[styles.statsValue, { color: theme.colors.text }]}
                    duration={1800}
                    suffix={item.playCount === 1 ? " play" : " plays"}
                  />
                </View>
                <AnimatedEarnings 
                  value={item.earnings} 
                  style={[styles.earnings, { backgroundColor: theme.colors.primary }]} 
                  duration={2000}
                  delay={300}
                />
              </View>
            </View>
            
            {item.recentTrack && (
              <>
                <Paragraph 
                  numberOfLines={1} 
                  style={[styles.trackInfo, { color: theme.colors.text, opacity: 0.8 }]}
                >
                  Recent track: "{item.recentTrack.name}"
                </Paragraph>
                
                <View style={styles.statsRow}>
                  <Text style={styles.statsLabel}>Track:</Text>
                  <View style={styles.statsValueContainer}>
                    <View style={styles.playCountContainer}>
                      <AnimatedCount 
                        value={item.trackPlayCount} 
                        style={[styles.statsValue, { color: theme.colors.text }]}
                        duration={1800}
                        delay={400}
                        suffix={item.trackPlayCount === 1 ? " play" : " plays"}
                      />
                    </View>
                    <AnimatedEarnings 
                      value={item.trackEarnings} 
                      style={[styles.earnings, { backgroundColor: theme.colors.accent }]} 
                      duration={1500}
                      delay={700}
                    />
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
        <View style={styles.linksContainer}>
          <View style={styles.linksSectionHeader}>
            <Text style={[styles.linksSectionTitle, { color: theme.colors.text }]}>Stream</Text>
            <View style={styles.linksRow}>
              {item.streamingLinks?.map(link => (
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
            <Text style={[styles.linksSectionTitle, { color: theme.colors.text }]}>Buy</Text>
            <View style={styles.linksRow}>
              {item.purchaseLinks?.map(link => (
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
  );

  if (loading && !recommendations.length) {
    return (
      <ThemeAwareScreen style={styles.centered}>
        <ActivityIndicator size="large" />
      </ThemeAwareScreen>
    );
  }

  if (error && !recommendations.length) {
    return (
      <ThemeAwareScreen style={styles.centered}>
        <Text style={{ color: theme.colors.text }}>{error}</Text>
      </ThemeAwareScreen>
    );
  }

  if (!username) {
    return (
      <ThemeAwareScreen style={styles.centered}>
        <Text style={{ color: theme.colors.text }}>Please set your Last.fm username in the Profile tab.</Text>
      </ThemeAwareScreen>
    );
  }

  return (
    <ThemeAwareScreen>
      <Text style={[styles.header, { color: theme.colors.text }]}>Recent Artists</Text>
      <Text style={[styles.subheader, { color: theme.colors.text }]}>Artists you've recently played and their earnings</Text>
      
      <FlatList
        data={recommendations}
        renderItem={renderArtistItem}
        keyExtractor={(item, index) => `${item.mbid || item.name}-${index}`}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </ThemeAwareScreen>
  );
};

const styles = StyleSheet.create({
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
  subheader: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
    opacity: 0.7,
  },
  list: {
    padding: 8,
  },
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
  trackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infoContainer: {
    marginTop: 4,
  },
  artistInfo: {
    fontSize: 16,
    marginBottom: 4,
  },
  statsContainer: {
    marginTop: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  statsLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
    width: 45,
  },
  statsValueContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playCountContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  statsValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  earnings: {
    fontSize: 13,
    fontWeight: 'bold',
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    overflow: 'hidden',
    fontFamily: 'monospace',
  },
  trackInfo: {
    fontSize: 13,
    marginTop: 8,
    marginBottom: 2,
    fontStyle: 'italic',
  },
  linksContainer: {
    marginTop: 12,
  },
  linksSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  linksSectionTitle: {
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

export default RecommendationsScreen;