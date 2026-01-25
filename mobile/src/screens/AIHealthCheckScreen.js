import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../utils/constants';
import { healthCheckService } from '../services/api';

// Animal types in Marathi with images from assets
const ANIMAL_TYPES = [
  { id: 'cow', name: 'गाय', image: require('../assets/cow1.png'), color: '#D2691E', emoji: '🐄' },
  { id: 'buffalo', name: 'म्हैस', image: require('../assets/buffalo1.png'), color: '#2F4F4F', emoji: '🐃' },
  { id: 'goat', name: 'शेळी', image: require('../assets/goat1.png'), color: '#8B7355', emoji: '🐐' },
  { id: 'horse', name: 'घोडा', image: require('../assets/horse1.png'), color: '#8B4513', emoji: '🐴' },
  { id: 'dog', name: 'कुत्रा', image: require('../assets/dog1.png'), color: '#CD853F', emoji: '🐕' },
  { id: 'cat', name: 'मांजर', image: require('../assets/cat1.png'), color: '#FFA07A', emoji: '🐈' },
  { id: 'other', name: 'इतर', icon: 'dots-horizontal-circle', color: '#6B7280', emoji: '🐾' },
];

// Helper functions
const getScoreColor = (score) => {
  if (score >= 8) return '#10B981'; // Green
  if (score >= 6) return '#F59E0B'; // Amber
  if (score >= 4) return '#F97316'; // Orange
  return '#EF4444'; // Red
};

const getUrgencyColor = (urgency) => {
  if (urgency === 'तातडीची' || urgency === 'High') return '#EF4444';
  if (urgency === 'मध्यम' || urgency === 'Medium') return '#F59E0B';
  return '#10B981';
};

const getBodyConditionText = (score) => {
  const num = Number(score);
  if (num <= 2) return 'कमी वजन';
  if (num >= 4) return 'जास्त वजन';
  return 'सामान्य';
};

const getAnimalEmoji = (animalId) => {
  const animal = ANIMAL_TYPES.find(a => a.id === animalId);
  return animal?.emoji || '🐾';
};

// Result Card Component
const ResultCard = ({ title, icon, children, color = COLORS.primary }) => (
  <View style={styles.resultCard}>
    <View style={[styles.cardHeader, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.cardTitle, { color }]}>{title}</Text>
    </View>
    <View style={styles.cardContent}>{children}</View>
  </View>
);

// Info Row Component
const InfoRow = ({ label, value }) => {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
};

// Severity Badge Component
const SeverityBadge = ({ severity }) => {
  const getSeverityColor = () => {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'गंभीर':
        return '#DC2626';
      case 'high':
      case 'उच्च':
        return '#EA580C';
      case 'medium':
      case 'मध्यम':
        return '#F59E0B';
      case 'low':
      case 'कमी':
        return '#22C55E';
      default:
        return '#6B7280';
    }
  };

  return (
    <View style={[styles.severityBadge, { backgroundColor: getSeverityColor() + '20' }]}>
      <Text style={[styles.severityText, { color: getSeverityColor() }]}>
        {severity || 'N/A'}
      </Text>
    </View>
  );
};

const AIHealthCheckScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [symptoms, setSymptoms] = useState('');
  const [age, setAge] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Pick image from gallery
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('परवानगी आवश्यक', 'कृपया गॅलरी वापरण्यासाठी परवानगी द्या');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
      setResult(null);
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('परवानगी आवश्यक', 'कृपया कॅमेरा वापरण्यासाठी परवानगी द्या');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
      setResult(null);
    }
  };

  // Show image picker options
  const showImageOptions = () => {
    Alert.alert(
      'फोटो निवडा',
      'तुम्ही कसा फोटो घ्यायचा आहे?',
      [
        { text: 'कॅमेरा', onPress: takePhoto },
        { text: 'गॅलरी', onPress: pickImage },
        { text: 'रद्द करा', style: 'cancel' },
      ]
    );
  };

  // Analyze health
  const analyzeHealth = async () => {
    if (!selectedImage) {
      Alert.alert('त्रुटी', 'कृपया प्राण्याचा फोटो निवडा');
      return;
    }

    if (!selectedAnimal) {
      Alert.alert('त्रुटी', 'कृपया प्राण्याचा प्रकार निवडा');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('image', {
        uri: selectedImage.uri,
        type: 'image/jpeg',
        name: 'health_check.jpg',
      });
      formData.append('animalType', selectedAnimal);
      if (symptoms) formData.append('symptoms', symptoms);
      if (age) formData.append('age', age);
      if (additionalInfo) formData.append('additionalInfo', additionalInfo);

      const response = await healthCheckService.uploadAndAnalyze(formData);

      if (response.success) {
        setResult(response.data);
        setModalVisible(true);
      } else {
        Alert.alert('त्रुटी', response.message || 'विश्लेषण अयशस्वी');
      }
    } catch (error) {
      console.error('Health check error:', error);
      Alert.alert('त्रुटी', error.message || 'आरोग्य तपासणी अयशस्वी झाली');
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setSelectedImage(null);
    setSelectedAnimal(null);
    setSymptoms('');
    setAge('');
    setAdditionalInfo('');
    setResult(null);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>{t('aiHealthCheck.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('aiHealthCheck.uploadPhotoDesc')}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>प्राण्याचा फोटो</Text>
          <TouchableOpacity
            style={styles.imagePickerContainer}
            onPress={showImageOptions}
          >
            {selectedImage ? (
              <View style={styles.selectedImageContainer}>
                <Image
                  source={{ uri: selectedImage.uri }}
                  style={styles.selectedImage}
                />
                <TouchableOpacity
                  style={styles.changeImageButton}
                  onPress={showImageOptions}
                >
                  <Ionicons name="camera" size={20} color={COLORS.white} />
                  <Text style={styles.changeImageText}>बदला</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <View style={styles.uploadIconContainer}>
                  <Ionicons name="camera-outline" size={40} color={COLORS.primary} />
                </View>
                <Text style={styles.uploadText}>फोटो काढा किंवा गॅलरीतून निवडा</Text>
                <Text style={styles.uploadHint}>स्पष्ट फोटो घ्या जेणेकरून AI चांगले विश्लेषण करू शकेल</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Animal Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>प्राण्याचा प्रकार निवडा</Text>
          <View style={styles.animalGrid}>
            {ANIMAL_TYPES.map((animal) => (
              <TouchableOpacity
                key={animal.id}
                style={[
                  styles.animalButton,
                  selectedAnimal === animal.id && styles.animalButtonSelected,
                  selectedAnimal === animal.id && { borderColor: animal.color },
                ]}
                onPress={() => setSelectedAnimal(animal.id)}
              >
                <View style={styles.animalCardContent}>
                  {animal.image ? (
                    <Image 
                      source={animal.image} 
                      style={styles.animalImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.animalIconWrapper}>
                      <MaterialCommunityIcons 
                        name={animal.icon} 
                        size={40} 
                        color={selectedAnimal === animal.id ? animal.color : COLORS.gray} 
                      />
                    </View>
                  )}
                </View>
                <View style={styles.animalNameContainer}>
                  <Text
                    style={[
                      styles.animalName,
                      selectedAnimal === animal.id && styles.animalNameSelected,
                    ]}
                  >
                    {animal.name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Additional Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>अतिरिक्त माहिती (पर्यायी)</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>लक्षणे</Text>
            <TextInput
              style={styles.textInput}
              placeholder="उदा: भूक कमी, ताप, थकवा..."
              placeholderTextColor={COLORS.gray}
              value={symptoms}
              onChangeText={setSymptoms}
              multiline
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>वय</Text>
            <TextInput
              style={styles.textInput}
              placeholder="उदा: 2 वर्ष, 6 महिने..."
              placeholderTextColor={COLORS.gray}
              value={age}
              onChangeText={setAge}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>इतर माहिती</Text>
            <TextInput
              style={styles.textInput}
              placeholder="इतर कोणतीही महत्त्वाची माहिती..."
              placeholderTextColor={COLORS.gray}
              value={additionalInfo}
              onChangeText={setAdditionalInfo}
              multiline
            />
          </View>
        </View>

        {/* Analyze Button */}
        <TouchableOpacity
          style={[styles.analyzeButton, loading && styles.analyzeButtonDisabled]}
          onPress={analyzeHealth}
          disabled={loading}
        >
          {loading ? (
            <>
              <ActivityIndicator color={COLORS.white} size="small" />
              <Text style={styles.analyzeButtonText}>विश्लेषण करत आहे...</Text>
            </>
          ) : (
            <>
              <Ionicons name="analytics" size={24} color={COLORS.white} />
              <Text style={styles.analyzeButtonText}>आरोग्य तपासा</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Results Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>विश्लेषण परिणाम</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={28} color={COLORS.black} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {result && (
                <>
                  {/* Overall Health Summary */}
                  <View style={styles.summaryCard}>
                    <View style={styles.summaryGrid}>
                      {/* Health Score */}
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>आरोग्य गुण</Text>
                        <View style={[styles.scoreCircle, { backgroundColor: getScoreColor(result.healthScore) }]}>
                          <Text style={styles.scoreText}>{result.healthScore || '?'}</Text>
                        </View>
                        <Text style={styles.summaryValue}>{result.overallHealth || '-'}</Text>
                        <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(result.urgencyLevel) + '20' }]}>
                          <Text style={[styles.urgencyText, { color: getUrgencyColor(result.urgencyLevel) }]}>
                            {result.urgencyLevel || 'सामान्य'}
                          </Text>
                        </View>
                      </View>

                      {/* Body Condition */}
                      <View style={[styles.summaryItem, styles.summaryItemBorder]}>
                        <Text style={styles.summaryLabel}>शरीर स्थिती</Text>
                        <View style={styles.bodyConditionCircle}>
                          <Text style={styles.bodyConditionEmoji}>
                            {Number(result.bodyConditionScore) <= 2 || Number(result.bodyConditionScore) >= 4 ? '⚠️' : '✅'}
                          </Text>
                        </View>
                        <Text style={styles.summaryValue}>{getBodyConditionText(result.bodyConditionScore)}</Text>
                        <Text style={styles.bodyConditionScore}>{result.bodyConditionScore || '3'}/5</Text>
                      </View>

                      {/* Animal Type */}
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>प्राणी</Text>
                        <View style={styles.animalTypeCircle}>
                          <Text style={styles.animalEmoji}>{getAnimalEmoji(selectedAnimal)}</Text>
                        </View>
                        <Text style={styles.summaryValue}>{result.animalType || '-'}</Text>
                      </View>
                    </View>
                  </View>

            {/* Age Estimation */}
            {result.estimatedAge && (
              <ResultCard title="अंदाजे वय" icon="calendar" color="#8B5CF6">
                <View style={styles.ageDisplay}>
                  <Text style={styles.ageValue}>
                    {result.estimatedAge?.years || 0} वर्षे {result.estimatedAge?.months || 0} महिने
                  </Text>
                </View>
                <InfoRow label="वयाचे वर्णन" value={result.estimatedAge?.ageDescription || 'उपलब्ध नाही'} />
                <InfoRow label="वय निर्धारण आधार" value={result.estimatedAge?.ageIndicators || 'उपलब्ध नाही'} />
              </ResultCard>
            )}

            {/* Breeding Readiness */}
            {result.breedingReadiness && (
              <ResultCard title="प्रजनन तयारी" icon="male-female" color="#EC4899">
                <View style={styles.readinessContainer}>
                  <Ionicons
                    name={result.breedingReadiness?.isReadyForMating ? 'checkmark-circle' : 'close-circle'}
                    size={32}
                    color={result.breedingReadiness?.isReadyForMating ? '#22C55E' : '#EF4444'}
                  />
                  <Text style={styles.readinessStatus}>
                    {result.breedingReadiness?.matingReadinessStatus || 'उपलब्ध नाही'}
                  </Text>
                </View>
                {result.breedingReadiness?.daysUntilMatingReady > 0 && (
                  <InfoRow
                    label="प्रजननासाठी दिवस"
                    value={`${result.breedingReadiness.daysUntilMatingReady} दिवस`}
                  />
                )}
                <InfoRow label="योग्य प्रजनन वय" value={result.breedingReadiness?.optimalMatingAge || 'उपलब्ध नाही'} />
                <InfoRow label="सल्ला" value={result.breedingReadiness?.matingAdvice || 'उपलब्ध नाही'} />
              </ResultCard>
            )}

            {/* Pregnancy Info */}
            {result.pregnancyInfo && (
              <ResultCard title="गर्भधारणा माहिती" icon="woman" color="#F59E0B">
                <View style={styles.readinessContainer}>
                  <Ionicons
                    name={result.pregnancyInfo?.canGetPregnant ? 'checkmark-circle' : 'close-circle'}
                    size={32}
                    color={result.pregnancyInfo?.canGetPregnant ? '#22C55E' : '#EF4444'}
                  />
                  <Text style={styles.readinessStatus}>
                    {result.pregnancyInfo?.pregnancyReadinessStatus || 'उपलब्ध नाही'}
                  </Text>
                </View>
                {result.pregnancyInfo?.daysUntilPregnancyReady > 0 && (
                  <InfoRow
                    label="गर्भधारणेसाठी दिवस"
                    value={`${result.pregnancyInfo.daysUntilPregnancyReady} दिवस`}
                  />
                )}
                <InfoRow label="गर्भधारणा कालावधी" value={result.pregnancyInfo?.gestationPeriod || 'उपलब्ध नाही'} />
                <InfoRow label="सल्ला" value={result.pregnancyInfo?.pregnancyAdvice || 'उपलब्ध नाही'} />
              </ResultCard>
            )}

            {/* Visible Signs */}
            {result.visibleSigns?.length > 0 && (
              <ResultCard title="दिसलेली चिन्हे" icon="eye" color="#3B82F6">
                {result.visibleSigns.map((sign, index) => (
                  <View key={index} style={styles.symptomItem}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.symptomText}>{sign}</Text>
                  </View>
                ))}
              </ResultCard>
            )}

            {/* Healthy Indicators */}
            {result.healthyIndicators?.length > 0 && (
              <ResultCard title="निरोगी चिन्हे" icon="checkmark-circle" color="#22C55E">
                {result.healthyIndicators.map((indicator, index) => (
                  <View key={index} style={styles.symptomItem}>
                    <Ionicons name="checkmark" size={16} color="#22C55E" />
                    <Text style={styles.symptomText}>{indicator}</Text>
                  </View>
                ))}
              </ResultCard>
            )}

            {/* Potential Issues */}
            {result.potentialIssues?.length > 0 && (
              <ResultCard title="संभाव्य समस्या" icon="warning" color="#F59E0B">
                {result.potentialIssues.map((issue, index) => (
                  <View key={index} style={styles.conditionItem}>
                    <View style={styles.conditionHeader}>
                      <Text style={styles.conditionName}>{issue.issue || issue.condition}</Text>
                      <SeverityBadge severity={issue.severity} />
                    </View>
                    <Text style={styles.conditionDescription}>{issue.description}</Text>
                  </View>
                ))}
              </ResultCard>
            )}

            {/* Recommendations */}
            {result.recommendations?.length > 0 && (
              <ResultCard title="शिफारसी" icon="bulb" color="#10B981">
                {result.recommendations.map((rec, index) => (
                  <View key={index} style={styles.recommendItem}>
                    <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                    <Text style={styles.recommendText}>{rec}</Text>
                  </View>
                ))}
              </ResultCard>
            )}

            {/* Dietary Suggestions */}
            {result.dietarySuggestions?.length > 0 && (
              <ResultCard title="आहार सूचना" icon="restaurant" color="#8B5CF6">
                {result.dietarySuggestions.map((diet, index) => (
                  <View key={index} style={styles.recommendItem}>
                    <Ionicons name="leaf" size={18} color="#8B5CF6" />
                    <Text style={styles.recommendText}>{diet}</Text>
                  </View>
                ))}
              </ResultCard>
            )}

            {/* When to See Vet */}
            {result.whenToSeeVet && (
              <ResultCard title="पशुवैद्यकांना कधी भेटावे" icon="medical" color="#EF4444">
                <View style={styles.vetWarningContainer}>
                  <Ionicons name="warning" size={24} color="#EF4444" />
                  <Text style={styles.vetWarningText}>{result.whenToSeeVet}</Text>
                </View>
              </ResultCard>
            )}

            {/* Disclaimer */}
            {result.disclaimer && (
              <View style={styles.disclaimerContainer}>
                <Ionicons name="information-circle" size={20} color={COLORS.gray} />
                <Text style={styles.disclaimerText}>{result.disclaimer}</Text>
              </View>
            )}

            {/* New Check Button */}
            <TouchableOpacity style={styles.newCheckButton} onPress={resetForm}>
              <Ionicons name="refresh" size={20} color={COLORS.white} />
              <Text style={styles.newCheckButtonText}>नवीन तपासणी</Text>
            </TouchableOpacity>

            <View style={styles.bottomPadding} />
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.white + 'CC',
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 12,
  },
  imagePickerContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  imagePlaceholder: {
    padding: 32,
    alignItems: 'center',
  },
  uploadIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.black,
    marginBottom: 4,
  },
  uploadHint: {
    fontSize: 13,
    color: COLORS.gray,
    textAlign: 'center',
  },
  selectedImageContainer: {
    position: 'relative',
  },
  selectedImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  changeImageButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  changeImageText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
  },
  animalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  animalButton: {
    width: '22.5%',
    aspectRatio: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  animalButtonSelected: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  animalCardContent: {
    width: '100%',
    height: '100%',
  },
  animalImage: {
    width: '100%',
    height: '100%',
  },
  animalIconWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  animalNameContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  animalName: {
    fontSize: 11,
    color: COLORS.black,
    fontWeight: '600',
    textAlign: 'center',
  },
  animalNameSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  inputContainer: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.black,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    minHeight: 48,
  },
  analyzeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  analyzeButtonDisabled: {
    opacity: 0.7,
  },
  analyzeButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  resultsContainer: {
    marginTop: 8,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  resetText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  resultCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardContent: {
    padding: 14,
    paddingTop: 0,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    color: COLORS.gray,
  },
  infoValue: {
    flex: 2,
    fontSize: 14,
    color: COLORS.black,
    fontWeight: '500',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  scoreLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  scoreBarContainer: {
    flex: 1,
    height: 10,
    backgroundColor: COLORS.lightGray,
    borderRadius: 5,
    overflow: 'hidden',
  },
  scoreBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 5,
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    minWidth: 50,
    textAlign: 'right',
  },
  ageDisplay: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  ageValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  readinessContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  readinessStatus: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.black,
  },
  conditionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  conditionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  conditionName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.black,
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  conditionProbability: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 4,
  },
  conditionDescription: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
  },
  symptomItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
    gap: 10,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
    marginTop: 6,
  },
  symptomText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.black,
    lineHeight: 20,
  },
  recommendSection: {
    marginBottom: 12,
  },
  recommendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 8,
  },
  recommendItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
    gap: 8,
  },
  recommendText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
  },
  consultationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  consultationText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.black,
  },
  disclaimerContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.lightGray + '50',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    gap: 10,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.gray,
    lineHeight: 18,
  },
  bottomPadding: {
    height: 30,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  newCheckButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  newCheckButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  summaryItemBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.lightGray,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '600',
    marginBottom: 8,
  },
  scoreCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 6,
    textAlign: 'center',
  },
  urgencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: '600',
  },
  bodyConditionCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  bodyConditionEmoji: {
    fontSize: 36,
  },
  bodyConditionScore: {
    fontSize: 11,
    color: COLORS.gray,
  },
  animalTypeCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  animalEmoji: {
    fontSize: 36,
  },
  vetWarningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
  },
  vetWarningText: {
    flex: 1,
    fontSize: 14,
    color: '#991B1B',
    lineHeight: 20,
  },
});

export default AIHealthCheckScreen;
