import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  StatusBar,
  RefreshControl,
  Switch,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../utils/constants';
import AnimalCard from '../components/AnimalCard';
import SkeletonLoader from '../components/SkeletonLoader';
import FeatureHelpModal from '../components/FeatureHelpModal';
import { getLocalizedFeatureHelp } from '../constants/featureHelp';
import { animalListingService, userService } from '../services/api';

const BuyAnimalsScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedBreed, setSelectedBreed] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [breedModalVisible, setBreedModalVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [distanceFilter, setDistanceFilter] = useState('all');
  const [animals, setAnimals] = useState([]);
  const [filteredAnimals, setFilteredAnimals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const buyHelp = getLocalizedFeatureHelp('buyAnimals', i18n.resolvedLanguage || i18n.language);

  const categories = [
    { id: 'cow', name: t('categories.cow'), image: require('../assets/cow1.png'), cardColor: '#EEFDF6' },
    { id: 'buffalo', name: t('categories.buffalo'), image: require('../assets/buffalo1.png'), cardColor: '#FBF1EE' },
    { id: 'goat', name: t('categories.goat'), image: require('../assets/goat1.png'), cardColor: '#FFF3EA' },
    { id: 'bull', name: t('categories.bull'), image: require('../assets/bull1.png'), cardColor: '#FFF2EE' },
    { id: 'horse', name: t('categories.horse'), image: require('../assets/horse1.png'), cardColor: '#FFF6D9' },
    { id: 'dog', name: t('categories.dog'), image: require('../assets/dog1.png'), cardColor: '#EEF7EE' },
    { id: 'cat', name: t('categories.cat'), image: require('../assets/cat1.png'), cardColor: '#FFF0EF' },
    { id: 'other', name: t('categories.other'), icon: 'grid', cardColor: '#F5F7FB' },
  ];

  const matchesSelectedCategory = useCallback((animal, category) => {
    if (!category) return true;

    const animalType = animal.animal_type?.toLowerCase();
    const normalizedCategory = category.toLowerCase();

    if (normalizedCategory === 'other') {
      return !['cow', 'bull', 'buffalo', 'goat', 'horse', 'dog', 'cat'].includes(animalType);
    }

    return animalType === normalizedCategory || animalType?.includes(normalizedCategory);
  }, []);

  useEffect(() => {
    fetchAnimals();
    fetchUserLocation();
  }, []);

  useEffect(() => {
    filterAnimals();
  }, [searchQuery, selectedCategory, selectedBreed, minPrice, maxPrice, distanceFilter, animals, matchesSelectedCategory]);

  const fetchAnimals = async () => {
    setLoading(true);
    try {
      const response = await animalListingService.getAllListings();
      if (response.success && response.data) {
        setAnimals(response.data);
      } else {
        setAnimals([]);
      }
    } catch (error) {
      console.error('Error fetching animals:', error);
      setAnimals([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserLocation = async () => {
    try {
      const profile = await userService.getProfile();
      if (profile?.success && profile?.user) {
        setUserLocation({
          city: profile.user.city,
          state: profile.user.state,
        });
      }
    } catch (error) {
      setUserLocation(null);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnimals();
    setRefreshing(false);
  };

  const animalsForSelectedCategory = useMemo(() => {
    if (!selectedCategory) return [];
    return animals.filter((animal) => matchesSelectedCategory(animal, selectedCategory));
  }, [animals, matchesSelectedCategory, selectedCategory]);

  const availableBreeds = useMemo(() => {
    if (!selectedCategory) return [];

    const uniqueBreeds = new Map();
    animalsForSelectedCategory.forEach((animal) => {
      const breed = animal.breed_name?.trim();
      if (!breed) return;

      const normalizedBreed = breed.toLowerCase();
      if (!uniqueBreeds.has(normalizedBreed)) {
        uniqueBreeds.set(normalizedBreed, breed);
      }
    });

    return Array.from(uniqueBreeds.values()).sort((a, b) => a.localeCompare(b));
  }, [animalsForSelectedCategory, selectedCategory]);

  const priceBounds = useMemo(() => {
    const priceSource = (selectedCategory ? animalsForSelectedCategory : animals)
      .map((animal) => Number(animal.expected_price || 0))
      .filter((price) => Number.isFinite(price) && price > 0);

    if (priceSource.length === 0) {
      return { min: 0, max: 100000 };
    }

    const minValue = Math.min(...priceSource);
    const maxValue = Math.max(...priceSource);
    const roundedMin = Math.max(0, Math.floor(minValue / 1000) * 1000);
    const roundedMax = Math.ceil(maxValue / 1000) * 1000;

    if (roundedMin === roundedMax) {
      return { min: roundedMin, max: roundedMax + 1000 };
    }

    return { min: roundedMin, max: roundedMax };
  }, [animals, animalsForSelectedCategory, selectedCategory]);

  const sliderStep = useMemo(() => {
    const spread = priceBounds.max - priceBounds.min;

    if (spread <= 10000) return 100;
    if (spread <= 100000) return 500;
    if (spread <= 500000) return 1000;
    return 5000;
  }, [priceBounds]);

  const normalizedPriceRange = useMemo(() => {
    const rawMin = minPrice === '' ? priceBounds.min : Number(minPrice);
    const rawMax = maxPrice === '' ? priceBounds.max : Number(maxPrice);

    let normalizedMin = Number.isFinite(rawMin) ? rawMin : priceBounds.min;
    let normalizedMax = Number.isFinite(rawMax) ? rawMax : priceBounds.max;

    normalizedMin = Math.max(priceBounds.min, Math.min(normalizedMin, priceBounds.max));
    normalizedMax = Math.max(priceBounds.min, Math.min(normalizedMax, priceBounds.max));

    if (normalizedMin > normalizedMax) {
      return { min: normalizedMax, max: normalizedMin };
    }

    return { min: normalizedMin, max: normalizedMax };
  }, [maxPrice, minPrice, priceBounds]);

  const formatPrice = useCallback((value) => (
    `\u20B9${Math.round(value || 0).toLocaleString('en-IN')}`
  ), []);

  const filterAnimals = () => {
    let filtered = [...animals];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(animal =>
        animal.animal_type?.toLowerCase().includes(query) ||
        animal.breed_name?.toLowerCase().includes(query) ||
        animal.city?.toLowerCase().includes(query) ||
        animal.state?.toLowerCase().includes(query) ||
        animal.age?.toLowerCase().includes(query) ||
        animal.seller?.name?.toLowerCase().includes(query)
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((animal) => matchesSelectedCategory(animal, selectedCategory));
    }

    if (selectedBreed) {
      filtered = filtered.filter(
        (animal) => animal.breed_name?.toLowerCase() === selectedBreed.toLowerCase()
      );
    }

    if (minPrice) {
      filtered = filtered.filter((animal) => Number(animal.expected_price || 0) >= Number(minPrice));
    }

    if (maxPrice) {
      filtered = filtered.filter((animal) => Number(animal.expected_price || 0) <= Number(maxPrice));
    }

    if (distanceFilter === 'nearby') {
      filtered = filtered.filter(animal => animal.distance && animal.distance <= 50);
    }

    filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    setFilteredAnimals(filtered);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const selectCategory = (categoryId) => {
    const nextCategory = selectedCategory === categoryId ? null : categoryId;
    setSelectedCategory(nextCategory);
    setSelectedBreed('');
    setMinPrice('');
    setMaxPrice('');
    setBreedModalVisible(false);
  };

  const nearbyEnabled = distanceFilter === 'nearby';
  const locationTitle = [userLocation?.city, userLocation?.state].filter(Boolean).join(', ');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.headerShell}>
        <View style={styles.topHeaderRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={COLORS.text} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{t('buyAnimals.title')}</Text>

          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => setHelpVisible(true)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Open buy animals help"
          >
            <Ionicons name="help-circle-outline" size={22} color={COLORS.primaryDark} />
          </TouchableOpacity>
        </View>

        <View style={styles.locationCard}>
          <View style={styles.locationContent}>
            <View style={styles.locationPin}>
              <Ionicons name="location-outline" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.locationTextWrap}>
              <Text style={styles.locationCardTitle} numberOfLines={2}>
                {locationTitle || t('buyAnimals.location')}
              </Text>
              <Text style={styles.locationCardSubtitle} numberOfLines={1}>
                {t('services.buyAnimalsDesc')}
              </Text>
            </View>
          </View>

          <View style={styles.nearbyToggleWrap}>
            <Text style={styles.nearbyLabel}>{t('buyAnimals.nearbyAnimals')}</Text>
            <Switch
              value={nearbyEnabled}
              onValueChange={(value) => setDistanceFilter(value ? 'nearby' : 'all')}
              trackColor={{ false: COLORS.borderStrong, true: COLORS.primaryLight }}
              thumbColor={COLORS.surface}
              ios_backgroundColor={COLORS.borderStrong}
            />
          </View>
        </View>

        <View style={styles.searchControlsRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={COLORS.borderStrong} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('buyAnimals.searchPlaceholder')}
              placeholderTextColor={COLORS.borderStrong}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch}>
                <Ionicons name="close-circle" size={20} color={COLORS.borderStrong} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>{t('buyAnimals.browseByCategory')}</Text>
          <Text style={styles.sectionSubtitle}>
            {t('buyAnimals.categoryHelper', { defaultValue: 'Select an animal type to explore available listings' })}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScrollContent}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  { backgroundColor: category.cardColor },
                  selectedCategory === category.id && styles.categoryCardActive,
                ]}
                onPress={() => selectCategory(category.id)}
                activeOpacity={0.9}
              >
                {category.image ? (
                  <View
                    style={[
                      styles.categoryThumb,
                      selectedCategory === category.id && styles.categoryThumbActive,
                    ]}
                  >
                    <Image source={category.image} style={styles.categoryImageSquare} resizeMode="cover" />
                  </View>
                ) : (
                  <View
                    style={[
                      styles.categoryThumb,
                      styles.categoryThumbPlaceholder,
                      selectedCategory === category.id && styles.categoryThumbActive,
                    ]}
                  >
                    <Ionicons name={category.icon} size={24} color={COLORS.borderStrong} />
                  </View>
                )}
                <Text
                  style={[
                    styles.categoryLabel,
                    selectedCategory === category.id && styles.categoryLabelActive,
                  ]}
                  numberOfLines={1}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {selectedCategory && (
          <View style={styles.refineCard}>
            <Text style={styles.refineTitle}>{t('buyAnimals.filters')}</Text>
            <Text style={styles.refineSubtitle}>
              {t('buyAnimals.categoryHelper', { defaultValue: 'Select an animal type to explore available listings' })}
            </Text>

            <View style={styles.filterField}>
              <Text style={styles.filterLabel}>{t('buyAnimals.breed')}</Text>
              <TouchableOpacity
                style={styles.filterSelectButton}
                onPress={() => setBreedModalVisible(true)}
                activeOpacity={0.85}
                disabled={availableBreeds.length === 0}
              >
                <Text
                  style={[
                    styles.filterSelectText,
                    !selectedBreed && styles.filterSelectPlaceholder,
                    availableBreeds.length === 0 && styles.filterSelectDisabledText,
                  ]}
                  numberOfLines={1}
                >
                  {selectedBreed || t('buyAnimals.selectBreed', { defaultValue: 'Select breed' })}
                </Text>
                <View style={styles.filterSelectIconWrap}>
                  <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
                </View>
              </TouchableOpacity>
            </View>

            <View style={[styles.filterField, styles.priceFieldFull]}>
              <View style={styles.priceRangeHeader}>
                <Text style={styles.filterLabel}>{t('buyAnimals.priceRange')}</Text>
                <Text style={styles.priceRangeValue}>
                  {formatPrice(normalizedPriceRange.min)} - {formatPrice(normalizedPriceRange.max)}
                </Text>
              </View>

              <View style={styles.sliderPanel}>
                <View style={styles.sliderLabelRow}>
                  <Text style={styles.sliderLabel}>{t('buyAnimals.minPrice')}</Text>
                  <Text style={styles.sliderAmount}>{formatPrice(normalizedPriceRange.min)}</Text>
                </View>
                <Slider
                  minimumValue={priceBounds.min}
                  maximumValue={normalizedPriceRange.max}
                  step={sliderStep}
                  value={normalizedPriceRange.min}
                  onValueChange={(value) => setMinPrice(String(Math.round(value)))}
                  minimumTrackTintColor={COLORS.primary}
                  maximumTrackTintColor={COLORS.border}
                  thumbTintColor={COLORS.primary}
                />

                <View style={styles.sliderLabelRow}>
                  <Text style={styles.sliderLabel}>{t('buyAnimals.maxPrice')}</Text>
                  <Text style={styles.sliderAmount}>{formatPrice(normalizedPriceRange.max)}</Text>
                </View>
                <Slider
                  minimumValue={normalizedPriceRange.min}
                  maximumValue={priceBounds.max}
                  step={sliderStep}
                  value={normalizedPriceRange.max}
                  onValueChange={(value) => setMaxPrice(String(Math.round(value)))}
                  minimumTrackTintColor={COLORS.accent}
                  maximumTrackTintColor={COLORS.border}
                  thumbTintColor={COLORS.accent}
                />

                <View style={styles.sliderBoundsRow}>
                  <Text style={styles.sliderBoundText}>{formatPrice(priceBounds.min)}</Text>
                  <Text style={styles.sliderBoundText}>{formatPrice(priceBounds.max)}</Text>
                </View>

                <TouchableOpacity
                  style={styles.priceResetButton}
                  onPress={() => {
                    setMinPrice('');
                    setMaxPrice('');
                  }}
                >
                  <Text style={styles.priceResetText}>{t('buyAnimals.clearFilters')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Animals Grid */}
        <View style={styles.animalsSection}>
          {loading && !refreshing ? (
            <SkeletonLoader variant="animalList" count={4} />
          ) : filteredAnimals.length > 0 ? (
            <View style={styles.animalsList}>
              {filteredAnimals.map((animal) => (
                <AnimalCard
                  key={`${animal.animal_type}-${animal.id}`}
                  listing={animal}
                  onPress={() => navigation.navigate('AnimalDetail', {
                    animalType: animal.animal_type,
                    id: animal.id
                  })}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="search" size={64} color={COLORS.borderStrong} />
              <Text style={styles.emptyTitle}>{t('buyAnimals.noAnimalsFound')}</Text>
              <Text style={styles.emptySubtitle}>{t('buyAnimals.tryDifferentSearch')}</Text>
              {(searchQuery || selectedCategory || selectedBreed || minPrice || maxPrice) && (
                <TouchableOpacity
                  style={styles.clearFiltersButton}
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedCategory(null);
                    setSelectedBreed('');
                    setMinPrice('');
                    setMaxPrice('');
                  }}
                >
                  <Text style={styles.clearFiltersText}>{t('buyAnimals.clearFilters')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <Modal
        visible={breedModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBreedModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setBreedModalVisible(false)}
          />

          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{t('buyAnimals.breed')}</Text>
                <Text style={styles.modalSubtitle}>
                  {t('buyAnimals.selectBreed', { defaultValue: 'Select breed' })}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setBreedModalVisible(false)}
              >
                <Ionicons name="close" size={20} color={COLORS.text} />
                <Text style={styles.modalCloseText}>{t('common.close')}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalOptionsList}
              showsVerticalScrollIndicator={false}
            >
              <TouchableOpacity
                style={[styles.modalOption, !selectedBreed && styles.modalOptionActive]}
                onPress={() => {
                  setSelectedBreed('');
                  setBreedModalVisible(false);
                }}
              >
                <Text style={[styles.modalOptionText, !selectedBreed && styles.modalOptionTextActive]}>
                  {t('buyAnimals.selectBreed', { defaultValue: 'Select breed' })}
                </Text>
                {!selectedBreed && (
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                )}
              </TouchableOpacity>

              {availableBreeds.map((breed) => {
                const isActive = selectedBreed === breed;

                return (
                  <TouchableOpacity
                    key={breed}
                    style={[styles.modalOption, isActive && styles.modalOptionActive]}
                    onPress={() => {
                      setSelectedBreed(breed);
                      setBreedModalVisible(false);
                    }}
                  >
                    <Text style={[styles.modalOptionText, isActive && styles.modalOptionTextActive]}>
                      {breed}
                    </Text>
                    {isActive && (
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <FeatureHelpModal
        visible={helpVisible}
        onClose={() => setHelpVisible(false)}
        title={buyHelp?.localized?.title || t('buyAnimals.title', { defaultValue: 'Buy Animals Guide' })}
        imageSource={buyHelp?.image}
        helpContent={buyHelp?.localized}
        t={t}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerShell: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  helpButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    gap: 10,
  },
  locationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationPin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  locationTextWrap: {
    flex: 1,
  },
  locationCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 21,
  },
  locationCardSubtitle: {
    fontSize: 12.5,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  nearbyToggleWrap: {
    alignItems: 'center',
    gap: 4,
  },
  nearbyLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  searchControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  categoriesSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textMuted,
    marginBottom: 14,
  },
  categoriesScrollContent: {
    paddingRight: 16,
    gap: 10,
  },
  categoryCard: {
    width: 74,
    minHeight: 92,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E7E3D9',
    paddingHorizontal: 6,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  categoryCardActive: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryThumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    marginBottom: 7,
  },
  categoryThumbPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  categoryThumbActive: {
    backgroundColor: '#F7FFFB',
  },
  categoryImageSquare: {
    width: '100%',
    height: '100%',
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 16,
  },
  categoryLabelActive: {
    color: COLORS.primary,
  },
  refineCard: {
    marginHorizontal: 16,
    marginTop: 18,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
  },
  refineTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  refineSubtitle: {
    marginTop: 4,
    fontSize: 12.5,
    lineHeight: 18,
    color: COLORS.textMuted,
    marginBottom: 14,
  },
  filterField: {
    marginBottom: 14,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  filterSelectButton: {
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterSelectText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '600',
  },
  filterSelectPlaceholder: {
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  filterSelectDisabledText: {
    color: COLORS.borderStrong,
  },
  filterSelectIconWrap: {
    marginLeft: 10,
  },
  priceFieldFull: {
    marginBottom: 0,
  },
  priceRangeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceRangeValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  sliderPanel: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
  },
  sliderLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  sliderLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  sliderAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  sliderBoundsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sliderBoundText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  priceResetButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.primarySoft,
  },
  priceResetText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.primary,
  },
  animalsSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  animalsList: {
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  clearFiltersButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  clearFiltersText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(19, 30, 25, 0.35)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 28,
    maxHeight: '70%',
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  modalCloseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalCloseText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalOptionsList: {
    flexGrow: 0,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
    marginBottom: 10,
  },
  modalOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
  },
  modalOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalOptionTextActive: {
    color: COLORS.primary,
  },
});

export default BuyAnimalsScreen;
