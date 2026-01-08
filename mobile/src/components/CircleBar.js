import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';

// Category data with images and colors
const CATEGORIES = [
  {
    id: 'cow',
    name: 'Cow',
    icon: '🐄',
    endpoint: 'animals',
    color: '#22C55E',
    lightBg: '#DCFCE7'
  },
  {
    id: 'buffalo',
    name: 'Buffalo',
    icon: '🐃',
    endpoint: 'buffalos',
    color: '#6366F1',
    lightBg: '#E0E7FF'
  },
  {
    id: 'bull',
    name: 'Bull',
    icon: '🐂',
    endpoint: 'animals',
    color: '#F59E0B',
    lightBg: '#FEF3C7'
  },
  {
    id: 'goat',
    name: 'Goat',
    icon: '🐐',
    endpoint: 'goats',
    color: '#EC4899',
    lightBg: '#FCE7F3'
  },
  {
    id: 'horse',
    name: 'Horse',
    icon: '🐴',
    endpoint: 'horses',
    color: '#8B5CF6',
    lightBg: '#EDE9FE'
  },
  {
    id: 'dog',
    name: 'Dog',
    icon: '🐕',
    endpoint: 'dogs',
    color: '#14B8A6',
    lightBg: '#CCFBF1'
  },
  {
    id: 'cat',
    name: 'Cat',
    icon: '🐱',
    endpoint: 'cats',
    color: '#F97316',
    lightBg: '#FFEDD5'
  },
];

const CircleBar = ({ onCategoryClick, selectedCategory }) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category.id;

          return (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryItem}
              onPress={() => onCategoryClick && onCategoryClick(category.id, category.endpoint)}
              activeOpacity={0.7}
            >
              {/* Circle Container */}
              <View style={styles.circleWrapper}>
                {/* Glow Effect for Selected */}
                {isSelected && (
                  <View
                    style={[
                      styles.glowEffect,
                      { backgroundColor: category.color + '30' }
                    ]}
                  />
                )}

                {/* Main Circle */}
                <View
                  style={[
                    styles.circle,
                    {
                      backgroundColor: isSelected ? category.lightBg : COLORS.white,
                      borderColor: isSelected ? category.color : COLORS.lightGray,
                      borderWidth: isSelected ? 3 : 2,
                    }
                  ]}
                >
                  <Text style={styles.categoryEmoji}>{category.icon}</Text>

                  {/* Overlay on Hover/Selected */}
                  {isSelected && (
                    <View
                      style={[
                        styles.selectedOverlay,
                        { backgroundColor: category.color + '20' }
                      ]}
                    />
                  )}
                </View>

                {/* Checkmark Badge for Selected */}
                {isSelected && (
                  <View
                    style={[
                      styles.checkBadge,
                      { backgroundColor: category.color }
                    ]}
                  >
                    <Ionicons name="checkmark" size={12} color={COLORS.white} />
                  </View>
                )}
              </View>

              {/* Label */}
              <Text
                style={[
                  styles.categoryName,
                  { color: isSelected ? category.color : COLORS.gray }
                ]}
              >
                {category.name}
              </Text>

              {/* Underline for Selected */}
              {isSelected && (
                <View
                  style={[
                    styles.underline,
                    { backgroundColor: category.color }
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    borderRadius: 16,
  },
  scrollContent: {
    paddingHorizontal: 12,
  },
  categoryItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 80,
  },
  circleWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  glowEffect: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 50,
  },
  circle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryEmoji: {
    fontSize: 32,
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 35,
  },
  checkBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  underline: {
    height: 3,
    width: 40,
    borderRadius: 2,
  },
});

export default CircleBar;
