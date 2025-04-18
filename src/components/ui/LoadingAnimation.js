import React, { useState, useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import ThemedText from '../ThemedText';

/**
 * A fun loading animation with bouncing musical emojis
 */
const LoadingAnimation = () => {
  const animations = Array(3).fill(0).map(() => useRef(new Animated.Value(0)).current);
  const [emoji] = useState(['🎵', '🎧', '🎸', '🎹', '🥁', '🎺', '🎻'][Math.floor(Math.random() * 7)]);
  
  useEffect(() => {
    const animations_sequence = animations.map((animation, i) => {
      return Animated.sequence([
        Animated.delay(i * 150),
        Animated.loop(
          Animated.sequence([
            Animated.timing(animation, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(animation, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ])
        )
      ]);
    });
    
    Animated.parallel(animations_sequence).start();
    
    return () => {
      animations.forEach(anim => anim.stopAnimation());
    };
  }, []);

  return (
    <View style={styles.loadingContainer}>
      <ThemedText style={styles.loadingText}>Loading your music data</ThemedText>
      <View style={styles.loadingIconsContainer}>
        {animations.map((anim, index) => (
          <Animated.Text 
            key={index}
            style={[
              styles.loadingEmoji,
              {
                opacity: anim,
                transform: [{
                  translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -15]
                  })
                }]
              }
            ]}
          >
            {emoji}
          </Animated.Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  loadingText: {
    fontSize: 18,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  loadingIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingEmoji: {
    fontSize: 24,
    marginHorizontal: 8,
  },
});

export default LoadingAnimation;