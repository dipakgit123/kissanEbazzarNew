import { useExperienceText } from '../context/AnimalExperienceContext';
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
import { notificationText } from '../utils/notificationUi';
import { useNotifications } from '../context/NotificationContext';
import { COLORS } from '../utils/constants';

const NotificationSettingsScreen = ({ navigation }) => {
  const { i18n } = useTranslation();
  const experienceText = useExperienceText();
  const c = notificationText(i18n.language);
  const {
    error, loadPreferences, preferenceSaving, isVeterinarian,
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
      title: c('push'),
      subtitle: c('pushDesc'),
    },
    {
      key: 'marketplace_enabled',
      icon: 'pricetag-outline',
      title: c('market'),
      subtitle: c('marketDesc'),
    },
    {
      key: 'reminders_enabled',
      icon: 'alarm-outline',
      title: c('reminderTitle'),
      subtitle: c('reminders'),
    },
    {
      key: 'communication_enabled',
      icon: 'chatbubble-ellipses-outline',
      title: c('communication'),
      subtitle: c('communicationDesc'),
    },
    {
      key: 'system_enabled',
      icon: 'shield-checkmark-outline',
      title: c('system'),
      subtitle: c('systemDesc'),
    },
  ];

  for (const [key, title, desc] of [['health_enabled', 'health', 'healthDesc'], ['pet_mating_enabled', 'pet', 'petDesc'], ['content_enabled', 'content', 'contentDesc'], ['milk_reminders_enabled', 'milk', 'milkDesc']]) rows.push({ key, icon: 'notifications-outline', title: c(title), subtitle: c(desc) });

  if (!isVeterinarian) for (const group of ['farm', 'pet']) rows.push({ key: group + '_enabled', icon: 'paw-outline', title: experienceText[group], subtitle: experienceText[group + 'Species'] });

  const enableDeviceNotifications = async () => {
    if (permissionStatus === 'denied' && supportsSystemNotificationSettings) {
      await Linking.openSettings();
      return;
    }

    const registration = await requestPushPermission();
    if (!registration?.token && registration?.permissionStatus === 'denied') {
      Alert.alert(
        c('disabled'),
        c('permission')
      );
    }
  };

  const permissionEnabled = permissionStatus === 'granted';
  const alertsReady = permissionEnabled
    && Boolean(pushToken)
    && pushRegistrationStatus === 'registered';
  const connectionTitle = alertsReady
    ? c('connected')
    : pushRegistrationStatus === 'registering'
      ? c('connecting')
      : permissionEnabled
        ? c('registration')
        : c('disabled');
  const connectionStatus = alertsReady
    ? c('ready')
    : pushRegistrationError ? c('registration') : c('permission');

  return (
    <View style={styles.container}>
      <AppHeader
        navigation={navigation}
        title={c('settingsTitle')}
      />

      {preferencesLoading ? (
        <View style={styles.loader}>
          <SkeletonLoader variant="list" count={5} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {error === 'settings' && <View accessibilityRole="alert"><Text>{c('settings')}</Text><TouchableOpacity onPress={loadPreferences} style={{ padding: 12 }}><Text>{c('retry')}</Text></TouchableOpacity></View>}
          <View style={styles.permissionBand}>
            <View style={styles.permissionIcon}>
              <Ionicons
                name={alertsReady ? 'notifications' : 'notifications-off-outline'}
                size={24}
                color={alertsReady ? COLORS.primary : COLORS.warning}
              />
            </View>
            <View style={styles.permissionCopy}>
              <Text style={styles.permissionTitle}>
                {connectionTitle}
              </Text>
              <Text style={styles.permissionStatus}>{connectionStatus}</Text>
            </View>
            {!alertsReady && pushRegistrationStatus !== 'registering' && (
              <TouchableOpacity style={styles.enableButton} onPress={enableDeviceNotifications}>
                <Text style={styles.enableButtonText}>
                  {permissionEnabled
                    ? c('retry')
                    : c('enable')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.settingsGroup}>
            {rows.filter(row => !isVeterinarian || ['push_enabled', 'communication_enabled', 'system_enabled'].includes(row.key)).map((row, index) => (
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
                  disabled={preferenceSaving}
                  value={preferences[row.key] === true}
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
