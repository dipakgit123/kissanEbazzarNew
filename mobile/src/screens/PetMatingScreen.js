import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { useTranslation } from 'react-i18next';
import AppHeader from '../components/AppHeader';
import SkeletonLoader from '../components/SkeletonLoader';
import { getCatBreedOptions } from '../constants/catBreeds';
import { getDogBreedOptions } from '../constants/dogBreeds';
import { useAuth } from '../context/AuthContext';
import { petMatingService } from '../services/api';
import { COLORS } from '../utils/constants';

const emptyForm = {
  pet_type: 'dog',
  pet_name: '',
  breed: '',
  gender: 'male',
  age_months: '',
  fee_type: 'negotiable',
  fee_amount: '',
  owner_phone: '',
  city: '',
  state: '',
  description: '',
};

const getLanguage = (i18n) => (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0];
const getPhoto = (profile) => profile?.photos?.[0] || null;
const getLocation = (profile) => [profile?.city, profile?.state].filter(Boolean).join(', ');
const getProfilesFromResponse = (response) => response?.data?.profiles || response?.profiles || [];
const getProfileOwnerId = (profile) => profile?.user_id || profile?.owner?.id || profile?.owner_id;
const normalizePhoneForWhatsApp = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `91${digits}`;
  return digits;
};

const formatFee = (profile, t) => {
  if (profile?.fee_type === 'free') return t('petMating.free', { defaultValue: 'Free' });
  if (profile?.fee_type === 'paid') {
    return profile.fee_amount
      ? `Rs. ${Number(profile.fee_amount).toLocaleString('en-IN')}`
      : t('petMating.paid', { defaultValue: 'Paid' });
  }
  return t('petMating.negotiable', { defaultValue: 'Negotiable' });
};

const PetMatingScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const language = getLanguage(i18n);
  const insets = useSafeAreaInsets();
  const [profiles, setProfiles] = useState([]);
  const [myProfiles, setMyProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ petType: 'all', breed: 'all', gender: 'all', search: '' });
  const [form, setForm] = useState(emptyForm);
  const [photos, setPhotos] = useState([]);
  const [video, setVideo] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const breedOptions = useMemo(() => {
    const getOptions = form.pet_type === 'cat' ? getCatBreedOptions : getDogBreedOptions;
    return getOptions(language, t('petMating.selectBreed', { defaultValue: 'Select breed' }));
  }, [form.pet_type, language, t]);

  const filterBreedOptions = useMemo(() => {
    const placeholder = t('petMating.allBreeds', { defaultValue: 'All breeds' });
    if (filters.petType === 'dog') {
      return getDogBreedOptions(language, placeholder).map((item) => item.value ? item : { ...item, value: 'all' });
    }
    if (filters.petType === 'cat') {
      return getCatBreedOptions(language, placeholder).map((item) => item.value ? item : { ...item, value: 'all' });
    }

    const seen = new Set();
    return [
      { label: placeholder, value: 'all' },
      ...[
        ...getDogBreedOptions(language, placeholder),
        ...getCatBreedOptions(language, placeholder),
      ]
        .filter((item) => item.value)
        .filter((item) => {
          if (seen.has(item.value)) return false;
          seen.add(item.value);
          return true;
        }),
    ];
  }, [filters.petType, language, t]);

  const isOwnProfile = useCallback((profile) => {
    const userId = user?.id || user?.userId;
    if (!userId || !profile) return false;
    return String(getProfileOwnerId(profile)) === String(userId);
  }, [user?.id, user?.userId]);

  const loadProfiles = useCallback(async () => {
    try {
      const params = { limit: 40 };
      if (filters.petType !== 'all') params.petType = filters.petType;
      if (filters.breed !== 'all') params.breed = filters.breed;
      if (filters.gender !== 'all') params.gender = filters.gender;
      if (filters.search.trim()) params.search = filters.search.trim();

      const [publicResponse, myResponse] = await Promise.all([
        petMatingService.getProfiles(params),
        petMatingService.getMyProfiles().catch(() => ({ data: { profiles: [] } })),
      ]);

      const nextMyProfiles = getProfilesFromResponse(myResponse);
      const ownProfileIds = new Set(nextMyProfiles.map((profile) => String(profile.id)));
      const nextProfiles = getProfilesFromResponse(publicResponse).filter(
        (profile) => !ownProfileIds.has(String(profile.id)) && !isOwnProfile(profile)
      );

      setProfiles(nextProfiles);
      setMyProfiles(nextMyProfiles);
    } catch (error) {
      console.error('Error loading pet mating profiles:', error);
      Alert.alert(t('common.error', { defaultValue: 'Error' }), error?.message || t('petMating.loadFailed', { defaultValue: 'Failed to load pet mating profiles' }));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, isOwnProfile, t]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'pet_type' ? { breed: '' } : {}),
    }));
  };

  const updateFilter = (field, value) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
      ...(field === 'petType' ? { breed: 'all' } : {}),
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setPhotos([]);
    setVideo(null);
  };

  const closeForm = () => {
    if (submitting) return;
    setShowForm(false);
  };

  const pickPhotos = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('common.error', { defaultValue: 'Error' }), t('petMating.photoPermission', { defaultValue: 'Photo permission is required' }));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5,
    });

    if (!result.canceled) {
      setPhotos((result.assets || []).slice(0, 5));
    }
  };

  const pickVideo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('common.error', { defaultValue: 'Error' }), t('petMating.photoPermission', { defaultValue: 'Media permission is required' }));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.7,
      videoMaxDuration: 60,
    });

    if (!result.canceled) {
      setVideo(result.assets?.[0] || null);
    }
  };

  const buildFormData = () => {
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        data.append(key, String(value));
      }
    });

    photos.forEach((photo, index) => {
      const extension = photo.uri?.split('.').pop() || 'jpg';
      data.append('photos', {
        uri: photo.uri,
        name: `pet-mating-${index}.${extension}`,
        type: photo.mimeType || `image/${extension === 'png' ? 'png' : 'jpeg'}`,
      });
    });

    if (video?.uri) {
      const extension = video.uri.split('.').pop() || 'mp4';
      data.append('video', {
        uri: video.uri,
        name: `pet-mating-video.${extension}`,
        type: video.mimeType || 'video/mp4',
      });
    }

    return data;
  };

  const submitProfile = async () => {
    if (!form.pet_name.trim() || !form.breed || !form.owner_phone.trim()) {
      Alert.alert(t('common.error', { defaultValue: 'Error' }), t('petMating.requiredFields', { defaultValue: 'Pet name, breed and owner phone are required' }));
      return;
    }

    if (photos.length === 0) {
      Alert.alert(t('common.error', { defaultValue: 'Error' }), t('petMating.photoRequired', { defaultValue: 'Please add at least one pet photo' }));
      return;
    }

    setSubmitting(true);
    try {
      await petMatingService.createProfile(buildFormData());
      Alert.alert(t('common.success', { defaultValue: 'Success' }), t('petMating.created', { defaultValue: 'Pet mating profile created' }));
      resetForm();
      setShowForm(false);
      await loadProfiles();
    } catch (error) {
      Alert.alert(t('common.error', { defaultValue: 'Error' }), error?.message || t('petMating.createFailed', { defaultValue: 'Failed to create profile' }));
    } finally {
      setSubmitting(false);
    }
  };

  const contactOwner = async (profile) => {
    if (isOwnProfile(profile)) {
      Alert.alert(t('common.error', { defaultValue: 'Error' }), t('petMating.cannotContactOwnProfile', { defaultValue: 'You cannot contact your own mating profile.' }));
      return;
    }

    try {
      const response = await petMatingService.trackContact(profile.id);
      const phone = response?.data?.owner_phone || profile.owner_phone || profile.owner?.phone_number;
      if (!phone) {
        Alert.alert(t('common.error', { defaultValue: 'Error' }), t('petMating.noPhone', { defaultValue: 'Owner phone number is not available' }));
        return;
      }
      Linking.openURL(`tel:${phone}`);
    } catch (error) {
      Alert.alert(t('common.error', { defaultValue: 'Error' }), error?.message || t('petMating.contactFailed', { defaultValue: 'Unable to contact owner' }));
    }
  };

  const whatsappOwner = async (profile) => {
    if (isOwnProfile(profile)) {
      Alert.alert(t('common.error', { defaultValue: 'Error' }), t('petMating.cannotContactOwnProfile', { defaultValue: 'You cannot contact your own mating profile.' }));
      return;
    }

    try {
      const response = await petMatingService.trackContact(profile.id);
      const phone = response?.data?.owner_phone || profile.owner_phone || profile.owner?.phone_number;
      const normalizedPhone = normalizePhoneForWhatsApp(phone);
      if (!normalizedPhone) {
        Alert.alert(t('common.error', { defaultValue: 'Error' }), t('petMating.noPhone', { defaultValue: 'Owner phone number is not available' }));
        return;
      }

      const message = t('petMating.whatsappMessage', {
        defaultValue: 'Hi, I am interested in your {{petName}} mating profile on Animal E Bazar.',
        petName: profile.pet_name || t('petMating.title', { defaultValue: 'Pet Mating' }),
      });
      const appUrl = `whatsapp://send?phone=${normalizedPhone}&text=${encodeURIComponent(message)}`;
      const webUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
      Linking.openURL(appUrl).catch(() => Linking.openURL(webUrl));
    } catch (error) {
      Alert.alert(t('common.error', { defaultValue: 'Error' }), error?.message || t('petMating.contactFailed', { defaultValue: 'Unable to contact owner' }));
    }
  };

  const reportProfile = (profile) => {
    if (isOwnProfile(profile)) {
      Alert.alert(t('common.error', { defaultValue: 'Error' }), t('petMating.cannotReportOwnProfile', { defaultValue: 'You cannot report your own mating profile.' }));
      return;
    }

    Alert.alert(
      t('petMating.reportProfile', { defaultValue: 'Report profile' }),
      t('petMating.reportConfirm', { defaultValue: 'Report this profile for admin review?' }),
      [
        { text: t('common.cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
        {
          text: t('petMating.reportProfile', { defaultValue: 'Report profile' }),
          style: 'destructive',
          onPress: async () => {
            try {
              await petMatingService.reportProfile(profile.id, { reason: 'other', description: 'Reported from mobile app' });
              Alert.alert(t('common.success', { defaultValue: 'Success' }), t('petMating.reported', { defaultValue: 'Profile reported for review' }));
            } catch (error) {
              Alert.alert(t('common.error', { defaultValue: 'Error' }), error?.message || t('petMating.reportFailed', { defaultValue: 'Failed to report profile' }));
            }
          },
        },
      ]
    );
  };

  const markMatched = async (profile) => {
    try {
      await petMatingService.markMatched(profile.id);
      Alert.alert(t('common.success', { defaultValue: 'Success' }), t('petMating.markedMatched', { defaultValue: 'Profile marked as matched' }));
      await loadProfiles();
    } catch (error) {
      Alert.alert(t('common.error', { defaultValue: 'Error' }), error?.message || t('petMating.updateFailed', { defaultValue: 'Failed to update profile' }));
    }
  };

  const deleteMyProfile = (profile) => {
    Alert.alert(
      t('petMating.deleteProfile', { defaultValue: 'Delete profile' }),
      t('petMating.deleteConfirm', { defaultValue: 'Delete this pet mating profile?' }),
      [
        { text: t('common.cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
        {
          text: t('petMating.deleteProfile', { defaultValue: 'Delete profile' }),
          style: 'destructive',
          onPress: async () => {
            try {
              await petMatingService.deleteProfile(profile.id);
              Alert.alert(t('common.success', { defaultValue: 'Success' }), t('petMating.deleted', { defaultValue: 'Profile deleted' }));
              await loadProfiles();
            } catch (error) {
              Alert.alert(t('common.error', { defaultValue: 'Error' }), error?.message || t('petMating.deleteFailed', { defaultValue: 'Failed to delete profile' }));
            }
          },
        },
      ]
    );
  };

  const renderProfileCard = (profile) => (
    <View
      key={profile.id}
      style={styles.card}
    >
      <TouchableOpacity onPress={() => setSelectedProfile(profile)} activeOpacity={0.88}>
        <View style={styles.cardImageWrap}>
          {getPhoto(profile) ? (
            <Image source={{ uri: getPhoto(profile) }} style={styles.cardImage} />
          ) : (
            <View style={[styles.cardImage, styles.imageFallback]}>
              <Ionicons name="paw-outline" size={40} color={COLORS.primary} />
            </View>
          )}
          <View style={styles.cardBadges}>
            <Text style={styles.typePill}>{t(`animalTypes.${profile.pet_type}`, { defaultValue: profile.pet_type })}</Text>
            <Text style={styles.statusPill}>{profile.status}</Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardTitleRow}>
            <View style={styles.cardTitleBlock}>
              <Text style={styles.cardTitle} numberOfLines={1}>{profile.pet_name}</Text>
              <Text style={styles.cardMeta} numberOfLines={1}>
                {profile.breed} - {t(`petMating.${profile.gender}`, { defaultValue: profile.gender })}
              </Text>
            </View>
            <Text style={styles.feePill}>{formatFee(profile, t)}</Text>
          </View>
          <Text style={styles.cardDescription} numberOfLines={2}>
            {profile.description || t('petMating.noDescription', { defaultValue: 'No description added.' })}
          </Text>
          <View style={styles.cardBottomRow}>
            <Text style={styles.cardLocation} numberOfLines={1}>
              {getLocation(profile) || t('profile.locationNotSet', { defaultValue: 'Location not set' })}
            </Text>
            <Text style={styles.viewDetails}>{t('petMating.viewDetails', { defaultValue: 'View details' })}</Text>
          </View>
        </View>
      </TouchableOpacity>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.cardCallButton} onPress={() => contactOwner(profile)} activeOpacity={0.85}>
          <Ionicons name="call-outline" size={16} color={COLORS.surface} />
          <Text style={styles.cardActionText}>{t('animalCard.call', { defaultValue: 'Call' })}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cardWhatsAppButton} onPress={() => whatsappOwner(profile)} activeOpacity={0.85}>
          <Ionicons name="logo-whatsapp" size={16} color={COLORS.surface} />
          <Text style={styles.cardActionText}>{t('animalCard.whatsapp', { defaultValue: 'WhatsApp' })}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingCenter}>
          <SkeletonLoader variant="animalList" count={3} compact />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <AppHeader
        title={t('petMating.title', { defaultValue: 'Pet Mating' })}
        subtitle={t('petMating.mobileSubtitle', { defaultValue: 'Dog and cat mating profiles' })}
        navigation={navigation}
        rightActions={[{ icon: 'add', onPress: () => setShowForm(true), accessibilityLabel: t('petMating.createProfile', { defaultValue: 'Create mating profile' }) }]}
      />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 110 + insets.bottom }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadProfiles(); }} />}
      >
        <View style={styles.heroCompact}>
          <View style={styles.heroCompactText}>
            <Text style={styles.heroKicker}>{t('petMating.kicker', { defaultValue: 'Pet mating' })}</Text>
            <Text style={styles.heroCompactTitle}>{t('petMating.heroTitle', { defaultValue: 'Find trusted mates for dogs and cats.' })}</Text>
            <Text style={styles.heroCompactSubtitle} numberOfLines={1}>
              {t('petMating.trustPhotoTitle', { defaultValue: 'Clear photo first' })} - {t('petMating.trustContactTitle', { defaultValue: 'Verified contact' })}
            </Text>
          </View>
          <TouchableOpacity style={styles.createCompactButton} onPress={() => setShowForm(true)}>
            <Ionicons name="add" size={18} color={COLORS.primaryDark} />
            <Text style={styles.createCompactButtonText}>{t('petMating.createProfile', { defaultValue: 'Create mating profile' })}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterCard}>
          <View style={styles.searchFilterRow}>
            <View style={styles.searchBoxCompact}>
              <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
              <TextInput
                value={filters.search}
                onChangeText={(value) => setFilters((current) => ({ ...current, search: value }))}
                placeholder={t('petMating.searchPlaceholder', { defaultValue: 'Search breed, city, pet name' })}
                placeholderTextColor="#8D928B"
                style={styles.searchInput}
              />
            </View>
            <TouchableOpacity style={[styles.filterToggle, showFilters && styles.filterToggleActive]} onPress={() => setShowFilters((current) => !current)}>
              <Ionicons name="options-outline" size={18} color={showFilters ? COLORS.surface : COLORS.primaryDark} />
              <Text style={[styles.filterToggleText, showFilters && styles.filterToggleTextActive]}>{t('common.filter', { defaultValue: 'Filter' })}</Text>
            </TouchableOpacity>
          </View>
          {showFilters ? (
            <View style={styles.filterDropdownGrid}>
              <Dropdown
                label={t('petMating.petType', { defaultValue: 'Pet type' })}
                selectedValue={filters.petType}
                onValueChange={(value) => updateFilter('petType', value)}
                items={[
                  { label: t('petMating.allPets', { defaultValue: 'All pets' }), value: 'all' },
                  { label: t('animalTypes.dog', { defaultValue: 'Dog' }), value: 'dog' },
                  { label: t('animalTypes.cat', { defaultValue: 'Cat' }), value: 'cat' },
                ]}
              />
              <Dropdown
                label={t('petMating.selectBreed', { defaultValue: 'Select breed' })}
                selectedValue={filters.breed}
                onValueChange={(value) => updateFilter('breed', value)}
                items={filterBreedOptions}
              />
              <Dropdown
                label={t('petMating.gender', { defaultValue: 'Gender' })}
                selectedValue={filters.gender}
                onValueChange={(value) => updateFilter('gender', value)}
                items={[
                  { label: t('petMating.allGenders', { defaultValue: 'All genders' }), value: 'all' },
                  { label: t('petMating.male', { defaultValue: 'Male' }), value: 'male' },
                  { label: t('petMating.female', { defaultValue: 'Female' }), value: 'female' },
                ]}
              />
            </View>
          ) : null}
        </View>

        {myProfiles.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionKicker}>{t('petMating.ownerDashboard', { defaultValue: 'Owner dashboard' })}</Text>
                <Text style={styles.sectionTitle}>{t('petMating.myProfiles', { defaultValue: 'My pet mating profiles' })}</Text>
              </View>
            </View>
            {myProfiles.map((profile) => (
              <View key={profile.id} style={styles.myProfileRow}>
                <View style={styles.myProfileInfo}>
                  {getPhoto(profile) ? <Image source={{ uri: getPhoto(profile) }} style={styles.myProfileImage} /> : <View style={styles.myProfileImageFallback} />}
                  <View style={styles.myProfileText}>
                    <Text style={styles.myProfileTitle} numberOfLines={1}>{profile.pet_name} - {profile.breed}</Text>
                    <Text style={styles.myProfileStatus}>{profile.status}</Text>
                    <Text style={styles.myProfileHint} numberOfLines={2}>
                      {t('petMating.foundMatchHint', { defaultValue: 'Use Found match after your pet gets a mating partner. It hides this profile from public search.' })}
                    </Text>
                  </View>
                </View>
                <View style={styles.myProfileActions}>
                  {profile.status !== 'matched' ? (
                    <TouchableOpacity style={styles.miniAction} onPress={() => markMatched(profile)}>
                      <Text style={styles.miniActionText}>{t('petMating.hideAfterMatch', { defaultValue: 'Found match' })}</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity style={[styles.miniAction, styles.dangerMiniAction]} onPress={() => deleteMyProfile(profile)}>
                    <Text style={[styles.miniActionText, styles.dangerMiniActionText]}>{t('petMating.deleteProfile', { defaultValue: 'Delete' })}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionKicker}>{t('petMating.browseProfiles', { defaultValue: 'Browse profiles' })}</Text>
              <Text style={styles.sectionTitle}>{t('petMating.availableProfiles', { defaultValue: 'Available pet profiles' })}</Text>
            </View>
            <Text style={styles.countPill}>{profiles.length}</Text>
          </View>
          {profiles.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="paw-outline" size={34} color={COLORS.primary} />
              <Text style={styles.emptyTitle}>{t('petMating.emptyTitle', { defaultValue: 'No pet mating profiles yet' })}</Text>
              <Text style={styles.emptySubtitle}>{t('petMating.emptySubtitle', { defaultValue: 'Create the first trusted profile for your area.' })}</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={() => setShowForm(true)}>
                <Text style={styles.emptyButtonText}>{t('petMating.createProfile', { defaultValue: 'Create mating profile' })}</Text>
              </TouchableOpacity>
            </View>
          ) : profiles.map(renderProfileCard)}
        </View>
      </ScrollView>

      <Modal visible={showForm} animationType="slide" onRequestClose={closeForm}>
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalKicker}>{t('petMating.simpleProfile', { defaultValue: 'Simple profile' })}</Text>
              <Text style={styles.modalTitle}>{t('petMating.formTitle', { defaultValue: 'Add pet mating profile' })}</Text>
              <Text style={styles.modalHint}>{t('petMating.simpleFormHint', { defaultValue: 'Only the important details. You can keep optional fields blank.' })}</Text>
            </View>
            <TouchableOpacity style={styles.modalCloseButton} onPress={closeForm}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={[styles.formContent, { paddingBottom: 132 + insets.bottom }]}>
            <MediaPicker photos={photos} video={video} t={t} onPickPhotos={pickPhotos} onRemovePhotos={() => setPhotos([])} onPickVideo={pickVideo} onRemoveVideo={() => setVideo(null)} />
            <View style={styles.formGrid}>
              <Segmented value={form.pet_type} options={[['dog', t('animalTypes.dog', { defaultValue: 'Dog' })], ['cat', t('animalTypes.cat', { defaultValue: 'Cat' })]]} onChange={(value) => updateForm('pet_type', value)} />
              <Dropdown label={t('petMating.selectBreed', { defaultValue: 'Select breed' })} selectedValue={form.breed} items={breedOptions} onValueChange={(value) => updateForm('breed', value)} />
              <Input label={t('petMating.petName', { defaultValue: 'Pet name' })} value={form.pet_name} onChangeText={(value) => updateForm('pet_name', value)} />
              <Segmented value={form.gender} options={[['male', t('petMating.male', { defaultValue: 'Male' })], ['female', t('petMating.female', { defaultValue: 'Female' })]]} onChange={(value) => updateForm('gender', value)} />
              <Input label={t('petMating.ageMonths', { defaultValue: 'Age in months' })} keyboardType="numeric" value={form.age_months} onChangeText={(value) => updateForm('age_months', value)} />
              <Input
                label={t('petMating.feePrice', { defaultValue: 'Fees / Price' })}
                keyboardType="numeric"
                value={form.fee_amount}
                onChangeText={(value) => {
                  updateForm('fee_amount', value);
                  updateForm('fee_type', value ? 'paid' : 'negotiable');
                }}
              />
              <Input label={t('petMating.ownerPhone', { defaultValue: 'Owner phone' })} keyboardType="phone-pad" value={form.owner_phone} onChangeText={(value) => updateForm('owner_phone', value)} />
              <Input label={t('petMating.city', { defaultValue: 'City' })} value={form.city} onChangeText={(value) => updateForm('city', value)} />
              <Input label={t('petMating.state', { defaultValue: 'State' })} value={form.state} onChangeText={(value) => updateForm('state', value)} />
              <Input label={t('petMating.description', { defaultValue: 'Description, health notes, mating preference' })} multiline value={form.description} onChangeText={(value) => updateForm('description', value)} />
            </View>
          </ScrollView>

          <View style={[styles.formFooter, { paddingBottom: 12 + insets.bottom }]}>
            <TouchableOpacity style={styles.cancelButton} onPress={closeForm} disabled={submitting}>
              <Text style={styles.cancelButtonText}>{t('common.cancel', { defaultValue: 'Cancel' })}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.submitButton, submitting && styles.disabledButton]} disabled={submitting} onPress={submitProfile}>
              <Text style={styles.submitButtonText}>{submitting ? t('common.loading', { defaultValue: 'Loading...' }) : t('petMating.submitProfile', { defaultValue: 'Submit profile' })}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal visible={!!selectedProfile} transparent animationType="fade" onRequestClose={() => setSelectedProfile(null)}>
        <View style={styles.detailOverlay}>
          <View style={styles.detailCard}>
            {selectedProfile ? (
              <>
                {getPhoto(selectedProfile) ? <Image source={{ uri: getPhoto(selectedProfile) }} style={styles.detailImage} /> : null}
                <View style={styles.detailBody}>
                  <View style={styles.detailHeaderRow}>
                    <View style={styles.detailTitleBlock}>
                      <Text style={styles.detailType}>{t(`animalTypes.${selectedProfile.pet_type}`, { defaultValue: selectedProfile.pet_type })}</Text>
                      <Text style={styles.detailTitle}>{selectedProfile.pet_name}</Text>
                    </View>
                    <TouchableOpacity style={styles.detailCloseIcon} onPress={() => setSelectedProfile(null)}>
                      <Ionicons name="close" size={20} color={COLORS.text} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.detailMeta}>{selectedProfile.breed} - {t(`petMating.${selectedProfile.gender}`, { defaultValue: selectedProfile.gender })}</Text>
                  <View style={styles.detailInfoGrid}>
                    <InfoItem label={t('petMating.fee', { defaultValue: 'Fee' })} value={formatFee(selectedProfile, t)} />
                    <InfoItem label={t('petMating.ageMonths', { defaultValue: 'Age in months' })} value={selectedProfile.age_months || '-'} />
                    <InfoItem label={t('petMating.city', { defaultValue: 'City' })} value={getLocation(selectedProfile) || '-'} />
                  </View>
                  <Text style={styles.detailDescription}>{selectedProfile.description || t('petMating.noDescription', { defaultValue: 'No description added.' })}</Text>
                  <View style={styles.detailActions}>
                    <TouchableOpacity style={styles.primaryAction} onPress={() => contactOwner(selectedProfile)}>
                      <Ionicons name="call-outline" size={18} color={COLORS.surface} />
                      <Text style={styles.primaryActionText}>{t('petMating.callOwner', { defaultValue: 'Call owner' })}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.whatsAppAction} onPress={() => whatsappOwner(selectedProfile)}>
                      <Ionicons name="logo-whatsapp" size={18} color={COLORS.surface} />
                      <Text style={styles.primaryActionText}>{t('animalCard.whatsapp', { defaultValue: 'WhatsApp' })}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryAction} onPress={() => reportProfile(selectedProfile)}>
                      <Text style={styles.secondaryActionText}>{t('petMating.reportProfile', { defaultValue: 'Report' })}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const Input = ({ label, multiline, ...props }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      {...props}
      multiline={multiline}
      style={[styles.input, multiline && styles.textArea]}
      placeholderTextColor="#8D928B"
    />
  </View>
);

