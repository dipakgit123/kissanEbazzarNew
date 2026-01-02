import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';

const VeterinarianScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState(null);

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

  const veterinarians = [
    {
      id: 1,
      name: 'Dr. Rajesh Kumar',
      specialization: 'Large Animal Medicine',
      experience: '15+ years',
      rating: 4.8,
      patients: 2500,
      location: 'Pune, Maharashtra',
      phone: '9876543210',
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face',
      available: true,
      nextAvailable: 'Today 2:00 PM',
    },
    {
      id: 2,
      name: 'Dr. Priya Sharma',
      specialization: 'Small Animal Surgery',
      experience: '12+ years',
      rating: 4.9,
      patients: 1800,
      location: 'Nashik, Maharashtra',
      phone: '9876543211',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face',
      available: true,
      nextAvailable: 'Today 4:30 PM',
    },
    {
      id: 3,
      name: 'Dr. Vikram Singh',
      specialization: 'Livestock Health',
      experience: '20+ years',
      rating: 4.7,
      patients: 3200,
      location: 'Aurangabad, Maharashtra',
      phone: '9876543212',
      image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&h=150&fit=crop&crop=face',
      available: false,
      nextAvailable: 'Tomorrow 10:00 AM',
    },
  ];

  const handleCall = (phone) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsApp = (phone, name) => {
    const message = `Hi Dr. ${name}! I would like to book an appointment for my animal.`;
    const url = `whatsapp://send?phone=91${phone}&text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://wa.me/91${phone}?text=${encodeURIComponent(message)}`);
    });
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

  const filteredServices = services.filter(
    (service) =>
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.nameHindi.includes(searchQuery)
  );

  const filteredVets = veterinarians.filter(
    (vet) =>
      vet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vet.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vet.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>पशु डॉक्टर</Text>
        <Text style={styles.titleEn}>Veterinarian Services</Text>
        <Text style={styles.subtitle}>
          Professional veterinary care for your farm animals
        </Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services or doctors..."
            placeholderTextColor={COLORS.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Services Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Services</Text>
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
                  {service.available ? 'Available' : 'Not Available'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Veterinarians Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Our Veterinarians</Text>
        {filteredVets.map((vet) => (
          <View key={vet.id} style={styles.vetCard}>
            <View style={styles.vetHeader}>
              <Image source={{ uri: vet.image }} style={styles.vetImage} />
              <View style={styles.vetInfo}>
                <Text style={styles.vetName}>{vet.name}</Text>
                <Text style={styles.vetSpec}>{vet.specialization}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color={COLORS.yellow} />
                  <Text style={styles.ratingText}>
                    {vet.rating} • {vet.patients} patients
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.vetDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={16} color={COLORS.gray} />
                <Text style={styles.detailText}>{vet.location}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={16} color={COLORS.gray} />
                <Text style={styles.detailText}>{vet.experience}</Text>
              </View>
            </View>

            <View
              style={[
                styles.availabilityBadge,
                {
                  backgroundColor: vet.available ? COLORS.green + '20' : COLORS.yellow + '20',
                  alignSelf: 'flex-start',
                },
              ]}
            >
              <Text
                style={[
                  styles.availabilityText,
                  { color: vet.available ? COLORS.green : COLORS.yellow },
                ]}
              >
                {vet.available ? 'Available Now' : `Next: ${vet.nextAvailable}`}
              </Text>
            </View>

            <View style={styles.vetActions}>
              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => handleCall(vet.phone)}
              >
                <Ionicons name="call" size={18} color={COLORS.white} />
                <Text style={styles.btnText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.whatsappBtn}
                onPress={() => handleWhatsApp(vet.phone, vet.name)}
              >
                <Ionicons name="logo-whatsapp" size={18} color={COLORS.white} />
                <Text style={styles.btnText}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Emergency Section */}
      <View style={styles.emergencyCard}>
        <Text style={styles.emergencyTitle}>Emergency Veterinary Care</Text>
        <Text style={styles.emergencySubtitle}>24/7 Emergency Services Available</Text>
        <View style={styles.emergencyButtons}>
          <TouchableOpacity style={styles.emergencyCallBtn} onPress={handleEmergencyCall}>
            <Ionicons name="call" size={20} color={COLORS.red} />
            <Text style={styles.emergencyCallText}>Call Emergency</Text>
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
  vetActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.blue,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  whatsappBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  btnText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
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
    backgroundColor: COLORS.green,
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
