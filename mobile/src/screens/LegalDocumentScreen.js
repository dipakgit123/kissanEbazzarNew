import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../utils/constants';
import AppHeader from '../components/AppHeader';

const LegalDocumentScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const isPrivacy = route?.params?.type === 'privacy';

  const title = t(isPrivacy ? 'legal.privacyTitle' : 'legal.termsTitle');
  const intro = t(isPrivacy ? 'legal.privacyIntro' : 'legal.termsIntro');
  const iconName = isPrivacy ? 'shield-checkmark-outline' : 'document-text-outline';

  const sections = isPrivacy
    ? [
        {
          key: 'privacy-1',
          title: t('legal.privacyCollectedTitle'),
          body: t('legal.privacyCollectedBody'),
        },
        {
          key: 'privacy-2',
          title: t('legal.privacyUseTitle'),
          body: t('legal.privacyUseBody'),
        },
        {
          key: 'privacy-3',
          title: t('legal.privacySharingTitle'),
          body: t('legal.privacySharingBody'),
        },
        {
          key: 'privacy-4',
          title: t('legal.privacySecurityTitle'),
          body: t('legal.privacySecurityBody'),
        },
        {
          key: 'privacy-5',
          title: t('legal.privacyChoicesTitle'),
          body: t('legal.privacyChoicesBody'),
        },
      ]
    : [
        {
          key: 'terms-1',
          title: t('legal.termsUseTitle'),
          body: t('legal.termsUseBody'),
        },
        {
          key: 'terms-2',
          title: t('legal.termsListingsTitle'),
          body: t('legal.termsListingsBody'),
        },
        {
          key: 'terms-3',
          title: t('legal.termsVetTitle'),
          body: t('legal.termsVetBody'),
        },
        {
          key: 'terms-4',
          title: t('legal.termsSafetyTitle'),
          body: t('legal.termsSafetyBody'),
        },
        {
          key: 'terms-5',
          title: t('legal.termsChangesTitle'),
          body: t('legal.termsChangesBody'),
        },
      ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <AppHeader
          safeArea={false}
          navigation={navigation}
          title={title}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Ionicons name={iconName} size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.screenTitle}>{title}</Text>
            <Text style={styles.updatedText}>
              {t('legal.lastUpdated')}: {t('legal.updatedDate')}
            </Text>
            <Text style={styles.introText}>{intro}</Text>
          </View>

          {sections.map((section, index) => (
            <View key={section.key} style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>{index + 1}</Text>
                </View>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
              <Text style={styles.sectionBody}>{section.body}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceAlt,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 32,
    gap: 14,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primarySoft,
    marginBottom: 14,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
  },
  updatedText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primaryDark,
    marginBottom: 12,
  },
  introText: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.textMuted,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    marginRight: 10,
  },
  sectionBadgeText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.textMuted,
  },
});

export default LegalDocumentScreen;
