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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../utils/constants';
import { pregnancyService } from '../services/api';

const PregnancyCalendarScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [pregnancyRecords, setPregnancyRecords] = useState([]);
  const [myAnimals, setMyAnimals] = useState([]);
  const [pregnancyDurations, setPregnancyDurations] = useState({});
  const [stats, setStats] = useState({ active: 0, delivered: 0, dueSoon: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
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
  const [manualEntry, setManualEntry] = useState(false);
  const [manualAnimalName, setManualAnimalName] = useState('');
  const [manualAnimalType, setManualAnimalType] = useState('cow');
  const [manualBreedName, setManualBreedName] = useState('');

  // Delivery form states
  const [offspringCount, setOffspringCount] = useState('1');
  const [offspringGender, setOffspringGender] = useState('');
  const [offspringDetails, setOffspringDetails] = useState('');

  const animalTypes = [
    { key: 'cow', label: 'Cow', emoji: '🐄' },
    { key: 'buffalo', label: 'Buffalo', emoji: '🐃' },
    { key: 'goat', label: 'Goat', emoji: '🐐' },
    { key: 'sheep', label: 'Sheep', emoji: '🐑' },
    { key: 'horse', label: 'Horse', emoji: '🐴' },
    { key: 'dog', label: 'Dog', emoji: '🐕' },
    { key: 'cat', label: 'Cat', emoji: '🐱' },
    { key: 'pig', label: 'Pig', emoji: '🐷' },
  ];

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

      if (durationsRes.success) {
        setPregnancyDurations(durationsRes.data.durations);
      }
      if (animalsRes.success) {
        setMyAnimals(animalsRes.data.animals || []);
      }
      if (recordsRes.success) {
        setPregnancyRecords(recordsRes.data.records || []);
      }
      if (statsRes.success) {
        setStats(statsRes.data);
      }
    } catch (error) {
      console.log('Error loading data:', error);
      Alert.alert('Error', 'Failed to load pregnancy data. Please try again.');
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
      let recordData = {
        mating_date: matingDate,
        mating_type: matingType,
        bull_sire_details: bullSireDetails || null,
        notes: notes || null,
      };

      if (manualEntry) {
        if (!manualAnimalName.trim()) {
          Alert.alert('Error', 'Please enter animal name');
          return;
        }
        recordData.animal_name = manualAnimalName;
        recordData.animal_type = manualAnimalType;
        recordData.breed_name = manualBreedName || null;
      } else {
        if (!selectedAnimal) {
          Alert.alert('Error', 'Please select an animal');
          return;
        }
        recordData.listing_id = selectedAnimal.id;
        recordData.listing_type = selectedAnimal.type;
        recordData.animal_name = selectedAnimal.name || selectedAnimal.breed;
        recordData.animal_type = selectedAnimal.animal_type || selectedAnimal.type;
        recordData.breed_name = selectedAnimal.breed || selectedAnimal.breed_name;
        recordData.animal_photo = selectedAnimal.photo1 || selectedAnimal.photos?.[0];
      }

      const response = await pregnancyService.createRecord(recordData);

      if (response.success) {
        Alert.alert('Success', 'Pregnancy record created successfully!');
        setShowAddModal(false);
        resetForm();
        loadData();
      } else {
        Alert.alert('Error', response.message || 'Failed to create record');
      }
    } catch (error) {
      console.log('Error creating record:', error);
      Alert.alert('Error', error.message || 'Failed to create pregnancy record');
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

      if (response.success) {
        Alert.alert('Congratulations!', 'Delivery recorded successfully!');
        setShowDeliveryModal(false);
        setSelectedRecord(null);
        resetDeliveryForm();
        loadData();
      } else {
        Alert.alert('Error', response.message || 'Failed to record delivery');
      }
    } catch (error) {
      console.log('Error marking delivered:', error);
      Alert.alert('Error', error.message || 'Failed to record delivery');
    }
  };

  const handleDeleteRecord = (record) => {
    Alert.alert(
      'Delete Record',
      `Are you sure you want to delete the pregnancy record for ${record.animal_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await pregnancyService.deleteRecord(record.id);
              if (response.success) {
                Alert.alert('Success', 'Record deleted successfully');
                loadData();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete record');
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
    setManualEntry(false);
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
            recordsForDate.length > 0 && styles.hasAnimalsCell,
            isDeliveryDate && styles.deliveryDateCell,
          ]}
          onPress={() => setSelectedDate(date)}
        >
          <Text
            style={[
              styles.dayText,
              isToday && styles.todayText,
              isSelected && styles.selectedText,
            ]}
          >
            {day}
          </Text>
          {recordsForDate.length > 0 && (
            <View style={[styles.animalDot, isDeliveryDate && styles.deliveryDot]}>
              <Text style={styles.animalCount}>{recordsForDate.length}</Text>
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading pregnancy calendar...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
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
        <Text style={styles.subtitle}>Track pregnant animals with accurate durations</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.active || 0}</Text>
          <Text style={styles.statLabel}>{t('pregnancy.active')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#22C55E' + '20' }]}>
          <Text style={[styles.statValue, { color: '#22C55E' }]}>{stats.delivered || 0}</Text>
          <Text style={styles.statLabel}>Delivered</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#F97316' + '20' }]}>
          <Text style={[styles.statValue, { color: '#F97316' }]}>{stats.dueSoon || 0}</Text>
          <Text style={styles.statLabel}>Due Soon</Text>
        </View>
      </View>

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
            <Text style={styles.legendText}>Pregnant</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>Due Date</Text>
          </View>
        </View>
      </View>

      {/* Selected Date Info */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{formatDate(selectedDate.toISOString())}</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
            <Ionicons name="add" size={24} color={COLORS.white} />
          </TouchableOpacity>
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
                      {record.breed_name || record.animal_type} • {daysLeft} days left
                    </Text>
                  </View>
                  <View style={styles.progressBadge}>
                    <Text style={[styles.progressText, { color: getProgressColor(progress) }]}>
                      {progress}%
                    </Text>
                  </View>
                </View>

                <View style={styles.animalDetails}>
                  <Text style={styles.detailText}>Mating: {formatDate(record.mating_date)}</Text>
                  <Text style={styles.detailText}>Expected: {formatDate(record.expected_delivery_date)}</Text>
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
                      <Text style={styles.deliverBtnText}>Mark Delivered</Text>
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
            <Text style={styles.emptyText}>No pregnant animals for this date</Text>
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
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* All Records List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {activeTab === 'active' ? 'Active Pregnancies' :
           activeTab === 'delivered' ? 'Delivered' : 'All Records'}
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
                      ? `Due: ${formatDate(record.expected_delivery_date)}`
                      : `Delivered: ${formatDate(record.actual_delivery_date)}`}
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
            <Text style={styles.emptyText}>No records found</Text>
          </View>
        )}
      </View>

      <View style={{ height: 100 }} />

      {/* Add Pregnancy Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Pregnancy Record</Text>
              <TouchableOpacity onPress={() => { setShowAddModal(false); resetForm(); }}>
                <Ionicons name="close" size={24} color={COLORS.black} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Toggle between listing selection and manual entry */}
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggleBtn, !manualEntry && styles.toggleBtnActive]}
                  onPress={() => setManualEntry(false)}
                >
                  <Text style={[styles.toggleText, !manualEntry && styles.toggleTextActive]}>
                    My Animals
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, manualEntry && styles.toggleBtnActive]}
                  onPress={() => setManualEntry(true)}
                >
                  <Text style={[styles.toggleText, manualEntry && styles.toggleTextActive]}>
                    Manual Entry
                  </Text>
                </TouchableOpacity>
              </View>

              {!manualEntry ? (
                // Animal Selection from Listings
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Select Animal</Text>
                  {myAnimals.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.animalSelector}>
                      {myAnimals.map((animal) => (
                        <TouchableOpacity
                          key={`${animal.type}-${animal.id}`}
                          style={[
                            styles.animalSelectCard,
                            selectedAnimal?.id === animal.id && selectedAnimal?.type === animal.type && styles.animalSelectCardActive,
                          ]}
                          onPress={() => setSelectedAnimal(animal)}
                        >
                          <Text style={styles.animalSelectEmoji}>
                            {getAnimalEmoji(animal.animal_type || animal.type)}
                          </Text>
                          <Text style={styles.animalSelectName} numberOfLines={1}>
                            {animal.name || animal.breed}
                          </Text>
                          <Text style={styles.animalSelectType}>{animal.type}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  ) : (
                    <View style={styles.noAnimalsMsg}>
                      <Text style={styles.noAnimalsMsgText}>
                        No animals found. Add listings first or use manual entry.
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                // Manual Entry Fields
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Animal Name</Text>
                    <TextInput
                      style={styles.input}
                      value={manualAnimalName}
                      onChangeText={setManualAnimalName}
                      placeholder="Enter animal name"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Animal Type</Text>
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
                    <Text style={styles.inputLabel}>Breed (Optional)</Text>
                    <TextInput
                      style={styles.input}
                      value={manualBreedName}
                      onChangeText={setManualBreedName}
                      placeholder="Enter breed name"
                    />
                  </View>
                </>
              )}

              {/* Common Fields */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mating Date</Text>
                <TextInput
                  style={styles.input}
                  value={matingDate}
                  onChangeText={setMatingDate}
                  placeholder="YYYY-MM-DD"
                />
                <Text style={styles.inputHint}>Format: 2025-01-15</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mating Type</Text>
                <View style={styles.matingTypeRow}>
                  <TouchableOpacity
                    style={[styles.matingTypeBtn, matingType === 'natural' && styles.matingTypeBtnActive]}
                    onPress={() => setMatingType('natural')}
                  >
                    <Text style={[styles.matingTypeText, matingType === 'natural' && styles.matingTypeTextActive]}>
                      Natural
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.matingTypeBtn, matingType === 'artificial_insemination' && styles.matingTypeBtnActive]}
                    onPress={() => setMatingType('artificial_insemination')}
                  >
                    <Text style={[styles.matingTypeText, matingType === 'artificial_insemination' && styles.matingTypeTextActive]}>
                      AI
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bull/Sire Details (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={bullSireDetails}
                  onChangeText={setBullSireDetails}
                  placeholder="Enter bull/sire information"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Any additional notes..."
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Pregnancy Duration Info */}
              <View style={styles.durationInfo}>
                <Ionicons name="information-circle" size={20} color={COLORS.primary} />
                <Text style={styles.durationInfoText}>
                  {manualEntry
                    ? `${animalTypes.find(a => a.key === manualAnimalType)?.label || 'Animal'}: ~${pregnancyDurations[manualAnimalType] || 150} days`
                    : selectedAnimal
                    ? `${selectedAnimal.type}: ~${pregnancyDurations[selectedAnimal.animal_type?.toLowerCase() || selectedAnimal.type?.toLowerCase()] || 150} days`
                    : 'Select an animal to see pregnancy duration'}
                </Text>
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleCreateRecord}>
                <Text style={styles.submitBtnText}>Create Record</Text>
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
              <Text style={styles.modalTitle}>Record Delivery</Text>
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
                  <Text style={styles.inputLabel}>Number of Offspring</Text>
                  <TextInput
                    style={styles.input}
                    value={offspringCount}
                    onChangeText={setOffspringCount}
                    keyboardType="numeric"
                    placeholder="1"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Gender(s)</Text>
                  <TextInput
                    style={styles.input}
                    value={offspringGender}
                    onChangeText={setOffspringGender}
                    placeholder="e.g., Male, Female, 2 Male 1 Female"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Additional Details (Optional)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={offspringDetails}
                    onChangeText={setOffspringDetails}
                    placeholder="Health status, weight, etc..."
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#22C55E' }]} onPress={handleMarkDelivered}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                  <Text style={styles.submitBtnText}> Confirm Delivery</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E293B',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.white,
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
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
    padding: 16,
    marginBottom: 16,
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
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    position: 'relative',
  },
  todayCell: {
    backgroundColor: COLORS.primary,
  },
  selectedCell: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  hasAnimalsCell: {
    backgroundColor: COLORS.primary + '10',
  },
  deliveryDateCell: {
    backgroundColor: '#FEE2E2',
  },
  dayText: {
    fontSize: 14,
    color: COLORS.black,
  },
  todayText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  selectedText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  animalDot: {
    position: 'absolute',
    bottom: 4,
    backgroundColor: COLORS.primary,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deliveryDot: {
    backgroundColor: '#EF4444',
  },
  animalCount: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: 'bold',
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
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 12,
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animalCard: {
    backgroundColor: '#334155',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  animalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  animalEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  animalInfo: {
    flex: 1,
  },
  animalName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  animalBreed: {
    fontSize: 13,
    color: '#94A3B8',
  },
  progressBadge: {
    backgroundColor: COLORS.white + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  animalDetails: {
    marginBottom: 12,
  },
  detailText: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 2,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: COLORS.white + '20',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  deliverBtnText: {
    color: '#22C55E',
    fontWeight: '600',
    fontSize: 13,
  },
  deleteBtn: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#334155',
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 14,
  },
  activeTabText: {
    color: COLORS.white,
  },
  miniAnimalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  miniAnimalInfo: {
    flex: 1,
    marginLeft: 10,
  },
  miniAnimalName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  miniAnimalDate: {
    fontSize: 12,
    color: '#94A3B8',
  },
  miniBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    minWidth: 40,
    alignItems: 'center',
  },
  miniBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
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
