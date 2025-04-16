import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Image } from 'react-native';
import { Text, Card, Title, Paragraph, ActivityIndicator, Avatar } from 'react-native-paper';
import { getUserRecentTracks } from '../api/lastfm';
import { getUsername } from '../utils/storage';
import { getBestImage, getImageBySize } from '../utils/imageHelper';

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
        source={{ uri: getBestImage(item.image) }} 
        style={styles.albumArt}
        resizeMode="cover"
      />
      <Card.Content style={styles.cardContent}>
        <Title numberOfLines={1} style={styles.trackTitle}>{item.name}</Title>
        <View style={styles.artistAlbumContainer}>
          <Paragraph numberOfLines={1} style={styles.artistName}>{item.artist['#text']}</Paragraph>
          <Paragraph numberOfLines={1} style={styles.albumName}>{item.album['#text']}</Paragraph>
        </View>
        {item['@attr']?.nowplaying === 'true' && (
          <View style={styles.nowPlayingBadge}>
            <Text style={styles.nowPlayingText}>NOW PLAYING</Text>
          </View>
        )}
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
  artistAlbumContainer: {
    marginTop: 4,
  },
  artistName: {
    fontSize: 16,
    opacity: 0.8,
  },
  albumName: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 2,
  },
  nowPlayingBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#6200ee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  nowPlayingText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default HomeScreen;