import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { notificationText } from '../utils/notificationUi';
import notificationMessages from '../utils/notificationMessages.json';
import { useNotifications } from '../context/NotificationContext';
import { COLORS } from '../utils/constants';
import SkeletonLoader from '../components/SkeletonLoader';
import AppHeader from '../components/AppHeader';

const NotificationItem = ({ notification, onPress, onDelete }) => {
  const { i18n } = useTranslation();
  const c = notificationText(i18n.language);
  const pair = notificationMessages[notification.data?.message_key || notification.type]?.[{ en: 0, mr: 1, hi: 2 }[i18n.language?.split('-')[0]] || 0];
  const render = text => text?.replace(/\{\{(\w+)\}\}/g, (_, key) => String(notification.data?.message_args?.[key] || ''));
  const getIcon = () => {
    switch (notification.type) {
      case 'new_listing':
        return { name: 'pricetag', color: '#4CAF50' };
      case 'price_drop':
        return { name: 'trending-down', color: '#FF9800' };
      case 'contact':
        return { name: 'chatbubble', color: '#2196F3' };
      case 'pregnancy':
        return { name: 'calendar', color: '#9C27B0' };
      case 'reminder':
      case 'appointment_reminder':
      case 'pregnancy_reminder':
        return { name: 'alarm', color: '#F44336' };
      case 'new_appointment':
      case 'appointment_confirmed':
      case 'appointment_cancelled':
      case 'appointment_completed':
      case 'appointment_rescheduled':
        return { name: 'medkit', color: COLORS.info };
      case 'incoming_call':
        return { name: 'call', color: COLORS.success };
      default:
        return { name: 'notifications', color: COLORS.primary };
    }
  };

  const icon = getIcon();
  const timeAgo = getTimeAgo(notification.created_at, i18n.language, c);

  return (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !notification.is_read && styles.unreadItem,
      ]}
      onPress={() => onPress(notification)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: icon.color + '20' }]}>
        <Ionicons name={icon.name} size={24} color={icon.color} />
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {render(pair?.[0]) || notification.title}
        </Text>
        <Text style={styles.message} numberOfLines={2}>
          {render(pair?.[1]) || notification.message}
        </Text>
        <Text style={styles.time}>{timeAgo}</Text>
      </View>
      {!notification.is_read && <View style={styles.unreadDot} />}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={(event) => {
          event.stopPropagation();
          onDelete(notification.id);
        }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close" size={18} color={COLORS.gray} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const getTimeAgo = (dateString, language, c) => {
  if (!dateString) return ''; 

  const now = new Date();
  const date = new Date(dateString);

  // Check if date is valid
  if (isNaN(date.getTime())) return ''; 

  const seconds = Math.floor((now - date) / 1000);

  // Check for future dates
  if (seconds < 0) return c('now');

  if (seconds < 60) return c('now');
  return date.toLocaleString(language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
};

const NotificationsScreen = ({ navigation }) => {
  const { t, ready, i18n } = useTranslation();
  const c = notificationText(i18n.language);
  const {
    error,
    notifications,
    unreadCount,
    loading,
    loadingMore,
    hasMore,
    fetchNotifications,
    markAllAsRead,
    deleteNotification,
    clearAll,
    openNotification,
  } = useNotifications();

  const onRefresh = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Show loading while translations are loading
  if (!ready) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <SkeletonLoader variant="list" count={5} />
      </View>
    );
  }

  const handleNotificationPress = async (notification) => {
    await openNotification(notification);
  };

  const handleDelete = (notificationId) => {
    Alert.alert(
      c('deleteTitle'),
      c('deleteBody'),
      [
        { text: c('cancel'), style: 'cancel' },
        {
          text: c('delete'),
          style: 'destructive',
          onPress: () => deleteNotification(notificationId),
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      c('clearTitle'),
      c('clearBody'),
      [
        { text: c('cancel'), style: 'cancel' },
        {
          text: c('delete'),
          style: 'destructive',
          onPress: clearAll,
        },
      ]
    );
  };



  const renderHeader = () => (
    <AppHeader
      navigation={navigation}
      title={t('notifications.title')}
      subtitle={
        unreadCount > 0
          ? `${unreadCount} ${c('unread')}`
          : undefined
      }
      rightActions={[
        {
          icon: 'settings-outline',
          onPress: () => navigation.navigate('NotificationSettings'),
          color: COLORS.textMuted,
          accessibilityLabel: c('settingsTitle'),
        },
        ...(unreadCount > 0
          ? [
              {
                icon: 'checkmark-done',
                onPress: markAllAsRead,
                color: COLORS.primary,
                accessibilityLabel: c('markAll'),
              },
            ]
          : []),
        ...(notifications.length > 0
          ? [
              {
                icon: 'trash-outline',
                onPress: handleClearAll,
                color: COLORS.error,
                accessibilityLabel: c('clearTitle'),
              },
            ]
          : []),
      ]}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={80} color={COLORS.lightGray} />
      <Text style={styles.emptyTitle}>{t('notifications.noNotifications')}</Text>
      <Text style={styles.emptySubtitle}>
        {t('notifications.noNotificationsDesc')}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      {error && <View accessibilityRole="alert" style={{ padding: 16, backgroundColor: '#fff3e0' }}>
        <Text>{c(error)}</Text>
        <TouchableOpacity onPress={() => fetchNotifications()} style={{ paddingVertical: 12 }}><Text>{c('retry')}</Text></TouchableOpacity>
      </View>}

      {loading && notifications.length === 0 ? (
        <View style={styles.loadingContainer}>
          <SkeletonLoader variant="list" count={5} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item, index) => item?.id?.toString() || `notification-${index}`}
          renderItem={({ item }) => (
            <NotificationItem
              notification={item}
              onPress={handleNotificationPress}
              onDelete={handleDelete}
            />
          )}
          ListEmptyComponent={error ? null : renderEmpty}
          ListFooterComponent={loadingMore ? (
            <ActivityIndicator style={styles.footerLoader} color={COLORS.primary} />
          ) : null}
          onEndReached={() => {
            if (hasMore && !loadingMore) fetchNotifications({ append: true });
          }}
          onEndReachedThreshold={0.35}
          contentContainerStyle={
            notifications.length === 0 ? styles.emptyList : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />
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
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
    marginLeft: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  unreadItem: {
    backgroundColor: COLORS.primary + '08',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
    lineHeight: 20,
  },
  time: {
    fontSize: 12,
    color: COLORS.gray,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: 8,
  },
  deleteButton: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: 18,
  },
});

export default NotificationsScreen;
