import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, ActivityIndicator, List, Avatar, useTheme as usePaperTheme } from 'react-native-paper';
import { getUserTopArtists, getUserTopTracks, getMusicBrainzArtistInfo } from '../api/lastfm';
import { getUsername } from '../utils/storage';
import { getArtistImage, getTrackImage } from '../utils/imageHelper';
import { useTheme } from '../utils/themeContext';
import ThemeAwareScreen from '../components/ThemeAwareScreen';
import ThemedText from '../components/ThemedText';

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
          // Get artist data with MusicBrainz info for the top 5 artists (for performance)
          const topArtistsWithImages = await Promise.all(
            artistsData.topartists.artist.slice(0, 5).map(async (artist) => {
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
                console.error('Error fetching MB artist info:', error);
              }
              return artist;
            })
          );

          // Combine the artists with MB info with the rest of the artists
          const allArtists = [
            ...topArtistsWithImages,
            ...artistsData.topartists.artist.slice(5)
          ];

          setTopArtists(allArtists);
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

  // Get the current theme
  const { theme } = useTheme();
  const paperTheme = usePaperTheme();

  if (loading && !topArtists.length && !topTracks.length) {
    return (
      <ThemeAwareScreen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ThemeAwareScreen>
    );
  }

  if (error && !topArtists.length && !topTracks.length) {
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
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ThemedText style={styles.header}>Your Listening Stats</ThemedText>

        <ThemedText style={styles.subheader}>Top Artists</ThemedText>

        {/* Top 5 artists as cards in horizontal scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {topArtists.slice(0, 5).map((artist, index) => (
            <Card
              key={`artist-card-${artist.mbid || index}`}
              style={[styles.artistCard, { backgroundColor: theme.colors.surface }]}
            >
              <Card.Cover
                source={{ uri: getArtistImage(artist) }}
                style={styles.artistCardImage}
                resizeMode="cover"
              />
              <View style={[styles.rankBadge, { backgroundColor: theme.colors.primary }]}>
                <ThemedText style={styles.rankBadgeText}>#{index + 1}</ThemedText>
              </View>
              <Card.Content style={styles.artistCardContent}>
                <Title numberOfLines={1} style={[styles.artistCardTitle, { color: theme.colors.text }]}>
                  {artist.name}
                </Title>
                <Paragraph style={[styles.artistCardPlays, { color: theme.colors.text, opacity: 0.7 }]}>
                  {artist.playcount} plays
                </Paragraph>
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
            titleStyle={{ color: theme.colors.text }}
            descriptionStyle={{ color: theme.colors.text, opacity: 0.7 }}
            left={props =>
              <Avatar.Image
                {...props}
                size={50}
                source={{ uri: getArtistImage(artist) }}
              />
            }
            right={props => <ThemedText style={styles.rank}>#{index + 6}</ThemedText>}
            style={[styles.listItem, { backgroundColor: theme.colors.surface }]}
          />
        ))}

        <ThemedText style={styles.subheader}>Top Tracks</ThemedText>

        {/* Top 5 tracks as cards in horizontal scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {topTracks.slice(0, 5).map((track, index) => (
            <Card
              key={`track-card-${track.mbid || index}`}
              style={[styles.trackCard, { backgroundColor: theme.colors.surface }]}
            >
              <Card.Cover
                source={{ uri: getTrackImage(track) }}
                style={styles.trackCardImage}
                resizeMode="cover"
              />
              <View style={[styles.rankBadge, { backgroundColor: theme.colors.primary }]}>
                <ThemedText style={styles.rankBadgeText}>#{index + 1}</ThemedText>
              </View>
              <Card.Content style={styles.trackCardContent}>
                <Title numberOfLines={1} style={[styles.trackCardTitle, { color: theme.colors.text }]}>
                  {track.name}
                </Title>
                <Paragraph numberOfLines={1} style={[styles.trackCardArtist, { color: theme.colors.text, opacity: 0.85 }]}>
                  {track.artist.name}
                </Paragraph>
                <Paragraph style={[styles.trackCardPlays, { color: theme.colors.text, opacity: 0.7 }]}>
                  {track.playcount} plays
                </Paragraph>
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
            titleStyle={{ color: theme.colors.text }}
            descriptionStyle={{ color: theme.colors.text, opacity: 0.7 }}
            left={props =>
              <Avatar.Image
                {...props}
                size={50}
                source={{ uri: getTrackImage(track) }}
              />
            }
            right={props => <ThemedText style={styles.rank}>#{index + 6}</ThemedText>}
            style={[styles.listItem, { backgroundColor: theme.colors.surface }]}
          />
        ))}
      </ScrollView>
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