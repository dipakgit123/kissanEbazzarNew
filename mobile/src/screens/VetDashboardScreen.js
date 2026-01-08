import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import { useVetAuth } from '../context/VetAuthContext';

const { width } = Dimensions.get('window');

const VetDashboardScreen = ({ navigation }) => {
  const { veterinarian, logout } = useVetAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Refresh data here
    setTimeout(() => setRefreshing(false), 1000);
  };

  const formatSpecialization = (spec) => {
    if (!spec) return '';
    return spec
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getVerificationBadge = () => {
    const status = veterinarian?.verification_status;
    switch (status) {
      case 'verified':
        return { color: '#10B981', bg: '#ECFDF5', text: 'Verified' };
      case 'pending':
        return { color: '#F59E0B', bg: '#FFFBEB', text: 'Pending' };
      case 'rejected':
        return { color: '#EF4444', bg: '#FEF2F2', text: 'Rejected' };
      default:
        return { color: COLORS.gray, bg: '#F1F5F9', text: 'Unknown' };
    }
  };

  const stats = [
    {
      icon: 'people',
      label: 'Total Patients',
      value: veterinarian?.total_patients || 0,
      color: '#3B82F6',
      bg: '#EFF6FF',
    },
    {
      icon: 'calendar',
      label: "Today's Appointments",
      value: 0,
      color: '#10B981',
      bg: '#ECFDF5',
    },
    {
      icon: 'star',
      label: 'Rating',
      value: parseFloat(veterinarian?.rating || 0).toFixed(1),
      color: '#F59E0B',
      bg: '#FFFBEB',
    },
    {
      icon: 'chatbubbles',
      label: 'Total Reviews',
      value: veterinarian?.total_reviews || 0,
      color: '#8B5CF6',
      bg: '#F5F3FF',
    },
  ];

  const menuItems = [
    { icon: 'grid', label: 'Dashboard', tab: 'dashboard' },
    { icon: 'person', label: 'Profile', tab: 'profile' },
    { icon: 'calendar', label: 'Appointments', tab: 'appointments' },
    { icon: 'settings', label: 'Settings', tab: 'settings' },
  ];

  const handleLogout = () => {
    logout();
  };

  const badge = getVerificationBadge();

  const renderDashboard = () => (
    <View style={styles.tabContent}>
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <View key={index} style={[styles.statCard, { backgroundColor: stat.bg }]}>
            <View style={[styles.statIcon, { backgroundColor: stat.color }]}>
              <Ionicons name={stat.icon} size={20} color={COLORS.white} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Quick Info Cards */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Profile Summary</Text>
        <View style={styles.infoCard}>
          <InfoRow label="Specialization" value={formatSpecialization(veterinarian?.specialization)} />
          <InfoRow label="Experience" value={`${veterinarian?.experience_years || 0} years`} />
          <InfoRow label="Qualification" value={veterinarian?.qualification || 'N/A'} />
          <InfoRow label="Consultation Fee" value={`Rs. ${veterinarian?.consultation_fee || 0}`} />
          <InfoRow
            label="Emergency Available"
            value={veterinarian?.emergency_available ? 'Yes' : 'No'}
            valueColor={veterinarian?.emergency_available ? '#10B981' : '#EF4444'}
          />
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Clinic Information</Text>
        <View style={styles.infoCard}>
          <InfoRow label="Clinic Name" value={veterinarian?.clinic_name || 'N/A'} />
          <InfoRow label="City" value={veterinarian?.city || 'N/A'} />
          <InfoRow label="State" value={veterinarian?.state || 'N/A'} />
          <InfoRow label="Pincode" value={veterinarian?.pincode || 'N/A'} />
          <InfoRow label="Phone" value={veterinarian?.phone_number || 'N/A'} />
        </View>
      </View>

      {/* Coming Soon Banner */}
      <View style={styles.comingSoonBanner}>
        <Ionicons name="rocket" size={24} color={COLORS.white} />
        <View style={styles.comingSoonContent}>
          <Text style={styles.comingSoonTitle}>Coming Soon!</Text>
          <Text style={styles.comingSoonText}>
            Appointment booking, patient records, and more features are on the way.
          </Text>
        </View>
      </View>
    </View>
  );

  const renderProfile = () => (
    <View style={styles.tabContent}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.profileAvatar}>
          {veterinarian?.profile_photo ? (
            <Image source={{ uri: veterinarian.profile_photo }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>
              {veterinarian?.full_name?.charAt(0) || 'V'}
            </Text>
          )}
        </View>
        <Text style={styles.profileName}>Dr. {veterinarian?.full_name}</Text>
        <Text style={styles.profileEmail}>{veterinarian?.email}</Text>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Ionicons
            name={badge.text === 'Verified' ? 'checkmark-circle' : 'time'}
            size={14}
            color={badge.color}
          />
          <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
        </View>
      </View>

      {/* Profile Details */}
      <View style={styles.profileDetails}>
        <ProfileField icon="call" label="Phone" value={veterinarian?.phone_number} />
        <ProfileField icon="mail" label="Email" value={veterinarian?.email} />
        <ProfileField icon="school" label="Qualification" value={veterinarian?.qualification} />
        <ProfileField icon="document-text" label="License" value={veterinarian?.license_number} />
        <ProfileField icon="medical" label="Specialization" value={formatSpecialization(veterinarian?.specialization)} />
        <ProfileField icon="calendar" label="Experience" value={`${veterinarian?.experience_years} years`} />
        <ProfileField icon="cash" label="Consultation Fee" value={`Rs. ${veterinarian?.consultation_fee}`} />
        <ProfileField icon="location" label="Clinic" value={veterinarian?.clinic_name} />
        <ProfileField
          icon="navigate"
          label="Address"
          value={`${veterinarian?.city}, ${veterinarian?.state} - ${veterinarian?.pincode}`}
        />
      </View>

      {/* Services */}
      {veterinarian?.services && veterinarian.services.length > 0 && (
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Services Offered</Text>
          <View style={styles.servicesGrid}>
            {veterinarian.services.map((service, index) => (
              <View key={index} style={styles.serviceChip}>
                <Text style={styles.serviceChipText}>{service}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  const renderAppointments = () => (
    <View style={styles.tabContent}>
      <View style={styles.emptyState}>
        <Ionicons name="calendar-outline" size={64} color="#CBD5E1" />
        <Text style={styles.emptyTitle}>No Appointments Yet</Text>
        <Text style={styles.emptyText}>
          Appointment booking feature is coming soon!
        </Text>
      </View>
    </View>
  );

  const renderSettings = () => (
    <View style={styles.tabContent}>
      <View style={styles.settingsSection}>
        <TouchableOpacity style={styles.settingsItem}>
          <View style={styles.settingsItemLeft}>
            <Ionicons name="notifications-outline" size={22} color="#3B82F6" />
            <Text style={styles.settingsItemText}>Notifications</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsItem}>
          <View style={styles.settingsItemLeft}>
            <Ionicons name="lock-closed-outline" size={22} color="#3B82F6" />
            <Text style={styles.settingsItemText}>Change Password</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsItem}>
          <View style={styles.settingsItemLeft}>
            <Ionicons name="help-circle-outline" size={22} color="#3B82F6" />
            <Text style={styles.settingsItemText}>Help & Support</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsItem}>
          <View style={styles.settingsItemLeft}>
            <Ionicons name="document-text-outline" size={22} color="#3B82F6" />
            <Text style={styles.settingsItemText}>Terms & Conditions</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.settingsItem, styles.logoutItem]} onPress={handleLogout}>
          <View style={styles.settingsItemLeft}>
            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            <Text style={[styles.settingsItemText, { color: '#EF4444' }]}>Logout</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <View style={styles.smallAvatar}>
              {veterinarian?.profile_photo ? (
                <Image source={{ uri: veterinarian.profile_photo }} style={styles.smallAvatarImage} />
              ) : (
                <Text style={styles.smallAvatarText}>
                  {veterinarian?.full_name?.charAt(0) || 'V'}
                </Text>
              )}
            </View>
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.headerName}>Dr. {veterinarian?.full_name}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={24} color={COLORS.black} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.tab}
            style={[styles.tabItem, activeTab === item.tab && styles.tabItemActive]}
            onPress={() => setActiveTab(item.tab)}
          >
            <Ionicons
              name={item.icon}
              size={22}
              color={activeTab === item.tab ? '#3B82F6' : COLORS.gray}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === item.tab && styles.tabLabelActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'profile' && renderProfile()}
        {activeTab === 'appointments' && renderAppointments()}
        {activeTab === 'settings' && renderSettings()}
      </ScrollView>
    </View>
  );
};

