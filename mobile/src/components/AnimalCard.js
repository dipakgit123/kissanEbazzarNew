import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { COLORS, formatPrice, formatTimeAgo, getAnimalTypeIcon } from '../utils/constants';
import { useWishlist } from '../context/WishlistContext';
import { callLogService, listingReportService } from '../services/api';

const OTP_DOT = '\u00B7';
const REPORT_REASONS = [
  { value: 'fraud', label: 'Fraud or scam' },
  { value: 'wrong_information', label: 'Wrong information' },
  { value: 'already_sold', label: 'Already sold' },
  { value: 'inappropriate_content', label: 'Inappropriate content' },
  { value: 'suspicious_price', label: 'Suspicious price' },
  { value: 'seller_not_responding', label: 'Seller not responding' },
  { value: 'animal_welfare', label: 'Animal welfare concern' },
  { value: 'other', label: 'Other issue' },
];

const AnimalCard = ({ listing, onPress }) => {
  if (!listing) {
    return null;
  }

  const { t } = useTranslation();
  const navigation = useNavigation();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState('wrong_information');
  const [reportDescription, setReportDescription] = useState('');
  const [isReportSubmitting, setIsReportSubmitting] = useState(false);
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

  const openReportModal = () => {
    setReportReason('wrong_information');
    setReportDescription('');
    setReportModalVisible(true);
  };

  const submitReport = async () => {
    const description = reportDescription.trim();

    if (description.length < 10) {
      Toast.show({
        type: 'error',
        text1: t('animalDetail.reportDescriptionRequired', { defaultValue: 'Add more detail' }),
        text2: t('animalDetail.reportDescriptionRequiredDesc', { defaultValue: 'Please describe the issue in at least 10 characters.' }),
        visibilityTime: 2500,
        topOffset: 60,
      });
      return;
    }

    setIsReportSubmitting(true);
    try {
      const response = await listingReportService.createReport({
        listing_id: listing.id,
        listing_type: animal_type,
        report_type: reportReason,
        description,
      });

      setReportModalVisible(false);
      Toast.show({
        type: 'success',
        text1: t('animalDetail.reportSubmitted', { defaultValue: 'Report submitted' }),
        text2: response?.message || t('animalDetail.reportSubmittedDesc', { defaultValue: 'Our team will review this listing shortly.' }),
        visibilityTime: 2500,
        topOffset: 60,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t('common.error', { defaultValue: 'Error' }),
        text2: error?.message || t('animalDetail.reportFailed', { defaultValue: 'Failed to submit report.' }),
        visibilityTime: 3000,
        topOffset: 60,
      });
    } finally {
      setIsReportSubmitting(false);
    }
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

        <TouchableOpacity
          style={styles.reportButton}
          onPress={openReportModal}
          activeOpacity={0.78}
        >
          <Ionicons name="flag-outline" size={17} color={COLORS.error} />
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

      <Modal
        visible={reportModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={styles.reportBackdrop}>
          <View style={styles.reportSheet}>
            <View style={styles.reportTitleRow}>
              <View style={styles.reportIconWrap}>
                <Ionicons name="flag-outline" size={22} color={COLORS.error} />
              </View>
              <View style={styles.reportTitleTextWrap}>
                <Text style={styles.reportTitle}>
                  {t('animalDetail.reportListing', { defaultValue: 'Report this listing' })}
                </Text>
                <Text style={styles.reportSubtitle} numberOfLines={2}>
                  {breed_name || animalTypeLabel}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.reportCloseButton}
                onPress={() => setReportModalVisible(false)}
              >
                <Ionicons name="close" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.reportFormScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.reportFieldLabel}>
                {t('animalDetail.reportReason', { defaultValue: 'Reason' })}
              </Text>
              <View style={styles.reportReasonGrid}>
                {REPORT_REASONS.map((reason) => {
                  const selected = reportReason === reason.value;
                  return (
                    <TouchableOpacity
                      key={reason.value}
                      style={[styles.reportReasonChip, selected && styles.reportReasonChipSelected]}
                      onPress={() => setReportReason(reason.value)}
                      activeOpacity={0.86}
                    >
                      <Text style={[styles.reportReasonText, selected && styles.reportReasonTextSelected]}>
                        {t(`animalDetail.reportReasons.${reason.value}`, { defaultValue: reason.label })}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.reportFieldLabel}>
                {t('animalDetail.reportDetails', { defaultValue: 'Details' })}
              </Text>
              <TextInput
                value={reportDescription}
                onChangeText={setReportDescription}
                placeholder={t('animalDetail.reportDetailsPlaceholder', { defaultValue: 'Explain the issue with this listing...' })}
                placeholderTextColor={COLORS.gray}
                style={styles.reportInput}
                multiline
                textAlignVertical="top"
                maxLength={600}
              />
              <Text style={styles.reportCounter}>{reportDescription.trim().length}/600</Text>
            </ScrollView>

            <View style={styles.reportActions}>
              <TouchableOpacity
                style={styles.reportCancelButton}
                onPress={() => setReportModalVisible(false)}
                disabled={isReportSubmitting}
              >
                <Text style={styles.reportCancelText}>{t('common.cancel', { defaultValue: 'Cancel' })}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reportSubmitButton, isReportSubmitting && styles.reportSubmitButtonDisabled]}
                onPress={submitReport}
                disabled={isReportSubmitting}
              >
                {isReportSubmitting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons name="send" size={17} color={COLORS.white} />
                    <Text style={styles.reportSubmitText}>
                      {t('animalDetail.submitReport', { defaultValue: 'Submit' })}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  reportButton: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.errorSoft,
    zIndex: 2,
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
  reportBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.46)',
  },
  reportSheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
    backgroundColor: COLORS.surface,
  },
  reportTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  reportIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: COLORS.errorSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reportTitleTextWrap: {
    flex: 1,
  },
  reportTitle: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: '900',
  },
  reportSubtitle: {
    marginTop: 3,
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  reportCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  reportFormScroll: {
    maxHeight: 390,
  },
  reportFieldLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 10,
  },
  reportReasonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  reportReasonChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
  },
  reportReasonChipSelected: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.errorSoft,
  },
  reportReasonText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  reportReasonTextSelected: {
    color: COLORS.error,
  },
  reportInput: {
    minHeight: 112,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
    backgroundColor: COLORS.surfaceAlt,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  reportCounter: {
    alignSelf: 'flex-end',
    marginTop: 6,
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  reportActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  reportCancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reportCancelText: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontWeight: '900',
  },
  reportSubmitButton: {
    flex: 1.35,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: COLORS.error,
  },
  reportSubmitButtonDisabled: {
    opacity: 0.7,
  },
  reportSubmitText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '900',
  },
});

export default AnimalCard;
