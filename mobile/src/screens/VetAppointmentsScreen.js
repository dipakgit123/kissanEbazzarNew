import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../utils/constants';
import { appointmentService } from '../services/api';

const VetAppointmentsScreen = ({ navigation }) => {
  const { t, ready } = useTranslation();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('pending'); // pending, confirmed, completed, cancelled, all

  // Show loading while translations are loading
  if (!ready) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  const fetchAppointments = async () => {
    try {
      const response = await appointmentService.getVetAppointments(filter);
      if (response.success) {
        // Ensure we always set an array
        const appointmentsData = Array.isArray(response.data) ? response.data : [];
        setAppointments(appointmentsData);
      } else {
        setAppointments([]);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const handleUpdateStatus = async (appointmentId, newStatus) => {
    try {
      const response = await appointmentService.updateAppointmentStatus(appointmentId, newStatus);
      if (response.success) {
        Alert.alert('Success', `Appointment ${newStatus} successfully`);
        fetchAppointments();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update appointment status');
    }
  };

  const confirmStatusChange = (appointment, newStatus) => {
    const messages = {
      confirmed: 'Are you sure you want to confirm this appointment?',
      completed: 'Mark this appointment as completed?',
      cancelled: 'Are you sure you want to cancel this appointment?',
    };

    Alert.alert(
      'Confirm Action',
      messages[newStatus],
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: () => handleUpdateStatus(appointment.id, newStatus),
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'confirmed':
        return '#10B981';
      case 'completed':
        return '#3B82F6';
      case 'cancelled':
        return COLORS.red;
      default:
        return COLORS.gray;
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'emergency':
        return COLORS.red;
      case 'urgent':
        return '#F59E0B';
      default:
        return COLORS.primary;
    }
  };

  const renderAppointmentCard = (appointment) => {
    const statusColor = getStatusColor(appointment.status);
    const urgencyColor = getUrgencyColor(appointment.urgency);

    return (
      <View key={appointment.id} style={styles.appointmentCard}>
        <View style={styles.cardHeader}>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{appointment.user?.fullname || 'Patient'}</Text>
            <Text style={styles.patientPhone}>{appointment.user?.phone_number}</Text>
          </View>
          <View style={styles.badgesContainer}>
            {appointment.urgency !== 'normal' && (
              <View style={[styles.urgencyBadge, { backgroundColor: urgencyColor + '20' }]}>
                <Ionicons name="alert-circle" size={12} color={urgencyColor} />
                <Text style={[styles.urgencyText, { color: urgencyColor }]}>
                  {appointment.urgency}
                </Text>
              </View>
            )}
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {appointment.status}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={18} color={COLORS.gray} />
            <Text style={styles.detailText}>
              {new Date(appointment.appointment_date).toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={18} color={COLORS.gray} />
            <Text style={styles.detailText}>{appointment.appointment_time}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="paw-outline" size={18} color={COLORS.gray} />
            <Text style={styles.detailText}>
              {appointment.animal_name} ({appointment.animal_type})
            </Text>
          </View>

          {appointment.breed && (
            <View style={styles.detailRow}>
              <Ionicons name="information-circle-outline" size={18} color={COLORS.gray} />
              <Text style={styles.detailText}>Breed: {appointment.breed}</Text>
            </View>
          )}

          {appointment.age && (
            <View style={styles.detailRow}>
              <Ionicons name="hourglass-outline" size={18} color={COLORS.gray} />
              <Text style={styles.detailText}>Age: {appointment.age}</Text>
            </View>
          )}
        </View>

        {appointment.reason && (
          <View style={styles.reasonContainer}>
            <Text style={styles.reasonLabel}>Reason:</Text>
            <Text style={styles.reasonText}>{appointment.reason}</Text>
          </View>
        )}

        {appointment.symptoms && (
          <View style={styles.symptomsContainer}>
            <Text style={styles.symptomsLabel}>Symptoms:</Text>
            <Text style={styles.symptomsText}>{appointment.symptoms}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {appointment.status === 'pending' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.confirmButton]}
                onPress={() => confirmStatusChange(appointment, 'confirmed')}
              >
                <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                <Text style={styles.actionButtonText}>Confirm</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => confirmStatusChange(appointment, 'cancelled')}
              >
                <Ionicons name="close-circle" size={20} color={COLORS.white} />
                <Text style={styles.actionButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}

          {appointment.status === 'confirmed' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => confirmStatusChange(appointment, 'completed')}
            >
              <Ionicons name="checkmark-done-circle" size={20} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Mark Completed</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.callButton]}
            onPress={() => {
              // Log call and open dialer
              const phoneNumber = appointment.user?.phone_number;
              if (phoneNumber) {
                Linking.openURL(`tel:${phoneNumber}`);
              }
            }}
          >
            <Ionicons name="call" size={20} color={COLORS.white} />
            <Text style={styles.actionButtonText}>Call</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const filterButtons = [
    { key: 'pending', label: 'Pending', icon: 'time-outline', count: 0 },
    { key: 'confirmed', label: 'Confirmed', icon: 'checkmark-circle-outline', count: 0 },
    { key: 'completed', label: 'Completed', icon: 'checkmark-done-outline', count: 0 },
    { key: 'all', label: 'All', icon: 'list-outline', count: 0 },
  ];

  const getFilterCount = (key) => {
    if (!Array.isArray(appointments)) return 0;
    if (key === 'all') return appointments.length;
    return appointments.filter((apt) => apt.status === key).length;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointments</Text>
        <View style={{ width: 24 }} />{/* Placeholder for alignment - VetCalendar screen not yet implemented */}
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{Array.isArray(appointments) ? appointments.filter(a => a.status === 'pending').length : 0}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{Array.isArray(appointments) ? appointments.filter(a => a.status === 'confirmed').length : 0}</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{Array.isArray(appointments) ? appointments.filter(a => a.urgency === 'emergency').length : 0}</Text>
          <Text style={[styles.statLabel, { color: COLORS.red }]}>Emergency</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filterButtons.map((btn) => (
            <TouchableOpacity
              key={btn.key}
              style={[styles.filterButton, filter === btn.key && styles.filterButtonActive]}
              onPress={() => setFilter(btn.key)}
            >
              <Ionicons
                name={btn.icon}
                size={18}
                color={filter === btn.key ? COLORS.white : COLORS.primary}
              />
              <Text
                style={[
                  styles.filterButtonText,
                  filter === btn.key && styles.filterButtonTextActive,
                ]}
              >
                {btn.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading appointments...</Text>
        </View>
      ) : appointments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={80} color={COLORS.gray} />
          <Text style={styles.emptyTitle}>No Appointments</Text>
          <Text style={styles.emptyText}>
            {filter === 'all'
              ? 'No appointments scheduled yet'
              : `No ${filter} appointments found`}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.appointmentsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
        >
          {Array.isArray(appointments) && appointments.map(renderAppointmentCard)}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}
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
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  filterContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '15',
    marginRight: 8,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.gray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 8,
  },
  appointmentsList: {
    flex: 1,
    padding: 16,
  },
  appointmentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  patientPhone: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 2,
  },
  badgesContainer: {
    gap: 4,
    alignItems: 'flex-end',
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  cardBody: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.black,
  },
  reasonContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 8,
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 13,
    color: COLORS.black,
  },
  symptomsContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  symptomsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  symptomsText: {
    fontSize: 13,
    color: COLORS.black,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  confirmButton: {
    backgroundColor: '#10B981',
  },
  cancelButton: {
    backgroundColor: COLORS.red,
  },
  completeButton: {
    backgroundColor: '#3B82F6',
  },
  callButton: {
    backgroundColor: '#8B5CF6',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default VetAppointmentsScreen;
