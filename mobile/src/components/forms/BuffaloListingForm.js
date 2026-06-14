import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import OptionSelectField from '../OptionSelectField';
import { getBuffaloBreedOptions } from '../../constants/buffaloBreeds';
import buffaloFrontGuide from '../../assets/cliparts/buffalo_front.png';
import buffaloSideGuide from '../../assets/cliparts/buffalo_side.png';
import buffaloTeatsGuide from '../../assets/cliparts/buffalo_teats.png';

const BuffaloListingForm = ({ navigation, onSuccess }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const buffaloBreedOptions = getBuffaloBreedOptions(
    i18n.resolvedLanguage || i18n.language,
    t('common.selectOption') || 'Select breed'
  );

  const [formData, setFormData] = useState({
    breedName: '',
    age: '',
    milkCapacity: '',
    pregnancyStatus: 'not_pregnant',
    hasHorns: 'true',
    healthCondition: 'good',
    expectedPrice: '',
    isNegotiable: 'true',
    frontPhoto: null,
    sidePhoto: null,
    milkScenePhoto: null,
    video: null,
  });

  const pregnancyOptions = [
    { value: 'pregnant', label: t('animal.pregnant') || 'Pregnant' },
    { value: 'not_pregnant', label: t('animal.notPregnant') || 'Not Pregnant' },
    { value: 'recently_delivered', label: t('animal.recentlyDelivered') || 'Recently Delivered' },
  ];

  const healthOptions = [
    { value: 'excellent', label: t('animal.excellent') || 'Excellent' },
    { value: 'good', label: t('animal.good') || 'Good' },
    { value: 'average', label: t('animal.average') || 'Average' },
  ];

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePickImage = async (photoType) => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(t('errors.permissionDenied'), 'Please allow access to photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: photoType === 'video' 
        ? ImagePicker.MediaTypeOptions.Videos 
        : ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      handleChange(photoType, result.assets[0]);
    }
  };

  const validateForm = () => {
    if (!formData.breedName.trim()) {
      Alert.alert(t('errors.error'), 'Breed name is required');
      return false;
    }
    if (!formData.age.trim()) {
      Alert.alert(t('errors.error'), 'Age is required');
      return false;
    }
    if (!formData.milkCapacity.trim()) {
      Alert.alert(t('errors.error'), 'Milk capacity is required');
      return false;
    }
    if (!formData.expectedPrice.trim()) {
      Alert.alert(t('errors.error'), 'Expected price is required');
      return false;
    }
    if (!formData.frontPhoto && !formData.sidePhoto && !formData.milkScenePhoto) {
      Alert.alert(t('errors.error'), 'Please upload at least one photo');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const submitData = new FormData();

      // Add text fields
      submitData.append('breedName', formData.breedName);
      submitData.append('age', formData.age);
      submitData.append('milkCapacity', formData.milkCapacity);
      submitData.append('pregnancyStatus', formData.pregnancyStatus);
      submitData.append('hasHorns', formData.hasHorns);
      submitData.append('healthCondition', formData.healthCondition);
      submitData.append('expectedPrice', formData.expectedPrice);
      submitData.append('isNegotiable', formData.isNegotiable);

      // Add photos
      if (formData.frontPhoto) {
        submitData.append('frontPhoto', {
          uri: formData.frontPhoto.uri,
          type: 'image/jpeg',
          name: 'front.jpg',
        });
      }
      if (formData.sidePhoto) {
        submitData.append('sidePhoto', {
          uri: formData.sidePhoto.uri,
          type: 'image/jpeg',
          name: 'side.jpg',
        });
      }
      if (formData.milkScenePhoto) {
        submitData.append('milkScenePhoto', {
          uri: formData.milkScenePhoto.uri,
          type: 'image/jpeg',
          name: 'milk_scene.jpg',
        });
      }
      if (formData.video) {
        submitData.append('video', {
          uri: formData.video.uri,
          type: 'video/mp4',
          name: 'video.mp4',
        });
      }

      console.log('📤 [BUFFALO LISTING] Submitting to: /api/buffalos/listings');
      
      // Debug: Check if user is authenticated
      const storedToken = await AsyncStorage.getItem('token');
      console.log('🔑 [BUFFALO LISTING] Token exists:', !!storedToken);
      console.log('👤 [BUFFALO LISTING] User:', user ? 'Logged in' : 'Not logged in');
      
      if (!storedToken) {
        Alert.alert(
          t('errors.error'),
          'You must be logged in to create a listing. Please login first.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
        return;
      }

      const response = await api.post('/api/buffalos/listings', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('✅ [BUFFALO LISTING] Success:', response.data);

      Alert.alert(
        t('success.success'),
        t('success.listingCreated') || 'Listing created successfully!',
        [{ text: 'OK', onPress: onSuccess }]
      );
    } catch (error) {
      console.error('❌ [BUFFALO LISTING] Error:', error.response?.data || error.message);
      Alert.alert(
        t('errors.error'),
        error.response?.data?.message || error.message || 'Failed to create listing'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Basic Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="information-circle" size={20} color={COLORS.primary} />
          {' '}{t('listing.basicInfo') || 'Basic Information'}
        </Text>

        <View style={styles.inputGroup}>
          <OptionSelectField
            label={t('animal.breedName') || 'Breed Name'}
            value={formData.breedName}
            onChange={(value) => handleChange('breedName', value)}
            options={buffaloBreedOptions}
            placeholder={t('common.selectOption') || 'Select breed'}
            required
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            {t('animal.age') || 'Age/Lactation'} <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder={t('animal.agePlaceholder') || 'e.g., 4 years, 3rd lactation'}
            value={formData.age}
            onChangeText={(value) => handleChange('age', value)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            {t('animal.milkCapacity') || 'Milk Capacity (liters/day)'} <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder={t('common.example', { value: '12' }) || 'e.g., 12'}
            value={formData.milkCapacity}
            onChangeText={(value) => handleChange('milkCapacity', value)}
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Animal Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="paw" size={20} color={COLORS.primary} />
          {' '}{t('listing.animalDetails') || 'Animal Details'}
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('animal.pregnancyStatus') || 'Pregnancy Status'}</Text>
          <View style={styles.radioGroup}>
            {pregnancyOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.radioButton,
                  formData.pregnancyStatus === option.value && styles.radioButtonSelected,
                ]}
                onPress={() => handleChange('pregnancyStatus', option.value)}
              >
                <Text
                  style={[
                    styles.radioText,
                    formData.pregnancyStatus === option.value && styles.radioTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('animal.hasHorns') || 'Has Horns?'}</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={[styles.radioButton, formData.hasHorns === 'true' && styles.radioButtonSelected]}
              onPress={() => handleChange('hasHorns', 'true')}
            >
              <Text style={[styles.radioText, formData.hasHorns === 'true' && styles.radioTextSelected]}>
                {t('common.yes') || 'Yes'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.radioButton, formData.hasHorns === 'false' && styles.radioButtonSelected]}
              onPress={() => handleChange('hasHorns', 'false')}
            >
              <Text style={[styles.radioText, formData.hasHorns === 'false' && styles.radioTextSelected]}>
                {t('common.no') || 'No'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('animal.healthCondition') || 'Health Condition'}</Text>
          <View style={styles.radioGroup}>
            {healthOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.radioButton,
                  formData.healthCondition === option.value && styles.radioButtonSelected,
                ]}
                onPress={() => handleChange('healthCondition', option.value)}
              >
                <Text
                  style={[
                    styles.radioText,
                    formData.healthCondition === option.value && styles.radioTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Photos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="camera" size={20} color={COLORS.primary} />
          {' '}{t('listing.photos') || 'Photos'}
        </Text>

        <View style={styles.photosGrid}>
          <TouchableOpacity
            style={styles.photoUpload}
            onPress={() => handlePickImage('frontPhoto')}
          >
            {formData.frontPhoto ? (
              <>
                <Image source={{ uri: formData.frontPhoto.uri }} style={styles.photoPreview} />
                <TouchableOpacity
                  style={styles.removePhoto}
                  onPress={() => handleChange('frontPhoto', null)}
                >
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.photoPlaceholder}>
                <Image source={buffaloFrontGuide} style={styles.guideImage} resizeMode="contain" />
                <Text style={styles.photoLabel}>{t('animal.frontPhoto') || 'Front Photo'}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.photoUpload}
            onPress={() => handlePickImage('sidePhoto')}
          >
            {formData.sidePhoto ? (
              <>
                <Image source={{ uri: formData.sidePhoto.uri }} style={styles.photoPreview} />
                <TouchableOpacity
                  style={styles.removePhoto}
                  onPress={() => handleChange('sidePhoto', null)}
                >
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.photoPlaceholder}>
                <Image source={buffaloSideGuide} style={styles.guideImage} resizeMode="contain" />
                <Text style={styles.photoLabel}>{t('animal.sidePhoto') || 'Side Photo'}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.photoUploadFull}
          onPress={() => handlePickImage('milkScenePhoto')}
        >
          {formData.milkScenePhoto ? (
            <>
              <Image source={{ uri: formData.milkScenePhoto.uri }} style={styles.photoPreview} />
              <TouchableOpacity
                style={styles.removePhoto}
                onPress={() => handleChange('milkScenePhoto', null)}
              >
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.photoPlaceholder}>
              <Image source={buffaloTeatsGuide} style={styles.guideImage} resizeMode="contain" />
              <Text style={styles.photoLabel}>{t('animal.milkScenePhoto') || 'Milking Scene Photo (Optional)'}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.videoUpload}
          onPress={() => handlePickImage('video')}
        >
          {formData.video ? (
            <View style={styles.videoSelected}>
              <Ionicons name="videocam" size={24} color={COLORS.primary} />
              <Text style={styles.videoText}>{t('animal.videoSelected') || 'Video Selected'}</Text>
              <TouchableOpacity onPress={() => handleChange('video', null)}>
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.videoPlaceholder}>
              <Ionicons name="videocam-outline" size={32} color="#6B7280" />
              <Text style={styles.videoLabel}>{t('animal.addVideo') || 'Add Video (Optional)'}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Price & Additional Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="cash" size={20} color={COLORS.primary} />
          {' '}{t('listing.priceDetails') || 'Price & Details'}
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            {t('animal.expectedPrice') || 'Expected Price (₹)'} <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder={t('animal.pricePlaceholder') || 'e.g., 80000'}
            value={formData.expectedPrice}
            onChangeText={(value) => handleChange('expectedPrice', value)}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('animal.negotiable') || 'Negotiable?'}</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={[styles.radioButton, formData.isNegotiable === 'true' && styles.radioButtonSelected]}
              onPress={() => handleChange('isNegotiable', 'true')}
            >
              <Text style={[styles.radioText, formData.isNegotiable === 'true' && styles.radioTextSelected]}>
                {t('common.yes') || 'Yes'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.radioButton, formData.isNegotiable === 'false' && styles.radioButtonSelected]}
              onPress={() => handleChange('isNegotiable', 'false')}
            >
              <Text style={[styles.radioText, formData.isNegotiable === 'false' && styles.radioTextSelected]}>
                {t('common.no') || 'No'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.submitButtonText}>
            {t('listing.submitListing') || 'Submit Listing'}
          </Text>
        )}
      </TouchableOpacity>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    paddingBottom: 140,
  },
  section: {
    backgroundColor: '#FFF',
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  radioButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFF',
  },
  radioButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0FDF4',
  },
  radioText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  radioTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  checkboxGroup: {
    marginBottom: 16,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  photosGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  photoUpload: {
    flex: 1,
    height: 140,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    overflow: 'hidden',
  },
  photoUploadFull: {
    height: 140,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    overflow: 'hidden',
    marginBottom: 12,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removePhoto: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  guideImage: {
    width: '100%',
    height: 72,
    marginBottom: 8,
  },
  photoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  videoUpload: {
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    padding: 16,
  },
  videoPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  videoSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  videoText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    flex: 1,
    marginLeft: 8,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});

export default BuffaloListingForm;
