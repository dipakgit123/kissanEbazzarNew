import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { pregnancyService } from '../services/api';
import { useTranslation } from 'react-i18next';

// Pregnancy duration in days for different animal types
const PREGNANCY_DURATIONS = {
  cow: { days: 280, months: '9 months', emoji: '🐄' },
  buffalo: { days: 310, months: '10 months', emoji: '🐃' },
  goat: { days: 150, months: '5 months', emoji: '🐐' },
  sheep: { days: 150, months: '5 months', emoji: '🐑' },
  horse: { days: 340, months: '11 months', emoji: '🐴' },
  dog: { days: 63, months: '2 months', emoji: '🐕' },
  cat: { days: 65, months: '2 months', emoji: '🐱' },
  pig: { days: 114, months: '4 months', emoji: '🐷' },
  other: { days: 150, months: '5 months', emoji: '🐾' }
};

// Get animal type emoji
const getAnimalEmoji = (type) => {
  return PREGNANCY_DURATIONS[type?.toLowerCase()]?.emoji || '🐄';
};

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

// Get status badge styling
const getStatusBadge = (status) => {
  const badges = {
    pregnant: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' },
    delivered: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Delivered' },
    miscarriage: { bg: 'bg-red-100', text: 'text-red-700', label: 'Miscarriage' },
    false_pregnancy: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'False Pregnancy' },
    cancelled: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Cancelled' }
  };
  return badges[status] || badges.pregnant;
};

// Get progress color based on days remaining
const getProgressColor = (daysRemaining, totalDays) => {
  const progress = ((totalDays - daysRemaining) / totalDays) * 100;
  if (progress < 30) return 'bg-blue-500';
  if (progress < 60) return 'bg-green-500';
  if (progress < 85) return 'bg-orange-500';
  return 'bg-red-500';
};

