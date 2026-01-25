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

const { width } = Dimensions.get('window');

const ServicesScreen = ({ navigation }) => {
  const { t } = useTranslation();

  const services = [
    {
      id: 1,
      icon: 'chatbubbles',
      title: t('services.aiAssistant'),
      subtitle: t('services.aiAssistantDesc'),
      color: '#3B82F6',
      screen: 'AIAssistant',
      image: require('../assets/ai_assistant.png'),
    },
    {
      id: 2,
      icon: 'medical',
      title: t('services.veterinarian'),
      subtitle: t('services.veterinarianDesc'),
      color: '#10B981',
      screen: 'Veterinarian',
      image: require('../assets/veterinarian.png'),
    },
    {
      id: 3,
      icon: 'fitness',
      title: t('services.aiHealthCheck'),
      subtitle: t('services.aiHealthCheckDesc'),
      color: '#8B5CF6',
      screen: 'AIHealthCheck',
      image: require('../assets/ai_health.png'),
    },
    {
      id: 4,
      icon: 'calendar',
      title: t('services.pregnancy'),
      subtitle: t('services.pregnancyDesc'),
      color: '#EC4899',
      screen: 'PregnancyCalendar',
      image: require('../assets/pregnancy_calendar.png'),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('home.ourServices')}</Text>
      </View>

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
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
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
    backgroundColor: '#fff',
    shadowColor: '#000',
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
    backgroundColor: '#fff',
    position: 'relative',
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  serviceSubtitle: {
    fontSize: 11,
    color: '#6B7280',
  },
  arrowContainer: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ServicesScreen;
