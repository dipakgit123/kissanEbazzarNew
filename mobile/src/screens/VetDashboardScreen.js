import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../utils/constants';
import { useVetAuth } from '../context/VetAuthContext';
import { veterinarianService } from '../services/api';
import SkeletonLoader from '../components/SkeletonLoader';
import AppHeader from '../components/AppHeader';

const localeMap = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
};

const LEAD_COLORS = {
  profile_view: COLORS.blue,
  whatsapp_click: '#10B981',
  call_click: '#F59E0B',
};

const EMPTY_DASHBOARD = {
  profile: null,
  summary: {
    profileViews: 0,
    whatsappClicks: 0,
    callClicks: 0,
    totalLeads: 0,
    averageRating: 0,
    totalReviews: 0,
    profileCompletion: 0,
    last30DaysViews: 0,
    last30DaysLeads: 0,
  },
  charts: {
    activityTrend: [],
    leadSourceBreakdown: [],
  },
  recentLeads: [],
  latestReview: null,
};

const formatSpecialization = (t, value) => {
  const map = {
    general: t('vetDashboard.specializationGeneral', { defaultValue: 'General' }),
    large_animal: t('vetDashboard.specializationLargeAnimal', { defaultValue: 'Large Animal' }),
    small_animal: t('vetDashboard.specializationSmallAnimal', { defaultValue: 'Small Animal' }),
    livestock: t('vetDashboard.specializationLivestock', { defaultValue: 'Livestock' }),
    surgery: t('vetDashboard.specializationSurgery', { defaultValue: 'Surgery' }),
    emergency: t('vetDashboard.specializationEmergency', { defaultValue: 'Emergency' }),
    reproduction: t('vetDashboard.specializationReproduction', { defaultValue: 'Reproduction' }),
  };

  return map[value] || value || t('vetDashboard.notAvailable', { defaultValue: 'N/A' });
};

const formatService = (t, service) => {
  const map = {
    checkup: t('vetDashboard.serviceCheckup', { defaultValue: 'Checkup' }),
    vaccination: t('vetDashboard.serviceVaccination', { defaultValue: 'Vaccination' }),
    surgery: t('vetDashboard.serviceSurgery', { defaultValue: 'Surgery' }),
    emergency: t('vetDashboard.serviceEmergency', { defaultValue: 'Emergency' }),
    pregnancy: t('vetDashboard.servicePregnancy', { defaultValue: 'Pregnancy' }),
    dental: t('vetDashboard.serviceDental', { defaultValue: 'Dental' }),
    deworming: t('vetDashboard.serviceDeworming', { defaultValue: 'Deworming' }),
    artificial_insemination: t('vetDashboard.serviceArtificialInsemination', { defaultValue: 'Artificial Insemination' }),
  };

  return map[service] || service;
};

const leadTypeLabel = (t, leadType) => {
  const map = {
    profile_view: t('vetDashboard.profileViews', { defaultValue: 'Profile Views' }),
    whatsapp_click: t('vetDashboard.whatsappLeads', { defaultValue: 'WhatsApp Leads' }),
    call_click: t('vetDashboard.callLeads', { defaultValue: 'Call Leads' }),
  };

  return map[leadType] || leadType || t('vetDashboard.totalLeads', { defaultValue: 'Total Leads' });
};

const getProfilePhoto = (profile) => profile?.profile_photo || profile?.profilePhoto || null;

