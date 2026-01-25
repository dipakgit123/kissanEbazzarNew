import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, formatPrice } from '../utils/constants';
import { useWishlist } from '../context/WishlistContext';

const WishlistScreen = ({ navigation }) => {
  const { wishlist, removeFromWishlist: removeFromWishlistContext, clearWishlist: clearWishlistContext, loading } = useWishlist();
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const handleRemoveFromWishlist = (item) => {
    Alert.alert(
      'Remove from Wishlist',
      'Are you sure you want to remove this item from your wishlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeFromWishlistContext(item.id || item.animal_id, item.animal_type);
          },
        },
      ]
    );
  };

  const handleClearWishlist = () => {
    if (wishlist.length === 0) return;

    Alert.alert(
      'Clear Wishlist',
      'Are you sure you want to remove all items from your wishlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await clearWishlistContext();
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // The wishlist will automatically reload when the component refocuses
    setRefreshing(false);
  };

  const handleItemPress = (item) => {
    navigation.navigate('AnimalDetail', {
      animalType: item.animal_type,
      id: item.animal_id || item.id, // Use animal_id if available, fallback to id
    });
  };

  const getImageUrl = (item) => {
    // Handle different image field names from backend
    if (item.front_photo) return item.front_photo;
    if (item.frontPhoto) return item.frontPhoto;
    if (item.side_photo) return item.side_photo;
    if (item.sidePhoto) return item.sidePhoto;
    if (item.photo_1) return item.photo_1;
    if (item.photo1) return item.photo1;
    if (item.photos && item.photos.length > 0) return item.photos[0];
    if (item.photo_url) return item.photo_url;
    if (item.photoUrl) return item.photoUrl;
    return null;
  };

  const renderWishlistItem = ({ item }) => {
    // Debug: Log the item to see what data we're receiving
    console.log('Wishlist item data:', JSON.stringify(item, null, 2));
    
    const imageUrl = getImageUrl(item);
    
    // Extract data with multiple field name variations
    const breedName = item.breed_name || item.breedName || item.breed || 'Unknown Breed';
    const price = item.expected_price || item.expectedPrice || item.price || 0;
    const milkCapacity = item.milk_capacity || item.milkCapacity;
    const age = item.age;
    const city = item.city;
    const state = item.state;

    return (
      <TouchableOpacity
        style={styles.listCard}
        onPress={() => handleItemPress(item)}
        activeOpacity={0.8}
      >
        {/* Image Section */}
        <View style={styles.cardImageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.cardImage} />
          ) : (
            <View style={styles.cardPlaceholder}>
              <Text style={styles.cardPlaceholderEmoji}>
                {item.animal_type === 'cow' ? '🐄' :
                 item.animal_type === 'buffalo' ? '🐃' :
                 item.animal_type === 'goat' ? '🐐' :
                 item.animal_type === 'sheep' ? '🐑' :
                 item.animal_type === 'horse' ? '🐎' :
                 item.animal_type === 'dog' ? '🐕' :
                 item.animal_type === 'cat' ? '🐈' : '🐾'}
              </Text>
            </View>
          )}
          
          {/* Heart Button */}
          <TouchableOpacity
            style={styles.cardHeartButton}
            onPress={(e) => {
              e.stopPropagation();
              handleRemoveFromWishlist(item);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="heart" size={22} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* Content Section */}
        <View style={styles.cardContent}>
          {/* Top Row: Type & Price */}
          <View style={styles.cardTopRow}>
            <View style={styles.cardTypeBadge}>
              <Text style={styles.cardTypeText}>
                {item.animal_type?.charAt(0).toUpperCase() + item.animal_type?.slice(1)}
              </Text>
            </View>
            <Text style={styles.cardPrice}>₹{formatPrice(price)}</Text>
          </View>

          {/* Breed Name */}
          <Text style={styles.cardBreedName} numberOfLines={2}>
            {breedName}
          </Text>

          {/* Info Row */}
          <View style={styles.cardInfoRow}>
            {milkCapacity && (
              <View style={styles.cardInfoItem}>
                <Ionicons name="water" size={14} color="#3B82F6" />
                <Text style={styles.cardInfoText}>{milkCapacity}L/day</Text>
              </View>
            )}
            {age && (
              <View style={styles.cardInfoItem}>
                <Ionicons name="time-outline" size={14} color="#10B981" />
                <Text style={styles.cardInfoText}>{age}</Text>
              </View>
            )}
          </View>

          {/* Location */}
          <View style={styles.cardLocation}>
            <Ionicons name="location-outline" size={14} color="#6B7280" />
            <Text style={styles.cardLocationText} numberOfLines={1}>
              {[city, state].filter(Boolean).join(', ') || 'Location not specified'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="heart-outline" size={80} color={COLORS.lightGray} />
      </View>
      <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
      <Text style={styles.emptySubtitle}>
        Save your favorite animals here by tapping the heart icon on any listing
      </Text>
      <TouchableOpacity
        style={styles.browseButton}
        onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
      >
        <Text style={styles.browseButtonText}>Browse Animals</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wishlist</Text>
        {wishlist.length > 0 && (
          <TouchableOpacity onPress={handleClearWishlist}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Wishlist Items */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading wishlist...</Text>
        </View>
      ) : (
        <FlatList
          data={wishlist}
          keyExtractor={(item) => `${item.animal_type}-${item.id || item.animal_id}`}
          renderItem={renderWishlistItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
            wishlist.length === 0 && styles.emptyListContent,
            { paddingBottom: 160 }
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
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  clearText: {
    fontSize: 14,
    color: COLORS.red,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  emptyListContent: {
    flex: 1,
  },
  // New List Card Styles
  listCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardImageContainer: {
    width: '100%',
    height: 220,
    position: 'relative',
    backgroundColor: '#F3F4F6',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardPlaceholderEmoji: {
    fontSize: 64,
    opacity: 0.5,
  },
  cardHeartButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  cardContent: {
    padding: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTypeBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cardTypeText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
  },
  cardBreedName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
    lineHeight: 24,
  },
  cardInfoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  cardInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 5,
  },
  cardInfoText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  cardLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardLocationText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
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
    lineHeight: 24,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  browseButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray,
  },
});

export default WishlistScreen;
