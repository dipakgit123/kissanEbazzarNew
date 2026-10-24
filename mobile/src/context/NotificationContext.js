import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useVetAuth } from './VetAuthContext';
import notificationService from '../services/notificationService';
import { API_URL } from '../services/api';
import { navigateFromNotification, clearPendingNotificationNavigation } from '../navigation/notificationNavigation';
import logger from '../utils/logger';

const NotificationContext = createContext();
const PAGE_SIZE = 30;
const DEFAULT_PREFERENCES = { push_enabled: true, marketplace_enabled: true, reminders_enabled: true, communication_enabled: true, system_enabled: true,
  farm_enabled: true, pet_enabled: true,
  health_enabled: true, pet_mating_enabled: true, content_enabled: false, milk_reminders_enabled: false };
export const useNotifications = () => {
  const value = useContext(NotificationContext);
  if (!value) throw new Error('NotificationProvider is required');
  return value;
};
export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, token, user } = useAuth();
  const { isVetAuthenticated, vetToken, veterinarian } = useVetAuth();
  const { i18n } = useTranslation();
  const activeToken = isVetAuthenticated ? vetToken : token;
  const account = isVetAuthenticated ? veterinarian : user;
  const role = isVetAuthenticated ? 'veterinarian' : 'user';
  const accountKey = activeToken && account?.id && (isAuthenticated || isVetAuthenticated) ? `${role}:${account.id}` : null;
  const currentAccount = useRef(accountKey); currentAccount.current = accountKey;
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);
  const [pushToken, setPushToken] = useState(null);
  const [pushRegistrationStatus, setPushRegistrationStatus] = useState('idle');
  const [pushRegistrationError, setPushRegistrationError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('undetermined');
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [preferenceSaving, setPreferenceSaving] = useState(false);
  const sequence = useRef(0), items = useRef([]), handled = useRef(new Set()), pendingActions = useRef(new Set()), saving = useRef(false), registering = useRef(Promise.resolve());
  const updateBadge = useCallback(count => { notificationService.setBadgeCount(Math.max(0, count)).catch(() => {}); }, []);
  const fetchNotifications = useCallback(async ({ append = false } = {}) => {
    if (!accountKey) return;
    const request = ++sequence.current;
    const offset = append ? items.current.length : 0;
    append ? setLoadingMore(true) : setLoading(true);
    try {
      const page = await notificationService.getNotificationPage(PAGE_SIZE, offset, activeToken);
      if (currentAccount.current !== accountKey || request !== sequence.current) return;
      const known = new Set(items.current.map(item => String(item.id)));
      const next = append ? [...items.current, ...page.items.filter(item => !known.has(String(item.id)))] : page.items;
      items.current = next; setNotifications(next); setUnreadCount(page.unreadCount); updateBadge(page.unreadCount);
      setHasMore(offset + page.items.length < page.total); setError(null);
    } catch (failure) { if (currentAccount.current === accountKey && request === sequence.current) setError('load'); logger.log('Notification fetch failed:', failure.message); }
    finally { if (currentAccount.current === accountKey && request === sequence.current) { setLoading(false); setLoadingMore(false); } }
  }, [accountKey, activeToken, updateBadge]);
  const loadPreferences = useCallback(async () => {
    if (!accountKey) return;
    setPreferencesLoading(true);
    try {
      const next = await notificationService.getPreferences(activeToken);
      if (currentAccount.current === accountKey) { setPreferences({ ...DEFAULT_PREFERENCES, ...next }); setError(null); }
    } catch { if (currentAccount.current === accountKey) setError('settings'); }
    finally { if (currentAccount.current === accountKey) setPreferencesLoading(false); }
  }, [accountKey, activeToken]);
  const updatePreference = useCallback(async (field, value) => {
    if (!accountKey || saving.current || !(field in DEFAULT_PREFERENCES)) return false;
    saving.current = true; setPreferenceSaving(true);
    try {
      const next = await notificationService.updatePreferences({ [field]: value }, activeToken);
      if (currentAccount.current === accountKey) { setPreferences({ ...DEFAULT_PREFERENCES, ...next }); setError(null); }
      return true;
    } catch { if (currentAccount.current === accountKey) setError('settings'); return false; }
    finally { saving.current = false; if (currentAccount.current === accountKey) setPreferenceSaving(false); }
  }, [accountKey, activeToken]);
  const syncPushToken = useCallback(async ({ requestPermission = false, force = false } = {}) => {
    if (!accountKey) return null;
    const run = async () => {
    if (currentAccount.current !== accountKey) return null;
    setPushRegistrationStatus('registering'); setPushRegistrationError(null);
    try {
      const result = await notificationService.registerForPushNotifications({ requestPermission });
      if (currentAccount.current !== accountKey) return null;
      setPermissionStatus(result?.permissionStatus || 'unavailable');
      if (!result?.token) { setPushToken(null); setPushRegistrationStatus('failed'); setPushRegistrationError('registration'); return result; }
      if (force || await notificationService.shouldReregisterToken(result.token, accountKey)) {
        if (currentAccount.current !== accountKey) return null;
        await notificationService.registerTokenWithBackend(result.token, result.provider, 3, activeToken, accountKey);
      }
      if (currentAccount.current === accountKey) { setPushToken(result.token); setPushRegistrationStatus('registered'); }
      return result;
    } catch { if (currentAccount.current === accountKey) { setPushRegistrationStatus('failed'); setPushRegistrationError('registration'); } return null; }
    };
    const request = registering.current.then(run, run);
    registering.current = request.catch(() => {});
    return request;
  }, [accountKey, activeToken]);
  const mutate = useCallback(async (key, operation) => {
    if (!accountKey || pendingActions.current.has(key)) return false;
    pendingActions.current.add(key);
    ++sequence.current; setLoading(false); setLoadingMore(false);
    try { await operation(); if (currentAccount.current === accountKey) await fetchNotifications(); return true; }
    catch { if (currentAccount.current === accountKey) setError('action'); return false; }
    finally { pendingActions.current.delete(key); }
  }, [accountKey, fetchNotifications]);
  const markAsRead = useCallback(id => mutate(`read:${id}`, () => notificationService.markAsRead(id, activeToken)), [activeToken, mutate]);
  const handleNotificationResponse = useCallback(async response => {
    const data = response?.notification?.request?.content?.data || {};
    if (!accountKey || (data.recipient_id && `${data.recipient_type || 'user'}:${data.recipient_id}` !== accountKey)) return;
    const id = String(data.notification_id || response?.notification?.request?.identifier || '');
    if (id && handled.current.has(id)) return;
    if (id) handled.current.add(id);
    // Navigation must not wait for a slow or failed read-status request.
    navigateFromNotification(data, isVetAuthenticated);
    if (data.notification_id) markAsRead(data.notification_id);
  }, [accountKey, isVetAuthenticated, markAsRead]);
  const openNotification = useCallback(item => {
    navigateFromNotification({ ...item.data, type: item.type }, isVetAuthenticated);
    if (!item.is_read) markAsRead(item.id);
  }, [isVetAuthenticated, markAsRead]);
  useEffect(() => {
    ++sequence.current; items.current = []; handled.current.clear(); pendingActions.current.clear(); clearPendingNotificationNavigation();
    setNotifications([]); setUnreadCount(0); setHasMore(false); setError(null); setPreferences(DEFAULT_PREFERENCES); setPreferenceSaving(false); setPreferencesLoading(false);
    setPushToken(null); setPushRegistrationStatus('idle'); setLoading(false); setLoadingMore(false); updateBadge(0);
    if (!accountKey) return undefined;
    let cancelled = false, timer;
    const refresh = () => { clearTimeout(timer); timer = setTimeout(() => fetchNotifications(), 200); };
    const socket = io(API_URL, { auth: { token: activeToken }, transports: ['websocket', 'polling'], tryAllTransports: true, reconnection: true });
    socket.on('connect', refresh); socket.on('notification', refresh); socket.on('notifications_changed', refresh);
    socket.on('connect_error', () => {});
    const received = notificationService.addNotificationReceivedListener(refresh);
    const tapped = notificationService.addNotificationResponseListener(handleNotificationResponse);
    const rotated = notificationService.addPushTokenListener(() => syncPushToken({ force: true }));
    fetchNotifications(); loadPreferences(); syncPushToken({ requestPermission: true, force: true });
    // Cold-start taps are independent of token registration and permission failures.
    notificationService.getLastNotificationResponse().then(async response => {
      if (!cancelled && response) { await handleNotificationResponse(response); await notificationService.clearLastNotificationResponse(); }
    }).catch(() => {});
    return () => { cancelled = true; notificationService.cancelPendingRegistration(); clearTimeout(timer); socket.disconnect(); received?.remove(); tapped?.remove(); rotated?.remove?.(); };
  }, [accountKey, activeToken, fetchNotifications, loadPreferences, syncPushToken, handleNotificationResponse, updateBadge]);
  useEffect(() => {
    if (!accountKey) return;
    const language = String(i18n.language).split('-')[0];
    notificationService.updatePreferences({ language: ['en', 'mr', 'hi'].includes(language) ? language : 'en' }, activeToken).catch(() => {});
  }, [accountKey, activeToken, i18n.language]);
  useEffect(() => {
    const listener = AppState.addEventListener('change', state => {
      if (state !== 'active' || !accountKey) return;
      fetchNotifications(); loadPreferences(); syncPushToken();
      notificationService.getNotificationPermissionStatus().then(status => { if (currentAccount.current === accountKey) setPermissionStatus(status); }).catch(() => {});
    });
    return () => listener.remove();
  }, [accountKey, fetchNotifications, loadPreferences, syncPushToken]);
  const value = useMemo(() => ({ notifications, unreadCount, loading, loadingMore, hasMore, error, pushToken, pushRegistrationStatus, pushRegistrationError, permissionStatus, preferences, preferencesLoading, preferenceSaving,
    isVeterinarian: isVetAuthenticated, fetchNotifications, loadPreferences, updatePreference, markAsRead, openNotification, handleNotificationResponse,
    loadMore: () => hasMore && !loadingMore && fetchNotifications({ append: true }), refreshUnreadCount: fetchNotifications,
    markAllAsRead: () => mutate('all-read', () => notificationService.markAllAsRead(activeToken)),
    deleteNotification: id => mutate(`delete:${id}`, () => notificationService.deleteNotification(id, activeToken)),
    clearAll: () => mutate('clear', () => notificationService.clearAllNotifications(activeToken)),
    requestPushPermission: () => syncPushToken({ requestPermission: true, force: true }), supportsSystemNotificationSettings: ['ios', 'android'].includes(Platform.OS),
  }), [notifications, unreadCount, loading, loadingMore, hasMore, error, pushToken, pushRegistrationStatus, pushRegistrationError, permissionStatus, preferences, preferencesLoading, preferenceSaving, isVetAuthenticated, fetchNotifications, loadPreferences, updatePreference, markAsRead, openNotification, handleNotificationResponse, mutate, activeToken, syncPushToken]);
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
export default NotificationContext;