const VetDashboardScreen = ({ navigation }) => {
  const { t, i18n, ready } = useTranslation();
  const { veterinarian, logout, updateVeterinarian } = useVetAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(EMPTY_DASHBOARD);

  const profile = dashboardData.profile || veterinarian || {};
  const summary = dashboardData.summary || EMPTY_DASHBOARD.summary;
  const profileCompletion = Number(summary.profileCompletion || profile.profile_completion || 0);
  const locale = localeMap[(i18n.resolvedLanguage || i18n.language || 'en').slice(0, 2)] || 'en-IN';

  const loadDashboard = async ({ showLoader = true } = {}) => {
    if (showLoader) {
      setLoading(true);
    }

    try {
      const response = await veterinarianService.getDashboard();
      const payload = response?.data || EMPTY_DASHBOARD;
      const nextProfile = payload.profile || veterinarian || null;

      setDashboardData({
        profile: nextProfile,
        summary: {
          ...EMPTY_DASHBOARD.summary,
          ...(payload.summary || {}),
        },
        charts: {
          ...EMPTY_DASHBOARD.charts,
          ...(payload.charts || {}),
        },
        recentLeads: Array.isArray(payload.recentLeads) ? payload.recentLeads : [],
        latestReview: payload.latestReview || null,
      });

      if (nextProfile && updateVeterinarian) {
        await updateVeterinarian(nextProfile);
      }
    } catch (error) {
      console.error('Error fetching veterinarian dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard({ showLoader: false });
  };

  const formatDate = (value) => {
    if (!value) {
      return t('vetDashboard.notAvailable', { defaultValue: 'N/A' });
    }

    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  };

  const formatDateTime = (value) => {
    if (!value) {
      return t('vetDashboard.notAvailable', { defaultValue: 'N/A' });
    }

    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));
  };

  const activityTrend = useMemo(() => (
    (dashboardData.charts.activityTrend || []).map((item) => ({
      day: item.dayKey
        ? new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(`${item.dayKey}T00:00:00`))
        : '',
      profileViews: Number(item.profileViews || 0),
      whatsappClicks: Number(item.whatsappClicks || 0),
      callClicks: Number(item.callClicks || 0),
    }))
  ), [dashboardData.charts.activityTrend, locale]);

  const leadSourceData = useMemo(() => (
    (dashboardData.charts.leadSourceBreakdown || []).map((item) => ({
      label: leadTypeLabel(t, item.leadType),
      value: Number(item.value || 0),
      color: LEAD_COLORS[item.leadType] || COLORS.textMuted,
    }))
  ), [dashboardData.charts.leadSourceBreakdown, t]);

  const maxTrendValue = Math.max(
    1,
    ...activityTrend.map((item) => item.profileViews + item.whatsappClicks + item.callClicks)
  );
  const totalLeadSource = Math.max(1, leadSourceData.reduce((sum, item) => sum + item.value, 0));

  const tabs = [
    { id: 'dashboard', label: t('vetDashboard.dashboard', { defaultValue: 'Dashboard' }), icon: 'grid-outline' },
    { id: 'profile', label: t('vetDashboard.myProfile', { defaultValue: 'My Profile' }), icon: 'person-outline' },
    { id: 'reviews', label: t('vetDashboard.reviews', { defaultValue: 'Reviews' }), icon: 'star-outline' },
    { id: 'settings', label: t('vetDashboard.settings', { defaultValue: 'Settings' }), icon: 'settings-outline' },
  ];

  const statCards = [
    {
      id: 'views',
      label: t('vetDashboard.profileViews', { defaultValue: 'Profile Views' }),
      value: summary.profileViews,
      helper: t('vetDashboard.last30DaysViewsHelper', {
        defaultValue: '{{count}} in last 30 days',
        count: summary.last30DaysViews,
      }),
      icon: 'eye-outline',
      color: COLORS.blue,
    },
    {
      id: 'whatsapp',
      label: t('vetDashboard.whatsappLeads', { defaultValue: 'WhatsApp Leads' }),
      value: summary.whatsappClicks,
      helper: t('vetDashboard.totalLeadsHelper', {
        defaultValue: '{{count}} total direct leads',
        count: summary.totalLeads,
      }),
      icon: 'logo-whatsapp',
      color: '#10B981',
    },
    {
      id: 'calls',
      label: t('vetDashboard.callLeads', { defaultValue: 'Call Leads' }),
      value: summary.callClicks,
      helper: t('vetDashboard.last30DaysLeadsHelper', {
        defaultValue: '{{count}} direct leads in last 30 days',
        count: summary.last30DaysLeads,
      }),
      icon: 'call-outline',
      color: '#F59E0B',
    },
    {
      id: 'reviews',
      label: t('vetDashboard.totalReviews', { defaultValue: 'Total Reviews' }),
      value: summary.totalReviews,
      helper: `${Number(summary.averageRating || 0).toFixed(1)} ${t('vetDashboard.averageRating', { defaultValue: 'Average Rating' })}`,
      icon: 'star-outline',
      color: '#8B5CF6',
    },
  ];

  const renderStars = (rating) => {
    const normalized = Math.round(Number(rating || 0));
    return (
      <View style={styles.starRow}>
        {Array.from({ length: 5 }, (_, index) => (
          <Ionicons
            key={index}
            name={index + 1 <= normalized ? 'star' : 'star-outline'}
            size={15}
            color="#FBBF24"
          />
        ))}
      </View>
    );
  };

  const renderStatCard = (item) => (
    <View key={item.id} style={[styles.statCard, { borderColor: `${item.color}35` }]}>
      <View style={[styles.statIcon, { backgroundColor: `${item.color}18` }]}>
        <Ionicons name={item.icon} size={22} color={item.color} />
      </View>
      <Text style={styles.statValue}>{item.value}</Text>
      <Text style={styles.statLabel}>{item.label}</Text>
      <Text style={styles.statHelper}>{item.helper}</Text>
    </View>
  );

  const renderProfileHero = () => (
    <View style={styles.heroCard}>
      <View style={styles.heroTop}>
        <View style={styles.heroAvatarWrap}>
          {getProfilePhoto(profile) ? (
            <Image source={{ uri: getProfilePhoto(profile) }} style={styles.heroAvatar} />
          ) : (
            <Text style={styles.heroAvatarText}>{profile?.full_name?.charAt(0) || 'V'}</Text>
          )}
        </View>
        <View style={styles.heroInfo}>
          <Text style={styles.doctorName} numberOfLines={1}>
            {t('vetDashboard.doctorPrefix', { defaultValue: 'Dr.' })} {profile?.full_name || t('vetDashboard.veterinarian', { defaultValue: 'Veterinarian' })}
          </Text>
          <Text style={styles.doctorMeta} numberOfLines={1}>
            {formatSpecialization(t, profile?.specialization)}
          </Text>
          <View style={styles.verifiedPill}>
            <Ionicons name="shield-checkmark-outline" size={14} color={COLORS.primaryDark} />
            <Text style={styles.verifiedText}>{t('vetDashboard.verified', { defaultValue: 'Verified' })}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditVetProfile')}>
          <Ionicons name="create-outline" size={18} color={COLORS.primaryDark} />
        </TouchableOpacity>
      </View>

      <View style={styles.completionHeader}>
        <Text style={styles.completionLabel}>{t('vetDashboard.profileCompletion', { defaultValue: 'Profile Completion' })}</Text>
        <Text style={styles.completionValue}>{profileCompletion}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.min(100, profileCompletion)}%` }]} />
      </View>
    </View>
  );

  const renderDashboardTab = () => (
    <>
      <View style={styles.statsGrid}>
        {statCards.map(renderStatCard)}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>{t('vetDashboard.leadActivity', { defaultValue: 'Lead Activity' })}</Text>
            <Text style={styles.cardSubtitle}>{t('vetDashboard.last7Days', { defaultValue: 'Last 7 days of profile visits and direct contact clicks' })}</Text>
          </View>
        </View>

        {activityTrend.length > 0 ? (
          <View style={styles.trendChart}>
            {activityTrend.map((item, index) => {
              const total = item.profileViews + item.whatsappClicks + item.callClicks;
              const height = Math.max(8, (total / maxTrendValue) * 96);
              return (
                <View key={`${item.day}-${index}`} style={styles.trendItem}>
                  <View style={styles.trendBarTrack}>
                    <View style={[styles.trendBar, { height }]}>
                      <View style={[styles.trendSegment, { flex: item.profileViews || 0.1, backgroundColor: COLORS.blue }]} />
                      <View style={[styles.trendSegment, { flex: item.whatsappClicks || 0.1, backgroundColor: '#10B981' }]} />
                      <View style={[styles.trendSegment, { flex: item.callClicks || 0.1, backgroundColor: '#F59E0B' }]} />
                    </View>
                  </View>
                  <Text style={styles.trendDay}>{item.day}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.emptyText}>{t('vetDashboard.noLeadData', { defaultValue: 'No lead activity yet' })}</Text>
        )}

        <View style={styles.legendRow}>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: COLORS.blue }]} /><Text style={styles.legendText}>{t('vetDashboard.profileViews', { defaultValue: 'Profile Views' })}</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#10B981' }]} /><Text style={styles.legendText}>{t('vetDashboard.whatsappLeads', { defaultValue: 'WhatsApp Leads' })}</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} /><Text style={styles.legendText}>{t('vetDashboard.callLeads', { defaultValue: 'Call Leads' })}</Text></View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('vetDashboard.leadSourceBreakdown', { defaultValue: 'Lead Source Breakdown' })}</Text>
        <Text style={styles.cardSubtitle}>{t('vetDashboard.allTimeLeadMix', { defaultValue: 'All-time mix of profile views and direct contact clicks' })}</Text>
        {leadSourceData.length > 0 ? (
          <View style={styles.sourceList}>
            {leadSourceData.map((item) => (
              <View key={item.label} style={styles.sourceRow}>
                <View style={styles.sourceLabelRow}>
                  <Text style={styles.sourceLabel}>{item.label}</Text>
                  <Text style={styles.sourceValue}>{item.value}</Text>
                </View>
                <View style={styles.sourceTrack}>
                  <View style={[styles.sourceFill, { width: `${(item.value / totalLeadSource) * 100}%`, backgroundColor: item.color }]} />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>{t('vetDashboard.noLeadData', { defaultValue: 'No lead activity yet' })}</Text>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>{t('vetDashboard.recentLeads', { defaultValue: 'Recent Leads' })}</Text>
            <Text style={styles.cardSubtitle}>{t('vetDashboard.recentLeadsDesc', { defaultValue: 'Latest direct contact clicks from farmers and visitors' })}</Text>
          </View>
          <View style={styles.totalLeadPill}>
            <Text style={styles.totalLeadText}>{summary.totalLeads} {t('vetDashboard.totalLeads', { defaultValue: 'Total Leads' })}</Text>
          </View>
        </View>

        {dashboardData.recentLeads.length > 0 ? (
          dashboardData.recentLeads.map((lead) => (
            <View key={lead.id} style={styles.leadCard}>
              <View style={[styles.leadIcon, { backgroundColor: `${LEAD_COLORS[lead.leadType] || COLORS.textMuted}18` }]}>
                <Ionicons
                  name={lead.leadType === 'whatsapp_click' ? 'logo-whatsapp' : 'call-outline'}
                  size={20}
                  color={LEAD_COLORS[lead.leadType] || COLORS.textMuted}
                />
              </View>
              <View style={styles.leadBody}>
                <Text style={styles.leadName}>{lead.viewerName || t('vetDashboard.visitor', { defaultValue: 'Visitor' })}</Text>
                <Text style={styles.leadPhone}>{lead.viewerPhone || t('vetDashboard.anonymousLead', { defaultValue: 'Visitor without saved phone' })}</Text>
                <Text style={styles.leadDate}>{formatDateTime(lead.createdAt)}</Text>
              </View>
              <Text style={styles.leadType}>{leadTypeLabel(t, lead.leadType)}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>{t('vetDashboard.noRecentLeads', { defaultValue: 'No call or WhatsApp leads yet' })}</Text>
        )}
      </View>

      {renderLatestReviewCard()}
    </>
  );

  const renderInfoRow = (label, value) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || t('vetDashboard.notAvailable', { defaultValue: 'N/A' })}</Text>
    </View>
  );

  const renderProfileTab = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t('vetDashboard.profileStatus', { defaultValue: 'Profile Status' })}</Text>
      <View style={styles.profileInfoGrid}>
        {renderInfoRow(t('vetDashboard.fullName', { defaultValue: 'Full Name' }), `${t('vetDashboard.doctorPrefix', { defaultValue: 'Dr.' })} ${profile?.full_name || ''}`)}
        {renderInfoRow(t('vetDashboard.email', { defaultValue: 'Email' }), profile?.email)}
        {renderInfoRow(t('vetDashboard.phone', { defaultValue: 'Phone' }), profile?.phone_number)}
        {renderInfoRow(t('vetDashboard.licenseNumber', { defaultValue: 'License Number' }), profile?.license_number)}
        {renderInfoRow(t('vetDashboard.specialization', { defaultValue: 'Specialization' }), formatSpecialization(t, profile?.specialization))}
        {renderInfoRow(t('vetDashboard.experience', { defaultValue: 'Experience' }), `${profile?.experience_years || 0} ${t('vetDashboard.years', { defaultValue: 'years' })}`)}
        {renderInfoRow(t('vetDashboard.qualification', { defaultValue: 'Qualification' }), profile?.qualification)}
        {renderInfoRow(t('vetDashboard.consultationFee', { defaultValue: 'Consultation Fee' }), profile?.consultation_fee ? `₹${profile.consultation_fee}` : '')}
        {renderInfoRow(t('vetDashboard.clinicName', { defaultValue: 'Clinic Name' }), profile?.clinic_name)}
        {renderInfoRow(t('vetDashboard.clinicAddress', { defaultValue: 'Clinic Address' }), profile?.clinic_address)}
      </View>

      <Text style={styles.serviceTitle}>{t('vetDashboard.services', { defaultValue: 'Services' })}</Text>
      <View style={styles.serviceWrap}>
        {Array.isArray(profile?.services) && profile.services.length > 0 ? (
          profile.services.map((service, index) => (
            <View key={`${service}-${index}`} style={styles.servicePill}>
              <Text style={styles.serviceText}>{formatService(t, service)}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>{t('vetDashboard.notAvailable', { defaultValue: 'N/A' })}</Text>
        )}
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('EditVetProfile')}>
        <Ionicons name="create-outline" size={18} color={COLORS.white} />
        <Text style={styles.primaryButtonText}>{t('vetDashboard.updateProfile', { defaultValue: 'Update Profile' })}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLatestReviewCard = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>{t('vetDashboard.latestReview', { defaultValue: 'Latest Review' })}</Text>
          <Text style={styles.cardSubtitle}>
            {summary.totalReviews} {t('vetDashboard.reviews', { defaultValue: 'Reviews' })}
          </Text>
        </View>
        {renderStars(summary.averageRating)}
      </View>

      {dashboardData.latestReview ? (
        <View style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <View>
              <Text style={styles.reviewName}>{dashboardData.latestReview.userName}</Text>
              <Text style={styles.reviewDate}>{formatDate(dashboardData.latestReview.createdAt)}</Text>
            </View>
            {renderStars(dashboardData.latestReview.rating)}
          </View>
          {dashboardData.latestReview.reviewText ? (
            <Text style={styles.reviewText}>{dashboardData.latestReview.reviewText}</Text>
          ) : null}
          {dashboardData.latestReview.vetResponse ? (
            <View style={styles.responseBox}>
              <Text style={styles.responseLabel}>{t('vetDashboard.yourResponse', { defaultValue: 'Your response' })}</Text>
              <Text style={styles.responseText}>{dashboardData.latestReview.vetResponse}</Text>
            </View>
          ) : null}
        </View>
      ) : (
        <Text style={styles.emptyText}>{t('vetDashboard.noLatestReview', { defaultValue: 'No reviews yet' })}</Text>
      )}
    </View>
  );

  const renderReviewsTab = () => (
    <>
      <View style={styles.reviewSummaryCard}>
        <Text style={styles.reviewScore}>{Number(summary.averageRating || 0).toFixed(1)}</Text>
        {renderStars(summary.averageRating)}
        <Text style={styles.reviewSummaryText}>
          {t('vetDashboard.totalReviewsHelper', {
            defaultValue: '{{count}} reviews received',
            count: summary.totalReviews,
          })}
        </Text>
      </View>
      {renderLatestReviewCard()}
    </>
  );

  const renderSettingsTab = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t('vetDashboard.settings', { defaultValue: 'Settings' })}</Text>
      <View style={styles.noticeBox}>
        <Ionicons name="analytics-outline" size={22} color={COLORS.primaryDark} />
        <View style={styles.noticeContent}>
          <Text style={styles.noticeTitle}>{t('vetDashboard.simpleDashboardNote', { defaultValue: 'This dashboard tracks real profile views, call clicks, WhatsApp clicks, and reviews only.' })}</Text>
          <Text style={styles.noticeText}>{t('vetDashboard.simpleDashboardNoteDesc', { defaultValue: 'No appointment, patient, or platform earnings numbers are shown unless those features are added later.' })}</Text>
        </View>
      </View>
      {renderInfoRow(t('vetDashboard.accountEmail', { defaultValue: 'Account Email' }), profile?.email)}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
        <Text style={styles.logoutText}>{t('vetDashboard.logout', { defaultValue: 'Logout' })}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderActiveTab = () => {
    if (activeTab === 'profile') {
      return renderProfileTab();
    }
    if (activeTab === 'reviews') {
      return renderReviewsTab();
    }
    if (activeTab === 'settings') {
      return renderSettingsTab();
    }
    return renderDashboardTab();
  };

  if (!ready || (loading && !refreshing)) {
    return (
      <View style={styles.loadingContainer}>
        <SkeletonLoader variant="dashboard" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader
        showBack={false}
        title={t('vetDashboard.vetPortal', { defaultValue: 'Vet Portal' })}
        subtitle={t('vetDashboard.dashboard', { defaultValue: 'Dashboard' })}
        leading={(
          <Image
            source={getProfilePhoto(profile) ? { uri: getProfilePhoto(profile) } : require('../assets/veterinarian.png')}
            style={styles.profileImage}
          />
        )}
        rightActions={[
          {
            icon: 'refresh-outline',
            onPress: () => loadDashboard({ showLoader: false }),
            color: COLORS.text,
            accessibilityLabel: 'Refresh dashboard',
          },
        ]}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {renderProfileHero()}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabList}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.85}
              >
                <Ionicons name={tab.icon} size={16} color={isActive ? COLORS.white : COLORS.primaryDark} />
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {renderActiveTab()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  profileImage: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroAvatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroAvatar: {
    width: '100%',
    height: '100%',
  },
  heroAvatarText: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },
  heroInfo: {
    flex: 1,
    minWidth: 0,
  },
  doctorName: {
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.text,
  },
  doctorMeta: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  verifiedPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: COLORS.primarySoft,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primarySoft,
  },
  completionHeader: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  completionValue: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },
  progressTrack: {
    height: 9,
    marginTop: 8,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: COLORS.border,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  tabList: {
    paddingVertical: 16,
    gap: 10,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flexBasis: '48%',
    flexGrow: 1,
    minHeight: 154,
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.text,
  },
  statLabel: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  statHelper: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.textMuted,
  },
  card: {
    marginTop: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
  },
  cardSubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.textMuted,
  },
  trendChart: {
    height: 140,
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  trendItem: {
    flex: 1,
    alignItems: 'center',
  },
  trendBarTrack: {
    height: 104,
    justifyContent: 'flex-end',
  },
  trendBar: {
    width: 18,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: COLORS.border,
  },
  trendSegment: {
    minHeight: 2,
  },
  trendDay: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  legendRow: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  sourceList: {
    marginTop: 16,
    gap: 14,
  },
  sourceRow: {
    gap: 7,
  },
  sourceLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  sourceLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  sourceValue: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.text,
  },
  sourceTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: COLORS.border,
  },
  sourceFill: {
    height: '100%',
    borderRadius: 999,
  },
  totalLeadPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.primarySoft,
  },
  totalLeadText: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },
  leadCard: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceAlt,
  },
  leadIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadBody: {
    flex: 1,
    minWidth: 0,
  },
  leadName: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.text,
  },
  leadPhone: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  leadDate: {
    marginTop: 3,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  leadType: {
    maxWidth: 90,
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primaryDark,
    textAlign: 'right',
  },
  emptyText: {
    marginTop: 14,
    paddingVertical: 18,
    textAlign: 'center',
    fontSize: 13,
    color: COLORS.textMuted,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reviewCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceAlt,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  reviewName: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.text,
  },
  reviewDate: {
    marginTop: 3,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  reviewText: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.text,
  },
  responseBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
  },
  responseLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  responseText: {
    marginTop: 6,
    fontSize: 13,
    color: COLORS.text,
  },
  profileInfoGrid: {
    marginTop: 14,
    gap: 10,
  },
  infoRow: {
    padding: 13,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceAlt,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
  },
  infoValue: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  serviceTitle: {
    marginTop: 18,
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.text,
  },
  serviceWrap: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  servicePill: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: COLORS.primarySoft,
  },
  serviceText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  primaryButton: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.white,
  },
  reviewSummaryCard: {
    marginTop: 4,
    alignItems: 'center',
    padding: 22,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reviewScore: {
    fontSize: 42,
    fontWeight: '900',
    color: COLORS.text,
  },
  reviewSummaryText: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  noticeBox: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: COLORS.primarySoft,
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 18,
    color: COLORS.primaryDark,
  },
  noticeText: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textMuted,
  },
  logoutButton: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.errorSoft,
    backgroundColor: COLORS.surface,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.error,
  },
});

export default VetDashboardScreen;
