import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../utils/constants';

import CowListingForm from '../components/forms/CowListingForm';
import BuffaloListingForm from '../components/forms/BuffaloListingForm';
import GoatListingForm from '../components/forms/GoatListingForm';
import HorseListingForm from '../components/forms/HorseListingForm';
import DogListingForm from '../components/forms/DogListingForm';
import CatListingForm from '../components/forms/CatListingForm';
import OtherAnimalListingForm from '../components/forms/OtherAnimalListingForm';

const SellAnimalScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [selectedAnimal, setSelectedAnimal] = useState(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (!selectedAnimal) {
        return;
      }

      event.preventDefault();
      setSelectedAnimal(null);
    });

    return unsubscribe;
  }, [navigation, selectedAnimal]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (!selectedAnimal) {
          return false;
        }

        setSelectedAnimal(null);
        return true;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => subscription.remove();
    }, [selectedAnimal])
  );

  useEffect(() => {
    const parentNavigation = navigation.getParent();
    if (!parentNavigation) {
      return undefined;
    }

    const unsubscribeTabPress = parentNavigation.addListener('tabPress', (event) => {
      if (!selectedAnimal) {
        return;
      }

      event.preventDefault();
      setSelectedAnimal(null);
    });

    return unsubscribeTabPress;
  }, [navigation, selectedAnimal]);

  const animalTypes = [
    { id: 'cow', name: t('animalTypes.cow') || 'Cow', image: require('../assets/cow1.png'), color: COLORS.primary, bgColor: '#EEFDF6' },
    { id: 'buffalo', name: t('animalTypes.buffalo') || 'Buffalo', image: require('../assets/buffalo1.png'), color: '#5F5E5A', bgColor: '#FBF1EE' },
    { id: 'goat', name: t('animalTypes.goat') || 'Goat', image: require('../assets/goat1.png'), color: '#D85A30', bgColor: '#FFF3EA' },
    { id: 'horse', name: t('animalTypes.horse') || 'Horse', image: require('../assets/horse1.png'), color: '#8B5F1A', bgColor: '#FFF6D9' },
    { id: 'dog', name: t('animalTypes.dog') || 'Dog', image: require('../assets/dog1.png'), color: '#D85A30', bgColor: '#EEF7EE' },
    { id: 'cat', name: t('animalTypes.cat') || 'Cat', image: require('../assets/cat1.png'), color: '#993C1D', bgColor: '#FFF0EF' },
    { id: 'other', name: t('animalTypes.other') || 'Other', icon: 'add', color: '#5F5E5A', bgColor: '#F5F4EF' },
  ];

  const formProps = {
    navigation,
    onSuccess: () => {
      setSelectedAnimal(null);
      navigation.navigate('BuyAnimals');
    }
  };

  const renderAnimalForm = () => {
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

  const renderAnimalSelection = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.selectorCard}>
        <View style={styles.selectorHeader}>
          <View style={styles.selectorIcon}>
            <Ionicons name="grid-outline" size={18} color={COLORS.primary} />
          </View>
          <View style={styles.selectorTextWrap}>
            <Text style={styles.selectorTitle}>
              {t('listing.selectAnimalType') || 'Select Animal Type'}
            </Text>
            <Text style={styles.selectorSubtitle}>
              {t('sellAnimal.chooseAnimalPrompt') || 'Which animal do you want to sell?'}
            </Text>
          </View>
        </View>

        <View style={styles.selectorDivider} />

        <View style={styles.animalGrid}>
          {animalTypes.map((animal) => (
            <TouchableOpacity
              key={animal.id}
              style={styles.animalCategoryItem}
              onPress={() => setSelectedAnimal(animal)}
              activeOpacity={0.85}
            >
              <View style={[styles.animalThumbWrap, { backgroundColor: animal.bgColor, borderColor: animal.color }]}>
                <View style={styles.animalThumbInner}>
                  {animal.image ? (
                    <Image source={animal.image} style={styles.animalImage} resizeMode="cover" />
                  ) : (
                    <Ionicons name={animal.icon} size={28} color={animal.color} />
                  )}
                </View>
              </View>
              <Text style={styles.animalName}>{animal.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

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
              : t('sellAnimal.title') || 'Sell Animal'}
          </Text>
          {!selectedAnimal && (
            <Text style={styles.headerSubtitle}>
              {t('sellAnimal.subtitle') || 'List your animal for sale'}
            </Text>
          )}
        </View>
      </View>

      {selectedAnimal ? (
        <>
          <View style={[styles.animalBadge, { backgroundColor: selectedAnimal.bgColor }]}>
            <View style={styles.animalBadgeContent}>
              <View style={[styles.badgeThumb, { borderColor: selectedAnimal.color }]}>
                {selectedAnimal.image ? (
                  <Image source={selectedAnimal.image} style={styles.badgeImage} resizeMode="cover" />
                ) : (
                  <Ionicons name={selectedAnimal.icon} size={24} color={selectedAnimal.color} />
                )}
              </View>
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
  selectorCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  selectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectorIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primarySoft,
    marginRight: 12,
  },
  selectorTextWrap: {
    flex: 1,
  },
  selectorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  selectorSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  selectorDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  animalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingVertical: 14,
    justifyContent: 'space-between',
  },
  animalCategoryItem: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 14,
  },
  animalThumbWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  animalThumbInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  animalImage: {
    width: '100%',
    height: '100%',
  },
  animalName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
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
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  animalBadgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeThumb: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFFCC',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  badgeImage: {
    width: '100%',
    height: '100%',
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
    borderRadius: 999,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFFAA',
  },
  changeText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default SellAnimalScreen;
