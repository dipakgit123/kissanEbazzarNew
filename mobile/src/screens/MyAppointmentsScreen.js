import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../utils/constants';
import { appointmentService } from '../services/api';
import CowLoader from '../components/CowLoader';
import AppHeader from '../components/AppHeader';

const MyAppointmentsScreen = ({ navigation }) => {
  const { t, ready } = useTranslation();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, upcoming, past, cancelled

  // Show loading while translations are loading
  if (!ready) {
    return (
      <View style={styles.loadingContainer}>
        <CowLoader message="" size="large" />
      </View>
    );
  }

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  const fetchAppointments = async () => {
    try {
      const response = await appointmentService.getMyAppointments(filter);
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

  const handleCancelAppointment = (appointmentId) => {
    Alert.alert(
      t('appointments.cancelAppointment'),
      t('appointments.cancelConfirm'),
      [
        { text: t('common.no'), style: 'cancel' },
        {
          text: t('appointments.yesCancelIt'),
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await appointmentService.cancelAppointment(appointmentId);
              if (response.success) {
                Alert.alert(t('common.success'), t('appointments.cancelSuccess'));
                fetchAppointments();
              }
            } catch (error) {
              Alert.alert(t('common.error'), t('appointments.cancelError'));
            }
          },
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return 'time-outline';
      case 'confirmed':
        return 'checkmark-circle-outline';
      case 'completed':
        return 'checkmark-done-circle-outline';
      case 'cancelled':
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const renderAppointmentCard = (appointment) => {
    const statusColor = getStatusColor(appointment.status);
    const statusIcon = getStatusIcon(appointment.status);

    return (
      <TouchableOpacity
        key={appointment.id}
        style={styles.appointmentCard}
        onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: appointment.id })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.vetInfo}>
            <Text style={styles.vetName}>{t('appointments.doctor')} {appointment.veterinarian?.full_name}</Text>
            <Text style={styles.vetSpec}>{appointment.veterinarian?.specialization}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Ionicons name={statusIcon} size={16} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {t(`appointments.${appointment.status}`)}
            </Text>
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
                year: 'numeric',
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

          {appointment.reason && (
            <View style={styles.reasonContainer}>
              <Text style={styles.reasonLabel}>{t('appointments.reason')}:</Text>
              <Text style={styles.reasonText} numberOfLines={2}>
                {appointment.reason}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('VetDetail', { vetId: appointment.veterinarian_id })}
          >
            <Ionicons name="eye-outline" size={18} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>{t('appointments.viewVet')}</Text>
          </TouchableOpacity>

          {appointment.status === 'pending' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleCancelAppointment(appointment.id)}
            >
              <Ionicons name="close-circle-outline" size={18} color={COLORS.red} />
              <Text style={[styles.actionButtonText, { color: COLORS.red }]}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const filterButtons = [
    { key: 'all', label: t('appointments.all'), icon: 'list-outline' },
    { key: 'upcoming', label: t('appointments.upcoming'), icon: 'arrow-up-outline' },
    { key: 'past', label: t('appointments.past'), icon: 'time-outline' },
    { key: 'cancelled', label: t('appointments.cancelled'), icon: 'close-circle-outline' },
  ];

  return (
    <View style={styles.container}>
      <AppHeader
        navigation={navigation}
        title={t('appointments.title')}
        variant="primary"
      />

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
          <CowLoader message={t('appointments.loadingAppointments')} size="medium" />
        </View>
      ) : appointments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={80} color={COLORS.gray} />
          <Text style={styles.emptyTitle}>{t('appointments.noAppointments')}</Text>
          <Text style={styles.emptyText}>
            {filter === 'all'
              ? t('appointments.noAppointmentsAll')
              : t('appointments.noAppointmentsFiltered', { filter })}
          </Text>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => navigation.navigate('Veterinarian')}
          >
            <Text style={styles.bookButtonText}>{t('appointments.findVeterinarian')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.appointmentsList}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
  bookButton: {
    marginTop: 24,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  bookButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
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
  vetInfo: {
    flex: 1,
  },
  vetName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  vetSpec: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
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
    marginTop: 8,
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray,
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 13,
    color: COLORS.black,
  },
  cardFooter: {
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
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.primary + '15',
    gap: 6,
  },
  cancelButton: {
    backgroundColor: COLORS.red + '15',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
  },
});

export default MyAppointmentsScreen;
