import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../utils/constants';
import { healthCheckService } from '../services/api';
import FeatureHelpModal from '../components/FeatureHelpModal';
import { getLocalizedFeatureHelp } from '../constants/featureHelp';
import AppHeader from '../components/AppHeader';

const ANIMAL_TYPES = [
  { id: 'cow', image: require('../assets/cow1.png') },
  { id: 'buffalo', image: require('../assets/buffalo1.png') },
  { id: 'goat', image: require('../assets/goat1.png') },
  { id: 'horse', image: require('../assets/horse1.png') },
  { id: 'dog', image: require('../assets/dog1.png') },
  { id: 'cat', image: require('../assets/cat1.png') },
  { id: 'other', icon: 'paw-outline' },
];

const getScoreColor = (score) => {
  const numericScore = Number(score);
  if (numericScore >= 8) return COLORS.success;
  if (numericScore >= 6) return COLORS.warning;
  if (numericScore >= 4) return COLORS.accent;
  return COLORS.error;
};

const getUrgencyColor = (urgency = '') => {
  const value = String(urgency).toLowerCase();
  if (value.includes('high') || value.includes('critical') || value.includes('urgent')) return COLORS.error;
  if (value.includes('medium') || value.includes('moderate')) return COLORS.warning;
  return COLORS.success;
};

const toDisplayText = (value, fallback = '-') => {
  if (value === null || value === undefined || value === '') return fallback;
  if (Array.isArray(value)) return value.map((item) => toDisplayText(item, '')).filter(Boolean).join(', ');
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([key, item]) => `${key}: ${toDisplayText(item, '')}`)
      .filter(Boolean)
      .join(', ');
  }
  return String(value);
};

const normalizeList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
};

const getBodyConditionText = (score, t) => {
  const numericScore = Number(score);
  if (numericScore <= 2) return t('aiHealthCheck.underweight');
  if (numericScore >= 4) return t('aiHealthCheck.overweight');
  return t('aiHealthCheck.normal');
};

const AIHealthCheckScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [symptoms, setSymptoms] = useState('');
  const [age, setAge] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [customQuestion, setCustomQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [helpVisible, setHelpVisible] = useState(false);
  const aiHealthHelp = getLocalizedFeatureHelp('aiHealth', i18n.resolvedLanguage || i18n.language);

  const selectedAnimalMeta = useMemo(
    () => ANIMAL_TYPES.find((animal) => animal.id === selectedAnimal),
    [selectedAnimal]
  );

  const primaryRecommendation = result?.recommendations?.[0];
  const healthScore = result?.healthScore || result?.score;
  const bodyScore = result?.bodyConditionScore || result?.body_condition_score || 3;
  const urgencyLevel = result?.urgencyLevel || result?.urgency || t('aiHealthCheck.normal');

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('aiHealthCheck.permissionRequired'), t('aiHealthCheck.galleryPermission'));
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.72,
    });

    if (!pickerResult.canceled) {
      setSelectedImage(pickerResult.assets[0]);
      setResult(null);
      setError(null);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('aiHealthCheck.permissionRequired'), t('aiHealthCheck.cameraPermission'));
      return;
    }

    const pickerResult = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.72,
    });

    if (!pickerResult.canceled) {
      setSelectedImage(pickerResult.assets[0]);
      setResult(null);
      setError(null);
    }
  };

  const chooseImageSource = () => {
    Alert.alert(t('aiHealthCheck.photoOptions'), t('aiHealthCheck.photoOptionsDesc'), [
      { text: t('aiHealthCheck.takePhoto'), onPress: takePhoto },
      { text: t('aiHealthCheck.choosePhoto'), onPress: pickImage },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const analyzeHealth = async () => {
    if (!selectedAnimal) {
      setError(t('aiHealthCheck.errorSelectAnimal'));
      return;
    }

    if (!selectedImage) {
      setError(t('aiHealthCheck.errorSelectPhoto'));
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('image', {
        uri: selectedImage.uri,
        type: selectedImage.mimeType || 'image/jpeg',
        name: selectedImage.fileName || 'health_check.jpg',
      });
      formData.append('animalType', selectedAnimal);
      formData.append('symptoms', symptoms);
      formData.append('age', age);
      formData.append('additionalInfo', additionalInfo);
      formData.append('customQuestion', customQuestion);
      formData.append('languageHint', i18n.language);

      const response = await healthCheckService.uploadAndAnalyze(formData);
      if (response.success) {
        setResult(response.data);
      } else {
        setError(response.message || t('aiHealthCheck.errorAnalysisFailed'));
      }
    } catch (err) {
      setError(err.message || t('aiHealthCheck.errorConnectionFailed'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedAnimal(null);
    setSelectedImage(null);
    setSymptoms('');
    setAge('');
    setAdditionalInfo('');
    setCustomQuestion('');
    setResult(null);
    setError(null);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader
        safeArea={false}
        navigation={navigation}
        title={t('aiHealthCheck.title')}
        subtitle={t('aiHealthCheck.uploadPhotoDesc')}
        rightActions={[
          {
            icon: 'help-circle-outline',
            onPress: () => setHelpVisible(true),
            color: COLORS.primary,
            backgroundColor: COLORS.primarySoft,
            accessibilityLabel: 'Open AI health help',
          },
        ]}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingBottom: 32 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          {!result ? (
            <>
              <StepHeader currentStep={selectedAnimal ? selectedImage ? 3 : 2 : 1} t={t} />

              <Section title={t('aiHealthCheck.selectAnimal')} step="1">
                <View style={styles.animalGrid}>
                  {ANIMAL_TYPES.map((animal) => {
                    const active = selectedAnimal === animal.id;
                    return (
                      <TouchableOpacity
                        key={animal.id}
                        style={[styles.animalCard, active && styles.animalCardActive]}
                        onPress={() => {
                          setSelectedAnimal(animal.id);
                          setError(null);
                        }}
                        activeOpacity={0.85}
                      >
                        <View style={styles.animalImageWrap}>
                          {animal.image ? (
                            <Image source={animal.image} style={styles.animalImage} resizeMode="contain" />
                          ) : (
                            <Ionicons name={animal.icon} size={30} color={COLORS.primary} />
                          )}
                        </View>
                        <Text style={[styles.animalName, active && styles.animalNameActive]}>
                          {t(`animalTypes.${animal.id}`, { defaultValue: animal.id })}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Section>

              <Section title={t('aiHealthCheck.uploadPhoto')} step="2">
                <TouchableOpacity style={styles.uploadBox} onPress={chooseImageSource} activeOpacity={0.9}>
                  {selectedImage ? (
                    <View>
                      <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
                      <View style={styles.changePhotoPill}>
                        <Ionicons name="camera-outline" size={16} color={COLORS.surface} />
                        <Text style={styles.changePhotoText}>{t('common.change')}</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.uploadEmpty}>
                      <View style={styles.uploadIcon}>
                        <Ionicons name="image-outline" size={30} color={COLORS.primary} />
                      </View>
                      <Text style={styles.uploadTitle}>{t('aiHealthCheck.clickOrChoose')}</Text>
                      <Text style={styles.uploadHint}>{t('aiHealthCheck.fileFormats')}</Text>
                      <Text style={styles.uploadHintSmall}>{t('aiHealthCheck.autoOptimizeHint')}</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <View style={styles.imageActionRow}>
                  <TouchableOpacity style={styles.secondaryButton} onPress={takePhoto} activeOpacity={0.85}>
                    <Ionicons name="camera-outline" size={18} color={COLORS.primary} />
                    <Text style={styles.secondaryButtonText}>{t('aiHealthCheck.takePhoto')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryButton} onPress={pickImage} activeOpacity={0.85}>
                    <Ionicons name="images-outline" size={18} color={COLORS.primary} />
                    <Text style={styles.secondaryButtonText}>{t('aiHealthCheck.choosePhoto')}</Text>
                  </TouchableOpacity>
                </View>
              </Section>

              <Section title={t('aiHealthCheck.additionalInfo')} step="3">
                <Input
                  label={t('aiHealthCheck.age')}
                  value={age}
                  onChangeText={setAge}
                  placeholder={t('aiHealthCheck.agePlaceholder')}
                />
                <Input
                  label={t('aiHealthCheck.symptoms')}
                  value={symptoms}
                  onChangeText={setSymptoms}
                  placeholder={t('aiHealthCheck.symptomsPlaceholder')}
                  multiline
                />
                <Input
                  label={t('aiHealthCheck.moreInfo')}
                  value={additionalInfo}
                  onChangeText={setAdditionalInfo}
                  placeholder={t('aiHealthCheck.additionalInfoPlaceholder')}
                  multiline
                />

                <View style={styles.questionBox}>
                  <View style={styles.questionHeader}>
                    <View>
                      <Text style={styles.questionTitle}>{t('aiHealthCheck.askQuestionLabel')}</Text>
                      <Text style={styles.questionHint}>{t('aiHealthCheck.askQuestionInlineHint')}</Text>
                    </View>
                    <Text style={styles.aiBadge}>AI</Text>
                  </View>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={customQuestion}
                    onChangeText={setCustomQuestion}
                    placeholder={t('aiHealthCheck.askQuestionPlaceholder')}
                    placeholderTextColor={COLORS.borderStrong}
                    multiline
                  />
                </View>
              </Section>

              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={20} color={COLORS.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.analyzeButton, loading && styles.analyzeButtonDisabled]}
                onPress={analyzeHealth}
                disabled={loading}
                activeOpacity={0.9}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.surface} size="small" />
                ) : (
                  <Ionicons name="analytics-outline" size={22} color={COLORS.surface} />
                )}
                <Text style={styles.analyzeButtonText}>
                  {loading ? t('aiHealthCheck.analyzing') : t('aiHealthCheck.analyze')}
                </Text>
              </TouchableOpacity>

              <View style={styles.disclaimerBox}>
                <Ionicons name="information-circle-outline" size={18} color={COLORS.textMuted} />
                <Text style={styles.disclaimerText}>{t('aiHealthCheck.disclaimer')}</Text>
              </View>
            </>
          ) : (
            <View style={styles.resultsWrap}>
              <ResultCard title={t('aiHealthCheck.results')} icon="document-text-outline">
                <Text style={styles.resultHeadline}>
                  {toDisplayText(result.overallHealth, t('aiHealthCheck.sectionOverview'))}
                </Text>
                <Text style={styles.resultLead}>
                  {toDisplayText(primaryRecommendation || result.whenToSeeVet || result.disclaimer, t('aiHealthCheck.disclaimer'))}
                </Text>
                <View style={styles.badgeRow}>
                  <Badge label={toDisplayText(urgencyLevel)} color={getUrgencyColor(urgencyLevel)} />
                  <Badge label={toDisplayText(result.animalType || t(`animalTypes.${selectedAnimal}`, { defaultValue: selectedAnimal }))} color={COLORS.primary} />
                  <Badge label={`${t('aiHealthCheck.bodyCondition')}: ${bodyScore}/5`} color={COLORS.info} />
                </View>

                <View style={styles.summaryGrid}>
                  <SummaryItem
                    label={t('aiHealthCheck.healthScore')}
                    value={toDisplayText(healthScore, '?')}
                    color={getScoreColor(healthScore)}
                  />
                  <SummaryItem
                    label={t('aiHealthCheck.bodyCondition')}
                    value={getBodyConditionText(bodyScore, t)}
                    subvalue={`${bodyScore}/5`}
                    color={COLORS.info}
                  />
                  <SummaryItem
                    label={t('aiHealthCheck.animal')}
                    value={toDisplayText(result.animalType || t(`animalTypes.${selectedAnimal}`, { defaultValue: '-' }))}
                    color={COLORS.primary}
                  />
                </View>
              </ResultCard>

              {(result.questionAnswer || result.questionError) ? (
                <ResultCard title={t('aiHealthCheck.askQuestionResponseTitle')} icon="help-circle-outline">
                  {result.questionAsked ? (
                    <View style={styles.questionAskedBox}>
                      <Text style={styles.questionAskedLabel}>{t('aiHealthCheck.yourQuestion')}</Text>
                      <Text style={styles.questionAskedText}>{toDisplayText(result.questionAsked)}</Text>
                    </View>
                  ) : null}
                  <Text style={styles.paragraph}>
                    {toDisplayText(result.questionAnswer || result.questionError || t('aiHealthCheck.errorPromptFailed'))}
                  </Text>
                </ResultCard>
              ) : null}

              {result.estimatedAge ? (
                <ResultCard title={t('aiHealthCheck.estimatedAge')} icon="calendar-outline">
                  <InfoRow label={t('aiHealthCheck.age')} value={toDisplayText(result.estimatedAge)} />
                </ResultCard>
              ) : null}

              {result.breedingReadiness ? (
                <ResultCard title={t('aiHealthCheck.breedingReadiness')} icon="git-compare-outline">
                  <InfoRow label={t('aiHealthCheck.status')} value={toDisplayText(result.breedingReadiness.matingReadinessStatus || result.breedingReadiness.status)} />
                  <InfoRow label={t('aiHealthCheck.advice')} value={toDisplayText(result.breedingReadiness.matingAdvice || result.breedingReadiness.advice)} />
                  <InfoRow label={t('aiHealthCheck.details')} value={toDisplayText(result.breedingReadiness)} />
                </ResultCard>
              ) : null}

              {result.pregnancyInfo ? (
                <ResultCard title={t('aiHealthCheck.pregnancyInfo')} icon="paw-outline">
                  <InfoRow label={t('aiHealthCheck.status')} value={toDisplayText(result.pregnancyInfo.pregnancyReadinessStatus || result.pregnancyInfo.status)} />
                  <InfoRow label={t('aiHealthCheck.advice')} value={toDisplayText(result.pregnancyInfo.pregnancyAdvice || result.pregnancyInfo.advice)} />
                  <InfoRow label={t('aiHealthCheck.details')} value={toDisplayText(result.pregnancyInfo)} />
                </ResultCard>
              ) : null}

              <ListCard title={t('aiHealthCheck.visibleSigns')} icon="eye-outline" items={result.visibleSigns} />
              <ListCard title={t('aiHealthCheck.healthyIndicators')} icon="checkmark-circle-outline" items={result.healthyIndicators} color={COLORS.success} />
              <IssueCard title={t('aiHealthCheck.potentialIssues')} icon="warning-outline" items={result.potentialIssues} />
              <ListCard title={t('aiHealthCheck.recommendations')} icon="bulb-outline" items={result.recommendations} color={COLORS.primary} />
              <ListCard title={t('aiHealthCheck.dietarySuggestions')} icon="leaf-outline" items={result.dietarySuggestions} color={COLORS.primaryDark} />

              {result.whenToSeeVet ? (
                <ResultCard title={t('aiHealthCheck.whenToSeeVet')} icon="medical-outline">
                  <View style={styles.vetWarning}>
                    <Ionicons name="warning-outline" size={22} color={COLORS.error} />
                    <Text style={styles.vetWarningText}>{toDisplayText(result.whenToSeeVet)}</Text>
                  </View>
                </ResultCard>
              ) : null}

              {result.disclaimer ? (
                <View style={styles.disclaimerBox}>
                  <Ionicons name="information-circle-outline" size={18} color={COLORS.textMuted} />
                  <Text style={styles.disclaimerText}>{toDisplayText(result.disclaimer)}</Text>
                </View>
              ) : null}

              <TouchableOpacity style={styles.analyzeButton} onPress={resetForm} activeOpacity={0.9}>
                <Ionicons name="refresh-outline" size={22} color={COLORS.surface} />
                <Text style={styles.analyzeButtonText}>{t('aiHealthCheck.newCheck')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <FeatureHelpModal
        visible={helpVisible}
        onClose={() => setHelpVisible(false)}
        title={aiHealthHelp?.localized?.title || t('aiHealthCheck.title', { defaultValue: 'AI Health Check Guide' })}
        imageSource={aiHealthHelp?.image}
        helpContent={aiHealthHelp?.localized}
        t={t}
      />
    </SafeAreaView>
  );
};

const StepHeader = ({ currentStep, t }) => (
  <View style={styles.stepCard}>
    {[1, 2, 3].map((step) => (
      <React.Fragment key={step}>
        <View style={styles.stepItem}>
          <View style={[styles.stepCircle, currentStep >= step && styles.stepCircleActive]}>
            <Text style={[styles.stepNumber, currentStep >= step && styles.stepNumberActive]}>{step}</Text>
          </View>
          <Text style={[styles.stepLabel, currentStep >= step && styles.stepLabelActive]}>
            {step === 1 ? t('aiHealthCheck.step1') : step === 2 ? t('aiHealthCheck.step2') : t('aiHealthCheck.step3')}
          </Text>
        </View>
        {step < 3 ? <View style={styles.stepLine} /> : null}
      </React.Fragment>
    ))}
  </View>
);

const Section = ({ title, step, children }) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      <View style={styles.sectionStep}>
        <Text style={styles.sectionStepText}>{step}</Text>
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

const Input = ({ label, multiline = false, ...props }) => (
  <View style={styles.inputWrap}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      style={[styles.input, multiline && styles.textArea]}
      placeholderTextColor={COLORS.borderStrong}
      multiline={multiline}
      {...props}
    />
  </View>
);

const ResultCard = ({ title, icon, children }) => (
  <View style={styles.resultCard}>
    <View style={styles.resultCardHeader}>
      <View style={styles.resultIcon}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>
      <Text style={styles.resultCardTitle}>{title}</Text>
    </View>
    <View style={styles.resultCardBody}>{children}</View>
  </View>
);

const Badge = ({ label, color }) => (
  <View style={[styles.badge, { backgroundColor: `${color}18`, borderColor: `${color}55` }]}>
    <Text style={[styles.badgeText, { color }]}>{label}</Text>
  </View>
);

const SummaryItem = ({ label, value, subvalue, color }) => (
  <View style={styles.summaryItem}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <View style={[styles.scoreCircle, { backgroundColor: `${color}18`, borderColor: color }]}>
      <Text style={[styles.scoreText, { color }]}>{value}</Text>
    </View>
    {subvalue ? <Text style={styles.summarySubvalue}>{subvalue}</Text> : null}
  </View>
);

const InfoRow = ({ label, value }) => {
  const text = toDisplayText(value);
  if (!text || text === '-') return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{text}</Text>
    </View>
  );
};

const ListCard = ({ title, icon, items, color = COLORS.textMuted }) => {
  const list = normalizeList(items);
  if (list.length === 0) return null;
  return (
    <ResultCard title={title} icon={icon}>
      {list.map((item, index) => (
        <View key={`${title}-${index}`} style={styles.listItem}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={styles.listText}>{toDisplayText(item)}</Text>
        </View>
      ))}
    </ResultCard>
  );
};

const IssueCard = ({ title, icon, items }) => {
  const list = normalizeList(items);
  if (list.length === 0) return null;
  return (
    <ResultCard title={title} icon={icon}>
      {list.map((issue, index) => {
        const severity = issue?.severity || issue?.level || '';
        const severityColor = getUrgencyColor(severity);
        return (
          <View key={`${title}-${index}`} style={styles.issueItem}>
            <View style={styles.issueHeader}>
              <Text style={styles.issueTitle}>{toDisplayText(issue?.issue || issue?.condition || issue?.title || issue)}</Text>
              {severity ? <Badge label={toDisplayText(severity)} color={severityColor} /> : null}
            </View>
            {issue?.description ? <Text style={styles.issueDescription}>{toDisplayText(issue.description)}</Text> : null}
          </View>
        );
      })}
    </ResultCard>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceAlt,
  },
  headerText: {
    flex: 1,
  },
  helpButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primarySoft,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
  },
  subtitle: {
    marginTop: 3,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 14,
    gap: 14,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepItem: {
    alignItems: 'center',
    gap: 5,
    width: 80,
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceAlt,
  },
  stepCircleActive: {
    backgroundColor: COLORS.primary,
  },
  stepNumber: {
    color: COLORS.textMuted,
    fontWeight: '900',
  },
  stepNumberActive: {
    color: COLORS.surface,
  },
  stepLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '800',
    textAlign: 'center',
  },
  stepLabelActive: {
    color: COLORS.text,
  },
  stepLine: {
    width: 24,
    height: 1,
    backgroundColor: COLORS.border,
  },
  sectionCard: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionStep: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  sectionStepText: {
    color: COLORS.surface,
    fontWeight: '900',
  },
  sectionTitle: {
    flex: 1,
    fontSize: 17,
    color: COLORS.text,
    fontWeight: '900',
  },
  animalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  animalCard: {
    width: '30.8%',
    minHeight: 112,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
  },
  animalCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
  },
  animalImageWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  animalImage: {
    width: 52,
    height: 52,
  },
  animalName: {
    marginTop: 8,
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  animalNameActive: {
    color: COLORS.primaryDeep,
  },
  uploadBox: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
  },
  uploadEmpty: {
    padding: 26,
    alignItems: 'center',
  },
  uploadIcon: {
    width: 66,
    height: 66,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primarySoft,
    marginBottom: 12,
  },
  uploadTitle: {
    color: COLORS.text,
    fontWeight: '900',
    textAlign: 'center',
  },
  uploadHint: {
    marginTop: 5,
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  uploadHintSmall: {
    marginTop: 5,
    color: COLORS.borderStrong,
    fontSize: 11,
    textAlign: 'center',
  },
  previewImage: {
    width: '100%',
    height: 230,
  },
  changePhotoPill: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.text,
  },
  changePhotoText: {
    color: COLORS.surface,
    fontWeight: '800',
  },
  imageActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontWeight: '900',
    fontSize: 12,
  },
  inputWrap: {
    marginBottom: 12,
  },
  inputLabel: {
    marginBottom: 7,
    color: COLORS.text,
    fontWeight: '900',
    fontSize: 13,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    color: COLORS.text,
    backgroundColor: COLORS.surfaceAlt,
    fontWeight: '700',
  },
  textArea: {
    minHeight: 92,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  questionBox: {
    padding: 13,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  questionTitle: {
    color: COLORS.text,
    fontWeight: '900',
  },
  questionHint: {
    marginTop: 3,
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  aiBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    color: COLORS.primary,
    fontWeight: '900',
    fontSize: 11,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 13,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.error,
    backgroundColor: COLORS.errorSoft,
  },
  errorText: {
    flex: 1,
    color: COLORS.error,
    fontWeight: '700',
    lineHeight: 19,
  },
  analyzeButton: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
  },
  analyzeButtonDisabled: {
    opacity: 0.7,
  },
  analyzeButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '900',
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    padding: 13,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  disclaimerText: {
    flex: 1,
    color: COLORS.textMuted,
    lineHeight: 19,
    fontSize: 12,
  },
  resultsWrap: {
    gap: 14,
  },
  resultCard: {
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  resultCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  resultIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primarySoft,
  },
  resultCardTitle: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '900',
  },
  resultCardBody: {
    padding: 14,
  },
  resultHeadline: {
    color: COLORS.text,
    fontSize: 21,
    fontWeight: '900',
    lineHeight: 28,
  },
  resultLead: {
    marginTop: 9,
    color: COLORS.textMuted,
    lineHeight: 22,
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 13,
  },
  badge: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '900',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 14,
  },
  summaryItem: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: COLORS.surfaceAlt,
  },
  summaryLabel: {
    minHeight: 32,
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '800',
  },
  scoreCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginTop: 6,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  summarySubvalue: {
    marginTop: 5,
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  questionAskedBox: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  questionAskedLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  questionAskedText: {
    marginTop: 6,
    color: COLORS.text,
    fontWeight: '800',
    lineHeight: 20,
  },
  paragraph: {
    color: COLORS.text,
    lineHeight: 22,
    fontWeight: '600',
  },
  infoRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '900',
  },
  infoValue: {
    marginTop: 4,
    color: COLORS.text,
    fontWeight: '700',
    lineHeight: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    paddingVertical: 7,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 7,
  },
  listText: {
    flex: 1,
    color: COLORS.text,
    lineHeight: 21,
    fontWeight: '600',
  },
  issueItem: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 9,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'flex-start',
  },
  issueTitle: {
    flex: 1,
    color: COLORS.text,
    fontWeight: '900',
    lineHeight: 20,
  },
  issueDescription: {
    marginTop: 8,
    color: COLORS.textMuted,
    lineHeight: 20,
    fontWeight: '600',
  },
  vetWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: COLORS.errorSoft,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  vetWarningText: {
    flex: 1,
    color: COLORS.error,
    lineHeight: 21,
    fontWeight: '700',
  },
});

export default AIHealthCheckScreen;
