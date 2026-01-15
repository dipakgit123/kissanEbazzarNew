import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, formatPrice, formatTimeAgo, getAnimalTypeIcon } from '../utils/constants';
import { useWishlist } from '../context/WishlistContext';

const AnimalCard = ({
  listing,
  onPress,
}) => {
  if (!listing) return null;

  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const inWishlist = isInWishlist(listing.id);

  const handleWishlistToggle = () => {
    if (inWishlist) {
      removeFromWishlist(listing.id);
    } else {
      addToWishlist(listing);
    }
  };

  const {
    animal_type,
    breed_name,
    expected_price,
    front_photo,
    side_photo,
    city,
    state,
    distance,
    created_at,
    seller,
    milk_capacity,
    age,
    status,
  } = listing;

  const imageUrl = front_photo || side_photo || null;
  const animalIcon = getAnimalTypeIcon(animal_type);

  const handleCall = () => {
    if (seller?.phone) {
      Linking.openURL(`tel:${seller.phone}`);
    }
  };

  const handleWhatsApp = () => {
    if (seller?.phone) {
      const message = `Hi! I'm interested in your ${animal_type} listing: "${breed_name}" - ₹${formatPrice(expected_price)}`;
      const url = `whatsapp://send?phone=91${seller.phone}&text=${encodeURIComponent(message)}`;
      Linking.openURL(url).catch(() => {
        Linking.openURL(`https://wa.me/91${seller.phone}?text=${encodeURIComponent(message)}`);
      });
    }
  };

  const getLocationText = () => {
    let loc = city || 'Unknown';
    if (state) loc += `, ${state}`;
    if (distance) {
      loc += ` (${Math.round(distance)} km)`;
    }
    return loc;
  };

  const getStatusColor = () => {
    switch (status?.toLowerCase()) {
      case 'sold':
        return '#EF4444';
      case 'reserved':
        return '#F59E0B';
      default:
        return COLORS.primary;
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Image Section */}
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderEmoji}>{animalIcon}</Text>
          </View>
        )}

        {/* Top Badge Row */}
        <View style={styles.topBadgeRow}>
          {/* Animal Type Badge */}
          <View style={styles.typeBadge}>
            <Text style={styles.typeIcon}>{animalIcon}</Text>
            <Text style={styles.typeText}>
              {animal_type?.charAt(0).toUpperCase() + animal_type?.slice(1) || 'Animal'}
            </Text>
          </View>

          {/* Price Badge */}
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeText}>₹{formatPrice(expected_price)}</Text>
          </View>
        </View>

        {/* Wishlist Heart Icon - Top Right Corner */}
        <TouchableOpacity
          style={[
            styles.wishlistButton,
            inWishlist && styles.wishlistButtonActive
          ]}
          onPress={handleWishlistToggle}
          activeOpacity={0.7}
        >
          <Ionicons
            name={inWishlist ? "heart" : "heart-outline"}
            size={24}
            color={inWishlist ? "#EF4444" : "#FFFFFF"}
          />
        </TouchableOpacity>

        {/* Status Badge */}
        {status && status.toLowerCase() !== 'active' && (
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>{status.toUpperCase()}</Text>
          </View>
        )}
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        {/* Breed Name */}
        <Text style={styles.breedName} numberOfLines={2}>
          {breed_name || 'Unknown Breed'}
        </Text>

        {/* Info Tags */}
        <View style={styles.infoTags}>
          {milk_capacity && (
            <View style={styles.infoTag}>
              <Ionicons name="water" size={14} color="#3B82F6" />
              <Text style={styles.infoTagText}>{milk_capacity}L milk</Text>
            </View>
          )}
          {age && (
            <View style={styles.infoTag}>
              <Ionicons name="time-outline" size={14} color="#10B981" />
              <Text style={styles.infoTagText}>{age}</Text>
            </View>
          )}
        </View>

        {/* Location & Time Row */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={14} color={COLORS.primary} />
            <Text style={styles.metaText} numberOfLines={1}>
              {getLocationText()}
            </Text>
          </View>
          {created_at && (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color="#9CA3AF" />
              <Text style={styles.metaText}>{formatTimeAgo(created_at)}</Text>
            </View>
          )}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Seller Info */}
        <View style={styles.sellerRow}>
          <View style={styles.sellerAvatar}>
            {seller?.profile_photo ? (
              <Image source={{ uri: seller.profile_photo }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {seller?.name?.charAt(0)?.toUpperCase() || 'S'}
              </Text>
            )}
          </View>
          <View style={styles.sellerInfo}>
            <Text style={styles.sellerName} numberOfLines={1}>
              {seller?.name || 'Unknown Seller'}
            </Text>
            <View style={styles.verifiedRow}>
              <Ionicons name="checkmark-circle" size={12} color={COLORS.primary} />
              <Text style={styles.verifiedText}>Verified Seller</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.callButton}
            onPress={handleCall}
            activeOpacity={0.8}
          >
            <Ionicons name="call" size={18} color="#FFFFFF" />
            <Text style={styles.buttonText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.whatsappButton}
            onPress={handleWhatsApp}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
            <Text style={styles.buttonText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    height: 220,
    backgroundColor: '#F3F4F6',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
  },
  placeholderEmoji: {
    fontSize: 64,
    opacity: 0.5,
  },
  topBadgeRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typeIcon: {
    fontSize: 14,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  priceBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  priceBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  wishlistButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
    zIndex: 10,
  },
  wishlistButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    padding: 16,
  },
  breedName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
    lineHeight: 26,
  },
  infoTags: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  infoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  infoTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 14,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 48,
    height: 48,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  whatsappButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default AnimalCard;
