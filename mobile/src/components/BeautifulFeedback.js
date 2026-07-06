import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';

const FeedbackContext = createContext(null);

const getVariantMeta = (variant) => {
  switch (variant) {
    case 'success':
      return {
        icon: 'checkmark-circle',
        color: COLORS.success,
        softColor: COLORS.successSoft,
        accent: COLORS.primary,
      };
    case 'error':
      return {
        icon: 'alert-circle',
        color: COLORS.error,
        softColor: COLORS.errorSoft,
        accent: COLORS.error,
      };
    case 'warning':
      return {
        icon: 'warning',
        color: COLORS.warning,
        softColor: COLORS.warningSoft,
        accent: COLORS.warning,
      };
    default:
      return {
        icon: 'information-circle',
        color: COLORS.info,
        softColor: COLORS.infoSoft,
        accent: COLORS.primary,
      };
  }
};

const inferAlertVariant = (title, message, buttons = []) => {
  const content = `${title || ''} ${message || ''}`.toLowerCase();

  if (buttons.some((button) => button?.style === 'destructive')) {
    return 'warning';
  }
  if (/error|failed|network|invalid|denied|required|permission|wrong|delete|remove/.test(content)) {
    return 'error';
  }
  if (/success|sent|saved|updated|created|copied|added|removed|otp/.test(content)) {
    return 'success';
  }
  if (/logout|cancel|confirm|warning|limit/.test(content)) {
    return 'warning';
  }

  return 'info';
};

const normalizeButtons = (buttons) => {
  if (!Array.isArray(buttons) || buttons.length === 0) {
    return [{ text: 'OK', style: 'default' }];
  }

  return buttons
    .filter(Boolean)
    .map((button) => ({
      text: button.text || 'OK',
      style: button.style || 'default',
      onPress: button.onPress,
    }));
};

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within BeautifulFeedbackProvider');
  }
  return context;
};

