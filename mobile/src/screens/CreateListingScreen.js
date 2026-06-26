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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../utils/constants';
import { animalListingService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AppHeader from '../components/AppHeader';

const CreateListingScreen = ({ route, navigation }) => {
  const { category } = route.params;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [form, setForm] = useState({
    breedName: '',
    age: '',
    price: '',
    description: '',
    healthStatus: 'Healthy',
    gender: 'Male',
    weight: '',
    milkCapacity: '',
    isPregnant: false,
    lactationStatus: '',
  });

  const healthOptions = ['Healthy', 'Good', 'Fair', 'Under Treatment'];
  const genderOptions = ['Male', 'Female'];
  const lactationOptions = ['Milking', 'Dry', 'Not Applicable'];

  const handlePickImages = async () => {
    if (images.length >= 5) {
      Alert.alert('Limit Reached', 'You can upload maximum 5 images');
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5 - images.length,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map((asset) => asset.uri);
      setImages([...images, ...newImages].slice(0, 5));
    }
  };

  const handleRemoveImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleTakePhoto = async () => {
    if (images.length >= 5) {
      Alert.alert('Limit Reached', 'You can upload maximum 5 images');
      return;
    }

    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your camera.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const validateForm = () => {
    if (!form.breedName.trim()) {
      Alert.alert('Error', 'Please enter breed name');
      return false;
    }
    if (!form.age.trim()) {
      Alert.alert('Error', 'Please enter age');
      return false;
    }
    if (!form.price.trim() || isNaN(Number(form.price))) {
      Alert.alert('Error', 'Please enter a valid price');
      return false;
    }
    if (images.length === 0) {
      Alert.alert('Error', 'Please add at least one photo');
      return false;
    }
    return true;
  };

  // Get the correct endpoint based on animal category
  const getAnimalEndpoint = (categoryId) => {
    const endpoints = {
      'cow': 'animals',
      'buffalo': 'buffalos',
      'goat': 'goats',
      'horse': 'horses',
      'dog': 'dogs',
      'cat': 'cats',
      'bull': 'animals',
      'other': 'other-animals'
    };
    return endpoints[categoryId?.toLowerCase()] || 'animals';
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Get the correct endpoint
      const endpoint = getAnimalEndpoint(category.id);
      
      // Prepare form data for multipart upload
      const formData = new FormData();
      
      // Add basic fields based on animal type
      if (endpoint === 'buffalos' || endpoint === 'animals') {
        // Buffalo/Cow fields
        formData.append('breedName', form.breedName);
        formData.append('age', form.age);
        formData.append('milkCapacity', form.milkCapacity || '0');
        formData.append('pregnancyStatus', form.isPregnant ? 'pregnant' : 'not_pregnant');
        formData.append('hasHorns', 'false');
        formData.append('healthCondition', form.healthStatus.toLowerCase());
        formData.append('expectedPrice', form.price);
        formData.append('isNegotiable', 'true');
        formData.append('vaccinationDetails', form.description || '');
        formData.append('deliveryAvailable', 'false');
        formData.append('additionalNotes', form.description || '');
      } else if (endpoint === 'horses') {
        // Horse fields
        formData.append('breedName', form.breedName);
        formData.append('age', form.age);
        formData.append('gender', form.gender.toLowerCase());
        formData.append('purpose', 'riding');
        formData.append('healthCondition', form.healthStatus.toLowerCase());
        formData.append('expectedPrice', form.price);
        formData.append('isNegotiable', 'true');
        formData.append('vaccinationDetails', form.description || '');
        formData.append('deliveryAvailable', 'false');
        formData.append('additionalNotes', form.description || '');
      } else if (endpoint === 'goats') {
        // Goat fields
        formData.append('goatType', form.gender.toLowerCase());
        formData.append('breedName', form.breedName);
        formData.append('age', form.age);
        formData.append('weight', form.weight || '50');
        formData.append('color', 'white');
        formData.append('hornType', 'with_horns');
        formData.append('healthStatus', form.healthStatus.toLowerCase());
        formData.append('purpose', 'milk');
        formData.append('expectedPrice', form.price);
        formData.append('isNegotiable', 'true');
        formData.append('detailsConfirmed', 'true');
        formData.append('termsAccepted', 'true');
        formData.append('additionalNotes', form.description || '');
      } else if (endpoint === 'dogs' || endpoint === 'cats') {
        // Dog/Cat fields
        const typeField = endpoint === 'dogs' ? 'dogType' : 'catType';
        formData.append(typeField, form.gender.toLowerCase());
        formData.append('breedName', form.breedName);
        formData.append('age', form.age);
        formData.append('color', 'brown');
        formData.append('weight', form.weight || '10');
        
        if (endpoint === 'dogs') {
          formData.append('height', '50');
          formData.append('trained', 'no');
          formData.append('behavior', 'friendly');
          formData.append('purpose', 'pet');
        } else {
          formData.append('eyeColor', 'brown');
          formData.append('furType', 'short');
          formData.append('behavior', 'friendly');
        }
        
        formData.append('vaccinationStatus', 'yes');
        formData.append('healthCondition', form.healthStatus.toLowerCase());
        formData.append('expectedPrice', form.price);
        formData.append('isNegotiable', 'true');
        formData.append('detailsConfirmed', 'true');
        formData.append('termsAccepted', 'true');
        formData.append('additionalNotes', form.description || '');
      } else {
        // Other animals
        formData.append('animalType', category.name || 'Other');
        formData.append('breedName', form.breedName || 'Local');
        formData.append('age', form.age);
        formData.append('gender', form.gender.toLowerCase());
        formData.append('healthCondition', form.healthStatus.toLowerCase());
        formData.append('expectedPrice', form.price);
        formData.append('isNegotiable', 'true');
        formData.append('vaccinationDetails', form.description || '');
        formData.append('deliveryAvailable', 'false');
        formData.append('additionalNotes', form.description || '');
      }
      
      // Add photos
      images.forEach((image, index) => {
        const photoField = (endpoint === 'goats' || endpoint === 'dogs' || endpoint === 'cats') 
          ? `photo${index + 1}` 
          : index === 0 ? 'frontPhoto' : 'sidePhoto';
        
        formData.append(photoField, {
          uri: image.uri,
          type: 'image/jpeg',
          name: `photo_${index + 1}.jpg`,
        });
      });

      const response = await animalListingService.createListing(endpoint, formData);

      if (response.success) {
        Alert.alert('Success', 'Your listing has been created successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to create listing');
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const renderOptionButtons = (options, currentValue, onSelect) => (
    <View style={styles.optionsRow}>
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          style={[
            styles.optionButton,
            currentValue === option && styles.optionButtonActive,
          ]}
          onPress={() => onSelect(option)}
        >
          <Text
            style={[
              styles.optionButtonText,
              currentValue === option && styles.optionButtonTextActive,
            ]}
          >
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <AppHeader
        navigation={navigation}
        title={`List Your ${category.name}`}
        subtitle="Add photos and animal details"
        leftIcon="close"
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Upload Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <Text style={styles.sectionHint}>Add up to 5 photos</Text>

          <View style={styles.imagesContainer}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.uploadedImage} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => handleRemoveImage(index)}
                >
                  <Ionicons name="close-circle" size={24} color={COLORS.red} />
                </TouchableOpacity>
                {index === 0 && (
                  <View style={styles.mainBadge}>
                    <Text style={styles.mainBadgeText}>Main</Text>
                  </View>
                )}
              </View>
            ))}

            {images.length < 5 && (
              <View style={styles.addImageButtons}>
                <TouchableOpacity
                  style={styles.addImageButton}
                  onPress={handlePickImages}
                >
                  <Ionicons name="images-outline" size={24} color={COLORS.primary} />
                  <Text style={styles.addImageText}>Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addImageButton}
                  onPress={handleTakePhoto}
                >
                  <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
                  <Text style={styles.addImageText}>Camera</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Basic Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Breed Name *</Text>
            <TextInput
              style={styles.input}
              value={form.breedName}
              onChangeText={(text) => setForm({ ...form, breedName: text })}
              placeholder="e.g., Gir, Murrah, Jamunapari"
              placeholderTextColor={COLORS.gray}
            />
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Age *</Text>
              <TextInput
                style={styles.input}
                value={form.age}
                onChangeText={(text) => setForm({ ...form, age: text })}
                placeholder="e.g., 3 years"
                placeholderTextColor={COLORS.gray}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                value={form.weight}
                onChangeText={(text) => setForm({ ...form, weight: text })}
                placeholder="e.g., 350"
                placeholderTextColor={COLORS.gray}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Gender</Text>
            {renderOptionButtons(genderOptions, form.gender, (value) =>
              setForm({ ...form, gender: value })
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Health Status</Text>
            {renderOptionButtons(healthOptions, form.healthStatus, (value) =>
              setForm({ ...form, healthStatus: value })
            )}
          </View>
        </View>

        {/* Additional Details for Dairy Animals */}
        {['cow', 'buffalo', 'goat'].includes(category.id) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dairy Details</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Milk Capacity (Liters/Day)</Text>
              <TextInput
                style={styles.input}
                value={form.milkCapacity}
                onChangeText={(text) => setForm({ ...form, milkCapacity: text })}
                placeholder="e.g., 12"
                placeholderTextColor={COLORS.gray}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Lactation Status</Text>
              {renderOptionButtons(lactationOptions, form.lactationStatus, (value) =>
                setForm({ ...form, lactationStatus: value })
              )}
            </View>

            {form.gender === 'Female' && (
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setForm({ ...form, isPregnant: !form.isPregnant })}
              >
                <View
                  style={[
                    styles.checkbox,
                    form.isPregnant && styles.checkboxChecked,
                  ]}
                >
                  {form.isPregnant && (
                    <Ionicons name="checkmark" size={16} color={COLORS.white} />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>Is Pregnant</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Price & Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price & Description</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Price (₹) *</Text>
            <TextInput
              style={styles.input}
              value={form.price}
              onChangeText={(text) => setForm({ ...form, price: text })}
              placeholder="Enter price"
              placeholderTextColor={COLORS.gray}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.description}
              onChangeText={(text) => setForm({ ...form, description: text })}
              placeholder="Describe your animal (health, temperament, feeding habits, etc.)"
              placeholderTextColor={COLORS.gray}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Location Info */}
        <View style={styles.locationInfo}>
          <Ionicons name="location" size={20} color={COLORS.primary} />
          <Text style={styles.locationText}>
            Location will be set to: {user?.city || 'Your location'}
            {user?.state ? `, ${user.state}` : ''}
          </Text>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 65 }]}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color={COLORS.white} />
              <Text style={styles.submitButtonText}>Publish Listing</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    backgroundColor: COLORS.white,
    marginTop: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 16,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  imageWrapper: {
    width: 100,
    height: 100,
    marginRight: 12,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.white,
    borderRadius: 12,
  },
  mainBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    paddingVertical: 2,
  },
  mainBadgeText: {
    fontSize: 10,
    color: COLORS.white,
    textAlign: 'center',
    fontWeight: '600',
  },
  addImageButtons: {
    flexDirection: 'row',
  },
  addImageButton: {
    width: 80,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: COLORS.primary + '10',
  },
  addImageText: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.black,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  optionButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionButtonText: {
    fontSize: 14,
    color: COLORS.black,
  },
  optionButtonTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.gray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxLabel: {
    fontSize: 16,
    color: COLORS.black,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.black,
    marginLeft: 10,
    flex: 1,
  },
  footer: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default CreateListingScreen;
