import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Linking,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { useTranslation } from 'react-i18next';
import { COLORS, formatPrice, formatDate, getAnimalTypeLabel } from '../utils/constants';
import { listingsService, callLogService, listingReportService } from '../services/api';
import { useWishlist } from '../context/WishlistContext';
import SkeletonLoader from '../components/SkeletonLoader';

const { width } = Dimensions.get('window');

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

const AnimalDetailScreen = ({ route, navigation }) => {
  const { animalType, id } = route.params;
  const { t } = useTranslation();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState('wrong_information');
  const [reportDescription, setReportDescription] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const videoRef = useRef(null);
  
  const { addToWishlist, removeFromWishlist, isInWishlist: checkIsInWishlist } = useWishlist();
  const isInWishlist = checkIsInWishlist(id);

  useEffect(() => {
    fetchListing();
  }, [animalType, id]);

  // Auto-slide timer for photos - must be before conditional returns
  useEffect(() => {
    if (!listing || loading || error) return;

    const images = getImages();
    if (images.length <= 1) return;

    const timer = setInterval(() => {
      setActiveImageIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        return nextIndex >= images.length ? 0 : nextIndex;
      });
    }, 2000); // 2 seconds

    return () => clearInterval(timer);
  }, [listing, loading, error]);

  const fetchListing = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listingsService.getListingById(animalType, id);
      if (response.success) {
        setListing(response.data);
      } else {
        setError('Listing not found');
      }
    } catch (err) {
      console.error('Error fetching listing:', err);
      setError(err.message || 'Failed to load listing');
    } finally {
      setLoading(false);
    }
  };

  const toggleWishlist = async () => {
    try {
      if (isInWishlist) {
        // Remove from wishlist
        await removeFromWishlist(id, animalType);
        Alert.alert('Removed', 'Removed from wishlist');
      } else {
        // Add to wishlist
        if (!listing) return;
        await addToWishlist({
          ...listing,
          id: listing.id,
          animal_type: animalType,
        });
        Alert.alert('Added', 'Added to wishlist');
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      Alert.alert('Error', 'Failed to update wishlist');
    }
  };

  const getImages = () => {
    if (!listing) return [];
    const images = [];
    if (listing.front_photo) images.push({ url: listing.front_photo, label: 'Front View' });
    if (listing.side_photo) images.push({ url: listing.side_photo, label: 'Side View' });
    if (listing.milk_scene_photo) images.push({ url: listing.milk_scene_photo, label: 'Milk Scene' });
    if (listing.full_body_photo) images.push({ url: listing.full_body_photo, label: 'Full Body' });
    if (listing.photo_1) images.push({ url: listing.photo_1, label: 'Photo 1' });
    if (listing.photo_2) images.push({ url: listing.photo_2, label: 'Photo 2' });
    if (listing.photo_3) images.push({ url: listing.photo_3, label: 'Photo 3' });
    if (listing.photo_4) images.push({ url: listing.photo_4, label: 'Photo 4' });
    if (listing.photo_5) images.push({ url: listing.photo_5, label: 'Photo 5' });
    return images;
  };

  const handleCall = async () => {
    if (listing?.seller?.phone) {
      try {
        // Log the call before making it
        await callLogService.logCall({
          receiverId: listing.seller.id || listing.user_id,
          receiverPhoneNumber: listing.seller.phone,
          callType: 'direct',
          listingId: id,
          listingType: animalType,
        });
        
        // Open phone dialer
        Linking.openURL(`tel:${listing.seller.phone}`);
      } catch (error) {
        console.error('Error logging call:', error);
        // Still make the call even if logging fails
        Linking.openURL(`tel:${listing.seller.phone}`);
      }
    } else {
      Alert.alert('Error', 'Seller phone number not available');
    }
  };

  const handleWhatsApp = async () => {
    if (listing?.seller?.phone) {
      try {
        // Log the call before making it
        await callLogService.logCall({
          receiverId: listing.seller.id || listing.user_id,
          receiverPhoneNumber: listing.seller.phone,
          callType: 'direct',
          listingId: id,
          listingType: animalType,
        });
        
        const message = `Hi! I'm interested in your ${animalType} listing: "${listing.breed_name}" - ₹${formatPrice(listing.expected_price)}`;
        // Remove duplicate 91 - phone already has country code
        const url = `whatsapp://send?phone=${listing.seller.phone}&text=${encodeURIComponent(message)}`;
        Linking.openURL(url).catch(() => {
          Linking.openURL(`https://wa.me/${listing.seller.phone}?text=${encodeURIComponent(message)}`);
        });
      } catch (error) {
        console.error('Error logging WhatsApp call:', error);
        // Still make the call even if logging fails
        const message = `Hi! I'm interested in your ${animalType} listing: "${listing.breed_name}" - ₹${formatPrice(listing.expected_price)}`;
        // Remove duplicate 91 - phone already has country code
        const url = `whatsapp://send?phone=${listing.seller.phone}&text=${encodeURIComponent(message)}`;
        Linking.openURL(url).catch(() => {
          Linking.openURL(`https://wa.me/${listing.seller.phone}?text=${encodeURIComponent(message)}`);
        });
      }
    } else {
      Alert.alert('Error', 'Seller phone number not available');
    }
  };

  const openReportModal = () => {
    setReportReason('wrong_information');
    setReportDescription('');
    setReportModalVisible(true);
  };

  const submitReport = async () => {
    const description = reportDescription.trim();

    if (description.length < 10) {
      Alert.alert(
        t('animalDetail.reportDescriptionRequired', { defaultValue: 'Add a little more detail' }),
        t('animalDetail.reportDescriptionRequiredDesc', { defaultValue: 'Please describe the issue in at least 10 characters.' })
      );
      return;
    }

    setReportSubmitting(true);
    try {
      const response = await listingReportService.createReport({
        listing_id: id,
        listing_type: animalType,
        report_type: reportReason,
        description,
      });

      setReportModalVisible(false);
      Alert.alert(
        t('animalDetail.reportSubmitted', { defaultValue: 'Report submitted' }),
        response?.message || t('animalDetail.reportSubmittedDesc', { defaultValue: 'Our team will review this listing shortly.' })
      );
    } catch (error) {
      Alert.alert(
        t('common.error', { defaultValue: 'Error' }),
        error?.message || t('animalDetail.reportFailed', { defaultValue: 'Failed to submit report. Please try again.' })
      );
    } finally {
      setReportSubmitting(false);
    }
  };

  const getListingGender = () => (
    listing?.gender ||
    listing?.goat_type ||
    listing?.goatType ||
    listing?.dog_type ||
    listing?.dogType ||
    listing?.cat_type ||
    listing?.catType ||
    ''
  );

  const formatGender = (value) => {
    if (!value) return '';

    const normalized = String(value).toLowerCase();
    if (normalized === 'male') return t('common.male', { defaultValue: 'Male' });
    if (normalized === 'female') return t('common.female', { defaultValue: 'Female' });

    return String(value).replace(/_/g, ' ');
  };

  const getPregnancyMonths = () => {
    const source = `${listing?.additional_notes || ''} ${listing?.description || ''}`;
    if (!source.trim()) return '';

    const labelMatch = source.match(/(?:months?|महीने|महिने)[^0-9]{0,24}(\d+(?:\.\d+)?)/i);
    if (labelMatch?.[1]) return labelMatch[1];

    const finalValueMatch = source.match(/;\s*[^0-9]*(\d+(?:\.\d+)?)\s*$/);
    return finalValueMatch?.[1] || '';
  };

  const formatPregnancyStatus = (value) => {
    const normalized = String(value || '').toLowerCase();
    if (normalized === 'pregnant') return t('common.yes', { defaultValue: 'Yes' });
    if (normalized === 'not_pregnant') return t('common.no', { defaultValue: 'No' });

    return String(value || '').replace(/_/g, ' ');
  };

  const handlePreviousImage = () => {
    setActiveImageIndex((prevIndex) => {
      const images = getImages();
      return prevIndex === 0 ? images.length - 1 : prevIndex - 1;
    });
  };

  const handleNextImage = () => {
    setActiveImageIndex((prevIndex) => {
      const images = getImages();
      return prevIndex >= images.length - 1 ? 0 : prevIndex + 1;
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'bottom']}>
        <SkeletonLoader variant="detail" />
      </SafeAreaView>
    );
  }

  if (error || !listing) {
    return (
      <SafeAreaView style={styles.errorContainer} edges={['top', 'bottom']}>
        <Text style={styles.errorIcon}>😔</Text>
        <Text style={styles.errorTitle}>{t('animalDetail.listingNotFound')}</Text>
        <Text style={styles.errorText}>{error || t('animalDetail.listingNotFoundDesc')}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>{t('animalDetail.goBack')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const images = getImages();
  const listingGender = getListingGender();
  const pregnancyMonths = getPregnancyMonths();
  const hasVideo = listing.video && listing.video.trim() !== '';

  return (
    <View style={styles.container}>
      {/* Fixed Header with Back Button - Outside ScrollView */}
      <SafeAreaView edges={['top']} style={styles.fixedHeader}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>

        <View style={styles.headerRight}>
          {/* Wishlist Button */}
          <TouchableOpacity
            style={styles.wishlistButton}
            onPress={toggleWishlist}
          >
            <Ionicons 
              name={isInWishlist ? "heart" : "heart-outline"} 
              size={24} 
              color={isInWishlist ? COLORS.red : COLORS.black} 
            />
          </TouchableOpacity>

          {/* Type Badge */}
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{getAnimalTypeLabel(animalType)}</Text>
          </View>

          <TouchableOpacity
            style={styles.reportHeaderButton}
            onPress={openReportModal}
            activeOpacity={0.86}
          >
            <Ionicons name="flag-outline" size={22} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Spacer for fixed header */}
        <View style={styles.headerSpacer} />

        {/* Photos Gallery Section - SHOWN FIRST */}
        {images.length > 0 && (
          <View style={styles.photosSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="images" size={20} color={COLORS.primary} />
              <Text style={styles.sectionHeaderText}>{t('animalDetail.photos')} ({images.length})</Text>
            </View>
            <View style={styles.imageGalleryContainer}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEnabled={false}
                ref={(ref) => {
                  if (ref && images.length > 0) {
                    ref.scrollTo({ x: activeImageIndex * width, animated: true });
                  }
                }}
              >
                {images.map((img, index) => (
                  <Image
                    key={`${img.url}-${index}`}
                    source={{ uri: img.url }}
                    style={styles.galleryImage}
                  />
                ))}
              </ScrollView>

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <TouchableOpacity
                    style={styles.arrowLeft}
                    onPress={handlePreviousImage}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chevron-back" size={30} color="#FFFFFF" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.arrowRight}
                    onPress={handleNextImage}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chevron-forward" size={30} color="#FFFFFF" />
                  </TouchableOpacity>
                </>
              )}

              {/* Image Indicators */}
              {images.length > 1 && (
                <View style={styles.imageIndicators}>
                  {images.map((img, index) => (
                    <View
                      key={`indicator-${img.url}-${index}`}
                      style={[
                        styles.indicator,
                        activeImageIndex === index && styles.activeIndicator,
                      ]}
                    />
                  ))}
                </View>
              )}

              {/* Image Label */}
              <View style={styles.imageLabel}>
                <Text style={styles.imageLabelText}>
                  {images[activeImageIndex]?.label || `Photo ${activeImageIndex + 1}`}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Video Section - SHOWN AFTER PHOTOS */}
        {hasVideo && (
          <View style={styles.videoSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="videocam" size={20} color={COLORS.primary} />
              <Text style={styles.sectionHeaderText}>{t('animalDetail.video')}</Text>
            </View>
            <View style={styles.videoContainer}>
              <Video
                ref={videoRef}
                source={{ uri: listing.video }}
                style={styles.videoPlayer}
                useNativeControls
                resizeMode="contain"
                isLooping
              />
            </View>
          </View>
        )}

        {/* No Media Available */}
        {!hasVideo && images.length === 0 && (
          <View style={styles.noMediaContainer}>
            <Ionicons name="image-outline" size={64} color={COLORS.gray} />
            <Text style={styles.noMediaText}>{t('animalDetail.noMediaAvailable')}</Text>
          </View>
        )}

        {/* Title & Price Card */}
        <View style={styles.card}>
          <Text style={styles.title}>{listing.breed_name || 'Unknown Breed'}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{formatPrice(listing.expected_price)}</Text>
            {listing.is_negotiable && (
              <View style={styles.negotiableBadge}>
                <Text style={styles.negotiableText}>{t('animalDetail.negotiable')}</Text>
              </View>
            )}
          </View>
          <View style={styles.dateRow}>
            <Ionicons name="time-outline" size={14} color={COLORS.gray} />
            <Text style={styles.dateText}>{t('animalDetail.postedOn')} {formatDate(listing.created_at)}</Text>
          </View>
        </View>

        {/* Location Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="location-outline" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>{t('animalDetail.location')}</Text>
          </View>
          <Text style={styles.cardText}>
            {[listing.city, listing.state, listing.pincode].filter(Boolean).join(', ') || t('animalDetail.locationNotSpecified')}
          </Text>
        </View>

        {/* Animal Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text-outline" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>{t('animalDetail.animalDetails')}</Text>
          </View>
          <View style={styles.detailsGrid}>
            {listing.breed_name && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{t('animalDetail.breed')}</Text>
                <Text style={styles.detailValue}>{listing.breed_name}</Text>
              </View>
            )}
            {listingGender ? (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{t('animalDetail.gender')}</Text>
                <Text style={styles.detailValue}>{formatGender(listingGender)}</Text>
              </View>
            ) : null}
            {(listing.pregnancy_status || pregnancyMonths) && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{t('animalDetail.pregnancy')}</Text>
                <Text style={styles.detailValue}>
                  {formatPregnancyStatus(listing.pregnancy_status || 'pregnant')}
                </Text>
              </View>
            )}
            {pregnancyMonths ? (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{t('pregnancy.months', { defaultValue: 'How many months?' })}</Text>
                <Text style={styles.detailValue}>{pregnancyMonths}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Seller Card */}
        {listing.seller && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="person-outline" size={20} color={COLORS.primary} />
              <Text style={styles.cardTitle}>{t('animalDetail.sellerInformation')}</Text>
            </View>
            <View style={styles.sellerRow}>
              {listing.seller.profile_photo ? (
                <Image
                  source={{ uri: listing.seller.profile_photo }}
                  style={styles.sellerAvatar}
                />
              ) : (
                <View style={styles.sellerAvatarPlaceholder}>
                  <Text style={styles.sellerAvatarText}>
                    {listing.seller.name?.charAt(0) || 'S'}
                  </Text>
                </View>
              )}
              <View style={styles.sellerInfo}>
                <Text style={styles.sellerName}>{listing.seller.name || t('animalDetail.unknownSeller')}</Text>
                {listing.seller.city && (
                  <Text style={styles.sellerLocation}>
                    {listing.seller.city}{listing.seller.state ? `, ${listing.seller.state}` : ''}
                  </Text>
                )}
                <Text style={styles.verifiedText}>{t('animalDetail.verifiedSeller')}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Spacer for bottom bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal
        visible={reportModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={styles.reportBackdrop}>
          <View style={styles.reportSheet}>
            <View style={styles.reportSheetHandle} />
            <View style={styles.reportTitleRow}>
              <View style={styles.reportIconWrap}>
                <Ionicons name="flag-outline" size={24} color={COLORS.error} />
              </View>
              <View style={styles.reportTitleTextWrap}>
                <Text style={styles.reportTitle}>
                  {t('animalDetail.reportListing', { defaultValue: 'Report this listing' })}
                </Text>
                <Text style={styles.reportSubtitle}>
                  {t('animalDetail.reportListingDesc', { defaultValue: 'Tell us what looks wrong. Reports are reviewed by our team.' })}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.reportCloseButton}
                onPress={() => setReportModalVisible(false)}
              >
                <Ionicons name="close" size={22} color={COLORS.textMuted || COLORS.gray} />
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
                placeholder={t('animalDetail.reportDetailsPlaceholder', { defaultValue: 'Example: seller shared wrong age, fake photo, already sold, or suspicious price...' })}
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
                disabled={reportSubmitting}
              >
                <Text style={styles.reportCancelText}>
                  {t('common.cancel', { defaultValue: 'Cancel' })}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reportSubmitButton, reportSubmitting && styles.reportSubmitButtonDisabled]}
                onPress={submitReport}
                disabled={reportSubmitting}
              >
                {reportSubmitting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons name="send" size={18} color={COLORS.white} />
                    <Text style={styles.reportSubmitText}>
                      {t('animalDetail.submitReport', { defaultValue: 'Submit report' })}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Contact Bar with Safe Area */}
      <SafeAreaView edges={['bottom']} style={styles.bottomBarSafeArea}>
        <View style={styles.bottomBar}>
          <View style={styles.bottomPriceContainer}>
            <Text style={styles.bottomPriceLabel}>{t('animalDetail.listedPrice')}</Text>
            <Text style={styles.bottomPrice}>₹{formatPrice(listing.expected_price)}</Text>
          </View>
          <View style={styles.bottomButtons}>
            <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
              <Ionicons name="call" size={20} color={COLORS.white} />
              <Text style={styles.btnText}>{t('animalCard.call')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsApp}>
              <Ionicons name="logo-whatsapp" size={20} color={COLORS.white} />
              <Text style={styles.btnText}>{t('animalCard.whatsapp')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.background,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  wishlistButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  headerSpacer: {
    height: 80,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  typeBadge: {
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
  typeBadgeText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 12,
  },
  reportHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  reportBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.46)',
  },
  reportSheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
    backgroundColor: COLORS.white,
  },
  reportSheetHandle: {
    width: 48,
    height: 5,
    borderRadius: 999,
    backgroundColor: COLORS.border || '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 18,
  },
  reportTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  reportIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: COLORS.errorSoft || '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reportTitleTextWrap: {
    flex: 1,
  },
  reportTitle: {
    color: COLORS.black,
    fontSize: 20,
    fontWeight: '900',
  },
  reportSubtitle: {
    marginTop: 4,
    color: COLORS.gray,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  reportCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceAlt || '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  reportFieldLabel: {
    color: COLORS.black,
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 10,
  },
  reportFormScroll: {
    maxHeight: 390,
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
    borderColor: COLORS.border || '#E5E7EB',
    backgroundColor: COLORS.surfaceAlt || '#F9FAFB',
  },
  reportReasonChipSelected: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.errorSoft || '#FEE2E2',
  },
  reportReasonText: {
    color: COLORS.gray,
    fontSize: 12,
    fontWeight: '800',
  },
  reportReasonTextSelected: {
    color: COLORS.error,
  },
  reportInput: {
    minHeight: 118,
    borderWidth: 1,
    borderColor: COLORS.border || '#E5E7EB',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.black,
    backgroundColor: COLORS.surfaceAlt || '#F9FAFB',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  reportCounter: {
    alignSelf: 'flex-end',
    marginTop: 6,
    color: COLORS.gray,
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
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceAlt || '#F9FAFB',
    borderWidth: 1,
    borderColor: COLORS.border || '#E5E7EB',
  },
  reportCancelText: {
    color: COLORS.gray,
    fontSize: 15,
    fontWeight: '900',
  },
  reportSubmitButton: {
    flex: 1.4,
    height: 52,
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
  photosSection: {
    backgroundColor: COLORS.white,
    paddingBottom: 16,
  },
  videoSection: {
    marginTop: 16,
    backgroundColor: COLORS.white,
    paddingBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 0,
    overflow: 'hidden',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  arrowLeft: {
    position: 'absolute',
    left: 16,
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  arrowRight: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  imageGalleryContainer: {
    position: 'relative',
    backgroundColor: '#F0F8F4',
  },
  galleryImage: {
    width: width,
    height: 300,
    resizeMode: 'contain',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    flexDirection: 'row',
    alignSelf: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white + '80',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: COLORS.white,
    width: 24,
  },
  imageLabel: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  imageLabelText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  noMediaContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    marginTop: 0,
  },
  noMediaText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.gray,
  },
  card: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  negotiableBadge: {
    marginLeft: 10,
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  negotiableText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '500',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    marginLeft: 6,
    fontSize: 14,
    color: COLORS.gray,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginLeft: 8,
  },
  cardText: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  detailItem: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    textTransform: 'capitalize',
  },
  infoSection: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.black,
    lineHeight: 20,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  sellerAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sellerAvatarText: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: 'bold',
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
  },
  sellerLocation: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 2,
  },
  verifiedText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
    marginTop: 4,
  },
  bottomBarSafeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
  },
  bottomBar: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  bottomPriceContainer: {
    flex: 1,
  },
  bottomPriceLabel: {
    fontSize: 12,
    color: COLORS.gray,
  },
  bottomPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  bottomButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.blue,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  btnText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
});

export default AnimalDetailScreen;
