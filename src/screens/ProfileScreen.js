import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button, Surface } from 'react-native-paper';
import { saveUsername, getUsername } from '../utils/storage';

const ProfileScreen = () => {
  const [username, setUsername] = useState('');
  const [savedUsername, setSavedUsername] = useState('');
  
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
  
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Profile</Text>
      
      <Surface style={styles.surface}>
        <Text style={styles.label}>Last.fm Username</Text>
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
        >
          Save
        </Button>
        
        {savedUsername ? (
          <Text style={styles.savedMessage}>
            Tracking stats for: {savedUsername}
          </Text>
        ) : null}
      </Surface>
      
      <Surface style={styles.surface}>
        <Text style={styles.sectionTitle}>About this App</Text>
        <Text style={styles.aboutText}>
          Libi helps you track your music listening habits and recommends music you might want to buy based on your Last.fm history.
        </Text>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
});

export default ProfileScreen;