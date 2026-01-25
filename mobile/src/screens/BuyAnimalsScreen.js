import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../utils/constants';
import AnimalCard from '../components/AnimalCard';
import { animalListingService } from '../services/api';

const { width } = Dimensions.get('window');

const BuyAnimalsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [distanceFilter, setDistanceFilter] = useState('all');
  const [animals, setAnimals] = useState([]);
  const [filteredAnimals, setFilteredAnimals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const categories = [
    { id: 'cow', name: t('categories.cow'), image: require('../assets/cow1.png'), gradient: ['#22C55E', '#16A34A'] },
    { id: 'buffalo', name: t('categories.buffalo'), image: require('../assets/buffalo1.png'), gradient: ['#3B82F6', '#2563EB'] },
    { id: 'goat', name: t('categories.goat'), image: require('../assets/goat1.png'), gradient: ['#F59E0B', '#D97706'] },
    { id: 'bull', name: t('categories.bull'), image: require('../assets/bull1.png'), gradient: ['#EF4444', '#DC2626'] },
    { id: 'horse', name: t('categories.horse'), image: require('../assets/horse1.png'), gradient: ['#8B5CF6', '#7C3AED'] },
    { id: 'dog', name: t('categories.dog'), image: require('../assets/dog1.png'), gradient: ['#EC4899', '#DB2777'] },
    { id: 'cat', name: t('categories.cat'), image: require('../assets/cat1.png'), gradient: ['#06B6D4', '#0891B2'] },
    { id: 'other', name: t('categories.other'), icon: 'grid', gradient: ['#6B7280', '#4B5563'] },
  ];

  useEffect(() => {
    fetchAnimals();
  }, []);

  useEffect(() => {
    filterAnimals();
  }, [searchQuery, selectedCategory, distanceFilter, animals]);

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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnimals();
    setRefreshing(false);
  };

  const filterAnimals = () => {
    let filtered = [...animals];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(animal =>
        animal.animal_type?.toLowerCase().includes(query) ||
        animal.breed?.toLowerCase().includes(query) ||
        animal.location?.toLowerCase().includes(query)
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(animal =>
        animal.animal_type?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (distanceFilter === 'nearby') {
      filtered = filtered.filter(animal => animal.distance && animal.distance <= 50);
    }

    setFilteredAnimals(filtered);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const selectCategory = (categoryId) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('buyAnimals.title')}</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder={t('buyAnimals.searchPlaceholder')}
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        {filteredAnimals.length > 0 && (
          <Text style={styles.resultsCount}>
            {filteredAnimals.length} {t('buyAnimals.animalsFound')}
          </Text>
        )}
      </View>

      {/* Distance Toggle */}
      <View style={styles.distanceToggleContainer}>
        <View style={styles.toggleButtons}>
          <TouchableOpacity
            style={[styles.toggleButton, distanceFilter === 'all' && styles.toggleButtonActive]}
            onPress={() => setDistanceFilter('all')}
          >
            <Text style={[styles.toggleButtonText, distanceFilter === 'all' && styles.toggleButtonTextActive]}>
              {t('buyAnimals.allAnimals')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, distanceFilter === 'nearby' && styles.toggleButtonActive]}
            onPress={() => setDistanceFilter('nearby')}
          >
            <Text style={[styles.toggleButtonText, distanceFilter === 'nearby' && styles.toggleButtonTextActive]}>
              {t('buyAnimals.nearbyAnimals')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>{t('buyAnimals.browseByCategory')}</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryItem}
                onPress={() => selectCategory(category.id)}
              >
                {category.image ? (
                  <View style={[
                    styles.categoryImageWrapper,
                    selectedCategory === category.id && styles.categoryImageWrapperActive
                  ]}>
                    <Image source={category.image} style={styles.categoryImageSquare} resizeMode="cover" />
                  </View>
                ) : (
                  <View style={[
                    styles.categoryImageWrapper,
                    { backgroundColor: category.gradient[0] },
                    selectedCategory === category.id && styles.categoryImageWrapperActive
                  ]}>
                    <Ionicons name={category.icon} size={32} color="#fff" />
                  </View>
                )}
                <Text style={[styles.categoryLabel, selectedCategory === category.id && styles.categoryLabelActive]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Animals Grid */}
        <View style={styles.animalsSection}>
          {loading && !refreshing ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
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
              <Ionicons name="search" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>{t('buyAnimals.noAnimalsFound')}</Text>
              <Text style={styles.emptySubtitle}>{t('buyAnimals.tryDifferentSearch')}</Text>
              {(searchQuery || selectedCategory) && (
                <TouchableOpacity
                  style={styles.clearFiltersButton}
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedCategory(null);
                  }}
                >
                  <Text style={styles.clearFiltersText}>{t('buyAnimals.clearFilters')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <View style={{ height: 20 }} />
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  resultsCount: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  distanceToggleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  toggleButtons: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.primary,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  categoriesSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryItem: {
    width: (width - 60) / 4,
    alignItems: 'center',
    marginBottom: 20,
  },
  categoryImageWrapper: {
    width: 70,
    height: 70,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryImageWrapperActive: {
    borderColor: COLORS.primary,
    borderWidth: 3,
  },
  categoryImageSquare: {
    width: '100%',
    height: '100%',
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'center',
  },
  categoryLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
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
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BuyAnimalsScreen;
