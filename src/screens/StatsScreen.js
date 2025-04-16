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
      {topArtists.slice(0, 10).map((artist, index) => (
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
          right={props => <Text style={styles.rank}>#{index + 1}</Text>}
          style={styles.listItem}
        />
      ))}
      
      <Text style={styles.subheader}>Top Tracks</Text>
      {topTracks.slice(0, 10).map((track, index) => (
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
          right={props => <Text style={styles.rank}>#{index + 1}</Text>}
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
    marginHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    elevation: 2,
  },
});

export default StatsScreen;