import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Linking,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import { COLORS } from '../utils/constants';
import { veterinarianService } from '../services/api';
import CowLoader from '../components/CowLoader';
import FeatureHelpModal from '../components/FeatureHelpModal';
import { getLocalizedFeatureHelp } from '../constants/featureHelp';

const NEARBY_RADIUS_OPTIONS = [25, 50, 100];

const normalizeDistance = (distance) => {
  const numericDistance = Number(distance);
  return Number.isFinite(numericDistance) ? numericDistance : null;
};

const formatDistanceLabel = (distance, t) => {
  const numericDistance = normalizeDistance(distance);

  if (!numericDistance || numericDistance <= 0) {
    return '';
  }

  return `${numericDistance.toFixed(numericDistance < 10 ? 1 : 0)} ${t('veterinarian.kmAway')}`;
};

const normalizeServices = (services) => {
  if (Array.isArray(services)) {
    return services.map((service) => toDisplayText(service)).filter(Boolean);
  }

  if (typeof services === 'string') {
    return services
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const toDisplayText = (value, fallback = '') => {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === 'string') {
    return value.trim() || fallback;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    const joined = value.map((item) => toDisplayText(item)).filter(Boolean).join(', ');
    return joined || fallback;
  }

  if (typeof value === 'object') {
    const textKeys = ['label', 'name', 'title', 'value', 'text', 'service_type'];
    const match = textKeys.map((key) => toDisplayText(value[key])).find(Boolean);
    return match || fallback;
  }

  return fallback;
};

const getInitials = (name = '') =>
  toDisplayText(name)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'V';

const VeterinarianScreen = ({ navigation }) => {
  const { t, i18n, ready } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [allVeterinarians, setAllVeterinarians] = useState([]);
  const [nearbyVeterinarians, setNearbyVeterinarians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyOnly, setNearbyOnly] = useState(true);
  const [nearbyRadius, setNearbyRadius] = useState(25);
  const [helpVisible, setHelpVisible] = useState(false);
  const veterinarianHelp = getLocalizedFeatureHelp('veterinarian', i18n.resolvedLanguage || i18n.language);

  useEffect(() => {
    if (!ready) {
      return;
    }

    initializeVeterinarians();
  }, [ready]);

  const initializeVeterinarians = async () => {
    setLoading(true);

    let resolvedLocation = null;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        resolvedLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setUserLocation(resolvedLocation);
      } else {
        setNearbyOnly(false);
      }
    } catch (error) {
      console.log('Error getting location:', error?.message || error);
      setNearbyOnly(false);
    }

    await loadVeterinarians(resolvedLocation, nearbyRadius);
  };

  const loadVeterinarians = async (location = userLocation, radius = nearbyRadius) => {
    try {
      const allPromise = veterinarianService.getAll(1, 50);
      const nearbyPromise = location
        ? veterinarianService.getNearby(location.latitude, location.longitude, radius)
        : null;

      const [allResult, nearbyResult] = await Promise.allSettled([
        allPromise,
        nearbyPromise,
      ]);

      if (allResult.status === 'fulfilled' && allResult.value?.success) {
        setAllVeterinarians(allResult.value.data?.veterinarians || allResult.value.data || []);
      } else {
        setAllVeterinarians([]);
      }

      if (nearbyResult?.status === 'fulfilled' && nearbyResult.value?.success) {
        const nearbyData = Array.isArray(nearbyResult.value.data) ? nearbyResult.value.data : [];
        const normalizedNearby = nearbyData
          .map((vet) => ({
            ...vet,
            distance: normalizeDistance(vet.distance),
          }))
          .filter((vet) => vet.distance !== null && vet.distance <= radius)
          .sort((a, b) => a.distance - b.distance);

        setNearbyVeterinarians(normalizedNearby);
      } else {
        setNearbyVeterinarians([]);
      }
    } catch (error) {
      console.error('Error fetching vets:', error);
      setAllVeterinarians([]);
      setNearbyVeterinarians([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVeterinarians(userLocation, nearbyRadius);
  };

  const handleRadiusChange = async (radius) => {
    setNearbyRadius(radius);
    setNearbyOnly(true);

    if (!userLocation) {
      return;
    }

    setRefreshing(true);
    await loadVeterinarians(userLocation, radius);
  };

  const getSpecializationLabel = (spec) => {
    const specialization = toDisplayText(spec);
    const labels = {
      large_animal: t('veterinarian.specializations.largeAnimal'),
      small_animal: t('veterinarian.specializations.smallAnimal'),
      livestock: t('veterinarian.specializations.livestock'),
      surgery: t('veterinarian.specializations.surgery'),
      general: t('veterinarian.specializations.general'),
      emergency: t('veterinarian.specializations.emergency'),
      reproduction: t('veterinarian.specializations.reproduction'),
    };

    return labels[specialization] || specialization || t('veterinarian.title');
  };

  const translateService = (service) => {
    const serviceText = toDisplayText(service);

    if (!serviceText) {
      return '';
    }

    const normalized = serviceText.toLowerCase().replace(/\s+/g, '_');
    const labels = {
      emergency_care: t('veterinarian.serviceNames.emergencyCare'),
      general_checkup: t('veterinarian.serviceNames.generalCheckup'),
      vaccination: t('veterinarian.serviceNames.vaccination'),
      surgery: t('veterinarian.serviceNames.surgery'),
      dental_care: t('veterinarian.serviceNames.dentalCare'),
      pregnancy_care: t('veterinarian.serviceNames.pregnancyCare'),
      dairy: t('veterinarian.specializations.largeAnimal'),
      cattle: t('animalTypes.cow'),
      checkup: t('veterinarian.serviceNames.generalCheckup'),
    };

    return labels[normalized] || serviceText;
  };

  const displayedVeterinarians = useMemo(() => {
    if (nearbyOnly) {
      return nearbyVeterinarians;
    }

    return allVeterinarians;
  }, [allVeterinarians, nearbyOnly, nearbyVeterinarians]);

  const filteredVets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return displayedVeterinarians.filter((vet) => {
      return (
        !query ||
        toDisplayText(vet.full_name).toLowerCase().includes(query) ||
        toDisplayText(vet.specialization).toLowerCase().includes(query) ||
        toDisplayText(vet.city).toLowerCase().includes(query) ||
        toDisplayText(vet.state).toLowerCase().includes(query) ||
        toDisplayText(vet.clinic_name).toLowerCase().includes(query)
      );
    });
  }, [displayedVeterinarians, searchQuery]);

  const handleCall = (phone) => {
    const phoneNumber = toDisplayText(phone);

    if (!phoneNumber) {
      return;
    }

    Linking.openURL(`tel:${phoneNumber.replace('+', '')}`);
  };

  const handleWhatsApp = (phone, name) => {
    const phoneNumberRaw = toDisplayText(phone);

    if (!phoneNumberRaw) {
      return;
    }

    const phoneNumber = phoneNumberRaw.replace('+', '');
    const message = `Hi Dr. ${toDisplayText(name, t('veterinarian.title'))}! I would like consultation for my animal.`;
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;

    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`);
    });
  };

  const handleVetPress = (vet) => {
    navigation.navigate('VetDetail', {
      vetId: vet.id,
      vetSummary: vet,
    });
  };

  const renderStars = (rating) => (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= Math.round(rating || 0) ? 'star' : 'star-outline'}
          size={12}
          color={star <= Math.round(rating || 0) ? COLORS.warning : COLORS.borderStrong}
          style={styles.starIcon}
        />
      ))}
    </View>
  );

  if (!ready) {
    return (
      <View style={[styles.loadingScreen, styles.centered]}>
        <CowLoader message="" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        <View style={styles.headerBlock}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerTitleWrap}>
              <TouchableOpacity
                style={styles.headerBackButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.85}
              >
                <Ionicons name="arrow-back" size={18} color={COLORS.text} />
              </TouchableOpacity>

              <View style={styles.headerIconBubble}>
                <Ionicons name="medkit-outline" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.title}>{t('veterinarian.title')}</Text>
            </View>

            <TouchableOpacity
              style={styles.headerHelpButton}
              onPress={() => setHelpVisible(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="help-circle-outline" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchRow}>
            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder={t('veterinarian.searchPlaceholder')}
                placeholderTextColor={COLORS.borderStrong}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh} activeOpacity={0.85}>
              <Ionicons name="refresh-outline" size={18} color={COLORS.surface} />
            </TouchableOpacity>
          </View>

          <View style={styles.topFilterRow}>
            <TouchableOpacity
              style={[
                styles.topFilterPill,
                !nearbyOnly && styles.topFilterPillActive,
              ]}
              activeOpacity={0.85}
              onPress={() => setNearbyOnly(false)}
            >
              <Ionicons
                name="grid-outline"
                size={14}
                color={!nearbyOnly ? COLORS.surface : COLORS.textMuted}
              />
              <Text
                style={[
                  styles.topFilterText,
                  !nearbyOnly && styles.topFilterTextActive,
                ]}
              >
                {t('veterinarian.allVets')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.topFilterPill,
                nearbyOnly && styles.topFilterPillActive,
                !userLocation && nearbyVeterinarians.length === 0 && styles.topFilterPillDisabled,
              ]}
              activeOpacity={0.85}
              disabled={!userLocation && nearbyVeterinarians.length === 0}
              onPress={() => setNearbyOnly(true)}
            >
              <Ionicons
                name="location"
                size={14}
                color={nearbyOnly ? COLORS.surface : COLORS.accent}
              />
              <Text
                style={[
                  styles.topFilterText,
                  nearbyOnly && styles.topFilterTextActive,
                  !userLocation && nearbyVeterinarians.length === 0 && styles.topFilterTextDisabled,
                ]}
              >
                {t('veterinarian.nearbyVets')}
              </Text>
            </TouchableOpacity>
          </View>

          {nearbyOnly && userLocation ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.radiusRow}
            >
              {NEARBY_RADIUS_OPTIONS.map((radius) => {
                const isActive = nearbyRadius === radius;

                return (
                  <TouchableOpacity
                    key={radius}
                    style={[
                      styles.radiusChip,
                      isActive && styles.radiusChipActive,
                    ]}
                    onPress={() => handleRadiusChange(radius)}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name="navigate-outline"
                      size={13}
                      color={isActive ? COLORS.surface : COLORS.primary}
                    />
                    <Text
                      style={[
                        styles.radiusChipText,
                        isActive && styles.radiusChipTextActive,
                      ]}
                    >
                      {radius} km
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : null}
        </View>

        <View style={styles.listSection}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <CowLoader message={t('veterinarian.findingVets')} size="medium" />
            </View>
          ) : filteredVets.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="medkit-outline" size={34} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyText}>{t('veterinarian.noVetsFoundTitle')}</Text>
              <Text style={styles.emptySubtext}>{t('veterinarian.noVetsFoundSubtext')}</Text>
            </View>
          ) : (
            filteredVets.map((vet) => {
              const services = normalizeServices(vet.services).slice(0, 4);
              const vetName = toDisplayText(vet.full_name, t('veterinarian.title'));
              const clinicName = toDisplayText(vet.clinic_name);
              const experienceYears = toDisplayText(vet.experience_years, '0');
              const consultationFee = toDisplayText(vet.consultation_fee);
              const totalReviews = toDisplayText(vet.total_reviews, '0');
              const locationLabel = [toDisplayText(vet.city), toDisplayText(vet.state)]
                .filter(Boolean)
                .join(', ');
              const distanceLabel = formatDistanceLabel(vet.distance, t);

              return (
                <TouchableOpacity
                  key={vet.id}
                  style={styles.vetCard}
                  onPress={() => handleVetPress(vet)}
                  activeOpacity={0.92}
                >
                  <View style={styles.cardHeader}>
                    {vet.profile_photo ? (
                      <Image source={{ uri: vet.profile_photo }} style={styles.vetImage} />
                    ) : (
                      <View style={[styles.vetImage, styles.vetImagePlaceholder]}>
                        <Text style={styles.vetInitials}>{getInitials(vetName)}</Text>
                      </View>
                    )}

                    <View style={styles.vetInfo}>
                      <Text style={styles.vetName} numberOfLines={2}>
                        Dr. {vetName}
                      </Text>
                      <Text style={styles.vetSpec}>{getSpecializationLabel(vet.specialization)}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.profileChip}
                      activeOpacity={0.85}
                      onPress={(event) => {
                        event.stopPropagation();
                        handleVetPress(vet);
                      }}
                    >
                      <Text style={styles.profileChipText}>{t('veterinarian.viewProfile')}</Text>
                      <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.badgesRow}>
                    <View style={[styles.statusBadge, styles.availableBadge]}>
                      <View style={styles.statusDot} />
                      <Text style={styles.statusBadgeText}>{t('veterinarian.available')}</Text>
                    </View>

                    <View style={[styles.statusBadge, styles.verifiedBadge]}>
                      <Ionicons name="checkmark" size={12} color={COLORS.primaryDark} />
                      <Text style={[styles.statusBadgeText, styles.verifiedBadgeText]}>
                        {t('animalCard.verifiedSeller')}
                      </Text>
                    </View>

                    {vet.emergency_available ? (
                      <View style={[styles.statusBadge, styles.emergencyBadge]}>
                        <Text style={[styles.statusBadgeText, styles.emergencyBadgeText]}>
                          {t('veterinarian.emergencyAvailable')}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.metaDivider} />

                  <View style={styles.metaGrid}>
                    <View style={styles.metaCell}>
                      <Ionicons name="location-outline" size={14} color={COLORS.primary} />
                      <Text style={styles.metaText} numberOfLines={1}>
                        {distanceLabel ? `${locationLabel} - ${distanceLabel}` : locationLabel}
                      </Text>
                    </View>

                    <View style={styles.metaCell}>
                      <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
                      <Text style={styles.metaText}>
                        {experienceYears}+ {t('veterinarian.experience')}
                      </Text>
                    </View>

                    <View style={styles.metaCell}>
                      <Ionicons name="cash-outline" size={14} color={COLORS.accent} />
                      <Text style={styles.metaText}>
                        {consultationFee
                          ? `\u20B9${consultationFee} ${t('veterinarian.consultationFee')}`
                          : t('veterinarian.consultationFee')}
                      </Text>
                    </View>

                    <View style={styles.metaCell}>
                      <Ionicons name="business-outline" size={14} color={COLORS.textMuted} />
                      <Text style={styles.metaText} numberOfLines={1}>
                        {clinicName || getSpecializationLabel(vet.specialization)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.ratingRow}>
                    {renderStars(vet.rating)}
                    <Text style={styles.ratingText}>
                      {vet.rating ? Number(vet.rating).toFixed(1) : '0.0'} ({totalReviews}{' '}
                      {t('veterinarian.reviews')})
                    </Text>
                  </View>

                  {services.length > 0 ? (
                    <View style={styles.tagsRow}>
                      {services.map((service, index) => (
                        <View key={`${vet.id}-service-${index}`} style={styles.serviceTag}>
                          <Text style={styles.serviceTagText}>{translateService(service)}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  <View style={styles.vetActions}>
                    <TouchableOpacity
                      style={styles.callBtn}
                      onPress={(event) => {
                        event.stopPropagation();
                        handleCall(vet.phone_number);
                      }}
                    >
                      <Ionicons name="call-outline" size={17} color={COLORS.surface} />
                      <Text style={styles.callBtnText}>{t('veterinarian.call')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.primaryBtn}
                      onPress={(event) => {
                        event.stopPropagation();
                        handleWhatsApp(vet.phone_number, vetName);
                      }}
                    >
                      <Ionicons name="logo-whatsapp" size={17} color={COLORS.surface} />
                      <Text style={styles.primaryBtnText}>{t('animalCard.whatsapp')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.iconActionBtn}
                      onPress={(event) => {
                        event.stopPropagation();
                        handleVetPress(vet);
                      }}
                    >
                      <Ionicons name="arrow-forward" size={18} color={COLORS.surface} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
      <FeatureHelpModal
        visible={helpVisible}
        onClose={() => setHelpVisible(false)}
        title={veterinarianHelp?.localized?.title || t('veterinarian.title')}
        imageSource={veterinarianHelp?.image}
        helpContent={veterinarianHelp?.localized}
        t={t}
      />
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
  contentContainer: {
    paddingBottom: 112,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerBlock: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: COLORS.background,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerBackButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerHelpButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  headerIconBubble: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.text,
  },
  refreshButton: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  topFilterRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  topFilterPill: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  topFilterPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  topFilterPillDisabled: {
    backgroundColor: COLORS.surfaceAlt,
    borderColor: COLORS.border,
  },
  topFilterText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  topFilterTextActive: {
    color: COLORS.surface,
  },
  topFilterTextDisabled: {
    color: COLORS.borderStrong,
  },
  radiusRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
  },
  radiusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  radiusChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  radiusChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  radiusChipTextActive: {
    color: COLORS.surface,
  },
  listSection: {
    paddingHorizontal: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 52,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  emptySubtext: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 28,
    lineHeight: 18,
  },
  vetCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  vetImage: {
    width: 56,
    height: 56,
    borderRadius: 18,
    marginRight: 12,
  },
  vetImagePlaceholder: {
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vetInitials: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  vetInfo: {
    flex: 1,
    paddingRight: 8,
  },
  vetName: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  vetSpec: {
    marginTop: 3,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  profileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: COLORS.primarySoft,
  },
  profileChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 5,
  },
  availableBadge: {
    backgroundColor: COLORS.successSoft,
  },
  verifiedBadge: {
    backgroundColor: COLORS.primarySoft,
  },
  emergencyBadge: {
    backgroundColor: COLORS.warningSoft,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.success,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.success,
  },
  verifiedBadgeText: {
    color: COLORS.primaryDark,
  },
  emergencyBadgeText: {
    color: COLORS.warning,
  },
  metaDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metaCell: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
    marginBottom: 8,
  },
  metaText: {
    flex: 1,
    marginLeft: 7,
    fontSize: 12.5,
    color: COLORS.textMuted,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  starIcon: {
    marginRight: 1,
  },
  ratingText: {
    marginLeft: 6,
    fontSize: 12.5,
    color: COLORS.textMuted,
    flexShrink: 1,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  serviceTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
  },
  serviceTagText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  vetActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  callBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  callBtnText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  primaryBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  primaryBtnText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  iconActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default VeterinarianScreen;

