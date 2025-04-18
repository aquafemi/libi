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
        
        // Fetch recent tracks and top artists data
        const [recentTracksData, topArtistsData] = await Promise.all([
          getUserRecentTracks(username, 50),
          getUserTopArtists(username, 'overall', 100)
        ]);
        
        if (!recentTracksData?.recenttracks?.track?.length) {
          throw new Error('No recent tracks found');
        }
        
        // Create mapping from top artists API for artist play counts
        const topArtistsMap = {};
        
        // Process top artists data
        if (topArtistsData?.topartists?.artist) {
          topArtistsData.topartists.artist.forEach(artist => {
            const artistKey = artist.name.toLowerCase();
            topArtistsMap[artistKey] = {
              playcount: parseInt(artist.playcount, 10) || 0,
              mbid: artist.mbid || ''
            };
          });
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
        
        // Create array to hold artists
        const uniqueArtists = [];
        
        // Process each unique artist from recent tracks
        for (const track of recentTracksData.recenttracks.track) {
          const artistName = track.artist['#text'] || track.artist.name;
          if (artistName && !artistSet.has(artistName.toLowerCase())) {
            const artistKey = artistName.toLowerCase();
            artistSet.add(artistKey);
            
            // Get recent track for this artist (first one in the list)
            const artistTracks = artistToTracksMap[artistKey] || [];
            const recentTrack = artistTracks.length > 0 ? artistTracks[0] : null;
            
            if (!recentTrack) continue;
            
            try {
              // Get accurate artist play count using artist.getInfo with username
              const artistInfo = await getArtistInfo(artistName, username);
              
              // Extract user's play count for this artist
              let artistPlayCount = 0;
              if (artistInfo?.artist?.stats?.userplaycount) {
                artistPlayCount = parseInt(artistInfo.artist.stats.userplaycount, 10) || 0;
              }
              
              const estimatedEarnings = (artistPlayCount * 0.004).toFixed(4);
              
              // Get accurate track play count using track.getInfo
              const trackInfo = await getTrackInfo(
                recentTrack.artist['#text'] || recentTrack.artist.name,
                recentTrack.name,
                username
              );
              
              // Extract user's play count for this track
              let trackPlayCount = 0;
              if (trackInfo?.track?.userplaycount) {
                trackPlayCount = parseInt(trackInfo.track.userplaycount, 10) || 0;
              }
              
              const trackEarnings = (trackPlayCount * 0.004).toFixed(4);
              
              uniqueArtists.push({
                name: artistName,
                playCount: artistPlayCount,
                earnings: estimatedEarnings,
                // Add MusicBrainz ID if available
                mbid: track.artist.mbid || artistInfo?.artist?.mbid || '',
                // Add artist image from artist.getInfo response if available
                image: artistInfo?.artist?.image || [],
                // Add recent track and its all-time stats
                recentTrack: recentTrack,
                trackPlayCount: trackPlayCount,
                trackEarnings: trackEarnings,
                // Add genre from artist tags if available
                genre: artistInfo?.artist?.tags?.tag?.[0]?.name || 'Recently played',
                // Add purchase links
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
              });
            } catch (error) {
              console.error(`Error fetching info for artist ${artistName} or track ${recentTrack.name}:`, error);
              
              // Fallback to top artists data if the API calls fail
              const artistAllTimeStats = topArtistsMap[artistKey] || { playcount: 0 };
              const artistPlayCount = artistAllTimeStats.playcount || 1;
              const estimatedEarnings = (artistPlayCount * 0.004).toFixed(4);
              
              // Add artist with default track stats if API calls fail
              uniqueArtists.push({
                name: artistName,
                playCount: artistPlayCount,
                earnings: estimatedEarnings,
                mbid: track.artist.mbid || artistAllTimeStats.mbid,
                recentTrack: recentTrack,
                trackPlayCount: 0,
                trackEarnings: "0.00",
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
              });
            }
            
            // Limit to top 20 artists for performance
            if (uniqueArtists.length >= 20) break;
          }
        }
        
        // Get MusicBrainz info for artists (limit to 10 for performance) 
        // since we already have artist info with images from the artist.getInfo call
        const processedArtists = await Promise.all(
          uniqueArtists.slice(0, 10).map(async (artist) => {
            try {
              // Only fetch if artist has an mbid
              if (artist.mbid) {
                const mbInfo = await getMusicBrainzArtistInfo(artist.mbid);
                if (mbInfo) {
                  return {
                    ...artist,
                    mbArtistInfo: mbInfo
                  };
                }
              }
            } catch (error) {
              console.error(`Error fetching MB info for artist ${artist.name}:`, error);
            }
            return artist;
          })
        );
        
        // Combine the processed artists with any remaining artists
        const allRecommendations = [
          ...processedArtists,
          ...uniqueArtists.slice(10)
        ];
        
        setRecommendations(allRecommendations);
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