// Helper Components
const InfoRow = ({ label, value, valueColor }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, valueColor && { color: valueColor }]}>{value}</Text>
  </View>
);

const ProfileField = ({ icon, label, value }) => (
  <View style={styles.profileField}>
    <View style={styles.profileFieldIcon}>
      <Ionicons name={icon} size={20} color="#3B82F6" />
    </View>
    <View style={styles.profileFieldContent}>
      <Text style={styles.profileFieldLabel}>{label}</Text>
      <Text style={styles.profileFieldValue}>{value || 'N/A'}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: COLORS.white,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  smallAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  smallAvatarImage: {
    width: '100%',
    height: '100%',
  },
  smallAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  welcomeText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
  },
  notificationBtn: {
    padding: 8,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: '#EFF6FF',
  },
  tabLabel: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  tabContent: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: (width - 52) / 2,
    borderRadius: 16,
    padding: 16,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
  },
  infoSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.black,
  },
  comingSoonBanner: {
    flexDirection: 'row',
    backgroundColor: 'linear-gradient(135deg, #3B82F6, #6366F1)',
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 16,
  },
  comingSoonContent: {
    flex: 1,
  },
  comingSoonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 4,
  },
  comingSoonText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 18,
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  profileDetails: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  profileField: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  profileFieldIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileFieldContent: {
    flex: 1,
  },
  profileFieldLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 2,
  },
  profileFieldValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.black,
  },
  servicesSection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  serviceChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  serviceChipText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
  },
  settingsSection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsItemText: {
    fontSize: 15,
    color: COLORS.black,
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
});

export default VetDashboardScreen;
