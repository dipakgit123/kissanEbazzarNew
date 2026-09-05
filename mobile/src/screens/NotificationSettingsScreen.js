import React from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AppHeader from '../components/AppHeader';
import SkeletonLoader from '../components/SkeletonLoader';
import { useNotifications } from '../context/NotificationContext';
import { COLORS } from '../utils/constants';

const NotificationSettingsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const {
    permissionStatus,
    pushToken,
    pushRegistrationStatus,
    pushRegistrationError,
    preferences,
    preferencesLoading,
    updatePreference,
    requestPushPermission,
    supportsSystemNotificationSettings,
  } = useNotifications();

  const rows = [
    {
      key: 'push_enabled',
      icon: 'phone-portrait-outline',
      title: t('notifications.pushNotifications', { defaultValue: 'Push notifications' }),
      subtitle: t('notifications.pushNotificationsDesc', { defaultValue: 'Show alerts when the app is closed' }),
    },
    {
      key: 'appointments_enabled',
      icon: 'medkit-outline',
      title: t('notifications.appointments', { defaultValue: 'Appointments' }),
      subtitle: t('notifications.appointmentsDesc', { defaultValue: 'Bookings, confirmations, and changes' }),
    },
    {
      key: 'marketplace_enabled',
      icon: 'pricetag-outline',
      title: t('notifications.marketplace', { defaultValue: 'Marketplace' }),
      subtitle: t('notifications.marketplaceDesc', { defaultValue: 'Nearby listings and price updates' }),
    },
    {
      key: 'reminders_enabled',
      icon: 'alarm-outline',
      title: t('notifications.reminders', { defaultValue: 'Reminders' }),
      subtitle: t('notifications.remindersDesc', { defaultValue: 'Appointment and pregnancy reminders' }),
    },
    {
      key: 'communication_enabled',
      icon: 'chatbubble-ellipses-outline',
      title: t('notifications.communication', { defaultValue: 'Calls and messages' }),
      subtitle: t('notifications.communicationDesc', { defaultValue: 'Incoming calls and direct inquiries' }),
    },
    {
      key: 'system_enabled',
      icon: 'shield-checkmark-outline',
      title: t('notifications.system', { defaultValue: 'Account and system' }),
      subtitle: t('notifications.systemDesc', { defaultValue: 'Important account and service updates' }),
    },
  ];

  const enableDeviceNotifications = async () => {
    if (permissionStatus === 'denied' && supportsSystemNotificationSettings) {
      await Linking.openSettings();
      return;
    }

    const registration = await requestPushPermission();
    if (!registration?.token && registration?.permissionStatus === 'denied') {
      Alert.alert(
        t('notifications.permissionRequired', { defaultValue: 'Permission required' }),
        t('notifications.permissionRequiredDesc', {
          defaultValue: 'Enable notifications in your device settings to receive alerts.',
        })
      );
    }
  };

  const permissionEnabled = permissionStatus === 'granted';
  const firebaseConnected = permissionEnabled
    && Boolean(pushToken)
    && pushRegistrationStatus === 'registered';
  const connectionTitle = firebaseConnected
    ? 'Firebase push connected'
    : pushRegistrationStatus === 'registering'
      ? 'Connecting Firebase push'
      : permissionEnabled
        ? 'Firebase push not connected'
        : 'Device alerts disabled';
  const connectionStatus = firebaseConnected
    ? 'FCM token registered'
    : pushRegistrationError || permissionStatus;

  return (
    <View style={styles.container}>
      <AppHeader
        navigation={navigation}
        title={t('notifications.settings', { defaultValue: 'Notification settings' })}
      />

      {preferencesLoading ? (
        <View style={styles.loader}>
          <SkeletonLoader variant="list" count={5} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.permissionBand}>
            <View style={styles.permissionIcon}>
              <Ionicons
                name={firebaseConnected ? 'notifications' : 'notifications-off-outline'}
                size={24}
                color={firebaseConnected ? COLORS.primary : COLORS.warning}
              />
            </View>
            <View style={styles.permissionCopy}>
              <Text style={styles.permissionTitle}>
                {connectionTitle}
              </Text>
              <Text style={styles.permissionStatus}>{connectionStatus}</Text>
            </View>
            {!firebaseConnected && pushRegistrationStatus !== 'registering' && (
              <TouchableOpacity style={styles.enableButton} onPress={enableDeviceNotifications}>
                <Text style={styles.enableButtonText}>
                  {permissionEnabled
                    ? t('common.retry', { defaultValue: 'Retry' })
                    : t('common.enable', { defaultValue: 'Enable' })}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.settingsGroup}>
            {rows.map((row, index) => (
              <View
                key={row.key}
                style={[styles.settingRow, index < rows.length - 1 && styles.settingDivider]}
              >
                <View style={styles.settingIcon}>
                  <Ionicons name={row.icon} size={21} color={COLORS.primaryDark} />
                </View>
                <View style={styles.settingCopy}>
                  <Text style={styles.settingTitle}>{row.title}</Text>
                  <Text style={styles.settingSubtitle}>{row.subtitle}</Text>
                </View>
                <Switch
                  value={preferences[row.key] !== false}
                  onValueChange={(value) => updatePreference(row.key, value)}
                  trackColor={{ false: COLORS.borderStrong, true: COLORS.primaryLight }}
                  thumbColor={preferences[row.key] !== false ? COLORS.primaryDark : COLORS.surface}
                  accessibilityLabel={row.title}
                />
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loader: { flex: 1, padding: 16 },
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  permissionBand: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 14,
  },
  permissionIcon: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionCopy: { flex: 1, marginHorizontal: 12 },
  permissionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  permissionStatus: { marginTop: 3, fontSize: 12, color: COLORS.textMuted, textTransform: 'capitalize' },
  enableButton: { paddingHorizontal: 12, paddingVertical: 9, backgroundColor: COLORS.primary, borderRadius: 6 },
  enableButtonText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  settingsGroup: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 14,
  },
  settingRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  settingDivider: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  settingIcon: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingCopy: { flex: 1, paddingRight: 10 },
  settingTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  settingSubtitle: { marginTop: 3, fontSize: 12, lineHeight: 17, color: COLORS.textMuted },
});

export default NotificationSettingsScreen;
