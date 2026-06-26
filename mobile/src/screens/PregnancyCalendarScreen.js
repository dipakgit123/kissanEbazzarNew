import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import CowLoader from '../components/CowLoader';
import AppHeader from '../components/AppHeader';
import FeatureHelpModal from '../components/FeatureHelpModal';
import { getLocalizedFeatureHelp } from '../constants/featureHelp';
import { pregnancyService } from '../services/api';
import { COLORS } from '../utils/constants';

const DURATION_META = {
  cow: { days: 280, months: 9, icon: 'cow', iconSet: 'material-community', accent: '#22A05B' },
  buffalo: { days: 310, months: 10, icon: 'cow', iconSet: 'material-community', accent: '#475569' },
  goat: { days: 150, months: 5, icon: 'sheep', iconSet: 'material-community', accent: '#D97706' },
  sheep: { days: 150, months: 5, icon: 'sheep', iconSet: 'material-community', accent: '#64748B' },
  horse: { days: 340, months: 11, icon: 'horse', iconSet: 'material-community', accent: '#7C3AED' },
  dog: { days: 63, months: 2, icon: 'dog', iconSet: 'material-community', accent: '#EA580C' },
  cat: { days: 65, months: 2, icon: 'cat', iconSet: 'material-community', accent: '#E11D48' },
  other: { days: 150, months: 5, icon: 'apps-outline', iconSet: 'ionicons', accent: '#0284C7' },
};

const DEFAULT_STATS = {
  active_pregnancies: 0,
  successful_deliveries: 0,
  upcoming_deliveries: [],
  total_records: 0,
};

const getDateOnlyValue = (date) => {
  if (!date) return '';
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);
  return normalizedDate.toISOString().split('T')[0];
};

