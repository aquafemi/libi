import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Linking } from 'react-native';
import { Text, Card, Title, Paragraph, Button, ActivityIndicator } from 'react-native-paper';
import { getUserTopArtists, getSimilarArtists, getArtistInfo, getMusicBrainzArtistInfo } from '../api/lastfm';
import { getUsername } from '../utils/storage';
import { getBestImage, getImageBySize, getArtistImage, extractWikimediaImage } from '../utils/imageHelper';

const RecommendationsScreen = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!username) return;
      
      try {
        setLoading(true);
        // First get user's top artists
        const topArtistsData = await getUserTopArtists(username, 'overall', 5);
        
        if (!topArtistsData?.topartists?.artist?.length) {
          throw new Error('No top artists found');
        }
        
        // Then get similar artists for each top artist
        const promises = topArtistsData.topartists.artist.map(artist => 
          getSimilarArtists(artist.name, 3)
        );
        
        const similarArtistsResults = await Promise.all(promises);
        
        // Process and deduplicate recommendations
        const allRecommendations = [];
        const seenArtists = new Set(topArtistsData.topartists.artist.map(a => a.name.toLowerCase()));
        
        // Create a new array to hold all recommendations with their MusicBrainz info
        const pendingRecommendations = [];
        
        // Process similar artists
        for (const result of similarArtistsResults) {
          if (result?.similarartists?.artist) {
            for (const artist of result.similarartists.artist) {
              if (!seenArtists.has(artist.name.toLowerCase())) {
                seenArtists.add(artist.name.toLowerCase());
                
                // Add purchase links and queue for MB processing
                const artistWithLinks = {
                  ...artist,
                  purchaseLinks: [
                    { name: 'Bandcamp', url: `https://bandcamp.com/search?q=${encodeURIComponent(artist.name)}` },
                    { name: 'iTunes', url: `https://music.apple.com/search?term=${encodeURIComponent(artist.name)}` },
                  ]
                };
                
                // If there's no valid image, add a custom fallback (will be replaced by the avatar generator)
                if (!artist.image || !Array.isArray(artist.image) || artist.image.length === 0) {
                  artistWithLinks.defaultImage = `https://via.placeholder.com/300?text=${encodeURIComponent(artist.name)}`;
                }
                
                pendingRecommendations.push(artistWithLinks);
              }
            }
          }
        }
        
        // Get MusicBrainz info for recommended artists (limit to 10 for performance)
        const processedRecommendations = await Promise.all(
          pendingRecommendations.slice(0, 10).map(async (artist) => {
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
        allRecommendations.push(
          ...processedRecommendations,
          ...pendingRecommendations.slice(10)
        );
        
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
    <Card style={styles.card}>
      <Card.Cover 
        source={{ uri: getArtistImage(item) }} 
        style={styles.artistImage}
        resizeMode="cover"
      />
      <View style={styles.matchBadge}>
        <Text style={styles.matchText}>{Math.round(parseFloat(item.match) * 100)}% match</Text>
      </View>
      <Card.Content style={styles.cardContent}>
        <Title style={styles.artistTitle} numberOfLines={1}>{item.name}</Title>
        <Paragraph style={styles.artistGenre} numberOfLines={1}>{item.genre || 'Similar to your top artists'}</Paragraph>
      </Card.Content>
      <Card.Actions style={styles.cardActions}>
        {item.purchaseLinks?.map(link => (
          <Button 
            key={link.name}
            mode="contained" 
            onPress={() => openUrl(link.url)}
            style={styles.purchaseButton}
            labelStyle={styles.buttonLabel}
            compact
          >
            {link.name}
          </Button>
        ))}
      </Card.Actions>
    </Card>
  );

  if (loading && !recommendations.length) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error && !recommendations.length) {
    return (
      <View style={styles.centered}>
        <Text>{error}</Text>
      </View>
    );
  }

  if (!username) {
    return (
      <View style={styles.centered}>
        <Text>Please set your Last.fm username in the Profile tab.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Recommended Artists to Buy</Text>
      <Text style={styles.subheader}>Based on your listening history</Text>
      
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  },
  purchaseButton: {
    margin: 2,
    borderRadius: 20,
    minWidth: 0,
  },
  buttonLabel: {
    fontSize: 10,
  },
  matchBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(98, 0, 238, 0.85)',
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