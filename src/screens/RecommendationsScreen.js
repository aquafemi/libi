import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Linking } from 'react-native';
import { Text, Card, Title, Paragraph, Button, ActivityIndicator } from 'react-native-paper';
import { getUserTopArtists, getSimilarArtists } from '../api/lastfm';
import { getUsername } from '../utils/storage';

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
        
        similarArtistsResults.forEach(result => {
          if (result?.similarartists?.artist) {
            result.similarartists.artist.forEach(artist => {
              if (!seenArtists.has(artist.name.toLowerCase())) {
                seenArtists.add(artist.name.toLowerCase());
                allRecommendations.push({
                  ...artist,
                  // Add a placeholder for purchase links (in a real app, you might integrate with a music store API)
                  purchaseLinks: [
                    { name: 'Bandcamp', url: `https://bandcamp.com/search?q=${encodeURIComponent(artist.name)}` },
                    { name: 'iTunes', url: `https://music.apple.com/search?term=${encodeURIComponent(artist.name)}` },
                  ]
                });
              }
            });
          }
        });
        
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
        source={{ uri: item.image?.[3]?.['#text'] || 'https://via.placeholder.com/300' }} 
        style={styles.artistImage}
      />
      <Card.Content>
        <Title>{item.name}</Title>
        <Paragraph>Match score: {Math.round(parseFloat(item.match) * 100)}%</Paragraph>
      </Card.Content>
      <Card.Actions>
        {item.purchaseLinks?.map(link => (
          <Button 
            key={link.name}
            mode="contained" 
            onPress={() => openUrl(link.url)}
          >
            Buy on {link.name}
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
      <FlatList
        data={recommendations}
        renderItem={renderArtistItem}
        keyExtractor={(item, index) => `${item.mbid || item.name}-${index}`}
        contentContainerStyle={styles.list}
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
  card: {
    marginBottom: 16,
    marginHorizontal: 8,
    elevation: 2,
  },
  artistImage: {
    height: 200,
  },
});

export default RecommendationsScreen;