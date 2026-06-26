import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../utils/constants';
import { API_URL, otpService } from '../services/api';

const { width, height } = Dimensions.get('window');
const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'mr', label: 'मराठी' },
  { code: 'hi', label: 'हिंदी' },
];

const LoginScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validatePhone = (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const selectedLanguage = i18n.resolvedLanguage || i18n.language || 'en';

  const handleLanguageChange = async (languageCode) => {
    if (selectedLanguage === languageCode) {
      return;
    }

    await i18n.changeLanguage(languageCode);
  };

  const handleSendOTP = async () => {
    setError('');
    
    if (!phoneNumber.trim()) {
      setError(t('validation.required'));
      return;
    }

    if (!validatePhone(phoneNumber)) {
      setError(t('validation.invalidPhone'));
      return;
    }

    setLoading(true);
    try {
      const fullPhoneNumber = `+91${phoneNumber}`;
      const response = await otpService.sendOTP(fullPhoneNumber);
      if (response.success) {
        Alert.alert(
          t('auth.otpSent'),
          t('auth.otpSentMessage'),
          [{ text: t('common.ok'), onPress: () => navigation.navigate('OTPVerification', { phoneNumber: fullPhoneNumber }) }]
        );
      } else {
        setError(response.message || t('errors.somethingWentWrong'));
      }
    } catch (error) {
      if (error.message === 'Network Error') {
        let apiProbe = 'not checked';
        try {
          const probeResponse = await fetch(`${API_URL}/api`);
          apiProbe = `${probeResponse.status} ${probeResponse.ok ? 'OK' : 'FAILED'}`;
        } catch (probeError) {
          apiProbe = probeError.message || 'failed';
        }

        setError(`Network Error\nServer URL: ${API_URL}\nAPI check: ${apiProbe}`);
      } else {
        setError(error.message || t('errors.somethingWentWrong'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {/* Hero Image Section with Gradient Overlay */}
        <View style={styles.imageContainer}>
          <Image
            source={require('../assets/login1.png')}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.imageOverlay} />

          <View style={styles.headerTextContainer}>
            <Text style={styles.appTitle}>{t('common.appName')}</Text>
            <Text style={styles.appSubtitle}>{t('home.heroSubtitle')}</Text>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.contentContainer}>
          {/* Welcome Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('auth.loginTitle')}</Text>
            <Text style={styles.subtitle}>{t('auth.loginSubtitle')}</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>{t('auth.phoneNumber')}</Text>
              <View style={styles.inputContainer}>
                <View style={styles.countryCodeContainer}>
                  <Text style={styles.countryCode}>+91</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.phoneNumberPlaceholder')}
                  placeholderTextColor={COLORS.borderStrong}
                  value={phoneNumber}
                  onChangeText={(text) => {
                    setPhoneNumber(text.replace(/[^0-9]/g, ''));
                    setError('');
                  }}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                {phoneNumber.length === 10 && validatePhone(phoneNumber) && (
                  <Ionicons name="checkmark-circle" size={22} color={COLORS.success} style={styles.validIcon} />
                )}
              </View>
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color={COLORS.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.button, (loading || phoneNumber.length !== 10 || !validatePhone(phoneNumber)) && styles.buttonDisabled]}
              onPress={handleSendOTP}
              disabled={loading || phoneNumber.length !== 10 || !validatePhone(phoneNumber)}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>{t('auth.sendOTP')}</Text>
                  <Ionicons name="arrow-forward-circle" size={24} color={COLORS.white} />
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('common.or')}</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Veterinarian Login Card */}
            <TouchableOpacity
              style={styles.vetLoginCard}
              onPress={() => navigation.navigate('VetLogin')}
              activeOpacity={0.9}
            >
              <View style={styles.vetLoginIconContainer}>
                <Ionicons name="medkit" size={24} color={COLORS.white} />
              </View>
              <View style={styles.vetLoginTextContainer}>
                <Text style={styles.vetLoginText}>{t('auth.loginAsVet')}</Text>
                <Text style={styles.vetLoginSubtext}>{t('vetAuth.loginSubtitle')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.primary} />
            </TouchableOpacity>

            <View style={styles.languageSection}>
              <View style={styles.languageDivider}>
                <View style={styles.languageDividerLine} />
                <Text style={styles.languageSectionLabel}>{t('profile.language')} / भाषा</Text>
                <View style={styles.languageDividerLine} />
              </View>

              <View style={styles.languagePillRow}>
                {LANGUAGE_OPTIONS.map((language) => {
                  const isActive = selectedLanguage === language.code;

                  return (
                    <TouchableOpacity
                      key={language.code}
                      style={[
                        styles.languagePill,
                        isActive && styles.languagePillActive,
                      ]}
                      onPress={() => handleLanguageChange(language.code)}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.languagePillText,
                          isActive && styles.languagePillTextActive,
                        ]}
                      >
                        {language.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <Text style={styles.termsText}>
              {t('auth.termsAgree')}{' '}
              <Text
                style={styles.linkText}
                onPress={() => navigation.navigate('LegalDocument', { type: 'terms' })}
              >
                {t('auth.termsOfService')}
              </Text>
              {' '}{t('auth.and')}{' '}
              <Text
                style={styles.linkText}
                onPress={() => navigation.navigate('LegalDocument', { type: 'privacy' })}
              >
                {t('auth.privacyPolicy')}
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  imageContainer: {
    height: height * 0.35,
    width: width,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 110, 86, 0.35)',
  },
  headerTextContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  appSubtitle: {
    fontSize: 16,
    color: COLORS.white,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
  form: {
    width: '100%',
  },
  inputWrapper: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingRight: 12,
  },
  countryCodeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  validIcon: {
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorSoft,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: COLORS.borderStrong,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    color: COLORS.borderStrong,
    fontSize: 14,
    marginHorizontal: 16,
    fontWeight: '500',
  },
  vetLoginCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: COLORS.primary + '30',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  vetLoginIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  vetLoginTextContainer: {
    flex: 1,
  },
  vetLoginText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  vetLoginSubtext: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  languageSection: {
    marginBottom: 18,
  },
  languageDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  languageDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  languageSectionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.borderStrong,
    marginHorizontal: 12,
  },
  languagePillRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  languagePill: {
    minWidth: 82,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  languagePillActive: {
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.secondary,
  },
  languagePillText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  languagePillTextActive: {
    color: COLORS.primaryDark,
  },
  linkText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  termsText: {
    fontSize: 12,
    color: COLORS.borderStrong,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
});

export default LoginScreen;

