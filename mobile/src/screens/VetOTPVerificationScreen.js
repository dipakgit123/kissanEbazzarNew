import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../utils/constants';
import { veterinarianService } from '../services/api';
import { useVetAuth } from '../context/VetAuthContext';

const OTP_LENGTH = 6;

const VetOTPVerificationScreen = ({ route, navigation }) => {
  const { phoneNumber } = route.params;
  const { login } = useVetAuth();
  const { t } = useTranslation();
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (resendTimer <= 0) {
      return undefined;
    }

    const timer = setTimeout(() => setResendTimer((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const handleVerifyOTP = async (otpCode = null) => {
    const code = otpCode || otp.join('');

    if (code.length !== OTP_LENGTH) {
      Alert.alert(t('common.error'), t('auth.invalidOtp'));
      return;
    }

    setLoading(true);
    try {
      const response = await veterinarianService.verifyOTP(phoneNumber, code);

      if (response.success) {
        await login(response.token, response.veterinarian);
        navigation.replace('VetDashboard');
        return;
      }

      Alert.alert(t('common.error'), response.message || t('auth.invalidOtp'));
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || t('errors.somethingWentWrong');
      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value, index) => {
    const digits = value.replace(/\D/g, '');

    if (digits.length > 1) {
      const pastedOtp = digits.slice(0, OTP_LENGTH).split('');
      const nextOtp = [...Array(OTP_LENGTH)].map((_, otpIndex) => pastedOtp[otpIndex] || '');
      setOtp(nextOtp);

      if (pastedOtp.length === OTP_LENGTH) {
        handleVerifyOTP(pastedOtp.join(''));
      } else {
        inputRefs.current[Math.min(pastedOtp.length, OTP_LENGTH - 1)]?.focus();
      }
      return;
    }

    if (digits.length <= 1) {
      const nextOtp = [...otp];
      nextOtp[index] = digits;
      setOtp(nextOtp);

      if (digits && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      if (index === OTP_LENGTH - 1 && digits && nextOtp.every(Boolean)) {
        handleVerifyOTP(nextOtp.join(''));
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0 || loading) {
      return;
    }

    setLoading(true);
    try {
      const response = await veterinarianService.resendOTP(phoneNumber);

      if (response.success) {
        setOtp(Array(OTP_LENGTH).fill(''));
        setResendTimer(60);
        inputRefs.current[0]?.focus();
        Alert.alert(t('common.success'), t('auth.otpSent'));
      } else {
        Alert.alert(t('common.error'), response.message || t('errors.somethingWentWrong'));
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || t('errors.somethingWentWrong');
      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="shield-checkmark" size={48} color={COLORS.white} />
          </View>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>{t('auth.verifyOTP')}</Text>
          <Text style={styles.subtitle}>
            {t('auth.enterOtpCode')}
            {'\n'}
            <Text style={styles.phoneText}>{phoneNumber}</Text>
          </Text>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[styles.otpInput, digit && styles.otpInputFilled]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={OTP_LENGTH}
                autoFocus={index === 0}
                selectTextOnFocus
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={() => handleVerifyOTP()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>{t('vetAuth.verifyAndLogin')}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            {resendTimer > 0 ? (
              <Text style={styles.resendText}>{t('auth.resendIn', { seconds: resendTimer })}</Text>
            ) : (
              <TouchableOpacity onPress={handleResendOTP} disabled={loading}>
                <Text style={styles.resendLink}>{t('auth.resendOTP')}</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.changeNumberButton} onPress={() => navigation.goBack()}>
            <Ionicons name="phone-portrait-outline" size={18} color={COLORS.gray} />
            <Text style={styles.changeNumberText}>{t('vetAuth.changePhoneNumber')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 24,
    zIndex: 10,
    padding: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  formContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  phoneText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    backgroundColor: COLORS.surfaceAlt,
  },
  otpInputFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  resendText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  resendLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  changeNumberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  changeNumberText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
});

export default VetOTPVerificationScreen;