const formatDisplayDate = (dateString, localeCode = 'en-IN') => {
  if (!dateString) return '';

  const parsedDate = new Date(dateString);

  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }

  return parsedDate.toLocaleDateString(localeCode, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getMonthTitle = (date, localeCode = 'en-IN') =>
  date.toLocaleDateString(localeCode, {
    month: 'long',
    year: 'numeric',
  });

const PregnancyCalendarScreen = ({ navigation }) => {
  const { t, ready, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const localeCode = i18n.language?.startsWith('hi')
    ? 'hi-IN'
    : i18n.language?.startsWith('mr')
    ? 'mr-IN'
    : 'en-IN';

  const [pregnancyRecords, setPregnancyRecords] = useState([]);
  const [pregnancyDurations, setPregnancyDurations] = useState({});
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deliverySubmitting, setDeliverySubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState('active');

  const [formData, setFormData] = useState({
    animal_type: 'cow',
    animal_name: '',
    ear_badge_number: '',
    pregnancy_duration_days: '',
    mating_date: getDateOnlyValue(new Date()),
    notes: '',
  });

  const [deliveryData, setDeliveryData] = useState({
    delivery_date: getDateOnlyValue(new Date()),
    offspring_count: '1',
    offspring_gender: 'male',
    offspring_details: '',
  });
  const pregnancyHelp = getLocalizedFeatureHelp('pregnancyCalendar', i18n.resolvedLanguage || i18n.language);

  const animalTypes = Object.keys(DURATION_META).map((type) => ({
    key: type,
    label: t(`pregnancy.${type}`, { defaultValue: type }),
    icon: DURATION_META[type].icon,
    iconSet: DURATION_META[type].iconSet,
    accent: DURATION_META[type].accent,
  }));

  const loadData = useCallback(async () => {
    try {
      setError('');
      setLoading(true);

      const [durationsRes, recordsRes, statsRes] = await Promise.all([
        pregnancyService.getDurations(),
        pregnancyService.getRecords(),
        pregnancyService.getStats(),
      ]);

      const durationMap = {};

      if (durationsRes?.success && Array.isArray(durationsRes.data)) {
        durationsRes.data.forEach((item) => {
          if (item?.animal_type && item?.duration_days) {
            durationMap[item.animal_type] = Number(item.duration_days);
          }
        });
      }

      setPregnancyDurations(durationMap);
      setPregnancyRecords(
        recordsRes?.success && Array.isArray(recordsRes.data) ? recordsRes.data : []
      );
      setStats(statsRes?.success && statsRes?.data ? statsRes.data : DEFAULT_STATS);
    } catch (loadError) {
      console.error('Error loading pregnancy data:', loadError);
      setError(t('pregnancy.loadFailed', { defaultValue: 'Failed to load pregnancy data' }));
      setPregnancyDurations({});
      setStats(DEFAULT_STATS);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const resetAddForm = useCallback(() => {
    setFormData({
      animal_type: 'cow',
      animal_name: '',
      ear_badge_number: '',
      pregnancy_duration_days: '',
      mating_date: getDateOnlyValue(new Date()),
      notes: '',
    });
  }, []);

  const resetDeliveryForm = useCallback(() => {
    setDeliveryData({
      delivery_date: getDateOnlyValue(new Date()),
      offspring_count: '1',
      offspring_gender: 'male',
      offspring_details: '',
    });
  }, []);

  const getAnimalMeta = useCallback(
    (animalType) => {
      const normalizedType = animalType?.toLowerCase() || 'cow';
      const resolvedType = DURATION_META[normalizedType]
        ? normalizedType
        : 'other';
      const base = DURATION_META[resolvedType];

      return {
        ...base,
        key: resolvedType,
        label: t(`pregnancy.${resolvedType}`, {
          defaultValue: resolvedType,
        }),
      };
    },
    [t]
  );

  const getDurationDays = useCallback(
    (animalType, customDuration = null) => {
      if (animalType === 'other') {
        return Number(customDuration) || DURATION_META.other.days;
      }

      return (
        pregnancyDurations[animalType] ||
        DURATION_META[animalType]?.days ||
        DURATION_META.other.days
      );
    },
    [pregnancyDurations]
  );

  const formatPregnancyDuration = useCallback(
    (days) => {
      if (!days || Number.isNaN(Number(days))) {
        return '';
      }

      const totalDays = Math.round(Number(days));
      const months = Math.floor(totalDays / 30);
      const remainingDays = totalDays % 30;

      if (months > 0 && remainingDays > 0) {
        return `${months} ${t('pregnancy.monthsLabel', {
          defaultValue: 'months',
        })} ${remainingDays} ${t('pregnancy.days')}`;
      }

      if (months > 0) {
        return `${months} ${t('pregnancy.monthsLabel', {
          defaultValue: 'months',
        })}`;
      }

      return `${remainingDays} ${t('pregnancy.days')}`;
    },
    [t]
  );

  const getStatusConfig = useCallback(
    (status) => {
      const config = {
        pregnant: {
          backgroundColor: '#DCFCE7',
          textColor: '#166534',
          label: t('pregnancy.statusActive', { defaultValue: t('pregnancy.active') }),
        },
        delivered: {
          backgroundColor: '#DBEAFE',
          textColor: '#1D4ED8',
          label: t('pregnancy.statusDelivered', {
            defaultValue: t('pregnancy.delivered'),
          }),
        },
        miscarriage: {
          backgroundColor: '#FEE2E2',
          textColor: '#B91C1C',
          label: t('pregnancy.statusMiscarriage', { defaultValue: 'Miscarriage' }),
        },
        false_pregnancy: {
          backgroundColor: '#FEF3C7',
          textColor: '#B45309',
          label: t('pregnancy.statusFalsePregnancy', {
            defaultValue: 'False Pregnancy',
          }),
        },
        cancelled: {
          backgroundColor: '#E5E7EB',
          textColor: '#4B5563',
          label: t('pregnancy.statusCancelled', { defaultValue: 'Cancelled' }),
        },
      };

      return config[status] || config.pregnant;
    },
    [t]
  );

  const getProgressColor = useCallback((daysRemaining, totalDays) => {
    const progress = ((totalDays - daysRemaining) / totalDays) * 100;

    if (progress < 30) return '#2563EB';
    if (progress < 60) return COLORS.primary;
    if (progress < 85) return '#EA580C';
    return '#DC2626';
  }, []);

  const getRecordDurationDays = useCallback(
    (record) =>
      Number(record?.pregnancy_duration_days) ||
      getDurationDays(record?.animal_type, record?.pregnancy_duration_days),
    [getDurationDays]
  );

  const getRecordProgress = useCallback(
    (record) => {
      if (record?.status !== 'pregnant') {
        return 100;
      }

      const progressPercentage = Number(record?.progress_percentage);

      if (Number.isFinite(progressPercentage)) {
        return Math.min(100, Math.max(0, Math.round(progressPercentage)));
      }

      const totalDays = getRecordDurationDays(record);
      const matingDate = new Date(record.mating_date);
      const today = new Date();
      const daysPassed = Math.floor(
        (today - matingDate) / (1000 * 60 * 60 * 24)
      );

      return Math.min(100, Math.max(0, Math.round((daysPassed / totalDays) * 100)));
    },
    [getRecordDurationDays]
  );

  const getDaysRemaining = useCallback((record) => {
    if (record?.status !== 'pregnant') {
      return 0;
    }

    const providedDaysRemaining = Number(record?.days_remaining);

    if (Number.isFinite(providedDaysRemaining)) {
      return Math.max(0, providedDaysRemaining);
    }

    const expectedDate = new Date(record.expected_delivery_date);
    const today = new Date();
    return Math.max(
      0,
      Math.ceil((expectedDate - today) / (1000 * 60 * 60 * 24))
    );
  }, []);

  const getDaysInMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  const getFirstDayOfMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const navigateMonth = (direction) => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + direction);
    setCurrentMonth(nextMonth);
  };

  const getRecordsForDate = useCallback(
    (date) => {
      if (!date) return [];

      const dateValue = getDateOnlyValue(date);

      return pregnancyRecords.filter((record) => {
        if (record.status === 'pregnant') {
          return (
            dateValue >= record.mating_date &&
            dateValue <= record.expected_delivery_date
          );
        }

        if (record.status === 'delivered' && record.actual_delivery_date) {
          return record.actual_delivery_date === dateValue;
        }

        return false;
      });
    },
    [pregnancyRecords]
  );

  const isDueDate = useCallback(
    (date) => {
      const dateValue = getDateOnlyValue(date);
      return pregnancyRecords.some(
        (record) =>
          record.status === 'pregnant' &&
          record.expected_delivery_date === dateValue
      );
    },
    [pregnancyRecords]
  );

  const getFilteredRecords = useCallback(() => {
    if (activeTab === 'active') {
      return pregnancyRecords.filter((record) => record.status === 'pregnant');
    }

    if (activeTab === 'delivered') {
      return pregnancyRecords.filter((record) => record.status === 'delivered');
    }

    return pregnancyRecords;
  }, [activeTab, pregnancyRecords]);

  const getSelectedDateRecords = useCallback(() => {
    const records = getRecordsForDate(selectedDate);

    if (activeTab === 'active') {
      return records.filter((record) => record.status === 'pregnant');
    }

    if (activeTab === 'delivered') {
      return records.filter((record) => record.status === 'delivered');
    }

    return records;
  }, [activeTab, getRecordsForDate, selectedDate]);

  const getExpectedDeliveryPreview = useCallback(() => {
    if (!formData.mating_date) return '';

    const durationDays = getDurationDays(
      formData.animal_type,
      formData.pregnancy_duration_days
    );

    if (!durationDays) return '';

    const expectedDate = new Date(formData.mating_date);

    if (Number.isNaN(expectedDate.getTime())) {
      return '';
    }

    expectedDate.setDate(expectedDate.getDate() + Number(durationDays));
    return formatDisplayDate(expectedDate.toISOString(), localeCode);
  }, [formData, getDurationDays, localeCode]);

  const handleCreateRecord = async () => {
    if (!formData.animal_name.trim()) {
      Alert.alert(t('common.error'), t('pregnancy.nameRequired'));
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!dateRegex.test(formData.mating_date)) {
      Alert.alert(t('common.error'), t('pregnancy.invalidDateFormat'));
      return;
    }

    if (
      formData.animal_type === 'other' &&
      (!Number(formData.pregnancy_duration_days) ||
        Number(formData.pregnancy_duration_days) <= 0)
    ) {
      Alert.alert(
        t('common.error'),
        t('pregnancy.placeholderCustomPregnancyDurationDays', {
          defaultValue: 'Enter custom pregnancy duration in days',
        })
      );
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        animal_type: formData.animal_type,
        animal_name: formData.animal_name.trim(),
        ear_badge_number: formData.ear_badge_number.trim() || null,
        pregnancy_duration_days:
          formData.animal_type === 'other'
            ? Number(formData.pregnancy_duration_days)
            : null,
        mating_date: formData.mating_date,
        notes: formData.notes.trim() || null,
      };

      const response = await pregnancyService.createRecord(payload);

      if (response?.success) {
        Alert.alert(t('common.success'), t('pregnancy.recordCreated'));
        setShowAddModal(false);
        resetAddForm();
        await loadData();
      } else {
        Alert.alert(
          t('common.error'),
          response?.message || t('pregnancy.recordCreatedError')
        );
      }
    } catch (createError) {
      console.error('Error creating pregnancy record:', createError);
      Alert.alert(
        t('common.error'),
        createError?.message || t('pregnancy.recordCreatedError')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkDelivered = async () => {
    if (!selectedRecord) return;

    setDeliverySubmitting(true);

    try {
      const response = await pregnancyService.markDelivered(selectedRecord.id, {
        delivery_date: deliveryData.delivery_date,
        offspring_count: Number(deliveryData.offspring_count) || 1,
        offspring_gender: deliveryData.offspring_gender || null,
        offspring_details: deliveryData.offspring_details.trim() || null,
      });

      if (response?.success) {
        Alert.alert(t('pregnancy.congratulations'), t('pregnancy.deliveryRecorded'));
        setShowDeliveryModal(false);
        setSelectedRecord(null);
        resetDeliveryForm();
        await loadData();
      } else {
        Alert.alert(
          t('common.error'),
          response?.message || t('pregnancy.deliveryRecordedError')
        );
      }
    } catch (deliveryError) {
      console.error('Error recording delivery:', deliveryError);
      Alert.alert(
        t('common.error'),
        deliveryError?.message || t('pregnancy.deliveryRecordedError')
      );
    } finally {
      setDeliverySubmitting(false);
    }
  };

  const handleDeleteRecord = (record) => {
    Alert.alert(
      t('pregnancy.deleteRecord'),
      t('pregnancy.deleteConfirm', { name: record.animal_name }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await pregnancyService.deleteRecord(record.id);

              if (response?.success) {
                Alert.alert(t('common.success'), t('pregnancy.deleteSuccess'));
                await loadData();
              } else {
                Alert.alert(t('common.error'), t('pregnancy.deleteError'));
              }
            } catch (deleteError) {
              console.error('Error deleting pregnancy record:', deleteError);
              Alert.alert(t('common.error'), t('pregnancy.deleteError'));
            }
          },
        },
      ]
    );
  };

  const openDeliveryModal = (record) => {
    setSelectedRecord(record);
    setDeliveryData((current) => ({
      ...current,
      delivery_date: getDateOnlyValue(new Date()),
    }));
    setShowDeliveryModal(true);
  };

  const renderSummaryCard = (icon, title, value, accentColor, softColor) => (
    <View style={styles.summaryCard} key={title}>
      <View style={styles.summaryCopy}>
        <Text style={styles.summaryLabel}>{title}</Text>
        <Text style={styles.summaryValue}>{value}</Text>
      </View>
      <View
        style={[
          styles.summaryIconWrap,
          {
            backgroundColor: softColor,
            borderColor: accentColor + '33',
          },
        ]}
      >
        <Ionicons name={icon} size={22} color={accentColor} />
      </View>
    </View>
  );

  const renderAnimalIcon = (animalMeta, size = 20) => {
    if (animalMeta.iconSet === 'material-community') {
      return (
        <MaterialCommunityIcons
          name={animalMeta.icon || 'cow'}
          size={size}
          color={animalMeta.accent}
        />
      );
    }

    return (
      <Ionicons
        name={animalMeta.icon || 'apps-outline'}
        size={size}
        color={animalMeta.accent}
      />
    );
  };

  const renderRecordCard = (record, { showActions = true } = {}) => {
    const animalMeta = getAnimalMeta(record.animal_type);
    const totalDays = getRecordDurationDays(record);
    const daysRemaining = getDaysRemaining(record);
    const progress = getRecordProgress(record);
    const progressColor = getProgressColor(daysRemaining, totalDays);
    const statusConfig = getStatusConfig(record.status);

    return (
      <View key={record.id} style={styles.recordCard}>
        <View style={styles.recordTopRow}>
          <View style={styles.recordAnimalRow}>
            <View
              style={[
                styles.recordAnimalBadge,
                { backgroundColor: animalMeta.accent + '18' },
              ]}
            >
              {renderAnimalIcon(animalMeta, 24)}
            </View>

            <View style={styles.recordAnimalCopy}>
              <Text style={styles.recordAnimalName}>{record.animal_name}</Text>
              <Text style={styles.recordAnimalMetaText}>
                {record.ear_badge_number
                  ? `${t('pregnancy.earBadgeNumberShort', {
                      defaultValue: 'Tag',
                    })}: ${record.ear_badge_number}`
                  : record.breed_name || animalMeta.label}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusConfig.backgroundColor },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                { color: statusConfig.textColor },
              ]}
            >
              {statusConfig.label}
            </Text>
          </View>
        </View>

        <View style={styles.detailGrid}>
          <View style={styles.detailTile}>
            <Text style={styles.detailTileLabel}>{t('pregnancy.matingDate')}</Text>
              <Text style={styles.detailTileValue}>
              {formatDisplayDate(record.mating_date, localeCode)}
            </Text>
          </View>

          <View style={styles.detailTile}>
            <Text style={styles.detailTileLabel}>
              {t('pregnancy.expectedDelivery')}
            </Text>
            <Text style={[styles.detailTileValue, styles.detailTileAccent]}>
              {formatDisplayDate(record.expected_delivery_date, localeCode)}
            </Text>
          </View>
        </View>

        <View style={styles.detailGrid}>
          <View style={styles.detailTile}>
            <Text style={styles.detailTileLabel}>{t('pregnancy.animalType')}</Text>
            <Text style={styles.detailTileValue}>{animalMeta.label}</Text>
          </View>

          <View style={styles.detailTile}>
            <Text style={styles.detailTileLabel}>
              {t('pregnancy.customPregnancyDurationDays', {
                defaultValue: 'Pregnancy Duration',
              })}
            </Text>
            <Text style={styles.detailTileValue}>
              {formatPregnancyDuration(totalDays) || `${totalDays} ${t('pregnancy.days')}`}
            </Text>
          </View>
        </View>

        {record.status === 'pregnant' ? (
          <>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>{t('pregnancy.progress')}</Text>
              <Text style={[styles.progressValue, { color: progressColor }]}>
                {progress}%
              </Text>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress}%`,
                    backgroundColor: progressColor,
                  },
                ]}
              />
            </View>

            <View style={styles.remainingBanner}>
              <Text style={styles.remainingBannerLabel}>
                {t('pregnancy.daysRemaining')}
              </Text>
              <Text style={styles.remainingBannerValue}>
                {daysRemaining} {t('pregnancy.days')}
              </Text>
            </View>
          </>
        ) : null}

        {record.notes ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>{t('pregnancy.notes')}</Text>
            <Text style={styles.notesText}>{record.notes}</Text>
          </View>
        ) : null}

        {record.status === 'delivered' && record.actual_delivery_date ? (
          <View style={styles.deliveryBanner}>
            <Text style={styles.deliveryBannerText}>
              {t('pregnancy.statusDelivered', {
                defaultValue: t('pregnancy.delivered'),
              })}{' '}
              {formatDisplayDate(record.actual_delivery_date, localeCode)}
              {record.offspring_count
                ? ` - ${record.offspring_count} ${t('pregnancy.count', {
                    defaultValue: 'count',
                  })}`
                : ''}
            </Text>
          </View>
        ) : null}

        {showActions && record.status === 'pregnant' ? (
          <View style={styles.recordActions}>
            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={() => openDeliveryModal(record)}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={styles.primaryActionText}>
                {t('pregnancy.markDelivered')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dangerActionButton}
              onPress={() => handleDeleteRecord(record)}
              activeOpacity={0.85}
            >
              <Ionicons name="trash-outline" size={18} color="#B91C1C" />
              <Text style={styles.dangerActionText}>
                {t('pregnancy.delete', { defaultValue: 'Delete' })}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];
    const todayValue = getDateOnlyValue(new Date());
    const selectedDateValue = selectedDate ? getDateOnlyValue(selectedDate) : null;

    for (let index = 0; index < firstDay; index += 1) {
      days.push(<View key={`empty-${index}`} style={styles.calendarPlaceholder} />);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dateValue = getDateOnlyValue(date);
      const recordsForDate = getRecordsForDate(date);
      const dueDate = isDueDate(date);
      const isToday = dateValue === todayValue;
      const isSelected = selectedDateValue === dateValue;

      let cellStyle = styles.calendarDayButton;
      let dayTextStyle = styles.calendarDayText;

      if (recordsForDate.length > 0) {
        cellStyle = [cellStyle, styles.calendarDayHasRecord];
      }

      if (dueDate) {
        cellStyle = [cellStyle, styles.calendarDayDue];
        dayTextStyle = [dayTextStyle, styles.calendarDayDueText];
      }

      if (isToday) {
        cellStyle = [cellStyle, styles.calendarDayToday];
        dayTextStyle = [dayTextStyle, styles.calendarDayTodayText];
      }

      if (isSelected) {
        cellStyle = [cellStyle, styles.calendarDaySelected];
        dayTextStyle = [dayTextStyle, styles.calendarDaySelectedText];
      }

      days.push(
        <TouchableOpacity
          key={dateValue}
          style={cellStyle}
          onPress={() => setSelectedDate(date)}
          activeOpacity={0.85}
        >
          <View style={styles.calendarDayHeader}>
            <Text style={dayTextStyle}>{day}</Text>
            {recordsForDate.length > 0 ? (
              <View style={styles.calendarCountBadge}>
                <Text style={styles.calendarCountText}>
                  {recordsForDate.length}
                </Text>
              </View>
            ) : null}
          </View>

          {dueDate ? (
            <Text style={styles.calendarHintText} numberOfLines={1}>
              {t('pregnancy.due')}
            </Text>
          ) : recordsForDate.length > 0 ? (
            <Text style={styles.calendarHintText} numberOfLines={1}>
              {recordsForDate[0]?.animal_name}
            </Text>
          ) : null}
        </TouchableOpacity>
      );
    }

    return days;
  };

  const filteredRecords = getFilteredRecords();
  const selectedDateRecords = getSelectedDateRecords();
  const currentDurationDays = getDurationDays(
    formData.animal_type,
    formData.pregnancy_duration_days
  );

  if (!ready || loading) {
    return (
      <SafeAreaView style={styles.loaderSafeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loaderContent}>
          <CowLoader message={t('pregnancy.loadingCalendar')} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <AppHeader
        safeArea={false}
        navigation={navigation}
        title={t('pregnancy.pageTitle', { defaultValue: t('pregnancy.title') })}
        subtitle={t('pregnancy.pageDescription', {
          defaultValue: t('pregnancy.subtitle'),
        })}
        rightActions={[
          {
            icon: 'help-circle-outline',
            onPress: () => setHelpVisible(true),
            color: COLORS.primary,
            backgroundColor: COLORS.primarySoft,
            accessibilityLabel: 'Open pregnancy calendar help',
          },
          {
            icon: 'add',
            onPress: () => setShowAddModal(true),
            color: COLORS.surface,
            backgroundColor: COLORS.primary,
            accessibilityLabel: 'Add pregnancy record',
          },
        ]}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 28,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={18} color="#B91C1C" />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.summaryRow}
        >
          {renderSummaryCard(
            'leaf-outline',
            t('pregnancy.activePregnancies'),
            stats.active_pregnancies || 0,
            '#15803D',
            '#DCFCE7'
          )}
          {renderSummaryCard(
            'happy-outline',
            t('pregnancy.delivered'),
            stats.successful_deliveries || 0,
            '#2563EB',
            '#DBEAFE'
          )}
          {renderSummaryCard(
            'alarm-outline',
            t('pregnancy.dueSoon'),
            stats.upcoming_deliveries?.length || 0,
            '#EA580C',
            '#FFEDD5'
          )}
          {renderSummaryCard(
            'stats-chart-outline',
            t('pregnancy.totalRecords'),
            stats.total_records || 0,
            '#7C3AED',
            '#EDE9FE'
          )}
        </ScrollView>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                {t('pregnancy.pregnancyDurationReference')}
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.referenceChipRow}
          >
            {animalTypes.map((animal) => {
              const durationDays = getDurationDays(animal.key);
              const monthMeta = DURATION_META[animal.key]?.months;
              const durationText =
                animal.key === 'other'
                  ? t('pregnancy.customDurationRequired', {
                      defaultValue: 'Custom duration required',
                    })
                  : formatPregnancyDuration(durationDays) ||
                    `${monthMeta} ${t('pregnancy.monthsLabel', {
                      defaultValue: 'months',
                    })}`;

              return (
                <View key={animal.key} style={styles.referenceChip}>
                  <View
                    style={[
                      styles.referenceIconBadge,
                      { backgroundColor: animal.accent + '16' },
                    ]}
                  >
                    {renderAnimalIcon(animal, 18)}
                  </View>
                  <Text style={styles.referenceLabel} numberOfLines={1}>
                    {animal.label}
                  </Text>
                  <Text style={styles.referenceValue} numberOfLines={1}>
                    {durationText}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.calendarHeaderRow}>
            <TouchableOpacity
              style={styles.monthNavButton}
              onPress={() => navigateMonth(-1)}
              activeOpacity={0.85}
            >
              <Ionicons name="chevron-back" size={20} color={COLORS.text} />
            </TouchableOpacity>

            <Text style={styles.monthTitle}>
              {getMonthTitle(currentMonth, localeCode)}
            </Text>

            <TouchableOpacity
              style={styles.monthNavButton}
              onPress={() => navigateMonth(1)}
              activeOpacity={0.85}
            >
              <Ionicons name="chevron-forward" size={20} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekdayRow}>
            {[
              t('pregnancy.sun', { defaultValue: 'Sun' }),
              t('pregnancy.mon', { defaultValue: 'Mon' }),
              t('pregnancy.tue', { defaultValue: 'Tue' }),
              t('pregnancy.wed', { defaultValue: 'Wed' }),
              t('pregnancy.thu', { defaultValue: 'Thu' }),
              t('pregnancy.fri', { defaultValue: 'Fri' }),
              t('pregnancy.sat', { defaultValue: 'Sat' }),
            ].map((day) => (
              <Text key={day} style={styles.weekdayText}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>{renderCalendarDays()}</View>

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendSwatch, { backgroundColor: '#DCFCE7' }]}
              />
              <Text style={styles.legendText}>{t('pregnancy.today')}</Text>
            </View>

            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendSwatch,
                  {
                    backgroundColor: '#FFF7ED',
                    borderColor: '#EA580C',
                    borderWidth: 1,
                  },
                ]}
              />
              <Text style={styles.legendText}>{t('pregnancy.pregnant')}</Text>
            </View>

            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendSwatch,
                  {
                    backgroundColor: '#FEF2F2',
                    borderColor: '#DC2626',
                    borderWidth: 1,
                  },
                ]}
              />
              <Text style={styles.legendText}>{t('pregnancy.dueDate')}</Text>
            </View>
          </View>

          <View style={styles.tabRow}>
            {[
              { key: 'active', label: t('pregnancy.active') },
              { key: 'delivered', label: t('pregnancy.delivered') },
              { key: 'all', label: t('pregnancy.all') },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tabButton,
                  activeTab === tab.key && styles.tabButtonActive,
                ]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    activeTab === tab.key && styles.tabButtonTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.selectedDateHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                {t('pregnancy.selectedDateDetails', {
                  defaultValue: 'Selected Date Details',
                })}
              </Text>
              <Text style={styles.sectionSubtitle}>
                {selectedDate
                  ? formatDisplayDate(selectedDate.toISOString(), localeCode)
                  : t('pregnancy.selectDateForDetails', {
                      defaultValue: 'Select a date to see details',
                    })}
              </Text>
            </View>

            {selectedDate ? (
              <View style={styles.selectedDateCountBadge}>
                <Text style={styles.selectedDateCountText}>
                  {selectedDateRecords.length}{' '}
                  {selectedDateRecords.length === 1
                    ? t('pregnancy.recordSingular', { defaultValue: 'record' })
                    : t('pregnancy.recordsLabel', { defaultValue: 'records' })}
                </Text>
              </View>
            ) : null}
          </View>

          {selectedDate ? (
            selectedDateRecords.length > 0 ? (
              <View style={styles.recordList}>
                {selectedDateRecords.map((record) => renderRecordCard(record))}
              </View>
            ) : (
              <View style={styles.emptyPanel}>
                <Ionicons
                  name="calendar-outline"
                  size={32}
                  color={COLORS.borderStrong}
                />
                <Text style={styles.emptyPanelTitle}>
                  {t('pregnancy.noRecordsForSelectedDate', {
                    defaultValue: 'No records for this date',
                  })}
                </Text>
                <Text style={styles.emptyPanelText}>
                  {t('pregnancy.selectAnotherDateHint', {
                    defaultValue: 'Choose another date to see pregnancy details',
                  })}
                </Text>
              </View>
            )
          ) : (
            <View style={styles.emptyPanel}>
              <Ionicons
                name="hand-left-outline"
                size={32}
                color={COLORS.borderStrong}
              />
              <Text style={styles.emptyPanelTitle}>
                {t('pregnancy.selectDateForDetails', {
                  defaultValue: 'Select a date to see details',
                })}
              </Text>
              <Text style={styles.emptyPanelText}>
                {t('pregnancy.tapCalendarDateHint', {
                  defaultValue: 'Tap any calendar day to view related records',
                })}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                {activeTab === 'active'
                  ? t('pregnancy.activePregnancies')
                  : activeTab === 'delivered'
                  ? t('pregnancy.delivered')
                  : t('pregnancy.allRecords')}
              </Text>
              <Text style={styles.sectionSubtitle}>
                {t('pregnancy.pageDescription', {
                  defaultValue: 'Track and manage your animals',
                })}
              </Text>
            </View>
          </View>

          {filteredRecords.length > 0 ? (
            <View style={styles.recordList}>
              {filteredRecords.map((record) => renderRecordCard(record))}
            </View>
          ) : (
            <View style={styles.emptyPanel}>
              <Ionicons
                name="calendar-clear-outline"
                size={32}
                color={COLORS.borderStrong}
              />
              <Text style={styles.emptyPanelTitle}>
                {t('pregnancy.noRecordsFound')}
              </Text>
              <Text style={styles.emptyPanelText}>
                {t('pregnancy.noRecordsDesc', {
                  defaultValue: 'Add a record to begin tracking pregnancy',
                })}
              </Text>
            </View>
          )}
        </View>

        {stats.upcoming_deliveries?.length > 0 ? (
          <View style={[styles.sectionCard, styles.alertSection]}>
            <View style={styles.alertHeader}>
              <Ionicons name="alarm-outline" size={18} color="#C2410C" />
              <Text style={styles.alertTitle}>
                {t('pregnancy.dueWithin30Days')}
              </Text>
            </View>

            <View style={styles.alertList}>
              {stats.upcoming_deliveries.slice(0, 3).map((item) => {
                const animalMeta = getAnimalMeta(item.animal_type);

                return (
                  <View key={item.id} style={styles.alertItem}>
                    <View style={styles.alertAnimal}>
                      <View
                        style={[
                          styles.alertIconBadge,
                          { backgroundColor: animalMeta.accent + '18' },
                        ]}
                      >
                        {renderAnimalIcon(animalMeta, 18)}
                      </View>
                      <Text style={styles.alertName}>{item.animal_name}</Text>
                    </View>

                    <Text style={styles.alertDays}>
                      {item.days_remaining} {t('pregnancy.days')}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <FeatureHelpModal
        visible={helpVisible}
        onClose={() => setHelpVisible(false)}
        title={pregnancyHelp?.localized?.title || t('pregnancy.pageTitle', { defaultValue: t('pregnancy.title') })}
        imageSource={pregnancyHelp?.image}
        helpContent={pregnancyHelp?.localized}
        t={t}
      />

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          if (!submitting) {
            setShowAddModal(false);
            resetAddForm();
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {t('pregnancy.addPregnancyRecord')}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {t('pregnancy.pageDescription', {
                    defaultValue: 'Track and manage your animals',
                  })}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  if (!submitting) {
                    setShowAddModal(false);
                    resetAddForm();
                  }
                }}
                disabled={submitting}
              >
                <Ionicons name="close" size={22} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.inputLabel}>{t('pregnancy.animalType')}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.typeChipRow}
              >
                {animalTypes.map((animal) => (
                  <TouchableOpacity
                    key={animal.key}
                    style={[
                      styles.typeChip,
                      formData.animal_type === animal.key && styles.typeChipActive,
                    ]}
                    onPress={() =>
                      setFormData((current) => ({
                        ...current,
                        animal_type: animal.key,
                        pregnancy_duration_days:
                          animal.key === 'other'
                            ? current.pregnancy_duration_days
                            : '',
                      }))
                    }
                    activeOpacity={0.85}
                  >
                    {renderAnimalIcon(animal, 17)}
                    <Text
                      style={[
                        styles.typeChipText,
                        formData.animal_type === animal.key &&
                          styles.typeChipTextActive,
                      ]}
                    >
                      {animal.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {formData.animal_type === 'other' ? (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {t('pregnancy.customPregnancyDurationDays', {
                      defaultValue: 'Pregnancy Duration in Days',
                    })}
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={formData.pregnancy_duration_days}
                    onChangeText={(text) =>
                      setFormData((current) => ({
                        ...current,
                        pregnancy_duration_days: text.replace(/[^0-9]/g, ''),
                      }))
                    }
                    keyboardType="numeric"
                    placeholder={t('pregnancy.placeholderCustomPregnancyDurationDays', {
                      defaultValue: 'Enter custom pregnancy duration in days',
                    })}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('pregnancy.animalName')}</Text>
                <TextInput
                  style={styles.input}
                  value={formData.animal_name}
                  onChangeText={(text) =>
                    setFormData((current) => ({
                      ...current,
                      animal_name: text,
                    }))
                  }
                  placeholder={t('pregnancy.placeholderAnimalName', {
                    defaultValue: t('pregnancy.enterAnimalName'),
                  })}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {t('pregnancy.earBadgeNumber', { defaultValue: 'Ear Badge Number' })}
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData.ear_badge_number}
                  onChangeText={(text) =>
                    setFormData((current) => ({
                      ...current,
                      ear_badge_number: text,
                    }))
                  }
                  placeholder={t('pregnancy.earBadgeNumber', {
                    defaultValue: 'Ear Badge Number',
                  })}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('pregnancy.matingDate')}</Text>
                <TextInput
                  style={styles.input}
                  value={formData.mating_date}
                  onChangeText={(text) =>
                    setFormData((current) => ({
                      ...current,
                      mating_date: text,
                    }))
                  }
                  placeholder={t('pregnancy.dateFormatPlaceholder')}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.infoBanner}>
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color={COLORS.primary}
                />
                <Text style={styles.infoBannerText}>
                  {t('pregnancy.expectedDelivery')}: {getExpectedDeliveryPreview() || '--'}
                  {'  '}|{'  '}
                  {formData.animal_type === 'other'
                    ? formatPregnancyDuration(formData.pregnancy_duration_days) ||
                      t('pregnancy.enterCustomDurationHint', {
                        defaultValue: 'Enter custom duration',
                      })
                    : formatPregnancyDuration(currentDurationDays)}
                  {'  '}
                  {t('pregnancy.fromMatingDate', {
                    defaultValue: 'from mating date',
                  })}
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('pregnancy.notes')}</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.notes}
                  onChangeText={(text) =>
                    setFormData((current) => ({
                      ...current,
                      notes: text,
                    }))
                  }
                  placeholder={t('pregnancy.placeholderNotes', {
                    defaultValue: t('pregnancy.notesPlaceholder'),
                  })}
                  placeholderTextColor="#9CA3AF"
                  multiline
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={styles.secondaryModalButton}
                  onPress={() => {
                    if (!submitting) {
                      setShowAddModal(false);
                      resetAddForm();
                    }
                  }}
                  disabled={submitting}
                  activeOpacity={0.85}
                >
                  <Text style={styles.secondaryModalButtonText}>
                    {t('pregnancy.cancel')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.primaryModalButton,
                    submitting && styles.primaryModalButtonDisabled,
                  ]}
                  onPress={handleCreateRecord}
                  disabled={submitting}
                  activeOpacity={0.85}
                >
                  {submitting ? (
                    <>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={styles.primaryModalButtonText}>
                        {t('pregnancy.addingRecord', {
                          defaultValue: t('pregnancy.creating'),
                        })}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.primaryModalButtonText}>
                      {t('pregnancy.addRecord', {
                        defaultValue: t('pregnancy.createRecord'),
                      })}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDeliveryModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          if (!deliverySubmitting) {
            setShowDeliveryModal(false);
            setSelectedRecord(null);
            resetDeliveryForm();
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {t('pregnancy.recordDelivery')}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {selectedRecord?.animal_name || ''}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  if (!deliverySubmitting) {
                    setShowDeliveryModal(false);
                    setSelectedRecord(null);
                    resetDeliveryForm();
                  }
                }}
                disabled={deliverySubmitting}
              >
                <Ionicons name="close" size={22} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {selectedRecord ? (
              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={styles.modalContent}
                showsVerticalScrollIndicator={false}
              >
              <View style={styles.deliveryAnimalCard}>
                  <View style={styles.deliveryAnimalIconBadge}>
                    {renderAnimalIcon(getAnimalMeta(selectedRecord.animal_type), 28)}
                  </View>

                  <View style={styles.deliveryAnimalCopy}>
                    <Text style={styles.deliveryAnimalName}>
                      {selectedRecord.animal_name}
                    </Text>
                    <Text style={styles.deliveryAnimalMeta}>
                      {selectedRecord.ear_badge_number
                        ? `${t('pregnancy.earBadgeNumberShort', {
                            defaultValue: 'Tag',
                          })}: ${selectedRecord.ear_badge_number}`
                        : selectedRecord.breed_name ||
                          getAnimalMeta(selectedRecord.animal_type).label}
                    </Text>
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, styles.inputHalf]}>
                    <Text style={styles.inputLabel}>
                      {t('pregnancy.deliveryDateLabel', {
                        defaultValue: 'Delivery Date',
                      })}
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={deliveryData.delivery_date}
                      onChangeText={(text) =>
                        setDeliveryData((current) => ({
                          ...current,
                          delivery_date: text,
                        }))
                      }
                      placeholder={t('pregnancy.dateFormatPlaceholder')}
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  <View style={[styles.inputGroup, styles.inputHalf]}>
                    <Text style={styles.inputLabel}>
                      {t('pregnancy.numberOfOffspring')}
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={deliveryData.offspring_count}
                      onChangeText={(text) =>
                        setDeliveryData((current) => ({
                          ...current,
                          offspring_count: text.replace(/[^0-9]/g, ''),
                        }))
                      }
                      keyboardType="numeric"
                      placeholder="1"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {t('pregnancy.genders', {
                      defaultValue: t('pregnancy.gender', {
                        defaultValue: 'Gender',
                      }),
                    })}
                  </Text>
                  <View style={styles.segmentRow}>
                    {[
                      {
                        key: 'male',
                        label: t('pregnancy.genderMale', { defaultValue: 'Male' }),
                      },
                      {
                        key: 'female',
                        label: t('pregnancy.genderFemale', {
                          defaultValue: 'Female',
                        }),
                      },
                      {
                        key: 'mixed',
                        label: t('pregnancy.genderMixed', { defaultValue: 'Mixed' }),
                      },
                    ].map((option) => (
                      <TouchableOpacity
                        key={option.key}
                        style={[
                          styles.segmentButton,
                          deliveryData.offspring_gender === option.key &&
                            styles.segmentButtonActive,
                        ]}
                        onPress={() =>
                          setDeliveryData((current) => ({
                            ...current,
                            offspring_gender: option.key,
                          }))
                        }
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[
                            styles.segmentButtonText,
                            deliveryData.offspring_gender === option.key &&
                              styles.segmentButtonTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {t('pregnancy.detailsOptional', {
                      defaultValue: 'Additional Details',
                    })}
                  </Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={deliveryData.offspring_details}
                    onChangeText={(text) =>
                      setDeliveryData((current) => ({
                        ...current,
                        offspring_details: text,
                      }))
                    }
                    placeholder={t('pregnancy.placeholderOffspringDetails')}
                    placeholderTextColor="#9CA3AF"
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.modalActionRow}>
                  <TouchableOpacity
                    style={styles.secondaryModalButton}
                    onPress={() => {
                      if (!deliverySubmitting) {
                        setShowDeliveryModal(false);
                        setSelectedRecord(null);
                        resetDeliveryForm();
                      }
                    }}
                    disabled={deliverySubmitting}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.secondaryModalButtonText}>
                      {t('pregnancy.cancel')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.primaryModalButton,
                      deliverySubmitting && styles.primaryModalButtonDisabled,
                    ]}
                    onPress={handleMarkDelivered}
                    disabled={deliverySubmitting}
                    activeOpacity={0.85}
                  >
                    {deliverySubmitting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={18}
                          color="#fff"
                        />
                        <Text style={styles.primaryModalButtonText}>
                          {t('pregnancy.confirmDelivery')}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F4EC',
  },
  loaderSafeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loaderContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#F7F4EC',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerBackButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E4DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
  },
  headerAddButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
  },
  pageDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textMuted,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: '#B91C1C',
    fontWeight: '500',
  },
  summaryRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  summaryCard: {
    width: 182,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE8DE',
  },
  summaryCopy: {
    flex: 1,
    paddingRight: 10,
  },
  summaryLabel: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textMuted,
    marginBottom: 6,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },
  summaryIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE8DE',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  sectionSubtitle: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textMuted,
  },
  referenceChipRow: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 6,
  },
  referenceChip: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 104,
    minHeight: 78,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  referenceIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  referenceLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    maxWidth: '100%',
  },
  referenceValue: {
    marginTop: 2,
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
    maxWidth: '100%',
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  monthNavButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayText: {
    width: '13.2%',
    marginHorizontal: '0.54%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -2,
  },
  calendarPlaceholder: {
    width: '13.2%',
    height: 82,
    marginHorizontal: '0.54%',
    marginBottom: 8,
  },
  calendarDayButton: {
    width: '13.2%',
    height: 82,
    marginHorizontal: '0.54%',
    marginBottom: 8,
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  calendarDayHasRecord: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FDBA74',
  },
  calendarDayDue: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  calendarDayToday: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  calendarDaySelected: {
    backgroundColor: '#DCF0FF',
    borderColor: '#60A5FA',
  },
  calendarDayHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  calendarDayText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  calendarDayTodayText: {
    color: '#166534',
  },
  calendarDayDueText: {
    color: '#B91C1C',
  },
  calendarDaySelectedText: {
    color: '#1D4ED8',
  },
  calendarCountBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  calendarCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  calendarHintText: {
    marginTop: 12,
    fontSize: 10,
    lineHeight: 13,
    color: COLORS.textMuted,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendSwatch: {
    width: 14,
    height: 14,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
    padding: 4,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
  },
  tabButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  selectedDateHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  selectedDateCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#ECFDF5',
  },
  selectedDateCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  recordList: {
    gap: 14,
  },
  recordCard: {
    padding: 15,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ECE8DE',
    backgroundColor: '#FCFBF7',
  },
  recordTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  recordAnimalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  recordAnimalBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordAnimalCopy: {
    flex: 1,
  },
  recordAnimalName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 2,
  },
  recordAnimalMetaText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  detailGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  detailTile: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE8DE',
  },
  detailTileLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 6,
    fontWeight: '600',
  },
  detailTileValue: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '800',
  },
  detailTileAccent: {
    color: COLORS.primaryDark,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  remainingBanner: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  remainingBannerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9A3412',
  },
  remainingBannerValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#C2410C',
  },
  notesBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE8DE',
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 5,
  },
  notesText: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.text,
  },
  deliveryBanner: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  deliveryBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  recordActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  primaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
  },
  primaryActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dangerActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  dangerActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B91C1C',
  },
  emptyPanel: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    backgroundColor: '#F8FAFC',
  },
  emptyPanelTitle: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  emptyPanelText: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  alertSection: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#9A3412',
  },
  alertList: {
    gap: 10,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  alertAnimal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  alertIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  alertDays: {
    fontSize: 12,
    fontWeight: '800',
    color: '#C2410C',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(21, 18, 12, 0.42)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#ECE8DE',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalSubtitle: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textMuted,
  },
  modalCloseButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    flexGrow: 0,
  },
  modalContent: {
    padding: 18,
    paddingBottom: 26,
  },
  typeChipRow: {
    paddingVertical: 4,
    gap: 10,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  typeChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#ECFDF5',
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  typeChipTextActive: {
    color: COLORS.primaryDark,
  },
  inputGroup: {
    marginTop: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: COLORS.text,
  },
  textArea: {
    minHeight: 104,
    paddingTop: 14,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 16,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.primaryDark,
    fontWeight: '600',
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 10,
  },
  segmentButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  segmentButtonActive: {
    backgroundColor: '#ECFDF5',
    borderColor: COLORS.primary,
  },
  segmentButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  segmentButtonTextActive: {
    color: COLORS.primaryDark,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
  },
  secondaryModalButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },
  secondaryModalButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textMuted,
  },
  primaryModalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: COLORS.primary,
  },
  primaryModalButtonDisabled: {
    backgroundColor: '#7ED8BA',
  },
  primaryModalButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  deliveryAnimalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  deliveryAnimalIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
  },
  deliveryAnimalCopy: {
    flex: 1,
  },
  deliveryAnimalName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  deliveryAnimalMeta: {
    marginTop: 3,
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
});

export default PregnancyCalendarScreen;
