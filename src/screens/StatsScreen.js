import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Image } from 'react-native';
import { Text, Card, Title, Paragraph, ActivityIndicator, List, Avatar } from 'react-native-paper';
import { getUserTopArtists, getUserTopTracks } from '../api/lastfm';
import { getUsername } from '../utils/storage';
import { getBestImage, getImageBySize } from '../utils/imageHelper';

const StatsScreen = () => {
  const [topArtists, setTopArtists] = useState([]);
  const [topTracks, setTopTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [username, setUsername] = useState('');
  const [timeRange, setTimeRange] = useState('overall'); // 'overall', '7day', '1month', '3month', '6month', '12month'

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
    const fetchStats = async () => {
      if (!username) return;
      
      try {
        setLoading(true);
        const [artistsData, tracksData] = await Promise.all([
          getUserTopArtists(username, timeRange),
          getUserTopTracks(username, timeRange)
        ]);
        
        if (artistsData && artistsData.topartists && artistsData.topartists.artist) {
          setTopArtists(artistsData.topartists.artist);
        }
        
        if (tracksData && tracksData.toptracks && tracksData.toptracks.track) {
          setTopTracks(tracksData.toptracks.track);
        }
        
        setError(null);
      } catch (err) {
        setError('Failed to fetch stats. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [username, timeRange]);

  if (loading && !topArtists.length && !topTracks.length) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error && !topArtists.length && !topTracks.length) {
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
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Your Listening Stats</Text>
      
      <Text style={styles.subheader}>Top Artists</Text>
      
      {/* Top 5 artists as cards in horizontal scroll */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
        {topArtists.slice(0, 5).map((artist, index) => (
          <Card key={`artist-card-${artist.mbid || index}`} style={styles.artistCard}>
            <Card.Cover 
              source={{ uri: getBestImage(artist.image) }}
              style={styles.artistCardImage}
              resizeMode="cover"
            />
            <View style={styles.rankBadge}>
              <Text style={styles.rankBadgeText}>#{index + 1}</Text>
            </View>
            <Card.Content style={styles.artistCardContent}>
              <Title numberOfLines={1} style={styles.artistCardTitle}>{artist.name}</Title>
              <Paragraph style={styles.artistCardPlays}>{artist.playcount} plays</Paragraph>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
      
      {/* Remaining top artists as list items */}
      {topArtists.slice(5, 10).map((artist, index) => (
        <List.Item
          key={`artist-${artist.mbid || index}`}
          title={artist.name}
          description={`Playcount: ${artist.playcount}`}
          left={props => 
            <Avatar.Image 
              {...props} 
              size={50} 
              source={{ uri: getImageBySize(artist.image, 'large') }} 
            />
          }
          right={props => <Text style={styles.rank}>#{index + 6}</Text>}
          style={styles.listItem}
        />
      ))}
      
      <Text style={styles.subheader}>Top Tracks</Text>
      
      {/* Top 5 tracks as cards in horizontal scroll */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
        {topTracks.slice(0, 5).map((track, index) => (
          <Card key={`track-card-${track.mbid || index}`} style={styles.trackCard}>
            <Card.Cover 
              source={{ uri: getBestImage(track.image) }}
              style={styles.trackCardImage}
              resizeMode="cover"
            />
            <View style={styles.rankBadge}>
              <Text style={styles.rankBadgeText}>#{index + 1}</Text>
            </View>
            <Card.Content style={styles.trackCardContent}>
              <Title numberOfLines={1} style={styles.trackCardTitle}>{track.name}</Title>
              <Paragraph numberOfLines={1} style={styles.trackCardArtist}>{track.artist.name}</Paragraph>
              <Paragraph style={styles.trackCardPlays}>{track.playcount} plays</Paragraph>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
      
      {/* Remaining top tracks as list items */}
      {topTracks.slice(5, 10).map((track, index) => (
        <List.Item
          key={`track-${track.mbid || index}`}
          title={track.name}
          description={track.artist.name}
          left={props => 
            <Avatar.Image 
              {...props} 
              size={50} 
              source={{ uri: getImageBySize(track.image, 'large') }} 
            />
          }
          right={props => <Text style={styles.rank}>#{index + 6}</Text>}
          style={styles.listItem}
        />
      ))}
    </ScrollView>
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
  subheader: {
    fontSize: 20,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  rank: {
    fontSize: 16,
    opacity: 0.7,
  },
  listItem: {
    marginVertical: 4,
    marginHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    elevation: 2,
  },
  horizontalScroll: {
    paddingVertical: 8,
    paddingLeft: 16,
  },
  // Artist card styles
  artistCard: {
    width: 160,
    marginRight: 16,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 3,
    position: 'relative',
  },
  artistCardImage: {
    height: 160,
  },
  artistCardContent: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  artistCardTitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  artistCardPlays: {
    fontSize: 12,
    opacity: 0.7,
  },
  // Track card styles
  trackCard: {
    width: 160,
    marginRight: 16,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 3,
    position: 'relative',
  },
  trackCardImage: {
    height: 160,
  },
  trackCardContent: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  trackCardTitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  trackCardArtist: {
    fontSize: 12,
    marginBottom: 2,
    opacity: 0.8,
  },
  trackCardPlays: {
    fontSize: 12,
    opacity: 0.6,
  },
  // Rank badge
  rankBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(98, 0, 238, 0.85)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankBadgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default StatsScreen;