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
import { COLORS, formatPrice, formatTimeAgo } from '../utils/constants';

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
    distance,
    created_at,
    seller,
  } = listing;

  const imageUrl = front_photo || side_photo || null;

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
    if (distance) {
      loc += ` (${Math.round(distance)} km)`;
    }
    return loc;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="image-outline" size={48} color={COLORS.gray} />
          </View>
        )}

        {/* Price Badge */}
        <View style={styles.priceBadge}>
          <Text style={styles.priceText}>₹{formatPrice(expected_price)}</Text>
        </View>

        {/* Status Badge */}
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Available</Text>
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

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {breed_name || 'Unknown Breed'} | {animal_type?.charAt(0).toUpperCase() + animal_type?.slice(1)}
        </Text>

        {/* Location & Date */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={14} color={COLORS.primary} />
            <Text style={styles.infoText}>{getLocationText()}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={14} color={COLORS.gray} />
            <Text style={styles.infoText}>{formatTimeAgo(created_at)}</Text>
          </View>
        </View>

        {/* Seller Info */}
        <View style={styles.sellerRow}>
          <View style={styles.sellerAvatar}>
            {seller?.profile_photo ? (
              <Image source={{ uri: seller.profile_photo }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {seller?.name?.charAt(0) || 'S'}
              </Text>
            )}
          </View>
          <View style={styles.sellerInfo}>
            <Text style={styles.sellerName}>{seller?.name || 'Unknown Seller'}</Text>
            <Text style={styles.sellerLabel}>Verified Seller</Text>
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
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
  priceBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  priceText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: COLORS.white + 'E6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: COLORS.black,
    fontSize: 12,
    fontWeight: '500',
  },
  wishlistButton: {
    position: 'absolute',
    top: 50,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white + 'E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wishlistButtonActive: {
    backgroundColor: COLORS.red,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 4,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sellerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
  },
  sellerLabel: {
    fontSize: 12,
    color: COLORS.gray,
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
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  whatsappButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
});

export default AnimalCard;
