import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const AnimatedSplash = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const circleScale1 = useRef(new Animated.Value(0)).current;
  const circleScale2 = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animated sequence with stunning effects
    Animated.sequence([
      // Circles expand
      Animated.parallel([
        Animated.timing(circleScale1, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(circleScale2, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
      // Logo scale and fade in with bounce
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 40,
          friction: 6,
          useNativeDriver: true,
        }),
      ]),
      // Text slide up
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Continuous pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Shimmer effect
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    });

    // Finish splash after 3.5 seconds
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        onFinish && onFinish();
      });
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View style={styles.container}>
      {/* Background Gradient Effect */}
      <View style={styles.gradient} />
      
      {/* Animated Circles */}
      <Animated.View
        style={[
          styles.circle,
          styles.circle1,
          {
            opacity: 0.15,
            transform: [{ scale: circleScale1 }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.circle,
          styles.circle2,
          {
            opacity: 0.1,
            transform: [{ scale: circleScale2 }],
          },
        ]}
      />

      {/* Logo Container with Shimmer */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }],
          },
        ]}
      >
        <View style={styles.logoBox}>
          <Image
            source={require('../../src/assets/cow1.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          {/* Shimmer overlay */}
          <Animated.View
            style={[
              styles.shimmer,
              {
                transform: [{ translateX: shimmerTranslate }],
              },
            ]}
          />
        </View>
        {/* Glow effect */}
        <View style={styles.glowOuter} />
      </Animated.View>

      {/* App Name */}
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.appName}>Kissan E-Bazzar</Text>
        <View style={styles.taglineContainer}>
          <Text style={styles.tagline}>🐄 Buy & Sell Animals</Text>
          <Text style={styles.subTagline}>Trusted Platform for Farmers</Text>
        </View>
        
        {/* Loading dots */}
        <View style={styles.dotContainer}>
          <Animated.View style={[styles.dot, { 
            transform: [{ scale: pulseAnim }] 
          }]} />
          <Animated.View style={[styles.dot, { 
            transform: [{ scale: pulseAnim }],
            marginHorizontal: 8 
          }]} />
          <Animated.View style={[styles.dot, { 
            transform: [{ scale: pulseAnim }] 
          }]} />
        </View>
      </Animated.View>

      {/* Bottom decorative element */}
      <Animated.View style={[styles.bottomDecor, { opacity: fadeAnim }]}>
        <Text style={styles.versionText}>v1.0.0</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#15BB73',
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
    backgroundColor: '#15BB73',
    opacity: 1,
  },
  circle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  circle1: {
    width: width * 1.8,
    height: width * 1.8,
    top: -width * 0.6,
    left: -width * 0.4,
  },
  circle2: {
    width: width * 1.5,
    height: width * 1.5,
    bottom: -width * 0.5,
    right: -width * 0.3,
  },
  logoContainer: {
    marginBottom: 40,
    position: 'relative',
  },
  logoBox: {
    width: 160,
    height: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 25,
    elevation: 20,
    borderWidth: 5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    overflow: 'hidden',
    position: 'relative',
  },
  logo: {
    width: 110,
    height: 110,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ skewX: '-20deg' }],
  },
  glowOuter: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    top: -10,
    left: -10,
    zIndex: -1,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  appName: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  taglineContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.98)',
    textAlign: 'center',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  subTagline: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  dotContainer: {
    flexDirection: 'row',
    marginTop: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  bottomDecor: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    letterSpacing: 1,
  },
});

export default AnimatedSplash;
