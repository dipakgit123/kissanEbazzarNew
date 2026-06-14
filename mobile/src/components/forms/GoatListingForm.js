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
import { getGoatBreedOptions } from '../../constants/goatBreeds';

const GoatListingForm = ({ navigation, onSuccess }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const goatBreedOptions = getGoatBreedOptions(
    i18n.resolvedLanguage || i18n.language,
    t('common.selectOption') || 'Select breed'
  );

  const [formData, setFormData] = useState({
    goatType: 'male',
    breedName: '',
    age: '',
    weight: '',
    color: '',
    hornType: 'with_horns',
    healthStatus: 'healthy',
    purpose: 'milk',
    description: '',
    milkCapacity: '',
    lastDeliveryDate: '',
    numberOfKidsDelivered: '',
    expectedPrice: '',
    isNegotiable: 'true',
    frontPhoto: null,
    sidePhoto: null,
    photo3: null,
    photo4: null,
    photo5: null,
    video: null,
  });

  const goatTypeOptions = [
    { value: 'male', label: t('common.male') || 'Male' },
    { value: 'female', label: t('common.female') || 'Female' },
  ];

  const hornTypeOptions = [
    { value: 'with_horns', label: t('animal.withHorns') || 'With Horns' },
    { value: 'without_horns', label: t('animal.withoutHorns') || 'Without Horns' },
    { value: 'dehorned', label: t('animal.dehorned') || 'Dehorned' },
  ];

  const healthOptions = [
    { value: 'healthy', label: t('animal.healthy') || 'Healthy' },
    { value: 'sick', label: t('animal.sick') || 'Sick' },
    { value: 'recovering', label: t('animal.recovering') || 'Recovering' },
  ];

  const purposeOptions = [
    { value: 'milk', label: t('animal.milk') || 'Milk' },
    { value: 'meat', label: t('animal.meat') || 'Meat' },
    { value: 'breeding', label: t('animal.breeding') || 'Breeding' },
    { value: 'pet', label: t('animal.pet') || 'Pet' },
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
    if (!formData.weight.trim()) {
      Alert.alert(t('errors.error'), 'Weight is required');
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

      submitData.append('goatType', formData.goatType);
      submitData.append('breedName', formData.breedName);
      submitData.append('age', formData.age);
      submitData.append('weight', formData.weight);
      submitData.append('hornType', formData.hornType);
      submitData.append('healthStatus', formData.healthStatus);
      submitData.append('purpose', formData.purpose);
      submitData.append('expectedPrice', formData.expectedPrice);
      submitData.append('isNegotiable', formData.isNegotiable);
      
      if (formData.color) {
        submitData.append('color', formData.color);
      }
      if (formData.description) {
        submitData.append('description', formData.description);
      }
      if (formData.milkCapacity) {
        submitData.append('milkCapacity', formData.milkCapacity);
      }
      if (formData.lastDeliveryDate) {
        submitData.append('lastDeliveryDate', formData.lastDeliveryDate);
      }
      if (formData.numberOfKidsDelivered) {
        submitData.append('numberOfKidsDelivered', formData.numberOfKidsDelivered);
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

      console.log('📤 [GOAT LISTING] Submitting to: /api/goats/listings');
      
      // Debug: Check if user is authenticated
      const storedToken = await AsyncStorage.getItem('token');
      console.log('🔑 [GOAT LISTING] Token exists:', !!storedToken);
      console.log('👤 [GOAT LISTING] User:', user ? 'Logged in' : 'Not logged in');
      
      if (!storedToken) {
        Alert.alert(
          t('errors.error'),
          'You must be logged in to create a listing. Please login first.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
        return;
      }

      const response = await api.post('/api/goats/listings', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('✅ [GOAT LISTING] Success:', response.data);

      Alert.alert(
        t('success.success'),
        t('success.listingCreated') || 'Listing created successfully!',
        [{ text: 'OK', onPress: onSuccess }]
      );
    } catch (error) {
      console.error('❌ [GOAT LISTING] Error:', error.response?.data || error.message);
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
          <Text style={styles.label}>{t('animal.goatType') || 'Goat Type'}</Text>
          <View style={styles.radioGroup}>
            {goatTypeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.radioButton,
                  formData.goatType === option.value && styles.radioButtonSelected,
                ]}
                onPress={() => handleChange('goatType', option.value)}
              >
                <Text
                  style={[
                    styles.radioText,
                    formData.goatType === option.value && styles.radioTextSelected,
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
            options={goatBreedOptions}
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
            placeholder={t('animal.agePlaceholder') || 'e.g., 2 years'}
            value={formData.age}
            onChangeText={(value) => handleChange('age', value)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            {t('animal.weight') || 'Weight (kg)'} <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder={t('animal.weightPlaceholder') || 'e.g., 35'}
            value={formData.weight}
            onChangeText={(value) => handleChange('weight', value)}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('animal.color') || 'Color (Optional)'}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('animal.colorPlaceholder') || 'e.g., White, Black, Brown'}
            value={formData.color}
            onChangeText={(value) => handleChange('color', value)}
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
          <Text style={styles.label}>{t('animal.hornType') || 'Horn Type'}</Text>
          <View style={styles.radioGroup}>
            {hornTypeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.radioButton,
                  formData.hornType === option.value && styles.radioButtonSelected,
                ]}
                onPress={() => handleChange('hornType', option.value)}
              >
                <Text
                  style={[
                    styles.radioText,
                    formData.hornType === option.value && styles.radioTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('animal.healthStatus') || 'Health Status'}</Text>
          <View style={styles.radioGroup}>
            {healthOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.radioButton,
                  formData.healthStatus === option.value && styles.radioButtonSelected,
                ]}
                onPress={() => handleChange('healthStatus', option.value)}
              >
                <Text
                  style={[
                    styles.radioText,
                    formData.healthStatus === option.value && styles.radioTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('animal.purpose') || 'Purpose'}</Text>
          <View style={styles.radioGroup}>
            {purposeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.radioButton,
                  formData.purpose === option.value && styles.radioButtonSelected,
                ]}
                onPress={() => handleChange('purpose', option.value)}
              >
                <Text
                  style={[
                    styles.radioText,
                    formData.purpose === option.value && styles.radioTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {formData.purpose === 'milk' && (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('animal.milkCapacity') || 'Milk Capacity (liters/day)'}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('common.example', { value: '2' }) || 'e.g., 2'}
                value={formData.milkCapacity}
                onChangeText={(value) => handleChange('milkCapacity', value)}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('animal.lastDeliveryDate') || 'Last Delivery Date (Optional)'}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('animal.lastDeliveryDatePlaceholder') || 'e.g., Jan 2025'}
                value={formData.lastDeliveryDate}
                onChangeText={(value) => handleChange('lastDeliveryDate', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('animal.numberOfKidsDelivered') || 'Number of Kids Delivered'}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('animal.countPlaceholder') || 'e.g., 2'}
                value={formData.numberOfKidsDelivered}
                onChangeText={(value) => handleChange('numberOfKidsDelivered', value)}
                keyboardType="numeric"
              />
            </View>
          </>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('animal.description') || 'Description (Optional)'}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={t('animal.descriptionPlaceholder') || 'Any additional details...'}
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
            placeholder={t('animal.pricePlaceholder') || 'e.g., 15000'}
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

export default GoatListingForm;
