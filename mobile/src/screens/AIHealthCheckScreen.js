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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../utils/constants';
import { healthCheckService } from '../services/api';

// Animal types in Marathi
const ANIMAL_TYPES = [
  { id: 'cow', name: 'गाय', icon: '🐄' },
  { id: 'buffalo', name: 'म्हैस', icon: '🐃' },
  { id: 'goat', name: 'शेळी', icon: '🐐' },
  { id: 'sheep', name: 'मेंढी', icon: '🐑' },
  { id: 'horse', name: 'घोडा', icon: '🐴' },
  { id: 'dog', name: 'कुत्रा', icon: '🐕' },
  { id: 'cat', name: 'मांजर', icon: '🐈' },
  { id: 'chicken', name: 'कोंबडी', icon: '🐔' },
];

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
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [symptoms, setSymptoms] = useState('');
  const [age, setAge] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

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
          <Text style={styles.headerTitle}>AI आरोग्य तपासणी</Text>
          <Text style={styles.headerSubtitle}>प्राण्यांच्या आरोग्याचे AI विश्लेषण</Text>
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
                ]}
                onPress={() => setSelectedAnimal(animal.id)}
              >
                <Text style={styles.animalIcon}>{animal.icon}</Text>
                <Text
                  style={[
                    styles.animalName,
                    selectedAnimal === animal.id && styles.animalNameSelected,
                  ]}
                >
                  {animal.name}
                </Text>
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

        {/* Results */}
        {result && (
          <View style={styles.resultsContainer}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>विश्लेषण परिणाम</Text>
              <TouchableOpacity onPress={resetForm}>
                <Text style={styles.resetText}>नवीन तपासणी</Text>
              </TouchableOpacity>
            </View>

            {/* Overall Health */}
            <ResultCard title="एकूण आरोग्य स्थिती" icon="heart" color="#EF4444">
              <InfoRow label="आरोग्य स्थिती" value={result.overallHealth?.status} />
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreLabel}>आरोग्य गुण:</Text>
                <View style={styles.scoreBarContainer}>
                  <View
                    style={[
                      styles.scoreBar,
                      { width: `${result.overallHealth?.healthScore || 0}%` },
                    ]}
                  />
                </View>
                <Text style={styles.scoreValue}>
                  {result.overallHealth?.healthScore}/100
                </Text>
              </View>
              <InfoRow label="तातडीचे?" value={result.overallHealth?.urgency} />
              <InfoRow label="सारांश" value={result.overallHealth?.summary} />
            </ResultCard>

            {/* Age Estimation */}
            {result.estimatedAge && (
              <ResultCard title="अंदाजे वय" icon="calendar" color="#8B5CF6">
                <View style={styles.ageDisplay}>
                  <Text style={styles.ageValue}>
                    {result.estimatedAge.years || 0} वर्षे {result.estimatedAge.months || 0} महिने
                  </Text>
                </View>
                <InfoRow label="वयाचे वर्णन" value={result.estimatedAge.ageDescription} />
                <InfoRow label="वय निर्धारण आधार" value={result.estimatedAge.ageIndicators} />
              </ResultCard>
            )}

            {/* Breeding Readiness */}
            {result.breedingReadiness && (
              <ResultCard title="प्रजनन तयारी" icon="male-female" color="#EC4899">
                <View style={styles.readinessContainer}>
                  <Ionicons
                    name={result.breedingReadiness.isReadyForMating ? 'checkmark-circle' : 'close-circle'}
                    size={32}
                    color={result.breedingReadiness.isReadyForMating ? '#22C55E' : '#EF4444'}
                  />
                  <Text style={styles.readinessStatus}>
                    {result.breedingReadiness.matingReadinessStatus}
                  </Text>
                </View>
                {result.breedingReadiness.daysUntilMatingReady > 0 && (
                  <InfoRow
                    label="प्रजननासाठी दिवस"
                    value={`${result.breedingReadiness.daysUntilMatingReady} दिवस`}
                  />
                )}
                <InfoRow label="योग्य प्रजनन वय" value={result.breedingReadiness.optimalMatingAge} />
                <InfoRow label="सल्ला" value={result.breedingReadiness.matingAdvice} />
              </ResultCard>
            )}

            {/* Pregnancy Info */}
            {result.pregnancyInfo && (
              <ResultCard title="गर्भधारणा माहिती" icon="woman" color="#F59E0B">
                <View style={styles.readinessContainer}>
                  <Ionicons
                    name={result.pregnancyInfo.canGetPregnant ? 'checkmark-circle' : 'close-circle'}
                    size={32}
                    color={result.pregnancyInfo.canGetPregnant ? '#22C55E' : '#EF4444'}
                  />
                  <Text style={styles.readinessStatus}>
                    {result.pregnancyInfo.pregnancyReadinessStatus}
                  </Text>
                </View>
                {result.pregnancyInfo.daysUntilPregnancyReady > 0 && (
                  <InfoRow
                    label="गर्भधारणेसाठी दिवस"
                    value={`${result.pregnancyInfo.daysUntilPregnancyReady} दिवस`}
                  />
                )}
                <InfoRow label="गर्भधारणा कालावधी" value={result.pregnancyInfo.gestationPeriod} />
                <InfoRow label="सल्ला" value={result.pregnancyInfo.pregnancyAdvice} />
              </ResultCard>
            )}

            {/* Identified Conditions */}
            {result.identifiedConditions?.length > 0 && (
              <ResultCard title="आढळलेल्या समस्या" icon="warning" color="#F59E0B">
                {result.identifiedConditions.map((condition, index) => (
                  <View key={index} style={styles.conditionItem}>
                    <View style={styles.conditionHeader}>
                      <Text style={styles.conditionName}>{condition.condition}</Text>
                      <SeverityBadge severity={condition.severity} />
                    </View>
                    <Text style={styles.conditionProbability}>
                      संभाव्यता: {condition.probability}
                    </Text>
                    <Text style={styles.conditionDescription}>{condition.description}</Text>
                  </View>
                ))}
              </ResultCard>
            )}

            {/* Symptoms */}
            {result.symptoms?.observed?.length > 0 && (
              <ResultCard title="दिसलेली लक्षणे" icon="eye" color="#3B82F6">
                {result.symptoms.observed.map((symptom, index) => (
                  <View key={index} style={styles.symptomItem}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.symptomText}>{symptom}</Text>
                  </View>
                ))}
              </ResultCard>
            )}

            {/* Recommendations */}
            {result.recommendations && (
              <ResultCard title="शिफारसी" icon="bulb" color="#22C55E">
                {result.recommendations.immediate?.length > 0 && (
                  <View style={styles.recommendSection}>
                    <Text style={styles.recommendTitle}>तात्काळ कृती:</Text>
                    {result.recommendations.immediate.map((rec, index) => (
                      <View key={index} style={styles.recommendItem}>
                        <Ionicons name="alert-circle" size={16} color="#EF4444" />
                        <Text style={styles.recommendText}>{rec}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {result.recommendations.shortTerm?.length > 0 && (
                  <View style={styles.recommendSection}>
                    <Text style={styles.recommendTitle}>अल्पकालीन:</Text>
                    {result.recommendations.shortTerm.map((rec, index) => (
                      <View key={index} style={styles.recommendItem}>
                        <Ionicons name="time" size={16} color="#F59E0B" />
                        <Text style={styles.recommendText}>{rec}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {result.recommendations.longTerm?.length > 0 && (
                  <View style={styles.recommendSection}>
                    <Text style={styles.recommendTitle}>दीर्घकालीन:</Text>
                    {result.recommendations.longTerm.map((rec, index) => (
                      <View key={index} style={styles.recommendItem}>
                        <Ionicons name="calendar" size={16} color="#3B82F6" />
                        <Text style={styles.recommendText}>{rec}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </ResultCard>
            )}

            {/* Veterinary Consultation */}
            {result.veterinaryConsultation && (
              <ResultCard
                title="पशुवैद्यकीय सल्ला"
                icon="medkit"
                color={result.veterinaryConsultation.required ? '#EF4444' : '#22C55E'}
              >
                <View style={styles.consultationContainer}>
                  <Ionicons
                    name={result.veterinaryConsultation.required ? 'alert-circle' : 'checkmark-circle'}
                    size={32}
                    color={result.veterinaryConsultation.required ? '#EF4444' : '#22C55E'}
                  />
                  <Text style={styles.consultationText}>
                    {result.veterinaryConsultation.required
                      ? 'पशुवैद्यकांची भेट आवश्यक'
                      : 'पशुवैद्यकांची भेट आत्ता आवश्यक नाही'}
                  </Text>
                </View>
                <InfoRow label="तातडी" value={result.veterinaryConsultation.urgency} />
                <InfoRow label="कारण" value={result.veterinaryConsultation.reason} />
              </ResultCard>
            )}

            {/* Disclaimer */}
            <View style={styles.disclaimerContainer}>
              <Ionicons name="information-circle" size={20} color={COLORS.gray} />
              <Text style={styles.disclaimerText}>
                हे AI-आधारित विश्लेषण आहे आणि हे व्यावसायिक पशुवैद्यकीय सल्ल्याची जागा घेत नाही.
                गंभीर आरोग्य समस्यांसाठी नेहमी पात्र पशुवैद्यकाचा सल्ला घ्या.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.bottomPadding} />
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
    gap: 10,
  },
  animalButton: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  animalButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  animalIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  animalName: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '500',
  },
  animalNameSelected: {
    color: COLORS.primary,
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
});

export default AIHealthCheckScreen;
