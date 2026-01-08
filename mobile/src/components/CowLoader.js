import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Easing,
} from 'react-native';
import { COLORS } from '../utils/constants';

// Animated Cow Loader Component
const CowLoader = ({ message = 'Loading...', size = 'medium' }) => {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const dotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Bounce animation
    const bounce = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -15,
          duration: 400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    // Scale animation (squash and stretch)
    const scale = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ])
    );

    // Subtle rotation animation
    const rotate = Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: -1,
          duration: 600,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );

    // Dot animation for loading text
    const dots = Animated.loop(
      Animated.timing(dotAnim, {
        toValue: 3,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );

    bounce.start();
    scale.start();
    rotate.start();
    dots.start();

    return () => {
      bounce.stop();
      scale.stop();
      rotate.stop();
      dots.stop();
    };
  }, [bounceAnim, scaleAnim, rotateAnim, dotAnim]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-5deg', '5deg'],
  });

  const getSize = () => {
    switch (size) {
      case 'small':
        return { emoji: 48, container: 80 };
      case 'large':
        return { emoji: 80, container: 140 };
      default:
        return { emoji: 64, container: 110 };
    }
  };

  const sizeConfig = getSize();

  return (
    <View style={styles.container}>
      {/* Animated Cow */}
      <View style={[styles.loaderContainer, { width: sizeConfig.container, height: sizeConfig.container }]}>
        {/* Shadow */}
        <Animated.View
          style={[
            styles.shadow,
            {
              transform: [
                { scaleX: scaleAnim },
              ],
            },
          ]}
        />

        {/* Cow Emoji */}
        <Animated.View
          style={{
            transform: [
              { translateY: bounceAnim },
              { scale: scaleAnim },
              { rotate: rotateInterpolate },
            ],
          }}
        >
          <Text style={[styles.cowEmoji, { fontSize: sizeConfig.emoji }]}>🐄</Text>
        </Animated.View>
      </View>

      {/* Grass decoration */}
      <View style={styles.grassContainer}>
        <Text style={styles.grassEmoji}>🌿</Text>
        <Text style={[styles.grassEmoji, { marginHorizontal: 8 }]}>🌾</Text>
        <Text style={styles.grassEmoji}>🌿</Text>
      </View>

      {/* Loading Message */}
      {message && (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>{message}</Text>
          <AnimatedDots animation={dotAnim} />
        </View>
      )}
    </View>
  );
};

// Animated dots component
const AnimatedDots = ({ animation }) => {
  const dot1Opacity = animation.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [0.3, 1, 1, 1],
  });

  const dot2Opacity = animation.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [0.3, 0.3, 1, 1],
  });

  const dot3Opacity = animation.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [0.3, 0.3, 0.3, 1],
  });

  return (
    <View style={styles.dotsContainer}>
      <Animated.Text style={[styles.dot, { opacity: dot1Opacity }]}>.</Animated.Text>
      <Animated.Text style={[styles.dot, { opacity: dot2Opacity }]}>.</Animated.Text>
      <Animated.Text style={[styles.dot, { opacity: dot3Opacity }]}>.</Animated.Text>
    </View>
  );
};

// Full Page Cow Loader
export const FullPageCowLoader = ({ message = 'Loading...', visible = true }) => {
  if (!visible) return null;

  return (
    <View style={styles.fullPageContainer}>
      <View style={styles.fullPageContent}>
        <CowLoader message={message} size="large" />
      </View>
    </View>
  );
};

// Inline Cow Loader (smaller, for inline use)
export const InlineCowLoader = ({ message }) => {
  return <CowLoader message={message} size="small" />;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadow: {
    position: 'absolute',
    bottom: 5,
    width: 50,
    height: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 50,
  },
  cowEmoji: {
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  grassContainer: {
    flexDirection: 'row',
    marginTop: -10,
    opacity: 0.8,
  },
  grassEmoji: {
    fontSize: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  messageText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray,
  },
  dotsContainer: {
    flexDirection: 'row',
    width: 24,
  },
  dot: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 2,
  },
  fullPageContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  fullPageContent: {
    alignItems: 'center',
  },
});

export default CowLoader;
