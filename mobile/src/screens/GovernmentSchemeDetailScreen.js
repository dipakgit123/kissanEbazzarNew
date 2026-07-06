import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
  Linking,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import AppHeader from '../components/AppHeader';
import CowLoader from '../components/CowLoader';
import { governmentSchemeService } from '../services/api';
import { COLORS } from '../utils/constants';

const getLocalizedValue = (scheme, field, language) => {
  const translations = scheme?.translations || {};
  return translations[language]?.[field] || translations.en?.[field] || scheme?.[field] || '';
};

const getLocalizedArray = (scheme, field, language) => {
  const translations = scheme?.translations || {};
  const languageValue = translations[language]?.[field];
  const fallbackValue = translations.en?.[field];
  const value = Array.isArray(languageValue)
    ? languageValue
    : Array.isArray(fallbackValue)
      ? fallbackValue
      : scheme?.[field];

  return Array.isArray(value) ? value : [];
};

const getCategoryIcon = (category) => {
  switch (category) {
    case 'loan':
      return 'cash-outline';
    case 'subsidy':
      return 'gift-outline';
    case 'insurance':
      return 'shield-checkmark-outline';
    case 'training':
      return 'school-outline';
    case 'health':
      return 'medical-outline';
    default:
      return 'leaf-outline';
  }
};

