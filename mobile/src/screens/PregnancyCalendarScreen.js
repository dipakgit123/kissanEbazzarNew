import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../utils/constants';

const PregnancyCalendarScreen = ({ navigation }) => {
  const [pregnantAnimals, setPregnantAnimals] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [newAnimal, setNewAnimal] = useState({
    name: '',
    type: 'Cow',
    breed: '',
    registrationDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const animalTypes = ['Cow', 'Buffalo', 'Goat', 'Horse', 'Sheep'];

  useEffect(() => {
    loadAnimals();
  }, []);

  const loadAnimals = async () => {
    try {
      const stored = await AsyncStorage.getItem('pregnantAnimals');
      if (stored) {
        setPregnantAnimals(JSON.parse(stored));
      }
    } catch (error) {
      console.log('Error loading animals:', error);
    }
  };

  const saveAnimals = async (animals) => {
    try {
      await AsyncStorage.setItem('pregnantAnimals', JSON.stringify(animals));
    } catch (error) {
      console.log('Error saving animals:', error);
    }
  };

  const calculateExpectedDelivery = (registrationDate) => {
    const regDate = new Date(registrationDate);
    const expectedDate = new Date(regDate);
    expectedDate.setMonth(expectedDate.getMonth() + 9);
    return expectedDate;
  };

  const calculateProgress = (registrationDate) => {
    const regDate = new Date(registrationDate);
    const now = new Date();
    const expectedDelivery = calculateExpectedDelivery(registrationDate);
    const totalDays = Math.ceil((expectedDelivery - regDate) / (1000 * 60 * 60 * 24));
    const daysPassed = Math.ceil((now - regDate) / (1000 * 60 * 60 * 24));
    return Math.min(Math.max((daysPassed / totalDays) * 100, 0), 100);
  };

  const getAnimalEmoji = (type) => {
    const emojis = {
      Cow: '🐄',
      Buffalo: '🐃',
      Goat: '🐐',
      Horse: '🐴',
      Sheep: '🐑',
    };
    return emojis[type] || '🐄';
  };

  const getProgressColor = (progress) => {
    if (progress < 30) return COLORS.blue;
    if (progress < 60) return COLORS.yellow;
    if (progress < 90) return '#F97316';
    return COLORS.red;
  };

  const handleSubmit = () => {
    if (!newAnimal.name.trim()) {
      Alert.alert('Error', 'Please enter animal name');
      return;
    }
    if (!newAnimal.breed.trim()) {
      Alert.alert('Error', 'Please enter breed');
      return;
    }

    const expectedDelivery = calculateExpectedDelivery(newAnimal.registrationDate);
    const animal = {
      ...newAnimal,
      id: Date.now(),
      expectedDelivery: expectedDelivery.toISOString().split('T')[0],
    };

    const updatedAnimals = [...pregnantAnimals, animal];
    setPregnantAnimals(updatedAnimals);
    saveAnimals(updatedAnimals);

    setNewAnimal({
      name: '',
      type: 'Cow',
      breed: '',
      registrationDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setShowAddModal(false);
    Alert.alert('Success', 'Animal registered successfully!');
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Are you sure you want to delete this animal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updatedAnimals = pregnantAnimals.filter((a) => a.id !== id);
          setPregnantAnimals(updatedAnimals);
          saveAnimals(updatedAnimals);
        },
      },
    ]);
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

  const getAnimalsForDate = (date) => {
    return pregnantAnimals.filter((animal) => {
      const regDate = new Date(animal.registrationDate);
      const expDate = new Date(animal.expectedDelivery);
      return date >= regDate && date <= expDate;
    });
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Empty cells
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarCell} />);
    }

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const animalsForDate = getAnimalsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = date.toDateString() === selectedDate.toDateString();

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarCell,
            isToday && styles.todayCell,
            isSelected && styles.selectedCell,
            animalsForDate.length > 0 && styles.hasAnimalsCell,
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
          {animalsForDate.length > 0 && (
            <View style={styles.animalDot}>
              <Text style={styles.animalCount}>{animalsForDate.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    }

    return days;
  };

  const selectedDateAnimals = getAnimalsForDate(selectedDate);

  // Stats
  const totalAnimals = pregnantAnimals.length;
  const dueThisMonth = pregnantAnimals.filter((animal) => {
    const expDate = new Date(animal.expectedDelivery);
    const now = new Date();
    return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
  }).length;
  const nearDelivery = pregnantAnimals.filter((animal) => calculateProgress(animal.registrationDate) > 85).length;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="calendar" size={28} color={COLORS.white} />
        </View>
        <Text style={styles.title}>Pregnancy Calendar</Text>
        <Text style={styles.subtitle}>Track pregnant animals • Monitor progress</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalAnimals}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#F97316' + '20' }]}>
          <Text style={[styles.statValue, { color: '#F97316' }]}>{dueThisMonth}</Text>
          <Text style={styles.statLabel}>This Month</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.red + '20' }]}>
          <Text style={[styles.statValue, { color: COLORS.red }]}>{nearDelivery}</Text>
          <Text style={styles.statLabel}>Near Due</Text>
        </View>
      </View>

      {/* Calendar */}
      <View style={styles.calendarCard}>
        {/* Month Navigation */}
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

        {/* Weekday Headers */}
        <View style={styles.weekdaysRow}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <Text key={index} style={styles.weekdayText}>
              {day}
            </Text>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>{renderCalendar()}</View>
      </View>

      {/* Selected Date Animals */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {formatDate(selectedDate.toISOString())}
          </Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
            <Ionicons name="add" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {selectedDateAnimals.length > 0 ? (
          selectedDateAnimals.map((animal) => {
            const progress = calculateProgress(animal.registrationDate);
            return (
              <View key={animal.id} style={styles.animalCard}>
                <View style={styles.animalHeader}>
                  <Text style={styles.animalEmoji}>{getAnimalEmoji(animal.type)}</Text>
                  <View style={styles.animalInfo}>
                    <Text style={styles.animalName}>{animal.name}</Text>
                    <Text style={styles.animalBreed}>
                      {animal.breed} • {animal.type}
                    </Text>
                  </View>
                  <View style={styles.progressBadge}>
                    <Text style={[styles.progressText, { color: getProgressColor(progress) }]}>
                      {Math.round(progress)}%
                    </Text>
                  </View>
                </View>

                <View style={styles.animalDetails}>
                  <Text style={styles.detailText}>
                    Registered: {formatDate(animal.registrationDate)}
                  </Text>
                  <Text style={styles.detailText}>
                    Expected: {formatDate(animal.expectedDelivery)}
                  </Text>
                </View>

                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${progress}%`, backgroundColor: getProgressColor(progress) },
                    ]}
                  />
                </View>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(animal.id)}
                >
                  <Ionicons name="trash-outline" size={18} color={COLORS.red} />
                </TouchableOpacity>
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

      {/* All Animals */}
      {pregnantAnimals.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Pregnant Animals</Text>
          {pregnantAnimals.map((animal) => {
            const progress = calculateProgress(animal.registrationDate);
            return (
              <View key={animal.id} style={styles.miniAnimalCard}>
                <Text style={styles.animalEmoji}>{getAnimalEmoji(animal.type)}</Text>
                <View style={styles.miniAnimalInfo}>
                  <Text style={styles.miniAnimalName}>{animal.name}</Text>
                  <Text style={styles.miniAnimalDate}>Due: {formatDate(animal.expectedDelivery)}</Text>
                </View>
                <View
                  style={[
                    styles.miniBadge,
                    { backgroundColor: getProgressColor(progress) + '20' },
                  ]}
                >
                  <Text style={[styles.miniBadgeText, { color: getProgressColor(progress) }]}>
                    {Math.round(progress)}%
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <View style={{ height: 100 }} />

      {/* Add Animal Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Register Pregnant Animal</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.black} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Animal Name</Text>
                <TextInput
                  style={styles.input}
                  value={newAnimal.name}
                  onChangeText={(text) => setNewAnimal({ ...newAnimal, name: text })}
                  placeholder="Enter animal name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Animal Type</Text>
                <View style={styles.typeSelector}>
                  {animalTypes.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeBtn,
                        newAnimal.type === type && styles.typeBtnActive,
                      ]}
                      onPress={() => setNewAnimal({ ...newAnimal, type })}
                    >
                      <Text style={styles.typeEmoji}>{getAnimalEmoji(type)}</Text>
                      <Text
                        style={[
                          styles.typeText,
                          newAnimal.type === type && styles.typeTextActive,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Breed</Text>
                <TextInput
                  style={styles.input}
                  value={newAnimal.breed}
                  onChangeText={(text) => setNewAnimal({ ...newAnimal, breed: text })}
                  placeholder="Enter breed"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newAnimal.notes}
                  onChangeText={(text) => setNewAnimal({ ...newAnimal, notes: text })}
                  placeholder="Any additional notes..."
                  multiline
                  numberOfLines={3}
                />
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                <Text style={styles.submitBtnText}>Register Animal</Text>
              </TouchableOpacity>
            </ScrollView>
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
  animalCount: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: 'bold',
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
    position: 'relative',
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
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  deleteBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
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
    maxHeight: '80%',
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
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.black,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
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
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PregnancyCalendarScreen;
