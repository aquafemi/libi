import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native';
import { useTheme as usePaperTheme } from 'react-native-paper';
import ThemeAwareScreen from '../components/ThemeAwareScreen';
import ThemedText from '../components/ThemedText';
import TrackCard from '../components/TrackCard';
import LoadingAnimation from '../components/ui/LoadingAnimation';
import PaginationControls from '../components/ui/PaginationControls';
import { fetchRecentTracks } from '../services/trackService';
import { useTheme } from '../utils/themeContext';
import { useUser } from '../utils/userContext';
import usePagination from '../hooks/usePagination';

const ITEMS_PER_PAGE = 10;

/**
 * Screen displaying user's recent tracks with play counts and earnings
 */
const RecommendationsScreen = () => {
  const [allTracks, setAllTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { username, isLoading: userLoading } = useUser();
  const { theme } = useTheme();
  const paperTheme = usePaperTheme();
  
  // Use custom pagination hook
  const {
    currentPage,
    totalPages,
    displayedItems: displayedTracks,
    isChangingPage,
    listRef,
    handleNextPage,
    handlePrevPage
  } = usePagination(allTracks, ITEMS_PER_PAGE);

  // Fetch recent tracks when username changes
  useEffect(() => {
    const loadRecentTracks = async () => {
      if (!username) return;
      
      try {
        setLoading(true);
        
        // Use the service to fetch and process tracks
        const tracks = await fetchRecentTracks(username, 30); // Limit to 30 (3 pages)
        setAllTracks(tracks);
        setError(null);
      } catch (err) {
        setError('Failed to fetch recent tracks. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadRecentTracks();
  }, [username]);

  // Render track cards
  const renderTrackItem = ({ item }) => (
    <TrackCard track={item} theme={theme} />
  );

  // Content loading state
  if ((loading || userLoading) && !allTracks.length) {
    return (
      <ThemeAwareScreen style={styles.centered}>
        <LoadingAnimation />
      </ThemeAwareScreen>
    );
  }

  // Error state
  if (error && !allTracks.length) {
    return (
      <ThemeAwareScreen style={styles.centered}>
        <Text style={{ color: theme.colors.text }}>{error}</Text>
      </ThemeAwareScreen>
    );
  }

  // Username not set
  if (!username && !userLoading) {
    return (
      <ThemeAwareScreen style={styles.centered}>
        <Text style={{ color: theme.colors.text }}>Please set your Last.fm username in the Profile tab.</Text>
      </ThemeAwareScreen>
    );
  }

  return (
    <ThemeAwareScreen>
      <Text style={[styles.header, { color: theme.colors.text }]}>Recent Activity</Text>
      
      <View style={styles.topBar}>
        <Text style={[styles.subheader, { color: theme.colors.text }]}>
          Your recent listening history and earnings
        </Text>
      </View>
      
      {isChangingPage ? (
        <View style={styles.pageLoadingContainer}>
          <LoadingAnimation />
        </View>
      ) : (
        <>
          <FlatList
            ref={listRef}
            data={displayedTracks}
            renderItem={renderTrackItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
          
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPrevPage={handlePrevPage}
            onNextPage={handleNextPage}
            theme={theme}
          />
        </>
      )}
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
    paddingBottom: 8,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  subheader: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 12,
  },
  pageLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 300,
  },
  list: {
    padding: 8,
    paddingBottom: 70, // Add padding to account for pagination controls
  },
});

export default RecommendationsScreen;