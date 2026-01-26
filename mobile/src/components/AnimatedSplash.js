import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const AnimatedSplash = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const circleScale1 = useRef(new Animated.Value(0)).current;
  const circleScale2 = useRef(new Animated.Value(0)).current;
  const circleScale3 = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.stagger(200, [
        Animated.timing(circleScale1, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(circleScale2, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(circleScale3, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 30,
          friction: 5,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        })
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onFinish && onFinish();
      });
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 2, width * 2],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.5],
  });

  return (
    <View style={styles.container}>
      <View style={styles.gradient} />
      
      <Animated.View
        style={[
          styles.circle,
          styles.circle1,
          {
            opacity: 0.04,
            transform: [{ scale: circleScale1 }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.circle,
          styles.circle2,
          {
            opacity: 0.03,
            transform: [{ scale: circleScale2 }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.circle,
          styles.circle3,
          {
            opacity: 0.02,
            transform: [{ scale: circleScale3 }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [
              { scale: Animated.multiply(scaleAnim, pulseAnim) }
            ],
          },
        ]}
      >
        <Animated.View style={[styles.glowRing, styles.glowRing1, { opacity: glowOpacity }]} />
        <Animated.View style={[styles.glowRing, styles.glowRing2, { opacity: Animated.multiply(glowOpacity, 0.7) }]} />
        <Animated.View style={[styles.glowRing, styles.glowRing3, { opacity: Animated.multiply(glowOpacity, 0.5) }]} />
        
        <View style={styles.logoBox}>
          <Image
            source={require('../../src/assets/animal_bazar_logo.jpeg')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Animated.View
            style={[
              styles.shimmer,
              {
                transform: [{ translateX: shimmerTranslate }],
              },
            ]}
          />
        </View>
      </Animated.View>

      <Animated.View style={[styles.bottomDecor, { opacity: fadeAnim }]}>
        <Text style={styles.versionText}>v1.0.0</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F8FAFB',
    opacity: 1,
  },
  circle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: '#15BB73',
  },
  circle1: {
    width: width * 2,
    height: width * 2,
    top: -width * 0.7,
    left: -width * 0.5,
  },
  circle2: {
    width: width * 1.6,
    height: width * 1.6,
    bottom: -width * 0.5,
    right: -width * 0.3,
  },
  circle3: {
    width: width * 1.3,
    height: width * 1.3,
    top: height * 0.3,
    right: -width * 0.4,
  },
  logoContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBox: {
    width: 200,
    height: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 25,
    borderWidth: 6,
    borderColor: 'rgba(21, 187, 115, 0.1)',
    overflow: 'hidden',
    position: 'relative',
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: 44,
  },
  shimmer: {
    position: 'absolute',
    top: -20,
    left: -100,
    right: 0,
    bottom: -20,
    width: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    transform: [{ skewX: '-25deg' }],
  },
  glowRing: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: 'rgba(21, 187, 115, 0.08)',
    borderWidth: 2,
    borderColor: 'rgba(21, 187, 115, 0.12)',
  },
  glowRing1: {
    width: 220,
    height: 220,
    top: -10,
    left: -10,
  },
  glowRing2: {
    width: 250,
    height: 250,
    top: -25,
    left: -25,
  },
  glowRing3: {
    width: 280,
    height: 280,
    top: -40,
    left: -40,
  },
  bottomDecor: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 13,
    color: 'rgba(100, 100, 100, 0.5)',
    fontWeight: '600',
    letterSpacing: 1.2,
  },
});

export default AnimatedSplash;
