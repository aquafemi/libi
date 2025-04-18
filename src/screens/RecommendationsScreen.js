import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Linking, Text, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, ActivityIndicator, useTheme as usePaperTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getUserRecentTracks, getMusicBrainzArtistInfo, getArtistInfo } from '../api/lastfm';
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
        // Get user's recently played tracks
        const recentTracksData = await getUserRecentTracks(username, 100);
        
        if (!recentTracksData?.recenttracks?.track?.length) {
          throw new Error('No recent tracks found');
        }
        
        // Extract unique artists and count plays from recent tracks
        const artistSet = new Set();
        const artistPlayCounts = {};
        const uniqueArtists = [];
        const artistToTracksMap = {};
        
        // Count plays per artist and collect tracks by artist
        recentTracksData.recenttracks.track.forEach(track => {
          const artistName = track.artist['#text'] || track.artist.name;
          if (artistName) {
            const artistKey = artistName.toLowerCase();
            // Count plays
            artistPlayCounts[artistKey] = (artistPlayCounts[artistKey] || 0) + 1;
            
            // Store tracks for each artist
            if (!artistToTracksMap[artistKey]) {
              artistToTracksMap[artistKey] = [];
            }
            artistToTracksMap[artistKey].push(track);
          }
        });
        
        // Create artist objects with streaming earnings estimates
        recentTracksData.recenttracks.track.forEach(track => {
          const artistName = track.artist['#text'] || track.artist.name;
          if (artistName && !artistSet.has(artistName.toLowerCase())) {
            const artistKey = artistName.toLowerCase();
            artistSet.add(artistKey);
            
            // Get play count for this artist
            const playCount = artistPlayCounts[artistKey] || 1;
            
            // Get recent track for this artist for album artwork
            const artistTracks = artistToTracksMap[artistKey] || [];
            const recentTrack = artistTracks.length > 0 ? artistTracks[0] : null;
            
            // Calculate estimated streaming revenue
            // Average streaming rate is around $0.004 per stream across platforms
            const estimatedEarnings = (playCount * 0.004).toFixed(2);
            
            uniqueArtists.push({
              name: artistName,
              playCount: playCount,
              earnings: estimatedEarnings,
              // Add MusicBrainz ID if available
              mbid: track.artist.mbid || null,
              // Add recent track for album artwork
              recentTrack: recentTrack,
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
          }
        });
        
        // Limit to top 20 artists for performance
        const topRecentArtists = uniqueArtists.slice(0, 20);
        
        // Fetch additional artist info to get images
        const artistInfoPromises = topRecentArtists.map(artist => 
          getArtistInfo(artist.name).catch(() => null)
        );
        
        const artistInfoResults = await Promise.all(artistInfoPromises);
        
        // Merge artist info with our artist objects
        const enhancedArtists = topRecentArtists.map((artist, index) => {
          const artistInfo = artistInfoResults[index];
          if (artistInfo?.artist) {
            return {
              ...artist,
              image: artistInfo.artist.image || [],
              mbid: artistInfo.artist.mbid || artist.mbid,
              genre: artistInfo.artist.tags?.tag?.[0]?.name || 'Recently played',
            };
          }
          return artist;
        });
        
        // Get MusicBrainz info for artists (limit to 10 for performance)
        const processedArtists = await Promise.all(
          enhancedArtists.slice(0, 10).map(async (artist) => {
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
          ...enhancedArtists.slice(10)
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
          <Paragraph 
            numberOfLines={1} 
            style={[styles.earningsInfo, { color: theme.colors.text, opacity: 0.7 }]}
          >
            {item.playCount} {item.playCount === 1 ? 'play' : 'plays'} · ${item.earnings}
          </Paragraph>
          {item.recentTrack && (
            <Paragraph 
              numberOfLines={1} 
              style={[styles.trackInfo, { color: theme.colors.text, opacity: 0.8 }]}
            >
              Recent track: "{item.recentTrack.name}"
            </Paragraph>
          )}
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
      <Text style={[styles.header, { color: theme.colors.text }]}>Artists You've Recently Played</Text>
      <Text style={[styles.subheader, { color: theme.colors.text }]}>How much they've earned from your streams</Text>
      
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
  },
  earningsInfo: {
    fontSize: 14,
    marginTop: 2,
  },
  trackInfo: {
    fontSize: 13,
    marginTop: 4,
    fontStyle: 'italic',
  },
  purchaseContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 10,
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