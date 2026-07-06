import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { COLORS } from '../../utils/constants';
import OptionSelectField from '../OptionSelectField';

const filePayload = (asset, fallbackName, fallbackType) => ({
  uri: asset.uri,
  type: asset.mimeType || fallbackType,
  name: asset.fileName || fallbackName,
});

const buildPregnancyNote = (isPregnant, months, tr) => {
  if (!isPregnant) return '';
  return `${tr('animal.pregnant', 'Pregnant')}: ${tr('common.yes', 'Yes')}; ${tr('pregnancy.months', 'Months')}: ${months}`;
};

const SimpleAnimalListingForm = ({
  navigation,
  onSuccess,
  endpoint,
  breedOptions,
  photoField = 'photo1',
  genderField,
  showGender = false,
  pregnancyMode = 'none',
  defaults = {},
}) => {
  const { t } = useTranslation();
  const scrollRef = useRef(null);
  const tr = (key, fallback) => {
    const value = t(key);
    return value && value !== key ? value : fallback;
  };
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    breedName: '',
    expectedPrice: '',
    gender: 'female',
    pregnancyStatus: 'not_pregnant',
    pregnancyMonths: '',
    photo: null,
    video: null,
  });

  const canShowBreed = Boolean(formData.photo);
  const canShowPrice = canShowBreed && Boolean(formData.breedName);
  const canShowExtra = canShowPrice && Boolean(formData.expectedPrice);
  const shouldAskPregnancy = pregnancyMode === 'always' || (pregnancyMode === 'femaleOnly' && formData.gender === 'female');
  const isPregnant = formData.pregnancyStatus === 'pregnant';

  useEffect(() => {
    if (!canShowBreed) return;

    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 140);

    return () => clearTimeout(timer);
  }, [canShowBreed, canShowPrice, canShowExtra, isPregnant]);

  const genderOptions = useMemo(() => [
    { value: 'male', label: tr('animal.male', 'Male') },
    { value: 'female', label: tr('animal.female', 'Female') },
  ], [t]);

  const pregnancyOptions = useMemo(() => [
    { value: 'pregnant', label: tr('common.yes', 'Yes') },
    { value: 'not_pregnant', label: tr('common.no', 'No') },
  ], [t]);

  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'gender' && value === 'male' ? { pregnancyStatus: 'not_pregnant', pregnancyMonths: '' } : {}),
      ...(field === 'pregnancyStatus' && value !== 'pregnant' ? { pregnancyMonths: '' } : {}),
    }));
  };

  const removeMedia = (field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: null,
      ...(field === 'photo'
        ? {
            breedName: '',
            expectedPrice: '',
            pregnancyMonths: '',
            pregnancyStatus: 'not_pregnant',
          }
        : {}),
    }));
  };

  const pickMedia = async (field, type) => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(tr('errors.permissionDenied', 'Permission denied'), tr('listing.allowPhotos', 'Please allow access to photos'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: type === 'video' ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
      quality: 0.82,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets?.[0]) {
      updateField(field, result.assets[0]);
    }
  };

  const validateForm = () => {
    if (!formData.photo) return tr('listing.photoRequired', 'Please upload at least one photo');
    if (!formData.breedName) return tr('animal.breedNameRequired', 'Breed name is required');
    if (!formData.expectedPrice) return tr('animal.priceRequired', 'Expected price is required');
    if (shouldAskPregnancy && isPregnant && !formData.pregnancyMonths) {
      return tr('pregnancy.monthsRequired', 'Please enter pregnancy months');
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationMessage = validateForm();
    if (validationMessage) {
      Alert.alert(tr('errors.error', 'Error'), validationMessage);
      return;
    }

    setLoading(true);

    try {
      const storedToken = await AsyncStorage.getItem('token');
      if (!storedToken) {
        Alert.alert(
          tr('errors.error', 'Error'),
          tr('auth.loginToContinue', 'You must be logged in to create a listing.'),
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
        return;
      }

      const submitData = new FormData();
      const pregnancyNote = buildPregnancyNote(isPregnant, formData.pregnancyMonths, tr);
      const mergedFields = {
        ...defaults,
        breedName: formData.breedName,
        expectedPrice: formData.expectedPrice,
        ...(genderField ? { [genderField]: formData.gender } : {}),
        ...(pregnancyMode !== 'none' ? { pregnancyStatus: formData.pregnancyStatus } : {}),
        ...(pregnancyNote && defaults.additionalNotes !== undefined ? { additionalNotes: pregnancyNote } : {}),
        ...(pregnancyNote && defaults.description !== undefined ? { description: pregnancyNote } : {}),
      };

      Object.entries(mergedFields).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          submitData.append(key, value);
        }
      });
      submitData.append(photoField, filePayload(formData.photo, 'photo.jpg', 'image/jpeg'));
      if (formData.video) {
        submitData.append('video', filePayload(formData.video, 'video.mp4', 'video/mp4'));
      }

      await api.post(endpoint, submitData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert(
        tr('success.success', 'Success'),
        tr('success.listingCreated', 'Listing created successfully!'),
        [{ text: 'OK', onPress: onSuccess }]
      );
    } catch (error) {
      Alert.alert(
        tr('errors.error', 'Error'),
        error.response?.data?.message || error.message || 'Failed to create listing'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderMediaTile = (field, type, label, required) => {
    const asset = formData[field];
    return (
      <TouchableOpacity
        style={[styles.mediaTile, asset && styles.mediaTileSelected]}
        activeOpacity={0.86}
        onPress={asset ? undefined : () => pickMedia(field, type)}
      >
        {asset && type === 'photo' ? (
          <Image source={{ uri: asset.uri }} style={styles.previewImage} resizeMode="cover" />
        ) : (
          <View style={styles.mediaIconWrap}>
            <Ionicons name={type === 'video' ? 'videocam' : 'image'} size={28} color={COLORS.primary} />
          </View>
        )}
        {!asset ? (
          <>
            <Text style={styles.mediaTitle}>
              {label} {required ? <Text style={styles.required}>*</Text> : null}
            </Text>
            <Text style={styles.mediaHint}>{tr('formLabels.chooseFile', 'Choose file')}</Text>
          </>
        ) : null}
        {asset ? (
          <View style={styles.mediaActions}>
            <TouchableOpacity
              style={styles.mediaActionButton}
              onPress={() => pickMedia(field, type)}
              activeOpacity={0.84}
            >
              <Ionicons name="swap-horizontal" size={14} color={COLORS.primaryDark} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.mediaActionButton, styles.mediaRemoveButton]}
              onPress={() => removeMedia(field)}
              activeOpacity={0.84}
            >
              <Ionicons name="trash-outline" size={14} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.section}>
        <StepTitle number="1" title={tr('listing.media', 'Photos & Video')} />
        <View style={styles.mediaGrid}>
          {renderMediaTile('photo', 'photo', tr('listing.photoRequiredLabel', 'Animal photo'), true)}
          {renderMediaTile('video', 'video', tr('listing.videoOptionalLabel', 'Video optional'), false)}
        </View>
      </View>

      {canShowBreed ? (
        <View style={styles.section}>
          <StepTitle number="2" title={tr('animal.breedName', 'Breed Name')} />
          <OptionSelectField
            label={tr('animal.breedName', 'Breed Name')}
            value={formData.breedName}
            onChange={(value) => updateField('breedName', value)}
            options={breedOptions}
            placeholder={tr('common.selectOption', 'Select breed')}
            required
          />
        </View>
      ) : null}

      {canShowPrice ? (
        <View style={styles.section}>
          <StepTitle number="3" title={tr('animal.expectedPrice', 'Expected Price')}
          />
          <TextInput
            style={styles.input}
            value={formData.expectedPrice}
            onChangeText={(value) => updateField('expectedPrice', value)}
            placeholder={tr('animal.expectedPrice', 'Expected Price')}
            keyboardType="numeric"
          />
        </View>
      ) : null}

      {canShowExtra && (showGender || pregnancyMode !== 'none') ? (
        <View style={styles.section}>
          <StepTitle number="4" title={tr('listing.quickDetails', 'Quick details')} />
          {showGender ? (
            <SegmentedField
              label={tr('animal.gender', 'Gender')}
              value={formData.gender}
              options={genderOptions}
              onChange={(value) => updateField('gender', value)}
            />
          ) : null}
          {shouldAskPregnancy ? (
            <>
              <SegmentedField
                label={tr('animal.pregnancyStatus', 'Pregnant?')}
                value={formData.pregnancyStatus}
                options={pregnancyOptions}
                onChange={(value) => updateField('pregnancyStatus', value)}
              />
              {isPregnant ? (
                <TextInput
                  style={styles.input}
                  value={formData.pregnancyMonths}
                  onChangeText={(value) => updateField('pregnancyMonths', value)}
                  placeholder={tr('pregnancy.months', 'How many months?')}
                  keyboardType="numeric"
                />
              ) : null}
            </>
          ) : null}
        </View>
      ) : null}

      {canShowExtra ? (
        <TouchableOpacity style={[styles.submitButton, loading && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.submitText}>{tr('listing.createListing', 'Create Listing')}</Text>}
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  );
};

const StepTitle = ({ number, title }) => (
  <View style={styles.stepHeader}>
    <View style={styles.stepBadge}>
      <Text style={styles.stepBadgeText}>{number}</Text>
    </View>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const SegmentedField = ({ label, value, options, onChange }) => (
  <View style={styles.segmentWrapper}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.segmentRow}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.segmentButton, selected && styles.segmentButtonActive]}
            onPress={() => onChange(option.value)}
          >
            <Text style={[styles.segmentText, selected && styles.segmentTextActive]}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 150,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  stepBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  stepBadgeText: {
    color: COLORS.primaryDark,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  mediaGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  mediaTile: {
    flex: 1,
    minHeight: 154,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceAlt,
  },
  mediaTileSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
    minHeight: 210,
    justifyContent: 'flex-start',
    padding: 8,
  },
  mediaIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  previewImage: {
    width: '100%',
    height: 156,
    borderRadius: 14,
    marginBottom: 8,
  },
  mediaTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  mediaHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  mediaActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginTop: 0,
  },
  mediaActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: COLORS.white,
    width: 34,
    height: 34,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mediaRemoveButton: {
    borderColor: COLORS.errorSoft,
    backgroundColor: COLORS.errorSoft,
  },
  mediaActionText: {
    color: COLORS.primaryDark,
    fontSize: 12,
    fontWeight: '800',
  },
  mediaRemoveText: {
    color: COLORS.error,
  },
  required: {
    color: COLORS.error,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    fontSize: 15,
  },
  segmentWrapper: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 10,
  },
  segmentButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
  },
  segmentButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
  },
  segmentText: {
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: COLORS.primaryDark,
  },
  submitButton: {
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
});

export default SimpleAnimalListingForm;