export const BeautifulFeedbackProvider = ({ children }) => {
  const [alertState, setAlertState] = useState(null);
  const alertStateRef = useRef(alertState);

  useEffect(() => {
    alertStateRef.current = alertState;
  }, [alertState]);

  const showAlert = useCallback((title, message, buttons, options = {}) => {
    const normalizedButtons = normalizeButtons(buttons);
    Keyboard.dismiss();
    setAlertState({
      title: title ? String(title) : '',
      message: message ? String(message) : '',
      buttons: normalizedButtons,
      options: options || {},
      variant: inferAlertVariant(title, message, normalizedButtons),
    });
  }, []);

  useEffect(() => {
    if (!globalThis.__ANIMAL_E_BAZAR_ORIGINAL_ALERT__) {
      globalThis.__ANIMAL_E_BAZAR_ORIGINAL_ALERT__ = Alert.alert;
    }

    Alert.alert = showAlert;

    return () => {
      if (Alert.alert === showAlert && globalThis.__ANIMAL_E_BAZAR_ORIGINAL_ALERT__) {
        Alert.alert = globalThis.__ANIMAL_E_BAZAR_ORIGINAL_ALERT__;
      }
    };
  }, [showAlert]);

  const dismissAlert = useCallback((button) => {
    const currentAlert = alertStateRef.current;
    setAlertState(null);

    setTimeout(() => {
      if (button?.onPress) {
        button.onPress();
      } else if (!button && currentAlert?.options?.onDismiss) {
        currentAlert.options.onDismiss();
      }
    }, 160);
  }, []);

  const contextValue = useMemo(() => ({ showAlert }), [showAlert]);
  const meta = getVariantMeta(alertState?.variant);
  const canDismiss = alertState?.options?.cancelable !== false;
  const stackedButtons = (alertState?.buttons?.length || 0) > 2;

  return (
    <FeedbackContext.Provider value={contextValue}>
      {children}

      <Modal
        visible={Boolean(alertState)}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          if (canDismiss) dismissAlert();
        }}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => {
            if (canDismiss) dismissAlert();
          }}
        >
          <Pressable style={styles.alertCard}>
            <View style={styles.alertTopBar} />
            <View style={[styles.alertIconWrap, { backgroundColor: meta.softColor }]}>
              <Ionicons name={meta.icon} size={34} color={meta.color} />
            </View>

            <Text style={styles.alertTitle}>{alertState?.title}</Text>
            {alertState?.message ? (
              <Text style={styles.alertMessage}>{alertState.message}</Text>
            ) : null}

            <View style={[styles.alertButtonRow, stackedButtons && styles.alertButtonStack]}>
              {alertState?.buttons?.map((button, index) => {
                const isCancel = button.style === 'cancel';
                const isDestructive = button.style === 'destructive';
                const isPrimary =
                  !isCancel &&
                  (!stackedButtons || index === alertState.buttons.length - 1 || alertState.buttons.length === 1);

                return (
                  <TouchableOpacity
                    key={`${button.text}-${index}`}
                    style={[
                      styles.alertButton,
                      stackedButtons && styles.alertButtonFull,
                      isPrimary && styles.alertButtonPrimary,
                      isDestructive && styles.alertButtonDestructive,
                      isCancel && styles.alertButtonCancel,
                    ]}
                    onPress={() => dismissAlert(button)}
                    activeOpacity={0.86}
                  >
                    <Text
                      style={[
                        styles.alertButtonText,
                        isPrimary && styles.alertButtonPrimaryText,
                        isDestructive && styles.alertButtonPrimaryText,
                        isCancel && styles.alertButtonCancelText,
                      ]}
                    >
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </FeedbackContext.Provider>
  );
};

const ToastCard = ({ type, text1, text2 }) => {
  const variant = type === 'error' ? 'error' : type === 'success' ? 'success' : 'info';
  const meta = getVariantMeta(variant);

  return (
    <View style={styles.toastCard}>
      <View style={[styles.toastIconWrap, { backgroundColor: meta.softColor }]}>
        <Ionicons name={meta.icon} size={22} color={meta.color} />
      </View>
      <View style={styles.toastTextWrap}>
        <Text style={styles.toastTitle} numberOfLines={1}>
          {text1}
        </Text>
        {text2 ? (
          <Text style={styles.toastMessage} numberOfLines={2}>
            {text2}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

export const beautifulToastConfig = {
  success: (props) => <ToastCard type="success" {...props} />,
  error: (props) => <ToastCard type="error" {...props} />,
  info: (props) => <ToastCard type="info" {...props} />,
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8, 18, 15, 0.58)',
  },
  alertCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 30,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 20,
    overflow: 'hidden',
  },
  alertTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: COLORS.primary,
  },
  alertIconWrap: {
    width: 66,
    height: 66,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 18,
  },
  alertTitle: {
    color: COLORS.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
    textAlign: 'center',
  },
  alertMessage: {
    marginTop: 10,
    color: COLORS.textMuted,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '600',
    textAlign: 'center',
  },
  alertButtonRow: {
    marginTop: 22,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  alertButtonStack: {
    flexDirection: 'column',
  },
  alertButton: {
    minHeight: 48,
    minWidth: 104,
    borderRadius: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  alertButtonFull: {
    width: '100%',
  },
  alertButtonPrimary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  alertButtonDestructive: {
    backgroundColor: COLORS.error,
    borderColor: COLORS.error,
  },
  alertButtonCancel: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  alertButtonText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '900',
  },
  alertButtonPrimaryText: {
    color: COLORS.surface,
  },
  alertButtonCancelText: {
    color: COLORS.textMuted,
  },
  toastCard: {
    width: '92%',
    minHeight: 68,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.13,
    shadowRadius: 18,
    elevation: 10,
  },
  toastIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  toastTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  toastTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '900',
  },
  toastMessage: {
    marginTop: 3,
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
});
