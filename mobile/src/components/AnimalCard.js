import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { COLORS, formatPrice, formatTimeAgo, getAnimalTypeIcon } from '../utils/constants';
import { useWishlist } from '../context/WishlistContext';
import { callLogService } from '../services/api';

const OTP_DOT = '\u00B7';

const AnimalCard = ({ listing, onPress }) => {
  if (!listing) {
    return null;
  }

  const { t } = useTranslation();
  const navigation = useNavigation();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const inWishlist = isInWishlist(listing.id);

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
    vaccination_status,
    vaccination_details,
    latitude,
    longitude,
  } = listing;

  const imageUrl = front_photo || side_photo || null;
  const animalIcon = getAnimalTypeIcon(animal_type);
  const formattedPrice = formatPrice(expected_price);
  const animalTypeLabel = animal_type
    ? t(`animalTypes.${animal_type}`, {
        defaultValue: animal_type.charAt(0).toUpperCase() + animal_type.slice(1),
      })
    : 'Animal';

  const formatPostedTime = () => {
    if (!created_at) {
      return null;
    }

    const date = new Date(created_at);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.max(0, Math.floor(diffMs / 60000));
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return t('buyAnimals.justNow');
    }
    if (diffMins < 60) {
      return t('buyAnimals.minutesAgo', { count: diffMins });
    }
    if (diffHours < 24) {
      return t('buyAnimals.hoursAgo', { count: diffHours });
    }
    if (diffDays < 7) {
      return t('buyAnimals.daysAgo', { count: diffDays });
    }

    return formatTimeAgo(created_at);
  };

  const getLocationText = () => city || state || t('buyAnimals.unknownLocation');
  const numericLatitude = Number(latitude);
  const numericLongitude = Number(longitude);
  const hasExactLocation =
    Number.isFinite(numericLatitude) && Number.isFinite(numericLongitude);

  const isVaccinated =
    vaccination_status === true ||
    vaccination_status === 'true' ||
    vaccination_status === 'yes' ||
    vaccination_status === 'vaccinated' ||
    Boolean(vaccination_details);

  const statusLabel = isVaccinated ? t('animalCard.vaccinated') : null;

  const handleWishlistToggle = async () => {
    if (isWishlistLoading) {
      return;
    }

    setIsWishlistLoading(true);
    try {
      if (inWishlist) {
        await removeFromWishlist(listing.id, listing.animal_type);
        Toast.show({
          type: 'success',
          text1: t('wishlist.removedFromWishlist') || 'Removed from wishlist',
          visibilityTime: 2000,
          topOffset: 60,
        });
      } else {
        await addToWishlist(listing);
        Toast.show({
          type: 'success',
          text1: t('wishlist.addedToWishlist') || 'Added to wishlist!',
          visibilityTime: 2000,
          topOffset: 60,
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t('common.error') || 'Error',
        text2: error.message || 'Something went wrong',
        visibilityTime: 2000,
        topOffset: 60,
      });
    } finally {
      setIsWishlistLoading(false);
    }
  };

  const handleCall = async () => {
    if (!seller?.phone) {
      return;
    }

    try {
      await callLogService.logCall({
        receiverId: seller.id || listing.user_id,
        receiverPhoneNumber: seller.phone,
        callType: 'direct',
        listingId: listing.id,
        listingType: animal_type,
      });
    } catch (error) {
      console.error('Error logging call:', error);
    } finally {
      Linking.openURL(`tel:${seller.phone}`);
    }
  };

  const handleWhatsApp = async () => {
    if (!seller?.phone) {
      return;
    }

    const message = `Hi! I'm interested in your ${animal_type} listing: "${breed_name}" - \u20B9${formattedPrice}`;

    try {
      await callLogService.logCall({
        receiverId: seller.id || listing.user_id,
        receiverPhoneNumber: seller.phone,
        callType: 'direct',
        listingId: listing.id,
        listingType: animal_type,
      });
    } catch (error) {
      console.error('Error logging WhatsApp lead:', error);
    } finally {
      const url = `whatsapp://send?phone=${seller.phone}&text=${encodeURIComponent(message)}`;
      Linking.openURL(url).catch(() => {
        Linking.openURL(`https://wa.me/${seller.phone}?text=${encodeURIComponent(message)}`);
      });
    }
  };

  const handleLocationPress = () => {
    const mapParams = hasExactLocation
      ? {
          listingId: listing.id,
          animalType: animal_type,
          latitude: numericLatitude,
          longitude: numericLongitude,
          listing,
        }
      : undefined;

    navigation.navigate('Map', mapParams);
  };

  const numericDistance = Number(distance);
  const distanceText =
    Number.isFinite(numericDistance) && numericDistance > 0
      ? t('buyAnimals.kmAway', { distance: Math.round(numericDistance) })
      : null;
  const postedTimeText = formatPostedTime();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.92}>
      <View style={styles.mediaSection}>
        <View style={[styles.topMetaRow, !statusLabel && styles.topMetaRowPriceOnly]}>
          {statusLabel ? (
            <View style={styles.statusChip}>
              <Text style={styles.statusChipText} numberOfLines={1}>
                {statusLabel}
              </Text>
            </View>
          ) : null}

          <View style={styles.priceChip}>
            <Text style={styles.priceChipText}>{`\u20B9${formattedPrice}`}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.wishlistButton,
            inWishlist && styles.wishlistButtonActive,
            isWishlistLoading && styles.wishlistButtonLoading,
          ]}
          onPress={handleWishlistToggle}
          activeOpacity={0.7}
          disabled={isWishlistLoading}
        >
          {isWishlistLoading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Ionicons
              name={inWishlist ? 'heart' : 'heart-outline'}
              size={18}
              color={inWishlist ? COLORS.error : COLORS.borderStrong}
            />
          )}
        </TouchableOpacity>

        <View style={styles.thumbnailWrap}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.thumbnailImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderEmoji}>{animalIcon}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.contentSection}>
        <Text style={styles.breedName} numberOfLines={1}>
          {`${breed_name || t('buyAnimals.unknownBreed')} | ${animalTypeLabel}`}
        </Text>

        <TouchableOpacity
          style={styles.locationRow}
          onPress={handleLocationPress}
          activeOpacity={0.75}
        >
          <Ionicons name="location-outline" size={13} color={COLORS.primaryDark} />
          <Text style={styles.locationText} numberOfLines={1}>
            {getLocationText()}
          </Text>
          {distanceText ? (
            <View style={styles.distanceWrap}>
              <Text style={styles.dotSeparator}>{OTP_DOT}</Text>
              <Text style={styles.distanceText} numberOfLines={1}>
                {distanceText}
              </Text>
            </View>
          ) : null}
          <View style={styles.locationTapIndicator}>
            <Ionicons name="map-outline" size={13} color={COLORS.primaryDark} />
            <Ionicons name="chevron-forward" size={13} color={COLORS.primaryDark} />
          </View>
        </TouchableOpacity>

        <View style={styles.bottomRow}>
          <View style={styles.bottomMeta}>
            <Text style={styles.priceText}>{`\u20B9${formattedPrice}`}</Text>
            {postedTimeText ? (
              <Text style={styles.postedTimeText} numberOfLines={1}>
                {postedTimeText}
              </Text>
            ) : null}
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.callButton} onPress={handleCall} activeOpacity={0.8}>
              <Ionicons name="call" size={13} color={COLORS.white} />
              <Text style={styles.actionButtonText}>{t('animalCard.call')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.whatsappButton}
              onPress={handleWhatsApp}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-whatsapp" size={15} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 14,
    overflow: 'hidden',
  },
  mediaSection: {
    backgroundColor: COLORS.primarySoft,
    height: 190,
    paddingHorizontal: 0,
    paddingTop: 12,
    paddingBottom: 0,
    position: 'relative',
    overflow: 'hidden',
  },
  topMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
    gap: 8,
    paddingHorizontal: 12,
    zIndex: 3,
  },
  topMetaRowPriceOnly: {
    justifyContent: 'flex-end',
  },
  statusChip: {
    maxWidth: '58%',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#F2FFFA',
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primaryDark,
  },
  priceChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.primaryDark,
    minWidth: 78,
    alignItems: 'center',
  },
  priceChipText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.white,
  },
  wishlistButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 2,
  },
  wishlistButtonActive: {
    borderColor: COLORS.errorSoft,
    backgroundColor: COLORS.errorSoft,
  },
  wishlistButtonLoading: {
    backgroundColor: COLORS.borderStrong,
  },
  thumbnailWrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F8F4',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  placeholderEmoji: {
    fontSize: 48,
    opacity: 0.92,
  },
  contentSection: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
  },
  breedName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    maxWidth: '100%',
    backgroundColor: COLORS.primarySoft,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    paddingVertical: 5,
    paddingLeft: 8,
    paddingRight: 5,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.primaryDark,
    marginLeft: 4,
    flexShrink: 1,
    maxWidth: '48%',
    fontWeight: '600',
  },
  distanceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
    flexShrink: 1,
  },
  dotSeparator: {
    fontSize: 13,
    color: COLORS.borderStrong,
    marginRight: 6,
  },
  distanceText: {
    fontSize: 14,
    color: COLORS.primaryDark,
    fontWeight: '500',
    flexShrink: 1,
  },
  locationTapIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginLeft: 8,
    gap: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
  },
  bottomMeta: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  postedTimeText: {
    fontSize: 11.5,
    color: COLORS.accent,
    fontWeight: '600',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.blue,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 6,
    minWidth: 82,
  },
  whatsappButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  actionButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },
});

export default AnimalCard;
