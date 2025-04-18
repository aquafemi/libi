import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Searchbar as PaperSearchbar, Button } from 'react-native-paper';

/**
 * Custom search bar component with search button
 * 
 * @param {Object} props
 * @param {string} props.value - Current search query
 * @param {Function} props.onChangeText - Function to call when text changes
 * @param {Function} props.onSubmit - Function to call when search is submitted
 * @param {Function} props.onClear - Function to call when search is cleared
 * @param {boolean} props.loading - Whether search is loading
 * @param {Object} props.theme - Theme object for styling
 */
const SearchBar = ({ 
  value, 
  onChangeText, 
  onSubmit, 
  onClear, 
  loading = false,
  theme 
}) => {
  return (
    <View style={styles.container}>
      <PaperSearchbar
        placeholder="Search for an artist"
        onChangeText={onChangeText}
        value={value}
        onSubmitEditing={onSubmit}
        style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
        iconColor={theme.colors.text}
        inputStyle={{ color: theme.colors.text }}
        placeholderTextColor={theme.colors.text + '88'}
        onClearIconPress={onClear}
      />
      <Button 
        mode="contained" 
        onPress={onSubmit} 
        style={styles.searchButton}
        disabled={loading}
        loading={loading}
      >
        Search
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  searchBar: {
    marginBottom: 8,
    elevation: 2,
  },
  searchButton: {
    marginTop: 8,
    marginBottom: 16,
  },
});

export default SearchBar;