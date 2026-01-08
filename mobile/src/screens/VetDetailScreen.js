import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import { veterinarianService, vetReviewService, vetReportService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const REPORT_TYPES = [
  { value: 'fake_profile', label: 'Fake Profile' },
  { value: 'inappropriate_behavior', label: 'Inappropriate Behavior' },
  { value: 'unprofessional_conduct', label: 'Unprofessional Conduct' },
  { value: 'fraud', label: 'Fraud' },
  { value: 'wrong_information', label: 'Wrong Information' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'other', label: 'Other' },
];

const SERVICE_TYPES = [
  'General Checkup',
  'Vaccination',
  'Surgery',
  'Emergency Care',
  'Pregnancy Care',
  'Dental Care',
  'Other',
];

const VetDetailScreen = ({ route, navigation }) => {
  const { vetId } = route.params;
  const { isAuthenticated } = useAuth();

  const [vet, setVet] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [ratingDistribution, setRatingDistribution] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [myReview, setMyReview] = useState(null);

  // Modal states
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);

  // Review form
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewServiceType, setReviewServiceType] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Report form
  const [reportType, setReportType] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    fetchVetDetails();
    fetchReviews();
    if (isAuthenticated) {
      fetchMyReview();
    }
  }, [vetId]);

  const fetchVetDetails = async () => {
    try {
      const response = await veterinarianService.getById(vetId);
      if (response.success) {
        setVet(response.data);
      }
    } catch (error) {
      console.error('Error fetching vet details:', error);
      Alert.alert('Error', 'Failed to load veterinarian details');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    setReviewsLoading(true);
    try {
      const response = await vetReviewService.getVetReviews(vetId);
      if (response.success) {
        setReviews(response.data.reviews);
        setRatingDistribution(response.data.ratingDistribution);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchMyReview = async () => {
    try {
      const response = await vetReviewService.getMyReview(vetId);
      if (response.success && response.data) {
        setMyReview(response.data);
        setReviewRating(response.data.rating);
        setReviewText(response.data.review_text || '');
        setReviewServiceType(response.data.service_type || '');
      }
    } catch (error) {
      console.error('Error fetching my review:', error);
    }
  };

  const handleCall = () => {
    if (vet?.phone_number) {
      Linking.openURL(`tel:${vet.phone_number.replace('+', '')}`);
    }
  };

  const handleWhatsApp = () => {
    if (vet?.phone_number) {
      const phone = vet.phone_number.replace('+', '');
      const message = `Hi Dr. ${vet.full_name}! I would like to book an appointment.`;
      const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;
      Linking.openURL(url).catch(() => {
        Linking.openURL(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`);
      });
    }
  };

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to submit a review');
      return;
    }

    if (!reviewText.trim()) {
      Alert.alert('Error', 'Please write your review');
      return;
    }

    setSubmittingReview(true);
    try {
      const reviewData = {
        veterinarian_id: vetId,
        rating: reviewRating,
        review_text: reviewText,
        service_type: reviewServiceType,
      };

      let response;
      if (myReview) {
        response = await vetReviewService.updateReview(myReview.id, reviewData);
      } else {
        response = await vetReviewService.createReview(reviewData);
      }

      if (response.success) {
        Alert.alert('Success', myReview ? 'Review updated successfully' : 'Review submitted successfully');
        setReviewModalVisible(false);
        fetchReviews();
        fetchMyReview();
        fetchVetDetails();
      } else {
        Alert.alert('Error', response.message || 'Failed to submit review');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete your review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await vetReviewService.deleteReview(myReview.id);
              if (response.success) {
                Alert.alert('Success', 'Review deleted successfully');
                setMyReview(null);
                setReviewRating(5);
                setReviewText('');
                setReviewServiceType('');
                fetchReviews();
                fetchVetDetails();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete review');
            }
          },
        },
      ]
    );
  };

  const handleSubmitReport = async () => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to submit a report');
      return;
    }

    if (!reportType) {
      Alert.alert('Error', 'Please select a report type');
      return;
    }

    if (!reportDescription.trim()) {
      Alert.alert('Error', 'Please describe the issue');
      return;
    }

    setSubmittingReport(true);
    try {
      const response = await vetReportService.createReport({
        veterinarian_id: vetId,
        report_type: reportType,
        description: reportDescription,
      });

      if (response.success) {
        Alert.alert('Success', 'Report submitted successfully. Our team will review it shortly.');
        setReportModalVisible(false);
        setReportType('');
        setReportDescription('');
      } else {
        Alert.alert('Error', response.message || 'Failed to submit report');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to submit report');
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleMarkHelpful = async (reviewId) => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to mark reviews as helpful');
      return;
    }

    try {
      await vetReviewService.markHelpful(reviewId);
      fetchReviews();
    } catch (error) {
      console.error('Error marking helpful:', error);
    }
  };

  const renderStars = (rating, size = 16, onPress = null) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onPress && onPress(star)}
            disabled={!onPress}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={size}
              color={star <= rating ? '#FFD700' : COLORS.gray}
              style={{ marginRight: 2 }}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderReviewItem = ({ item }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewUser}>
          {item.user?.profile_photo ? (
            <Image source={{ uri: item.user.profile_photo }} style={styles.reviewAvatar} />
          ) : (
            <View style={[styles.reviewAvatar, styles.reviewAvatarPlaceholder]}>
              <Ionicons name="person" size={20} color={COLORS.gray} />
            </View>
          )}
          <View>
            <Text style={styles.reviewUserName}>{item.user?.fullname || 'User'}</Text>
            <Text style={styles.reviewDate}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
        {renderStars(item.rating, 14)}
      </View>

      {item.service_type && (
        <View style={styles.serviceTypeBadge}>
          <Text style={styles.serviceTypeText}>{item.service_type}</Text>
        </View>
      )}

      <Text style={styles.reviewText}>{item.review_text}</Text>

      {item.vet_response && (
        <View style={styles.vetResponse}>
          <Text style={styles.vetResponseLabel}>Veterinarian's Response:</Text>
          <Text style={styles.vetResponseText}>{item.vet_response}</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.helpfulBtn}
        onPress={() => handleMarkHelpful(item.id)}
      >
        <Ionicons name="thumbs-up-outline" size={16} color={COLORS.gray} />
        <Text style={styles.helpfulText}>
          Helpful ({item.helpful_count || 0})
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!vet) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Veterinarian not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalReviews = Object.values(ratingDistribution).reduce((a, b) => a + b, 0);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.reportButton} onPress={() => setReportModalVisible(true)}>
            <Ionicons name="flag-outline" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          {vet.profile_photo ? (
            <Image source={{ uri: vet.profile_photo }} style={styles.profileImage} />
          ) : (
            <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
              <Ionicons name="person" size={60} color={COLORS.gray} />
            </View>
          )}

          <Text style={styles.vetName}>Dr. {vet.full_name}</Text>
          <Text style={styles.vetSpecialization}>
            {vet.specialization?.replace('_', ' ').toUpperCase()}
          </Text>

          <View style={styles.ratingContainer}>
            {renderStars(Math.round(vet.rating || 0), 20)}
            <Text style={styles.ratingText}>
              {vet.rating?.toFixed(1) || '0.0'} ({vet.total_reviews || 0} reviews)
            </Text>
          </View>

          <View style={styles.quickInfo}>
            <View style={styles.quickInfoItem}>
              <Ionicons name="time-outline" size={18} color={COLORS.primary} />
              <Text style={styles.quickInfoText}>{vet.experience_years || 0}+ years</Text>
            </View>
            <View style={styles.quickInfoItem}>
              <Ionicons name="people-outline" size={18} color={COLORS.primary} />
              <Text style={styles.quickInfoText}>{vet.total_patients || 0} patients</Text>
            </View>
          </View>
        </View>

        {/* Contact Buttons */}
        <View style={styles.contactButtons}>
          <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
            <Ionicons name="call" size={20} color={COLORS.white} />
            <Text style={styles.contactBtnText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsApp}>
            <Ionicons name="logo-whatsapp" size={20} color={COLORS.white} />
            <Text style={styles.contactBtnText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>

        {/* Details Section */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>About</Text>

          <View style={styles.detailRow}>
            <Ionicons name="school-outline" size={20} color={COLORS.primary} />
            <Text style={styles.detailText}>{vet.qualification}</Text>
          </View>

          {vet.clinic_name && (
            <View style={styles.detailRow}>
              <Ionicons name="business-outline" size={20} color={COLORS.primary} />
              <Text style={styles.detailText}>{vet.clinic_name}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={20} color={COLORS.primary} />
            <Text style={styles.detailText}>
              {vet.clinic_address || `${vet.city}, ${vet.state} - ${vet.pincode}`}
            </Text>
          </View>

          {vet.consultation_fee && (
            <View style={styles.detailRow}>
              <Ionicons name="cash-outline" size={20} color={COLORS.primary} />
              <Text style={styles.detailText}>Consultation Fee: Rs {vet.consultation_fee}</Text>
            </View>
          )}

          {vet.emergency_available && (
            <View style={styles.emergencyBadge}>
              <Ionicons name="alert-circle" size={16} color={COLORS.white} />
              <Text style={styles.emergencyText}>Emergency Services Available</Text>
            </View>
          )}
        </View>

        {/* Services Section */}
        {vet.services && vet.services.length > 0 && (
          <View style={styles.servicesSection}>
            <Text style={styles.sectionTitle}>Services</Text>
            <View style={styles.servicesList}>
              {vet.services.map((service, index) => (
                <View key={index} style={styles.serviceTag}>
                  <Text style={styles.serviceTagText}>{service}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Reviews Section */}
        <View style={styles.reviewsSection}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            <TouchableOpacity
              style={styles.writeReviewBtn}
              onPress={() => setReviewModalVisible(true)}
            >
              <Ionicons name="create-outline" size={18} color={COLORS.primary} />
              <Text style={styles.writeReviewText}>
                {myReview ? 'Edit Review' : 'Write Review'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Rating Distribution */}
          <View style={styles.ratingDistribution}>
            <View style={styles.overallRating}>
              <Text style={styles.overallRatingNumber}>{vet.rating?.toFixed(1) || '0.0'}</Text>
              {renderStars(Math.round(vet.rating || 0), 18)}
              <Text style={styles.totalReviewsText}>{totalReviews} reviews</Text>
            </View>
            <View style={styles.ratingBars}>
              {[5, 4, 3, 2, 1].map((star) => (
                <View key={star} style={styles.ratingBarRow}>
                  <Text style={styles.ratingBarLabel}>{star}</Text>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <View style={styles.ratingBarContainer}>
                    <View
                      style={[
                        styles.ratingBar,
                        { width: `${totalReviews ? (ratingDistribution[star] / totalReviews) * 100 : 0}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.ratingBarCount}>{ratingDistribution[star]}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Reviews List */}
          {reviewsLoading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : reviews.length > 0 ? (
            reviews.map((review) => (
              <View key={review.id}>{renderReviewItem({ item: review })}</View>
            ))
          ) : (
            <Text style={styles.noReviewsText}>No reviews yet. Be the first to review!</Text>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Review Modal */}
      <Modal
        visible={reviewModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {myReview ? 'Edit Your Review' : 'Write a Review'}
              </Text>
              <TouchableOpacity onPress={() => setReviewModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.black} />
              </TouchableOpacity>
            </View>

            <Text style={styles.ratingLabel}>Your Rating</Text>
            {renderStars(reviewRating, 32, setReviewRating)}

            <Text style={styles.inputLabel}>Service Type (Optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.serviceTypeList}>
                {SERVICE_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.serviceTypeOption,
                      reviewServiceType === type && styles.serviceTypeOptionSelected,
                    ]}
                    onPress={() => setReviewServiceType(type)}
                  >
                    <Text
                      style={[
                        styles.serviceTypeOptionText,
                        reviewServiceType === type && styles.serviceTypeOptionTextSelected,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.inputLabel}>Your Review</Text>
            <TextInput
              style={styles.reviewInput}
              placeholder="Share your experience..."
              placeholderTextColor={COLORS.gray}
              multiline
              numberOfLines={4}
              value={reviewText}
              onChangeText={setReviewText}
            />

            <TouchableOpacity
              style={[styles.submitBtn, submittingReview && styles.submitBtnDisabled]}
              onPress={handleSubmitReview}
              disabled={submittingReview}
            >
              {submittingReview ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.submitBtnText}>
                  {myReview ? 'Update Review' : 'Submit Review'}
                </Text>
              )}
            </TouchableOpacity>

            {myReview && (
              <TouchableOpacity style={styles.deleteReviewBtn} onPress={handleDeleteReview}>
                <Ionicons name="trash-outline" size={18} color={COLORS.red} />
                <Text style={styles.deleteReviewText}>Delete Review</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Report Modal */}
      <Modal
        visible={reportModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Veterinarian</Text>
              <TouchableOpacity onPress={() => setReportModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.black} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Report Type</Text>
            <ScrollView style={styles.reportTypeList}>
              {REPORT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.reportTypeOption,
                    reportType === type.value && styles.reportTypeOptionSelected,
                  ]}
                  onPress={() => setReportType(type.value)}
                >
                  <Ionicons
                    name={reportType === type.value ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={reportType === type.value ? COLORS.red : COLORS.gray}
                  />
                  <Text style={styles.reportTypeText}>{type.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.reviewInput}
              placeholder="Describe the issue in detail..."
              placeholderTextColor={COLORS.gray}
              multiline
              numberOfLines={4}
              value={reportDescription}
              onChangeText={setReportDescription}
            />

            <TouchableOpacity
              style={[styles.reportSubmitBtn, submittingReport && styles.submitBtnDisabled]}
              onPress={handleSubmitReport}
              disabled={submittingReport}
            >
              {submittingReport ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.submitBtnText}>Submit Report</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.gray,
    marginBottom: 20,
  },
  backBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  header: {
    height: 120,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  reportButton: {
    padding: 8,
  },
  profileSection: {
    alignItems: 'center',
    marginTop: -50,
    paddingHorizontal: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: COLORS.white,
  },
  profileImagePlaceholder: {
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vetName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.black,
    marginTop: 12,
  },
  vetSpecialization: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  ratingText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.gray,
  },
  quickInfo: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 24,
  },
  quickInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickInfoText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  contactButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  whatsappBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  contactBtnText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  detailsSection: {
    backgroundColor: COLORS.white,
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.gray,
  },
  emergencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.red,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  emergencyText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 13,
  },
  servicesSection: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
  },
  servicesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceTag: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  serviceTagText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '500',
  },
  reviewsSection: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  writeReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  writeReviewText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  ratingDistribution: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  overallRating: {
    alignItems: 'center',
    paddingRight: 20,
    borderRightWidth: 1,
    borderRightColor: COLORS.lightGray,
  },
  overallRatingNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  totalReviewsText: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  ratingBars: {
    flex: 1,
    paddingLeft: 20,
    justifyContent: 'center',
  },
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingBarLabel: {
    width: 12,
    fontSize: 12,
    color: COLORS.gray,
    marginRight: 4,
  },
  ratingBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.lightGray,
    borderRadius: 3,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  ratingBar: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 3,
  },
  ratingBarCount: {
    width: 20,
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'right',
  },
  reviewCard: {
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  reviewAvatarPlaceholder: {
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
  },
  reviewDate: {
    fontSize: 12,
    color: COLORS.gray,
  },
  serviceTypeBadge: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  serviceTypeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '500',
  },
  reviewText: {
    fontSize: 14,
    color: COLORS.black,
    lineHeight: 20,
  },
  vetResponse: {
    backgroundColor: COLORS.primary + '10',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  vetResponseLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  vetResponseText: {
    fontSize: 13,
    color: COLORS.black,
  },
  helpfulBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  helpfulText: {
    fontSize: 13,
    color: COLORS.gray,
  },
  noReviewsText: {
    textAlign: 'center',
    color: COLORS.gray,
    fontSize: 14,
    paddingVertical: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    marginTop: 16,
    marginBottom: 8,
  },
  serviceTypeList: {
    flexDirection: 'row',
    gap: 8,
  },
  serviceTypeOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
  },
  serviceTypeOptionSelected: {
    backgroundColor: COLORS.primary,
  },
  serviceTypeOptionText: {
    fontSize: 13,
    color: COLORS.gray,
  },
  serviceTypeOptionTextSelected: {
    color: COLORS.white,
  },
  reviewInput: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: COLORS.black,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  deleteReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  deleteReviewText: {
    color: COLORS.red,
    fontSize: 14,
    fontWeight: '500',
  },
  reportTypeList: {
    maxHeight: 200,
  },
  reportTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  reportTypeOptionSelected: {
    backgroundColor: COLORS.red + '10',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  reportTypeText: {
    fontSize: 14,
    color: COLORS.black,
  },
  reportSubmitBtn: {
    backgroundColor: COLORS.red,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
});

export default VetDetailScreen;
