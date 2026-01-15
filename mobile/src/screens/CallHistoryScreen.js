import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import { callLogService } from '../services/api';

const CallHistoryScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [callLogs, setCallLogs] = useState([]);
  const [filter, setFilter] = useState('all'); // all, incoming, outgoing, missed

  useEffect(() => {
    fetchCallHistory();
  }, [filter]);

  const fetchCallHistory = async () => {
    try {
      const response = await callLogService.getCallLogs(filter);
      if (response.success) {
        setCallLogs(response.callLogs || []);
      }
    } catch (error) {
      console.error('Error fetching call history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCallHistory();
  };

  const makeCall = async (phoneNumber, contactName, contactType) => {
    try {
      // Log the call
      await callLogService.logCall({
        phoneNumber,
        contactName,
        contactType,
        duration: 0,
        status: 'outgoing',
      });
      
      // Make the call
      const url = `tel:${phoneNumber}`;
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
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
      case 'incoming':
        return { name: 'call-received', color: '#10B981' };
      case 'outgoing':
        return { name: 'call-made', color: '#3B82F6' };
      case 'missed':
        return { name: 'call-missed', color: '#EF4444' };
      default:
        return { name: 'call', color: '#6B7280' };
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
    const icon = getCallIcon(item.callType);
    
    return (
      <TouchableOpacity
        style={styles.callLogCard}
        onLongPress={() => deleteCallLog(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.callIconContainer, { backgroundColor: icon.color + '20' }]}>
          <Ionicons name={icon.name} size={24} color={icon.color} />
        </View>
        
        <View style={styles.callInfo}>
          <View style={styles.callHeader}>
            <Text style={styles.contactName}>{item.contactName || 'Unknown'}</Text>
            {item.contactType && (
              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>{item.contactType}</Text>
              </View>
            )}
          </View>
          <Text style={styles.phoneNumber}>{item.phoneNumber}</Text>
          <View style={styles.callDetails}>
            <Text style={styles.callDate}>{formatDate(item.createdAt)}</Text>
            <Text style={styles.callDuration}> • {formatDuration(item.duration)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.callButton}
          onPress={() => makeCall(item.phoneNumber, item.contactName, item.contactType)}
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
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('callHistory.title')}</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {renderFilterButton('all', t('callHistory.all'), 'list')}
          {renderFilterButton('outgoing', t('callHistory.outgoing'), 'call-made')}
          {renderFilterButton('incoming', t('callHistory.incoming'), 'call-received')}
          {renderFilterButton('missed', t('callHistory.missed'), 'call-missed')}
        </ScrollView>
      </View>

      {/* Call Logs List */}
      {callLogs.length > 0 ? (
        <FlatList
          data={callLogs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCallLog}
          contentContainerStyle={styles.listContent}
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
    marginBottom: 4,
  },
  callDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callDate: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  callDuration: {
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
