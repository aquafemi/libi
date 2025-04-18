import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';
import { getArtistImage } from '../utils/imageHelper';
import ThemedText from './ThemedText';

/**
 * A card component for displaying an artist with play count and earnings
 * 
 * @param {Object} props
 * @param {Object} props.artist - Artist data
 * @param {Function} props.onPress - Function to call when card is pressed
 * @param {Object} props.theme - Theme object for styling
 */
const ArtistCard = ({ artist, onPress, theme }) => {
  const { rank, name, playcount, earnings, image } = artist;
  
  return (
    <TouchableOpacity
      onPress={() => onPress(artist)}
      activeOpacity={0.8}
    >
      <Card style={styles.card}>
        <Card.Cover 
          source={{ uri: getArtistImage(artist) }} 
          style={styles.artistImage}
        />
        {rank && (
          <View style={[styles.rankBadge, { backgroundColor: theme.colors.primary }]}>
            <ThemedText style={styles.rankBadgeText}>#{rank}</ThemedText>
          </View>
        )}
        <Card.Content style={styles.content}>
          <Title 
            numberOfLines={1} 
            style={[styles.title, { color: theme.colors.text }]}
          >
            {name}
          </Title>
          <View style={styles.statsRow}>
            <ThemedText style={styles.playCountLabel}>
              {parseInt(playcount).toLocaleString()} plays
            </ThemedText>
            <ThemedText style={[styles.earningsLabel, { color: theme.colors.primary }]}>
              ${earnings}
            </ThemedText>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 8,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 4,
    width: 180,
  },
  artistImage: {
    height: 180,
  },
  rankBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  rankBadgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playCountLabel: {
    fontSize: 12,
    opacity: 0.8,
  },
  earningsLabel: {
    fontSize: 13,
    fontWeight: 'bold',
  }
});

export default ArtistCard;