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
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import OptionSelectField from '../OptionSelectField';
import { getOtherAnimalBreedOptions } from '../../constants/otherAnimalBreeds';

const OtherAnimalListingForm = ({ navigation, onSuccess }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showAnimalTypePicker, setShowAnimalTypePicker] = useState(false);

  const [formData, setFormData] = useState({
    animalType: 'sheep',
    breedName: '',
    age: '',
    gender: 'male',
    weight: '',
    color: '',
    healthCondition: 'excellent',
    temperament: 'friendly',
    isTrainedForWork: false,
    specialSkills: '',
    expectedPrice: '',
    isNegotiable: true,
    frontPhoto: null,
    sidePhoto: null,
    additionalPhoto: null,
    video: null,
  });

  const animalTypeOptions = [
    { value: 'sheep', label: t('animalTypes.sheep') || 'Sheep' },
    { value: 'pig', label: t('animalTypes.pig') || 'Pig' },
    { value: 'rabbit', label: t('animalTypes.rabbit') || 'Rabbit' },
    { value: 'chicken', label: t('animalTypes.chicken') || 'Chicken' },
    { value: 'duck', label: t('animalTypes.duck') || 'Duck' },
    { value: 'turkey', label: t('animalTypes.turkey') || 'Turkey' },
    { value: 'camel', label: t('animalTypes.camel') || 'Camel' },
    { value: 'donkey', label: t('animalTypes.donkey') || 'Donkey' },
    { value: 'mule', label: t('animalTypes.mule') || 'Mule' },
    { value: 'exotic', label: t('animalTypes.exotic') || 'Exotic' },
    { value: 'other', label: t('animalTypes.other') || 'Other' },
  ];

  const genderOptions = [
    { value: 'male', label: t('animal.male') || 'Male' },
    { value: 'female', label: t('animal.female') || 'Female' },
  ];

  const healthOptions = [
    { value: 'excellent', label: t('animal.excellent') || 'Excellent' },
    { value: 'good', label: t('animal.good') || 'Good' },
    { value: 'average', label: t('animal.average') || 'Average' },
  ];

  const temperamentOptions = [
    { value: 'friendly', label: t('animal.friendly') || 'Friendly' },
    { value: 'calm', label: t('animal.calm') || 'Calm' },
    { value: 'energetic', label: t('animal.energetic') || 'Energetic' },
    { value: 'protective', label: t('animal.protective') || 'Protective' },
    { value: 'independent', label: t('animal.independent') || 'Independent' },
  ];
  const otherBreedOptions = getOtherAnimalBreedOptions(
    formData.animalType,
    i18n.resolvedLanguage || i18n.language,
    t('common.selectOption') || 'Select breed'
  );

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
    if (!formData.animalType) {
      Alert.alert(t('errors.error'), 'Animal type is required');
      return false;
    }
    if (!formData.breedName.trim()) {
      Alert.alert(t('errors.error'), 'Breed name is required');
      return false;
    }
    if (!formData.age.trim()) {
      Alert.alert(t('errors.error'), 'Age is required');
      return false;
    }
    if (!formData.expectedPrice.trim()) {
      Alert.alert(t('errors.error'), 'Expected price is required');
      return false;
    }
    if (!formData.frontPhoto && !formData.sidePhoto && !formData.additionalPhoto) {
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

      submitData.append('animalType', formData.animalType);
      submitData.append('breedName', formData.breedName);
      submitData.append('age', formData.age);
      submitData.append('gender', formData.gender);
      submitData.append('healthCondition', formData.healthCondition);
      submitData.append('temperament', formData.temperament);
      submitData.append('isTrainedForWork', formData.isTrainedForWork);
      submitData.append('expectedPrice', formData.expectedPrice);
      submitData.append('isNegotiable', formData.isNegotiable);
      
      if (formData.weight) {
        submitData.append('weight', formData.weight);
      }
      if (formData.color) {
        submitData.append('color', formData.color);
      }
      if (formData.specialSkills) {
        submitData.append('specialSkills', formData.specialSkills);
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
      if (formData.additionalPhoto) {
        submitData.append('additionalPhoto', {
          uri: formData.additionalPhoto.uri,
          type: 'image/jpeg',
          name: 'additional.jpg',
        });
      }
      if (formData.video) {
        submitData.append('video', {
          uri: formData.video.uri,
          type: 'video/mp4',
          name: 'video.mp4',
        });
      }

      console.log('📤 [OTHER ANIMAL LISTING] Submitting to: /api/other-animals/listings');
      console.log('🌐 [OTHER ANIMAL LISTING] Server URL:', api.defaults.baseURL);
      console.log('🔗 [OTHER ANIMAL LISTING] Full endpoint:', `${api.defaults.baseURL}/api/other-animals/listings`);
      
      // Debug: Check if user is authenticated
      const storedToken = await AsyncStorage.getItem('token');
      console.log('🔑 [OTHER ANIMAL LISTING] Token exists:', !!storedToken);
      console.log('👤 [OTHER ANIMAL LISTING] User:', user ? 'Logged in' : 'Not logged in');
      
      if (!storedToken) {
        Alert.alert(
          t('errors.error'),
          'You must be logged in to create a listing. Please login first.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
        setLoading(false);
        return;
      }

      console.log('📦 [OTHER ANIMAL LISTING] Form data summary:', {
        animalType: formData.animalType,
        breedName: formData.breedName,
        age: formData.age,
        gender: formData.gender,
        expectedPrice: formData.expectedPrice,
        hasPhotos: !!(formData.frontPhoto || formData.sidePhoto)
      });

      const response = await api.post('/api/other-animals/listings', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds timeout
      });

      console.log('✅ [OTHER ANIMAL LISTING] Success:', response.data);

      Alert.alert(
        t('success.success'),
        t('success.listingCreated') || 'Listing created successfully!',
        [{ text: 'OK', onPress: onSuccess }]
      );
    } catch (error) {
      console.error('❌ [OTHER ANIMAL LISTING] Error Details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          method: error.config?.method
        }
      });

      let errorMessage = 'Failed to create listing. Please try again.';
      
      if (error.message === 'Network Error') {
        errorMessage = 'Cannot connect to server. Please check:\n' +
                      '1. Server is running on port 5000\n' +
                      '2. Your device is on the same network\n' +
                      '3. Firewall allows connections';
      } else if (error.response?.status === 404) {
        errorMessage = 'API endpoint not found (404). Server may need to be restarted.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please login again.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors.map(e => e.msg).join('\n');
      }

      Alert.alert(
        t('errors.error'),
        errorMessage
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
          <Text style={styles.label}>
            {t('animal.animalType') || 'Animal Type'} <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowAnimalTypePicker(true)}
          >
            <Text style={styles.pickerButtonText}>
              {animalTypeOptions.find(opt => opt.value === formData.animalType)?.label || 'Select Animal Type'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Animal Type Picker Modal */}
        <Modal
          visible={showAnimalTypePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowAnimalTypePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('animal.selectAnimalType') || 'Select Animal Type'}</Text>
                <TouchableOpacity onPress={() => setShowAnimalTypePicker(false)}>
                  <Ionicons name="close" size={24} color="#111827" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalList}>
                {animalTypeOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.modalItem,
                      formData.animalType === option.value && styles.modalItemSelected
                    ]}
                    onPress={() => {
                      handleChange('animalType', option.value);
                      handleChange('breedName', '');
                      setShowAnimalTypePicker(false);
                    }}
                  >
                    <Text style={[
                      styles.modalItemText,
                      formData.animalType === option.value && styles.modalItemTextSelected
                    ]}>
                      {option.label}
                    </Text>
                    {formData.animalType === option.value && (
                      <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

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
          <OptionSelectField
            label={t('animal.breedName') || 'Breed/Type Name'}
            value={formData.breedName}
            onChange={(value) => handleChange('breedName', value)}
            options={otherBreedOptions}
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
            placeholder={t('animal.agePlaceholder') || 'e.g., 2 years, 6 months'}
            value={formData.age}
            onChangeText={(value) => handleChange('age', value)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('animal.weight') || 'Weight (kg) (Optional)'}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('animal.weightPlaceholder') || 'e.g., 40'}
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

      {/* Health & Temperament */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="fitness" size={20} color={COLORS.primary} />
          {' '}{t('listing.healthTemperament') || 'Health & Temperament'}
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
          <Text style={styles.label}>{t('animal.temperament') || 'Temperament'}</Text>
          <View style={styles.radioGroup}>
            {temperamentOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.radioButton,
                  formData.temperament === option.value && styles.radioButtonSelected,
                ]}
                onPress={() => handleChange('temperament', option.value)}
              >
                <Text
                  style={[
                    styles.radioText,
                    formData.temperament === option.value && styles.radioTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.checkboxGroup}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => handleChange('isTrainedForWork', !formData.isTrainedForWork)}
          >
            <Ionicons
              name={formData.isTrainedForWork ? 'checkbox' : 'square-outline'}
              size={24}
              color={formData.isTrainedForWork ? COLORS.primary : '#9CA3AF'}
            />
            <Text style={styles.checkboxLabel}>{t('animal.trainedForWork') || 'Trained for Work'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('animal.specialSkills') || 'Special Skills (Optional)'}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={t('animal.specialSkillsPlaceholder') || 'Any special abilities or training...'}
            value={formData.specialSkills}
            onChangeText={(value) => handleChange('specialSkills', value)}
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
          style={styles.photoUploadFull}
          onPress={() => handlePickImage('additionalPhoto')}
        >
          {formData.additionalPhoto ? (
            <>
              <Image source={{ uri: formData.additionalPhoto.uri }} style={styles.photoPreview} />
              <TouchableOpacity
                style={styles.removePhoto}
                onPress={() => handleChange('additionalPhoto', null)}
              >
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera" size={32} color={COLORS.primary} />
              <Text style={styles.photoLabel}>{t('animal.additionalPhoto') || 'Additional Photo (Optional)'}</Text>
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

      {/* Price Details */}
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
            placeholder={t('animal.pricePlaceholder') || 'e.g., 10000'}
            value={formData.expectedPrice}
            onChangeText={(value) => handleChange('expectedPrice', value)}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.checkboxGroup}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => handleChange('isNegotiable', !formData.isNegotiable)}
          >
            <Ionicons
              name={formData.isNegotiable ? 'checkbox' : 'square-outline'}
              size={24}
              color={formData.isNegotiable ? COLORS.primary : '#9CA3AF'}
            />
            <Text style={styles.checkboxLabel}>{t('animal.negotiable') || 'Price is Negotiable'}</Text>
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
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFF',
  },
  pickerButtonText: {
    fontSize: 14,
    color: '#111827',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalList: {
    padding: 8,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginVertical: 4,
  },
  modalItemSelected: {
    backgroundColor: '#F0FDF4',
  },
  modalItemText: {
    fontSize: 16,
    color: '#374151',
  },
  modalItemTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
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

export default OtherAnimalListingForm;
