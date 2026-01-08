import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { COLORS } from '../utils/constants';
import { veterinarianService } from '../services/api';

const SPECIALIZATIONS = [
  { value: 'general', label: 'General Practice' },
  { value: 'large_animal', label: 'Large Animal (Cows, Buffalos)' },
  { value: 'small_animal', label: 'Small Animal (Dogs, Cats)' },
  { value: 'livestock', label: 'Livestock' },
  { value: 'surgery', label: 'Surgery' },
  { value: 'emergency', label: 'Emergency Care' },
  { value: 'reproduction', label: 'Reproduction & Breeding' },
];

const VetRegistrationScreen = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  // Step 1: Personal Info
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [qualification, setQualification] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [specialization, setSpecialization] = useState('general');
  const [showSpecPicker, setShowSpecPicker] = useState(false);

  // Step 2: Professional Info
  const [licenseNumber, setLicenseNumber] = useState('');
  const [consultationFee, setConsultationFee] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [emergencyAvailable, setEmergencyAvailable] = useState(false);
  const [services, setServices] = useState([]);

  // Step 3: Documents
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [licenseDocument, setLicenseDocument] = useState(null);
  const [degreeCertificate, setDegreeCertificate] = useState(null);

  // Step 4: Location
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  const SERVICE_OPTIONS = [
    'General Checkup',
    'Vaccination',
    'Surgery',
    'Emergency Care',
    'Pregnancy Care',
    'Deworming',
    'Artificial Insemination',
    'X-Ray & Diagnosis',
  ];

  const pickImage = async (setter) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setter(result.assets[0]);
    }
  };

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable location permissions to continue.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLatitude(location.coords.latitude);
      setLongitude(location.coords.longitude);

      // Reverse geocode to get address
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address) {
        setCity(address.city || address.subregion || '');
        setState(address.region || '');
        setPincode(address.postalCode || '');
        setClinicAddress(`${address.street || ''}, ${address.city || ''}, ${address.region || ''}`);
      }

      Alert.alert('Success', 'Location captured successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to get location. Please try again.');
    } finally {
      setLocationLoading(false);
    }
  };

  const toggleService = (service) => {
    setServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  const validateStep1 = () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return false;
    }
    if (!phoneNumber.trim() || phoneNumber.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return false;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    if (!qualification.trim()) {
      Alert.alert('Error', 'Please enter your qualification');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!licenseNumber.trim()) {
      Alert.alert('Error', 'Please enter your license number');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!licenseDocument) {
      Alert.alert('Error', 'Please upload your license document');
      return false;
    }
    return true;
  };

  const validateStep4 = () => {
    if (!latitude || !longitude) {
      Alert.alert('Error', 'Please capture your location');
      return false;
    }
    if (!city.trim() || !state.trim() || !pincode.trim()) {
      Alert.alert('Error', 'Please fill in all location details');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
    else if (step === 3 && validateStep3()) setStep(4);
  };

  const handleSubmit = async () => {
    if (!validateStep4()) return;

    setLoading(true);
    try {
      const formData = new FormData();

      // Personal info
      formData.append('full_name', fullName);
      formData.append('phone_number', `+91${phoneNumber}`);
      formData.append('email', email.toLowerCase());
      formData.append('qualification', qualification);
      formData.append('experience_years', experienceYears || '0');
      formData.append('specialization', specialization);

      // Professional info
      formData.append('license_number', licenseNumber);
      formData.append('consultation_fee', consultationFee || '0');
      formData.append('clinic_name', clinicName);
      formData.append('clinic_address', clinicAddress);
      formData.append('emergency_available', emergencyAvailable.toString());
      formData.append('services', JSON.stringify(services));

      // Location
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());
      formData.append('city', city);
      formData.append('state', state);
      formData.append('pincode', pincode);

      // Documents
      if (profilePhoto) {
        formData.append('profile_photo', {
          uri: profilePhoto.uri,
          type: 'image/jpeg',
          name: 'profile_photo.jpg',
        });
      }

      formData.append('license_document', {
        uri: licenseDocument.uri,
        type: 'image/jpeg',
        name: 'license_document.jpg',
      });

      if (degreeCertificate) {
        formData.append('degree_certificate', {
          uri: degreeCertificate.uri,
          type: 'image/jpeg',
          name: 'degree_certificate.jpg',
        });
      }

      const response = await veterinarianService.register(formData);

      if (response.success) {
        Alert.alert(
          'Registration Successful!',
          'Your registration is pending verification. You will receive your login credentials via email once verified.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('VetLogin'),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Registration failed');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Personal Information</Text>
      <Text style={styles.stepSubtitle}>Tell us about yourself</Text>

      <View style={styles.inputContainer}>
        <Ionicons name="person-outline" size={20} color={COLORS.gray} />
        <TextInput
          style={styles.input}
          placeholder="Full Name (Dr.)"
          placeholderTextColor={COLORS.gray}
          value={fullName}
          onChangeText={setFullName}
        />
      </View>

      <View style={styles.phoneInputContainer}>
        <Text style={styles.countryCode}>+91</Text>
        <TextInput
          style={styles.phoneInput}
          placeholder="Phone Number"
          placeholderTextColor={COLORS.gray}
          keyboardType="phone-pad"
          maxLength={10}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={20} color={COLORS.gray} />
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor={COLORS.gray}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="school-outline" size={20} color={COLORS.gray} />
        <TextInput
          style={styles.input}
          placeholder="Qualification (e.g., BVSc, MVSc)"
          placeholderTextColor={COLORS.gray}
          value={qualification}
          onChangeText={setQualification}
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="calendar-outline" size={20} color={COLORS.gray} />
        <TextInput
          style={styles.input}
          placeholder="Years of Experience"
          placeholderTextColor={COLORS.gray}
          keyboardType="numeric"
          maxLength={2}
          value={experienceYears}
          onChangeText={setExperienceYears}
        />
      </View>

      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setShowSpecPicker(!showSpecPicker)}
      >
        <Ionicons name="medical-outline" size={20} color={COLORS.gray} />
        <Text style={styles.pickerText}>
          {SPECIALIZATIONS.find((s) => s.value === specialization)?.label || 'Select Specialization'}
        </Text>
        <Ionicons name="chevron-down" size={20} color={COLORS.gray} />
      </TouchableOpacity>

      {showSpecPicker && (
        <View style={styles.pickerOptions}>
          {SPECIALIZATIONS.map((spec) => (
            <TouchableOpacity
              key={spec.value}
              style={[
                styles.pickerOption,
                specialization === spec.value && styles.pickerOptionActive,
              ]}
              onPress={() => {
                setSpecialization(spec.value);
                setShowSpecPicker(false);
              }}
            >
              <Text
                style={[
                  styles.pickerOptionText,
                  specialization === spec.value && styles.pickerOptionTextActive,
                ]}
              >
                {spec.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Professional Details</Text>
      <Text style={styles.stepSubtitle}>Your practice information</Text>

      <View style={styles.inputContainer}>
        <Ionicons name="document-text-outline" size={20} color={COLORS.gray} />
        <TextInput
          style={styles.input}
          placeholder="License Number (VCI Registration)"
          placeholderTextColor={COLORS.gray}
          value={licenseNumber}
          onChangeText={setLicenseNumber}
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="cash-outline" size={20} color={COLORS.gray} />
        <TextInput
          style={styles.input}
          placeholder="Consultation Fee (Rs.)"
          placeholderTextColor={COLORS.gray}
          keyboardType="numeric"
          value={consultationFee}
          onChangeText={setConsultationFee}
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="business-outline" size={20} color={COLORS.gray} />
        <TextInput
          style={styles.input}
          placeholder="Clinic/Hospital Name"
          placeholderTextColor={COLORS.gray}
          value={clinicName}
          onChangeText={setClinicName}
        />
      </View>

      <TouchableOpacity
        style={styles.toggleRow}
        onPress={() => setEmergencyAvailable(!emergencyAvailable)}
      >
        <View style={styles.toggleInfo}>
          <Ionicons name="alert-circle-outline" size={24} color="#EF4444" />
          <Text style={styles.toggleLabel}>Available for Emergency Calls</Text>
        </View>
        <View style={[styles.toggle, emergencyAvailable && styles.toggleActive]}>
          <View style={[styles.toggleKnob, emergencyAvailable && styles.toggleKnobActive]} />
        </View>
      </TouchableOpacity>

      <Text style={styles.sectionLabel}>Services Offered</Text>
      <View style={styles.servicesGrid}>
        {SERVICE_OPTIONS.map((service) => (
          <TouchableOpacity
            key={service}
            style={[
              styles.serviceChip,
              services.includes(service) && styles.serviceChipActive,
            ]}
            onPress={() => toggleService(service)}
          >
            <Text
              style={[
                styles.serviceChipText,
                services.includes(service) && styles.serviceChipTextActive,
              ]}
            >
              {service}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Upload Documents</Text>
      <Text style={styles.stepSubtitle}>Required for verification</Text>

      <TouchableOpacity
        style={styles.uploadCard}
        onPress={() => pickImage(setProfilePhoto)}
      >
        {profilePhoto ? (
          <Image source={{ uri: profilePhoto.uri }} style={styles.uploadedImage} />
        ) : (
          <>
            <Ionicons name="camera-outline" size={40} color="#3B82F6" />
            <Text style={styles.uploadTitle}>Profile Photo</Text>
            <Text style={styles.uploadSubtitle}>Optional</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.uploadCard, !licenseDocument && styles.uploadCardRequired]}
        onPress={() => pickImage(setLicenseDocument)}
      >
        {licenseDocument ? (
          <Image source={{ uri: licenseDocument.uri }} style={styles.uploadedImage} />
        ) : (
          <>
            <Ionicons name="document-outline" size={40} color="#3B82F6" />
            <Text style={styles.uploadTitle}>License Document *</Text>
            <Text style={styles.uploadSubtitle}>VCI Registration Certificate</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.uploadCard}
        onPress={() => pickImage(setDegreeCertificate)}
      >
        {degreeCertificate ? (
          <Image source={{ uri: degreeCertificate.uri }} style={styles.uploadedImage} />
        ) : (
          <>
            <Ionicons name="ribbon-outline" size={40} color="#3B82F6" />
            <Text style={styles.uploadTitle}>Degree Certificate</Text>
            <Text style={styles.uploadSubtitle}>Optional</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Clinic Location</Text>
      <Text style={styles.stepSubtitle}>Help farmers find you nearby</Text>

      <TouchableOpacity
        style={styles.locationButton}
        onPress={getCurrentLocation}
        disabled={locationLoading}
      >
        {locationLoading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <>
            <Ionicons name="location" size={24} color={COLORS.white} />
            <Text style={styles.locationButtonText}>
              {latitude ? 'Update Location' : 'Get Current Location'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {latitude && longitude && (
        <View style={styles.locationConfirm}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.locationConfirmText}>Location captured successfully</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <Ionicons name="business-outline" size={20} color={COLORS.gray} />
        <TextInput
          style={styles.input}
          placeholder="Clinic Address"
          placeholderTextColor={COLORS.gray}
          value={clinicAddress}
          onChangeText={setClinicAddress}
          multiline
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputContainer, styles.halfInput]}>
          <TextInput
            style={styles.input}
            placeholder="City"
            placeholderTextColor={COLORS.gray}
            value={city}
            onChangeText={setCity}
          />
        </View>
        <View style={[styles.inputContainer, styles.halfInput]}>
          <TextInput
            style={styles.input}
            placeholder="State"
            placeholderTextColor={COLORS.gray}
            value={state}
            onChangeText={setState}
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="pin-outline" size={20} color={COLORS.gray} />
        <TextInput
          style={styles.input}
          placeholder="Pincode"
          placeholderTextColor={COLORS.gray}
          keyboardType="numeric"
          maxLength={6}
          value={pincode}
          onChangeText={setPincode}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (step > 1 ? setStep(step - 1) : navigation.goBack())}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Veterinarian Registration</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Steps */}
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4].map((s) => (
          <View key={s} style={styles.progressStep}>
            <View
              style={[
                styles.progressDot,
                step >= s && styles.progressDotActive,
                step > s && styles.progressDotCompleted,
              ]}
            >
              {step > s ? (
                <Ionicons name="checkmark" size={14} color={COLORS.white} />
              ) : (
                <Text style={[styles.progressNumber, step >= s && styles.progressNumberActive]}>
                  {s}
                </Text>
              )}
            </View>
            {s < 4 && (
              <View style={[styles.progressLine, step > s && styles.progressLineActive]} />
            )}
          </View>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.nextButton, loading && styles.buttonDisabled]}
          onPress={step === 4 ? handleSubmit : handleNext}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.nextButtonText}>
              {step === 4 ? 'Submit Registration' : 'Next'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: COLORS.white,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotActive: {
    backgroundColor: '#3B82F6',
  },
  progressDotCompleted: {
    backgroundColor: '#10B981',
  },
  progressNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  progressNumberActive: {
    color: COLORS.white,
  },
  progressLine: {
    width: 40,
    height: 3,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
  },
  progressLineActive: {
    backgroundColor: '#10B981',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  stepContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    fontSize: 16,
    color: COLORS.black,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  countryCode: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.black,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pickerText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.black,
    marginLeft: 10,
  },
  pickerOptions: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  pickerOptionActive: {
    backgroundColor: '#EFF6FF',
  },
  pickerOptionText: {
    fontSize: 14,
    color: COLORS.black,
  },
  pickerOptionTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.black,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#10B981',
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.white,
  },
  toggleKnobActive: {
    transform: [{ translateX: 22 }],
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 12,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  serviceChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  serviceChipText: {
    fontSize: 13,
    color: COLORS.gray,
  },
  serviceChipTextActive: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  uploadCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  uploadCardRequired: {
    borderColor: '#3B82F6',
  },
  uploadedImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginTop: 12,
  },
  uploadSubtitle: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 16,
    gap: 8,
  },
  locationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  locationConfirm: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    gap: 6,
  },
  locationConfirmText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  nextButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default VetRegistrationScreen;
