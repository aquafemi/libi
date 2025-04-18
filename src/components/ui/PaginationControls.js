import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ThemedText from '../ThemedText';

/**
 * Pagination controls component with prev/next buttons and page indicator
 * 
 * @param {Object} props
 * @param {number} props.currentPage - Current page index (0-based)
 * @param {number} props.totalPages - Total number of pages
 * @param {Function} props.onPrevPage - Function to call when prev button is pressed
 * @param {Function} props.onNextPage - Function to call when next button is pressed
 * @param {Object} props.theme - Theme object for styling
 * @param {Object} props.style - Additional styles to apply to the container
 */
const PaginationControls = ({ 
  currentPage, 
  totalPages, 
  onPrevPage, 
  onNextPage, 
  theme, 
  style 
}) => {
  if (totalPages <= 1) return null;
  
  return (
    <View 
      style={[
        styles.paginationContainer, 
        { 
          backgroundColor: theme.colors.surface + 'F0',
          borderTopColor: theme.colors.border || 'rgba(0,0,0,0.1)' 
        },
        style
      ]}
    >
      <View style={styles.controlsContainer}>
        <Button
          mode="outlined"
          onPress={onPrevPage}
          disabled={currentPage === 0}
          style={[styles.paginationButton, currentPage === 0 && styles.disabledButton]}
          contentStyle={styles.paginationButtonContent}
          icon={({ size, color }) => (
            <MaterialCommunityIcons name="chevron-left" size={size} color={color} />
          )}
        >
          Prev
        </Button>
        
        <ThemedText style={styles.pageCounter}>
          {currentPage + 1} / {totalPages}
        </ThemedText>
        
        <Button
          mode="outlined"
          onPress={onNextPage}
          disabled={currentPage >= totalPages - 1}
          style={[styles.paginationButton, currentPage >= totalPages - 1 && styles.disabledButton]}
          contentStyle={{...styles.paginationButtonContent, flexDirection: 'row-reverse', paddingLeft: 8}}
          icon={({ size, color }) => (
            <MaterialCommunityIcons name="chevron-right" size={size} color={color} />
          )}
        >
          Next
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  paginationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 10,
    borderTopWidth: 1,
    elevation: 8,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    padding: 8,
  },
  paginationButton: {
    minWidth: 100,
    borderRadius: 20,
  },
  paginationButtonContent: {
    paddingVertical: 4,
  },
  pageCounter: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 12,
  },
  disabledButton: {
    opacity: 0.4,
  },
});

export default PaginationControls;