import React, { useRef, useState, useEffect } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LottieView from 'lottie-react-native/lib/commonjs';
import { COLORS } from '../utils/constants';

const LOADER_URL = 'https://lottie.host/06f480b9-2289-4e35-ad5d-20eb8bc39b8f/afS103suEj.lottie';

const SIZE_MAP = {
  small: {
    shell: 86,
    inner: 66,
    animation: 58,
    fallback: 46,
    text: 12,
    padding: 14,
  },
  medium: {
    shell: 126,
    inner: 96,
    animation: 86,
    fallback: 66,
    text: 14,
    padding: 20,
  },
  large: {
    shell: 168,
    inner: 132,
    animation: 116,
    fallback: 90,
    text: 16,
    padding: 28,
  },
};

const CowLoader = ({ message = 'Loading...', size = 'medium', fullScreen = false }) => {
  const [lottieFailed, setLottieFailed] = useState(false);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const bobAnim = useRef(new Animated.Value(0)).current;
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.medium;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 850,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    const bob = Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnim, {
          toValue: -5,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bobAnim, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();
    bob.start();

    return () => {
      pulse.stop();
      bob.stop();
    };
  }, [bobAnim, pulseAnim]);

  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.025],
  });

  const glowOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.42, 0.75],
  });

  return (
    <View style={[styles.wrapper, fullScreen && styles.fullScreen]}>
      <Animated.View
        style={[
          styles.glow,
          {
            width: sizeConfig.shell + 42,
            height: sizeConfig.shell + 42,
            borderRadius: (sizeConfig.shell + 42) / 2,
            opacity: glowOpacity,
            transform: [{ scale }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.shell,
          {
            width: sizeConfig.shell,
            height: sizeConfig.shell,
            borderRadius: sizeConfig.shell * 0.22,
            padding: sizeConfig.padding,
            transform: [{ translateY: bobAnim }],
          },
        ]}
      >
        <View
          style={[
            styles.innerTile,
            {
              width: sizeConfig.inner,
              height: sizeConfig.inner,
              borderRadius: sizeConfig.inner * 0.22,
            },
          ]}
        >
          {lottieFailed ? (
            <Image
              source={require('../assets/cow1.png')}
              style={{
                width: sizeConfig.fallback,
                height: sizeConfig.fallback,
              }}
              resizeMode="contain"
            />
          ) : (
            <LottieView
              source={{ uri: LOADER_URL }}
              autoPlay
              loop
              speed={3}
              resizeMode="contain"
              style={{
                width: sizeConfig.animation,
                height: sizeConfig.animation,
              }}
              onAnimationFailure={() => setLottieFailed(true)}
            />
          )}
        </View>
      </Animated.View>

      {message ? (
        <View style={styles.messageWrap}>
          <Text style={[styles.messageText, { fontSize: sizeConfig.text }]}>{message}</Text>
          <AnimatedDots />
        </View>
      ) : null}
    </View>
  );
};

const AnimatedDots = () => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(progress, {
        toValue: 3,
        duration: 1100,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );

    animation.start();
    return () => animation.stop();
  }, [progress]);

  return (
    <View style={styles.dotsRow}>
      {[0, 1, 2].map((index) => {
        const opacity = progress.interpolate({
          inputRange: [0, index + 0.01, index + 1, 3],
          outputRange: [0.3, 0.3, 1, 1],
          extrapolate: 'clamp',
        });

        return (
          <Animated.Text key={index} style={[styles.dot, { opacity }]}>
            .
          </Animated.Text>
        );
      })}
    </View>
  );
};

export const FullPageCowLoader = ({ message = 'Loading...', visible = true }) => {
  if (!visible) return null;

  return (
    <View style={styles.fullPageContainer}>
      <CowLoader message={message} size="large" fullScreen />
    </View>
  );
};

export const InlineCowLoader = ({ message = '', size = 'small' }) => (
  <CowLoader message={message} size={size} />
);

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  fullScreen: {
    flex: 1,
  },
  glow: {
    position: 'absolute',
    backgroundColor: COLORS.primarySoft,
  },
  shell: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7FBFA',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: COLORS.primaryDeep,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 8,
  },
  innerTile: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1FBF6',
    overflow: 'hidden',
  },
  messageWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  messageText: {
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  dotsRow: {
    flexDirection: 'row',
    width: 22,
    marginLeft: 2,
  },
  dot: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 18,
  },
  fullPageContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9F2FA',
    zIndex: 1000,
  },
});

export default CowLoader;