const PregnancyCalendar = () => {
  const { t } = useTranslation();
  const [pregnancyRecords, setPregnancyRecords] = useState([]);
  const [myAnimals, setMyAnimals] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    listing_id: '',
    listing_type: '',
    animal_type: 'cow',
    animal_name: '',
    breed_name: '',
    mating_date: new Date().toISOString().split('T')[0],
    bull_sire_details: '',
    mating_type: 'natural',
    notes: ''
  });

  // Delivery form state
  const [deliveryData, setDeliveryData] = useState({
    delivery_date: new Date().toISOString().split('T')[0],
    offspring_count: 1,
    offspring_gender: 'male',
    offspring_details: ''
  });

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [recordsRes, animalsRes, statsRes] = await Promise.all([
        pregnancyService.getRecords(),
        pregnancyService.getMyAnimals(),
        pregnancyService.getStats()
      ]);

      if (recordsRes.success) setPregnancyRecords(recordsRes.data || []);
      if (animalsRes.success) setMyAnimals(animalsRes.data || []);
      if (statsRes.success) setStats(statsRes.data);
    } catch (err) {
      console.error('Error fetching pregnancy data:', err);
      setError('Failed to load pregnancy data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await pregnancyService.createRecord(formData);
      if (response.success) {
        setPregnancyRecords([...pregnancyRecords, response.data]);
        setShowAddForm(false);
        setFormData({
          listing_id: '',
          listing_type: '',
          animal_type: 'cow',
          animal_name: '',
          breed_name: '',
          mating_date: new Date().toISOString().split('T')[0],
          bull_sire_details: '',
          mating_type: 'natural',
          notes: ''
        });
        fetchData();
      }
    } catch (err) {
      console.error('Error creating pregnancy record:', err);
      alert('Failed to create pregnancy record');
    }
  };

  // Handle delivery
  const handleDeliver = async () => {
    if (!selectedRecord) return;
    try {
      const response = await pregnancyService.markDelivered(selectedRecord.id, deliveryData);
      if (response.success) {
        setShowDeliverModal(false);
        setSelectedRecord(null);
        fetchData();
      }
    } catch (err) {
      console.error('Error marking as delivered:', err);
      alert('Failed to mark as delivered');
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this pregnancy record?')) return;
    try {
      const response = await pregnancyService.deleteRecord(id);
      if (response.success) {
        setPregnancyRecords(pregnancyRecords.filter(r => r.id !== id));
        fetchData();
      }
    } catch (err) {
      console.error('Error deleting record:', err);
      alert('Failed to delete record');
    }
  };

  // Select animal from listing
  const handleSelectAnimal = (animal) => {
    setFormData({
      ...formData,
      listing_id: animal.id,
      listing_type: animal.listing_type,
      animal_type: animal.animal_type,
      animal_name: animal.breed_name || '',
      breed_name: animal.breed_name || '',
      animal_photo: animal.photo
    });
  };

  // Calculate expected delivery date when mating date or animal type changes
  useEffect(() => {
    if (formData.mating_date && formData.animal_type) {
      const duration = PREGNANCY_DURATIONS[formData.animal_type]?.days || 150;
      const matingDate = new Date(formData.mating_date);
      matingDate.setDate(matingDate.getDate() + duration);
    }
  }, [formData.mating_date, formData.animal_type]);

  // Calendar functions
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

  // Get animals for specific date
  const getRecordsForDate = (date) => {
    return pregnancyRecords.filter(record => {
      if (record.status !== 'pregnant') return false;
      const matingDate = new Date(record.mating_date);
      const expDate = new Date(record.expected_delivery_date);
      return date >= matingDate && date <= expDate;
    });
  };

  // Check if date is due date
  const isDueDate = (date) => {
    return pregnancyRecords.some(r => 
      r.status === 'pregnant' && 
      r.expected_delivery_date === date.toISOString().split('T')[0]
    );
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-20"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      date.setHours(0, 0, 0, 0);
      const recordsForDate = getRecordsForDate(date);
      const isToday = date.getTime() === today.getTime();
      const isSelected = selectedDate && date.getTime() === selectedDate.getTime();
      const hasDueDate = isDueDate(date);

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`h-20 p-2 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
            isToday
              ? 'bg-green-900/50 border-green-500 shadow-md'
              : isSelected
              ? 'bg-blue-900/50 border-blue-500'
              : hasDueDate
              ? 'bg-red-900/50 border-red-500 hover:border-red-400'
              : recordsForDate.length > 0
              ? 'bg-orange-900/50 border-orange-500 hover:border-orange-400'
              : 'bg-gray-800 border-gray-700 hover:border-gray-600'
          }`}
        >
          <div className="flex justify-between items-start mb-1">
            <span className={`text-sm font-semibold ${
              isToday ? 'text-green-300' : 'text-gray-300'
            }`}>
              {day}
            </span>
            {recordsForDate.length > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-500 text-white font-bold">
                {recordsForDate.length}
              </span>
            )}
          </div>
          {hasDueDate && (
            <div className="text-xs text-red-400 font-semibold">
              📅 Due
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  // Filter records by tab
  const filteredRecords = pregnancyRecords.filter(record => {
    if (activeTab === 'active') return record.status === 'pregnant';
    if (activeTab === 'delivered') return record.status === 'delivered';
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300 font-medium">Loading pregnancy calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Pregnancy Calendar
              </h1>
              <p className="text-gray-400">
                Track your animals' pregnancy journey
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-900 hover:border-gray-600 transition-colors font-medium"
              >
                ← Back
              </Link>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-5 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Pregnancy
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
            {error}
          </div>
        )}

        {/* KPI Summary Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-sm hover:shadow-md hover:border-green-700 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">Active Pregnancies</p>
                  <p className="text-3xl font-bold text-white">{stats.active_pregnancies || 0}</p>
                </div>
                <div className="w-12 h-12 bg-green-900/50 rounded-lg flex items-center justify-center border border-green-700">
                  <span className="text-2xl">🤰</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-sm hover:shadow-md hover:border-blue-700 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">Delivered</p>
                  <p className="text-3xl font-bold text-white">{stats.successful_deliveries || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-900/50 rounded-lg flex items-center justify-center border border-blue-700">
                  <span className="text-2xl">🐣</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-sm hover:shadow-md hover:border-orange-700 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">Due Soon</p>
                  <p className="text-3xl font-bold text-white">{stats.upcoming_deliveries?.length || 0}</p>
                </div>
                <div className="w-12 h-12 bg-orange-900/50 rounded-lg flex items-center justify-center border border-orange-700">
                  <span className="text-2xl">⏰</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-sm hover:shadow-md hover:border-purple-700 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">Total Records</p>
                  <p className="text-3xl font-bold text-white">{stats.total_records || 0}</p>
                </div>
                <div className="w-12 h-12 bg-purple-900/50 rounded-lg flex items-center justify-center border border-purple-700">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pregnancy Duration Reference */}
        <div className="mb-8 bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-sm">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>📅</span> Pregnancy Duration Reference
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PREGNANCY_DURATIONS).map(([type, info]) => (
              <div key={type} className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 hover:border-green-600 transition-colors">
                <span className="text-lg">{info.emoji}</span>
                <span className="text-sm text-gray-300 font-medium capitalize">{type}:</span>
                <span className="text-sm text-green-400 font-semibold">{info.months}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Section */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-sm">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="p-2 rounded-lg border border-gray-700 hover:bg-gray-800 hover:border-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <h2 className="text-xl font-bold text-white">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>

                <button
                  onClick={() => navigateMonth(1)}
                  className="p-2 rounded-lg border border-gray-700 hover:bg-gray-800 hover:border-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-sm font-semibold text-gray-400 py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {generateCalendarDays()}
              </div>

              {/* Legend */}
              <div className="mt-6 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500"></div>
                  <span className="text-gray-300">Today</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-orange-900/50 border-2 border-orange-500"></div>
                  <span className="text-gray-300">Pregnant</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-900/50 border-2 border-red-500"></div>
                  <span className="text-gray-300">Due Date</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Filter Tabs */}
            <div className="bg-gray-900 rounded-xl p-1.5 border border-gray-800 shadow-sm flex gap-1">
              <button
                onClick={() => setActiveTab('active')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'active'
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setActiveTab('delivered')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'delivered'
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
              >
                Delivered
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'all'
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
              >
                All
              </button>
            </div>

            {/* Records List */}
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 shadow-sm max-h-[600px] overflow-y-auto">
              {filteredRecords.length > 0 ? (
                <div className="space-y-4">
                  {filteredRecords.map((record) => {
                    const statusBadge = getStatusBadge(record.status);
                    const totalDays = PREGNANCY_DURATIONS[record.animal_type]?.days || 150;
                    
                    return (
                      <div
                        key={record.id}
                        className="p-4 bg-gray-800 rounded-lg border border-gray-700 hover:shadow-md hover:border-green-600 transition-all"
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{getAnimalEmoji(record.animal_type)}</span>
                            <div>
                              <h4 className="text-sm font-bold text-white">{record.animal_name}</h4>
                              <p className="text-xs text-gray-400 capitalize">{record.breed_name || record.animal_type}</p>
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
                            {statusBadge.label}
                          </span>
                        </div>

                        {/* Progress for active pregnancies */}
                        {record.status === 'pregnant' && (
                          <>
                            <div className="mb-3">
                              <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                                <span>Progress</span>
                                <span className="font-bold text-green-400">{record.progress_percentage || 0}%</span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
                                <div
                                  className={`h-2.5 rounded-full ${getProgressColor(record.days_remaining, totalDays)} transition-all duration-500`}
                                  style={{ width: `${record.progress_percentage || 0}%` }}
                                ></div>
                              </div>
                            </div>

                            <div className="flex justify-between text-xs mb-3 px-3 py-2 bg-orange-900/30 rounded-lg border border-orange-700">
                              <span className="text-gray-300 font-medium">Days Remaining</span>
                              <span className="text-orange-400 font-bold">{record.days_remaining || 0} days</span>
                            </div>
                          </>
                        )}

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                          <div className="bg-gray-900 rounded-lg p-2.5 border border-gray-700">
                            <p className="text-gray-400 mb-1">Mating Date</p>
                            <p className="text-gray-200 font-semibold">{formatDate(record.mating_date)}</p>
                          </div>
                          <div className="bg-gray-900 rounded-lg p-2.5 border border-gray-700">
                            <p className="text-gray-400 mb-1">Expected Date</p>
                            <p className="text-green-400 font-semibold">{formatDate(record.expected_delivery_date)}</p>
                          </div>
                        </div>

                        {/* Delivered info */}
                        {record.status === 'delivered' && record.actual_delivery_date && (
                          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-2.5 mb-3">
                            <p className="text-blue-300 text-xs font-medium">
                              ✓ Delivered on {formatDate(record.actual_delivery_date)}
                              {record.offspring_count && ` - ${record.offspring_count} offspring`}
                            </p>
                          </div>
                        )}

                        {/* Actions */}
                        {record.status === 'pregnant' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedRecord(record);
                                setShowDeliverModal(true);
                              }}
                              className="flex-1 py-2.5 px-3 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors shadow-sm"
                            >
                              Mark Delivered
                            </button>
                            <button
                              onClick={() => handleDelete(record.id)}
                              className="py-2.5 px-3 bg-red-900/30 text-red-400 rounded-lg text-xs font-semibold hover:bg-red-900/50 transition-colors border border-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-700">
                    <span className="text-3xl">📅</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">No {activeTab} pregnancy records</p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="text-green-400 font-semibold text-sm hover:text-green-300"
                  >
                    + Add your first pregnancy
                  </button>
                </div>
              )}
            </div>

            {/* Upcoming Deliveries Alert */}
            {stats?.upcoming_deliveries?.length > 0 && (
              <div className="bg-orange-900/30 rounded-xl p-4 border border-orange-700">
                <h3 className="text-sm font-bold text-orange-300 mb-3 flex items-center gap-2">
                  <span>⚠️</span> Due Within 30 Days
                </h3>
                <div className="space-y-2">
                  {stats.upcoming_deliveries.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2.5 bg-gray-800 rounded-lg border border-orange-700/50">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getAnimalEmoji(item.animal_type)}</span>
                        <span className="text-sm text-gray-200 font-semibold">{item.animal_name}</span>
                      </div>
                      <span className="text-xs text-orange-400 font-bold">{item.days_remaining} days</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Pregnancy Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span>🤰</span> Add Pregnancy Record
              </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 p-6">
              {/* My Animals Selection */}
              {myAnimals.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Select from your animals
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-3 bg-gray-50 rounded-lg border border-gray-200">
                    {myAnimals.filter(a => !a.has_active_pregnancy).map((animal) => (
                      <button
                        key={`${animal.listing_type}-${animal.id}`}
                        type="button"
                        onClick={() => handleSelectAnimal(animal)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          formData.listing_id === animal.id
                            ? 'bg-green-600 text-white shadow-sm'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        <span>{getAnimalEmoji(animal.animal_type)}</span>
                        <span>{animal.breed_name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Row 1: Animal Type & Mating Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Animal Type *</label>
                    <select
                      value={formData.animal_type}
                      onChange={(e) => setFormData({ ...formData, animal_type: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      {Object.keys(PREGNANCY_DURATIONS).map(type => (
                        <option key={type} value={type}>
                          {getAnimalEmoji(type)} {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Mating Type</label>
                    <select
                      value={formData.mating_type}
                      onChange={(e) => setFormData({ ...formData, mating_type: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="natural">Natural</option>
                      <option value="artificial_insemination">Artificial Insemination</option>
                    </select>
                  </div>
                </div>

                {/* Row 2: Animal Name & Breed */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Animal Name *</label>
                    <input
                      type="text"
                      value={formData.animal_name}
                      onChange={(e) => setFormData({ ...formData, animal_name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., Lakshmi"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Breed Name</label>
                    <input
                      type="text"
                      value={formData.breed_name}
                      onChange={(e) => setFormData({ ...formData, breed_name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., Gir"
                    />
                  </div>
                </div>

                {/* Mating Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mating Date *</label>
                  <input
                    type="date"
                    value={formData.mating_date}
                    onChange={(e) => setFormData({ ...formData, mating_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Expected delivery: ~{PREGNANCY_DURATIONS[formData.animal_type]?.months} from mating date
                  </p>
                </div>

                {/* Bull/Sire Details */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Bull/Sire Details</label>
                  <input
                    type="text"
                    value={formData.bull_sire_details}
                    onChange={(e) => setFormData({ ...formData, bull_sire_details: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., Bull name, AI straw number"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    rows="3"
                    placeholder="Any additional notes..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-sm"
                  >
                    Add Pregnancy
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Deliver Modal */}
      {showDeliverModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span>🐣</span> Mark as Delivered
              </h3>
              <button
                onClick={() => {
                  setShowDeliverModal(false);
                  setSelectedRecord(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Animal Info Card */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-3">
                <span className="text-3xl">{getAnimalEmoji(selectedRecord.animal_type)}</span>
                <div>
                  <p className="text-gray-900 font-bold">{selectedRecord.animal_name}</p>
                  <p className="text-gray-600 text-sm">{selectedRecord.breed_name || selectedRecord.animal_type}</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Delivery Date & Offspring Count */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery Date</label>
                    <input
                      type="date"
                      value={deliveryData.delivery_date}
                      onChange={(e) => setDeliveryData({ ...deliveryData, delivery_date: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Count</label>
                    <input
                      type="number"
                      min="1"
                      value={deliveryData.offspring_count}
                      onChange={(e) => setDeliveryData({ ...deliveryData, offspring_count: parseInt(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Gender Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['male', 'female', 'mixed'].map((gender) => (
                      <button
                        key={gender}
                        type="button"
                        onClick={() => setDeliveryData({ ...deliveryData, offspring_gender: gender })}
                        className={`py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
                          deliveryData.offspring_gender === gender
                            ? 'bg-green-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                        }`}
                      >
                        {gender === 'male' ? '♂ Male' : gender === 'female' ? '♀ Female' : '⚥ Mixed'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Offspring Details */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Details (Optional)</label>
                  <textarea
                    value={deliveryData.offspring_details}
                    onChange={(e) => setDeliveryData({ ...deliveryData, offspring_details: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    rows="3"
                    placeholder="Health, weight, markings..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeliverModal(false);
                      setSelectedRecord(null);
                    }}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeliver}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-sm"
                  >
                    Confirm Delivery
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PregnancyCalendar;
