import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';

const DistanceToggle = ({ activeMode, onModeChange }) => {
  const modes = [
    {
      id: 'all',
      label: 'All Available',
      sublabel: 'Up to 500 km',
      icon: 'globe-outline',
      color: '#6366F1', // Purple
      lightBg: '#EDE9FE',
    },
    {
      id: 'nearby',
      label: 'Nearby',
      sublabel: 'Within 100 km',
      icon: 'location-outline',
      color: COLORS.primary, // Green
      lightBg: '#DCFCE7',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.toggleContainer}>
        {modes.map((mode) => {
          const isActive = activeMode === mode.id;

          return (
            <TouchableOpacity
              key={mode.id}
              style={[
                styles.toggleButton,
                isActive && {
                  backgroundColor: mode.lightBg,
                  borderColor: mode.color,
                },
              ]}
              onPress={() => onModeChange(mode.id)}
              activeOpacity={0.8}
            >
              {/* Icon */}
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: isActive ? mode.color : COLORS.lightGray },
                ]}
              >
                <Ionicons
                  name={mode.icon}
                  size={18}
                  color={isActive ? COLORS.white : COLORS.gray}
                />
              </View>

              {/* Text */}
              <View style={styles.textContainer}>
                <Text
                  style={[
                    styles.label,
                    { color: isActive ? mode.color : COLORS.gray },
                  ]}
                >
                  {mode.label}
                </Text>
                <Text
                  style={[
                    styles.sublabel,
                    { color: isActive ? mode.color + 'CC' : COLORS.gray },
                  ]}
                >
                  {mode.sublabel}
                </Text>
              </View>

              {/* Check indicator */}
              {isActive && (
                <View style={[styles.checkIcon, { backgroundColor: mode.color }]}>
                  <Ionicons name="checkmark" size={12} color={COLORS.white} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    marginHorizontal: 3,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  sublabel: {
    fontSize: 11,
    marginTop: 2,
  },
  checkIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DistanceToggle;
