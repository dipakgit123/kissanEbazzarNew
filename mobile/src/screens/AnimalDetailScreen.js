import React, { useState, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { COLORS, formatPrice, formatDate, getAnimalTypeLabel } from '../utils/constants';
import { listingsService } from '../services/api';

const { width } = Dimensions.get('window');

const AnimalDetailScreen = ({ route, navigation }) => {
  const { animalType, id } = route.params;
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    fetchListing();
  }, [animalType, id]);

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

  const handleCall = () => {
    if (listing?.seller?.phone) {
      Linking.openURL(`tel:${listing.seller.phone}`);
    } else {
      Alert.alert('Error', 'Seller phone number not available');
    }
  };

  const handleWhatsApp = () => {
    if (listing?.seller?.phone) {
      const message = `Hi! I'm interested in your ${animalType} listing: "${listing.breed_name}" - ₹${formatPrice(listing.expected_price)}`;
      const url = `whatsapp://send?phone=91${listing.seller.phone}&text=${encodeURIComponent(message)}`;
      Linking.openURL(url).catch(() => {
        Linking.openURL(`https://wa.me/91${listing.seller.phone}?text=${encodeURIComponent(message)}`);
      });
    } else {
      Alert.alert('Error', 'Seller phone number not available');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading listing...</Text>
      </View>
    );
  }

  if (error || !listing) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>😔</Text>
        <Text style={styles.errorTitle}>Listing Not Found</Text>
        <Text style={styles.errorText}>{error || 'The listing you are looking for does not exist.'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = getImages();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          {images.length > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / width);
                  setActiveImageIndex(index);
                }}
              >
                {images.map((img, index) => (
                  <Image
                    key={index}
                    source={{ uri: img.url }}
                    style={styles.mainImage}
                  />
                ))}
              </ScrollView>

              {/* Image Indicators */}
              {images.length > 1 && (
                <View style={styles.imageIndicators}>
                  {images.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.indicator,
                        activeImageIndex === index && styles.activeIndicator,
                      ]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="image-outline" size={64} color={COLORS.gray} />
              <Text style={styles.placeholderText}>No Image Available</Text>
            </View>
          )}

          {/* Back Button */}
          <TouchableOpacity
            style={styles.headerBackButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.black} />
          </TouchableOpacity>

          {/* Type Badge */}
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{getAnimalTypeLabel(animalType)}</Text>
          </View>
        </View>

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

      {/* Bottom Contact Bar */}
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
  imageContainer: {
    position: 'relative',
    height: 300,
    backgroundColor: COLORS.secondary,
  },
  mainImage: {
    width: width,
    height: 300,
    resizeMode: 'cover',
  },
  placeholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.gray,
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
  headerBackButton: {
    position: 'absolute',
    top: 48,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  typeBadge: {
    position: 'absolute',
    top: 48,
    right: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeBadgeText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 12,
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
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
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
