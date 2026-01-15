import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, ANIMAL_TYPES } from '../utils/constants';

const SellAnimalScreen = ({ navigation }) => {
  const [selectedType, setSelectedType] = useState(null);

  const animalTypes = [
    { id: 'cow', name: 'Cow', color: '#F59E0B' },
    { id: 'buffalo', name: 'Buffalo', color: '#6B7280' },
    { id: 'goat', name: 'Goat', color: '#10B981' },
    { id: 'horse', name: 'Horse', color: '#8B5CF6' },
    { id: 'dog', name: 'Dog', color: '#F97316' },
    { id: 'cat', name: 'Cat', color: '#EC4899' },
    { id: 'other', name: 'Other Animals', color: '#3B82F6' },
  ];

  const handleTypeSelect = (type) => {
    console.log('Button clicked:', type.name, type.id);
    setSelectedType(type.id);

    // Find the category from ANIMAL_TYPES
    const category = ANIMAL_TYPES.find(t => t.id === type.id);

    console.log('Found category:', category);

    if (category) {
      // Navigate to CreateListing screen
      navigation.navigate('CreateListing', { category });
    } else {
      console.warn('Category not found for:', type.id);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <Text style={styles.title}>Sell Your Animal</Text>
        <Text style={styles.subtitle}>
          List your animal for sale and reach thousands of potential buyers
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Instructions Banner */}
        <View style={styles.instructionsBanner}>
          <View style={styles.instructionsIconContainer}>
            <Ionicons name="information-circle" size={24} color="#2563EB" />
          </View>
          <View style={styles.instructionsContent}>
            <Text style={styles.instructionsTitle}>Quick Tips</Text>
            <View style={styles.instructionsList}>
              <Text style={styles.instructionItem}>• Select the animal type below</Text>
              <Text style={styles.instructionItem}>• Fill in all required details</Text>
              <Text style={styles.instructionItem}>• Upload clear, quality photos</Text>
              <Text style={styles.instructionItem}>• Set a competitive price</Text>
            </View>
          </View>
        </View>

        {/* Animal Type Selector */}
        <View style={styles.selectorSection}>
          <Text style={styles.selectorTitle}>Select Animal Category</Text>

          {/* Button Grid - 4 per row */}
          <View style={styles.buttonGrid}>
            {animalTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                onPress={() => handleTypeSelect(type)}
                style={[
                  styles.typeButton,
                  selectedType === type.id && {
                    backgroundColor: type.color,
                    borderColor: type.color,
                  }
                ]}
              >
                <Text style={[
                  styles.typeButtonText,
                  selectedType === type.id && styles.typeButtonTextActive
                ]}>
                  {type.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Selected Type Info Card */}
        {selectedType && (
          <View style={[
            styles.selectedCard,
            { borderLeftColor: animalTypes.find(t => t.id === selectedType)?.color }
          ]}>
            <View style={styles.selectedCardContent}>
              <View style={styles.selectedCardInfo}>
                <Text style={styles.selectedCardTitle}>
                  {animalTypes.find(t => t.id === selectedType)?.name} Listing
                </Text>
                <Text style={styles.selectedCardSubtitle}>
                  Ready to create your listing
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.gray} />
            </View>
          </View>
        )}

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <View style={styles.tipCard}>
            <View style={[styles.tipIconContainer, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="camera" size={20} color="#10B981" />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Quality Photos</Text>
              <Text style={styles.tipDescription}>Upload clear, well-lit photos from multiple angles</Text>
            </View>
          </View>

          <View style={styles.tipCard}>
            <View style={[styles.tipIconContainer, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="document-text" size={20} color="#3B82F6" />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Accurate Details</Text>
              <Text style={styles.tipDescription}>Provide precise information about age, weight, and health</Text>
            </View>
          </View>

          <View style={styles.tipCard}>
            <View style={[styles.tipIconContainer, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="cash" size={20} color="#8B5CF6" />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Fair Pricing</Text>
              <Text style={styles.tipDescription}>Set competitive prices based on market rates</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  instructionsBanner: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  instructionsIconContainer: {
    marginRight: 12,
  },
  instructionsContent: {
    flex: 1,
  },
  instructionsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E3A8A',
    marginBottom: 8,
  },
  instructionsList: {
    gap: 4,
  },
  instructionItem: {
    fontSize: 13,
    color: '#1D4ED8',
    lineHeight: 20,
  },
  selectorSection: {
    marginBottom: 24,
  },
  selectorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6, // Compensate for button margins
  },
  typeButton: {
    width: '22%', // (100% / 4) - small adjustment for margins
    marginHorizontal: '1.5%', // Space between buttons
    marginBottom: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  selectedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  selectedCardInfo: {
    flex: 1,
  },
  selectedCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  selectedCardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  tipsSection: {
    gap: 12,
    marginBottom: 20,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  tipIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
});

export default SellAnimalScreen;
