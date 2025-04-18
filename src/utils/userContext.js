import React, { createContext, useState, useContext, useEffect } from 'react';
import { getUsername, saveUsername as saveUsernameToStorage } from './storage';

// Create the context
const UserContext = createContext({
  username: '',
  isLoading: true,
  saveUsername: () => {},
});

// Provider component
export const UserProvider = ({ children }) => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Load username when the app starts
  useEffect(() => {
    const loadUsername = async () => {
      try {
        setIsLoading(true);
        const storedUsername = await getUsername();
        if (storedUsername) {
          setUsername(storedUsername);
        }
      } catch (error) {
        console.error('Error loading username:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUsername();
  }, []);
  
  // Function to save username
  const saveUsername = async (newUsername) => {
    if (newUsername && newUsername.trim()) {
      try {
        const cleanUsername = newUsername.trim();
        const success = await saveUsernameToStorage(cleanUsername);
        if (success) {
          setUsername(cleanUsername);
          return true;
        }
      } catch (error) {
        console.error('Error saving username:', error);
      }
    }
    return false;
  };
  
  // Context value
  const contextValue = {
    username,
    isLoading,
    saveUsername,
  };
  
  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the user context
export const useUser = () => useContext(UserContext);