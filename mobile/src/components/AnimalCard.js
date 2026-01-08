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

const AnimalCard = ({
  listing,
  onPress,
  isInWishlist = false,
  onToggleWishlist,
}) => {
  const {
    id,
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
    age_years,
    age_months,
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

  const getAgeText = () => {
    if (age_years || age_months) {
      let text = '';
      if (age_years) text += `${age_years}yr`;
      if (age_months) text += ` ${age_months}mo`;
      return text.trim();
    }
    return null;
  };

  const getStatusColor = () => {
    switch (status?.toLowerCase()) {
      case 'sold':
        return COLORS.red;
      case 'reserved':
        return COLORS.yellow;
      default:
        return COLORS.primary;
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
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

        {/* Top Row Badges */}
        <View style={styles.topBadgeRow}>
          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {status || 'Available'}
            </Text>
          </View>

          {/* Price Badge */}
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>₹{formatPrice(expected_price)}</Text>
          </View>
        </View>

        {/* Animal Type Badge */}
        <View style={styles.animalTypeBadge}>
          <Text style={styles.animalTypeEmoji}>{animalIcon}</Text>
          <Text style={styles.animalTypeText}>
            {animal_type?.charAt(0).toUpperCase() + animal_type?.slice(1)}
          </Text>
        </View>

        {/* Wishlist Button */}
        {onToggleWishlist && (
          <TouchableOpacity
            style={[
              styles.wishlistButton,
              isInWishlist && styles.wishlistButtonActive,
            ]}
            onPress={() => onToggleWishlist(listing)}
          >
            <Ionicons
              name={isInWishlist ? 'heart' : 'heart-outline'}
              size={20}
              color={isInWishlist ? COLORS.white : COLORS.gray}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        {/* Title Row */}
        <Text style={styles.title} numberOfLines={2}>
          {breed_name || 'Unknown Breed'}
        </Text>

        {/* Info Tags Row */}
        <View style={styles.tagsRow}>
          {milk_capacity && (
            <View style={styles.tag}>
              <Ionicons name="water" size={12} color={COLORS.blue} />
              <Text style={styles.tagText}>{milk_capacity}L milk</Text>
            </View>
          )}
          {getAgeText() && (
            <View style={styles.tag}>
              <Ionicons name="calendar-outline" size={12} color={COLORS.primary} />
              <Text style={styles.tagText}>{getAgeText()}</Text>
            </View>
          )}
        </View>

        {/* Location & Date Row */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={14} color={COLORS.primary} />
            <Text style={styles.infoText} numberOfLines={1}>{getLocationText()}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={14} color={COLORS.gray} />
            <Text style={styles.infoText}>{formatTimeAgo(created_at)}</Text>
          </View>
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
          <TouchableOpacity style={styles.callButton} onPress={handleCall}>
            <Ionicons name="call" size={16} color={COLORS.white} />
            <Text style={styles.buttonText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsApp}>
            <Ionicons name="logo-whatsapp" size={16} color={COLORS.white} />
            <Text style={styles.buttonText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 64,
    opacity: 0.6,
  },
  topBadgeRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priceBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  priceText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 15,
  },
  animalTypeBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  animalTypeEmoji: {
    fontSize: 14,
  },
  animalTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.black,
  },
  wishlistButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  wishlistButtonActive: {
    backgroundColor: COLORS.red,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 8,
    lineHeight: 24,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.black,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.gray,
    flexShrink: 1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.lightGray,
    marginBottom: 12,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sellerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 2,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
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
    backgroundColor: COLORS.blue,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: COLORS.blue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
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
    borderRadius: 14,
    gap: 8,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 15,
  },
});

export default AnimalCard;
