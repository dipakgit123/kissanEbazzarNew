import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../utils/constants';
import { appointmentService } from '../services/api';
import AppHeader from '../components/AppHeader';

const AppointmentBookingScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { veterinarian } = route.params;

  const [formData, setFormData] = useState({
    date: new Date(),
    time: '',
    animalType: '',
    animalName: '',
    breed: '',
    age: '',
    reason: '',
    symptoms: '',
    urgency: 'normal',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [loading, setLoading] = useState(false);

  const animalTypes = [
    { value: 'cattle', label: 'Cattle / गाय', icon: '🐄' },
    { value: 'buffalo', label: 'Buffalo / भैंस', icon: '🐃' },
    { value: 'goat', label: 'Goat / बकरी', icon: '🐐' },
    { value: 'sheep', label: 'Sheep / भेड़', icon: '🐑' },
    { value: 'dog', label: 'Dog / कुत्ता', icon: '🐕' },
    { value: 'cat', label: 'Cat / बिल्ली', icon: '🐈' },
    { value: 'horse', label: 'Horse / घोड़ा', icon: '🐴' },
    { value: 'poultry', label: 'Poultry / मुर्गी', icon: '🐔' },
    { value: 'other', label: 'Other / अन्य', icon: '🦎' },
  ];

  const urgencyLevels = [
    { value: 'normal', label: 'Normal', color: COLORS.primary },
    { value: 'urgent', label: 'Urgent', color: '#F59E0B' },
    { value: 'emergency', label: 'Emergency', color: COLORS.red },
  ];

  useEffect(() => {
    generateTimeSlots();
  }, [formData.date]);

  const generateTimeSlots = () => {
    const slots = [];
    const selectedDate = new Date(formData.date);
    const today = new Date();
    const isToday = selectedDate.toDateString() === today.toDateString();

    // Generate slots from 9 AM to 6 PM
    for (let hour = 9; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Skip past time slots if today
        if (isToday) {
          const slotTime = new Date(selectedDate);
          slotTime.setHours(hour, minute);
          if (slotTime <= today) {
            continue;
          }
        }

        slots.push({
          time,
          available: true, // In real app, check with backend
        });
      }
    }

    setTimeSlots(slots);
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData({ ...formData, date: selectedDate });
      setSelectedTimeSlot(null);
    }
  };

  const handleTimeSlotSelect = (slot) => {
    setSelectedTimeSlot(slot.time);
    setFormData({ ...formData, time: slot.time });
  };

  const validateForm = () => {
    if (!formData.animalType) {
      Alert.alert('Error', 'Please select animal type');
      return false;
    }
    if (!formData.animalName.trim()) {
      Alert.alert('Error', 'Please enter animal name');
      return false;
    }
    if (!selectedTimeSlot) {
      Alert.alert('Error', 'Please select a time slot');
      return false;
    }
    if (!formData.reason.trim()) {
      Alert.alert('Error', 'Please enter reason for visit');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const appointmentData = {
        veterinarian_id: veterinarian.id,
        appointment_date: formData.date.toISOString().split('T')[0],
        appointment_time: selectedTimeSlot,
        animal_type: formData.animalType,
        animal_name: formData.animalName,
        breed: formData.breed,
        age: formData.age,
        reason: formData.reason,
        symptoms: formData.symptoms,
        urgency: formData.urgency,
      };

      const response = await appointmentService.createAppointment(appointmentData);

      if (response.success) {
        Alert.alert(
          'Success',
          'Appointment booked successfully! The veterinarian will confirm shortly.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('MyAppointments'),
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        navigation={navigation}
        title={t('appointments.bookAppointment', { defaultValue: 'Book Appointment' })}
        subtitle={veterinarian?.full_name ? `Dr. ${veterinarian.full_name}` : undefined}
        variant="primary"
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Vet Info Card */}
        <View style={styles.vetCard}>
          <View style={styles.vetInfo}>
            <Text style={styles.vetName}>Dr. {veterinarian.full_name}</Text>
            <Text style={styles.vetSpec}>{veterinarian.specialization}</Text>
            <Text style={styles.vetFee}>Consultation Fee: ₹{veterinarian.consultation_fee}</Text>
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={24} color={COLORS.primary} />
            <Text style={styles.dateText}>
              {formData.date.toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={formData.date}
              mode="date"
              display="default"
              minimumDate={new Date()}
              maximumDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
              onChange={handleDateChange}
            />
          )}
        </View>

        {/* Time Slots */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Time</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.timeSlotsContainer}>
              {timeSlots.map((slot, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.timeSlot,
                    selectedTimeSlot === slot.time && styles.timeSlotSelected,
                    !slot.available && styles.timeSlotDisabled,
                  ]}
                  onPress={() => slot.available && handleTimeSlotSelect(slot)}
                  disabled={!slot.available}
                >
                  <Text
                    style={[
                      styles.timeSlotText,
                      selectedTimeSlot === slot.time && styles.timeSlotTextSelected,
                      !slot.available && styles.timeSlotTextDisabled,
                    ]}
                  >
                    {slot.time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Animal Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Animal Type *</Text>
          <View style={styles.animalTypesGrid}>
            {animalTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.animalTypeCard,
                  formData.animalType === type.value && styles.animalTypeCardSelected,
                ]}
                onPress={() => setFormData({ ...formData, animalType: type.value })}
              >
                <Text style={styles.animalTypeIcon}>{type.icon}</Text>
                <Text
                  style={[
                    styles.animalTypeLabel,
                    formData.animalType === type.value && styles.animalTypeLabelSelected,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Animal Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Animal Details *</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Animal Name *"
            placeholderTextColor={COLORS.gray}
            value={formData.animalName}
            onChangeText={(text) => setFormData({ ...formData, animalName: text })}
          />

          <TextInput
            style={styles.input}
            placeholder="Breed (Optional)"
            placeholderTextColor={COLORS.gray}
            value={formData.breed}
            onChangeText={(text) => setFormData({ ...formData, breed: text })}
          />

          <TextInput
            style={styles.input}
            placeholder="Age (Optional)"
            placeholderTextColor={COLORS.gray}
            value={formData.age}
            onChangeText={(text) => setFormData({ ...formData, age: text })}
          />
        </View>

        {/* Urgency */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Urgency Level</Text>
          <View style={styles.urgencyContainer}>
            {urgencyLevels.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.urgencyButton,
                  formData.urgency === level.value && {
                    backgroundColor: level.color + '20',
                    borderColor: level.color,
                  },
                ]}
                onPress={() => setFormData({ ...formData, urgency: level.value })}
              >
                <Text
                  style={[
                    styles.urgencyText,
                    formData.urgency === level.value && { color: level.color },
                  ]}
                >
                  {level.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Reason for Visit */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reason for Visit *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe the reason for this appointment..."
            placeholderTextColor={COLORS.gray}
            value={formData.reason}
            onChangeText={(text) => setFormData({ ...formData, reason: text })}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Symptoms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Symptoms (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="List any symptoms you've noticed..."
            placeholderTextColor={COLORS.gray}
            value={formData.symptoms}
            onChangeText={(text) => setFormData({ ...formData, symptoms: text })}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Book Button */}
        <TouchableOpacity
          style={[styles.bookButton, loading && styles.bookButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
              <Text style={styles.bookButtonText}>Book Appointment</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  vetCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vetInfo: {
    alignItems: 'center',
  },
  vetName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 4,
  },
  vetSpec: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 8,
  },
  vetFee: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  dateText: {
    fontSize: 16,
    color: COLORS.black,
    marginLeft: 12,
    fontWeight: '500',
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  timeSlot: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
    minWidth: 80,
    alignItems: 'center',
  },
  timeSlotSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timeSlotDisabled: {
    backgroundColor: COLORS.lightGray,
    opacity: 0.5,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.black,
  },
  timeSlotTextSelected: {
    color: COLORS.white,
  },
  timeSlotTextDisabled: {
    color: COLORS.gray,
  },
  animalTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  animalTypeCard: {
    width: '31%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.lightGray,
  },
  animalTypeCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  animalTypeIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  animalTypeLabel: {
    fontSize: 11,
    color: COLORS.gray,
    textAlign: 'center',
  },
  animalTypeLabelSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: COLORS.black,
    marginBottom: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  urgencyContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  urgencyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  urgencyText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray,
  },
  bookButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bookButtonDisabled: {
    opacity: 0.6,
  },
  bookButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AppointmentBookingScreen;
