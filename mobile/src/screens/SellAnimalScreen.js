import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../utils/constants';
import { useAuth } from '../context/AuthContext';

// Import form components
import CowListingForm from '../components/forms/CowListingForm';
import BuffaloListingForm from '../components/forms/BuffaloListingForm';
import GoatListingForm from '../components/forms/GoatListingForm';
import HorseListingForm from '../components/forms/HorseListingForm';
import DogListingForm from '../components/forms/DogListingForm';
import CatListingForm from '../components/forms/CatListingForm';
import OtherAnimalListingForm from '../components/forms/OtherAnimalListingForm';

const SellAnimalScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedAnimal, setSelectedAnimal] = useState(null);

  const animalTypes = [
    { 
      id: 'cow', 
      name: t('animalTypes.cow') || 'Cow', 
      emoji: '🐄', 
      image: require('../assets/cow1.png'), 
      color: '#F59E0B', 
      bgColor: '#FEF3C7',
      description: 'Milk & Breeding'
    },
    { 
      id: 'buffalo', 
      name: t('animalTypes.buffalo') || 'Buffalo', 
      emoji: '🐃', 
      image: require('../assets/buffalo1.png'), 
      color: '#6B7280', 
      bgColor: '#F3F4F6',
      description: 'Milk & Breeding'
    },
    { 
      id: 'goat', 
      name: t('animalTypes.goat') || 'Goat', 
      emoji: '🐐', 
      image: require('../assets/goat1.png'), 
      color: '#10B981', 
      bgColor: '#D1FAE5',
      description: 'Milk & Meat'
    },
    { 
      id: 'horse', 
      name: t('animalTypes.horse') || 'Horse', 
      emoji: '🐴', 
      image: require('../assets/horse1.png'), 
      color: '#8B5CF6', 
      bgColor: '#EDE9FE',
      description: 'Riding & Work'
    },
    { 
      id: 'dog', 
      name: t('animalTypes.dog') || 'Dog', 
      emoji: '🐕', 
      image: require('../assets/dog1.png'), 
      color: '#F97316', 
      bgColor: '#FED7AA',
      description: 'Pet & Guard'
    },
    { 
      id: 'cat', 
      name: t('animalTypes.cat') || 'Cat', 
      emoji: '🐱', 
      image: require('../assets/cat1.png'), 
      color: '#EC4899', 
      bgColor: '#FCE7F3',
      description: 'Pet & Companion'
    },
    { 
      id: 'other', 
      name: t('animalTypes.other') || 'Other', 
      emoji: '🐾', 
      image: null, 
      color: '#3B82F6', 
      bgColor: '#DBEAFE',
      description: 'Sheep, Pig, Rabbit & More'
    }
  ];

  // Render form based on selected animal
  const renderAnimalForm = () => {
    const formProps = {
      navigation,
      onSuccess: () => {
        setSelectedAnimal(null);
        navigation.navigate('Home');
      }
    };

    switch (selectedAnimal?.id) {
      case 'cow':
        return <CowListingForm {...formProps} />;
      case 'buffalo':
        return <BuffaloListingForm {...formProps} />;
      case 'goat':
        return <GoatListingForm {...formProps} />;
      case 'horse':
        return <HorseListingForm {...formProps} />;
      case 'dog':
        return <DogListingForm {...formProps} />;
      case 'cat':
        return <CatListingForm {...formProps} />;
      case 'other':
        return <OtherAnimalListingForm {...formProps} />;
      default:
        return null;
    }
  };

  // Animal Selection Screen
  const renderAnimalSelection = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Instructions Card */}
      <View style={styles.instructionsCard}>
        <Ionicons name="information-circle" size={24} color={COLORS.primary} />
        <View style={styles.instructionsText}>
          <Text style={styles.instructionsTitle}>
            {t('listing.instructions.title') || 'Quick Tips'}
          </Text>
          <Text style={styles.instructionsSubtitle}>
            {t('listing.instructions.subtitle') || 'Select the animal type below to get started with your listing'}
          </Text>
        </View>
      </View>

      {/* Section Title */}
      <Text style={styles.sectionTitle}>
        {t('listing.selectAnimalType') || 'Select Animal Type'}
      </Text>
      
      {/* Animal Cards Grid */}
      <View style={styles.animalGrid}>
        {animalTypes.map((animal) => (
          <TouchableOpacity
            key={animal.id}
            style={[styles.animalCard, { backgroundColor: animal.bgColor }]}
            onPress={() => setSelectedAnimal(animal)}
            activeOpacity={0.7}
          >
            {/* Animal Image/Icon */}
            {animal.image ? (
              <Image source={animal.image} style={styles.animalImage} />
            ) : (
              <View style={[styles.animalIconContainer, { backgroundColor: animal.color }]}>
                <Text style={styles.animalEmoji}>{animal.emoji}</Text>
              </View>
            )}
            
            {/* Animal Name */}
            <Text style={[styles.animalName, { color: animal.color }]}>
              {animal.name}
            </Text>
            
            {/* Description */}
            <Text style={styles.animalDescription}>
              {animal.description}
            </Text>
            
            {/* Select Button */}
            <View style={[styles.selectButton, { backgroundColor: animal.color }]}>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
        <Text style={styles.infoBannerText}>
          {t('listing.infoBanner') || 'Your listing will be reviewed within 24 hours'}
        </Text>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity 
          onPress={() => {
            if (selectedAnimal) {
              setSelectedAnimal(null);
            } else {
              navigation.goBack();
            }
          }} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {selectedAnimal 
              ? `${t('listing.createListing') || 'Create Listing'} - ${selectedAnimal.name}`
              : t('sellAnimal.title') || 'Sell Animal'
            }
          </Text>
          {!selectedAnimal && (
            <Text style={styles.headerSubtitle}>
              {t('sellAnimal.subtitle') || 'List your animal for sale'}
            </Text>
          )}
        </View>
      </View>

      {/* Content - Show Selection or Form */}
      {selectedAnimal ? (
        <>
          {/* Selected Animal Badge */}
          <View style={[styles.animalBadge, { backgroundColor: selectedAnimal.bgColor }]}>
            <View style={styles.animalBadgeContent}>
              {selectedAnimal.image ? (
                <Image source={selectedAnimal.image} style={styles.badgeImage} />
              ) : (
                <View style={[styles.badgeIconContainer, { backgroundColor: selectedAnimal.color }]}>
                  <Text style={styles.badgeEmoji}>{selectedAnimal.emoji}</Text>
                </View>
              )}
              <View style={styles.badgeTextContainer}>
                <Text style={styles.badgeLabel}>
                  {t('listing.selectedAnimal') || 'Selected Animal'}
                </Text>
                <Text style={[styles.badgeValue, { color: selectedAnimal.color }]}>
                  {selectedAnimal.name}
                </Text>
              </View>
              <TouchableOpacity 
                style={[styles.changeBadge, { borderColor: selectedAnimal.color }]}
                onPress={() => setSelectedAnimal(null)}
              >
                <Text style={[styles.changeText, { color: selectedAnimal.color }]}>
                  {t('common.change') || 'Change'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Render Animal-Specific Form */}
          {renderAnimalForm()}
        </>
      ) : (
        renderAnimalSelection()
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  instructionsCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  instructionsText: {
    flex: 1,
    marginLeft: 12,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  instructionsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  animalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  animalCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  animalImage: {
    width: 70,
    height: 70,
    marginBottom: 12,
    resizeMode: 'contain',
  },
  animalIconContainer: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 35,
    marginBottom: 12,
  },
  animalEmoji: {
    fontSize: 36,
  },
  animalName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  animalDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  selectButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  infoBannerText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#166534',
    lineHeight: 20,
  },
  animalBadge: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  animalBadgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeImage: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  badgeIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeEmoji: {
    fontSize: 28,
  },
  badgeTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  badgeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  badgeValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  changeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 2,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SellAnimalScreen;
