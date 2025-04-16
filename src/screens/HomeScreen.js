import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Image } from 'react-native';
import { Card, Title, Paragraph, ActivityIndicator, Avatar, useTheme as usePaperTheme } from 'react-native-paper';
import { getUserRecentTracks } from '../api/lastfm';
import { getUsername } from '../utils/storage';
import { getBestImage, getImageBySize, getTrackImage } from '../utils/imageHelper';
import { useTheme } from '../utils/themeContext';
import ThemeAwareScreen from '../components/ThemeAwareScreen';
import ThemedText from '../components/ThemedText';

const HomeScreen = () => {
  const [recentTracks, setRecentTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [username, setUsername] = useState('');
  
  // Get the current theme
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
    <Card 
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
      mode="elevated"
    >
      <Card.Cover 
        source={{ uri: getTrackImage(item) }} 
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
        <View style={styles.artistAlbumContainer}>
          <Paragraph 
            numberOfLines={1} 
            style={[styles.artistName, { color: theme.colors.text }]}
          >
            {item.artist['#text']}
          </Paragraph>
          <Paragraph 
            numberOfLines={1} 
            style={[styles.albumName, { color: theme.colors.text, opacity: 0.7 }]}
          >
            {item.album['#text']}
          </Paragraph>
        </View>
        {item['@attr']?.nowplaying === 'true' && (
          <View style={[styles.nowPlayingBadge, { backgroundColor: theme.colors.primary }]}>
            <ThemedText style={styles.nowPlayingText}>NOW PLAYING</ThemedText>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  if (loading && !recentTracks.length) {
    return (
      <ThemeAwareScreen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ThemeAwareScreen>
    );
  }

  if (error && !recentTracks.length) {
    return (
      <ThemeAwareScreen>
        <View style={styles.centered}>
          <ThemedText>{error}</ThemedText>
        </View>
      </ThemeAwareScreen>
    );
  }

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
      <ThemedText style={styles.header}>Recent Tracks</ThemedText>
      <FlatList
        data={recentTracks}
        renderItem={renderTrackItem}
        keyExtractor={(item, index) => `${item.mbid || item.name}-${index}`}
        contentContainerStyle={styles.list}
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
  },
  albumName: {
    fontSize: 14,
    marginTop: 2,
  },
  nowPlayingBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
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