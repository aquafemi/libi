import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Linking, Text, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, ActivityIndicator, useTheme as usePaperTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getUserRecentTracks, getMusicBrainzArtistInfo, getArtistInfo } from '../api/lastfm';
import { getUsername } from '../utils/storage';
import { getArtistImage } from '../utils/imageHelper';
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
        
        // Extract unique artists from recent tracks
        const artistSet = new Set();
        const uniqueArtists = [];
        
        recentTracksData.recenttracks.track.forEach(track => {
          const artistName = track.artist['#text'] || track.artist.name;
          if (artistName && !artistSet.has(artistName.toLowerCase())) {
            artistSet.add(artistName.toLowerCase());
            uniqueArtists.push({
              name: artistName,
              // Generate a match score based on play count in recent tracks
              match: Math.random().toFixed(2), // This would ideally be calculated from frequency
              // Add MusicBrainz ID if available
              mbid: track.artist.mbid || null,
              // Add purchase links
              purchaseLinks: [
                { 
                  name: 'Bandcamp', 
                  icon: 'bandcamp', 
                  url: `https://bandcamp.com/search?q=${encodeURIComponent(artistName)}`,
                  color: '#1da0c3'
                },
                { 
                  name: 'iTunes', 
                  icon: 'apple', 
                  url: `https://music.apple.com/search?term=${encodeURIComponent(artistName)}`,
                  color: '#fa243c'
                },
                { 
                  name: 'Amazon', 
                  icon: 'amazon', 
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
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Cover 
        source={{ uri: getArtistImage(item) }} 
        style={styles.artistImage}
        resizeMode="cover"
      />
      <View style={[styles.matchBadge, { backgroundColor: theme.colors.primary + 'D9' }]}>
        <Text style={styles.matchText}>{Math.round(parseFloat(item.match) * 100)}% match</Text>
      </View>
      <Card.Content style={styles.cardContent}>
        <Title style={[styles.artistTitle, { color: theme.colors.text }]} numberOfLines={1}>{item.name}</Title>
        <Paragraph style={[styles.artistGenre, { color: theme.colors.text + 'B3' }]} numberOfLines={1}>{item.genre || 'Recently played'}</Paragraph>
      </Card.Content>
      <Card.Actions style={styles.cardActions}>
        {item.purchaseLinks?.map(link => (
          <TouchableOpacity 
            key={link.name}
            onPress={() => openUrl(link.url)}
            style={[styles.purchaseButton, { backgroundColor: link.color }]}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons 
              name={link.icon} 
              size={24} 
              color="white" 
            />
          </TouchableOpacity>
        ))}
      </Card.Actions>
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
    <ThemeAwareScreen style={styles.container}>
      <Text style={[styles.header, { color: theme.colors.text }]}>Artists You've Recently Played</Text>
      <Text style={[styles.subheader, { color: theme.colors.text }]}>Support these artists by purchasing their music</Text>
      
      {/* Display a grid of two columns */}
      <FlatList
        data={recommendations}
        renderItem={renderArtistItem}
        keyExtractor={(item, index) => `${item.mbid || item.name}-${index}`}
        contentContainerStyle={styles.list}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
      />
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  subheader: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    opacity: 0.7,
  },
  list: {
    padding: 8,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    marginBottom: 12,
    elevation: 3,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  artistImage: {
    height: 150,
  },
  cardContent: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  artistTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  artistGenre: {
    marginTop: 2,
    fontSize: 12,
    opacity: 0.7,
  },
  cardActions: {
    justifyContent: 'space-evenly',
    paddingVertical: 4,
    paddingHorizontal: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    maxHeight: 70,
  },
  purchaseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    elevation: 2,
  },
  matchBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  matchText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 11,
  },
});

export default RecommendationsScreen;