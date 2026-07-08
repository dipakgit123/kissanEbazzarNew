import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageBackground,
  Dimensions,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../utils/constants';
import AnimalCard from '../components/AnimalCard';
import SkeletonLoader from '../components/SkeletonLoader';
import { animalListingService, governmentSchemeService, userService } from '../services/api';

const { width } = Dimensions.get('window');
const LANGUAGE_OPTIONS = [
  { code: 'mr', label: 'मराठी' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'en', label: 'English' },
];

const getLocalizedSchemeValue = (scheme, field, language) => {
  const translations = scheme?.translations || {};
  return translations[language]?.[field] || translations.en?.[field] || scheme?.[field] || '';
};

const HomeScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [animals, setAnimals] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const selectedLanguage = i18n.resolvedLanguage || i18n.language || 'en';

  const featureCards = [
    {
      key: 'milkReports',
      title: t('services.milkReports'),
      subtitle: t('homeScreen.trackMilkReports'),
      image: require('../assets/milk_report.jpeg'),
      route: 'MilkReports',
      backgroundColor: COLORS.primaryDark,
      iconColor: COLORS.primarySoft,
    },
    {
      key: 'aiAssistant',
      title: t('services.aiAssistant'),
      subtitle: t('homeScreen.instantAiSupport'),
      image: require('../assets/ai_assistant.png'),
      route: 'AIAssistant',
      backgroundColor: COLORS.primaryDark,
      iconColor: COLORS.primarySoft,
    },
    {
      key: 'veterinarian',
      title: t('services.veterinarian'),
      subtitle: t('homeScreen.expertVetCare'),
      image: require('../assets/veterinarian.png'),
      route: 'Veterinarian',
      backgroundColor: '#2E5CC7',
      iconColor: '#D0EBFF',
    },
    {
      key: 'aiHealthCheck',
      title: t('services.aiHealthCheck'),
      subtitle: t('homeScreen.healthMonitoring'),
      image: require('../assets/ai_health.png'),
      route: 'AIHealthCheck',
      backgroundColor: COLORS.accentDeep,
      iconColor: COLORS.accentSoft,
    },
    {
      key: 'petMating',
      title: t('petMating.title', { defaultValue: 'Pet Mating' }),
      subtitle: t('petMating.homeDesc', { defaultValue: 'Find trusted dog and cat mates' }),
      image: require('../assets/mating_feature.png'),
      route: 'PetMating',
      backgroundColor: COLORS.primaryDeep,
      iconColor: COLORS.primarySoft,
    },
    {
      key: 'pregnancy',
      title: t('services.pregnancy'),
      subtitle: t('homeScreen.trackPregnancy'),
      image: require('../assets/pregnancy_calendar.png'),
      route: 'PregnancyCalendar',
      backgroundColor: '#5B21B6',
      iconColor: '#E9D5FF',
    },
  ];

  useEffect(() => {
    fetchAnimals();
    fetchSchemes();
    fetchMyListings();
  }, []);

  const fetchAnimals = async () => {
    setLoading(true);
    try {
      const response = await animalListingService.getAllListings();
      if (response.success && response.data) {
        setAnimals(response.data.slice(0, 4)); // Show only first 4
      } else {
        setAnimals([]);
      }
    } catch (error) {
      console.error('Error fetching animals:', error);
      setAnimals([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSchemes = async () => {
    try {
      const featuredResponse = await governmentSchemeService.getFeatured(4);
      const featuredSchemes = featuredResponse?.data?.schemes || [];

      if (featuredSchemes.length > 0) {
        setSchemes(featuredSchemes);
        return;
      }

      const response = await governmentSchemeService.getSchemes({
        limit: 4,
        sortBy: 'published_at',
        order: 'DESC',
      });
      setSchemes(response?.data?.schemes || []);
    } catch (error) {
      console.error('Error fetching government schemes:', error);
      setSchemes([]);
    }
  };

  const fetchMyListings = async () => {
    try {
      const response = await userService.getMyListings();
      if (response?.success) {
        setMyListings((response.listings || []).slice(0, 4));
      }
    } catch (error) {
      console.error('Error fetching my listings:', error);
      setMyListings([]);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnimals();
    fetchSchemes();
    fetchMyListings();
  };

  const handleLanguageChange = async (languageCode) => {
    if (selectedLanguage === languageCode) {
      return;
    }

    await i18n.changeLanguage(languageCode);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />

      <View style={styles.headerShell}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logoTile}>
              <Image
                source={require('../assets/animal_logog.jpeg')}
                style={styles.headerLogoImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.brandTextWrap}>
              <Text style={styles.headerLogoText}>{t('common.appName')}</Text>
              <Text style={styles.headerSubtitle}>{t('home.subtitle')}</Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={() => navigation.navigate('Notifications')}
              activeOpacity={0.85}
            >
              <Ionicons name="notifications-outline" size={20} color={COLORS.white} />
              <View style={styles.notificationDot} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={() => navigation.navigate('Wishlist')}
              activeOpacity={0.85}
            >
              <Ionicons name="heart-outline" size={20} color={COLORS.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.85}
            >
              <Ionicons name="person-outline" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.languageBar}>
          <Text style={styles.languageLabel}>भाषा:</Text>
          <View style={styles.languagePillRow}>
            {LANGUAGE_OPTIONS.map((language) => {
              const isActive = selectedLanguage === language.code;

              return (
                <TouchableOpacity
                  key={language.code}
                  style={[styles.languagePill, isActive && styles.languagePillActive]}
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
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >

        {/* Hero Section */}
        <View style={styles.heroSection}>
          {/* Hero Image */}
          <View style={styles.heroImageContainer}>
            <Image
              source={require('../assets/farmer_banner.png')}
              style={styles.heroImage}
              resizeMode="cover"
            />
          </View>

          {/* Hero Content */}
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>
              {t('home.heroTitle')}{'\n'}
              <Text style={styles.heroTitleGreen}>{t('home.heroTitleHighlight')}</Text>
            </Text>
            <Text style={styles.heroSubtitle}>
              {t('home.heroSubtitle')}
            </Text>

            {/* Trust Indicators */}
            <View style={styles.trustContainer}>
              <View style={styles.trustItem}>
                <View style={[styles.trustIcon, { backgroundColor: COLORS.primary }]}>
                  <Ionicons name="people" size={20} color={COLORS.white} />
                </View>
                <View>
                  <Text style={styles.trustValue}>50,000+</Text>
                  <Text style={styles.trustLabel}>{t('home.farmers')}</Text>
                </View>
              </View>

              <View style={styles.trustItem}>
                <View style={[styles.trustIcon, { backgroundColor: COLORS.primary }]}>
                  <Ionicons name="shield-checkmark" size={20} color={COLORS.white} />
                </View>
                <View>
                  <Text style={styles.trustValue}>{t('home.verified')}</Text>
                  <Text style={styles.trustLabel}>{t('home.sellers')}</Text>
                </View>
              </View>

              <View style={styles.trustItem}>
                <View style={[styles.trustIcon, { backgroundColor: COLORS.primary }]}>
                  <Ionicons name="lock-closed" size={20} color={COLORS.white} />
                </View>
                <View>
                  <Text style={styles.trustValue}>{t('home.secure')}</Text>
                  <Text style={styles.trustLabel}>{t('home.deals')}</Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.sellButton}
                onPress={() => navigation.navigate('SellAnimal')}
              >
                <Ionicons name="pricetag" size={20} color={COLORS.white} />
                <Text style={styles.sellButtonText}>{t('services.sellAnimal')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.buyButton}
                onPress={() => navigation.navigate('BuyAnimals')}
              >
                <Ionicons name="cart" size={20} color={COLORS.primary} />
                <Text style={styles.buyButtonText}>{t('home.buyAnimals')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Government Schemes */}
        <View style={styles.schemesSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.schemeSectionIcon}>
                <Ionicons name="business-outline" size={18} color="#B66F0D" />
              </View>
              <Text style={styles.sectionTitle}>{t('governmentSchemes.title')}</Text>
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>{t('governmentSchemes.newBadge')}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('GovernmentSchemes')} activeOpacity={0.85}>
              <Text style={styles.textViewAll}>{t('common.viewAll')}</Text>
            </TouchableOpacity>
          </View>

          {schemes.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.schemesScrollContent}
            >
              {schemes.map((scheme) => {
                const title = getLocalizedSchemeValue(scheme, 'title', selectedLanguage);
                const description = getLocalizedSchemeValue(scheme, 'short_description', selectedLanguage);

                return (
                  <TouchableOpacity
                    key={scheme.id}
                    style={styles.schemePreviewCard}
                    onPress={() => navigation.navigate('GovernmentSchemeDetail', { slug: scheme.slug })}
                    activeOpacity={0.9}
                  >
                    <View style={styles.schemePreviewTop}>
                      {scheme.image_url ? (
                        <Image
                          source={{ uri: scheme.image_url }}
                          style={styles.schemePreviewImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.schemePreviewIcon}>
                          <Ionicons name="leaf-outline" size={22} color="#B66F0D" />
                        </View>
                      )}
                    </View>
                    <View style={styles.schemePreviewBody}>
                      <Text style={styles.schemePreviewDepartment} numberOfLines={1}>
                        {scheme.department || t(`governmentSchemes.levels.${scheme.government_level}`, { defaultValue: scheme.government_level || '' })}
                      </Text>
                      <Text style={styles.schemePreviewTitle} numberOfLines={2}>
                        {title}
                      </Text>
                      <Text style={styles.schemePreviewDesc} numberOfLines={2}>
                        {description}
                      </Text>
                      <View style={styles.schemePreviewMetaRow}>
                        <View style={styles.schemeAmountPill}>
                          <Text style={styles.schemeAmountText} numberOfLines={1}>
                            {scheme.amount_label || t('governmentSchemes.verified')}
                          </Text>
                        </View>
                        <View style={styles.schemeAnimalPill}>
                          <Text style={styles.schemeAnimalText} numberOfLines={1}>
                            {t(`governmentSchemes.animalCategories.${scheme.animal_category}`, { defaultValue: scheme.animal_category || 'both' })}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.schemeApplyButton}>
                        <Ionicons name="open-outline" size={14} color={COLORS.surface} />
                        <Text style={styles.schemeApplyText}>{t('governmentSchemes.viewDetails')}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <TouchableOpacity
              style={styles.schemeEmptyBanner}
              onPress={() => navigation.navigate('GovernmentSchemes')}
              activeOpacity={0.9}
            >
              <Ionicons name="document-text-outline" size={24} color={COLORS.primary} />
              <Text style={styles.schemeEmptyText}>{t('governmentSchemes.homeEmpty')}</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Seller Listings */}
        {myListings.length > 0 ? (
          <View style={styles.myAnimalsSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionKicker}>
                  {t('profile.sellerDashboard', { defaultValue: 'Seller dashboard' })}
                </Text>
                <Text style={styles.sectionTitle}>
                  {t('profile.myAnimals', { defaultValue: 'My animals' })}
                </Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Profile')} activeOpacity={0.85}>
                <Text style={styles.textViewAll}>{t('common.viewAll')}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.myAnimalsScroll}
            >
              {myListings.map((listing) => {
                const type = listing.animal_type || listing.type || 'cow';
                const imageUri = listing.photo1 || listing.front_photo || listing.photos?.[0];
                const isSold = String(listing.status || '').toLowerCase() === 'sold';

                return (
                  <TouchableOpacity
                    key={`${type}-${listing.id}`}
                    style={styles.sellerAnimalCard}
                    onPress={() =>
                      navigation.navigate('SellerListingInsights', {
                        animalType: type,
                        id: listing.id,
                      })
                    }
                    activeOpacity={0.9}
                  >
                    <View style={[styles.sellerStatusStrip, isSold && styles.sellerStatusStripSold]}>
                      <Ionicons
                        name={isSold ? 'checkmark-circle' : 'radio-button-on'}
                        size={16}
                        color={isSold ? '#64748B' : COLORS.primary}
                      />
                      <Text style={[styles.sellerStatusText, isSold && styles.sellerStatusTextSold]}>
                        {isSold
                          ? t('profile.animalSoldVisible', { defaultValue: 'Sold listing' })
                          : t('profile.animalVisibleToBuyers', { defaultValue: 'Visible to buyers' })}
                      </Text>
                    </View>
                    <View style={styles.sellerAnimalBody}>
                      <View style={styles.sellerAnimalImageWrap}>
                        {imageUri ? (
                          <Image source={{ uri: imageUri }} style={styles.sellerAnimalImage} />
                        ) : (
                          <View style={styles.sellerAnimalPlaceholder}>
                            <Ionicons name="paw-outline" size={26} color={COLORS.primary} />
                          </View>
                        )}
                      </View>
                      <View style={styles.sellerAnimalInfo}>
                        <Text style={styles.sellerAnimalBreed} numberOfLines={1}>
                          {listing.breed || listing.breed_name || t('animalTypes.animal', { defaultValue: 'Animal' })}
                        </Text>
                        <Text style={styles.sellerAnimalPrice}>
                          ₹{Number(listing.price || listing.expected_price || 0).toLocaleString('en-IN')}
                        </Text>
                        <Text style={styles.sellerAnimalMeta} numberOfLines={1}>
                          {(listing.views || 0)} {t('profile.views', { defaultValue: 'views' })} · {type}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={22} color={COLORS.primary} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* Feature Cards */}
        <View style={styles.featuresSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.ourServices')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Services')}>
              <Text style={styles.textViewAll}>{t('common.viewAll')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuresScrollContent}
          >
            {featureCards.map((card) => (
              <TouchableOpacity
                key={card.key}
                style={styles.featureCardHorizontal}
                onPress={() => navigation.navigate(card.route)}
                activeOpacity={0.9}
              >
                <ImageBackground
                  source={card.image}
                  style={[styles.featureBackgroundImage, { backgroundColor: card.backgroundColor }]}
                  imageStyle={styles.featureBackgroundImageInner}
                  resizeMode="cover"
                >
                  <View style={styles.featureImageOverlay} />

                  <View style={styles.featureCardTopRow}>
                    <View />
                    <View style={styles.featureIconBadge}>
                      <Ionicons name="sparkles-outline" size={18} color={card.iconColor} />
                    </View>
                  </View>

                  <View style={styles.featureContent}>
                    <Text style={styles.featureCardTitle} numberOfLines={1}>
                      {card.title}
                    </Text>
                    <Text style={styles.featureCardSubtitle} numberOfLines={2}>
                      {card.subtitle}
                    </Text>
                  </View>

                  <View style={styles.featureArrow}>
                    <Ionicons name="arrow-forward" size={18} color={COLORS.surface} />
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Animal Listings */}
        <View style={styles.listingsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.allAvailableAnimals')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('BuyAnimals')}>
              <View style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>{t('common.viewAll')}</Text>
                <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
              </View>
            </TouchableOpacity>
          </View>

          {loading ? (
            <SkeletonLoader variant="animalList" count={3} />
          ) : (
            <View style={styles.animalsSection}>
              {animals.map((animal) => (
                <AnimalCard
                  key={`${animal.animal_type}-${animal.id}`}
                  listing={animal}
                  onPress={() => navigation.navigate('AnimalDetail', {
                    animalType: animal.animal_type,
                    id: animal.id
                  })}
                />
              ))}
            </View>
          )}

          {animals.length === 0 && !loading && (
            <View style={styles.emptyState}>
              <Ionicons name="paw" size={48} color={COLORS.borderStrong} />
              <Text style={styles.emptyText}>{t('home.noAnimals')}</Text>
            </View>
          )}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  headerShell: {
    backgroundColor: COLORS.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: COLORS.primary,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoTile: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerLogoImage: {
    width: 42,
    height: 42,
    borderRadius: 12,
  },
  brandTextWrap: {
    flex: 1,
  },
  headerLogoText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.primarySoft,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 12,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accentLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  languageBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: COLORS.primaryDark,
  },
  languageLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primarySoft,
    marginRight: 10,
  },
  languagePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  languagePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  languagePillActive: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surface,
  },
  languagePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },
  languagePillTextActive: {
    color: COLORS.primaryDark,
  },
  heroSection: {
    backgroundColor: COLORS.surface,
    paddingBottom: 24,
  },
  heroImageContainer: {
    width: '100%',
    height: 250,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    lineHeight: 36,
  },
  heroTitleGreen: {
    color: COLORS.primary,
  },
  heroSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
    lineHeight: 20,
  },
  trustContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primarySoft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trustIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  trustLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  sellButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  sellButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  buyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    gap: 8,
  },
  buyButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  featuresSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  myAnimalsSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionKicker: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  myAnimalsScroll: {
    gap: 12,
    paddingRight: 20,
  },
  sellerAnimalCard: {
    width: width * 0.78,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  sellerStatusStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#D6FBE2',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sellerStatusStripSold: {
    backgroundColor: '#E2E8F0',
  },
  sellerStatusText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  sellerStatusTextSold: {
    color: '#64748B',
  },
  sellerAnimalBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  sellerAnimalImageWrap: {
    width: 82,
    height: 82,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.primarySoft,
  },
  sellerAnimalImage: {
    width: '100%',
    height: '100%',
  },
  sellerAnimalPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerAnimalInfo: {
    flex: 1,
    minWidth: 0,
  },
  sellerAnimalBreed: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
  },
  sellerAnimalPrice: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 5,
  },
  sellerAnimalMeta: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  schemesSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 6,
    marginTop: 0,
    backgroundColor: COLORS.surface,
  },
  sectionTitleRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  schemeSectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#FFF2D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newBadge: {
    borderRadius: 999,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  newBadgeText: {
    color: COLORS.surface,
    fontSize: 10,
    fontWeight: '900',
  },
  schemesScrollContent: {
    gap: 12,
  },
  schemePreviewCard: {
    width: width * 0.48,
    minHeight: 228,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  schemePreviewTop: {
    height: 72,
    backgroundColor: '#FFF0D4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  schemePreviewImage: {
    width: '100%',
    height: '100%',
  },
  schemePreviewIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  schemePreviewBody: {
    padding: 11,
  },
  schemePreviewDepartment: {
    color: COLORS.primaryDark,
    fontSize: 10,
    fontWeight: '900',
  },
  schemePreviewTitle: {
    marginTop: 4,
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
  },
  schemePreviewDesc: {
    marginTop: 5,
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
  },
  schemePreviewMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  schemeAmountPill: {
    borderRadius: 999,
    backgroundColor: '#FFF7E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  schemeAmountText: {
    color: '#B66F0D',
    fontSize: 10,
    fontWeight: '900',
  },
  schemeAnimalPill: {
    borderRadius: 999,
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  schemeAnimalText: {
    color: COLORS.primaryDark,
    fontSize: 10,
    fontWeight: '900',
  },
  schemeApplyButton: {
    marginTop: 9,
    borderRadius: 11,
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: '#C5770F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  schemeApplyText: {
    color: COLORS.surface,
    fontSize: 11,
    fontWeight: '900',
  },
  schemeEmptyBanner: {
    minHeight: 68,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  schemeEmptyText: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  textViewAll: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  featuresScrollContent: {
    paddingRight: 20,
    gap: 14,
  },
  featureCardHorizontal: {
    width: width * 0.6,
    minHeight: 146,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  featureBackgroundImage: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 14,
  },
  featureBackgroundImageInner: {
    borderRadius: 20,
  },
  featureImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12, 22, 20, 0.14)',
  },
  featureCardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
    zIndex: 1,
  },
  featureContent: {
    paddingRight: 44,
    zIndex: 1,
  },
  featureCardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.28)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  featureCardSubtitle: {
    fontSize: 14,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.82)',
    textShadowColor: 'rgba(0, 0, 0, 0.22)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  featureIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureArrow: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  listingsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  viewAllText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  animalsSection: {
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.borderStrong,
    marginTop: 12,
  },
});

export default HomeScreen;
