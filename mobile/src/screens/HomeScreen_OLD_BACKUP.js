import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, ANIMAL_TYPES } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import AnimalCard from '../components/AnimalCard';
import { animalListingService } from '../services/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const HomeScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [featuredAnimals, setFeaturedAnimals] = useState([]);
  const [recentAnimals, setRecentAnimals] = useState([]);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    setLoading(true);
    try {
      const response = await animalListingService.getAllListings();
      if (response.success) {
        const listings = response.listings || [];
        setFeaturedAnimals(listings.slice(0, 6));
        setRecentAnimals(listings.slice(0, 10));
      }
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHomeData();
  }, []);

  const renderServiceCard = (icon, title, subtitle, color, onPress) => (
    <TouchableOpacity
      style={[styles.serviceCard, { backgroundColor: color + '15' }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.serviceIcon, { backgroundColor: color + '30' }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <Text style={styles.serviceTitle}>{title}</Text>
      <Text style={styles.serviceSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );

  const renderCategoryCard = (category) => (
    <TouchableOpacity
      key={category.id}
      style={styles.categoryCard}
      onPress={() => navigation.navigate('CategoryListings', { category: category.id })}
      activeOpacity={0.9}
    >
      <View style={styles.categoryIconContainer}>
        <Text style={styles.categoryEmoji}>{category.icon}</Text>
      </View>
      <Text style={styles.categoryName}>{category.name}</Text>
      <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../assets/cow.jpg')}
            style={styles.logo}
            resizeMode="cover"
          />
          <View>
            <Text style={styles.greeting}>{t('home.greeting')}, {user?.fullName || t('home.greeting')} 👋</Text>
            <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications" size={24} color="#1F2937" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <Image
            source={require('../assets/cow.jpg')}
            style={styles.heroBannerImage}
            resizeMode="cover"
          />
          <View style={styles.heroBannerOverlay}>
            <Text style={styles.heroBannerTitle}>{t('home.heroTitle')}</Text>
            <Text style={styles.heroBannerTitle}>{t('home.heroTitle2')}</Text>
            <Text style={styles.heroBannerSubtitle}>{t('home.heroSubtitle')}</Text>
            <TouchableOpacity
              style={styles.heroBannerButton}
              onPress={() => navigation.navigate('BuyAnimals')}
            >
              <Text style={styles.heroBannerButtonText}>{t('home.exploreNow')}</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home.ourServices')}</Text>
          <View style={styles.servicesGrid}>
            {renderServiceCard(
              'cart',
              t('services.buyAnimals'),
              t('services.buyAnimalsDesc'),
              '#3B82F6',
              () => navigation.navigate('BuyAnimals')
            )}
            {renderServiceCard(
              'add-circle',
              t('services.sellAnimal'),
              t('services.sellAnimalDesc'),
              '#10B981',
              () => navigation.navigate('SellAnimal')
            )}
            {renderServiceCard(
              'medical',
              t('services.veterinarian'),
              t('services.veterinarianDesc'),
              '#EF4444',
              () => navigation.navigate('Veterinarian')
            )}
            {renderServiceCard(
              'fitness',
              t('services.aiHealthCheck'),
              t('services.aiHealthCheckDesc'),
              '#F59E0B',
              () => navigation.navigate('AIHealthCheck')
            )}
            {renderServiceCard(
              'calendar',
              t('services.pregnancy'),
              t('services.pregnancyDesc'),
              '#8B5CF6',
              () => navigation.navigate('PregnancyCalendar')
            )}
            {renderServiceCard(
              'chatbubbles',
              t('services.aiAssistant'),
              t('services.aiAssistantDesc'),
              '#06B6D4',
              () => navigation.navigate('AIAssistant')
            )}
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.browseCategory')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('BuyAnimals')}>
              <Text style={styles.seeAllText}>{t('common.seeAll')}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.categoriesContainer}>
            {ANIMAL_TYPES.map(renderCategoryCard)}
          </View>
        </View>

        {/* Featured Animals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.featuredAnimals')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('BuyAnimals')}>
              <Text style={styles.seeAllText}>{t('common.seeAll')}</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredList}
            >
              {featuredAnimals.map((animal) => (
                <View key={animal.id} style={styles.featuredCard}>
                  <AnimalCard
                    animal={animal}
                    onPress={() => navigation.navigate('AnimalDetail', { animalId: animal.id })}
                  />
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Why Choose Us */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home.whyChoose')}</Text>
          <View style={styles.featuresContainer}>
            <View style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="shield-checkmark" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.featureTitle}>{t('home.verifiedSellers')}</Text>
              <Text style={styles.featureText}>{t('home.verifiedSellersDesc')}</Text>
            </View>
            <View style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="location" size={24} color="#10B981" />
              </View>
              <Text style={styles.featureTitle}>{t('home.nearbyListings')}</Text>
              <Text style={styles.featureText}>{t('home.nearbyListingsDesc')}</Text>
            </View>
            <View style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="heart" size={24} color="#EF4444" />
              </View>
              <Text style={styles.featureTitle}>{t('home.healthSupport')}</Text>
              <Text style={styles.featureText}>{t('home.healthSupportDesc')}</Text>
            </View>
            <View style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="pricetag" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.featureTitle}>{t('home.bestPrices')}</Text>
              <Text style={styles.featureText}>{t('home.bestPricesDesc')}</Text>
            </View>
          </View>
        </View>

        {/* App Download Banner */}
        <View style={styles.section}>
          <View style={styles.downloadBanner}>
            <Image
              source={require('../assets/cow.jpg')}
              style={styles.downloadBannerImage}
              resizeMode="cover"
            />
            <View style={styles.downloadBannerContent}>
              <Text style={styles.downloadBannerTitle}>{t('home.downloadApp')}</Text>
              <Text style={styles.downloadBannerText}>
                {t('home.downloadAppDesc')}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 12,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#fff',
  },
  content: {
    flex: 1,
  },
  heroBanner: {
    height: 200,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  heroBannerImage: {
    width: '100%',
    height: '100%',
  },
  heroBannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  heroBannerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroBannerSubtitle: {
    fontSize: 16,
    color: '#fff',
    marginTop: 8,
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  heroBannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  heroBannerButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginRight: 6,
  },
  section: {
    paddingHorizontal: 16,
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
    color: '#1F2937',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: (width - 48) / 2,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  serviceIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  serviceSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  categoriesContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  featuredList: {
    paddingRight: 16,
  },
  featuredCard: {
    width: CARD_WIDTH,
    marginRight: 12,
  },
  loader: {
    marginVertical: 20,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: (width - 48) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
    textAlign: 'center',
  },
  featureText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  downloadBanner: {
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  downloadBannerImage: {
    width: '100%',
    height: '100%',
  },
  downloadBannerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(59, 130, 246, 0.85)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  downloadBannerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  downloadBannerText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
});

export default HomeScreen;
