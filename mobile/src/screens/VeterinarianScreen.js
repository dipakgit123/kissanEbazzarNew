import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Linking,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import { COLORS } from '../utils/constants';
import { veterinarianService } from '../services/api';

const VeterinarianScreen = ({ navigation }) => {
  const { t, ready } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [veterinarians, setVeterinarians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  // Show loading while translations are loading
  if (!ready) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const services = [
    {
      id: 1,
      name: 'Emergency Care',
      nameHindi: 'आपातकालीन देखभाल',
      icon: '🚨',
      description: '24/7 emergency veterinary services',
      price: '₹500-2000',
      duration: 'Immediate',
      available: true,
    },
    {
      id: 2,
      name: 'General Checkup',
      nameHindi: 'सामान्य जांच',
      icon: '🩺',
      description: 'Comprehensive health examination',
      price: '₹300-800',
      duration: '30-45 mins',
      available: true,
    },
    {
      id: 3,
      name: 'Vaccination',
      nameHindi: 'टीकाकरण',
      icon: '💉',
      description: 'Complete vaccination schedule',
      price: '₹200-500',
      duration: '15-30 mins',
      available: true,
    },
    {
      id: 4,
      name: 'Surgery',
      nameHindi: 'सर्जरी',
      icon: '⚕️',
      description: 'Minor and major surgical procedures',
      price: '₹2000-15000',
      duration: '1-4 hours',
      available: true,
    },
    {
      id: 5,
      name: 'Dental Care',
      nameHindi: 'दंत चिकित्सा',
      icon: '🦷',
      description: 'Oral health care and treatments',
      price: '₹400-1200',
      duration: '45-60 mins',
      available: true,
    },
    {
      id: 6,
      name: 'Pregnancy Care',
      nameHindi: 'गर्भावस्था देखभाल',
      icon: '🤰',
      description: 'Prenatal and postnatal care',
      price: '₹600-1500',
      duration: '1-2 hours',
      available: true,
    },
  ];

  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    if (userLocation) {
      fetchNearbyVets();
    } else {
      fetchAllVets();
    }
  }, [userLocation]);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      console.log('Error getting location:', error);
    }
  };

  const fetchNearbyVets = async () => {
    try {
      const response = await veterinarianService.getNearby(
        userLocation.latitude,
        userLocation.longitude,
        100
      );
      if (response.success) {
        setVeterinarians(response.data);
      }
    } catch (error) {
      console.error('Error fetching nearby vets:', error);
      fetchAllVets();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAllVets = async () => {
    try {
      const response = await veterinarianService.getAll(1, 50);
      if (response.success) {
        setVeterinarians(response.data.veterinarians || response.data || []);
      }
    } catch (error) {
      console.error('Error fetching vets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (userLocation) {
      fetchNearbyVets();
    } else {
      fetchAllVets();
    }
  };

  const handleCall = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone.replace('+', '')}`);
    }
  };

  const handleWhatsApp = (phone, name) => {
    if (phone) {
      const phoneNumber = phone.replace('+', '');
      const message = `Hi Dr. ${name}! I would like to book an appointment for my animal.`;
      const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
      Linking.openURL(url).catch(() => {
        Linking.openURL(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`);
      });
    }
  };

  const handleEmergencyCall = () => {
    Alert.alert(
      'Emergency Call',
      'Are you sure you want to call the emergency veterinary line?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call Now', onPress: () => Linking.openURL('tel:9876500000') },
      ]
    );
  };

  const handleVetPress = (vet) => {
    navigation.navigate('VetDetail', { vetId: vet.id });
  };

  const getSpecializationLabel = (spec) => {
    const labels = {
      'large_animal': 'Large Animal',
      'small_animal': 'Small Animal',
      'livestock': 'Livestock',
      'surgery': 'Surgery',
      'general': 'General Practice',
      'emergency': 'Emergency Care',
      'reproduction': 'Reproduction',
    };
    return labels[spec] || spec;
  };

  const filteredServices = services.filter(
    (service) =>
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.nameHindi.includes(searchQuery)
  );

  const filteredVets = veterinarians.filter(
    (vet) =>
      vet.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vet.specialization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vet.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderStars = (rating) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= Math.round(rating || 0) ? 'star' : 'star-outline'}
            size={12}
            color={star <= Math.round(rating || 0) ? '#FFD700' : COLORS.gray}
            style={{ marginRight: 1 }}
          />
        ))}
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>पशु डॉक्टर</Text>
        <Text style={styles.titleEn}>{t('veterinarian.title')}</Text>
        <Text style={styles.subtitle}>
          Professional veterinary care for your farm animals
        </Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('veterinarian.searchPlaceholder')}
            placeholderTextColor={COLORS.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Services Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('veterinarian.services')}</Text>
        <View style={styles.servicesGrid}>
          {filteredServices.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={[
                styles.serviceCard,
                selectedService === service.id && styles.selectedServiceCard,
              ]}
              onPress={() =>
                setSelectedService(selectedService === service.id ? null : service.id)
              }
            >
              <Text style={styles.serviceIcon}>{service.icon}</Text>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.serviceNameHindi}>{service.nameHindi}</Text>
              <Text style={styles.serviceDesc} numberOfLines={2}>
                {service.description}
              </Text>
              <View style={styles.serviceFooter}>
                <Text style={styles.servicePrice}>{service.price}</Text>
                <Text style={styles.serviceDuration}>{service.duration}</Text>
              </View>
              <View
                style={[
                  styles.availabilityBadge,
                  { backgroundColor: service.available ? COLORS.green + '20' : COLORS.red + '20' },
                ]}
              >
                <Text
                  style={[
                    styles.availabilityText,
                    { color: service.available ? COLORS.green : COLORS.red },
                  ]}
                >
                  {service.available ? t('veterinarian.available') : t('veterinarian.unavailable')}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Veterinarians Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('veterinarian.title')}</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Finding veterinarians near you...</Text>
          </View>
        ) : filteredVets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="medical-outline" size={60} color={COLORS.gray} />
            <Text style={styles.emptyText}>No veterinarians found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search or check back later</Text>
          </View>
        ) : (
          filteredVets.map((vet) => (
            <TouchableOpacity
              key={vet.id}
              style={styles.vetCard}
              onPress={() => handleVetPress(vet)}
            >
              <View style={styles.vetHeader}>
                {vet.profile_photo ? (
                  <Image source={{ uri: vet.profile_photo }} style={styles.vetImage} />
                ) : (
                  <View style={[styles.vetImage, styles.vetImagePlaceholder]}>
                    <Ionicons name="person" size={24} color={COLORS.gray} />
                  </View>
                )}
                <View style={styles.vetInfo}>
                  <Text style={styles.vetName}>Dr. {vet.full_name}</Text>
                  <Text style={styles.vetSpec}>{getSpecializationLabel(vet.specialization)}</Text>
                  <View style={styles.ratingRow}>
                    {renderStars(vet.rating)}
                    <Text style={styles.ratingText}>
                      {vet.rating ? Number(vet.rating).toFixed(1) : '0.0'} ({vet.total_reviews || 0} reviews)
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.vetDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={16} color={COLORS.gray} />
                  <Text style={styles.detailText}>{vet.city}, {vet.state}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={16} color={COLORS.gray} />
                  <Text style={styles.detailText}>{vet.experience_years || 0}+ {t('veterinarian.experience')}</Text>
                </View>
                {vet.distance && (
                  <View style={styles.detailRow}>
                    <Ionicons name="navigate-outline" size={16} color={COLORS.primary} />
                    <Text style={[styles.detailText, { color: COLORS.primary }]}>
                      {vet.distance.toFixed(1)} km away
                    </Text>
                  </View>
                )}
              </View>

              {vet.emergency_available && (
                <View style={styles.emergencyBadge}>
                  <Ionicons name="alert-circle" size={14} color={COLORS.white} />
                  <Text style={styles.emergencyBadgeText}>{t('veterinarian.emergencyAvailable')}</Text>
                </View>
              )}

              <View style={styles.vetActions}>
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleCall(vet.phone_number);
                  }}
                >
                  <Ionicons name="call" size={18} color={COLORS.white} />
                  <Text style={styles.btnText}>{t('veterinarian.call')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.whatsappBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleWhatsApp(vet.phone_number, vet.full_name);
                  }}
                >
                  <Ionicons name="logo-whatsapp" size={18} color={COLORS.white} />
                  <Text style={styles.btnText}>WhatsApp</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.viewBtn}
                  onPress={() => handleVetPress(vet)}
                >
                  <Ionicons name="eye-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.viewBtnText}>View</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Emergency Section */}
      <View style={styles.emergencyCard}>
        <Text style={styles.emergencyTitle}>Emergency Veterinary Care</Text>
        <Text style={styles.emergencySubtitle}>24/7 {t('veterinarian.emergencyAvailable')}</Text>
        <View style={styles.emergencyButtons}>
          <TouchableOpacity style={styles.emergencyCallBtn} onPress={handleEmergencyCall}>
            <Ionicons name="call" size={20} color={COLORS.red} />
            <Text style={styles.emergencyCallText}>{t('veterinarian.call')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.emergencyWhatsappBtn}
            onPress={() => handleWhatsApp('9876500000', 'Emergency')}
          >
            <Ionicons name="logo-whatsapp" size={20} color={COLORS.white} />
            <Text style={styles.emergencyWhatsappText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary + '10',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  titleEn: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.gray,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: COLORS.black,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 16,
    textAlign: 'center',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedServiceCard: {
    borderColor: COLORS.primary,
  },
  serviceIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.black,
    textAlign: 'center',
  },
  serviceNameHindi: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 4,
  },
  serviceDesc: {
    fontSize: 11,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 8,
  },
  serviceFooter: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  serviceDuration: {
    fontSize: 11,
    color: COLORS.gray,
  },
  availabilityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availabilityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.gray,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
  },
  vetCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  vetHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  vetImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  vetImagePlaceholder: {
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vetInfo: {
    flex: 1,
  },
  vetName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  vetSpec: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 4,
  },
  vetDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.gray,
    marginLeft: 6,
  },
  emergencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.red,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
    gap: 4,
  },
  emergencyBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
  },
  vetActions: {
    flexDirection: 'row',
    gap: 8,
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 4,
  },
  whatsappBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 4,
  },
  viewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary + '15',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 4,
  },
  btnText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 13,
  },
  viewBtnText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  emergencyCard: {
    backgroundColor: COLORS.red,
    margin: 16,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  emergencyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  emergencySubtitle: {
    fontSize: 16,
    color: COLORS.white + 'CC',
    marginBottom: 16,
  },
  emergencyButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  emergencyCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  emergencyCallText: {
    color: COLORS.red,
    fontWeight: 'bold',
    fontSize: 14,
  },
  emergencyWhatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  emergencyWhatsappText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default VeterinarianScreen;
