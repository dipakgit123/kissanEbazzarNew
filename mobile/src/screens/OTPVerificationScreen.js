import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../utils/constants';
import { otpService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  registerForPushNotifications,
  registerTokenWithBackend,
} from '../services/notificationService';

const OTP_LENGTH = 6;

const OTPVerificationScreen = ({ route, navigation }) => {
  const { phoneNumber } = route.params;
  const { login } = useAuth();
  const { t } = useTranslation();
  const [otpValue, setOtpValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const otpInputRef = useRef(null);
  const displayPhoneNumber = phoneNumber?.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
  const otpDigits = Array.from({ length: OTP_LENGTH }, (_, index) => otpValue[index] || '');

  useEffect(() => {
    const timer = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const focusTimer = setTimeout(() => {
      otpInputRef.current?.focus();
    }, 250);

    return () => clearTimeout(focusTimer);
  }, []);

  const registerPushToken = async () => {
    try {
      const pushToken = await registerForPushNotifications();
      if (pushToken) {
        await registerTokenWithBackend(pushToken);
      }
    } catch (error) {
      console.log('Push token registration failed:', error?.message || error);
    }
  };

  const handleVerifyOTP = async (otpCode = null) => {
    const otpString = otpCode || otpValue;

    if (otpString.length !== OTP_LENGTH) {
      Alert.alert(t('common.error'), t('auth.invalidOtp'));
      return;
    }

    setLoading(true);
    try {
      const response = await otpService.verifyOTP(phoneNumber, otpString);
      if (response.success) {
        await login(response.token, response.user);
        await registerPushToken();

        if (response.requiresProfileCompletion) {
          navigation.replace('ProfileCompletion');
        } else {
          navigation.replace('MainTabs');
        }
        return;
      }

      Alert.alert(t('common.error'), response.message || t('auth.invalidOtp'));
    } catch (error) {
      Alert.alert(t('common.error'), error.message || t('errors.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value) => {
    const digits = value.replace(/\D/g, '');
    const nextOtp = digits.slice(0, OTP_LENGTH);
    setOtpValue(nextOtp);

    if (nextOtp.length === OTP_LENGTH) {
      handleVerifyOTP(nextOtp);
    }
  };

  const focusOtpInput = () => {
    otpInputRef.current?.focus();
  };

  const getResendTimerLabel = () => {
    const minutes = Math.floor(resendTimer / 60);
    const seconds = resendTimer % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0 || loading) {
      return;
    }

    setLoading(true);
    try {
      const response = await otpService.resendOTP(phoneNumber);
      if (response.success) {
        setOtpValue('');
        setResendTimer(30);
        focusOtpInput();
        Alert.alert(t('common.success'), t('auth.otpSent'));
      } else {
        Alert.alert(t('common.error'), response.message || t('errors.somethingWentWrong'));
      }
    } catch (error) {
      Alert.alert(t('common.error'), error.message || t('errors.somethingWentWrong'));
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
          <Ionicons name="arrow-back" size={18} color={COLORS.text} />
          <Text style={styles.backButtonText}>{t('auth.changeNumber')}</Text>
        </TouchableOpacity>

        <View style={styles.headerContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="chatbox-ellipses-outline" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>{t('auth.verifyNumberTitle')}</Text>
          <Text style={styles.subtitle}>
            {t('auth.otpSentTo')}
            {' '}
            <Text style={styles.phoneText}>{displayPhoneNumber}</Text>
          </Text>
          <Text style={styles.helperText}>
            {t('auth.enterOtpCodeBelow')}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.otpSection}
          onPress={focusOtpInput}
          activeOpacity={1}
        >
          <TextInput
            ref={otpInputRef}
            style={styles.overlayOtpInput}
            value={otpValue}
            onChangeText={handleOtpChange}
            keyboardType="number-pad"
            maxLength={OTP_LENGTH}
            autoFocus
            textContentType="oneTimeCode"
            autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
            importantForAutofill="yes"
            underlineColorAndroid="transparent"
            selectionColor="transparent"
            contextMenuHidden={false}
            autoCorrect={false}
            spellCheck={false}
            blurOnSubmit={false}
          />

          <View style={styles.otpContainer}>
            {otpDigits.map((digit, index) => (
              <View
                key={index}
                style={[
                  styles.otpInputBox,
                  digit ? styles.otpInputFilled : styles.otpInputEmpty,
                  otpValue.length === index && styles.otpInputActive,
                ]}
              >
                <Text style={[styles.otpDigit, !digit && styles.otpPlaceholder]}>
                  {digit || '–'}
                </Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>

        <View style={styles.resendRow}>
          <Text style={styles.resendCountdown}>
            {resendTimer > 0
              ? `${t('auth.resendOtpIn')} ${getResendTimerLabel()}`
              : t('auth.didNotReceiveCode')}
          </Text>
          <TouchableOpacity onPress={handleResendOTP} disabled={resendTimer > 0 || loading}>
            <Text
              style={[
                styles.resendButton,
                (resendTimer > 0 || loading) && styles.resendButtonDisabled,
              ]}
            >
              {t('auth.resend')}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            (loading || otpValue.length !== OTP_LENGTH) && styles.buttonDisabled,
          ]}
          onPress={() => handleVerifyOTP()}
          disabled={loading || otpValue.length !== OTP_LENGTH}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <View style={styles.buttonContent}>
              <Text style={styles.buttonText}>{t('auth.verifyAndContinue')}</Text>
              <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.white} />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={18} color={COLORS.primaryDark} />
          <Text style={styles.infoText}>{t('auth.otpValidityNote')}</Text>
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
    paddingTop: 56,
  },
  backButton: {
    marginBottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  headerContainer: {
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: 4,
  },
  phoneText: {
    fontWeight: '700',
    color: COLORS.text,
  },
  helperText: {
    fontSize: 15,
    color: COLORS.textMuted,
    lineHeight: 22,
  },
  otpSection: {
    marginBottom: 18,
    position: 'relative',
  },
  overlayOtpInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.02,
    color: 'transparent',
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  otpInputBox: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpInputFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
  },
  otpInputEmpty: {
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  otpInputActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
  },
  otpDigit: {
    fontSize: 30,
    fontWeight: '700',
    color: COLORS.primary,
  },
  otpPlaceholder: {
    color: COLORS.borderStrong,
    fontWeight: '500',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 12,
  },
  resendCountdown: {
    flex: 1,
    fontSize: 14,
    color: COLORS.borderStrong,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 18,
  },
  buttonDisabled: {
    backgroundColor: COLORS.borderStrong,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
  resendButton: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  resendButtonDisabled: {
    color: COLORS.borderStrong,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: COLORS.primarySoft,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.primaryDark,
    fontWeight: '500',
  },
});

export default OTPVerificationScreen;
