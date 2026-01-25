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

const HorseListingForm = ({ navigation, onSuccess }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    gender: 'male',
    breedName: '',
    age: '',
    color: '',
    height: '',
    weight: '',
    healthCondition: 'good',
    trained: 'yes',
    purpose: 'riding',
    vaccinationDetails: '',
    description: '',
    expectedPrice: '',
    isNegotiable: 'true',
    deliveryAvailable: false,
    frontPhoto: null,
    sidePhoto: null,
    video: null,
  });

  const genderOptions = [
    { value: 'male', label: t('animal.male') || 'Male' },
    { value: 'female', label: t('animal.female') || 'Female' },
  ];

  const healthOptions = [
    { value: 'excellent', label: t('animal.excellent') || 'Excellent' },
    { value: 'good', label: t('animal.good') || 'Good' },
    { value: 'average', label: t('animal.average') || 'Average' },
  ];

  const trainedOptions = [
    { value: 'yes', label: t('animal.yes') || 'Yes' },
    { value: 'partially', label: t('animal.partially') || 'Partially' },
    { value: 'no', label: t('animal.no') || 'No' },
  ];

  const purposeOptions = [
    { value: 'riding', label: t('animal.riding') || 'Riding' },
    { value: 'racing', label: t('animal.racing') || 'Racing' },
    { value: 'breeding', label: t('animal.breeding') || 'Breeding' },
    { value: 'work', label: t('animal.work') || 'Work' },
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
    if (!formData.height.trim()) {
      Alert.alert(t('errors.error'), 'Height is required');
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
    if (!formData.frontPhoto && !formData.sidePhoto) {
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

      submitData.append('gender', formData.gender);
      submitData.append('breedName', formData.breedName);
      submitData.append('age', formData.age);
      submitData.append('color', formData.color);
      submitData.append('height', formData.height);
      submitData.append('weight', formData.weight);
      submitData.append('healthCondition', formData.healthCondition);
      submitData.append('trained', formData.trained);
      submitData.append('purpose', formData.purpose);
      submitData.append('expectedPrice', formData.expectedPrice);
      submitData.append('isNegotiable', formData.isNegotiable);
      submitData.append('deliveryAvailable', formData.deliveryAvailable);
      
      if (formData.vaccinationDetails) {
        submitData.append('vaccinationDetails', formData.vaccinationDetails);
      }
      if (formData.description) {
        submitData.append('description', formData.description);
      }

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
      if (formData.video) {
        submitData.append('video', {
          uri: formData.video.uri,
          type: 'video/mp4',
          name: 'video.mp4',
        });
      }

      console.log('📤 [HORSE LISTING] Submitting to: /api/horses/listings');
      
      // Debug: Check if user is authenticated
      const storedToken = await AsyncStorage.getItem('token');
      console.log('🔑 [HORSE LISTING] Token exists:', !!storedToken);
      console.log('👤 [HORSE LISTING] User:', user ? 'Logged in' : 'Not logged in');
      
      if (!storedToken) {
        Alert.alert(
          t('errors.error'),
          'You must be logged in to create a listing. Please login first.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
        return;
      }

      const response = await api.post('/api/horses/listings', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('✅ [HORSE LISTING] Success:', response.data);

      Alert.alert(
        t('success.success'),
        t('success.listingCreated') || 'Listing created successfully!',
        [{ text: 'OK', onPress: onSuccess }]
      );
    } catch (error) {
      console.error('❌ [HORSE LISTING] Error:', error.response?.data || error.message);
      Alert.alert(
        t('errors.error'),
        error.response?.data?.message || error.message || 'Failed to create listing'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Basic Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="information-circle" size={20} color={COLORS.primary} />
          {' '}{t('listing.basicInfo') || 'Basic Information'}
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('animal.gender') || 'Gender'}</Text>
          <View style={styles.radioGroup}>
            {genderOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.radioButton,
                  formData.gender === option.value && styles.radioButtonSelected,
                ]}
                onPress={() => handleChange('gender', option.value)}
              >
                <Text
                  style={[
                    styles.radioText,
                    formData.gender === option.value && styles.radioTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            {t('animal.breedName') || 'Breed Name'} <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder={t('animal.breedNamePlaceholder') || 'e.g., Arabian, Thoroughbred, Marwari'}
            value={formData.breedName}
            onChangeText={(value) => handleChange('breedName', value)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            {t('animal.age') || 'Age'} <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder={t('animal.agePlaceholder') || 'e.g., 5 years'}
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
            placeholder="e.g., Bay, Black, Chestnut, White"
            value={formData.color}
            onChangeText={(value) => handleChange('color', value)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            {t('animal.height') || 'Height (hands or cm)'} <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 15 hands or 150 cm"
            value={formData.height}
            onChangeText={(value) => handleChange('height', value)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            {t('animal.weight') || 'Weight (kg)'} <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 450"
            value={formData.weight}
            onChangeText={(value) => handleChange('weight', value)}
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Health & Training */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="fitness" size={20} color={COLORS.primary} />
          {' '}{t('listing.healthTraining') || 'Health & Training'}
        </Text>

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
          <Text style={styles.label}>{t('animal.trained') || 'Trained?'}</Text>
          <View style={styles.radioGroup}>
            {trainedOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.radioButton,
                  formData.trained === option.value && styles.radioButtonSelected,
                ]}
                onPress={() => handleChange('trained', option.value)}
              >
                <Text
                  style={[
                    styles.radioText,
                    formData.trained === option.value && styles.radioTextSelected,
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

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('animal.vaccinationDetails') || 'Vaccination Details (Optional)'}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={t('animal.vaccinationPlaceholder') || 'List vaccinations...'}
            value={formData.vaccinationDetails}
            onChangeText={(value) => handleChange('vaccinationDetails', value)}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('animal.description') || 'Description (Optional)'}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={t('animal.descriptionPlaceholder') || 'Temperament, training level, special features...'}
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

      {/* Price & Delivery */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="cash" size={20} color={COLORS.primary} />
          {' '}{t('listing.priceDetails') || 'Price & Delivery'}
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            {t('animal.expectedPrice') || 'Expected Price (₹)'} <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 100000"
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

        <View style={styles.checkboxGroup}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => handleChange('deliveryAvailable', !formData.deliveryAvailable)}
          >
            <Ionicons
              name={formData.deliveryAvailable ? 'checkbox' : 'square-outline'}
              size={24}
              color={formData.deliveryAvailable ? COLORS.primary : '#9CA3AF'}
            />
            <Text style={styles.checkboxLabel}>{t('animal.deliveryAvailable') || 'Delivery Available'}</Text>
          </TouchableOpacity>
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

      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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

export default HorseListingForm;
