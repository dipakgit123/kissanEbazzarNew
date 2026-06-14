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
import { getCatBreedOptions } from '../../constants/catBreeds';

const CatListingForm = ({ navigation, onSuccess }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const catBreedOptions = getCatBreedOptions(
    i18n.resolvedLanguage || i18n.language,
    t('common.selectOption') || 'Select breed'
  );

  const [formData, setFormData] = useState({
    catType: 'male',
    breedName: '',
    age: '',
    color: '',
    weight: '',
    eyeColor: '',
    furType: 'short',
    vaccinationStatus: 'yes',
    healthCondition: 'healthy',
    behavior: 'friendly',
    description: '',
    expectedPrice: '',
    isNegotiable: 'true',
    frontPhoto: null,
    sidePhoto: null,
    photo3: null,
    photo4: null,
    photo5: null,
    video: null,
  });

  const catTypeOptions = [
    { value: 'male', label: t('common.male') || 'Male' },
    { value: 'female', label: t('common.female') || 'Female' },
  ];

  const furTypeOptions = [
    { value: 'short', label: t('animal.short') || 'Short' },
    { value: 'long', label: t('animal.long') || 'Long' },
    { value: 'medium', label: t('animal.medium') || 'Medium' },
  ];

  const vaccinationOptions = [
    { value: 'yes', label: t('common.yes') || 'Yes' },
    { value: 'no', label: t('common.no') || 'No' },
    { value: 'partial', label: t('animal.partial') || 'Partial' },
  ];

  const healthOptions = [
    { value: 'healthy', label: t('animal.healthy') || 'Healthy' },
    { value: 'needs_attention', label: t('animal.needsAttention') || 'Needs Attention' },
  ];

  const behaviorOptions = [
    { value: 'friendly', label: t('animal.friendly') || 'Friendly' },
    { value: 'aggressive', label: t('animal.aggressive') || 'Aggressive' },
    { value: 'shy', label: t('animal.shy') || 'Shy' },
    { value: 'playful', label: t('animal.playful') || 'Playful' },
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
    if (!formData.color.trim()) {
      Alert.alert(t('errors.error'), 'Color is required');
      return false;
    }
    if (!formData.expectedPrice.trim()) {
      Alert.alert(t('errors.error'), 'Expected price is required');
      return false;
    }
    if (!formData.frontPhoto && !formData.sidePhoto && !formData.photo3 && !formData.photo4 && !formData.photo5) {
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

      submitData.append('catType', formData.catType);
      submitData.append('breedName', formData.breedName);
      submitData.append('age', formData.age);
      submitData.append('color', formData.color);
      submitData.append('furType', formData.furType);
      submitData.append('vaccinationStatus', formData.vaccinationStatus);
      submitData.append('healthCondition', formData.healthCondition);
      submitData.append('behavior', formData.behavior);
      submitData.append('expectedPrice', formData.expectedPrice);
      submitData.append('isNegotiable', formData.isNegotiable);
      
      if (formData.weight) {
        submitData.append('weight', formData.weight);
      }
      if (formData.eyeColor) {
        submitData.append('eyeColor', formData.eyeColor);
      }
      if (formData.description) {
        submitData.append('description', formData.description);
      }

      if (formData.frontPhoto) {
        submitData.append('photo1', {
          uri: formData.frontPhoto.uri,
          type: 'image/jpeg',
          name: 'photo1.jpg',
        });
      }
      if (formData.sidePhoto) {
        submitData.append('photo2', {
          uri: formData.sidePhoto.uri,
          type: 'image/jpeg',
          name: 'photo2.jpg',
        });
      }
      if (formData.photo3) {
        submitData.append('photo3', {
          uri: formData.photo3.uri,
          type: 'image/jpeg',
          name: 'photo3.jpg',
        });
      }
      if (formData.photo4) {
        submitData.append('photo4', {
          uri: formData.photo4.uri,
          type: 'image/jpeg',
          name: 'photo4.jpg',
        });
      }
      if (formData.photo5) {
        submitData.append('photo5', {
          uri: formData.photo5.uri,
          type: 'image/jpeg',
          name: 'photo5.jpg',
        });
      }
      if (formData.video) {
        submitData.append('video', {
          uri: formData.video.uri,
          type: 'video/mp4',
          name: 'video.mp4',
        });
      }

      console.log('📤 [CAT LISTING] Submitting to: /api/cats/listings');
      
      // Debug: Check if user is authenticated
      const storedToken = await AsyncStorage.getItem('token');
      console.log('🔑 [CAT LISTING] Token exists:', !!storedToken);
      console.log('👤 [CAT LISTING] User:', user ? 'Logged in' : 'Not logged in');
      
      if (!storedToken) {
        Alert.alert(
          t('errors.error'),
          'You must be logged in to create a listing. Please login first.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
        return;
      }

      const response = await api.post('/api/cats/listings', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('✅ [CAT LISTING] Success:', response.data);

      Alert.alert(
        t('success.success'),
        t('success.listingCreated') || 'Listing created successfully!',
        [{ text: 'OK', onPress: onSuccess }]
      );
    } catch (error) {
      console.error('❌ [CAT LISTING] Error:', error.response?.data || error.message);
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
          <Text style={styles.label}>{t('animal.catType') || 'Cat Type'}</Text>
          <View style={styles.radioGroup}>
            {catTypeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.radioButton,
                  formData.catType === option.value && styles.radioButtonSelected,
                ]}
                onPress={() => handleChange('catType', option.value)}
              >
                <Text
                  style={[
                    styles.radioText,
                    formData.catType === option.value && styles.radioTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <OptionSelectField
            label={t('animal.breedName') || 'Breed Name'}
            value={formData.breedName}
            onChange={(value) => handleChange('breedName', value)}
            options={catBreedOptions}
            placeholder={t('common.selectOption') || 'Select breed'}
            required
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            {t('animal.age') || 'Age'} <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder={t('animal.agePlaceholder') || 'e.g., 1 year, 8 months'}
            value={formData.age}
            onChangeText={(value) => handleChange('age', value)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            {t('animal.color') || 'Color'} <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder={t('animal.colorPlaceholder') || 'e.g., White, Black, Brown'}
            value={formData.color}
            onChangeText={(value) => handleChange('color', value)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('animal.weight') || 'Weight (kg) (Optional)'}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('common.example', { value: '4' }) || 'e.g., 4'}
            value={formData.weight}
            onChangeText={(value) => handleChange('weight', value)}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('animal.eyeColor') || 'Eye Color (Optional)'}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('animal.eyeColorPlaceholder') || 'e.g., Blue, Green, Amber'}
            value={formData.eyeColor}
            onChangeText={(value) => handleChange('eyeColor', value)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('animal.furType') || 'Fur Type'}</Text>
          <View style={styles.radioGroup}>
            {furTypeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.radioButton,
                  formData.furType === option.value && styles.radioButtonSelected,
                ]}
                onPress={() => handleChange('furType', option.value)}
              >
                <Text
                  style={[
                    styles.radioText,
                    formData.furType === option.value && styles.radioTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Health & Behavior */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="fitness" size={20} color={COLORS.primary} />
          {' '}{t('listing.healthBehavior') || 'Health & Behavior'}
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('animal.vaccinationStatus') || 'Vaccination Status'}</Text>
          <View style={styles.radioGroup}>
            {vaccinationOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.radioButton,
                  formData.vaccinationStatus === option.value && styles.radioButtonSelected,
                ]}
                onPress={() => handleChange('vaccinationStatus', option.value)}
              >
                <Text
                  style={[
                    styles.radioText,
                    formData.vaccinationStatus === option.value && styles.radioTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
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

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('animal.behavior') || 'Behavior'}</Text>
          <View style={styles.radioGroup}>
            {behaviorOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.radioButton,
                  formData.behavior === option.value && styles.radioButtonSelected,
                ]}
                onPress={() => handleChange('behavior', option.value)}
              >
                <Text
                  style={[
                    styles.radioText,
                    formData.behavior === option.value && styles.radioTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('animal.description') || 'Description (Optional)'}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={t('animal.descriptionPlaceholder') || 'Temperament, habits, special features...'}
            value={formData.description}
            onChangeText={(value) => handleChange('description', value)}
            multiline
            numberOfLines={3}
          />
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
                <Ionicons name="camera" size={32} color={COLORS.primary} />
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
                <Ionicons name="camera" size={32} color={COLORS.primary} />
                <Text style={styles.photoLabel}>{t('animal.sidePhoto') || 'Side Photo'}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.photoUpload}
            onPress={() => handlePickImage('photo3')}
          >
            {formData.photo3 ? (
              <>
                <Image source={{ uri: formData.photo3.uri }} style={styles.photoPreview} />
                <TouchableOpacity
                  style={styles.removePhoto}
                  onPress={() => handleChange('photo3', null)}
                >
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera" size={32} color={COLORS.primary} />
                <Text style={styles.photoLabel}>{t('animal.additionalPhoto') || 'Additional Photo'}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.photoUpload}
            onPress={() => handlePickImage('photo4')}
          >
            {formData.photo4 ? (
              <>
                <Image source={{ uri: formData.photo4.uri }} style={styles.photoPreview} />
                <TouchableOpacity
                  style={styles.removePhoto}
                  onPress={() => handleChange('photo4', null)}
                >
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera" size={32} color={COLORS.primary} />
                <Text style={styles.photoLabel}>{t('animal.additionalPhoto') || 'Additional Photo'}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.photoUpload}
            onPress={() => handlePickImage('photo5')}
          >
            {formData.photo5 ? (
              <>
                <Image source={{ uri: formData.photo5.uri }} style={styles.photoPreview} />
                <TouchableOpacity
                  style={styles.removePhoto}
                  onPress={() => handleChange('photo5', null)}
                >
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera" size={32} color={COLORS.primary} />
                <Text style={styles.photoLabel}>{t('animal.additionalPhoto') || 'Additional Photo'}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

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

      {/* Price */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="cash" size={20} color={COLORS.primary} />
          {' '}{t('listing.priceDetails') || 'Price Details'}
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            {t('animal.expectedPrice') || 'Expected Price (₹)'} <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder={t('animal.pricePlaceholder') || 'e.g., 5000'}
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
  },
  photoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
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

export default CatListingForm;
