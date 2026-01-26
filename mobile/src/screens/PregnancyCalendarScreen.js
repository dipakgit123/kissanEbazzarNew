import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../utils/constants';
import { pregnancyService } from '../services/api';

const PregnancyCalendarScreen = ({ navigation }) => {
  const { t, ready } = useTranslation();
  const [pregnancyRecords, setPregnancyRecords] = useState([]);
  const [myAnimals, setMyAnimals] = useState([]);
  const [pregnancyDurations, setPregnancyDurations] = useState({});
  const [stats, setStats] = useState({ active: 0, delivered: 0, dueSoon: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Show loading while translations are loading
  if (!ready) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'delivered', 'all'

  // Form states
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [matingDate, setMatingDate] = useState(new Date().toISOString().split('T')[0]);
  const [matingType, setMatingType] = useState('natural');
  const [bullSireDetails, setBullSireDetails] = useState('');
  const [notes, setNotes] = useState('');
  const [manualEntry, setManualEntry] = useState(true); // Default to manual entry for mobile
  const [manualAnimalName, setManualAnimalName] = useState('');
  const [manualAnimalType, setManualAnimalType] = useState('cow');
  const [manualBreedName, setManualBreedName] = useState('');

  // Delivery form states
  const [offspringCount, setOffspringCount] = useState('1');
  const [offspringGender, setOffspringGender] = useState('');
  const [offspringDetails, setOffspringDetails] = useState('');

  const getAnimalTypes = () => [
    { key: 'cow', label: t('pregnancy.cow'), emoji: '🐄' },
    { key: 'buffalo', label: t('pregnancy.buffalo'), emoji: '🐃' },
    { key: 'goat', label: t('pregnancy.goat'), emoji: '🐐' },
    { key: 'sheep', label: t('pregnancy.sheep'), emoji: '🐑' },
    { key: 'horse', label: t('pregnancy.horse'), emoji: '🐴' },
    { key: 'dog', label: t('pregnancy.dog'), emoji: '🐕' },
    { key: 'cat', label: t('pregnancy.cat'), emoji: '🐱' },
    { key: 'pig', label: t('pregnancy.pig'), emoji: '🐷' },
  ];
  
  const animalTypes = getAnimalTypes();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [durationsRes, animalsRes, recordsRes, statsRes] = await Promise.all([
        pregnancyService.getDurations(),
        pregnancyService.getMyAnimals(),
        pregnancyService.getRecords(),
        pregnancyService.getStats(),
      ]);

      // Process durations response - backend returns array, convert to object
      if (durationsRes?.success && durationsRes?.data) {
        const durationsObj = {};
        if (Array.isArray(durationsRes.data)) {
          durationsRes.data.forEach(item => {
            durationsObj[item.animal_type] = item.duration_days;
          });
          setPregnancyDurations(durationsObj);
        } else {
          // Fallback to default
          setPregnancyDurations({
            cow: 280,
            buffalo: 310,
            goat: 150,
            sheep: 150,
            horse: 340,
            dog: 63,
            cat: 65,
            pig: 114,
          });
        }
      } else {
        // Set default pregnancy durations if API fails
        setPregnancyDurations({
          cow: 280,
          buffalo: 310,
          goat: 150,
          sheep: 150,
          horse: 340,
          dog: 63,
          cat: 65,
          pig: 114,
        });
      }
      
      if (animalsRes?.success && animalsRes?.data) {
        setMyAnimals(Array.isArray(animalsRes.data) ? animalsRes.data : []);
      }
      
      if (recordsRes?.success && recordsRes?.data) {
        setPregnancyRecords(Array.isArray(recordsRes.data) ? recordsRes.data : []);
      }
      
      if (statsRes?.success && statsRes?.data) {
        setStats({
          active: statsRes.data.active_pregnancies || 0,
          delivered: statsRes.data.successful_deliveries || 0,
          dueSoon: statsRes.data.upcoming_deliveries?.length || 0,
          total: statsRes.data.total_records || 0
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Set default durations even on error
      setPregnancyDurations({
        cow: 280,
        buffalo: 310,
        goat: 150,
        sheep: 150,
        horse: 340,
        dog: 63,
        cat: 65,
        pig: 114,
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const getAnimalEmoji = (type) => {
    const found = animalTypes.find(a => a.key === type?.toLowerCase());
    return found?.emoji || '🐄';
  };

  const getProgressColor = (progress) => {
    if (progress < 30) return COLORS.blue || '#3B82F6';
    if (progress < 60) return COLORS.yellow || '#EAB308';
    if (progress < 90) return '#F97316';
    return COLORS.red || '#EF4444';
  };

  const calculateProgress = (record) => {
    if (record.status !== 'pregnant') return 100;
    const matingDate = new Date(record.mating_date);
    const today = new Date();
    const daysPassed = Math.floor((today - matingDate) / (1000 * 60 * 60 * 24));
    const percentage = Math.min(100, Math.max(0, (daysPassed / record.pregnancy_duration_days) * 100));
    return Math.round(percentage);
  };

  const getDaysRemaining = (record) => {
    if (record.status !== 'pregnant') return 0;
    const expectedDate = new Date(record.expected_delivery_date);
    const today = new Date();
    const diffDays = Math.ceil((expectedDate - today) / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const getRecordsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return pregnancyRecords.filter((record) => {
      if (record.status !== 'pregnant') return false;
      const matingDate = record.mating_date;
      const expectedDate = record.expected_delivery_date;
      return dateStr >= matingDate && dateStr <= expectedDate;
    });
  };

  const isExpectedDeliveryDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return pregnancyRecords.some(r => r.expected_delivery_date === dateStr && r.status === 'pregnant');
  };

  const handleCreateRecord = async () => {
    try {
      // Validate manual entry (always manual for mobile)
      if (!manualAnimalName.trim()) {
        Alert.alert(t('common.error'), t('pregnancy.nameRequired'));
        return;
      }

      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(matingDate)) {
        Alert.alert(t('common.error'), t('pregnancy.invalidDateFormat'));
        return;
      }

      setSubmitting(true);

      let recordData = {
        mating_date: matingDate,
        mating_type: matingType,
        bull_sire_details: bullSireDetails || null,
        notes: notes || null,
        animal_name: manualAnimalName.trim(),
        animal_type: manualAnimalType,
        breed_name: manualBreedName?.trim() || null,
      };

      console.log('Creating pregnancy record:', recordData);
      const response = await pregnancyService.createRecord(recordData);
      console.log('Create record response:', response);

      if (response?.success) {
        Alert.alert(t('common.success'), t('pregnancy.recordCreated'));
        setShowAddModal(false);
        resetForm();
        await loadData();
      } else {
        Alert.alert(t('common.error'), response?.message || t('pregnancy.recordCreatedError'));
      }
    } catch (error) {
      console.error('Error creating record:', error);
      Alert.alert(t('common.error'), error?.message || t('pregnancy.recordCreatedError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkDelivered = async () => {
    if (!selectedRecord) return;

    try {
      const deliveryData = {
        deliveryDate: new Date().toISOString().split('T')[0],
        offspringCount: parseInt(offspringCount) || 1,
        offspringGender: offspringGender || null,
        offspringDetails: offspringDetails || null,
      };

      const response = await pregnancyService.markDelivered(selectedRecord.id, deliveryData);

      if (response?.success) {
        Alert.alert(t('pregnancy.congratulations'), t('pregnancy.deliveryRecorded'));
        setShowDeliveryModal(false);
        setSelectedRecord(null);
        resetDeliveryForm();
        loadData();
      } else {
        Alert.alert(t('common.error'), response?.message || t('pregnancy.deliveryRecordedError'));
      }
    } catch (error) {
      console.log('Error marking delivered:', error);
      Alert.alert(t('common.error'), error.message || t('pregnancy.deliveryRecordedError'));
    }
  };

  const handleDeleteRecord = (record) => {
    Alert.alert(
      t('pregnancy.deleteRecord'),
      t('pregnancy.deleteConfirm', { name: record.animal_name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await pregnancyService.deleteRecord(record.id);
              if (response.success) {
                Alert.alert(t('common.success'), t('pregnancy.deleteSuccess'));
                loadData();
              }
            } catch (error) {
              Alert.alert(t('common.error'), t('pregnancy.deleteError'));
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setSelectedAnimal(null);
    setMatingDate(new Date().toISOString().split('T')[0]);
    setMatingType('natural');
    setBullSireDetails('');
    setNotes('');
    setManualEntry(true); // Default to manual entry for mobile
    setManualAnimalName('');
    setManualAnimalType('cow');
    setManualBreedName('');
  };

  const resetDeliveryForm = () => {
    setOffspringCount('1');
    setOffspringGender('');
    setOffspringDetails('');
  };

  const openDeliveryModal = (record) => {
    setSelectedRecord(record);
    setShowDeliveryModal(true);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarCell} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const recordsForDate = getRecordsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = date.toDateString() === selectedDate.toDateString();
      const isDeliveryDate = isExpectedDeliveryDate(date);

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarCell,
            isToday && styles.todayCell,
            isSelected && styles.selectedCell,
            isDeliveryDate && styles.deliveryDateCell,
          ]}
          onPress={() => setSelectedDate(date)}
        >
          <Text
            style={[
              styles.dayText,
              isToday && styles.todayText,
              isSelected && styles.selectedText,
              isDeliveryDate && styles.deliveryDateText,
            ]}
          >
            {day}
          </Text>
          {recordsForDate.length > 0 && (
            <View style={styles.animalIndicator}>
              {recordsForDate.slice(0, 3).map((record, idx) => (
                <Text key={record.id} style={styles.animalMiniEmoji}>
                  {getAnimalEmoji(record.animal_type)}
                </Text>
              ))}
            </View>
          )}
        </TouchableOpacity>
      );
    }

    return days;
  };

  const getFilteredRecords = () => {
    switch (activeTab) {
      case 'active':
        return pregnancyRecords.filter(r => r.status === 'pregnant');
      case 'delivered':
        return pregnancyRecords.filter(r => r.status === 'delivered');
      default:
        return pregnancyRecords;
    }
  };

  const selectedDateRecords = getRecordsForDate(selectedDate);
  const filteredRecords = getFilteredRecords();

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContent}>
          <View style={styles.loadingIconContainer}>
            <Ionicons name="calendar" size={48} color={COLORS.primary} />
          </View>
          <ActivityIndicator size="large" color={COLORS.primary} style={styles.loadingSpinner} />
          <Text style={styles.loadingText}>{t('pregnancy.loadingCalendar')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.white} />
        }
      >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="calendar" size={28} color={COLORS.white} />
        </View>
        <Text style={styles.title}>{t('pregnancy.title')}</Text>
        <Text style={styles.subtitle}>{t('pregnancy.subtitle')}</Text>
      </View>

      {/* Stats - Removed for mobile */}

      {/* Calendar */}
      <View style={styles.calendarCard}>
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={() => navigateMonth(-1)} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={() => navigateMonth(1)} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={24} color={COLORS.black} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekdaysRow}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <Text key={index} style={styles.weekdayText}>
              {day}
            </Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>{renderCalendar()}</View>

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
            <Text style={styles.legendText}>{t('pregnancy.pregnant')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>{t('pregnancy.dueDate')}</Text>
          </View>
        </View>
      </View>

      {/* Add Pregnancy Button - Prominent */}
      <View style={styles.addButtonContainer}>
        <TouchableOpacity style={styles.addPregnancyButton} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add-circle" size={24} color={COLORS.white} />
          <Text style={styles.addPregnancyButtonText}>{t('pregnancy.addPregnancyRecord')}</Text>
        </TouchableOpacity>
      </View>

      {/* Selected Date Info */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>{formatDate(selectedDate.toISOString())}</Text>
        </View>

        {selectedDateRecords.length > 0 ? (
          selectedDateRecords.map((record) => {
            const progress = calculateProgress(record);
            const daysLeft = getDaysRemaining(record);
            return (
              <View key={record.id} style={styles.animalCard}>
                <View style={styles.animalHeader}>
                  <Text style={styles.animalEmoji}>{getAnimalEmoji(record.animal_type)}</Text>
                  <View style={styles.animalInfo}>
                    <Text style={styles.animalName}>{record.animal_name}</Text>
                    <Text style={styles.animalBreed}>
                      {record.breed_name || record.animal_type} • {daysLeft} {t('pregnancy.daysLeft')}
                    </Text>
                  </View>
                  <View style={styles.progressBadge}>
                    <Text style={[styles.progressText, { color: getProgressColor(progress) }]}>
                      {progress}%
                    </Text>
                  </View>
                </View>

                <View style={styles.animalDetails}>
                  <Text style={styles.detailText}>{t('pregnancy.mating')}: {formatDate(record.mating_date)}</Text>
                  <Text style={styles.detailText}>{t('pregnancy.expected')}: {formatDate(record.expected_delivery_date)}</Text>
                </View>

                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${progress}%`, backgroundColor: getProgressColor(progress) },
                    ]}
                  />
                </View>

                <View style={styles.cardActions}>
                  {record.status === 'pregnant' && (
                    <TouchableOpacity
                      style={styles.deliverBtn}
                      onPress={() => openDeliveryModal(record)}
                    >
                      <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
                      <Text style={styles.deliverBtnText}>{t('pregnancy.markDelivered')}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteRecord(record)}
                  >
                    <Ionicons name="trash-outline" size={18} color={COLORS.red} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={COLORS.gray} />
            <Text style={styles.emptyText}>{t('pregnancy.noPregnantAnimals')}</Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {['active', 'delivered', 'all'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {t(`pregnancy.${tab}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* All Records List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {activeTab === 'active' ? t('pregnancy.activePregnancies') :
           activeTab === 'delivered' ? t('pregnancy.delivered') : t('pregnancy.allRecords')}
        </Text>

        {filteredRecords.length > 0 ? (
          filteredRecords.map((record) => {
            const progress = calculateProgress(record);
            const daysLeft = getDaysRemaining(record);
            return (
              <View key={record.id} style={styles.miniAnimalCard}>
                <Text style={styles.animalEmoji}>{getAnimalEmoji(record.animal_type)}</Text>
                <View style={styles.miniAnimalInfo}>
                  <Text style={styles.miniAnimalName}>{record.animal_name}</Text>
                  <Text style={styles.miniAnimalDate}>
                    {record.status === 'pregnant'
                      ? `${t('pregnancy.due')}: ${formatDate(record.expected_delivery_date)}`
                      : `${t('pregnancy.delivered')}: ${formatDate(record.actual_delivery_date)}`}
                  </Text>
                </View>
                {record.status === 'pregnant' ? (
                  <View style={[styles.miniBadge, { backgroundColor: getProgressColor(progress) + '20' }]}>
                    <Text style={[styles.miniBadgeText, { color: getProgressColor(progress) }]}>
                      {daysLeft}d
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.miniBadge, { backgroundColor: '#22C55E20' }]}>
                    <Ionicons name="checkmark" size={16} color="#22C55E" />
                  </View>
                )}
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{t('pregnancy.noRecordsFound')}</Text>
          </View>
        )}
      </View>

      {/* Bottom Spacer for Tab Bar */}
      <View style={{ height: 80 }} />

      {/* Add Pregnancy Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('pregnancy.addPregnancyRecord')}</Text>
              <TouchableOpacity onPress={() => { setShowAddModal(false); resetForm(); }}>
                <Ionicons name="close" size={24} color={COLORS.black} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Toggle between listing selection and manual entry */}
              {/* Manual Entry Fields - Always shown for mobile */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('pregnancy.animalName')} *</Text>
                <TextInput
                  style={styles.input}
                  value={manualAnimalName}
                  onChangeText={setManualAnimalName}
                  placeholder={t('pregnancy.enterAnimalName')}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('pregnancy.animalType')} *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.typeSelector}>
                    {animalTypes.map((type) => (
                      <TouchableOpacity
                        key={type.key}
                        style={[
                          styles.typeBtn,
                          manualAnimalType === type.key && styles.typeBtnActive,
                        ]}
                        onPress={() => setManualAnimalType(type.key)}
                      >
                        <Text style={styles.typeEmoji}>{type.emoji}</Text>
                        <Text
                          style={[
                            styles.typeText,
                            manualAnimalType === type.key && styles.typeTextActive,
                          ]}
                        >
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('pregnancy.breedOptional')}</Text>
                <TextInput
                  style={styles.input}
                  value={manualBreedName}
                  onChangeText={setManualBreedName}
                  placeholder={t('pregnancy.enterBreedName')}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Common Fields */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('pregnancy.matingDate')} *</Text>
                <TextInput
                  style={styles.input}
                  value={matingDate}
                  onChangeText={setMatingDate}
                  placeholder={t('pregnancy.dateFormatPlaceholder')}
                  placeholderTextColor="#9CA3AF"
                />
                <Text style={styles.inputHint}>{t('pregnancy.dateFormat')}</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('pregnancy.matingType')}</Text>
                <View style={styles.matingTypeRow}>
                  <TouchableOpacity
                    style={[styles.matingTypeBtn, matingType === 'natural' && styles.matingTypeBtnActive]}
                    onPress={() => setMatingType('natural')}
                  >
                    <Text style={[styles.matingTypeText, matingType === 'natural' && styles.matingTypeTextActive]}>
                      {t('pregnancy.natural')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.matingTypeBtn, matingType === 'artificial_insemination' && styles.matingTypeBtnActive]}
                    onPress={() => setMatingType('artificial_insemination')}
                  >
                    <Text style={[styles.matingTypeText, matingType === 'artificial_insemination' && styles.matingTypeTextActive]}>
                      {t('pregnancy.artificialInsemination')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('pregnancy.bullSireDetails')}</Text>
                <TextInput
                  style={styles.input}
                  value={bullSireDetails}
                  onChangeText={setBullSireDetails}
                  placeholder={t('pregnancy.enterBullSire')}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('pregnancy.notes')}</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder={t('pregnancy.notesPlaceholder')}
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Pregnancy Duration Info */}
              <View style={styles.durationInfo}>
                <Ionicons name="information-circle" size={20} color={COLORS.primary} />
                <Text style={styles.durationInfoText}>
                  {t('pregnancy.pregnancyDurationInfo', {
                    animal: animalTypes.find(a => a.key === manualAnimalType)?.label || t('pregnancy.cow'),
                    days: pregnancyDurations[manualAnimalType] || 150
                  })}
                </Text>
              </View>

              <TouchableOpacity 
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} 
                onPress={handleCreateRecord}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <ActivityIndicator size="small" color={COLORS.white} />
                    <Text style={[styles.submitBtnText, { marginLeft: 8 }]}>{t('pregnancy.creating')}</Text>
                  </>
                ) : (
                  <Text style={styles.submitBtnText}>{t('pregnancy.createRecord')}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Mark Delivered Modal */}
      <Modal visible={showDeliveryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('pregnancy.recordDelivery')}</Text>
              <TouchableOpacity onPress={() => { setShowDeliveryModal(false); resetDeliveryForm(); }}>
                <Ionicons name="close" size={24} color={COLORS.black} />
              </TouchableOpacity>
            </View>

            {selectedRecord && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.deliveryAnimalInfo}>
                  <Text style={styles.animalEmoji}>{getAnimalEmoji(selectedRecord.animal_type)}</Text>
                  <View>
                    <Text style={styles.deliveryAnimalName}>{selectedRecord.animal_name}</Text>
                    <Text style={styles.deliveryAnimalBreed}>{selectedRecord.breed_name || selectedRecord.animal_type}</Text>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('pregnancy.numberOfOffspring')}</Text>
                  <TextInput
                    style={styles.input}
                    value={offspringCount}
                    onChangeText={setOffspringCount}
                    keyboardType="numeric"
                    placeholder="1"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('pregnancy.genders')}</Text>
                  <TextInput
                    style={styles.input}
                    value={offspringGender}
                    onChangeText={setOffspringGender}
                    placeholder={t('pregnancy.genderPlaceholder')}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('pregnancy.additionalDetails')}</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={offspringDetails}
                    onChangeText={setOffspringDetails}
                    placeholder={t('pregnancy.healthStatusPlaceholder')}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#22C55E' }]} onPress={handleMarkDelivered}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                  <Text style={styles.submitBtnText}> {t('pregnancy.confirmDelivery')}</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingSpinner: {
    marginVertical: 16,
  },
  loadingText: {
    color: '#1F2937',
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.primary + '20',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  calendarCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navBtn: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: '14.28%',
    aspectRatio: 1.2,
    justifyContent: 'flex-start',
    alignItems: 'center',
    borderRadius: 12,
    position: 'relative',
    marginBottom: 4,
    paddingTop: 6,
    backgroundColor: '#F8FAFC',
  },
  todayCell: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCell: {
    borderWidth: 2.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '15',
  },
  deliveryDateCell: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  dayText: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 2,
  },
  todayText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  selectedText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  deliveryDateText: {
    color: '#DC2626',
    fontWeight: 'bold',
  },
  animalIndicator: {
    position: 'absolute',
    bottom: 2,
    flexDirection: 'row',
    gap: -4,
  },
  animalMiniEmoji: {
    fontSize: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  addButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F9FAFB',
  },
  addPregnancyButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  addPregnancyButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: 0.3,
  },
  animalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
  },
  animalCardOld: {
    backgroundColor: '#334155',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  animalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  animalHeaderOld: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  animalEmoji: {
    fontSize: 56,
    marginRight: 16,
    backgroundColor: COLORS.primary + '10',
    width: 72,
    height: 72,
    textAlign: 'center',
    lineHeight: 72,
    borderRadius: 16,
    overflow: 'hidden',
  },
  animalEmojiOld: {
    fontSize: 32,
    marginRight: 12,
  },
  animalInfo: {
    flex: 1,
  },
  animalName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  animalBreed: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressBadge: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    minWidth: 70,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  progressText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  animalDetails: {
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  progressBar: {
    height: '100%',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    flex: 1,
    justifyContent: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  deliverBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  deleteBtn: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 12,
    marginLeft: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 15,
    color: '#94A3B8',
    marginTop: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 5,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 14,
  },
  activeTabText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  miniAnimalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  miniAnimalInfo: {
    flex: 1,
    marginLeft: 12,
  },
  miniAnimalName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  miniAnimalDate: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  miniBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 50,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  miniBadgeText: {
    fontSize: 14,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    color: COLORS.gray,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: COLORS.primary,
  },
  animalSelector: {
    maxHeight: 120,
  },
  animalSelectCard: {
    width: 100,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  animalSelectCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  animalSelectEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  animalSelectName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.black,
    textAlign: 'center',
  },
  animalSelectType: {
    fontSize: 10,
    color: COLORS.gray,
    marginTop: 2,
  },
  noAnimalsMsg: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
  },
  noAnimalsMsgText: {
    color: '#92400E',
    fontSize: 13,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.black,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputHint: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 4,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  typeEmoji: {
    fontSize: 18,
    marginRight: 6,
  },
  typeText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  typeTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  matingTypeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  matingTypeBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  matingTypeBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  matingTypeText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '600',
  },
  matingTypeTextActive: {
    color: COLORS.primary,
  },
  durationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  durationInfoText: {
    fontSize: 13,
    color: COLORS.primary,
    flex: 1,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: {
    backgroundColor: COLORS.gray,
    opacity: 0.7,
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  deliveryAnimalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  deliveryAnimalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  deliveryAnimalBreed: {
    fontSize: 14,
    color: COLORS.gray,
  },
});

export default PregnancyCalendarScreen;
