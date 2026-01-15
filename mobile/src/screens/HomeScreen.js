import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../utils/constants';
import AnimalCard from '../components/AnimalCard';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { animalListingService } from '../services/api';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [animals, setAnimals] = useState([]);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  useEffect(() => {
    fetchAnimals();
  }, []);

  const fetchAnimals = async () => {
    setLoading(true);
    try {
      const response = await animalListingService.getAllListings();
      if (response.success && response.data) {
        setAnimals(response.data.slice(0, 4)); // First 4 for preview
      } else {
        setAnimals([]);
      }
    } catch (error) {
      console.error('Error fetching animals:', error);
      setAnimals([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header with Language Button */}
      <View style={styles.header}>
        <Text style={styles.headerLogo}>🐄 {t('common.appName')}</Text>
        <TouchableOpacity
          style={styles.languageButton}
          onPress={() => setLanguageModalVisible(true)}
        >
          <Ionicons name="language" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

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
                  <Ionicons name="people" size={20} color="#fff" />
                </View>
                <View>
                  <Text style={styles.trustValue}>50,000+</Text>
                  <Text style={styles.trustLabel}>{t('home.farmers')}</Text>
                </View>
              </View>

              <View style={styles.trustItem}>
                <View style={[styles.trustIcon, { backgroundColor: COLORS.primary }]}>
                  <Ionicons name="shield-checkmark" size={20} color="#fff" />
                </View>
                <View>
                  <Text style={styles.trustValue}>{t('home.verified')}</Text>
                  <Text style={styles.trustLabel}>{t('home.sellers')}</Text>
                </View>
              </View>

              <View style={styles.trustItem}>
                <View style={[styles.trustIcon, { backgroundColor: COLORS.primary }]}>
                  <Ionicons name="lock-closed" size={20} color="#fff" />
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
                <Ionicons name="add" size={20} color="#fff" />
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

        {/* Feature Cards */}
        <View style={styles.featuresSection}>
          <View style={styles.featuresRow}>
            {/* AI Assistant Card */}
            <TouchableOpacity
              style={[styles.featureCard, { backgroundColor: '#3B82F6' }]}
              onPress={() => navigation.navigate('AIAssistant')}
            >
              <Image
                source={require('../assets/ai_assistant.png')}
                style={styles.featureImage}
                resizeMode="cover"
              />
              <View style={styles.featureOverlay} />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{t('services.aiAssistant')}</Text>
                <Text style={styles.featureSubtitle}>{t('services.aiAssistantDesc')}</Text>
                <View style={styles.featureArrow}>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </View>
              </View>
            </TouchableOpacity>

            {/* Veterinarian Card */}
            <TouchableOpacity
              style={[styles.featureCard, { backgroundColor: '#10B981' }]}
              onPress={() => navigation.navigate('Veterinarian')}
            >
              <Image
                source={require('../assets/veterinarian.png')}
                style={styles.featureImage}
                resizeMode="cover"
              />
              <View style={styles.featureOverlay} />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{t('services.veterinarian')}</Text>
                <Text style={styles.featureSubtitle}>{t('services.veterinarianDesc')}</Text>
                <View style={styles.featureArrow}>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.featuresRow}>
            {/* AI Health Card */}
            <TouchableOpacity
              style={[styles.featureCard, { backgroundColor: '#8B5CF6' }]}
              onPress={() => navigation.navigate('AIHealthCheck')}
            >
              <Image
                source={require('../assets/ai_health.png')}
                style={styles.featureImage}
                resizeMode="cover"
              />
              <View style={styles.featureOverlay} />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{t('services.aiHealthCheck')}</Text>
                <Text style={styles.featureSubtitle}>{t('services.aiHealthCheckDesc')}</Text>
                <View style={styles.featureArrow}>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </View>
              </View>
            </TouchableOpacity>

            {/* Pregnancy Calendar Card */}
            <TouchableOpacity
              style={[styles.featureCard, { backgroundColor: '#EC4899' }]}
              onPress={() => navigation.navigate('PregnancyCalendar')}
            >
              <Image
                source={require('../assets/pregnancy_calendar.png')}
                style={styles.featureImage}
                resizeMode="cover"
              />
              <View style={styles.featureOverlay} />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{t('services.pregnancy')}</Text>
                <Text style={styles.featureSubtitle}>{t('services.pregnancyDesc')}</Text>
                <View style={styles.featureArrow}>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Animal Listings */}
        <View style={styles.listingsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.allAvailableAnimals')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('BuyAnimals')}>
              <View style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>{t('common.viewAll')}</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
          ) : (
            <View style={styles.animalsSection}>
              {animals.map((animal) => (
                <AnimalCard
                  key={animal.id}
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
              <Ionicons name="paw" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>{t('home.noAnimals')}</Text>
            </View>
          )}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      <LanguageSwitcher
        visible={languageModalVisible}
        onClose={() => setLanguageModalVisible(false)}
      />
    </SafeAreaView>
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
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLogo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  languageButton: {
    padding: 4,
  },
  heroSection: {
    backgroundColor: '#fff',
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
    color: '#000',
    lineHeight: 36,
  },
  heroTitleGreen: {
    color: COLORS.primary,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    lineHeight: 20,
  },
  trustContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
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
    color: '#000',
  },
  trustLabel: {
    fontSize: 10,
    color: '#6B7280',
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
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
    paddingTop: 24,
  },
  featuresRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  featureCard: {
    flex: 1,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  featureImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  featureOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  featureContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  featureSubtitle: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  featureArrow: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
    color: '#000',
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
    color: '#fff',
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
    color: '#9CA3AF',
    marginTop: 12,
  },
});

export default HomeScreen;
