import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../utils/constants';
import { veterinarianService } from '../services/api';
import { useVetAuth } from '../context/VetAuthContext';
import CowLoader from '../components/CowLoader';
import AppHeader from '../components/AppHeader';

const EditVetProfileScreen = ({ navigation }) => {
  const { t, ready } = useTranslation();
  const { veterinarian, updateVeterinarian } = useVetAuth();
  
  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState(veterinarian?.profile_photo || null);
  
  const [formData, setFormData] = useState({
    full_name: veterinarian?.full_name || '',
    email: veterinarian?.email || '',
    specialization: veterinarian?.specialization || 'general',
    experience_years: veterinarian?.experience_years?.toString() || '',
    qualification: veterinarian?.qualification || '',
    license_number: veterinarian?.license_number || '',
    clinic_name: veterinarian?.clinic_name || '',
    clinic_address: veterinarian?.clinic_address || '',
    city: veterinarian?.city || '',
    state: veterinarian?.state || '',
    pincode: veterinarian?.pincode || '',
    consultation_fee: veterinarian?.consultation_fee?.toString() || '',
    emergency_available: veterinarian?.emergency_available || false,
    services: veterinarian?.services || [],
  });

  const specializationOptions = [
    { value: 'general', label: 'General Practice' },
    { value: 'large_animal', label: 'Large Animals' },
    { value: 'small_animal', label: 'Small Animals' },
    { value: 'livestock', label: 'Livestock' },
    { value: 'surgery', label: 'Surgery' },
    { value: 'emergency', label: 'Emergency Care' },
    { value: 'reproduction', label: 'Reproduction' },
  ];

  const serviceOptions = [
    'General Checkup',
    'Vaccination',
    'Surgery',
    'Emergency Care',
    'Pregnancy Care',
    'Dental Care',
    'Deworming',
    'Lab Tests',
    'X-Ray',
    'Ultrasound',
  ];

  // Show loading while translations are loading
  if (!ready) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <CowLoader message="" size="large" />
      </View>
    );
  }

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const toggleService = (service) => {
    setFormData(prev => {
      const services = prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service];
      return { ...prev, services };
    });
  };

  const validateForm = () => {
    if (!formData.full_name.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return false;
    }
    if (!formData.consultation_fee || isNaN(formData.consultation_fee)) {
      Alert.alert('Error', 'Please enter a valid consultation fee');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const updateData = {
        ...formData,
        experience_years: parseInt(formData.experience_years) || 0,
        consultation_fee: parseFloat(formData.consultation_fee) || 0,
      };

      const response = await veterinarianService.updateProfile(updateData);

      if (response.success) {
        // Update context
        await updateVeterinarian(response.data);
        
        Alert.alert('Success', 'Profile updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        navigation={navigation}
        title={t('profile.editProfile', { defaultValue: 'Edit Profile' })}
        subtitle={t('vetProfile.manageDetails', { defaultValue: 'Manage your veterinary profile' })}
        variant="primary"
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Photo */}
        <View style={styles.photoSection}>
          <TouchableOpacity onPress={pickImage} style={styles.photoContainer}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.profilePhoto} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="person" size={60} color={COLORS.gray} />
              </View>
            )}
            <View style={styles.photoEditButton}>
              <Ionicons name="camera" size={20} color={COLORS.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.photoLabel}>Tap to change photo</Text>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Dr. Full Name"
            placeholderTextColor={COLORS.gray}
            value={formData.full_name}
            onChangeText={(text) => setFormData({ ...formData, full_name: text })}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="email@example.com"
            placeholderTextColor={COLORS.gray}
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>License Number</Text>
          <TextInput
            style={styles.input}
            placeholder="VET12345"
            placeholderTextColor={COLORS.gray}
            value={formData.license_number}
            onChangeText={(text) => setFormData({ ...formData, license_number: text })}
            editable={false}
          />
        </View>

        {/* Professional Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional Information</Text>
          
          <Text style={styles.label}>Specialization *</Text>
          <View style={styles.specializationGrid}>
            {specializationOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.specializationButton,
                  formData.specialization === option.value && styles.specializationButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, specialization: option.value })}
              >
                <Text
                  style={[
                    styles.specializationText,
                    formData.specialization === option.value && styles.specializationTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Experience (Years)</Text>
          <TextInput
            style={styles.input}
            placeholder="5"
            placeholderTextColor={COLORS.gray}
            value={formData.experience_years}
            onChangeText={(text) => setFormData({ ...formData, experience_years: text })}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Qualification</Text>
          <TextInput
            style={styles.input}
            placeholder="BVSc & AH, MVSc"
            placeholderTextColor={COLORS.gray}
            value={formData.qualification}
            onChangeText={(text) => setFormData({ ...formData, qualification: text })}
          />

          <Text style={styles.label}>Consultation Fee (₹) *</Text>
          <TextInput
            style={styles.input}
            placeholder="500"
            placeholderTextColor={COLORS.gray}
            value={formData.consultation_fee}
            onChangeText={(text) => setFormData({ ...formData, consultation_fee: text })}
            keyboardType="numeric"
          />
        </View>

        {/* Services Offered */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services Offered</Text>
          <View style={styles.servicesGrid}>
            {serviceOptions.map((service) => (
              <TouchableOpacity
                key={service}
                style={[
                  styles.serviceChip,
                  formData.services.includes(service) && styles.serviceChipActive,
                ]}
                onPress={() => toggleService(service)}
              >
                <Text
                  style={[
                    styles.serviceChipText,
                    formData.services.includes(service) && styles.serviceChipTextActive,
                  ]}
                >
                  {service}
                </Text>
                {formData.services.includes(service) && (
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.white} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Clinic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Clinic Information</Text>
          
          <Text style={styles.label}>Clinic Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Clinic Name"
            placeholderTextColor={COLORS.gray}
            value={formData.clinic_name}
            onChangeText={(text) => setFormData({ ...formData, clinic_name: text })}
          />

          <Text style={styles.label}>Clinic Address</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Full clinic address"
            placeholderTextColor={COLORS.gray}
            value={formData.clinic_address}
            onChangeText={(text) => setFormData({ ...formData, clinic_address: text })}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            placeholder="City"
            placeholderTextColor={COLORS.gray}
            value={formData.city}
            onChangeText={(text) => setFormData({ ...formData, city: text })}
          />

          <Text style={styles.label}>State</Text>
          <TextInput
            style={styles.input}
            placeholder="State"
            placeholderTextColor={COLORS.gray}
            value={formData.state}
            onChangeText={(text) => setFormData({ ...formData, state: text })}
          />

          <Text style={styles.label}>Pincode</Text>
          <TextInput
            style={styles.input}
            placeholder="411001"
            placeholderTextColor={COLORS.gray}
            value={formData.pincode}
            onChangeText={(text) => setFormData({ ...formData, pincode: text })}
            keyboardType="numeric"
            maxLength={6}
          />
        </View>

        {/* Emergency Availability */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.emergencyToggle}
            onPress={() => setFormData({ ...formData, emergency_available: !formData.emergency_available })}
          >
            <View style={styles.emergencyInfo}>
              <Text style={styles.emergencyLabel}>24/7 Emergency Available</Text>
              <Text style={styles.emergencyDesc}>Enable if you provide emergency services</Text>
            </View>
            <View style={[styles.toggle, formData.emergency_available && styles.toggleActive]}>
              <View style={[styles.toggleThumb, formData.emergency_available && styles.toggleThumbActive]} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="save" size={24} color={COLORS.white} />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
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
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  photoContainer: {
    position: 'relative',
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: COLORS.white,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  photoLabel: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.gray,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: COLORS.black,
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  specializationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  specializationButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },
  specializationButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  specializationText: {
    fontSize: 13,
    color: COLORS.gray,
    fontWeight: '500',
  },
  specializationTextActive: {
    color: COLORS.white,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
    gap: 4,
  },
  serviceChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  serviceChipText: {
    fontSize: 13,
    color: COLORS.gray,
  },
  serviceChipTextActive: {
    color: COLORS.white,
  },
  emergencyToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  emergencyInfo: {
    flex: 1,
  },
  emergencyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
  },
  emergencyDesc: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.lightGray,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: COLORS.primary,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.white,
  },
  toggleThumbActive: {
    transform: [{ translateX: 22 }],
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default EditVetProfileScreen;
