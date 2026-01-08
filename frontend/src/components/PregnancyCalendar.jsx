import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { pregnancyService } from '../services/api';

// Pregnancy duration in days for different animal types
const PREGNANCY_DURATIONS = {
  cow: { days: 280, months: '9 months' },
  buffalo: { days: 310, months: '10 months' },
  goat: { days: 150, months: '5 months' },
  sheep: { days: 150, months: '5 months' },
  horse: { days: 340, months: '11 months' },
  dog: { days: 63, months: '2 months' },
  cat: { days: 65, months: '2 months' },
  pig: { days: 114, months: '4 months' },
  other: { days: 150, months: '5 months' }
};

// Get animal type emoji
const getAnimalEmoji = (type) => {
  const emojis = {
    cow: '🐄',
    buffalo: '🐃',
    goat: '🐐',
    sheep: '🐑',
    horse: '🐴',
    dog: '🐕',
    cat: '🐱',
    pig: '🐷',
    other: '🐾'
  };
  return emojis[type?.toLowerCase()] || '🐄';
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

// Get status badge color
const getStatusColor = (status) => {
  const colors = {
    pregnant: 'bg-green-500/20 text-green-400 border-green-500/30',
    delivered: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    miscarriage: 'bg-red-500/20 text-red-400 border-red-500/30',
    false_pregnancy: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  };
  return colors[status] || colors.pregnant;
};

// Get progress color
const getProgressColor = (progress) => {
  if (progress < 30) return 'from-blue-500 to-blue-400';
  if (progress < 60) return 'from-yellow-500 to-yellow-400';
  if (progress < 85) return 'from-orange-500 to-orange-400';
  return 'from-red-500 to-red-400';
};

const PregnancyCalendar = () => {
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
  const [selectedDate, setSelectedDate] = useState(new Date());

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
      // Just update display, API calculates it
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

  // Generate calendar days
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-16 lg:h-20"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const recordsForDate = getRecordsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = selectedDate.toDateString() === date.toDateString();

      // Check if any animal is due on this day
      const dueAnimals = pregnancyRecords.filter(r =>
        r.status === 'pregnant' && r.expected_delivery_date === date.toISOString().split('T')[0]
      );

      days.push(
        <div
          key={day}
          className={`h-16 lg:h-20 p-1 lg:p-2 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 relative overflow-hidden ${
            isToday
              ? 'bg-gradient-to-br from-[#15BB73] to-[#0FA568] text-white shadow-lg'
              : isSelected
              ? 'bg-white/20 border-2 border-[#15BB73]'
              : dueAnimals.length > 0
              ? 'bg-red-500/20 border border-red-500/30'
              : recordsForDate.length > 0
              ? 'bg-green-500/10 border border-green-500/20'
              : 'bg-white/5 hover:bg-white/10'
          }`}
          onClick={() => setSelectedDate(date)}
        >
          <div className="flex justify-between items-start">
            <span className={`text-xs lg:text-sm font-bold ${isToday ? 'text-white' : 'text-gray-300'}`}>
              {day}
            </span>
            {recordsForDate.length > 0 && (
              <span className="text-xs px-1 lg:px-2 py-0.5 rounded-full bg-[#15BB73] text-white font-bold">
                {recordsForDate.length}
              </span>
            )}
          </div>
          {dueAnimals.length > 0 && (
            <div className="mt-1 text-xs text-red-400 font-bold truncate">
              Due: {dueAnimals[0].animal_name}
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
      <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#15BB73] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading pregnancy calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155] py-4 lg:py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#15BB73] to-[#0FA568] rounded-2xl flex items-center justify-center shadow-2xl">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Pregnancy Calendar</h1>
              <p className="text-gray-400 text-sm">Track your animals' pregnancy journey</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/"
              className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all"
            >
              Back to Home
            </Link>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="hidden lg:inline">Add Pregnancy</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-2xl p-4 border border-green-500/20">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500/30 rounded-xl flex items-center justify-center">
                  <span className="text-xl">🤰</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.active_pregnancies}</p>
                  <p className="text-xs text-gray-400">Active</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-2xl p-4 border border-blue-500/20">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500/30 rounded-xl flex items-center justify-center">
                  <span className="text-xl">🐣</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.successful_deliveries}</p>
                  <p className="text-xs text-gray-400">Delivered</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-2xl p-4 border border-orange-500/20">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-500/30 rounded-xl flex items-center justify-center">
                  <span className="text-xl">⏰</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.upcoming_deliveries?.length || 0}</p>
                  <p className="text-xs text-gray-400">Due Soon</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-2xl p-4 border border-purple-500/20">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-500/30 rounded-xl flex items-center justify-center">
                  <span className="text-xl">📊</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.total_records}</p>
                  <p className="text-xs text-gray-400">Total Records</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pregnancy Duration Info */}
        <div className="mb-6 bg-white/5 rounded-2xl p-4 border border-white/10">
          <h3 className="text-white font-bold mb-3 flex items-center">
            <span className="mr-2">📅</span> Pregnancy Duration by Animal
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PREGNANCY_DURATIONS).map(([type, info]) => (
              <div key={type} className="flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-2">
                <span>{getAnimalEmoji(type)}</span>
                <span className="text-gray-300 text-sm capitalize">{type}:</span>
                <span className="text-[#15BB73] font-bold text-sm">{info.months}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Section */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl shadow-2xl p-4 lg:p-6 border border-white/10">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="text-center">
                  <h2 className="text-xl lg:text-2xl font-bold text-white">
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h2>
                </div>

                <button
                  onClick={() => navigateMonth(1)}
                  className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 lg:gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="p-2 text-center text-xs lg:text-sm font-bold text-gray-400 bg-white/5 rounded-xl">
                    {day.slice(0, 1)}
                    <span className="hidden lg:inline">{day.slice(1)}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 lg:gap-2">
                {generateCalendarDays()}
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-400">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded bg-[#15BB73]"></div>
                  <span>Today</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded bg-green-500/30 border border-green-500/50"></div>
                  <span>Pregnant</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded bg-red-500/30 border border-red-500/50"></div>
                  <span>Due Date</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Tabs */}
            <div className="bg-white/5 rounded-xl p-1 flex">
              <button
                onClick={() => setActiveTab('active')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'active'
                    ? 'bg-[#15BB73] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Active ({pregnancyRecords.filter(r => r.status === 'pregnant').length})
              </button>
              <button
                onClick={() => setActiveTab('delivered')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'delivered'
                    ? 'bg-[#15BB73] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Delivered
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'all'
                    ? 'bg-[#15BB73] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                All
              </button>
            </div>

            {/* Records List */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-4 border border-white/10 max-h-[500px] overflow-y-auto">
              {filteredRecords.length > 0 ? (
                <div className="space-y-3">
                  {filteredRecords.map((record) => (
                    <div
                      key={record.id}
                      className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{getAnimalEmoji(record.animal_type)}</span>
                          <div>
                            <h4 className="text-white font-bold text-sm">{record.animal_name}</h4>
                            <p className="text-gray-400 text-xs capitalize">{record.breed_name || record.animal_type}</p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full border font-bold ${getStatusColor(record.status)}`}>
                          {record.status?.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Progress */}
                      {record.status === 'pregnant' && (
                        <>
                          <div className="mb-2">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                              <span>Progress</span>
                              <span className="text-[#15BB73] font-bold">{record.progress_percentage || 0}%</span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-2 rounded-full bg-gradient-to-r ${getProgressColor(record.progress_percentage || 0)} transition-all duration-500`}
                                style={{ width: `${record.progress_percentage || 0}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="flex justify-between text-xs mb-3">
                            <span className="text-gray-400">Days Remaining</span>
                            <span className="text-orange-400 font-bold">{record.days_remaining || 0} days</span>
                          </div>
                        </>
                      )}

                      {/* Dates */}
                      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        <div className="bg-white/5 rounded-lg p-2">
                          <p className="text-gray-400">Mating Date</p>
                          <p className="text-white font-bold">{formatDate(record.mating_date)}</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2">
                          <p className="text-gray-400">Expected</p>
                          <p className="text-[#15BB73] font-bold">{formatDate(record.expected_delivery_date)}</p>
                        </div>
                      </div>

                      {/* Delivered info */}
                      {record.status === 'delivered' && record.actual_delivery_date && (
                        <div className="bg-blue-500/10 rounded-lg p-2 mb-3">
                          <p className="text-blue-400 text-xs">
                            Delivered on {formatDate(record.actual_delivery_date)}
                            {record.offspring_count && ` - ${record.offspring_count} offspring`}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      {record.status === 'pregnant' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedRecord(record);
                              setShowDeliverModal(true);
                            }}
                            className="flex-1 py-2 px-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-xs font-bold hover:shadow-lg transition-all"
                          >
                            Mark Delivered
                          </button>
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="py-2 px-3 bg-red-500/20 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/30 transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">📅</span>
                  </div>
                  <p className="text-gray-400 text-sm">No {activeTab} pregnancy records</p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="mt-4 text-[#15BB73] font-bold text-sm hover:underline"
                  >
                    Add your first pregnancy
                  </button>
                </div>
              )}
            </div>

            {/* Upcoming Deliveries */}
            {stats?.upcoming_deliveries?.length > 0 && (
              <div className="bg-gradient-to-br from-orange-500/20 to-red-500/10 rounded-2xl p-4 border border-orange-500/20">
                <h3 className="text-white font-bold mb-3 flex items-center">
                  <span className="mr-2">⚠️</span> Due Within 30 Days
                </h3>
                <div className="space-y-2">
                  {stats.upcoming_deliveries.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-white/10 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <span>{getAnimalEmoji(item.animal_type)}</span>
                        <span className="text-white text-sm font-bold">{item.animal_name}</span>
                      </div>
                      <span className="text-orange-400 text-xs font-bold">{item.days_remaining} days</span>
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden border border-white/10 flex flex-col">
            {/* Modal Header - Fixed */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
              <h3 className="text-lg font-bold text-white flex items-center">
                <span className="mr-2">🤰</span> Add Pregnancy Record
              </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="overflow-y-auto flex-1 p-4">
              {/* My Animals Selection */}
              {myAnimals.length > 0 && (
                <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wide">
                    Select from your animals
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto p-2 bg-white/5 rounded-lg">
                    {myAnimals.filter(a => !a.has_active_pregnancy).map((animal) => (
                      <button
                        key={`${animal.listing_type}-${animal.id}`}
                        type="button"
                        onClick={() => handleSelectAnimal(animal)}
                        className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          formData.listing_id === animal.id
                            ? 'bg-[#15BB73] text-white'
                            : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                      >
                        <span>{getAnimalEmoji(animal.animal_type)}</span>
                        <span>{animal.breed_name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Row 1: Animal Type & Mating Type */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wide">Animal Type *</label>
                    <select
                      value={formData.animal_type}
                      onChange={(e) => setFormData({ ...formData, animal_type: e.target.value })}
                      className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:ring-2 focus:ring-[#15BB73] focus:border-transparent"
                      required
                    >
                      {Object.keys(PREGNANCY_DURATIONS).map(type => (
                        <option key={type} value={type} className="bg-[#0F172A]">
                          {getAnimalEmoji(type)} {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wide">Mating Type</label>
                    <select
                      value={formData.mating_type}
                      onChange={(e) => setFormData({ ...formData, mating_type: e.target.value })}
                      className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:ring-2 focus:ring-[#15BB73] focus:border-transparent"
                    >
                      <option value="natural" className="bg-[#0F172A]">Natural</option>
                      <option value="artificial_insemination" className="bg-[#0F172A]">AI</option>
                    </select>
                  </div>
                </div>

                {/* Row 2: Animal Name & Breed */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wide">Animal Name *</label>
                    <input
                      type="text"
                      value={formData.animal_name}
                      onChange={(e) => setFormData({ ...formData, animal_name: e.target.value })}
                      className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-[#15BB73] focus:border-transparent"
                      placeholder="e.g., Lakshmi"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wide">Breed</label>
                    <input
                      type="text"
                      value={formData.breed_name}
                      onChange={(e) => setFormData({ ...formData, breed_name: e.target.value })}
                      className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-[#15BB73] focus:border-transparent"
                      placeholder="e.g., Gir"
                    />
                  </div>
                </div>

                {/* Mating Date with Expected Delivery Info */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wide">Mating Date *</label>
                  <input
                    type="date"
                    value={formData.mating_date}
                    onChange={(e) => setFormData({ ...formData, mating_date: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:ring-2 focus:ring-[#15BB73] focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-[#15BB73] mt-1 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Expected delivery: ~{PREGNANCY_DURATIONS[formData.animal_type]?.months} from mating date
                  </p>
                </div>

                {/* Bull/Sire Details */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wide">Bull/Sire Details</label>
                  <input
                    type="text"
                    value={formData.bull_sire_details}
                    onChange={(e) => setFormData({ ...formData, bull_sire_details: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-[#15BB73] focus:border-transparent"
                    placeholder="e.g., Bull name, AI straw number"
                  />
                </div>

                {/* Notes - Smaller */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wide">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-[#15BB73] focus:border-transparent resize-none"
                    rows="2"
                    placeholder="Any additional notes..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 px-4 py-2.5 border border-white/20 text-gray-300 rounded-lg hover:bg-white/10 text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white px-4 py-2.5 rounded-lg font-bold text-sm hover:shadow-lg hover:shadow-[#15BB73]/20 transition-all"
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-sm border border-white/10">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-white flex items-center">
                <span className="mr-2">🐣</span> Mark as Delivered
              </h3>
              <button
                onClick={() => {
                  setShowDeliverModal(false);
                  setSelectedRecord(null);
                }}
                className="text-gray-400 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4">
              {/* Animal Info Card */}
              <div className="mb-4 p-3 bg-white/5 rounded-lg flex items-center space-x-3">
                <span className="text-3xl">{getAnimalEmoji(selectedRecord.animal_type)}</span>
                <div>
                  <p className="text-white font-bold">{selectedRecord.animal_name}</p>
                  <p className="text-gray-400 text-xs">{selectedRecord.breed_name || selectedRecord.animal_type}</p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Delivery Date & Offspring Count Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wide">Delivery Date</label>
                    <input
                      type="date"
                      value={deliveryData.delivery_date}
                      onChange={(e) => setDeliveryData({ ...deliveryData, delivery_date: e.target.value })}
                      className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wide">Count</label>
                    <input
                      type="number"
                      min="1"
                      value={deliveryData.offspring_count}
                      onChange={(e) => setDeliveryData({ ...deliveryData, offspring_count: parseInt(e.target.value) })}
                      className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Gender Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wide">Gender</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['male', 'female', 'mixed'].map((gender) => (
                      <button
                        key={gender}
                        type="button"
                        onClick={() => setDeliveryData({ ...deliveryData, offspring_gender: gender })}
                        className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                          deliveryData.offspring_gender === gender
                            ? 'bg-blue-500 text-white'
                            : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                      >
                        {gender === 'male' ? '♂ Male' : gender === 'female' ? '♀ Female' : '⚥ Mixed'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Offspring Details */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wide">Details (Optional)</label>
                  <textarea
                    value={deliveryData.offspring_details}
                    onChange={(e) => setDeliveryData({ ...deliveryData, offspring_details: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows="2"
                    placeholder="Health, weight, markings..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeliverModal(false);
                      setSelectedRecord(null);
                    }}
                    className="flex-1 px-4 py-2.5 border border-white/20 text-gray-300 rounded-lg hover:bg-white/10 text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeliver}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2.5 rounded-lg font-bold text-sm hover:shadow-lg hover:shadow-blue-500/20 transition-all"
                  >
                    Confirm
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
