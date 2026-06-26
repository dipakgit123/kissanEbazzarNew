import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../utils/constants';
import AppHeader from '../components/AppHeader';

const { width } = Dimensions.get('window');

const ServicesScreen = ({ navigation }) => {
  const { t } = useTranslation();

  const services = [
    {
      id: 1,
      icon: 'water',
      title: t('services.milkReports'),
      subtitle: t('services.milkReportsDesc'),
      color: COLORS.primary,
      screen: 'MilkReports',
      image: require('../assets/milk_report.jpeg'),
    },
    {
      id: 2,
      icon: 'chatbubbles',
      title: t('services.aiAssistant'),
      subtitle: t('services.aiAssistantDesc'),
      color: COLORS.info,
      screen: 'AIAssistant',
      image: require('../assets/ai_assistant.png'),
    },
    {
      id: 3,
      icon: 'medical',
      title: t('services.veterinarian'),
      subtitle: t('services.veterinarianDesc'),
      color: COLORS.primary,
      screen: 'Veterinarian',
      image: require('../assets/veterinarian.png'),
    },
    {
      id: 4,
      icon: 'fitness',
      title: t('services.aiHealthCheck'),
      subtitle: t('services.aiHealthCheckDesc'),
      color: COLORS.accent,
      screen: 'AIHealthCheck',
      image: require('../assets/ai_health.png'),
    },
    {
      id: 5,
      icon: 'calendar',
      title: t('services.pregnancy'),
      subtitle: t('services.pregnancyDesc'),
      color: COLORS.warning,
      screen: 'PregnancyCalendar',
      image: require('../assets/pregnancy_calendar.png'),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <AppHeader
        safeArea={false}
        showBack={false}
        title={t('home.ourServices')}
        subtitle={t('services.subtitle', { defaultValue: 'Choose what you want to do today' })}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.servicesGrid}>
          {services.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={styles.serviceCard}
              onPress={() => navigation.navigate(service.screen)}
              activeOpacity={0.9}
            >
              <Image
                source={service.image}
                style={styles.serviceImage}
                resizeMode="contain"
              />
              <View style={styles.serviceContent}>
                <Text style={styles.serviceTitle}>{service.title}</Text>
                <Text style={styles.serviceSubtitle}>{service.subtitle}</Text>
                <View style={styles.arrowContainer}>
                  <Ionicons name="arrow-forward" size={20} color={service.color} />
                </View>
              </View>
            </TouchableOpacity>
          ))}
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  content: {
    padding: 16,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: (width - 48) / 2,
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  serviceImage: {
    width: '100%',
    height: 140,
  },
  serviceContent: {
    padding: 12,
    backgroundColor: COLORS.surface,
    position: 'relative',
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  serviceSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  arrowContainer: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ServicesScreen;
