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
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../utils/constants';
import { animalListingService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const SellAnimalScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [showAdditional, setShowAdditional] = useState(false);
  
  const [form, setForm] = useState({
    animalType: '',
    lactation: '',
    milkToday: '',
    price: '',
    sellDays: '',
    photos: { side: null, udder: null, video: null },
    milkCapacity: '',
    delivered: '',
    pregnant: '',
    calf: '',
    negotiation: false,
    details: '',
  });

  const animalTypes = [
    { id: 'cow', name: t('animalTypes.cow') || 'Cow', emoji: '🐄', image: require('../assets/cow1.png'), color: '#F59E0B', bgColor: '#FEF3C7' },
    { id: 'buffalo', name: t('animalTypes.buffalo') || 'Buffalo', emoji: '🐃', image: require('../assets/buffalo1.png'), color: '#6B7280', bgColor: '#F3F4F6' },
    { id: 'goat', name: t('animalTypes.goat') || 'Goat', emoji: '🐐', image: require('../assets/goat1.png'), color: '#10B981', bgColor: '#D1FAE5' },
    { id: 'horse', name: t('animalTypes.horse') || 'Horse', emoji: '🐴', image: require('../assets/horse1.png'), color: '#8B5CF6', bgColor: '#EDE9FE' },
    { id: 'dog', name: t('animalTypes.dog') || 'Dog', emoji: '🐕', image: require('../assets/dog1.png'), color: '#F97316', bgColor: '#FED7AA' },
    { id: 'cat', name: t('animalTypes.cat') || 'Cat', emoji: '🐱', image: require('../assets/cat1.png'), color: '#EC4899', bgColor: '#FCE7F3' },
    { id: 'other', name: t('animalTypes.other') || 'Other', emoji: '🐾', image: null, color: '#3B82F6', bgColor: '#DBEAFE' }
  ];
  const lactationOptions = ['Not Delivered', 'First', 'Second', 'Third', 'Other'];
  const sellDaysOptions = ['1 to 3 days', '4 to 7 days', 'More than a week'];
  const yesNoOptions = ['Yes', 'No'];
  const calfOptions = ['Female Calf', 'Male Calf', 'No Calf'];

  const handlePickImage = async (photoType) => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(t('errors.permissionDenied'), 'Please allow access to photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: photoType === 'video' ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      setForm(prev => ({
        ...prev,
        photos: { ...prev.photos, [photoType]: result.assets[0].uri }
      }));
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!form.animalType || !form.lactation || !form.milkToday || !form.price) {
      Alert.alert(t('errors.error'), t('validation.fillRequired'));
      return;
    }

    if (!form.photos.side && !form.photos.udder) {
      Alert.alert(t('errors.error'), 'Please upload at least one photo');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      
      // Map to backend fields
      formData.append('breedName', form.animalType);
      formData.append('age', form.lactation);
      formData.append('milkCapacity', form.milkToday || '0');
      formData.append('pregnancyStatus', form.pregnant === 'Yes' ? 'pregnant' : 'not_pregnant');
      formData.append('healthCondition', 'good');
      formData.append('expectedPrice', form.price);
      formData.append('isNegotiable', form.negotiation);
      formData.append('additionalNotes', form.details || '');
      
      // Add photos
      if (form.photos.side) {
        formData.append('frontPhoto', {
          uri: form.photos.side,
          type: 'image/jpeg',
          name: 'front.jpg',
        });
      }
      if (form.photos.udder) {
        formData.append('sidePhoto', {
          uri: form.photos.udder,
          type: 'image/jpeg',
          name: 'side.jpg',
        });
      }

      // Map animal types to correct API endpoints
      const endpointMap = {
        'Cow': 'animals',
        'Buffalo': 'buffalos',
        'Goat': 'goats',
        'Horse': 'horses',
        'Dog': 'dogs',
        'Cat': 'cats',
        'Other': 'other-animals'
      };
      
      const endpoint = endpointMap[form.animalType] || 'animals';
      const fullEndpoint = `/api/${endpoint}/listings`;
      
      console.log(`📱 [MOBILE - ${form.animalType.toUpperCase()}] Submitting to API endpoint:`, fullEndpoint);
      console.log(`📱 [MOBILE - ${form.animalType.toUpperCase()}] Form Data:`, {
        animalType: form.animalType,
        endpoint: endpoint,
        fullEndpoint: fullEndpoint
      });
      
      const response = await animalListingService.createListing(endpoint, formData);
      
      console.log(`✅ [MOBILE - ${form.animalType.toUpperCase()}] API Response:`, response);
      console.log(`✅ [MOBILE - ${form.animalType.toUpperCase()}] Listing created successfully at:`, fullEndpoint);
      
      Alert.alert(
        t('common.success'),
        t('sellAnimal.listingSuccess'),
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error(`❌ [MOBILE - ${form.animalType.toUpperCase()}] Error creating listing:`, error);
      console.error(`❌ [MOBILE - ${form.animalType.toUpperCase()}] Attempted endpoint:`, fullEndpoint);
      Alert.alert(t('errors.error'), error.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  const OptionButton = ({ selected, onPress, children }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.optionButton, selected && styles.optionButtonSelected]}
    >
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
        {children}
      </Text>
    </TouchableOpacity>
  );

  const SectionHeader = ({ icon, title, required }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionIcon}>{icon}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
      {required && <Text style={styles.required}>*</Text>}
    </View>
  );

  const PhotoUpload = ({ photoKey, label }) => (
    <TouchableOpacity
      style={[styles.photoUpload, form.photos[photoKey] && styles.photoUploaded]}
      onPress={() => handlePickImage(photoKey)}
    >
      {form.photos[photoKey] ? (
        <>
          <Image source={{ uri: form.photos[photoKey] }} style={styles.photoPreview} />
          <TouchableOpacity
            style={styles.removePhotoBtn}
            onPress={() => setForm(prev => ({ ...prev, photos: { ...prev.photos, [photoKey]: null } }))}
          >
            <Ionicons name="close-circle" size={24} color="#EF4444" />
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.photoPlaceholder}>
          <View style={styles.photoIcon}>
            <Ionicons name="camera" size={24} color="#FFF" />
          </View>
          <Text style={styles.photoLabel}>{label}</Text>
          <Text style={styles.photoHint}>JPEG, PNG (max 5MB)</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('sellAnimal.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('sellAnimal.subtitle')}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Animal Type Selection - Enhanced */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderEnhanced}>
            <Text style={styles.sectionTitleLarge}>{t('sellAnimal.selectAnimalType')}</Text>
            <Text style={styles.sectionSubtitle}>Choose the type of animal you want to sell</Text>
          </View>
          <View style={styles.animalTypeGrid}>
            {animalTypes.map(type => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.animalTypeCard,
                  form.animalType === type.name && styles.animalTypeCardSelected,
                  { borderColor: form.animalType === type.name ? type.color : '#E5E7EB' }
                ]}
                onPress={() => setForm(prev => ({ ...prev, animalType: type.name }))}
                activeOpacity={0.7}
              >
                {form.animalType === type.name && (
                  <View style={[styles.selectedBadge, { backgroundColor: type.color }]}>
                    <Ionicons name="checkmark" size={16} color="#FFF" />
                  </View>
                )}
                <View style={[styles.animalTypeIconContainer, { backgroundColor: type.bgColor }]}>
                  {type.image ? (
                    <Image source={type.image} style={styles.animalTypeImage} resizeMode="contain" />
                  ) : (
                    <Text style={styles.animalTypeEmoji}>{type.emoji}</Text>
                  )}
                </View>
                <Text style={[
                  styles.animalTypeName,
                  form.animalType === type.name && { color: type.color, fontWeight: '700' }
                ]}>
                  {type.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Lactation */}
        <View style={styles.section}>
          <SectionHeader icon="🥛" title={t('sellAnimal.lactation')} required />
          <View style={styles.optionsGrid}>
            {lactationOptions.map(opt => (
              <OptionButton
                key={opt}
                selected={form.lactation === opt}
                onPress={() => setForm(prev => ({ ...prev, lactation: opt }))}
              >
                {opt}
              </OptionButton>
            ))}
          </View>
        </View>

        {/* Milk & Price */}
        <View style={styles.section}>
          <SectionHeader icon="💰" title="Milk & Price" required />
          <View style={styles.row}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('sellAnimal.milkPerDay')} *</Text>
              <TextInput
                style={styles.input}
                value={form.milkToday}
                onChangeText={text => setForm(prev => ({ ...prev, milkToday: text }))}
                placeholder="10"
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
              <Text style={styles.inputUnit}>Liters</Text>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('sellAnimal.price')} *</Text>
              <TextInput
                style={styles.input}
                value={form.price}
                onChangeText={text => setForm(prev => ({ ...prev, price: text }))}
                placeholder="40000"
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
              <Text style={styles.inputUnit}>₹</Text>
            </View>
          </View>
        </View>

        {/* Days to Sell */}
        <View style={styles.section}>
          <SectionHeader icon="📅" title={t('sellAnimal.daysToSell')} />
          <View style={styles.optionsGrid}>
            {sellDaysOptions.map(opt => (
              <OptionButton
                key={opt}
                selected={form.sellDays === opt}
                onPress={() => setForm(prev => ({ ...prev, sellDays: opt }))}
              >
                {opt}
              </OptionButton>
            ))}
          </View>
        </View>

        {/* Photos */}
        <View style={styles.section}>
          <SectionHeader icon="📷" title={t('sellAnimal.uploadPhotos')} required />
          <View style={styles.photosGrid}>
            <PhotoUpload photoKey="side" label={t('sellAnimal.uploadSidePhoto')} />
            <PhotoUpload photoKey="udder" label={t('sellAnimal.uploadUdderPhoto')} />
          </View>
        </View>

        {/* Video (Optional) */}
        <View style={styles.section}>
          <SectionHeader icon="🎥" title={t('sellAnimal.uploadVideo')} />
          <PhotoUpload photoKey="video" label="Select Video" />
        </View>

        {/* Additional Info Toggle */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.toggleSection}
            onPress={() => setShowAdditional(!showAdditional)}
          >
            <View style={styles.toggleHeader}>
              <Ionicons 
                name={showAdditional ? "chevron-down" : "chevron-forward"} 
                size={20} 
                color={COLORS.primary} 
              />
              <Text style={styles.toggleTitle}>{t('sellAnimal.additionalInfo')}</Text>
            </View>
            <Text style={styles.toggleHint}>{showAdditional ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>

          {showAdditional && (
            <View style={styles.additionalContent}>
              {/* Milk Capacity */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('sellAnimal.milkCapacity')}</Text>
                <TextInput
                  style={styles.input}
                  value={form.milkCapacity}
                  onChangeText={text => setForm(prev => ({ ...prev, milkCapacity: text }))}
                  placeholder="12"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Has Delivered */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>🐣 {t('sellAnimal.hasDelivered')}</Text>
                <View style={styles.optionsRow}>
                  {yesNoOptions.map(opt => (
                    <OptionButton
                      key={opt}
                      selected={form.delivered === opt}
                      onPress={() => setForm(prev => ({ ...prev, delivered: opt }))}
                    >
                      {opt}
                    </OptionButton>
                  ))}
                </View>
              </View>

              {/* Is Pregnant */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>🤰 {t('sellAnimal.isPregnant')}</Text>
                <View style={styles.optionsRow}>
                  {yesNoOptions.map(opt => (
                    <OptionButton
                      key={opt}
                      selected={form.pregnant === opt}
                      onPress={() => setForm(prev => ({ ...prev, pregnant: opt }))}
                    >
                      {opt}
                    </OptionButton>
                  ))}
                </View>
              </View>

              {/* Has Calf */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>🐄 {t('sellAnimal.hasCalf')}</Text>
                <View style={styles.optionsRow}>
                  {calfOptions.map(opt => (
                    <OptionButton
                      key={opt}
                      selected={form.calf === opt}
                      onPress={() => setForm(prev => ({ ...prev, calf: opt }))}
                    >
                      {opt === 'Female Calf' ? t('sellAnimal.femaleCalf') : 
                       opt === 'Male Calf' ? t('sellAnimal.maleCalf') : 
                       t('sellAnimal.noCalf')}
                    </OptionButton>
                  ))}
                </View>
              </View>

              {/* Negotiation */}
              <View style={styles.negotiationRow}>
                <View style={styles.negotiationText}>
                  <Text style={styles.negotiationTitle}>{t('sellAnimal.negotiable')}</Text>
                  <Text style={styles.negotiationDesc}>{t('sellAnimal.negotiableDesc')}</Text>
                </View>
                <Switch
                  value={form.negotiation}
                  onValueChange={value => setForm(prev => ({ ...prev, negotiation: value }))}
                  trackColor={{ false: '#D1D5DB', true: COLORS.primary }}
                  thumbColor="#FFF"
                />
              </View>

              {/* More Details */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('sellAnimal.moreDetails')}</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={form.details}
                  onChangeText={text => setForm(prev => ({ ...prev, details: text }))}
                  placeholder="More details about the animal..."
                  multiline
                  numberOfLines={4}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#FFF" />
              <Text style={styles.submitButtonText}>{t('sellAnimal.submitListing')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderEnhanced: {
    marginBottom: 16,
  },
  sectionTitleLarge: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  animalTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  animalTypeCard: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 3,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  animalTypeCardSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    transform: [{ scale: 1.02 }],
  },
  selectedBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  animalTypeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  animalTypeImage: {
    width: 50,
    height: 50,
  },
  animalTypeEmoji: {
    fontSize: 32,
  },
  animalTypeName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  required: {
    fontSize: 18,
    color: '#EF4444',
    fontWeight: 'bold',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFF',
  },
  optionButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  optionTextSelected: {
    color: '#FFF',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputContainer: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFF',
  },
  inputUnit: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  photosGrid: {
    flexDirection: 'row',
    gap: 12,
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
  photoUploaded: {
    borderColor: COLORS.primary,
    borderStyle: 'solid',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removePhotoBtn: {
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
    padding: 12,
  },
  photoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  photoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 4,
  },
  photoHint: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  toggleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  toggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  toggleHint: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  additionalContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  negotiationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  negotiationText: {
    flex: 1,
  },
  negotiationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  negotiationDesc: {
    fontSize: 12,
    color: '#6B7280',
  },
  footer: {
    backgroundColor: '#FFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
});

export default SellAnimalScreen;
