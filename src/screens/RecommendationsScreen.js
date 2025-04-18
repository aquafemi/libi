import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Linking, Text, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, ActivityIndicator, useTheme as usePaperTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getUserRecentTracks, getMusicBrainzArtistInfo, getArtistInfo, getUserTopArtists, getTrackInfo } from '../api/lastfm';
import { getUsername } from '../utils/storage';
import { getArtistImage, getTrackImage } from '../utils/imageHelper';
import { useTheme } from '../utils/themeContext';
import ThemeAwareScreen from '../components/ThemeAwareScreen';
import ThemedText from '../components/ThemedText';

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
              purchaseLinks: [
                { 
                  name: 'iTunes', 
                  icon: 'apple', 
                  url: `https://music.apple.com/search?term=${encodeURIComponent(artistName)}`,
                  color: '#fa243c'
                },
                { 
                  name: 'Amazon', 
                  icon: 'cart', 
                  url: `https://www.amazon.com/s?k=${encodeURIComponent(artistName)}+music&i=digital-music`,
                  color: '#ff9900'
                },
                { 
                  name: 'YouTube', 
                  icon: 'youtube', 
                  url: `https://music.youtube.com/search?q=${encodeURIComponent(artistName)}`,
                  color: '#ff0000'
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
                <Text style={[styles.statsValue, { color: theme.colors.text }]}>
                  {item.playCount.toLocaleString()} {item.playCount === 1 ? 'play' : 'plays'}
                </Text>
                <Text style={[styles.earnings, { backgroundColor: theme.colors.primary }]}>
                  ${parseFloat(item.earnings).toFixed(4)}
                </Text>
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
                    <Text style={[styles.statsValue, { color: theme.colors.text }]}>
                      {item.trackPlayCount.toLocaleString()} {item.trackPlayCount === 1 ? 'play' : 'plays'}
                    </Text>
                    <Text style={[styles.earnings, { backgroundColor: theme.colors.accent }]}>
                      ${parseFloat(item.trackEarnings).toFixed(4)}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
        <View style={styles.purchaseContainer}>
          {item.purchaseLinks?.map(link => (
            <TouchableOpacity 
              key={link.name}
              onPress={() => openUrl(link.url)}
              style={[styles.purchaseButton, { backgroundColor: link.color }]}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name={link.icon} size={24} color="white" />
            </TouchableOpacity>
          ))}
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
      <Text style={[styles.header, { color: theme.colors.text }]}>Recent Tracks</Text>
      <Text style={[styles.subheader, { color: theme.colors.text }]}>See how much artists have made from your listening</Text>
      
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
  purchaseContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 12,
  },
  purchaseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    elevation: 2,
  },
});

export default RecommendationsScreen;