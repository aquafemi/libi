import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../utils/themeContext';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import StatsScreen from '../screens/StatsScreen';
import RecommendationsScreen from '../screens/RecommendationsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack navigators for each tab if needed
const HomeStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
  </Stack.Navigator>
);

const StatsStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Stats" component={StatsScreen} options={{ headerShown: false }} />
  </Stack.Navigator>
);

const RecommendationsStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Recommendations" component={RecommendationsScreen} options={{ headerShown: false }} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
  </Stack.Navigator>
);

const AppNavigator = () => {
  // Get theme from context
  const { theme, isDarkMode } = useTheme();
  
  // Use the already combined theme
  const navigationTheme = theme;
  
  return (
    <NavigationContainer theme={navigationTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'HomeTab') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'StatsTab') {
              iconName = focused ? 'chart-bar' : 'chart-bar-stacked';
            } else if (route.name === 'RecommendationsTab') {
              iconName = focused ? 'shopping' : 'shopping-outline';
            } else if (route.name === 'ProfileTab') {
              iconName = focused ? 'account' : 'account-outline';
            }

            return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
          },
        })}
      >
        <Tab.Screen 
          name="HomeTab" 
          component={HomeStack} 
          options={{ 
            headerShown: false,
            title: 'Home'
          }} 
        />
        <Tab.Screen 
          name="StatsTab" 
          component={StatsStack} 
          options={{ 
            headerShown: false,
            title: 'Stats'
          }} 
        />
        <Tab.Screen 
          name="RecommendationsTab" 
          component={RecommendationsStack} 
          options={{ 
            headerShown: false,
            title: 'Buy Music'
          }} 
        />
        <Tab.Screen 
          name="ProfileTab" 
          component={ProfileStack} 
          options={{ 
            headerShown: false,
            title: 'Profile'
          }} 
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;