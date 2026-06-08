import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { pregnancyService } from '../services/api';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  FaBaby,
  FaCalendarDays,
  FaCalendarXmark,
  FaCat,
  FaChartBar,
  FaChevronLeft,
  FaChevronRight,
  FaCircleInfo,
  FaClock,
  FaCow,
  FaDog,
  FaHorseHead,
  FaPaw,
  FaPlus,
  FaTriangleExclamation,
  FaXmark
} from 'react-icons/fa6';
import { GiAlarmClock, GiBuffaloHead, GiGoat, GiSheep } from 'react-icons/gi';
import { MdPregnantWoman } from 'react-icons/md';
import { FullPageLoader } from './AppLoader';

// Pregnancy duration in days for different animal types
const PREGNANCY_DURATIONS = {
  cow: { days: 280, monthCount: 9, Icon: FaCow, iconClass: 'text-emerald-300' },
  buffalo: { days: 310, monthCount: 10, Icon: GiBuffaloHead, iconClass: 'text-slate-300' },
  goat: { days: 150, monthCount: 5, Icon: GiGoat, iconClass: 'text-amber-300' },
  sheep: { days: 150, monthCount: 5, Icon: GiSheep, iconClass: 'text-zinc-200' },
  horse: { days: 340, monthCount: 11, Icon: FaHorseHead, iconClass: 'text-violet-300' },
  dog: { days: 63, monthCount: 2, Icon: FaDog, iconClass: 'text-orange-300' },
  cat: { days: 65, monthCount: 2, Icon: FaCat, iconClass: 'text-rose-300' },
  other: { days: 150, monthCount: 5, Icon: FaPaw, iconClass: 'text-sky-300' }
};

const getAnimalMeta = (type) => {
  return PREGNANCY_DURATIONS[type?.toLowerCase()] || PREGNANCY_DURATIONS.cow;
};

