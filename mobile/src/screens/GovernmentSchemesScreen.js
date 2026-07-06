import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import AppHeader from '../components/AppHeader';
import CowLoader from '../components/CowLoader';
import { governmentSchemeService } from '../services/api';
import { COLORS } from '../utils/constants';

const CATEGORY_OPTIONS = ['all', 'loan', 'subsidy', 'insurance', 'training', 'health', 'general'];
const ANIMAL_CATEGORY_OPTIONS = ['all', 'farm', 'pet', 'both'];

const getLocalizedValue = (scheme, field, language) => {
  const translations = scheme?.translations || {};
  return translations[language]?.[field] || translations.en?.[field] || scheme?.[field] || '';
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

const GovernmentSchemesScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || 'en';
  const [schemes, setSchemes] = useState([]);
  const [featuredSchemes, setFeaturedSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [animalCategory, setAnimalCategory] = useState('all');

  const fetchSchemes = useCallback(async () => {
    try {
      const params = {
        limit: 30,
        sortBy: 'is_featured',
        order: 'DESC',
      };

      if (category !== 'all') params.category = category;
      if (animalCategory !== 'all') params.animalCategory = animalCategory;
      if (submittedSearch.trim()) params.search = submittedSearch.trim();

      const [schemesResponse, featuredResponse] = await Promise.all([
        governmentSchemeService.getSchemes(params),
        governmentSchemeService.getFeatured(4),
      ]);

      setSchemes(schemesResponse?.data?.schemes || []);
      setFeaturedSchemes(featuredResponse?.data?.schemes || []);
    } catch (error) {
      console.error('Error loading government schemes:', error);
      setSchemes([]);
      setFeaturedSchemes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [animalCategory, category, submittedSearch]);

  useEffect(() => {
    setLoading(true);
    fetchSchemes();
  }, [fetchSchemes]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSchemes();
  };

  const heroScheme = featuredSchemes[0] || schemes[0];

  const visibleFeaturedSchemes = useMemo(() => (
    featuredSchemes.length > 0 ? featuredSchemes : schemes.slice(0, 4)
  ), [featuredSchemes, schemes]);

  const handleSearch = () => {
    setSubmittedSearch(searchText.trim());
  };

  const renderSchemeCard = (scheme, compact = false) => {
    const title = getLocalizedValue(scheme, 'title', language);
    const description = getLocalizedValue(scheme, 'short_description', language);

    return (
      <TouchableOpacity
        key={scheme.id}
        style={[styles.schemeCard, compact && styles.schemeCardCompact]}
        onPress={() => navigation.navigate('GovernmentSchemeDetail', { slug: scheme.slug })}
        activeOpacity={0.9}
      >
        <View style={styles.schemeImageWrap}>
          {scheme.image_url ? (
            <Image source={{ uri: scheme.image_url }} style={styles.schemeImage} resizeMode="cover" />
          ) : (
            <LinearGradient colors={['#FFF2D6', '#DDF5EA']} style={styles.schemeImageFallback}>
              <Ionicons name={getCategoryIcon(scheme.category)} size={34} color="#B66F0D" />
            </LinearGradient>
          )}
          <View style={styles.schemeBadge}>
            <Text style={styles.schemeBadgeText}>
              {t(`governmentSchemes.categories.${scheme.category}`, { defaultValue: scheme.category || 'general' })}
            </Text>
          </View>
        </View>

        <View style={styles.schemeCardBody}>
          <Text style={styles.schemeDepartment} numberOfLines={1}>
            {scheme.department || t(`governmentSchemes.levels.${scheme.government_level}`, { defaultValue: scheme.government_level || '' })}
          </Text>
          <Text style={styles.schemeTitle} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.schemeDescription} numberOfLines={compact ? 2 : 3}>
            {description}
          </Text>

          <View style={styles.schemeMetaRow}>
            <View style={styles.schemeMetaPill}>
              <Text style={styles.schemeMetaValue} numberOfLines={1}>{scheme.amount_label || '-'}</Text>
              <Text style={styles.schemeMetaLabel}>{t('governmentSchemes.amount')}</Text>
            </View>
            <View style={styles.schemeMetaPill}>
              <Text style={styles.schemeMetaValue} numberOfLines={1}>{scheme.interest_rate || '-'}</Text>
              <Text style={styles.schemeMetaLabel}>{t('governmentSchemes.interest')}</Text>
            </View>
          </View>

          <View style={styles.applyRow}>
            <Text style={styles.applyText}>{t('governmentSchemes.viewDetails')}</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.surface} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <AppHeader
        safeArea={false}
        navigation={navigation}
        title={t('governmentSchemes.title')}
        subtitle={t('governmentSchemes.subtitle')}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        <LinearGradient colors={['#955B0A', '#C77A10', '#DD922D']} style={styles.hero}>
          <View style={styles.heroPattern} />
          <View style={styles.heroTopRow}>
            <View style={styles.heroIcon}>
              <Ionicons name="business-outline" size={24} color="#B66F0D" />
            </View>
            <Text style={styles.heroKicker}>{t('governmentSchemes.kicker')}</Text>
          </View>
          <Text style={styles.heroTitle}>{t('governmentSchemes.heroTitle')}</Text>
          <Text style={styles.heroSubtitle}>{t('governmentSchemes.heroSubtitle')}</Text>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color={COLORS.textMuted} />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
              placeholder={t('governmentSchemes.searchPlaceholder')}
              placeholderTextColor={COLORS.borderStrong}
              style={styles.searchInput}
              returnKeyType="search"
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch} activeOpacity={0.85}>
              <Text style={styles.searchButtonText}>{t('common.search')}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {heroScheme ? (
          <TouchableOpacity
            style={styles.featuredHeroCard}
            onPress={() => navigation.navigate('GovernmentSchemeDetail', { slug: heroScheme.slug })}
            activeOpacity={0.9}
          >
            <View style={styles.featuredIconCircle}>
              <Ionicons name={getCategoryIcon(heroScheme.category)} size={24} color="#B66F0D" />
            </View>
            <View style={styles.featuredText}>
              <Text style={styles.featuredLabel}>{t('governmentSchemes.featuredScheme')}</Text>
              <Text style={styles.featuredTitle} numberOfLines={2}>
                {getLocalizedValue(heroScheme, 'title', language)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        ) : null}

        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {CATEGORY_OPTIONS.map((option) => {
              const active = category === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setCategory(option)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {option === 'all'
                      ? t('governmentSchemes.all')
                      : t(`governmentSchemes.categories.${option}`, { defaultValue: option })}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRowSmall}>
            {ANIMAL_CATEGORY_OPTIONS.map((option) => {
              const active = animalCategory === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.animalChip, active && styles.animalChipActive]}
                  onPress={() => setAnimalCategory(option)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.animalChipText, active && styles.animalChipTextActive]}>
                    {option === 'all'
                      ? t('governmentSchemes.allAnimals')
                      : t(`governmentSchemes.animalCategories.${option}`, { defaultValue: option })}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {visibleFeaturedSchemes.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionEyebrow}>{t('governmentSchemes.browseKicker')}</Text>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('governmentSchemes.popularTitle')}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {visibleFeaturedSchemes.map((scheme) => renderSchemeCard(scheme, true))}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('governmentSchemes.allSchemes')}</Text>
            <Text style={styles.countText}>{t('governmentSchemes.schemeCount', { count: schemes.length })}</Text>
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <CowLoader message={t('governmentSchemes.loading')} size="medium" />
            </View>
          ) : schemes.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color={COLORS.borderStrong} />
              <Text style={styles.emptyTitle}>{t('governmentSchemes.empty')}</Text>
            </View>
          ) : (
            <View style={styles.schemeGrid}>
              {schemes.map((scheme) => renderSchemeCard(scheme))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
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
  hero: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 28,
    padding: 20,
    overflow: 'hidden',
  },
  heroPattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.16,
    backgroundColor: 'transparent',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroKicker: {
    color: '#FFF1D7',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  heroTitle: {
    marginTop: 18,
    color: COLORS.surface,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
  },
  heroSubtitle: {
    marginTop: 10,
    color: '#FFF4DD',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
  },
  searchBox: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 6,
  },
  searchButton: {
    borderRadius: 14,
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  searchButtonText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '900',
  },
  featuredHeroCard: {
    marginHorizontal: 16,
    marginTop: -18,
    borderRadius: 22,
    padding: 14,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#F1DFBF',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  featuredIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF2D6',
  },
  featuredText: {
    flex: 1,
    minWidth: 0,
  },
  featuredLabel: {
    color: '#B66F0D',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  featuredTitle: {
    marginTop: 3,
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
  },
  filterSection: {
    marginTop: 18,
  },
  chipRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chipRowSmall: {
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primaryDark,
  },
  filterChipText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  filterChipTextActive: {
    color: COLORS.surface,
  },
  animalChip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFF8EA',
    borderWidth: 1,
    borderColor: '#F0DDB7',
  },
  animalChipActive: {
    backgroundColor: '#B66F0D',
    borderColor: '#B66F0D',
  },
  animalChipText: {
    color: '#8A550A',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  animalChipTextActive: {
    color: COLORS.surface,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionEyebrow: {
    color: '#B66F0D',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  sectionTitle: {
    flex: 1,
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '900',
  },
  countText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  horizontalList: {
    gap: 12,
    paddingRight: 16,
  },
  schemeGrid: {
    gap: 14,
  },
  schemeCard: {
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  schemeCardCompact: {
    width: 220,
  },
  schemeImageWrap: {
    height: 118,
    backgroundColor: '#FFF2D6',
    position: 'relative',
  },
  schemeImage: {
    width: '100%',
    height: '100%',
  },
  schemeImageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  schemeBadge: {
    position: 'absolute',
    left: 12,
    top: 12,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  schemeBadgeText: {
    color: COLORS.primaryDark,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  schemeCardBody: {
    padding: 14,
  },
  schemeDepartment: {
    color: '#B66F0D',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  schemeTitle: {
    marginTop: 6,
    color: COLORS.text,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
  },
  schemeDescription: {
    marginTop: 7,
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  schemeMetaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  schemeMetaPill: {
    flex: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: COLORS.surfaceAlt,
  },
  schemeMetaValue: {
    color: COLORS.primaryDark,
    fontSize: 13,
    fontWeight: '900',
  },
  schemeMetaLabel: {
    marginTop: 2,
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  applyRow: {
    marginTop: 13,
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 12,
    backgroundColor: '#C5770F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  applyText: {
    color: COLORS.surface,
    fontSize: 13,
    fontWeight: '900',
  },
  loadingWrap: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: 42,
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    marginTop: 12,
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '800',
  },
});

export default GovernmentSchemesScreen;
