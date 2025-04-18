import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { List, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getArtistImage } from '../utils/imageHelper';

/**
 * Component for displaying an artist in a list
 * 
 * @param {Object} props
 * @param {Object} props.artist - Artist data
 * @param {Function} props.onPress - Function to call when item is pressed
 * @param {Object} props.theme - Theme object for styling
 */
const ArtistListItem = ({ artist, onPress, theme }) => {
  return (
    <TouchableOpacity 
      onPress={() => onPress(artist)}
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
    >
      <List.Item
        title={artist.name}
        description={artist.listeners ? 
          `Listeners: ${parseInt(artist.listeners).toLocaleString()}` : 
          (artist.playcount ? `${parseInt(artist.playcount).toLocaleString()} plays` : '')}
        titleStyle={{ color: theme.colors.text }}
        descriptionStyle={{ color: theme.colors.text, opacity: 0.7 }}
        left={props => (
          <Avatar.Image
            {...props}
            size={50}
            source={{ uri: getArtistImage(artist) }}
          />
        )}
        right={props => (
          <MaterialCommunityIcons
            {...props}
            name="chevron-right"
            size={24}
            color={theme.colors.text}
            style={{ marginTop: 12 }}
          />
        )}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    borderRadius: 8,
    elevation: 2,
  },
});

export default ArtistListItem;