const AnimalTypeIcon = ({ type, className = 'text-xl', containerClassName = '' }) => {
  const { Icon, iconClass } = getAnimalMeta(type);
  return (
    <span className={`inline-flex items-center justify-center ${containerClassName}`}>
      <Icon className={`${iconClass} ${className}`} />
    </span>
  );
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
const getStatusBadge = (status, t) => {
  const badges = {
    pregnant: { bg: 'bg-green-100', text: 'text-green-700', label: t('pregnancy.statusActive') },
    delivered: { bg: 'bg-gray-100', text: 'text-gray-700', label: t('pregnancy.delivered') },
    miscarriage: { bg: 'bg-red-100', text: 'text-red-700', label: t('pregnancy.statusMiscarriage') },
    false_pregnancy: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: t('pregnancy.statusFalsePregnancy') },
    cancelled: { bg: 'bg-gray-100', text: 'text-gray-500', label: t('pregnancy.statusCancelled') }
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
    ear_badge_number: '',
    mating_date: new Date().toISOString().split('T')[0],
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

      const [recordsRes, , statsRes] = await Promise.all([
        pregnancyService.getRecords(),
        pregnancyService.getMyAnimals(),
        pregnancyService.getStats()
      ]);

      if (recordsRes.success) setPregnancyRecords(recordsRes.data || []);
      if (statsRes.success) setStats(statsRes.data);
    } catch (err) {
      console.error('Error fetching pregnancy data:', err);
      setError(t('pregnancy.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

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
          ear_badge_number: '',
          mating_date: new Date().toISOString().split('T')[0],
          notes: ''
        });
        fetchData();
      }
    } catch (err) {
      console.error('Error creating pregnancy record:', err);
      toast.error(t('pregnancy.createFailed'));
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
      toast.error(t('pregnancy.markDeliveredFailed'));
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!confirm(t('pregnancy.deleteConfirm'))) return;
    try {
      const response = await pregnancyService.deleteRecord(id);
      if (response.success) {
        setPregnancyRecords(pregnancyRecords.filter(r => r.id !== id));
        fetchData();
      }
    } catch (err) {
      console.error('Error deleting record:', err);
      toast.error(t('pregnancy.deleteFailed'));
    }
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
            <div className="flex items-center gap-1 text-xs text-red-400 font-semibold">
              <FaClock className="text-[10px]" />
              {t("pregnancy.due")}
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
    return <FullPageLoader message={t("pregnancy.loadingCalendar")} dark />;
  }

  return (
    <div className="min-h-screen bg-black py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{t("pregnancy.pageTitle")}</h1>
              <p className="text-gray-400">{t("pregnancy.pageDescription")}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-900 hover:border-gray-600 transition-colors font-medium"
              >{t("pregnancy.back")}</Link>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-5 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <FaPlus className="w-4 h-4" />
                {t("pregnancy.addPregnancy")}
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
                  <p className="text-sm font-medium text-gray-400 mb-1">{t("pregnancy.activePregnancies")}</p>
                  <p className="text-3xl font-bold text-white">{stats.active_pregnancies || 0}</p>
                </div>
                <div className="w-12 h-12 bg-green-900/50 rounded-lg flex items-center justify-center border border-green-700">
                  <MdPregnantWoman className="text-2xl text-green-300" />
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-sm hover:shadow-md hover:border-blue-700 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">{t("pregnancy.delivered")}</p>
                  <p className="text-3xl font-bold text-white">{stats.successful_deliveries || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-900/50 rounded-lg flex items-center justify-center border border-blue-700">
                  <FaBaby className="text-2xl text-blue-300" />
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-sm hover:shadow-md hover:border-orange-700 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">{t("pregnancy.dueSoon")}</p>
                  <p className="text-3xl font-bold text-white">{stats.upcoming_deliveries?.length || 0}</p>
                </div>
                <div className="w-12 h-12 bg-orange-900/50 rounded-lg flex items-center justify-center border border-orange-700">
                  <GiAlarmClock className="text-2xl text-orange-300" />
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-sm hover:shadow-md hover:border-purple-700 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">{t("pregnancy.totalRecords")}</p>
                  <p className="text-3xl font-bold text-white">{stats.total_records || 0}</p>
                </div>
                <div className="w-12 h-12 bg-purple-900/50 rounded-lg flex items-center justify-center border border-purple-700">
                  <FaChartBar className="text-2xl text-purple-300" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* {t("pregnancy.pregnancyDurationReference")} */}
        <div className="mb-8 bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-sm">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FaCalendarDays className="text-sky-300" />
            {t("pregnancy.pregnancyDurationReference")}
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PREGNANCY_DURATIONS).map(([type, info]) => (
              <div key={type} className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 hover:border-green-600 transition-colors">
                <AnimalTypeIcon type={type} className="text-lg" />
                <span className="text-sm text-gray-300 font-medium">{t(`pregnancy.animal${type.charAt(0).toUpperCase() + type.slice(1)}`)}:</span>
                <span className="text-sm text-green-400 font-semibold">{t(`pregnancy.months${info.monthCount}`)}</span>
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
                  <FaChevronLeft className="w-5 h-5 text-gray-300" />
                </button>

                <h2 className="text-xl font-bold text-white">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>

                <button
                  onClick={() => navigateMonth(1)}
                  className="p-2 rounded-lg border border-gray-700 hover:bg-gray-800 hover:border-gray-600 transition-colors"
                >
                  <FaChevronRight className="w-5 h-5 text-gray-300" />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {[t('pregnancy.sun'), t('pregnancy.mon'), t('pregnancy.tue'), t('pregnancy.wed'), t('pregnancy.thu'), t('pregnancy.fri'), t('pregnancy.sat')].map((day) => (
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
                  <span className="text-gray-300">{t("pregnancy.today")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-orange-900/50 border-2 border-orange-500"></div>
                  <span className="text-gray-300">{t("pregnancy.pregnant")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-900/50 border-2 border-red-500"></div>
                  <span className="text-gray-300">{t("pregnancy.dueDate")}</span>
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
              >{t("pregnancy.active")}</button>
              <button
                onClick={() => setActiveTab('delivered')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'delivered'
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
              >{t("pregnancy.delivered")}</button>
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'all'
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
              >{t('pregnancy.all')}</button>
            </div>

            {/* Records List */}
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 shadow-sm max-h-[600px] overflow-y-auto">
              {filteredRecords.length > 0 ? (
                <div className="space-y-4">
                  {filteredRecords.map((record) => {
                    const statusBadge = getStatusBadge(record.status, t);
                    const totalDays = PREGNANCY_DURATIONS[record.animal_type]?.days || 150;
                    
                    return (
                      <div
                        key={record.id}
                        className="p-4 bg-gray-800 rounded-lg border border-gray-700 hover:shadow-md hover:border-green-600 transition-all"
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <AnimalTypeIcon type={record.animal_type} className="text-2xl" />
                            <div>
                              <h4 className="text-sm font-bold text-white">{record.animal_name}</h4>
                              <p className="text-xs text-gray-400 capitalize">
                                {record.ear_badge_number
                                  ? `${t("pregnancy.earBadgeNumberShort")}: ${record.ear_badge_number}`
                                  : (record.breed_name || record.animal_type)}
                              </p>
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
                                <span>{t("pregnancy.progress")}</span>
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
                              <span className="text-gray-300 font-medium">{t("pregnancy.daysRemainingLabel")}</span>
                              <span className="text-orange-400 font-bold">{record.days_remaining || 0} {t("pregnancy.days")}</span>
                            </div>
                          </>
                        )}

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                          <div className="bg-gray-900 rounded-lg p-2.5 border border-gray-700">
                            <p className="text-gray-400 mb-1">{t("pregnancy.matingDateLabel")}</p>
                            <p className="text-gray-200 font-semibold">{formatDate(record.mating_date)}</p>
                          </div>
                          <div className="bg-gray-900 rounded-lg p-2.5 border border-gray-700">
                            <p className="text-gray-400 mb-1">{t("pregnancy.expectedDateLabel")}</p>
                            <p className="text-green-400 font-semibold">{formatDate(record.expected_delivery_date)}</p>
                          </div>
                        </div>

                        {/* Delivered info */}
                        {record.status === 'delivered' && record.actual_delivery_date && (
                          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-2.5 mb-3">
                            <p className="text-blue-300 text-xs font-medium">
                              {t("pregnancy.statusDelivered")} on {formatDate(record.actual_delivery_date)}
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
                              {t("pregnancy.markDelivered")}
                            </button>
                            <button
                              onClick={() => handleDelete(record.id)}
                              className="py-2.5 px-3 bg-red-900/30 text-red-400 rounded-lg text-xs font-semibold hover:bg-red-900/50 transition-colors border border-red-700"
                            >{t("pregnancy.delete")}</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-700">
                    <FaCalendarXmark className="text-3xl text-gray-400" />
                  </div>
                  <p className="text-gray-400 text-sm mb-3">{t("pregnancy.noRecords")}</p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="text-green-400 font-semibold text-sm hover:text-green-300"
                  >{t("pregnancy.addPregnancy")}</button>
                </div>
              )}
            </div>

            {/* Upcoming Deliveries Alert */}
            {stats?.upcoming_deliveries?.length > 0 && (
              <div className="bg-orange-900/30 rounded-xl p-4 border border-orange-700">
                <h3 className="text-sm font-bold text-orange-300 mb-3 flex items-center gap-2">
                  <FaTriangleExclamation className="text-orange-300" />
                  {t("pregnancy.dueWithin30Days")}
                </h3>
                <div className="space-y-2">
                  {stats.upcoming_deliveries.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2.5 bg-gray-800 rounded-lg border border-orange-700/50">
                      <div className="flex items-center gap-2">
                        <AnimalTypeIcon type={item.animal_type} className="text-lg" />
                        <span className="text-sm text-gray-200 font-semibold">{item.animal_name}</span>
                      </div>
                      <span className="text-xs text-orange-400 font-bold">{item.days_remaining} {t("pregnancy.days")}</span>
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
                <MdPregnantWoman className="text-green-600" />
                {t("pregnancy.addPregnancyRecord")}
              </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaXmark className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{t("pregnancy.animalType")}</label>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700">
                      <AnimalTypeIcon type={formData.animal_type} className="text-base" />
                      <span>{t(`pregnancy.animal${formData.animal_type.charAt(0).toUpperCase() + formData.animal_type.slice(1)}`)}</span>
                    </div>
                    <select
                      value={formData.animal_type}
                      onChange={(e) => setFormData({ ...formData, animal_type: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      {Object.keys(PREGNANCY_DURATIONS).map(type => (
                        <option key={type} value={type}>
                          {t(`pregnancy.animal${type.charAt(0).toUpperCase() + type.slice(1)}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{t("pregnancy.animalName")}</label>
                    <input
                      type="text"
                      value={formData.animal_name}
                      onChange={(e) => setFormData({ ...formData, animal_name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder={t("pregnancy.placeholderAnimalName")}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{t("pregnancy.earBadgeNumber")}</label>
                    <input
                      type="text"
                      value={formData.ear_badge_number}
                      onChange={(e) => setFormData({ ...formData, ear_badge_number: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder={t("pregnancy.placeholderEarBadge")}
                    />
                  </div>
                </div>

                {/* Mating Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t("pregnancy.matingDate")}</label>
                  <input
                    type="date"
                    value={formData.mating_date}
                    onChange={(e) => setFormData({ ...formData, mating_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <FaCircleInfo className="w-4 h-4" />
                    {t("pregnancy.expectedDelivery")}: ~{t(`pregnancy.months${PREGNANCY_DURATIONS[formData.animal_type]?.monthCount}`)} {t("pregnancy.fromMatingDate")}
                  </p>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t("pregnancy.notes")}</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    rows="3"
                    placeholder={t("pregnancy.placeholderNotes")}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                  >{t("pregnancy.cancel")}</button>
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-sm"
                  >{t("pregnancy.addRecord")}</button></div></form>
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
                <FaBaby className="text-blue-500" />
                {t("pregnancy.recordDelivery")}
              </h3>
              <button
                onClick={() => {
                  setShowDeliverModal(false);
                  setSelectedRecord(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaXmark className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Animal Info Card */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-3">
                <AnimalTypeIcon type={selectedRecord.animal_type} className="text-3xl" />
                <div>
                  <p className="text-gray-900 font-bold">{selectedRecord.animal_name}</p>
                  <p className="text-gray-600 text-sm">
                    {selectedRecord.ear_badge_number
                      ? `${t("pregnancy.earBadgeNumberShort")}: ${selectedRecord.ear_badge_number}`
                      : (selectedRecord.breed_name || selectedRecord.animal_type)}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Delivery Date & Offspring Count */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{t("pregnancy.deliveryDateLabel")}</label>
                    <input
                      type="date"
                      value={deliveryData.delivery_date}
                      onChange={(e) => setDeliveryData({ ...deliveryData, delivery_date: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{t("pregnancy.count")}</label>
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t("pregnancy.gender")}</label>
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
                        {gender === 'male' ? t('pregnancy.genderMale') : gender === 'female' ? t('pregnancy.genderFemale') : t('pregnancy.genderMixed')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Offspring Details */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t("pregnancy.detailsOptional")}</label>
                  <textarea
                    value={deliveryData.offspring_details}
                    onChange={(e) => setDeliveryData({ ...deliveryData, offspring_details: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    rows="3"
                    placeholder={t("pregnancy.placeholderOffspringDetails")}
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
                  >{t("pregnancy.cancel")}</button>
                  <button
                    onClick={handleDeliver}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-sm"
                  >{t("pregnancy.confirmDelivery")}</button>
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
