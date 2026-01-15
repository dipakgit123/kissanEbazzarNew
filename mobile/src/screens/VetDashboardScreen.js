import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../utils/constants';
import { useVetAuth } from '../context/VetAuthContext';
import { veterinarianService } from '../services/api';

const { width } = Dimensions.get('window');

const VetDashboardScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { veterinarian, logout } = useVetAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    todayAppointments: 0,
    pendingAppointments: 0,
    totalEarnings: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await veterinarianService.getDashboard();
      if (response.success) {
        setStats(response.stats || stats);
        setRecentAppointments(response.recentAppointments || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const renderStatCard = (title, value, icon, color, onPress) => (
    <TouchableOpacity
      style={[styles.statCard, { borderLeftColor: color }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderAppointmentCard = (appointment) => (
    <TouchableOpacity
      key={appointment.id}
      style={styles.appointmentCard}
      onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: appointment.id })}
      activeOpacity={0.9}
    >
      <View style={styles.appointmentHeader}>
        <View style={styles.appointmentUser}>
          <View style={styles.appointmentAvatar}>
            <Ionicons name="person" size={20} color={COLORS.primary} />
          </View>
          <View style={styles.appointmentUserInfo}>
            <Text style={styles.appointmentUserName}>{appointment.userName || 'User'}</Text>
            <Text style={styles.appointmentPhone}>{appointment.userPhone}</Text>
          </View>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: appointment.status === 'pending' ? '#FEF3C7' : '#D1FAE5' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: appointment.status === 'pending' ? '#92400E' : '#065F46' }
          ]}>
            {appointment.status}
          </Text>
        </View>
      </View>
      
      <View style={styles.appointmentDetails}>
        <View style={styles.appointmentDetailRow}>
          <Ionicons name="calendar" size={16} color="#6B7280" />
          <Text style={styles.appointmentDetailText}>
            {new Date(appointment.date).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.appointmentDetailRow}>
          <Ionicons name="time" size={16} color="#6B7280" />
          <Text style={styles.appointmentDetailText}>{appointment.time}</Text>
        </View>
        <View style={styles.appointmentDetailRow}>
          <Ionicons name="paw" size={16} color="#6B7280" />
          <Text style={styles.appointmentDetailText}>{appointment.animalType}</Text>
        </View>
      </View>
      
      {appointment.reason && (
        <Text style={styles.appointmentReason} numberOfLines={2}>
          {appointment.reason}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={veterinarian?.profilePhoto ? { uri: veterinarian.profilePhoto } : require('../assets/veterinarian.png')}
            style={styles.profileImage}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.greeting}>{t('vetDashboard.welcomeBack')},</Text>
            <Text style={styles.doctorName}>Dr. {veterinarian?.fullName || t('vetDashboard.title')}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
          <View style={styles.notificationIcon}>
            <Ionicons name="notifications" size={24} color="#1F2937" />
            <View style={styles.notificationBadge} />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('vetDashboard.quickActions')}</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('Appointments')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="calendar" size={28} color="#1D4ED8" />
              </View>
              <Text style={styles.quickActionText}>{t('vetDashboard.appointments')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('VetProfile')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="person" size={28} color="#059669" />
              </View>
              <Text style={styles.quickActionText}>{t('vetDashboard.myProfile')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('CallHistory')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="call" size={28} color="#DC2626" />
              </View>
              <Text style={styles.quickActionText}>{t('vetDashboard.callHistory')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('Reports')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="document-text" size={28} color="#D97706" />
              </View>
              <Text style={styles.quickActionText}>{t('vetDashboard.reports')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('vetDashboard.statistics')}</Text>
          <View style={styles.statsGrid}>
            {renderStatCard(
              t('vetDashboard.totalAppointments'),
              stats.totalAppointments,
              'calendar-outline',
              '#3B82F6',
              () => navigation.navigate('Appointments')
            )}
            {renderStatCard(
              t('vetDashboard.todayAppointments'),
              stats.todayAppointments,
              'today-outline',
              '#10B981',
              () => navigation.navigate('Appointments', { filter: 'today' })
            )}
            {renderStatCard(
              t('vetDashboard.pending'),
              stats.pendingAppointments,
              'time-outline',
              '#F59E0B',
              () => navigation.navigate('Appointments', { filter: 'pending' })
            )}
            {renderStatCard(
              t('vetDashboard.totalEarnings'),
              `₹${stats.totalEarnings}`,
              'cash-outline',
              '#8B5CF6',
              () => navigation.navigate('Earnings')
            )}
          </View>
        </View>

        {/* Recent Appointments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('vetDashboard.recentAppointments')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Appointments')}>
              <Text style={styles.seeAllText}>{t('common.seeAll')}</Text>
            </TouchableOpacity>
          </View>

          {recentAppointments.length > 0 ? (
            recentAppointments.map(renderAppointmentCard)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyStateText}>{t('vetDashboard.noAppointments')}</Text>
            </View>
          )}
        </View>

        {/* Availability Status */}
        <View style={styles.section}>
          <View style={styles.availabilityCard}>
            <View style={styles.availabilityHeader}>
              <Ionicons name="time" size={24} color={COLORS.primary} />
              <Text style={styles.availabilityTitle}>{t('vetDashboard.availabilityStatus')}</Text>
            </View>
            <View style={styles.availabilityStatus}>
              <View style={styles.statusIndicator} />
              <Text style={styles.availabilityText}>
                {veterinarian?.emergencyAvailable ? t('veterinarian.emergencyAvailable') : t('vetDashboard.regularHours')}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.updateButton}
              onPress={() => navigation.navigate('VetProfile')}
            >
              <Text style={styles.updateButtonText}>{t('vetDashboard.updateAvailability')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>{t('common.logout')}</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  headerInfo: {
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 14,
    color: '#6B7280',
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  notificationIcon: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#fff',
  },
  content: {
    flex: 1,
  },
  section: {
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
    color: '#1F2937',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: (width - 60) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 60) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  appointmentUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appointmentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  appointmentUserInfo: {
    flex: 1,
  },
  appointmentUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  appointmentPhone: {
    fontSize: 13,
    color: '#6B7280',
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
  appointmentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  appointmentDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentDetailText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 4,
  },
  appointmentReason: {
    fontSize: 13,
    color: '#374151',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
  },
  availabilityCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  availabilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  availabilityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 10,
  },
  availabilityStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  availabilityText: {
    fontSize: 14,
    color: '#6B7280',
  },
  updateButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  updateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
});

export default VetDashboardScreen;
