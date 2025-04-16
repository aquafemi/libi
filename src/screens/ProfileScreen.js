import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { TextInput, Button, Surface, Switch, useTheme as usePaperTheme } from 'react-native-paper';
import { saveUsername, getUsername } from '../utils/storage';
import { useTheme } from '../utils/themeContext';
import ThemeAwareScreen from '../components/ThemeAwareScreen';

const ProfileScreen = () => {
  const [username, setUsername] = useState('');
  const [savedUsername, setSavedUsername] = useState('');
  
  // Get theme context and paper theme
  const { isDarkMode, toggleTheme } = useTheme();
  const paperTheme = usePaperTheme();
  
  useEffect(() => {
    // Load saved username when component mounts
    const loadUsername = async () => {
      const storedUsername = await getUsername();
      if (storedUsername) {
        setSavedUsername(storedUsername);
        setUsername(storedUsername);
      }
    };
    
    loadUsername();
  }, []);
  
  const handleSaveUsername = async () => {
    if (username.trim()) {
      const success = await saveUsername(username.trim());
      if (success) {
        setSavedUsername(username.trim());
      }
    }
  };
  
  const { theme } = useTheme();

  return (
    <ThemeAwareScreen style={styles.container}>
      <Text style={[styles.header, { color: theme.colors.text }]}>Your Profile</Text>
      
      <Surface style={[styles.surface, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Last.fm Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="Enter your Last.fm username"
          mode="outlined"
        />
        <Button 
          mode="contained" 
          onPress={handleSaveUsername}
          style={styles.button}
          color={theme.colors.primary}
        >
          Save
        </Button>
        
        {savedUsername ? (
          <Text style={[styles.savedMessage, { color: theme.colors.text }]}>
            Tracking stats for: {savedUsername}
          </Text>
        ) : null}
      </Surface>
      
      {/* Dark Mode Toggle */}
      <Surface style={[styles.surface, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.toggleContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            App Theme
          </Text>
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleText, { color: theme.colors.text }]}>
              {isDarkMode ? 'Dark Mode' : 'Light Mode'}
            </Text>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              color={theme.colors.primary}
            />
          </View>
        </View>
      </Surface>
      
      <Surface style={[styles.surface, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>About this App</Text>
        <Text style={[styles.aboutText, { color: theme.colors.text }]}>
          Libi helps you track your music listening habits and recommends music you might want to buy based on your Last.fm history.
        </Text>
      </Surface>
    </ThemeAwareScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  surface: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 4,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 16,
  },
  savedMessage: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 16,
    lineHeight: 24,
  },
  // Theme toggle styles
  toggleContainer: {
    flexDirection: 'column',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  toggleText: {
    fontSize: 16,
  },
});

export default ProfileScreen;