const Segmented = ({ value, options, onChange }) => (
  <View style={styles.segmented}>
    {options.map(([key, label]) => (
      <TouchableOpacity key={key} style={[styles.segment, value === key && styles.segmentActive]} onPress={() => onChange(key)}>
        <Text style={[styles.segmentText, value === key && styles.segmentTextActive]}>{label}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

const Dropdown = ({ label, selectedValue, items, onValueChange }) => (
  <View style={styles.dropdownGroup}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={styles.dropdownBox}>
      <Picker
        selectedValue={selectedValue}
        onValueChange={onValueChange}
        dropdownIconColor={COLORS.primaryDark}
        style={styles.dropdownPicker}
      >
        {items.map((item) => (
          <Picker.Item key={`${label}-${item.value}`} label={item.label} value={item.value} />
        ))}
      </Picker>
    </View>
  </View>
);

const MediaPicker = ({ photos, video, t, onPickPhotos, onRemovePhotos, onPickVideo, onRemoveVideo }) => (
  <View style={styles.mediaCard}>
    <View style={styles.mediaHeader}>
      <View style={styles.mediaHeaderText}>
        <Text style={styles.mediaTitle}>{t('petMating.addPhotos', { defaultValue: 'Add photos' })}</Text>
        <Text style={styles.mediaHint}>{t('petMating.photoHelp', { defaultValue: 'At least one clear photo is required. Maximum 5 photos.' })}</Text>
      </View>
      <TouchableOpacity style={styles.mediaAction} onPress={onPickPhotos}>
        <Text style={styles.mediaActionText} numberOfLines={1}>{photos.length ? t('common.change', { defaultValue: 'Change' }) : t('petMating.choosePhotos', { defaultValue: 'Choose photos' })}</Text>
      </TouchableOpacity>
    </View>
    {photos.length > 0 ? (
      <View style={styles.photoPreviewWrap}>
        <Image source={{ uri: photos[0].uri }} style={styles.photoPreview} />
        <TouchableOpacity style={styles.removeMediaButton} onPress={onRemovePhotos}>
          <Ionicons name="trash-outline" size={16} color={COLORS.error} />
          <Text style={styles.removeMediaText}>{t('common.remove', { defaultValue: 'Remove' })}</Text>
        </TouchableOpacity>
      </View>
    ) : (
      <TouchableOpacity style={styles.emptyPhotoBox} onPress={onPickPhotos}>
        <Ionicons name="images-outline" size={30} color={COLORS.primary} />
        <Text style={styles.emptyPhotoText}>{t('petMating.choosePhotos', { defaultValue: 'Choose photos' })}</Text>
      </TouchableOpacity>
    )}
    <View style={styles.videoRow}>
      <View style={styles.videoTextBlock}>
        <Text style={styles.videoTitle}>{t('petMating.addVideoOptional', { defaultValue: 'Add video optional' })}</Text>
        <Text style={styles.videoHint}>{video ? t('petMating.videoSelected', { defaultValue: 'Video selected' }) : t('petMating.videoHelp', { defaultValue: 'Short optional video helps buyers understand the pet better.' })}</Text>
      </View>
      <TouchableOpacity style={styles.videoButton} onPress={video ? onRemoveVideo : onPickVideo}>
        <Text style={styles.videoButtonText} numberOfLines={1}>{video ? t('common.remove', { defaultValue: 'Remove' }) : t('petMating.chooseVideo', { defaultValue: 'Choose video' })}</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const InfoItem = ({ label, value }) => (
  <View style={styles.infoItem}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  modalSafe: { flex: 1, backgroundColor: COLORS.background },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  content: { padding: 14, gap: 12 },
  hero: { backgroundColor: COLORS.primaryDeep, borderRadius: 24, padding: 16, gap: 16 },
  heroCompact: { backgroundColor: COLORS.primaryDeep, borderRadius: 20, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroCompactText: { flex: 1, minWidth: 0 },
  heroCompactTitle: { marginTop: 4, color: COLORS.surface, fontSize: 19, lineHeight: 24, fontWeight: '900' },
  heroCompactSubtitle: { marginTop: 4, color: COLORS.secondary, fontSize: 11, fontWeight: '800' },
  createCompactButton: { maxWidth: 132, minHeight: 44, borderRadius: 15, backgroundColor: COLORS.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 10 },
  createCompactButtonText: { flexShrink: 1, color: COLORS.primaryDark, fontSize: 11, lineHeight: 14, fontWeight: '900', textAlign: 'center' },
  heroTextBlock: { gap: 8 },
  heroKicker: { color: COLORS.secondary, fontSize: 11, fontWeight: '900', letterSpacing: 1.6, textTransform: 'uppercase' },
  heroTitle: { color: COLORS.surface, fontSize: 25, lineHeight: 31, fontWeight: '900' },
  trustRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  trustPill: { overflow: 'hidden', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)', color: COLORS.secondary, paddingHorizontal: 10, paddingVertical: 6, fontSize: 11, fontWeight: '900' },
  heroActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  miniStat: { minWidth: 86, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', padding: 10, alignItems: 'center' },
  miniStatValue: { color: COLORS.surface, fontSize: 22, fontWeight: '900' },
  miniStatLabel: { color: COLORS.secondary, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  heroButton: { flex: 1, minHeight: 48, borderRadius: 17, backgroundColor: COLORS.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 10 },
  heroButtonText: { color: COLORS.primaryDark, fontSize: 13, fontWeight: '900', textAlign: 'center' },
  filterCard: { borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, padding: 10, gap: 10 },
  filterLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '900', letterSpacing: 1.1, textTransform: 'uppercase' },
  searchBox: { minHeight: 48, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#FCFBF7', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  searchFilterRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchBoxCompact: { flex: 1, minHeight: 44, borderRadius: 15, borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#FCFBF7', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 14, fontWeight: '700' },
  filterToggle: { minHeight: 44, borderRadius: 15, borderWidth: 1, borderColor: COLORS.primarySoft, backgroundColor: COLORS.primarySoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 11 },
  filterToggleActive: { backgroundColor: COLORS.primaryDark, borderColor: COLORS.primaryDark },
  filterToggleText: { color: COLORS.primaryDark, fontSize: 12, fontWeight: '900' },
  filterToggleTextActive: { color: COLORS.surface },
  filterDropdownGrid: { gap: 10 },
  dropdownGroup: { gap: 7 },
  dropdownBox: { minHeight: 50, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, overflow: 'hidden', justifyContent: 'center' },
  dropdownPicker: { height: 50, color: COLORS.text, fontSize: 14 },
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  sectionKicker: { color: COLORS.primaryDark, fontSize: 11, fontWeight: '900', letterSpacing: 1.3, textTransform: 'uppercase' },
  sectionTitle: { marginTop: 2, fontSize: 22, fontWeight: '900', color: COLORS.text },
  countPill: { overflow: 'hidden', borderRadius: 999, backgroundColor: COLORS.primarySoft, color: COLORS.primaryDark, paddingHorizontal: 13, paddingVertical: 8, fontSize: 13, fontWeight: '900' },
  card: { overflow: 'hidden', borderRadius: 24, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  cardImageWrap: { height: 190, backgroundColor: COLORS.primarySoft },
  cardImage: { width: '100%', height: '100%' },
  imageFallback: { alignItems: 'center', justifyContent: 'center' },
  cardBadges: { position: 'absolute', left: 12, top: 12, flexDirection: 'row', gap: 7 },
  typePill: { overflow: 'hidden', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.94)', color: COLORS.primaryDark, paddingHorizontal: 10, paddingVertical: 5, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  statusPill: { overflow: 'hidden', borderRadius: 999, backgroundColor: 'rgba(36,49,41,0.86)', color: COLORS.surface, paddingHorizontal: 10, paddingVertical: 5, fontSize: 11, fontWeight: '900', textTransform: 'capitalize' },
  cardBody: { padding: 15 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  cardTitleBlock: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 23, fontWeight: '900', color: COLORS.text },
  cardMeta: { marginTop: 3, color: COLORS.textMuted, fontSize: 13, fontWeight: '800' },
  feePill: { overflow: 'hidden', borderRadius: 999, backgroundColor: COLORS.accentSoft, color: COLORS.accent, paddingHorizontal: 11, paddingVertical: 6, fontSize: 11, fontWeight: '900' },
  cardDescription: { marginTop: 12, color: COLORS.textMuted, fontSize: 13, lineHeight: 19, fontWeight: '600' },
  cardBottomRow: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  cardLocation: { flex: 1, color: COLORS.primaryDark, fontSize: 12, fontWeight: '900' },
  viewDetails: { overflow: 'hidden', borderRadius: 999, backgroundColor: COLORS.surfaceAlt, color: COLORS.text, paddingHorizontal: 11, paddingVertical: 7, fontSize: 11, fontWeight: '900' },
  cardActions: { flexDirection: 'row', gap: 10, paddingHorizontal: 15, paddingBottom: 15 },
  cardCallButton: { flex: 1, borderRadius: 16, backgroundColor: COLORS.info, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  cardWhatsAppButton: { flex: 1, borderRadius: 16, backgroundColor: COLORS.primary, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  cardActionText: { color: COLORS.surface, fontSize: 13, fontWeight: '900' },
  myProfileRow: { borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, padding: 12, gap: 12 },
  myProfileInfo: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  myProfileImage: { width: 54, height: 54, borderRadius: 16 },
  myProfileImageFallback: { width: 54, height: 54, borderRadius: 16, backgroundColor: COLORS.primarySoft },
  myProfileText: { flex: 1, minWidth: 0 },
  myProfileTitle: { color: COLORS.text, fontSize: 15, fontWeight: '900' },
  myProfileStatus: { marginTop: 4, color: COLORS.textMuted, fontSize: 13, fontWeight: '700', textTransform: 'capitalize' },
  myProfileHint: { marginTop: 5, color: COLORS.textMuted, fontSize: 11, lineHeight: 16, fontWeight: '600' },
  myProfileActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  miniAction: { borderRadius: 999, backgroundColor: COLORS.primarySoft, paddingHorizontal: 12, paddingVertical: 8 },
  miniActionText: { color: COLORS.primaryDark, fontSize: 12, fontWeight: '900' },
  dangerMiniAction: { backgroundColor: COLORS.errorSoft },
  dangerMiniActionText: { color: COLORS.error },
  emptyCard: { alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: COLORS.surface, padding: 26, gap: 9, borderWidth: 1, borderColor: COLORS.border },
  emptyTitle: { color: COLORS.text, fontSize: 18, fontWeight: '900', textAlign: 'center' },
  emptySubtitle: { color: COLORS.textMuted, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  emptyButton: { marginTop: 6, borderRadius: 16, backgroundColor: COLORS.primaryDark, paddingHorizontal: 18, paddingVertical: 12 },
  emptyButtonText: { color: COLORS.surface, fontSize: 13, fontWeight: '900' },
  modalHeader: { borderBottomWidth: 1, borderColor: COLORS.border, backgroundColor: '#FCFBF7', padding: 16, flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  modalKicker: { color: COLORS.primaryDark, fontSize: 11, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase' },
  modalTitle: { marginTop: 2, color: COLORS.text, fontSize: 23, fontWeight: '900' },
  modalHint: { marginTop: 4, color: COLORS.textMuted, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  modalCloseButton: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface },
  formContent: { padding: 16, gap: 14 },
  formGrid: { gap: 14 },
  mediaCard: { borderRadius: 24, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, padding: 14, gap: 13 },
  mediaHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  mediaHeaderText: { flex: 1, minWidth: 0, paddingRight: 4 },
  mediaTitle: { color: COLORS.text, fontSize: 16, fontWeight: '900' },
  mediaHint: { marginTop: 3, color: COLORS.textMuted, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  mediaAction: { width: 112, borderRadius: 999, backgroundColor: COLORS.primarySoft, paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center' },
  mediaActionText: { color: COLORS.primaryDark, fontSize: 12, fontWeight: '900', textAlign: 'center' },
  photoPreviewWrap: { gap: 8 },
  photoPreview: { width: '100%', height: 210, borderRadius: 20, backgroundColor: COLORS.primarySoft },
  removeMediaButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, backgroundColor: COLORS.errorSoft, paddingHorizontal: 10, paddingVertical: 7 },
  removeMediaText: { color: COLORS.error, fontSize: 12, fontWeight: '900' },
  emptyPhotoBox: { height: 160, borderRadius: 20, borderWidth: 1, borderStyle: 'dashed', borderColor: COLORS.borderStrong, backgroundColor: '#FCFBF7', alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyPhotoText: { color: COLORS.primaryDark, fontSize: 13, fontWeight: '900' },
  videoRow: { borderRadius: 18, backgroundColor: COLORS.surfaceAlt, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  videoTextBlock: { flex: 1 },
  videoTitle: { color: COLORS.text, fontSize: 14, fontWeight: '900' },
  videoHint: { marginTop: 3, color: COLORS.textMuted, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  videoButton: { width: 108, borderRadius: 999, backgroundColor: COLORS.surface, paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center' },
  videoButtonText: { color: COLORS.primaryDark, fontSize: 12, fontWeight: '900', textAlign: 'center' },
  inputGroup: { gap: 7 },
  inputLabel: { color: COLORS.text, fontSize: 13, fontWeight: '900' },
  input: { minHeight: 50, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, paddingHorizontal: 14, color: COLORS.text, fontSize: 15, fontWeight: '700' },
  textArea: { minHeight: 105, paddingTop: 12, textAlignVertical: 'top' },
  segmented: { flexDirection: 'row', gap: 8, backgroundColor: COLORS.surface, borderRadius: 18, padding: 6, borderWidth: 1, borderColor: COLORS.border },
  segment: { flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  segmentActive: { backgroundColor: COLORS.primaryDark },
  segmentText: { color: COLORS.textMuted, fontWeight: '900' },
  segmentTextActive: { color: COLORS.surface },
  formFooter: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, paddingHorizontal: 16, paddingTop: 12 },
  cancelButton: { flex: 1, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', paddingVertical: 13 },
  cancelButtonText: { color: COLORS.text, fontSize: 14, fontWeight: '900' },
  submitButton: { flex: 1.2, borderRadius: 16, backgroundColor: COLORS.primaryDark, alignItems: 'center', justifyContent: 'center', paddingVertical: 13 },
  submitButtonText: { color: COLORS.surface, fontSize: 14, fontWeight: '900' },
  disabledButton: { backgroundColor: COLORS.borderStrong },
  detailOverlay: { flex: 1, backgroundColor: 'rgba(17,24,21,0.72)', justifyContent: 'center', padding: 18 },
  detailCard: { maxHeight: '88%', overflow: 'hidden', borderRadius: 28, backgroundColor: COLORS.surface },
  detailImage: { width: '100%', height: 245 },
  detailBody: { padding: 18 },
  detailHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  detailTitleBlock: { flex: 1, minWidth: 0 },
  detailType: { color: COLORS.primaryDark, fontSize: 12, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' },
  detailTitle: { marginTop: 2, color: COLORS.text, fontSize: 28, fontWeight: '900' },
  detailCloseIcon: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surfaceAlt },
  detailMeta: { marginTop: 5, color: COLORS.textMuted, fontSize: 15, fontWeight: '800' },
  detailInfoGrid: { marginTop: 15, flexDirection: 'row', gap: 8 },
  infoItem: { flex: 1, borderRadius: 16, backgroundColor: COLORS.surfaceAlt, padding: 10 },
  infoLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  infoValue: { marginTop: 4, color: COLORS.text, fontSize: 13, fontWeight: '900' },
  detailDescription: { marginTop: 15, color: COLORS.textMuted, fontSize: 14, lineHeight: 22, fontWeight: '600' },
  detailActions: { marginTop: 18, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  primaryAction: { flex: 1, backgroundColor: COLORS.primaryDark, borderRadius: 16, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  whatsAppAction: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryActionText: { color: COLORS.surface, fontWeight: '900' },
  secondaryAction: { minWidth: 110, borderRadius: 16, borderWidth: 1, borderColor: COLORS.error, paddingHorizontal: 16, paddingVertical: 13, justifyContent: 'center', alignItems: 'center' },
  secondaryActionText: { color: COLORS.error, fontWeight: '900' },
});

export default PetMatingScreen;
