import React, { useCallback, useEffect, useState } from 'react';
import {
  DeviceEventEmitter,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ScrollView,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import { callLogService } from '../services/api';
import CowLoader from '../components/CowLoader';
import AppHeader from '../components/AppHeader';

const CallHistoryScreen = ({ navigation }) => {
  const { t, ready } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [callLogs, setCallLogs] = useState([]);
  const [filter, setFilter] = useState('all'); // all, made, received

  // Show loading while translations are loading
  if (!ready) {
    return (
      <View style={styles.loadingContainer}>
        <CowLoader message="" size="large" />
      </View>
    );
  }

  useFocusEffect(
    useCallback(() => {
      fetchCallHistory({ withLoader: true });

      const intervalId = setInterval(() => {
        fetchCallHistory();
      }, 10000);

      return () => clearInterval(intervalId);
    }, [filter, user?.id])
  );

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('callHistory:updated', () => {
      fetchCallHistory();
    });

    return () => subscription.remove();
  }, [filter, user?.id]);

  const fetchCallHistory = async ({ withLoader = false } = {}) => {
    try {
      if (withLoader) {
        setLoading(true);
      }

      // Check if user is authenticated
      if (!user) {
        setCallLogs([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const response = await callLogService.getCallLogs(filter);
      if (response.success) {
        setCallLogs(response.data || response.callLogs || []);
      }
    } catch (error) {
      console.error('Error fetching call history:', error);
      
      // Handle authentication errors
      if (error.message === 'User not found' || error.status === 401) {
        Alert.alert(
          t('callHistory.authErrorTitle', { defaultValue: 'Authentication Error' }),
          t('callHistory.authErrorMessage', {
            defaultValue: 'Please login again to view call history.',
          }),
          [
            {
              text: t('common.ok'),
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      }
      
      setCallLogs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCallHistory();
  };

  const makeCall = async (phoneNumber, receiverName, callType) => {
    try {
      if (!phoneNumber) {
        Alert.alert(
          t('common.error'),
          t('callHistory.phoneUnavailable', {
            defaultValue: 'Phone number not available',
          })
        );
        return;
      }

      // Make the call first
      const url = `tel:${phoneNumber}`;
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        
        // Note: Call logging should happen when user actually initiates call from animal detail
        // This is just re-calling from history
      } else {
        Alert.alert(t('common.error'), t('errors.permissionDenied'));
      }
    } catch (error) {
      console.error('Error making call:', error);
      Alert.alert(t('common.error'), t('errors.somethingWentWrong'));
    }
  };

  const deleteCallLog = async (logId) => {
    Alert.alert(
      t('common.delete'),
      t('callHistory.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await callLogService.deleteCallLog(logId);
              setCallLogs(callLogs.filter(log => log.id !== logId));
            } catch (error) {
              Alert.alert(t('common.error'), t('errors.somethingWentWrong'));
            }
          },
        },
      ]
    );
  };

  const getCallIcon = (type) => {
    switch (type) {
      case 'made':
      case 'outgoing':
        return {
          name: 'call-outline',
          color: '#3B82F6',
          label: t('callHistory.calledLabel', { defaultValue: 'Called' }),
        };
      case 'received':
      case 'incoming':
        return {
          name: 'arrow-down-circle',
          color: '#10B981',
          label: t('callHistory.receivedLabel', { defaultValue: 'Received' }),
        };
      default:
        return {
          name: 'call',
          color: '#6B7280',
          label: t('callHistory.callLabel', { defaultValue: 'Call' }),
        };
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return t('callHistory.notConnected');
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `${t('callHistory.today')}, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `${t('callHistory.yesterday')}, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  const renderCallLog = ({ item }) => {
    // Determine if this is a call made by me or received by me
    const isCallMade = item.caller_id === user?.id || item.callerId === user?.id;
    const callType = isCallMade ? 'made' : 'received';
    const icon = getCallIcon(callType);
    
    // Get listing information (what animal was the inquiry about)
    const animalType =
      item.listing_type ||
      item.listingType ||
      t('callHistory.animalFallback', { defaultValue: 'Animal' });
    
    // For calls made: Show seller's information
    // For calls received: Show buyer's information
    const contactName = isCallMade 
      ? (
          item.seller?.full_name ||
          item.seller?.name ||
          item.sellerName ||
          t('callHistory.sellerFallback', { defaultValue: 'Seller' })
        )
      : (
          item.caller?.full_name ||
          item.caller?.name ||
          item.callerName ||
          t('callHistory.buyerFallback', { defaultValue: 'Buyer' })
        );
    
    const phoneNumber = isCallMade 
      ? (item.seller_phone || item.sellerPhone)
      : (item.caller?.phone_number || item.caller?.phoneNumber || item.callerPhone);
    
    return (
      <TouchableOpacity
        style={styles.callLogCard}
        onLongPress={() => deleteCallLog(item.id)}
        activeOpacity={0.7}
      >
        {/* Call Type Icon */}
        <View style={[styles.callIconContainer, { backgroundColor: icon.color + '20' }]}>
          <Ionicons name={icon.name} size={24} color={icon.color} />
        </View>
        
        <View style={styles.callInfo}>
          {/* Contact Name and Call Type */}
          <View style={styles.callHeader}>
            <Text style={styles.contactName}>{contactName}</Text>
            <View style={[styles.typeBadge, { backgroundColor: icon.color + '15' }]}>
              <Text style={[styles.typeText, { color: icon.color }]}>{icon.label}</Text>
            </View>
          </View>
          
          {/* Phone Number */}
          <Text style={styles.phoneNumber}>
            {phoneNumber || t('callHistory.noNumber', { defaultValue: 'No number' })}
          </Text>
          
          {/* Animal Type (what the inquiry was about) */}
          {animalType && (
            <View style={styles.animalInfo}>
              <Ionicons name="paw" size={14} color="#6B7280" />
              <Text style={styles.animalText}>
                {isCallMade
                  ? t('callHistory.inquiryAbout', {
                      animalType,
                      defaultValue: `Inquiry about ${animalType}`,
                    })
                  : t('callHistory.inquiryAboutYour', {
                      animalType,
                      defaultValue: `Inquiry about your ${animalType}`,
                    })}
              </Text>
            </View>
          )}
          
          {/* Date and Duration */}
          <View style={styles.callDetails}>
            <Ionicons name="time-outline" size={14} color="#9CA3AF" />
            <Text style={styles.callDate}>{formatDate(item.created_at || item.createdAt)}</Text>
          </View>
        </View>

        {/* Call Button */}
        <TouchableOpacity
          style={styles.callButton}
          onPress={() => makeCall(phoneNumber, contactName, animalType)}
        >
          <Ionicons name="call" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderFilterButton = (filterType, label, icon) => (
    <TouchableOpacity
      style={[styles.filterChip, filter === filterType && styles.filterChipActive]}
      onPress={() => setFilter(filterType)}
    >
      <Ionicons
        name={icon}
        size={18}
        color={filter === filterType ? '#fff' : COLORS.primary}
      />
      <Text style={[styles.filterText, filter === filterType && styles.filterTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <CowLoader message={t('common.loading', { defaultValue: '' })} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader
        navigation={navigation}
        title={t('callHistory.title')}
        rightActions={[
          {
            icon: 'refresh',
            onPress: onRefresh,
            color: COLORS.primary,
            accessibilityLabel: 'Refresh call history',
          },
        ]}
      />

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {renderFilterButton('all', t('callHistory.all') || 'All Calls', 'list')}
          {renderFilterButton('made', t('callHistory.made') || 'Calls Made', 'call-outline')}
          {renderFilterButton('received', t('callHistory.received') || 'Calls Received', 'arrow-down-circle')}
        </ScrollView>
      </View>

      {/* Call Logs List */}
      {callLogs.length > 0 ? (
        <FlatList
          data={callLogs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCallLog}
          contentContainerStyle={[styles.listContent, { paddingBottom: 160 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="call-outline" size={80} color="#D1D5DB" />
          <Text style={styles.emptyStateTitle}>{t('callHistory.noCallHistory')}</Text>
          <Text style={styles.emptyStateText}>
            {t('callHistory.noCallHistoryDesc')}
          </Text>
        </View>
      )}

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle" size={18} color={COLORS.primary} />
        <Text style={styles.infoBannerText}>
          {t('callHistory.longPressDelete')}
        </Text>
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
    marginLeft: 6,
  },
  filterTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  callLogCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  callIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  callInfo: {
    flex: 1,
  },
  callHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 8,
  },
  typeBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  phoneNumber: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
  },
  animalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
  },
  animalText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  callDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  callDate: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  infoBannerText: {
    fontSize: 13,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
});

export default CallHistoryScreen;
