import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Keyboard,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS, ANIMAL_TYPES } from '../utils/constants';
import { listingsService, userService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import AnimalCard from '../components/AnimalCard';
import CircleBar from '../components/CircleBar';
import DistanceToggle from '../components/DistanceToggle';
import CowLoader from '../components/CowLoader';

// Custom debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  // Main states
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [wishlist, setWishlist] = useState([]);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const searchInputRef = useRef(null);

  // Filter states
  const [distanceMode, setDistanceMode] = useState('all'); // 'all' = 500km, 'nearby' = 100km
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Debounced search
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Quick search tags
  const quickSearchTags = useMemo(() => [
    { label: 'Cow', icon: '🐄', query: 'cow' },
    { label: 'Buffalo', icon: '🐃', query: 'buffalo' },
    { label: 'Goat', icon: '🐐', query: 'goat' },
    { label: 'Horse', icon: '🐴', query: 'horse' },
    { label: 'Dog', icon: '🐕', query: 'dog' },
    { label: 'Cat', icon: '🐱', query: 'cat' },
  ], []);

  // Fetch data on mount and when filters change
  useEffect(() => {
    fetchData();
  }, [distanceMode]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let lat = null;
      let lng = null;

      // Try to get user location from profile
      if (user?.latitude && user?.longitude) {
        lat = user.latitude;
        lng = user.longitude;
        setUserLocation({
          latitude: lat,
          longitude: lng,
          city: user.city,
          state: user.state,
        });
      } else {
        // Try to get device location
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            lat = location.coords.latitude;
            lng = location.coords.longitude;
            setUserLocation({ latitude: lat, longitude: lng });
          }
        } catch (err) {
          console.log('Could not get location:', err);
        }
      }

      // Fetch listings based on distance mode
      let fetchedListings = [];
      const radius = distanceMode === 'nearby' ? 100 : 500;

      if (lat && lng) {
        try {
          const response = await listingsService.getNearbyListings(lat, lng, radius, 50);
          if (response.success && response.data?.length > 0) {
            fetchedListings = response.data;
          }
        } catch (err) {
          console.log('Error fetching nearby:', err);
        }
      }

      // Fallback to featured if no nearby listings
      if (fetchedListings.length === 0) {
        try {
          const response = await listingsService.getFeaturedListings(50);
          if (response.success) {
            fetchedListings = response.data;
          }
        } catch (err) {
          console.log('Error fetching featured:', err);
        }
      }

      setListings(fetchedListings);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [distanceMode]);

  // Handle animal press
  const handleAnimalPress = (listing) => {
    navigation.navigate('AnimalDetail', {
      animalType: listing.animal_type,
      id: listing.id,
    });
  };

  // Handle category click
  const handleCategoryClick = useCallback((category, endpoint) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
      // Clear search when selecting category
      if (searchQuery) {
        setSearchQuery('');
      }
    }
    setShowSuggestions(false);
  }, [selectedCategory, searchQuery]);

  // Clear category filter
  const clearCategoryFilter = useCallback(() => {
    setSelectedCategory(null);
  }, []);

  // Wishlist functions
  const toggleWishlist = (listing) => {
    const isInList = wishlist.some(item =>
      item.id === listing.id && item.animal_type === listing.animal_type
    );

    if (isInList) {
      setWishlist(wishlist.filter(item =>
        !(item.id === listing.id && item.animal_type === listing.animal_type)
      ));
    } else {
      setWishlist([...wishlist, listing]);
    }
  };

  const isInWishlist = (listing) => {
    return wishlist.some(item =>
      item.id === listing.id && item.animal_type === listing.animal_type
    );
  };

  // Search functions
  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      // Save to recent searches
      const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
      setRecentSearches(updated);
      setShowSuggestions(false);
      Keyboard.dismiss();
    }
  }, [searchQuery, recentSearches]);

  const handleQuickSearch = useCallback((query) => {
    setSearchQuery(query);
    setShowSuggestions(false);
    Keyboard.dismiss();
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  }, []);

  // Filter by category
  const categoryFilteredListings = useMemo(() => {
    if (!selectedCategory) return listings;

    return listings.filter(listing => {
      const animalType = listing.animal_type?.toLowerCase();
      const category = selectedCategory.toLowerCase();

      // Match category to animal type
      if (category === 'cow' || category === 'bull') {
        return animalType === 'cow' || animalType === 'bull' || animalType === 'animal';
      }
      return animalType === category || animalType?.includes(category);
    });
  }, [listings, selectedCategory]);

  // Filter by search query
  const filteredListings = useMemo(() => {
    const baseListings = categoryFilteredListings;

    if (!debouncedSearchQuery.trim()) return baseListings;

    const searchTerms = debouncedSearchQuery.toLowerCase().split(' ').filter(t => t.length > 0);

    return baseListings.filter(listing => {
      const searchableText = [
        listing.breed_name,
        listing.animal_type,
        listing.city,
        listing.seller?.name,
      ].join(' ').toLowerCase();

      return searchTerms.every(term => searchableText.includes(term));
    });
  }, [categoryFilteredListings, debouncedSearchQuery]);

  // Get search suggestions
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];

    const query = searchQuery.toLowerCase();
    const suggestions = [];

    // Add matching animal types
    quickSearchTags.forEach(tag => {
      if (tag.query.includes(query) && !suggestions.includes(tag.query)) {
        suggestions.push(tag.query);
      }
    });

    // Add matching breeds from listings
    listings.forEach(listing => {
      const breed = listing.breed_name?.toLowerCase();
      if (breed && breed.includes(query) && !suggestions.includes(breed)) {
        suggestions.push(breed);
      }
    });

    return suggestions.slice(0, 5);
  }, [searchQuery, quickSearchTags, listings]);

  const isShowingSearchResults = searchQuery.trim() && filteredListings.length > 0;
  const isShowingCategoryResults = selectedCategory && !searchQuery.trim();

  // Render header
  const renderHeader = () => (
    <View>
      {/* App Header */}
      <View style={styles.appHeader}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🐄</Text>
          </View>
          <View>
            <Text style={styles.appName}>Kissan E-Bazzar</Text>
            <Text style={styles.appTagline}>Farmers Marketplace</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          {/* AI Health Check Button */}
          <TouchableOpacity
            style={styles.aiButton}
            onPress={() => navigation.navigate('AIHealthCheck')}
          >
            <Ionicons name="medical" size={18} color={COLORS.white} />
            <Text style={styles.aiButtonText}>AI</Text>
          </TouchableOpacity>

          {/* Notifications */}
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color={COLORS.primary} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Wishlist */}
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('Wishlist')}
          >
            <Ionicons name="heart-outline" size={24} color={COLORS.primary} />
            {wishlist.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{wishlist.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.gray} />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search animals, breeds, locations..."
            placeholderTextColor={COLORS.gray}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Search Suggestions */}
        {showSuggestions && searchSuggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {searchSuggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionItem}
                onPress={() => handleQuickSearch(suggestion)}
              >
                <Ionicons name="search" size={16} color={COLORS.gray} />
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quick Search Tags */}
        {!searchQuery && (
          <View style={styles.quickTagsContainer}>
            {quickSearchTags.map((tag) => (
              <TouchableOpacity
                key={tag.query}
                style={styles.quickTag}
                onPress={() => handleQuickSearch(tag.query)}
              >
                <Text style={styles.quickTagIcon}>{tag.icon}</Text>
                <Text style={styles.quickTagLabel}>{tag.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Location Banner */}
      {userLocation && (userLocation.city || userLocation.state) && (
        <View style={styles.locationBanner}>
          <Ionicons name="location" size={16} color={COLORS.primary} />
          <Text style={styles.locationText}>
            Showing animals near{' '}
            <Text style={styles.locationHighlight}>
              {userLocation.city}{userLocation.state ? `, ${userLocation.state}` : ''}
            </Text>
          </Text>
        </View>
      )}

      {/* Categories - CircleBar */}
      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>Browse by Category</Text>
        <CircleBar
          onCategoryClick={handleCategoryClick}
          selectedCategory={selectedCategory}
        />
      </View>

      {/* Distance Toggle */}
      <DistanceToggle
        activeMode={distanceMode}
        onModeChange={setDistanceMode}
      />

      {/* Category Filter Header */}
      {isShowingCategoryResults && (
        <View style={styles.filterHeader}>
          <View>
            <View style={styles.filterTitleRow}>
              <Text style={styles.filterTitle}>
                {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}s
              </Text>
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>Category Filter</Text>
              </View>
            </View>
            <Text style={styles.filterSubtitle}>
              Found {categoryFilteredListings.length} {selectedCategory}
              {categoryFilteredListings.length !== 1 ? 's' : ''} available
            </Text>
          </View>
          <TouchableOpacity style={styles.clearFilterButton} onPress={clearCategoryFilter}>
            <Ionicons name="close" size={16} color={COLORS.gray} />
            <Text style={styles.clearFilterText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Search Results Header */}
      {isShowingSearchResults && (
        <View style={styles.filterHeader}>
          <View>
            <Text style={styles.filterTitle}>
              Results for "{searchQuery}"
            </Text>
            <Text style={styles.filterSubtitle}>
              Found {filteredListings.length} animal{filteredListings.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity style={styles.clearFilterButton} onPress={clearSearch}>
            <Ionicons name="close" size={16} color={COLORS.gray} />
            <Text style={styles.clearFilterText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Listings Header */}
      <View style={styles.listingsHeader}>
        <Text style={styles.sectionTitle}>
          {isShowingSearchResults
            ? 'Search Results'
            : isShowingCategoryResults
              ? `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}s`
              : distanceMode === 'nearby'
                ? 'Nearby Animals (100 km)'
                : 'All Available Animals (500 km)'}
        </Text>
        {userLocation && !isShowingSearchResults && (
          <View style={styles.sortBadge}>
            <Ionicons name="location" size={12} color={COLORS.primary} />
            <Text style={styles.sortText}>By distance</Text>
          </View>
        )}
      </View>
    </View>
  );

  // Render empty state
  const renderEmpty = () => {
    if (loading) return null;

    const getCategoryEmoji = () => {
      const emojis = {
        cow: '🐄', buffalo: '🐃', bull: '🐂', goat: '🐐',
        horse: '🐴', dog: '🐕', cat: '🐱'
      };
      return emojis[selectedCategory] || '🐾';
    };

    if (searchQuery.trim()) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>No results for "{searchQuery}"</Text>
          <Text style={styles.emptySubtitle}>
            Try different keywords or browse by category
          </Text>
          <TouchableOpacity style={styles.emptyButton} onPress={clearSearch}>
            <Text style={styles.emptyButtonText}>Clear Search</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (selectedCategory) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>{getCategoryEmoji()}</Text>
          <Text style={styles.emptyTitle}>
            No {selectedCategory}s found in your area
          </Text>
          <Text style={styles.emptySubtitle}>
            There are no {selectedCategory}s available within {distanceMode === 'nearby' ? '100' : '500'} km
          </Text>
          <View style={styles.emptyActions}>
            <TouchableOpacity
              style={[styles.emptyButton, styles.emptyButtonSecondary]}
              onPress={clearCategoryFilter}
            >
              <Text style={styles.emptyButtonTextSecondary}>View All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('SellAnimal')}
            >
              <Text style={styles.emptyButtonText}>List Your {selectedCategory}</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🐄</Text>
        <Text style={styles.emptyTitle}>No animals found</Text>
        <Text style={styles.emptySubtitle}>
          Be the first to list an animal in your area!
        </Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => navigation.navigate('SellAnimal')}
        >
          <Text style={styles.emptyButtonText}>List Your Animal</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <CowLoader message="Finding animals for you" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredListings}
        keyExtractor={(item) => `${item.animal_type}-${item.id}`}
        renderItem={({ item }) => (
          <AnimalCard
            listing={item}
            onPress={() => handleAnimalPress(item)}
            isInWishlist={isInWishlist(item)}
            onToggleWishlist={toggleWishlist}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => {
          setShowSuggestions(false);
          Keyboard.dismiss();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoEmoji: {
    fontSize: 24,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  appTagline: {
    fontSize: 11,
    color: COLORS.gray,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  aiButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  headerButton: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: COLORS.red,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: COLORS.white,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.black,
  },
  searchButton: {
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginTop: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  suggestionText: {
    fontSize: 15,
    color: COLORS.black,
  },
  quickTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  quickTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  quickTagIcon: {
    fontSize: 14,
  },
  quickTagLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary + '10',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  locationText: {
    marginLeft: 6,
    fontSize: 14,
    color: COLORS.gray,
  },
  locationHighlight: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  categoriesSection: {
    backgroundColor: COLORS.white,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  filterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  filterBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primary,
  },
  filterSubtitle: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 4,
  },
  clearFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    gap: 4,
  },
  clearFilterText: {
    fontSize: 13,
    color: COLORS.gray,
    fontWeight: '500',
  },
  listingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.background,
  },
  sortBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  sortText: {
    marginLeft: 4,
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyActions: {
    flexDirection: 'row',
    gap: 12,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonSecondary: {
    backgroundColor: COLORS.secondary,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 15,
  },
  emptyButtonTextSecondary: {
    color: COLORS.gray,
    fontWeight: '600',
    fontSize: 15,
  },
});

export default HomeScreen;
