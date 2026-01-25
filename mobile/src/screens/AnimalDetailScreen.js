import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { COLORS, formatPrice, formatDate, getAnimalTypeLabel } from '../utils/constants';
import { listingsService, callLogService } from '../services/api';
import { useWishlist } from '../context/WishlistContext';

const { width } = Dimensions.get('window');

const AnimalDetailScreen = ({ route, navigation }) => {
  const { animalType, id } = route.params;
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
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
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading listing...</Text>
      </SafeAreaView>
    );
  }

  if (error || !listing) {
    return (
      <SafeAreaView style={styles.errorContainer} edges={['top', 'bottom']}>
        <Text style={styles.errorIcon}>😔</Text>
        <Text style={styles.errorTitle}>Listing Not Found</Text>
        <Text style={styles.errorText}>{error || 'The listing you are looking for does not exist.'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const images = getImages();
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
              <Text style={styles.sectionHeaderText}>Photos ({images.length})</Text>
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
              <Text style={styles.sectionHeaderText}>Video</Text>
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
            <Text style={styles.noMediaText}>No Media Available</Text>
          </View>
        )}

        {/* Title & Price Card */}
        <View style={styles.card}>
          <Text style={styles.title}>{listing.breed_name || 'Unknown Breed'}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{formatPrice(listing.expected_price)}</Text>
            {listing.is_negotiable && (
              <View style={styles.negotiableBadge}>
                <Text style={styles.negotiableText}>Negotiable</Text>
              </View>
            )}
          </View>
          <View style={styles.dateRow}>
            <Ionicons name="time-outline" size={14} color={COLORS.gray} />
            <Text style={styles.dateText}>Posted on {formatDate(listing.created_at)}</Text>
          </View>
        </View>

        {/* Location Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="location-outline" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Location</Text>
          </View>
          <Text style={styles.cardText}>
            {[listing.city, listing.state, listing.pincode].filter(Boolean).join(', ') || 'Location not specified'}
          </Text>
        </View>

        {/* Animal Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text-outline" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Animal Details</Text>
          </View>
          <View style={styles.detailsGrid}>
            {listing.breed_name && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Breed</Text>
                <Text style={styles.detailValue}>{listing.breed_name}</Text>
              </View>
            )}
            {listing.age && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Age</Text>
                <Text style={styles.detailValue}>{listing.age}</Text>
              </View>
            )}
            {listing.milk_capacity && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Milk Capacity</Text>
                <Text style={styles.detailValue}>{listing.milk_capacity} L/day</Text>
              </View>
            )}
            {listing.pregnancy_status && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Pregnancy</Text>
                <Text style={styles.detailValue}>{listing.pregnancy_status.replace('_', ' ')}</Text>
              </View>
            )}
            {listing.health_condition && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Health</Text>
                <Text style={styles.detailValue}>{listing.health_condition}</Text>
              </View>
            )}
            {listing.gender && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Gender</Text>
                <Text style={styles.detailValue}>{listing.gender}</Text>
              </View>
            )}
            {listing.weight && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Weight</Text>
                <Text style={styles.detailValue}>{listing.weight} kg</Text>
              </View>
            )}
            {listing.color && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Color</Text>
                <Text style={styles.detailValue}>{listing.color}</Text>
              </View>
            )}
            {listing.purpose && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Purpose</Text>
                <Text style={styles.detailValue}>{listing.purpose}</Text>
              </View>
            )}
            {listing.delivery_available !== undefined && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Delivery</Text>
                <Text style={styles.detailValue}>
                  {listing.delivery_available ? 'Available' : 'Not Available'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Description Card */}
        {(listing.additional_notes || listing.description || listing.vaccination_details) && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Additional Information</Text>
            </View>
            {listing.description && (
              <View style={styles.infoSection}>
                <Text style={styles.infoLabel}>Description</Text>
                <Text style={styles.infoText}>{listing.description}</Text>
              </View>
            )}
            {listing.vaccination_details && (
              <View style={styles.infoSection}>
                <Text style={styles.infoLabel}>Vaccination Details</Text>
                <Text style={styles.infoText}>{listing.vaccination_details}</Text>
              </View>
            )}
            {listing.additional_notes && (
              <View style={styles.infoSection}>
                <Text style={styles.infoLabel}>Notes</Text>
                <Text style={styles.infoText}>{listing.additional_notes}</Text>
              </View>
            )}
          </View>
        )}

        {/* Seller Card */}
        {listing.seller && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="person-outline" size={20} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Seller Information</Text>
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
                <Text style={styles.sellerName}>{listing.seller.name || 'Unknown Seller'}</Text>
                {listing.seller.city && (
                  <Text style={styles.sellerLocation}>
                    {listing.seller.city}{listing.seller.state ? `, ${listing.seller.state}` : ''}
                  </Text>
                )}
                <Text style={styles.verifiedText}>Verified Seller</Text>
              </View>
            </View>
          </View>
        )}

        {/* Spacer for bottom bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Contact Bar with Safe Area */}
      <SafeAreaView edges={['bottom']} style={styles.bottomBarSafeArea}>
        <View style={styles.bottomBar}>
          <View style={styles.bottomPriceContainer}>
            <Text style={styles.bottomPriceLabel}>Listed Price</Text>
            <Text style={styles.bottomPrice}>₹{formatPrice(listing.expected_price)}</Text>
          </View>
          <View style={styles.bottomButtons}>
            <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
              <Ionicons name="call" size={20} color={COLORS.white} />
              <Text style={styles.btnText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsApp}>
              <Ionicons name="logo-whatsapp" size={20} color={COLORS.white} />
              <Text style={styles.btnText}>WhatsApp</Text>
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
  },
  galleryImage: {
    width: width,
    height: 300,
    resizeMode: 'cover',
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
