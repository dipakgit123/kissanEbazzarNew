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
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../utils/constants';
import { useVetAuth } from '../context/VetAuthContext';
import { veterinarianService } from '../services/api';
import LanguageSwitcher from '../components/LanguageSwitcher';

const { width, height } = Dimensions.get('window');

const VetLoginScreen = ({ navigation }) => {
  const { t, ready } = useTranslation();
  const { login } = useVetAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  // Show loading while translations are loading
  if (!ready) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const validateEmail = (email) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  };

  const handleLogin = async () => {
    setError('');

    // Validation
    if (!email.trim()) {
      setError(t('vetLogin.emailRequired') || 'Email is required');
      return;
    }

    if (!validateEmail(email.trim())) {
      setError(t('vetLogin.emailInvalid') || 'Please enter a valid email');
      return;
    }

    if (!password) {
      setError(t('vetLogin.passwordRequired') || 'Password is required');
      return;
    }

    if (password.length < 6) {
      setError(t('vetLogin.passwordMinLength') || 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await veterinarianService.login({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (response.success && response.token) {
        await login(response.token, response.veterinarian);
        Alert.alert(
          t('common.success'),
          t('vetLogin.loginSuccess') || 'Login successful!'
        );
      } else {
        setError(response.message || t('vetLogin.loginFailed'));
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.response?.status === 403) {
        setError(err.response?.data?.message || t('vetLogin.accountPending'));
      } else {
        setError(err.response?.data?.message || t('vetLogin.loginFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Image Section */}
        <View style={styles.imageContainer}>
          <Image
            source={require('../assets/login2.png')}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.imageOverlay} />
          
          {/* Language Switcher Button */}
          <TouchableOpacity 
            style={styles.languageButton}
            onPress={() => setLanguageModalVisible(true)}
          >
            <Ionicons name="language" size={20} color="#fff" />
            <Text style={styles.languageButtonText}>{t('profile.language')}</Text>
          </TouchableOpacity>
          
          <View style={styles.headerTextContainer}>
            <View style={styles.iconBadge}>
              <Ionicons name="medical" size={32} color="#fff" />
            </View>
            <Text style={styles.appTitle}>{t('vetAuth.loginTitle')}</Text>
            <Text style={styles.appSubtitle}>{t('vetAuth.loginSubtitle')}</Text>
          </View>
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          <View style={styles.formContent}>
            <Text style={styles.welcomeText}>{t('vetAuth.welcome')}</Text>
            <Text style={styles.subtitle}>{t('vetAuth.loginToContinue')}</Text>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('vetAuth.emailPlaceholder') || 'Email Address'}
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder={t('vetAuth.passwordPlaceholder') || 'Password'}
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setError('');
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>{t('vetAuth.loginButton')}</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>{t('vetAuth.dontHaveAccount')}</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('VetRegistration')}
                disabled={loading}
              >
                <Text style={styles.registerLink}>{t('vetAuth.registerNow')}</Text>
              </TouchableOpacity>
            </View>

            {/* Back to Farmer Login */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate('Login')}
              disabled={loading}
            >
              <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
              <Text style={styles.backButtonText}>{t('vetAuth.backToFarmerLogin')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      
      <LanguageSwitcher 
        visible={languageModalVisible} 
        onClose={() => setLanguageModalVisible(false)} 
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  imageContainer: {
    width: '100%',
    height: height * 0.35,
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
    backgroundColor: 'rgba(59, 130, 246, 0.5)',
  },
  languageButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    zIndex: 10,
  },
  languageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTextContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    paddingTop: 30,
  },
  formContent: {
    paddingHorizontal: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#DC2626',
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
    gap: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 4,
  },
  registerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 30,
    gap: 8,
  },
  backButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
});

export default VetLoginScreen;
