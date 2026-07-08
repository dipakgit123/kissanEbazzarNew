import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Image, Dimensions, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { COLORS } from '../utils/constants';
import { veterinarianService } from '../services/api';
import LanguageSwitcher from '../components/LanguageSwitcher';
import SkeletonLoader from '../components/SkeletonLoader';
import AppHeader from '../components/AppHeader';

const { width } = Dimensions.get('window');

const VetRegistrationScreen = ({ navigation }) => {
  const { t, ready } = useTranslation();
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '', phone_number: '', email: '', specialization: 'general', experience_years: '',
    qualification: 'BVSc', services: [], consultation_fee: '', emergency_available: false,
    license_number: '', clinic_name: '', clinic_address: '', latitude: '', longitude: '',
    city: '', state: '', pincode: ''
  });
  const [files, setFiles] = useState({ profile_photo: null, license_document: null, degree_certificate: null, aadhar_document: null });
  const [errors, setErrors] = useState({});

  // Show loading while translations are loading
  if (!ready) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <SkeletonLoader variant="detail" />
      </View>
    );
  }

  const specializations = [
    { value: 'general', label: t('vetRegistration.specializations.general') || 'General Practice' },
    { value: 'large_animal', label: t('vetRegistration.specializations.largeAnimal') || 'Large Animal' },
    { value: 'small_animal', label: t('vetRegistration.specializations.smallAnimal') || 'Small Animal' },
    { value: 'livestock', label: t('vetRegistration.specializations.livestock') || 'Livestock' },
    { value: 'surgery', label: t('vetRegistration.specializations.surgery') || 'Surgery' },
    { value: 'emergency', label: t('vetRegistration.specializations.emergency') || 'Emergency Care' },
    { value: 'reproduction', label: t('vetRegistration.specializations.reproduction') || 'Reproduction' }
  ];

  const serviceOptions = [
    { value: 'checkup', label: t('vetRegistration.services.checkup') || 'Checkup', icon: '🩺' },
    { value: 'vaccination', label: t('vetRegistration.services.vaccination') || 'Vaccination', icon: '💉' },
    { value: 'surgery', label: t('vetRegistration.services.surgery') || 'Surgery', icon: '🔬' },
    { value: 'emergency', label: t('vetRegistration.services.emergency') || 'Emergency', icon: '🚨' },
    { value: 'pregnancy', label: t('vetRegistration.services.pregnancy') || 'Pregnancy', icon: '🤰' },
    { value: 'dental', label: t('vetRegistration.services.dental') || 'Dental', icon: '🦷' },
    { value: 'deworming', label: t('vetRegistration.services.deworming') || 'Deworming', icon: '💊' },
    { value: 'artificial_insemination', label: t('vetRegistration.services.artificialInsemination') || 'AI', icon: '🧬' }
  ];

  const qualifications = [
    { value: 'BVSc', label: 'BVSc' },
    { value: 'BVSc & AH', label: 'BVSc & AH' },
    { value: 'MVSc', label: 'MVSc' },
    { value: 'PhD', label: 'PhD' }
  ];

  useEffect(() => {
    (async () => {
      await Location.requestForegroundPermissionsAsync();
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    })();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const toggleService = (service) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service) ? prev.services.filter(s => s !== service) : [...prev.services, service]
    }));
  };

  const pickImage = async (fileType) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8
      });
      if (!result.canceled) setFiles(prev => ({ ...prev, [fileType]: result.assets[0] }));
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to pick image');
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      const location = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      if (address && address[0]) {
        handleInputChange('latitude', location.coords.latitude.toString());
        handleInputChange('longitude', location.coords.longitude.toString());
        handleInputChange('city', address[0].city || '');
        handleInputChange('state', address[0].region || '');
        handleInputChange('pincode', address[0].postalCode || '');
      }
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to get location');
    } finally {
      setLocationLoading(false);
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.full_name.trim()) newErrors.full_name = t('vetRegistration.errors.nameRequired');
    if (!formData.phone_number.trim()) newErrors.phone_number = t('vetRegistration.errors.phoneRequired');
    else if (!/^[6-9]\d{9}$/.test(formData.phone_number)) newErrors.phone_number = t('vetRegistration.errors.phoneInvalid');
    if (!formData.email.trim()) newErrors.email = t('vetRegistration.errors.emailRequired');
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = t('vetRegistration.errors.emailInvalid');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.experience_years) newErrors.experience_years = t('vetRegistration.errors.experienceRequired');
    if (!formData.license_number.trim()) newErrors.license_number = t('vetRegistration.errors.licenseRequired');
    if (!formData.consultation_fee) newErrors.consultation_fee = t('vetRegistration.errors.feeRequired');
    if (formData.services.length === 0) newErrors.services = t('vetRegistration.errors.servicesRequired');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};
    if (!formData.clinic_name.trim()) newErrors.clinic_name = t('vetRegistration.errors.clinicNameRequired');
    if (!formData.clinic_address.trim()) newErrors.clinic_address = t('vetRegistration.errors.addressRequired');
    if (!formData.latitude || !formData.longitude) newErrors.location = t('vetRegistration.errors.locationRequired');
    if (!files.profile_photo) newErrors.profile_photo = t('vetRegistration.errors.photoRequired');
    if (!files.license_document) newErrors.license_document = t('vetRegistration.errors.licenseDocRequired');
    if (!files.degree_certificate) newErrors.degree_certificate = t('vetRegistration.errors.degreeRequired');
    if (!files.aadhar_document) newErrors.aadhar_document = t('vetRegistration.errors.aadharRequired');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleBack = () => {
    if (step > 1) { setStep(step - 1); setErrors({}); }
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;
    setLoading(true);
    try {
      console.log('=== VET REGISTRATION DEBUG ===');
      console.log('Form Data:', formData);
      console.log('Files:', files);
      console.log('License Document:', files.license_document ? 'EXISTS' : 'MISSING');
      console.log('====================');

      const registrationData = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'services') {
          registrationData.append(key, JSON.stringify(formData[key]));
        } else if (key === 'emergency_available') {
          registrationData.append(key, formData[key] ? 'true' : 'false');
        } else if (key === 'phone_number') {
          // Convert phone number to E.164 format (+91xxxxxxxxxx)
          let phone = formData[key].toString().replace(/\D/g, ''); // Remove non-digits
          if (phone.length === 10) {
            phone = '+91' + phone; // Add India country code
          } else if (phone.length === 12 && phone.startsWith('91')) {
            phone = '+' + phone; // Add + if missing
          } else if (!phone.startsWith('+')) {
            phone = '+' + phone; // Add + if missing
          }
          registrationData.append(key, phone);
        } else {
          registrationData.append(key, formData[key]);
        }
      });
      Object.keys(files).forEach(key => {
        if (files[key]) {
          registrationData.append(key, {
            uri: files[key].uri,
            type: 'image/jpeg',
            name: `${key}.jpg`
          });
        }
      });
      
      console.log('Sending registration request...');
      const response = await veterinarianService.register(registrationData);
      console.log('Registration response:', response);
      
      if (response.success) {
        Alert.alert(t('common.success'), t('vetRegistration.registrationSuccess'), 
          [{ text: t('common.ok'), onPress: () => navigation.navigate('VetLogin') }]);
      } else {
        Alert.alert(t('common.error'), response.message || t('vetRegistration.registrationFailed'));
      }
    } catch (error) {
      console.error('=== VET REGISTRATION ERROR ===');
      console.error('Error:', error);
      console.error('Response:', error.response?.data);
      console.error('Status:', error.response?.status);
      console.error('Message:', error.response?.data?.message || error.message);
      console.error('====================');
      
      Alert.alert(
        t('common.error'), 
        error.response?.data?.message || error.message || t('vetRegistration.registrationFailed')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <AppHeader
        safeArea={false}
        navigation={navigation}
        title={t('vetAuth.registrationTitle')}
        subtitle={t('vetRegistration.stepLabel', {
          step,
          total: 3,
          defaultValue: `Step ${step} of 3`,
        })}
        onBack={() => (step === 1 ? navigation.goBack() : handleBack())}
        rightActions={[
          {
            icon: 'language',
            onPress: () => setLanguageModalVisible(true),
            color: COLORS.primary,
            accessibilityLabel: 'Change language',
          },
        ]}
      />
      <View style={styles.progressContainer}>
        {[1, 2, 3].map((stepNum) => (
          <View key={stepNum} style={styles.progressStep}>
            <View style={[styles.progressCircle, step >= stepNum && styles.progressCircleActive]}>
              {step > stepNum ? <Ionicons name="checkmark" size={16} color="#fff" /> : 
                <Text style={[styles.progressNumber, step >= stepNum && styles.progressNumberActive]}>{stepNum}</Text>}
            </View>
            {stepNum < 3 && <View style={[styles.progressLine, step > stepNum && styles.progressLineActive]} />}
          </View>
        ))}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.stepContainer}>
          {step === 1 && (
            <>
              <Text style={styles.stepTitle}>{t('vetRegistration.step1Title')}</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('vetRegistration.fullName')} *</Text>
                <View style={[styles.inputWrapper, errors.full_name && styles.inputError]}>
                  <Ionicons name="person-outline" size={20} color="#6B7280" style={{marginRight: 12}} />
                  <TextInput style={styles.input} placeholder={t('vetRegistration.fullNamePlaceholder')} value={formData.full_name}
                    onChangeText={(text) => handleInputChange('full_name', text)} />
                </View>
                {errors.full_name && <Text style={styles.errorText}>{errors.full_name}</Text>}
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('vetRegistration.phoneNumber')} *</Text>
                <View style={[styles.inputWrapper, errors.phone_number && styles.inputError]}>
                  <Ionicons name="call-outline" size={20} color="#6B7280" style={{marginRight: 12}} />
                  <TextInput style={styles.input} placeholder={t('vetRegistration.phoneNumberPlaceholder')} value={formData.phone_number}
                    onChangeText={(text) => handleInputChange('phone_number', text)} keyboardType="phone-pad" maxLength={10} />
                </View>
                {errors.phone_number && <Text style={styles.errorText}>{errors.phone_number}</Text>}
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('vetRegistration.email')} *</Text>
                <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                  <Ionicons name="mail-outline" size={20} color="#6B7280" style={{marginRight: 12}} />
                  <TextInput style={styles.input} placeholder={t('vetRegistration.emailPlaceholder')} value={formData.email}
                    onChangeText={(text) => handleInputChange('email', text.toLowerCase())} keyboardType="email-address" autoCapitalize="none" />
                </View>
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.stepTitle}>{t('vetRegistration.step2Title')}</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('vetRegistration.qualification')} *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {qualifications.map((qual) => (
                    <TouchableOpacity key={qual.value} style={[styles.optionChip, formData.qualification === qual.value && styles.optionChipActive]}
                      onPress={() => handleInputChange('qualification', qual.value)}>
                      <Text style={[styles.optionChipText, formData.qualification === qual.value && styles.optionChipTextActive]}>{qual.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('vetRegistration.experienceYears')} *</Text>
                <View style={[styles.inputWrapper, errors.experience_years && styles.inputError]}>
                  <Ionicons name="time-outline" size={20} color="#6B7280" style={{marginRight: 12}} />
                  <TextInput style={styles.input} placeholder={t('vetRegistration.experienceYearsPlaceholder')} value={formData.experience_years}
                    onChangeText={(text) => handleInputChange('experience_years', text)} keyboardType="numeric" />
                </View>
                {errors.experience_years && <Text style={styles.errorText}>{errors.experience_years}</Text>}
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('vetRegistration.licenseNumber')} *</Text>
                <View style={[styles.inputWrapper, errors.license_number && styles.inputError]}>
                  <Ionicons name="card-outline" size={20} color="#6B7280" style={{marginRight: 12}} />
                  <TextInput style={styles.input} placeholder={t('vetRegistration.licenseNumberPlaceholder')} value={formData.license_number}
                    onChangeText={(text) => handleInputChange('license_number', text)} />
                </View>
                {errors.license_number && <Text style={styles.errorText}>{errors.license_number}</Text>}
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('vetRegistration.consultationFee')} *</Text>
                <View style={[styles.inputWrapper, errors.consultation_fee && styles.inputError]}>
                  <Ionicons name="cash-outline" size={20} color="#6B7280" style={{marginRight: 12}} />
                  <TextInput style={styles.input} placeholder={t('vetRegistration.consultationFeePlaceholder')} value={formData.consultation_fee}
                    onChangeText={(text) => handleInputChange('consultation_fee', text)} keyboardType="numeric" />
                </View>
                {errors.consultation_fee && <Text style={styles.errorText}>{errors.consultation_fee}</Text>}
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('vetRegistration.services')} *</Text>
                <View style={styles.servicesGrid}>
                  {serviceOptions.map((service) => (
                    <TouchableOpacity key={service.value} style={[styles.serviceCard, formData.services.includes(service.value) && styles.serviceCardActive]}
                      onPress={() => toggleService(service.value)}>
                      <Text style={styles.serviceIcon}>{service.icon}</Text>
                      <Text style={[styles.serviceLabel, formData.services.includes(service.value) && styles.serviceLabelActive]}>{service.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {errors.services && <Text style={styles.errorText}>{errors.services}</Text>}
              </View>
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.stepTitle}>{t('vetRegistration.step3Title')}</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('vetRegistration.clinicName')} *</Text>
                <View style={[styles.inputWrapper, errors.clinic_name && styles.inputError]}>
                  <Ionicons name="business-outline" size={20} color="#6B7280" style={{marginRight: 12}} />
                  <TextInput style={styles.input} placeholder={t('vetRegistration.clinicNamePlaceholder')} value={formData.clinic_name}
                    onChangeText={(text) => handleInputChange('clinic_name', text)} />
                </View>
                {errors.clinic_name && <Text style={styles.errorText}>{errors.clinic_name}</Text>}
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('vetRegistration.clinicAddress')} *</Text>
                <View style={[styles.inputWrapper, errors.clinic_address && styles.inputError]}>
                  <TextInput style={[styles.input, {minHeight: 80, textAlignVertical: 'top'}]} placeholder={t('vetRegistration.clinicAddressPlaceholder')} 
                    value={formData.clinic_address} onChangeText={(text) => handleInputChange('clinic_address', text)} multiline numberOfLines={3} />
                </View>
                {errors.clinic_address && <Text style={styles.errorText}>{errors.clinic_address}</Text>}
              </View>
              <TouchableOpacity style={styles.locationButton} onPress={getCurrentLocation} disabled={locationLoading}>
                {locationLoading ? <ActivityIndicator color={COLORS.primary} /> : 
                  <><Ionicons name="navigate" size={20} color={COLORS.primary} /><Text style={styles.locationButtonText}>{t('vetRegistration.getCurrentLocation')}</Text></>}
              </TouchableOpacity>
              {formData.latitude && <Text style={{color: COLORS.primary, marginBottom: 16}}>✓ {t('vetRegistration.locationSet')}</Text>}
              {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
              
              <Text style={styles.sectionTitle}>{t('vetRegistration.documents')}</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('vetRegistration.profilePhoto')} *</Text>
                <TouchableOpacity style={[styles.fileButton, errors.profile_photo && styles.inputError]} onPress={() => pickImage('profile_photo')}>
                  {files.profile_photo ? (
                    <><Image source={{ uri: files.profile_photo.uri }} style={{width: 50, height: 50, borderRadius: 8}} />
                    <Text style={{color: COLORS.primary, marginLeft: 12}}>✓ {t('vetRegistration.photoSelected')}</Text></>
                  ) : (
                    <><Ionicons name="camera-outline" size={24} color="#6B7280" />
                    <Text style={{fontSize: 14, color: '#6B7280', marginTop: 8}}>{t('vetRegistration.uploadPhoto')}</Text></>
                  )}
                </TouchableOpacity>
                {errors.profile_photo && <Text style={styles.errorText}>{errors.profile_photo}</Text>}
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('vetRegistration.licenseDocument')} *</Text>
                <TouchableOpacity style={[styles.fileButton, errors.license_document && styles.inputError]} onPress={() => pickImage('license_document')}>
                  {files.license_document ? (
                    <><Image source={{ uri: files.license_document.uri }} style={{width: 50, height: 50, borderRadius: 8}} />
                    <Text style={{color: COLORS.primary, marginLeft: 12}}>✓ {t('vetRegistration.licenseUploaded')}</Text></>
                  ) : (
                    <><Ionicons name="document-outline" size={24} color="#6B7280" />
                    <Text style={{fontSize: 14, color: '#6B7280', marginTop: 8}}>{t('vetRegistration.uploadLicense')}</Text></>
                  )}
                </TouchableOpacity>
                {errors.license_document && <Text style={styles.errorText}>{errors.license_document}</Text>}
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('vetRegistration.degreeCertificate')} *</Text>
                <TouchableOpacity style={[styles.fileButton, errors.degree_certificate && styles.inputError]} onPress={() => pickImage('degree_certificate')}>
                  {files.degree_certificate ? (
                    <><Image source={{ uri: files.degree_certificate.uri }} style={{width: 50, height: 50, borderRadius: 8}} />
                    <Text style={{color: COLORS.primary, marginLeft: 12}}>✓ {t('vetRegistration.degreeUploaded')}</Text></>
                  ) : (
                    <><Ionicons name="school-outline" size={24} color="#6B7280" />
                    <Text style={{fontSize: 14, color: '#6B7280', marginTop: 8}}>{t('vetRegistration.uploadDegree')}</Text></>
                  )}
                </TouchableOpacity>
                {errors.degree_certificate && <Text style={styles.errorText}>{errors.degree_certificate}</Text>}
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('vetRegistration.aadharDocument')} *</Text>
                <TouchableOpacity style={[styles.fileButton, errors.aadhar_document && styles.inputError]} onPress={() => pickImage('aadhar_document')}>
                  {files.aadhar_document ? (
                    <><Image source={{ uri: files.aadhar_document.uri }} style={{width: 50, height: 50, borderRadius: 8}} />
                    <Text style={{color: COLORS.primary, marginLeft: 12}}>✓ {t('vetRegistration.aadharUploaded')}</Text></>
                  ) : (
                    <><Ionicons name="id-card-outline" size={24} color="#6B7280" />
                    <Text style={{fontSize: 14, color: '#6B7280', marginTop: 8}}>{t('vetRegistration.uploadAadhar')}</Text></>
                  )}
                </TouchableOpacity>
                {errors.aadhar_document && <Text style={styles.errorText}>{errors.aadhar_document}</Text>}
              </View>
            </>
          )}
        </View>

        <View style={{padding: 20}}>
          {step < 3 ? (
            <TouchableOpacity style={styles.nextButton} onPress={handleNext} disabled={loading}>
              <Text style={{fontSize: 16, fontWeight: '600', color: '#fff'}}>{t('common.next')}</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : 
                <><Text style={{fontSize: 16, fontWeight: '600', color: '#fff'}}>{t('common.submit')}</Text>
                <Ionicons name="checkmark-circle" size={20} color="#fff" /></>}
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity
          style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 20, gap: 4}}
          onPress={() => navigation.navigate('VetLogin')}
          disabled={loading}
        >
          <Text style={{fontSize: 14, color: '#6B7280'}}>{t('vetAuth.alreadyHaveAccount')}</Text>
          <Text style={{fontSize: 14, fontWeight: '600', color: COLORS.primary}}>{t('vetAuth.loginNow')}</Text>
        </TouchableOpacity>
      </ScrollView>
      <LanguageSwitcher visible={languageModalVisible} onClose={() => setLanguageModalVisible(false)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937', flex: 1, textAlign: 'center' },
  progressContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20, backgroundColor: '#fff' },
  progressStep: { flexDirection: 'row', alignItems: 'center' },
  progressCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  progressCircleActive: { backgroundColor: COLORS.primary },
  progressNumber: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  progressNumberActive: { color: '#fff' },
  progressLine: { width: 60, height: 2, backgroundColor: '#E5E7EB' },
  progressLineActive: { backgroundColor: COLORS.primary },
  scrollView: { flex: 1 },
  stepContainer: { padding: 20 },
  stepTitle: { fontSize: 22, fontWeight: 'bold', color: '#1F2937', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937', marginTop: 24, marginBottom: 16 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, minHeight: 56 },
  inputError: { borderColor: '#DC2626' },
  input: { flex: 1, fontSize: 16, color: '#1F2937' },
  errorText: { fontSize: 12, color: '#DC2626', marginTop: 4 },
  optionChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', marginRight: 8 },
  optionChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  optionChipText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  optionChipTextActive: { color: '#fff' },
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  serviceCard: { width: (width - 64) / 2, padding: 16, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  serviceCardActive: { backgroundColor: COLORS.primary + '15', borderColor: COLORS.primary },
  serviceIcon: { fontSize: 32, marginBottom: 8 },
  serviceLabel: { fontSize: 13, color: '#6B7280', textAlign: 'center', fontWeight: '500' },
  serviceLabelActive: { color: COLORS.primary, fontWeight: '600' },
  locationButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.primary, borderRadius: 12, paddingVertical: 12, marginBottom: 16, gap: 8 },
  locationButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  fileButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 16, alignItems: 'center', justifyContent: 'center', minHeight: 80, borderStyle: 'dashed', flexDirection: 'row' },
  nextButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16, gap: 8 },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16, gap: 8 }
});

export default VetRegistrationScreen;
