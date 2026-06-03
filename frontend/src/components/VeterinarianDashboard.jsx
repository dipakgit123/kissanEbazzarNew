import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';
import LanguageSwitcher from './LanguageSwitcher';
import { safeJsonParse } from '../utils/stringUtils';
import { FullPageLoader } from './AppLoader';

// Icons
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const ProfileIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const PatientsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const StarIcon = ({ filled }) => (
  <svg className={`w-4 h-4 ${filled ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const MoonIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const SunIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const VeterinarianDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [veterinarian, setVeterinarian] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    // Load dark mode preference from localStorage
    const saved = localStorage.getItem('vetDarkMode');
    return safeJsonParse(saved, false);
  });
  const [stats, setStats] = useState({
    totalPatients: 0,
    appointmentsToday: 0,
    rating: 0,
    totalReviews: 0
  });

  const doctorPrefix = t('vetDashboard.doctorPrefix', 'Dr.');
  const notAvailableLabel = t('vetDashboard.notAvailable', 'N/A');
  const translatedVeterinarianLabel = t('vetDashboard.veterinarian', 'Veterinarian');

  // Mock data for charts - Replace with real API data later
  const appointmentsData = [
    { month: t('vetDashboard.monthJan', 'Jan'), appointments: 45, revenue: 22500 },
    { month: t('vetDashboard.monthFeb', 'Feb'), appointments: 52, revenue: 26000 },
    { month: t('vetDashboard.monthMar', 'Mar'), appointments: 48, revenue: 24000 },
    { month: t('vetDashboard.monthApr', 'Apr'), appointments: 61, revenue: 30500 },
    { month: t('vetDashboard.monthMay', 'May'), appointments: 55, revenue: 27500 },
    { month: t('vetDashboard.monthJun', 'Jun'), appointments: 67, revenue: 33500 },
  ];

  const patientTypeData = [
    { name: t('vetDashboard.animalCattle', 'Cattle'), value: 45, color: '#3B82F6' },
    { name: t('vetDashboard.animalBuffalo', 'Buffalo'), value: 25, color: '#8B5CF6' },
    { name: t('vetDashboard.animalGoat', 'Goat'), value: 15, color: '#10B981' },
    { name: t('vetDashboard.animalDog', 'Dog'), value: 10, color: '#F59E0B' },
    { name: t('vetDashboard.animalCat', 'Cat'), value: 5, color: '#EF4444' },
  ];

  const weeklyAppointments = [
    { day: t('vetDashboard.dayMon', 'Mon'), appointments: 8, consultations: 6 },
    { day: t('vetDashboard.dayTue', 'Tue'), appointments: 12, consultations: 10 },
    { day: t('vetDashboard.dayWed', 'Wed'), appointments: 10, consultations: 8 },
    { day: t('vetDashboard.dayThu', 'Thu'), appointments: 15, consultations: 12 },
    { day: t('vetDashboard.dayFri', 'Fri'), appointments: 9, consultations: 7 },
    { day: t('vetDashboard.daySat', 'Sat'), appointments: 14, consultations: 11 },
    { day: t('vetDashboard.daySun', 'Sun'), appointments: 6, consultations: 5 },
  ];

  const revenueData = [
    { month: t('vetDashboard.monthJan', 'Jan'), consultation: 15000, surgery: 7500, vaccination: 3000 },
    { month: t('vetDashboard.monthFeb', 'Feb'), consultation: 18000, surgery: 8000, vaccination: 3500 },
    { month: t('vetDashboard.monthMar', 'Mar'), consultation: 16000, surgery: 8000, vaccination: 3200 },
    { month: t('vetDashboard.monthApr', 'Apr'), consultation: 20000, surgery: 10500, vaccination: 4000 },
    { month: t('vetDashboard.monthMay', 'May'), consultation: 18500, surgery: 9000, vaccination: 3800 },
    { month: t('vetDashboard.monthJun', 'Jun'), consultation: 22000, surgery: 11500, vaccination: 4500 },
  ];

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('vetToken');
    const vetData = localStorage.getItem('veterinarian');

    if (!token || !vetData) {
      navigate('/veterinarian/login');
      return;
    }

    const parsedVet = safeJsonParse(vetData, null);
    if (parsedVet) {
      setVeterinarian(parsedVet);
      setStats({
        totalPatients: Number(parsedVet.total_patients) || 0,
        appointmentsToday: 0,
        rating: Number(parsedVet.rating) || 0,
        totalReviews: Number(parsedVet.total_reviews) || 0
      });
    } else {
      navigate('/veterinarian/login');
    }

    setIsLoading(false);
  }, [navigate]);

  // Dark mode effect
  useEffect(() => {
    localStorage.setItem('vetDarkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleLogout = () => {
    localStorage.removeItem('vetToken');
    localStorage.removeItem('veterinarian');
    toast.success(t('vetDashboard.logoutSuccess', 'Logged out successfully'));
    navigate('/veterinarian/login');
  };

  const formatSpecialization = (spec) => {
    const specializationMap = {
      general: t('vetDashboard.specializationGeneral', 'General'),
      large_animal: t('vetDashboard.specializationLargeAnimal', 'Large Animal'),
      small_animal: t('vetDashboard.specializationSmallAnimal', 'Small Animal'),
      livestock: t('vetDashboard.specializationLivestock', 'Livestock'),
      surgery: t('vetDashboard.specializationSurgery', 'Surgery'),
      emergency: t('vetDashboard.specializationEmergency', 'Emergency'),
      reproduction: t('vetDashboard.specializationReproduction', 'Reproduction')
    };

    if (!spec) return '';
    return specializationMap[spec] || spec.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatService = (service) => {
    const serviceMap = {
      checkup: t('vetDashboard.serviceCheckup', 'Checkup'),
      vaccination: t('vetDashboard.serviceVaccination', 'Vaccination'),
      surgery: t('vetDashboard.serviceSurgery', 'Surgery'),
      emergency: t('vetDashboard.serviceEmergency', 'Emergency'),
      pregnancy: t('vetDashboard.servicePregnancy', 'Pregnancy'),
      dental: t('vetDashboard.serviceDental', 'Dental'),
      deworming: t('vetDashboard.serviceDeworming', 'Deworming'),
      artificial_insemination: t('vetDashboard.serviceArtificialInsemination', 'Artificial Insemination')
    };

    return serviceMap[service] || service;
  };

  const getVerificationBadge = (status) => {
    switch (status) {
      case 'verified':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            {t('vetDashboard.verified', 'Verified')}
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
            {t('vetDashboard.pending', 'Pending')}
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            {t('vetDashboard.rejected', 'Rejected')}
          </span>
        );
      default:
        return null;
    }
  };

  const renderRatingStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(<StarIcon key={i} filled={i <= rating} />);
    }
    return stars;
  };

  const sidebarItems = [
    { id: 'dashboard', label: t('vetDashboard.dashboard', 'Dashboard'), icon: <DashboardIcon /> },
    { id: 'profile', label: t('vetDashboard.myProfile', 'My Profile'), icon: <ProfileIcon /> },
    { id: 'appointments', label: t('vetDashboard.appointments', 'Appointments'), icon: <CalendarIcon /> },
    { id: 'patients', label: t('vetDashboard.patients', 'Patients'), icon: <PatientsIcon /> },
    { id: 'settings', label: t('vetDashboard.settings', 'Settings'), icon: <SettingsIcon /> }
  ];
  const activeTabLabel = sidebarItems.find((item) => item.id === activeTab)?.label || t('vetDashboard.dashboard', 'Dashboard');

  if (isLoading) {
    return <FullPageLoader message={t('vetDashboard.loadingDashboard', 'Loading dashboard...')} />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      <Toaster position="top-right" />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 shadow-lg transform transition-all duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
      >
        <div className="p-4 sm:p-6">
          {/* Logo */}
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <h1 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{t('vetDashboard.vetPortal', 'Vet Portal')}</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className={`lg:hidden ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <CloseIcon />
            </button>
          </div>

          {/* User Info */}
          <div className={`mb-6 sm:mb-8 p-3 sm:p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center overflow-hidden">
                {veterinarian?.profile_photo ? (
                  <img
                    src={veterinarian.profile_photo}
                    alt={veterinarian.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className={`font-bold text-lg ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    {veterinarian?.full_name?.charAt(0) || 'V'}
                  </span>
                )}
              </div>
              <div>
                <h3 className={`font-semibold text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  {doctorPrefix} {veterinarian?.full_name || translatedVeterinarianLabel}
                </h3>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {formatSpecialization(veterinarian?.specialization)}
                </p>
              </div>
            </div>
            <div className="mt-3">
              {getVerificationBadge(veterinarian?.verification_status)}
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors text-sm sm:text-base ${activeTab === item.id
                  ? 'bg-blue-600 text-white'
                  : darkMode
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className={`w-full flex items-center space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 mt-4 rounded-lg transition-colors text-sm sm:text-base ${darkMode
              ? 'text-yellow-400 hover:bg-gray-700'
              : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            {darkMode ? <SunIcon /> : <MoonIcon />}
            <span className="font-medium">{darkMode ? t('vetDashboard.lightMode', 'Light Mode') : t('vetDashboard.darkMode', 'Dark Mode')}</span>
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 mt-4 rounded-lg transition-colors text-sm sm:text-base ${darkMode
              ? 'text-red-400 hover:bg-gray-700'
              : 'text-red-600 hover:bg-red-50'
              }`}
          >
            <LogoutIcon />
            <span className="font-medium">{t('vetDashboard.logout', 'Logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Bar */}
        <header className={`shadow-sm sticky top-0 z-30 transition-colors ${darkMode ? 'bg-gray-800 border-b border-gray-700' : 'bg-white'}`}>
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className={`lg:hidden ${darkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-800'}`}
            >
              <MenuIcon />
            </button>

            <h2 className={`text-lg sm:text-xl font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              {activeTabLabel}
            </h2>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <button className={`hidden sm:block relative p-2 ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}>
                <svg className="w-5 sm:w-6 h-5 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-colors ${darkMode
                  ? 'text-yellow-400 hover:bg-gray-700'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                {darkMode ? <SunIcon /> : <MoonIcon />}
              </button>
              <LanguageSwitcher />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Stats Cards with Animation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className={`rounded-xl shadow-lg p-4 sm:p-6 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl animate-fadeInUp ${darkMode ? 'bg-gradient-to-br from-blue-600 to-blue-700' : 'bg-gradient-to-br from-blue-500 to-blue-600'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className="text-white">
                      <p className="text-sm text-blue-100 mb-2">{t('vetDashboard.totalAnimalsTreated', 'Total Animals Treated')}</p>
                      <p className="text-2xl sm:text-3xl font-bold mb-1">{stats.totalPatients}</p>
                      <div className="flex items-center text-xs text-blue-100">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                        </svg>
                        <span>{t('vetDashboard.thisMonth', '+12% this month')}</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-bounce-slow">
                      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className={`rounded-xl shadow-lg p-4 sm:p-6 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl animate-fadeInUp ${darkMode ? 'bg-gradient-to-br from-green-600 to-green-700' : 'bg-gradient-to-br from-green-500 to-green-600'
                  }`} style={{ animationDelay: '0.1s' }}>
                  <div className="flex items-center justify-between">
                    <div className="text-white">
                      <p className="text-sm text-green-100 mb-2">{t('vetDashboard.todayAppointments', "Today's Appointments")}</p>
                      <p className="text-2xl sm:text-3xl font-bold mb-1">{stats.appointmentsToday || 8}</p>
                      <div className="flex items-center text-xs text-green-100">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        <span>3 {t('vetDashboard.pending', 'pending')}</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-pulse">
                      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className={`rounded-xl shadow-lg p-4 sm:p-6 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl animate-fadeInUp ${darkMode ? 'bg-gradient-to-br from-yellow-600 to-orange-600' : 'bg-gradient-to-br from-yellow-500 to-orange-500'
                  }`} style={{ animationDelay: '0.2s' }}>
                  <div className="flex items-center justify-between">
                    <div className="text-white">
                      <p className="text-sm text-yellow-100 mb-2">{t('vetDashboard.rating', 'Rating')}</p>
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-2xl sm:text-3xl font-bold">{stats.rating.toFixed(1)}</p>
                        <div className="flex">{renderRatingStars(Math.round(stats.rating || 4))}</div>
                      </div>
                      <div className="flex items-center text-xs text-yellow-100">
                        <span>{stats.totalReviews} {t('vetDashboard.reviews', 'reviews')}</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-bounce-slow">
                      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className={`rounded-xl shadow-lg p-4 sm:p-6 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl animate-fadeInUp ${darkMode ? 'bg-gradient-to-br from-purple-600 to-indigo-700' : 'bg-gradient-to-br from-purple-500 to-indigo-600'
                  }`} style={{ animationDelay: '0.3s' }}>
                  <div className="flex items-center justify-between">
                    <div className="text-white">
                      <p className="text-sm text-purple-100 mb-2">{t('vetDashboard.monthlyRevenue', 'Monthly Revenue')}</p>
                      <p className="text-2xl sm:text-3xl font-bold mb-1">₹33.5K</p>
                      <div className="flex items-center text-xs text-purple-100">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                        </svg>
                        <span>{t('vetDashboard.fromLastMonth', '+18% from last month')}</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-pulse">
                      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Appointments Trend Chart */}
                <div className={`rounded-xl shadow-lg p-4 sm:p-6 animate-fadeInUp ${darkMode ? 'bg-gray-800' : 'bg-white'}`} style={{ animationDelay: '0.4s' }}>
                  <h3 className={`text-base sm:text-lg font-semibold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{t('vetDashboard.appointmentsRevenueTrend', 'Appointments & Revenue Trend')}</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={appointmentsData}>
                      <defs>
                        <linearGradient id="colorAppointments" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#f0f0f0'} />
                      <XAxis dataKey="month" stroke={darkMode ? '#9CA3AF' : '#6B7280'} style={{ fontSize: '12px' }} />
                      <YAxis stroke={darkMode ? '#9CA3AF' : '#6B7280'} style={{ fontSize: '12px' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: darkMode ? '#1F2937' : '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                          color: darkMode ? '#F3F4F6' : '#111827'
                        }}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="appointments" stroke="#3B82F6" fillOpacity={1} fill="url(#colorAppointments)" />
                      <Area type="monotone" dataKey="revenue" stroke="#10B981" fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Animal Types Distribution */}
                <div className={`rounded-xl shadow-lg p-4 sm:p-6 animate-fadeInUp ${darkMode ? 'bg-gray-800' : 'bg-white'}`} style={{ animationDelay: '0.5s' }}>
                  <h3 className={`text-base sm:text-lg font-semibold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{t('vetDashboard.animalTypesDistribution', 'Animal Types Distribution')}</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={patientTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={800}
                      >
                        {patientTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Weekly Performance Chart */}
              <div className={`rounded-xl shadow-lg p-4 sm:p-6 animate-fadeInUp ${darkMode ? 'bg-gray-800' : 'bg-white'}`} style={{ animationDelay: '0.6s' }}>
                <h3 className={`text-base sm:text-lg font-semibold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{t('vetDashboard.weeklyPerformance', 'Weekly Performance')}</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={weeklyAppointments}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#f0f0f0'} />
                    <XAxis dataKey="day" stroke={darkMode ? '#9CA3AF' : '#6B7280'} style={{ fontSize: '12px' }} />
                    <YAxis stroke={darkMode ? '#9CA3AF' : '#6B7280'} style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: darkMode ? '#1F2937' : '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        color: darkMode ? '#F3F4F6' : '#111827'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="appointments" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="consultations" fill="#10B981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Revenue Breakdown Chart */}
              <div className={`rounded-xl shadow-lg p-4 sm:p-6 animate-fadeInUp ${darkMode ? 'bg-gray-800' : 'bg-white'}`} style={{ animationDelay: '0.7s' }}>
                <h3 className={`text-base sm:text-lg font-semibold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{t('vetDashboard.revenueBreakdownByService', 'Revenue Breakdown by Service')}</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#f0f0f0'} />
                    <XAxis dataKey="month" stroke={darkMode ? '#9CA3AF' : '#6B7280'} style={{ fontSize: '12px' }} />
                    <YAxis stroke={darkMode ? '#9CA3AF' : '#6B7280'} style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: darkMode ? '#1F2937' : '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        color: darkMode ? '#F3F4F6' : '#111827'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="consultation" stroke="#3B82F6" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="surgery" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="vaccination" stroke="#10B981" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Quick Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className={`rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow duration-300 animate-fadeInUp ${darkMode ? 'bg-gray-800' : 'bg-white'}`} style={{ animationDelay: '0.8s' }}>
                  <div className="flex items-center mb-4">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mr-3 ${darkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
                      <svg className={`w-5 h-5 sm:w-6 sm:h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h3 className={`text-base sm:text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{t('vetDashboard.profileSummary', 'Profile Summary')}</h3>
                  </div>
                  <div className="space-y-3">
                    <div className={`flex justify-between items-center py-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                      <span className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('vetDashboard.specialization', 'Specialization')}</span>
                      <span className={`font-medium text-xs sm:text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{formatSpecialization(veterinarian?.specialization)}</span>
                    </div>
                    <div className={`flex justify-between items-center py-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                      <span className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('vetDashboard.experience', 'Experience')}</span>
                      <span className={`font-medium text-xs sm:text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{veterinarian?.experience_years || 0} {t('vetDashboard.years', 'years')}</span>
                    </div>
                    <div className={`flex justify-between items-center py-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                      <span className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('vetDashboard.qualification', 'Qualification')}</span>
                      <span className={`font-medium text-xs sm:text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{veterinarian?.qualification || notAvailableLabel}</span>
                    </div>
                    <div className={`flex justify-between items-center py-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                      <span className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('vetDashboard.consultationFee', 'Consultation Fee')}</span>
                      <span className="font-semibold text-xs sm:text-sm text-green-600">₹{veterinarian?.consultation_fee || 0}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('vetDashboard.emergencyAvailable', 'Emergency Available')}</span>
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${veterinarian?.emergency_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {veterinarian?.emergency_available ? t('vetDashboard.available', 'Available') : t('vetDashboard.notAvailable', 'Not Available')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={`rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow duration-300 animate-fadeInUp ${darkMode ? 'bg-gray-800' : 'bg-white'}`} style={{ animationDelay: '0.9s' }}>
                  <div className="flex items-center mb-4">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mr-3 ${darkMode ? 'bg-purple-900' : 'bg-purple-100'}`}>
                      <svg className={`w-5 h-5 sm:w-6 sm:h-6 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className={`text-base sm:text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{t('vetDashboard.clinicInformation', 'Clinic Information')}</h3>
                  </div>
                  <div className="space-y-3">
                    <div className={`flex justify-between items-center py-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                      <span className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('vetDashboard.clinicName', 'Clinic Name')}</span>
                      <span className={`font-medium text-xs sm:text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{veterinarian?.clinic_name || notAvailableLabel}</span>
                    </div>
                    <div className={`flex justify-between items-center py-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                      <span className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('vetDashboard.city', 'City')}</span>
                      <span className={`font-medium text-xs sm:text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{veterinarian?.city || notAvailableLabel}</span>
                    </div>
                    <div className={`flex justify-between items-center py-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                      <span className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('vetDashboard.state', 'State')}</span>
                      <span className={`font-medium text-xs sm:text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{veterinarian?.state || notAvailableLabel}</span>
                    </div>
                    <div className={`flex justify-between items-center py-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                      <span className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('vetDashboard.pincode', 'Pincode')}</span>
                      <span className={`font-medium text-xs sm:text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{veterinarian?.pincode || notAvailableLabel}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('vetDashboard.phone', 'Phone')}</span>
                      <span className={`font-medium text-xs sm:text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{veterinarian?.phone_number || notAvailableLabel}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 animate-fadeInUp" style={{ animationDelay: '1s' }}>
                <button className={`rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-white ${darkMode ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                  }`}>
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 mb-2 sm:mb-3 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h4 className="font-semibold mb-1 text-sm sm:text-base">{t('vetDashboard.viewAppointments', 'View Appointments')}</h4>
                  <p className="text-xs text-blue-100">{t('vetDashboard.manageSchedule', 'Manage your schedule')}</p>
                </button>

                <button className={`rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-white ${darkMode ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                  }`}>
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 mb-2 sm:mb-3 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h4 className="font-semibold mb-1 text-sm sm:text-base">{t('vetDashboard.patientRecords', 'Patient Records')}</h4>
                  <p className="text-xs text-green-100">{t('vetDashboard.accessHistory', 'Access animal history')}</p>
                </button>

                <button className={`rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-white ${darkMode ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800' : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
                  }`}>
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 mb-2 sm:mb-3 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <h4 className="font-semibold mb-1 text-sm sm:text-base">{t('vetDashboard.generateReport', 'Generate Report')}</h4>
                  <p className="text-xs text-purple-100">{t('vetDashboard.createReports', 'Create medical reports')}</p>
                </button>
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className={`rounded-xl shadow-lg p-4 sm:p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`text-base sm:text-lg font-semibold mb-6 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{t('vetDashboard.myProfile', 'My Profile')}</h3>

              <div className="flex flex-col md:flex-row gap-8">
                {/* Profile Photo */}
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                    {veterinarian?.profile_photo ? (
                      <img
                        src={veterinarian.profile_photo}
                        alt={veterinarian.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-blue-600 font-bold text-4xl">
                        {veterinarian?.full_name?.charAt(0) || 'V'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Profile Details */}
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-500">{t('vetDashboard.fullName', 'Full Name')}</label>
                      <p className="font-medium text-gray-800">{doctorPrefix} {veterinarian?.full_name}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">{t('vetDashboard.email', 'Email')}</label>
                      <p className="font-medium text-gray-800">{veterinarian?.email || notAvailableLabel}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">{t('vetDashboard.phone', 'Phone')}</label>
                      <p className="font-medium text-gray-800">{veterinarian?.phone_number}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">{t('vetDashboard.licenseNumber', 'License Number')}</label>
                      <p className="font-medium text-gray-800">{veterinarian?.license_number}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">{t('vetDashboard.specialization', 'Specialization')}</label>
                      <p className="font-medium text-gray-800">{formatSpecialization(veterinarian?.specialization)}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">{t('vetDashboard.experience', 'Experience')}</label>
                      <p className="font-medium text-gray-800">{veterinarian?.experience_years} {t('vetDashboard.years', 'years')}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">{t('vetDashboard.qualification', 'Qualification')}</label>
                      <p className="font-medium text-gray-800">{veterinarian?.qualification}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">{t('vetDashboard.consultationFee', 'Consultation Fee')}</label>
                      <p className="font-medium text-gray-800">{veterinarian?.consultation_fee ? `₹${veterinarian.consultation_fee}` : notAvailableLabel}</p>
                    </div>
                  </div>

                  {/* Services */}
                  {veterinarian?.services && veterinarian.services.length > 0 && (
                    <div>
                      <label className="text-sm text-gray-500">{t('vetDashboard.services', 'Services')}</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {veterinarian.services.map((service, index) => (
                          <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                            {formatService(service)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Address */}
                  <div>
                    <label className="text-sm text-gray-500">{t('vetDashboard.clinicAddress', 'Clinic Address')}</label>
                    <p className="font-medium text-gray-800">
                      {veterinarian?.clinic_address || veterinarian?.clinic_name}
                      {veterinarian?.city && `, ${veterinarian.city}`}
                      {veterinarian?.state && `, ${veterinarian.state}`}
                      {veterinarian?.pincode && ` - ${veterinarian.pincode}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Appointments Tab */}
          {activeTab === 'appointments' && (
            <div className={`rounded-xl shadow-lg p-4 sm:p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`text-base sm:text-lg font-semibold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{t('vetDashboard.appointments', 'Appointments')}</h3>
              <div className="text-center py-12">
                <svg className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className={`text-sm sm:text-base ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('vetDashboard.noAppointmentsYet', 'No appointments yet')}</p>
                <p className={`text-xs sm:text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{t('vetDashboard.appointmentFeatureComingSoon', 'Appointment booking feature coming soon!')}</p>
              </div>
            </div>
          )}

          {/* Patients Tab */}
          {activeTab === 'patients' && (
            <div className={`rounded-xl shadow-lg p-4 sm:p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`text-base sm:text-lg font-semibold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{t('vetDashboard.patientRecords', 'Patient Records')}</h3>
              <div className="text-center py-12">
                <svg className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className={`text-sm sm:text-base ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('vetDashboard.noPatientRecordsYet', 'No patient records yet')}</p>
                <p className={`text-xs sm:text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{t('vetDashboard.patientFeatureComingSoon', 'Patient management feature coming soon!')}</p>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className={`rounded-xl shadow-lg p-4 sm:p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`text-base sm:text-lg font-semibold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{t('vetDashboard.settings', 'Settings')}</h3>
              <div className="space-y-4 sm:space-y-6">
                <div className={`flex items-center justify-between p-3 sm:p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex-1 mr-4">
                    <p className={`font-medium text-sm sm:text-base ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{t('vetDashboard.emailNotifications', 'Email Notifications')}</p>
                    <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('vetDashboard.emailNotificationsDesc', 'Receive email notifications for appointments')}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${darkMode ? 'bg-gray-600 after:border-gray-500' : 'bg-gray-200 after:border-gray-300'}`}></div>
                  </label>
                </div>

                <div className={`flex items-center justify-between p-3 sm:p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex-1 mr-4">
                    <p className={`font-medium text-sm sm:text-base ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{t('vetDashboard.smsNotifications', 'SMS Notifications')}</p>
                    <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('vetDashboard.smsNotificationsDesc', 'Receive SMS alerts for new appointments')}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${darkMode ? 'bg-gray-600 after:border-gray-500' : 'bg-gray-200 after:border-gray-300'}`}></div>
                  </label>
                </div>

                <div className={`flex items-center justify-between p-3 sm:p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex-1 mr-4">
                    <p className={`font-medium text-sm sm:text-base ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{t('vetDashboard.emergencyAvailability', 'Emergency Availability')}</p>
                    <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('vetDashboard.emergencyAvailabilityDesc', 'Show as available for emergency calls')}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked={veterinarian?.emergency_available} />
                    <div className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${darkMode ? 'bg-gray-600 after:border-gray-500' : 'bg-gray-200 after:border-gray-300'}`}></div>
                  </label>
                </div>

                <div className={`pt-4 sm:pt-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <button className={`px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${darkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}>
                    {t('vetDashboard.changePassword', 'Change Password')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default VeterinarianDashboard;

// Add custom CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes bounce-slow {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  .animate-fadeInUp {
    animation: fadeInUp 0.6s ease-out forwards;
    opacity: 0;
  }

  .animate-bounce-slow {
    animation: bounce-slow 2s ease-in-out infinite;
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  ::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #555;
  }

  /* Smooth gradient animations */
  @keyframes gradient {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }

  .animate-gradient {
    background-size: 200% 200%;
    animation: gradient 3s ease infinite;
  }
`;
document.head.appendChild(style);
