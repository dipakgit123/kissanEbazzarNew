import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS, ANIMAL_TYPES } from '../utils/constants';
import { listingsService, userService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import AnimalCard from '../components/AnimalCard';

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [showingFeatured, setShowingFeatured] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

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

      // Fetch listings
      let fetchedListings = [];
      let usedNearby = false;

      if (lat && lng) {
        try {
          const response = await listingsService.getNearbyListings(lat, lng, 100, 20);
          if (response.success && response.data?.length > 0) {
            fetchedListings = response.data;
            usedNearby = true;
          }
        } catch (err) {
          console.log('Error fetching nearby:', err);
        }
      }

      // Fallback to featured if nearby empty
      if (fetchedListings.length === 0) {
        try {
          const response = await listingsService.getFeaturedListings(20);
          if (response.success) {
            fetchedListings = response.data;
            setShowingFeatured(true);
          }
        } catch (err) {
          console.log('Error fetching featured:', err);
        }
      } else {
        setShowingFeatured(false);
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
  }, []);

  const handleAnimalPress = (listing) => {
    navigation.navigate('AnimalDetail', {
      animalType: listing.animal_type,
      id: listing.id,
    });
  };

  const handleCategoryPress = (category) => {
    navigation.navigate('CategoryListings', { category });
  };

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

  const filteredListings = searchQuery
    ? listings.filter(listing =>
        listing.breed_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.animal_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.city?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : listings;

  const renderHeader = () => (
    <View>
      {/* App Header with Logo and Wishlist */}
      <View style={styles.appHeader}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🐄</Text>
          </View>
          <Text style={styles.appName}>Kissan E-Bazzar</Text>
        </View>
        <View style={styles.headerActions}>
          {/* Notification Bell */}
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color={COLORS.primary} />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
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
              <View style={styles.wishlistBadge}>
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
            style={styles.searchInput}
            placeholder="Search animals, breeds..."
            placeholderTextColor={COLORS.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          )}
        </View>
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

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <Text style={styles.sectionTitle}>Browse by Category</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        >
          {ANIMAL_TYPES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryItem}
              onPress={() => handleCategoryPress(category)}
            >
              <View style={styles.categoryIcon}>
                <Text style={styles.categoryEmoji}>{category.icon}</Text>
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Listings Header */}
      <View style={styles.listingsHeader}>
        <Text style={styles.sectionTitle}>
          {showingFeatured ? 'Featured Listings' : 'Nearby Listings'}
        </Text>
        {!showingFeatured && (
          <View style={styles.sortBadge}>
            <Ionicons name="location" size={12} color={COLORS.primary} />
            <Text style={styles.sortText}>By distance</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🐄</Text>
      <Text style={styles.emptyTitle}>No animals found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? 'Try searching with different keywords'
          : 'Be the first to list an animal in your area!'}
      </Text>
      {!searchQuery && (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => navigation.navigate('SellAnimal')}
        >
          <Text style={styles.emptyButtonText}>List Your Animal</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading listings...</Text>
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
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoEmoji: {
    fontSize: 22,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
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
  wishlistBadge: {
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
    fontSize: 11,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.gray,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: COLORS.white,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.black,
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
  categoriesContainer: {
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: COLORS.white,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  categoriesList: {
    paddingHorizontal: 12,
  },
  categoryItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 70,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryEmoji: {
    fontSize: 28,
  },
  categoryName: {
    fontSize: 12,
    color: COLORS.black,
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
    paddingBottom: 20,
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
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default HomeScreen;
