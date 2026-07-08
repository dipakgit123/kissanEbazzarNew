import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { COLORS } from '../utils/constants';
import { listingsService } from '../services/api';
import AnimalCard from '../components/AnimalCard';
import SkeletonLoader from '../components/SkeletonLoader';
import AppHeader from '../components/AppHeader';

const CategoryListingsScreen = ({ route, navigation }) => {
  const { category } = route.params;
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    fetchListings();
  }, [category]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const response = await listingsService.getListingsByType(category.id);
      if (response.success) {
        setListings(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchListings();
    setRefreshing(false);
  }, [category]);

  const handleAnimalPress = (listing) => {
    navigation.navigate('AnimalDetail', {
      animalType: listing.animal_type,
      id: listing.id,
    });
  };

  const toggleWishlist = (listing) => {
    const isInList = wishlist.some(
      (item) => item.id === listing.id && item.animal_type === listing.animal_type
    );

    if (isInList) {
      setWishlist(
        wishlist.filter(
          (item) => !(item.id === listing.id && item.animal_type === listing.animal_type)
        )
      );
    } else {
      setWishlist([...wishlist, listing]);
    }
  };

  const isInWishlist = (listing) => {
    return wishlist.some(
      (item) => item.id === listing.id && item.animal_type === listing.animal_type
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>{category.icon}</Text>
      <Text style={styles.emptyTitle}>No {category.name} Listed</Text>
      <Text style={styles.emptySubtitle}>
        Be the first to list a {category.name.toLowerCase()}!
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('CreateListing', { category })}
      >
        <Text style={styles.emptyButtonText}>List Your {category.name}</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <SkeletonLoader variant="animalList" count={4} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader
        navigation={navigation}
        title={category.name}
        subtitle={`${listings.length} ${listings.length === 1 ? 'listing' : 'listings'} available`}
        leading={<Text style={styles.categoryIcon}>{category.icon}</Text>}
        rightActions={[
          {
            icon: 'add',
            onPress: () => navigation.navigate('CreateListing', { category }),
            color: COLORS.surface,
            backgroundColor: COLORS.primary,
            accessibilityLabel: `List ${category.name}`,
          },
        ]}
      />

      {/* Listings */}
      <FlatList
        data={listings}
        keyExtractor={(item) => `${item.animal_type}-${item.id}`}
        renderItem={({ item }) => (
          <AnimalCard
            listing={item}
            onPress={() => handleAnimalPress(item)}
            isInWishlist={isInWishlist(item)}
            onToggleWishlist={toggleWishlist}
          />
        )}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          listings.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.gray,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 36,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  emptyListContent: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default CategoryListingsScreen;
