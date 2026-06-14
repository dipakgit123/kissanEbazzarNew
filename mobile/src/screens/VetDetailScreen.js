import React, { useMemo, useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../utils/constants';
import { veterinarianService, vetReviewService, vetReportService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const getReportTypes = (t) => [
  { value: 'fake_profile', label: t('vetDetail.reportTypes.fake_profile') },
  { value: 'inappropriate_behavior', label: t('vetDetail.reportTypes.inappropriate_behavior') },
  { value: 'unprofessional_conduct', label: t('vetDetail.reportTypes.unprofessional_conduct') },
  { value: 'fraud', label: t('vetDetail.reportTypes.fraud') },
  { value: 'wrong_information', label: t('vetDetail.reportTypes.wrong_information') },
  { value: 'harassment', label: t('vetDetail.reportTypes.harassment') },
  { value: 'other', label: t('vetDetail.reportTypes.other') },
];

const getServiceTypes = (t) => [
  { value: 'general_checkup', label: t('vetDetail.serviceTypeOptions.generalCheckup') },
  { value: 'vaccination', label: t('vetDetail.serviceTypeOptions.vaccination') },
  { value: 'surgery', label: t('vetDetail.serviceTypeOptions.surgery') },
  { value: 'emergency_care', label: t('vetDetail.serviceTypeOptions.emergencyCare') },
  { value: 'pregnancy_care', label: t('vetDetail.serviceTypeOptions.pregnancyCare') },
  { value: 'dental_care', label: t('vetDetail.serviceTypeOptions.dentalCare') },
  { value: 'other', label: t('vetDetail.serviceTypeOptions.other') },
];

const normalizeServices = (services) => {
  if (Array.isArray(services)) {
    return services.filter(Boolean);
  }

  if (typeof services === 'string') {
    return services
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'V';

const formatDistance = (distance, t) => {
  if (typeof distance !== 'number' || Number.isNaN(distance) || distance <= 0) {
    return null;
  }

  return `${distance.toFixed(distance < 10 ? 1 : 0)} ${t('veterinarian.kmAway')}`;
};

const VetDetailScreen = ({ route, navigation }) => {
  const { vetId, vetSummary } = route.params;
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();

  const [vet, setVet] = useState(vetSummary || null);
  const [reviews, setReviews] = useState([]);
  const [ratingDistribution, setRatingDistribution] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [loading, setLoading] = useState(!vetSummary);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [myReview, setMyReview] = useState(null);

  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewServiceType, setReviewServiceType] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const [reportType, setReportType] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    fetchVetDetails();
    fetchReviews();
    if (isAuthenticated) {
      fetchMyReview();
    }
  }, [vetId, isAuthenticated]);

  const serviceTypes = getServiceTypes(t);

  const getSpecializationLabel = (spec) => {
    const labels = {
      large_animal: t('veterinarian.specializations.largeAnimal'),
      small_animal: t('veterinarian.specializations.smallAnimal'),
      livestock: t('veterinarian.specializations.livestock'),
      surgery: t('veterinarian.specializations.surgery'),
      general: t('veterinarian.specializations.general'),
      emergency: t('veterinarian.specializations.emergency'),
      reproduction: t('veterinarian.specializations.reproduction'),
    };

    return labels[spec] || spec || t('veterinarian.title');
  };

  const translateServiceType = (value) => {
    if (!value) {
      return '';
    }

    const normalizedValue = value.toString().trim().toLowerCase().replace(/\s+/g, '_');
    const matchedType = serviceTypes.find((type) => type.value === normalizedValue);
    return matchedType?.label || value;
  };

  const fetchVetDetails = async () => {
    try {
      const response = await veterinarianService.getById(vetId);
      if (response.success) {
        setVet((previous) => ({
          ...(previous || {}),
          ...response.data,
          distance: response.data?.distance ?? previous?.distance,
        }));
      }
    } catch (error) {
      console.error('Error fetching vet details:', error);
      Alert.alert(t('common.error'), t('vetDetail.failedLoadVeterinarian'));
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
        setReviewServiceType(
          response.data.service_type
            ? response.data.service_type.toString().trim().toLowerCase().replace(/\s+/g, '_')
            : ''
        );
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
      const message = t('vetDetail.whatsappMessage', { name: vet.full_name });
      const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;
      Linking.openURL(url).catch(() => {
        Linking.openURL(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`);
      });
    }
  };

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      Alert.alert(t('vetDetail.loginRequired'), t('vetDetail.pleaseLoginReview'));
      return;
    }

    if (!reviewText.trim()) {
      Alert.alert(t('vetDetail.error'), t('vetDetail.pleaseWriteReview'));
      return;
    }

    setSubmittingReview(true);
    try {
      const reviewData = {
        veterinarian_id: vetId,
        rating: reviewRating,
        review_text: reviewText,
        service_type: reviewServiceType || null,
      };

      let response;
      if (myReview) {
        response = await vetReviewService.updateReview(myReview.id, reviewData);
      } else {
        response = await vetReviewService.createReview(reviewData);
      }

      if (response.success) {
        Alert.alert(
          t('vetDetail.success'),
          myReview ? t('vetDetail.reviewUpdated') : t('vetDetail.reviewSubmitted')
        );
        setReviewModalVisible(false);
        fetchReviews();
        fetchMyReview();
        fetchVetDetails();
      } else {
        Alert.alert(t('vetDetail.error'), response.message || t('vetDetail.failedSubmitReview'));
      }
    } catch (error) {
      Alert.alert(t('vetDetail.error'), error.message || t('vetDetail.failedSubmitReview'));
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    Alert.alert(
      t('vetDetail.deleteReviewConfirm'),
      t('vetDetail.deleteReviewMessage'),
      [
        { text: t('vetDetail.cancel'), style: 'cancel' },
        {
          text: t('vetDetail.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await vetReviewService.deleteReview(myReview.id);
              if (response.success) {
                Alert.alert(t('vetDetail.success'), t('vetDetail.reviewDeleted'));
                setMyReview(null);
                setReviewRating(5);
                setReviewText('');
                setReviewServiceType('');
                fetchReviews();
                fetchVetDetails();
              }
            } catch (error) {
              Alert.alert(t('vetDetail.error'), t('vetDetail.failedDeleteReview'));
            }
          },
        },
      ]
    );
  };

  const handleSubmitReport = async () => {
    if (!isAuthenticated) {
      Alert.alert(t('vetDetail.loginRequired'), t('vetDetail.pleaseLoginReport'));
      return;
    }

    if (!reportType) {
      Alert.alert(t('vetDetail.error'), t('vetDetail.pleaseSelectReportType'));
      return;
    }

    if (!reportDescription.trim()) {
      Alert.alert(t('vetDetail.error'), t('vetDetail.describeIssue'));
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
        Alert.alert(t('vetDetail.success'), t('vetDetail.reportSubmitted'));
        setReportModalVisible(false);
        setReportType('');
        setReportDescription('');
      } else {
        Alert.alert(t('vetDetail.error'), response.message || t('vetDetail.failedSubmitReport'));
      }
    } catch (error) {
      Alert.alert(t('vetDetail.error'), error.message || t('vetDetail.failedSubmitReport'));
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleMarkHelpful = async (reviewId) => {
    if (!isAuthenticated) {
      Alert.alert(t('vetDetail.loginRequired'), t('vetDetail.pleaseLoginHelpful'));
      return;
    }

    try {
      await vetReviewService.markHelpful(reviewId);
      fetchReviews();
    } catch (error) {
      console.error('Error marking helpful:', error);
    }
  };

  const renderStars = (rating, size = 16, onPress = null) => (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => onPress && onPress(star)}
          disabled={!onPress}
          activeOpacity={onPress ? 0.8 : 1}
        >
          <Ionicons
            name={star <= rating ? 'star' : 'star-outline'}
            size={size}
            color={star <= rating ? COLORS.warning : COLORS.borderStrong}
            style={styles.starIcon}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderReviewItem = ({ item }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewUser}>
          {item.user?.profile_photo ? (
            <Image source={{ uri: item.user.profile_photo }} style={styles.reviewAvatar} />
          ) : (
            <View style={[styles.reviewAvatar, styles.reviewAvatarPlaceholder]}>
              <Text style={styles.reviewAvatarInitial}>
                {getInitials(item.user?.fullname || t('vetDetail.unknownReviewer'))}
              </Text>
            </View>
          )}
          <View style={styles.reviewUserText}>
            <Text style={styles.reviewUserName}>
              {item.user?.fullname || t('vetDetail.unknownReviewer')}
            </Text>
            <Text style={styles.reviewDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
          </View>
        </View>
        {renderStars(item.rating, 13)}
      </View>

      {item.service_type ? (
        <View style={styles.serviceTypeBadge}>
          <Text style={styles.serviceTypeText}>{translateServiceType(item.service_type)}</Text>
        </View>
      ) : null}

      <Text style={styles.reviewText}>{item.review_text}</Text>

      {item.vet_response ? (
        <View style={styles.vetResponse}>
          <Text style={styles.vetResponseLabel}>{t('vetDetail.veterinarianResponse')}</Text>
          <Text style={styles.vetResponseText}>{item.vet_response}</Text>
        </View>
      ) : null}

      <TouchableOpacity style={styles.helpfulBtn} onPress={() => handleMarkHelpful(item.id)}>
        <Ionicons name="thumbs-up-outline" size={15} color={COLORS.textMuted} />
        <Text style={styles.helpfulText}>
          {t('vetDetail.helpful')} ({item.helpful_count || 0})
        </Text>
      </TouchableOpacity>
    </View>
  );

  const totalReviews = useMemo(
    () => Object.values(ratingDistribution).reduce((acc, value) => acc + value, 0),
    [ratingDistribution]
  );

  const services = useMemo(() => normalizeServices(vet?.services), [vet?.services]);
  const distanceLabel = formatDistance(vet?.distance, t);

  const clinicItems = useMemo(
    () =>
      [
        vet?.clinic_name
          ? {
              icon: 'business-outline',
              tone: 'primary',
              title: vet.clinic_name,
              subtitle: t('services.veterinarian') || 'Veterinarian',
            }
          : null,
        [vet?.city, vet?.state, vet?.pincode].filter(Boolean).join(', ')
          ? {
              icon: 'location-outline',
              tone: 'primary',
              title: [vet?.city, vet?.state, vet?.pincode].filter(Boolean).join(', '),
              subtitle: distanceLabel || vet?.clinic_address || '',
            }
          : null,
        vet?.available_hours
          ? {
              icon: 'time-outline',
              tone: 'primary',
              title: vet.available_hours,
              subtitle: t('veterinarian.available'),
            }
          : null,
        vet?.specialization
          ? {
              icon: 'medkit-outline',
              tone: 'accent',
              title: getSpecializationLabel(vet.specialization),
              subtitle: t('veterinarian.specialization'),
            }
          : null,
      ].filter(Boolean),
    [distanceLabel, t, vet]
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
        <Text style={styles.errorText}>{t('vetDetail.veterinarianNotFound')}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>{t('vetDetail.goBack')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 122 + insets.bottom }}
        >
          <View style={styles.heroSection}>
            <View style={styles.heroTopRow}>
              <TouchableOpacity style={styles.heroIconButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={22} color={COLORS.surface} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.heroIconButton}
                onPress={() => setReportModalVisible(true)}
              >
                <Ionicons name="flag-outline" size={20} color={COLORS.surface} />
              </TouchableOpacity>
            </View>

            <View style={styles.profileSection}>
              {vet.profile_photo ? (
                <Image source={{ uri: vet.profile_photo }} style={styles.profileImage} />
              ) : (
                <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
                  <Text style={styles.profileInitials}>{getInitials(vet.full_name)}</Text>
                </View>
              )}

              <View style={styles.verifiedDot}>
                <Ionicons name="checkmark" size={10} color={COLORS.surface} />
              </View>
            </View>

            <Text style={styles.vetName}>Dr. {vet.full_name}</Text>
            <Text style={styles.vetSpecialization}>
              {getSpecializationLabel(vet.specialization)} • {t('services.veterinarian') || 'Veterinarian'}
            </Text>

            <View style={styles.heroBadges}>
              <View style={[styles.heroBadge, styles.heroBadgeLight]}>
                <Ionicons name="checkmark" size={12} color={COLORS.surface} />
                <Text style={styles.heroBadgeText}>{t('animalCard.verifiedSeller')}</Text>
              </View>

              <View style={[styles.heroBadge, styles.heroBadgeLight]}>
                <View style={styles.heroBadgeDot} />
                <Text style={styles.heroBadgeText}>{t('veterinarian.available')}</Text>
              </View>

              <View style={[styles.heroBadge, styles.heroBadgeMuted]}>
                <Text style={styles.heroBadgeText}>
                  {vet.experience_years || 0}+ {t('vetDetail.years')}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statsStrip}>
            <View style={styles.statTile}>
              <Text style={styles.statValue}>{vet.rating ? Number(vet.rating).toFixed(1) : '0.0'}</Text>
              <Text style={styles.statLabel}>{t('veterinarian.rating')}</Text>
            </View>
            <View style={[styles.statTile, styles.statDivider]}>
              <Text style={styles.statValue}>{vet.total_reviews || totalReviews || 0}</Text>
              <Text style={styles.statLabel}>{t('veterinarian.reviews')}</Text>
            </View>
            <View style={styles.statTile}>
              <Text style={[styles.statValue, styles.feeValue]}>
                {vet.consultation_fee ? `\u20B9${vet.consultation_fee}` : '--'}
              </Text>
              <Text style={styles.statLabel}>{t('vetDetail.consultationFee')}</Text>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t('vetDetail.clinicInformation')}</Text>

            {clinicItems.length > 0 ? (
              clinicItems.map((item, index) => (
                <View key={`${item.title}-${index}`} style={styles.infoRow}>
                  <View
                    style={[
                      styles.infoIconWrap,
                      item.tone === 'accent' ? styles.infoIconAccent : styles.infoIconPrimary,
                    ]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={16}
                      color={item.tone === 'accent' ? COLORS.accent : COLORS.primary}
                    />
                  </View>

                  <View style={styles.infoTextWrap}>
                    <Text style={styles.infoTitle}>{item.title}</Text>
                    {item.subtitle ? <Text style={styles.infoSubtitle}>{item.subtitle}</Text> : null}
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptySectionText}>{t('veterinarian.noVetsFoundDesc')}</Text>
            )}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t('vetDetail.servicesOfferedTitle')}</Text>

            {services.length > 0 ? (
              <View style={styles.servicesList}>
                {services.map((service, index) => (
                  <View key={`${service}-${index}`} style={styles.serviceTag}>
                    <Ionicons name="checkmark" size={12} color={COLORS.primary} />
                    <Text style={styles.serviceTagText}>{translateServiceType(service)}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptySectionText}>{t('veterinarian.noVetsFoundDesc')}</Text>
            )}
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.reviewSectionHeader}>
              <Text style={styles.sectionTitle}>
                {t('vetDetail.reviews')} ({vet.total_reviews || totalReviews || 0})
              </Text>

              <TouchableOpacity
                style={styles.reviewAction}
                onPress={() => setReviewModalVisible(true)}
              >
                <Ionicons name="create-outline" size={16} color={COLORS.primary} />
                <Text style={styles.reviewActionText}>
                  {myReview ? t('vetDetail.editReview') : t('vetDetail.writeReview')}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.reviewSummaryCard}>
              <View style={styles.reviewSummaryLeft}>
                <Text style={styles.reviewSummaryValue}>
                  {vet.rating ? Number(vet.rating).toFixed(1) : '0.0'}
                </Text>
                {renderStars(Math.round(vet.rating || 0), 15)}
              </View>
              <Text style={styles.reviewSummaryCount}>
                {vet.total_reviews || totalReviews || 0} {t('vetDetail.totalReviews')}
              </Text>
            </View>

            {reviewsLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : reviews.length > 0 ? (
              reviews.map((review) => <View key={review.id}>{renderReviewItem({ item: review })}</View>)
            ) : (
              <Text style={styles.emptySectionText}>{t('vetDetail.noReviewsYet')}</Text>
            )}
          </View>
        </ScrollView>

        <View style={[styles.bottomActionBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
            <Ionicons name="call-outline" size={18} color={COLORS.surface} />
            <Text style={styles.actionBtnText}>{t('vetDetail.call')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleWhatsApp}>
            <Ionicons name="logo-whatsapp" size={18} color={COLORS.surface} />
            <Text style={styles.actionBtnText}>{t('vetDetail.whatsapp')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconActionBtn}
            onPress={() => setReportModalVisible(true)}
          >
            <Ionicons name="flag-outline" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <Modal
          visible={reviewModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setReviewModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {myReview ? t('vetDetail.editYourReview') : t('vetDetail.writeAReview')}
                </Text>
                <TouchableOpacity onPress={() => setReviewModalVisible(false)}>
                  <Ionicons name="close" size={24} color={COLORS.black} />
                </TouchableOpacity>
              </View>

              <Text style={styles.ratingLabel}>{t('vetDetail.yourRating')}</Text>
              {renderStars(reviewRating, 32, setReviewRating)}

              <Text style={styles.inputLabel}>{t('vetDetail.serviceType')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.serviceTypeList}>
                  {serviceTypes.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.serviceTypeOption,
                        reviewServiceType === type.value && styles.serviceTypeOptionSelected,
                      ]}
                      onPress={() => setReviewServiceType(type.value)}
                    >
                      <Text
                        style={[
                          styles.serviceTypeOptionText,
                          reviewServiceType === type.value && styles.serviceTypeOptionTextSelected,
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.inputLabel}>{t('vetDetail.yourReview')}</Text>
              <TextInput
                style={styles.reviewInput}
                placeholder={t('vetDetail.shareExperience')}
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
                    {myReview ? t('vetDetail.updateReview') : t('vetDetail.submitReview')}
                  </Text>
                )}
              </TouchableOpacity>

              {myReview ? (
                <TouchableOpacity style={styles.deleteReviewBtn} onPress={handleDeleteReview}>
                  <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                  <Text style={styles.deleteReviewText}>{t('vetDetail.deleteReview')}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </Modal>

        <Modal
          visible={reportModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setReportModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('vetDetail.reportVeterinarian')}</Text>
                <TouchableOpacity onPress={() => setReportModalVisible(false)}>
                  <Ionicons name="close" size={24} color={COLORS.black} />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>{t('vetDetail.reportType')}</Text>
              <ScrollView style={styles.reportTypeList}>
                {getReportTypes(t).map((type) => (
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
                      color={reportType === type.value ? COLORS.error : COLORS.gray}
                    />
                    <Text style={styles.reportTypeText}>{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>{t('vetDetail.description')}</Text>
              <TextInput
                style={styles.reviewInput}
                placeholder={t('vetDetail.describeIssue')}
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
                  <Text style={styles.submitBtnText}>{t('vetDetail.submitReport')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.background,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.textMuted,
    marginBottom: 20,
  },
  backBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  backBtnText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  heroSection: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 26,
    alignItems: 'center',
  },
  heroTopRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  heroIconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  profileSection: {
    position: 'relative',
  },
  profileImage: {
    width: 106,
    height: 106,
    borderRadius: 53,
    borderWidth: 3,
    borderColor: COLORS.surface,
  },
  profileImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primarySoft,
  },
  profileInitials: {
    fontSize: 42,
    fontWeight: '800',
    color: COLORS.primaryDeep,
  },
  verifiedDot: {
    position: 'absolute',
    right: 6,
    bottom: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  vetName: {
    marginTop: 14,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: COLORS.surface,
    textAlign: 'center',
  },
  vetSpecialization: {
    marginTop: 6,
    fontSize: 14,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
  },
  heroBadges: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  heroBadge: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroBadgeLight: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  heroBadgeMuted: {
    backgroundColor: 'rgba(15,110,86,0.55)',
  },
  heroBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.successSoft,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.surface,
  },
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statTile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  statDivider: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },
  feeValue: {
    color: COLORS.accent,
  },
  statLabel: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginTop: 14,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoIconPrimary: {
    backgroundColor: COLORS.primarySoft,
  },
  infoIconAccent: {
    backgroundColor: COLORS.accentSoft,
  },
  infoTextWrap: {
    flex: 1,
    paddingTop: 2,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  infoSubtitle: {
    marginTop: 3,
    fontSize: 12.5,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  servicesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  serviceTagText: {
    fontSize: 12,
    color: COLORS.primaryDark,
    fontWeight: '600',
  },
  reviewSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  reviewAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  reviewActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  reviewSummaryCard: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewSummaryValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  reviewSummaryCount: {
    fontSize: 12.5,
    color: COLORS.textMuted,
  },
  reviewCard: {
    backgroundColor: COLORS.surfaceAlt,
    padding: 14,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  reviewUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  reviewUserText: {
    flex: 1,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  reviewAvatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  reviewAvatarInitial: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.surface,
  },
  reviewUserName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  reviewDate: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    marginRight: 2,
  },
  serviceTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 8,
  },
  serviceTypeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  reviewText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 21,
  },
  vetResponse: {
    marginTop: 12,
    backgroundColor: COLORS.primarySoft,
    borderRadius: 12,
    padding: 12,
  },
  vetResponseLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginBottom: 4,
  },
  vetResponseText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },
  helpfulBtn: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  helpfulText: {
    fontSize: 12.5,
    color: COLORS.textMuted,
  },
  emptySectionText: {
    fontSize: 13.5,
    lineHeight: 19,
    color: COLORS.textMuted,
  },
  bottomActionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'rgba(245,244,239,0.98)',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    gap: 8,
  },
  callBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  primaryBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  iconActionBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '82%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  serviceTypeList: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  serviceTypeOption: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  serviceTypeOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  serviceTypeOptionText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  serviceTypeOptionTextSelected: {
    color: COLORS.surface,
    fontWeight: '700',
  },
  reviewInput: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 14,
    padding: 16,
    fontSize: 14,
    color: COLORS.text,
    textAlignVertical: 'top',
    minHeight: 108,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  deleteReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  deleteReviewText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '600',
  },
  reportTypeList: {
    maxHeight: 220,
  },
  reportTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  reportTypeOptionSelected: {
    backgroundColor: COLORS.errorSoft,
    marginHorizontal: -12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  reportTypeText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  reportSubmitBtn: {
    backgroundColor: COLORS.error,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
});

export default VetDetailScreen;