const GovernmentSchemeDetailScreen = ({ navigation, route }) => {
  const { slug } = route.params || {};
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || 'en';
  const [scheme, setScheme] = useState(null);
  const [relatedSchemes, setRelatedSchemes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchScheme = useCallback(async () => {
    if (!slug) {
      setLoading(false);
      return;
    }

    try {
      const response = await governmentSchemeService.getBySlug(slug, true);
      setScheme(response?.data || null);
      setRelatedSchemes(response?.relatedSchemes || []);
    } catch (error) {
      console.error('Error loading scheme detail:', error);
      setScheme(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchScheme();
  }, [fetchScheme]);

  const localized = useMemo(() => {
    if (!scheme) return null;

    return {
      title: getLocalizedValue(scheme, 'title', language),
      shortDescription: getLocalizedValue(scheme, 'short_description', language),
      description: getLocalizedValue(scheme, 'description', language),
      benefits: getLocalizedArray(scheme, 'benefits', language),
      eligibility: getLocalizedArray(scheme, 'eligibility', language),
      requiredDocuments: getLocalizedArray(scheme, 'required_documents', language),
      applicationSteps: getLocalizedArray(scheme, 'application_steps', language),
    };
  }, [language, scheme]);

  const handleShare = async () => {
    if (!scheme || !localized) return;

    try {
      await Share.share({
        title: localized.title,
        message: `${localized.title}\n${localized.shortDescription || ''}\n${scheme.official_url || ''}`.trim(),
      });
    } catch (error) {
      console.error('Error sharing scheme:', error);
    }
  };

  const openOfficialLink = async () => {
    if (!scheme?.official_url) return;

    try {
      const canOpen = await Linking.canOpenURL(scheme.official_url);
      if (canOpen) {
        await Linking.openURL(scheme.official_url);
      }
    } catch (error) {
      console.error('Error opening official scheme link:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <AppHeader safeArea={false} navigation={navigation} title={t('governmentSchemes.title')} />
        <View style={styles.centerState}>
          <CowLoader message={t('governmentSchemes.loadingDetails')} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!scheme || !localized) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <AppHeader safeArea={false} navigation={navigation} title={t('governmentSchemes.title')} />
        <View style={styles.centerState}>
          <Ionicons name="document-text-outline" size={58} color={COLORS.borderStrong} />
          <Text style={styles.emptyTitle}>{t('governmentSchemes.notFound')}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Text style={styles.retryButtonText}>{t('governmentSchemes.backToSchemes')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <AppHeader
        safeArea={false}
        navigation={navigation}
        title={t('governmentSchemes.title')}
        variant="primary"
        rightActions={[
          {
            icon: 'share-social-outline',
            onPress: handleShare,
            accessibilityLabel: t('common.share'),
          },
        ]}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <LinearGradient colors={['#87510A', '#B66F0D', '#D58A20']} style={styles.hero}>
          <View style={styles.badgeRow}>
            <View style={styles.heroIcon}>
              <Ionicons name={getCategoryIcon(scheme.category)} size={26} color="#B66F0D" />
            </View>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>
                {t(`governmentSchemes.categories.${scheme.category}`, { defaultValue: scheme.category || 'general' })}
              </Text>
            </View>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>
                {t(`governmentSchemes.animalCategories.${scheme.animal_category}`, { defaultValue: scheme.animal_category || 'both' })}
              </Text>
            </View>
          </View>

          <Text style={styles.departmentText}>{scheme.department || t('governmentSchemes.detailTitle')}</Text>
          <Text style={styles.heroTitle}>{localized.title}</Text>
          {localized.shortDescription ? (
            <Text style={styles.heroSubtitle}>{localized.shortDescription}</Text>
          ) : null}

          {scheme.image_url ? (
            <Image source={{ uri: scheme.image_url }} style={styles.heroImage} resizeMode="cover" />
          ) : null}
        </LinearGradient>

        <View style={styles.statsRow}>
          <StatCard label={t('governmentSchemes.amount')} value={scheme.amount_label || '-'} />
          <StatCard label={t('governmentSchemes.interest')} value={scheme.interest_rate || '-'} />
          <StatCard
            label={t('governmentSchemes.status')}
            value={t(`governmentSchemes.statuses.${scheme.status}`, { defaultValue: scheme.status || '-' })}
          />
        </View>

        <View style={styles.applyCard}>
          <Text style={styles.applyTitle}>{t('governmentSchemes.applyForScheme')}</Text>
          <InfoRow label={t('governmentSchemes.deadline')} value={scheme.deadline || t('governmentSchemes.openDeadline')} />
          <InfoRow label={t('governmentSchemes.state')} value={scheme.state || t('governmentSchemes.allIndia')} />
          <InfoRow label={t('governmentSchemes.views')} value={String(scheme.views || 0)} />

          {scheme.official_url ? (
            <TouchableOpacity style={styles.primaryApplyButton} onPress={openOfficialLink} activeOpacity={0.9}>
              <Ionicons name="open-outline" size={18} color={COLORS.surface} />
              <Text style={styles.primaryApplyText}>{t('governmentSchemes.openOfficialWebsite')}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.disabledApplyButton}>
              <Text style={styles.disabledApplyText}>{t('governmentSchemes.noOfficialLink')}</Text>
            </View>
          )}

          {scheme.contact_info ? (
            <Text style={styles.contactInfo}>{scheme.contact_info}</Text>
          ) : null}
        </View>

        {localized.description ? (
          <Section title={t('governmentSchemes.schemeDetails')} icon="information-circle-outline">
            <Text style={styles.paragraph}>{localized.description}</Text>
          </Section>
        ) : null}

        <Section title={t('governmentSchemes.benefits')} icon="gift-outline">
          <CheckList items={localized.benefits} emptyText={t('governmentSchemes.noBenefits')} />
        </Section>

        <Section title={t('governmentSchemes.eligibility')} icon="person-add-outline">
          <CheckList items={localized.eligibility} emptyText={t('governmentSchemes.noEligibility')} />
        </Section>

        <Section title={t('governmentSchemes.requiredDocuments')} icon="document-text-outline">
          <TagList items={localized.requiredDocuments} emptyText={t('governmentSchemes.noDocuments')} />
        </Section>

        <Section title={t('governmentSchemes.howToApply')} icon="list-outline">
          {localized.applicationSteps.length > 0 ? (
            <View style={styles.stepsList}>
              {localized.applicationSteps.map((step, index) => (
                <View key={`${step}-${index}`} style={styles.stepRow}>
                  <View style={styles.stepIndex}>
                    <Text style={styles.stepIndexText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>{t('governmentSchemes.noSteps')}</Text>
          )}
        </Section>

        {relatedSchemes.length > 0 ? (
          <Section title={t('governmentSchemes.relatedSchemes')} icon="albums-outline">
            <View style={styles.relatedList}>
              {relatedSchemes.map((related) => (
                <TouchableOpacity
                  key={related.id}
                  style={styles.relatedCard}
                  onPress={() => navigation.replace('GovernmentSchemeDetail', { slug: related.slug })}
                  activeOpacity={0.85}
                >
                  <View style={styles.relatedIcon}>
                    <Ionicons name={getCategoryIcon(related.category)} size={18} color={COLORS.primaryDark} />
                  </View>
                  <View style={styles.relatedText}>
                    <Text style={styles.relatedTitle} numberOfLines={2}>
                      {getLocalizedValue(related, 'title', language)}
                    </Text>
                    <Text style={styles.relatedMeta} numberOfLines={1}>
                      {related.amount_label || t(`governmentSchemes.categories.${related.category}`, { defaultValue: related.category || '' })}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </Section>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const Section = ({ title, icon, children }) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <Ionicons name={icon} size={18} color={COLORS.primaryDark} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

const StatCard = ({ label, value }) => (
  <View style={styles.statCard}>
    <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
    <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
  </View>
);

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue} numberOfLines={2}>{value}</Text>
  </View>
);

const CheckList = ({ items, emptyText }) => {
  if (!items.length) {
    return <Text style={styles.emptyText}>{emptyText}</Text>;
  }

  return (
    <View style={styles.checkList}>
      {items.map((item, index) => (
        <View key={`${item}-${index}`} style={styles.checkRow}>
          <View style={styles.checkIcon}>
            <Ionicons name="checkmark" size={14} color={COLORS.primaryDark} />
          </View>
          <Text style={styles.checkText}>{item}</Text>
        </View>
      ))}
    </View>
  );
};

const TagList = ({ items, emptyText }) => {
  if (!items.length) {
    return <Text style={styles.emptyText}>{emptyText}</Text>;
  }

  return (
    <View style={styles.tagList}>
      {items.map((item, index) => (
        <View key={`${item}-${index}`} style={styles.documentTag}>
          <Ionicons name="document-outline" size={14} color={COLORS.primaryDark} />
          <Text style={styles.documentText}>{item}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: 120,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  hero: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 24,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  heroBadge: {
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  heroBadgeText: {
    color: COLORS.surface,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  departmentText: {
    marginTop: 18,
    color: '#FFE9C0',
    fontSize: 12,
    fontWeight: '900',
  },
  heroTitle: {
    marginTop: 6,
    color: COLORS.surface,
    fontSize: 27,
    lineHeight: 33,
    fontWeight: '900',
  },
  heroSubtitle: {
    marginTop: 10,
    color: '#FFF2D9',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },
  heroImage: {
    marginTop: 18,
    width: '100%',
    height: 190,
    borderRadius: 24,
    borderWidth: 5,
    borderColor: 'rgba(255,255,255,0.94)',
  },
  statsRow: {
    marginHorizontal: 16,
    marginTop: -18,
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  statValue: {
    color: COLORS.primaryDark,
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  statLabel: {
    marginTop: 4,
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  applyCard: {
    marginHorizontal: 16,
    marginTop: 18,
    borderRadius: 24,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  applyTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  infoValue: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'right',
  },
  primaryApplyButton: {
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#C5770F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryApplyText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '900',
  },
  disabledApplyButton: {
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
  },
  disabledApplyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '800',
  },
  contactInfo: {
    marginTop: 12,
    borderRadius: 16,
    padding: 12,
    backgroundColor: COLORS.primarySoft,
    color: COLORS.primaryDeep,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  sectionCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 24,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 13,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    flex: 1,
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '900',
  },
  paragraph: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600',
  },
  checkList: {
    gap: 10,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkText: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600',
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  documentTag: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  documentText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '800',
  },
  stepsList: {
    gap: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepIndex: {
    width: 32,
    height: 32,
    borderRadius: 14,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndexText: {
    color: COLORS.primaryDark,
    fontSize: 13,
    fontWeight: '900',
  },
  stepText: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    paddingTop: 4,
  },
  relatedList: {
    gap: 10,
  },
  relatedCard: {
    borderRadius: 18,
    padding: 12,
    backgroundColor: COLORS.surfaceAlt,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  relatedIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  relatedText: {
    flex: 1,
    minWidth: 0,
  },
  relatedTitle: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
  },
  relatedMeta: {
    marginTop: 3,
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  emptyTitle: {
    marginTop: 12,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  retryButton: {
    marginTop: 16,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  retryButtonText: {
    color: COLORS.surface,
    fontSize: 13,
    fontWeight: '900',
  },
});

export default GovernmentSchemeDetailScreen;
