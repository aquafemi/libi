import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys
const USERNAME_KEY = 'lastfm_username';

// Save username
export const saveUsername = async (username) => {
  try {
    await AsyncStorage.setItem(USERNAME_KEY, username);
    return true;
  } catch (error) {
    console.error('Error saving username:', error);
    return false;
  }
};

// Get username
export const getUsername = async () => {
  try {
    return await AsyncStorage.getItem(USERNAME_KEY);
  } catch (error) {
    console.error('Error getting username:', error);
    return null;
  }
};

// Clear all app data
export const clearAppData = async () => {
  try {
    await AsyncStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing app data:', error);
    return false;
  }
};