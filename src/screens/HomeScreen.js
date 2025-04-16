import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, Card, Title, Paragraph, ActivityIndicator } from 'react-native-paper';
import { getUserRecentTracks } from '../api/lastfm';
import { getUsername } from '../utils/storage';

const HomeScreen = () => {
  const [recentTracks, setRecentTracks] = useState([]);
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
    const fetchRecentTracks = async () => {
      if (!username) return;
      
      try {
        setLoading(true);
        const data = await getUserRecentTracks(username);
        if (data && data.recenttracks && data.recenttracks.track) {
          setRecentTracks(data.recenttracks.track);
        }
        setError(null);
      } catch (err) {
        setError('Failed to fetch recent tracks. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentTracks();
  }, [username]);

  const renderTrackItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Cover 
        source={{ uri: item.image[3]['#text'] || 'https://via.placeholder.com/300' }} 
        style={styles.albumArt}
      />
      <Card.Content>
        <Title numberOfLines={1}>{item.name}</Title>
        <Paragraph numberOfLines={1}>{item.artist['#text']}</Paragraph>
        <Paragraph numberOfLines={1}>{item.album['#text']}</Paragraph>
      </Card.Content>
    </Card>
  );

  if (loading && !recentTracks.length) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error && !recentTracks.length) {
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
      <Text style={styles.header}>Recent Tracks</Text>
      <FlatList
        data={recentTracks}
        renderItem={renderTrackItem}
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
    padding: 16,
  },
  list: {
    padding: 8,
  },
  card: {
    marginBottom: 16,
    marginHorizontal: 8,
    elevation: 2,
  },
  albumArt: {
    height: 200,
  },
});

export default HomeScreen;