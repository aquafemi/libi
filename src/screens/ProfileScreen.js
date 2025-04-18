import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { TextInput, Button, Surface, Switch, useTheme as usePaperTheme } from 'react-native-paper';
import { useTheme } from '../utils/themeContext';
import { useUser } from '../utils/userContext';
import ThemeAwareScreen from '../components/ThemeAwareScreen';

const ProfileScreen = () => {
  // Get username from context
  const { username: contextUsername, saveUsername, isLoading } = useUser();
  const [inputUsername, setInputUsername] = useState(contextUsername);
  
  // Get theme context and paper theme
  const { isDarkMode, toggleTheme } = useTheme();
  const paperTheme = usePaperTheme();
  
  // Update local state when context username changes
  React.useEffect(() => {
    if (contextUsername) {
      setInputUsername(contextUsername);
    }
  }, [contextUsername]);
  
  const handleSaveUsername = async () => {
    if (inputUsername && inputUsername.trim()) {
      const success = await saveUsername(inputUsername.trim());
      // Success is handled by the context
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
          value={inputUsername}
          onChangeText={setInputUsername}
          placeholder="Enter your Last.fm username"
          mode="outlined"
        />
        <Button 
          mode="contained" 
          onPress={handleSaveUsername}
          style={styles.button}
          color={theme.colors.primary}
          loading={isLoading}
        >
          Save
        </Button>
        
        {contextUsername ? (
          <Text style={[styles.savedMessage, { color: theme.colors.text }]}>
            Tracking stats for: {contextUsername}
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