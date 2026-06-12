import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import LanguageSwitcher from './LanguageSwitcher';
import { FullPageLoader } from './AppLoader';
import { safeJsonParse } from '../utils/stringUtils';
import { veterinarianService } from '../services/api';

const localeMap = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
};

const LEAD_COLORS = {
  profile_view: '#3B82F6',
  whatsapp_click: '#10B981',
  call_click: '#F59E0B',
};

const EMPTY_DASHBOARD = {
  summary: {
    profileViews: 0,
    whatsappClicks: 0,
    callClicks: 0,
    totalLeads: 0,
    averageRating: 0,
    totalReviews: 0,
    profileCompletion: 0,
    last30DaysViews: 0,
    last30DaysLeads: 0,
  },
  charts: {
    activityTrend: [],
    leadSourceBreakdown: [],
  },
  recentLeads: [],
  latestReview: null,
};

const DashboardIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const ProfileIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ReviewsIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.143 3.515a1 1 0 00.95.69h3.695c.969 0 1.371 1.24.588 1.81l-2.99 2.172a1 1 0 00-.364 1.118l1.142 3.515c.3.921-.755 1.688-1.538 1.118l-2.99-2.171a1 1 0 00-1.176 0l-2.99 2.171c-.783.57-1.838-.197-1.538-1.118l1.142-3.515a1 1 0 00-.364-1.118L2.98 8.942c-.783-.57-.38-1.81.588-1.81h3.695a1 1 0 00.95-.69l1.143-3.515z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const MenuIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const EyeIcon = () => (
  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const ChatIcon = () => (
  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const StarIcon = ({ filled }) => (
  <svg className={`h-4 w-4 ${filled ? 'fill-current text-yellow-400' : 'text-gray-300'}`} viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const MoonIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const SunIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const leadTypeLabel = (t, leadType) => {
  const map = {
    profile_view: t('vetDashboard.profileViews', 'Profile Views'),
    whatsapp_click: t('vetDashboard.whatsappLeads', 'WhatsApp Leads'),
    call_click: t('vetDashboard.callLeads', 'Call Leads'),
  };

  return map[leadType] || leadType;
};

const formatService = (t, service) => {
  const map = {
    checkup: t('vetDashboard.serviceCheckup', 'Checkup'),
    vaccination: t('vetDashboard.serviceVaccination', 'Vaccination'),
    surgery: t('vetDashboard.serviceSurgery', 'Surgery'),
    emergency: t('vetDashboard.serviceEmergency', 'Emergency'),
    pregnancy: t('vetDashboard.servicePregnancy', 'Pregnancy'),
    dental: t('vetDashboard.serviceDental', 'Dental'),
    deworming: t('vetDashboard.serviceDeworming', 'Deworming'),
    artificial_insemination: t('vetDashboard.serviceArtificialInsemination', 'Artificial Insemination'),
  };

  return map[service] || service;
};

const formatSpecialization = (t, value) => {
  const map = {
    general: t('vetDashboard.specializationGeneral', 'General'),
    large_animal: t('vetDashboard.specializationLargeAnimal', 'Large Animal'),
    small_animal: t('vetDashboard.specializationSmallAnimal', 'Small Animal'),
    livestock: t('vetDashboard.specializationLivestock', 'Livestock'),
    surgery: t('vetDashboard.specializationSurgery', 'Surgery'),
    emergency: t('vetDashboard.specializationEmergency', 'Emergency'),
    reproduction: t('vetDashboard.specializationReproduction', 'Reproduction'),
  };

  return map[value] || value || '';
};

const VeterinarianDashboard = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [veterinarian, setVeterinarian] = useState(null);
  const [dashboardData, setDashboardData] = useState(EMPTY_DASHBOARD);
  const [darkMode, setDarkMode] = useState(() => safeJsonParse(localStorage.getItem('vetDarkMode'), false));

  const locale = localeMap[i18n.language] || 'en-IN';
  const summary = dashboardData.summary || EMPTY_DASHBOARD.summary;
  const profileCompletion = Number(summary.profileCompletion || veterinarian?.profile_completion || 0);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      const token = localStorage.getItem('vetToken');
      const storedVet = safeJsonParse(localStorage.getItem('veterinarian'), null);

      if (!token) {
        navigate('/veterinarian/login');
        return;
      }

      if (storedVet && isMounted) {
        setVeterinarian(storedVet);
      }

      try {
        const response = await veterinarianService.getDashboard();
        const payload = response.data || EMPTY_DASHBOARD;
        const profile = payload.profile || storedVet;

        if (!isMounted) {
          return;
        }

        if (profile) {
          setVeterinarian(profile);
          localStorage.setItem('veterinarian', JSON.stringify(profile));
        }

        setDashboardData({
          summary: {
            ...EMPTY_DASHBOARD.summary,
            ...(payload.summary || {}),
          },
          charts: {
            ...EMPTY_DASHBOARD.charts,
            ...(payload.charts || {}),
          },
          recentLeads: Array.isArray(payload.recentLeads) ? payload.recentLeads : [],
          latestReview: payload.latestReview || null,
        });
      } catch (error) {
        console.error('Failed to load veterinarian dashboard:', error);
        if (isMounted) {
          toast.error(t('vetDashboard.dashboardLoadFailed', 'Failed to load dashboard data'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [navigate, t]);

  useEffect(() => {
    localStorage.setItem('vetDarkMode', JSON.stringify(darkMode));
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const handleLogout = () => {
    localStorage.removeItem('vetToken');
    localStorage.removeItem('veterinarian');
    toast.success(t('vetDashboard.logoutSuccess', 'Logged out successfully'));
    navigate('/veterinarian/login');
  };

  const formatDate = (value) => {
    if (!value) {
      return t('vetDashboard.notAvailable', 'N/A');
    }

    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  };

  const formatDateTime = (value) => {
    if (!value) {
      return t('vetDashboard.notAvailable', 'N/A');
    }

    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));
  };

  const renderRatingStars = (rating) => {
    const normalized = Math.round(Number(rating || 0));
    return Array.from({ length: 5 }, (_, index) => (
      <StarIcon key={index + 1} filled={index + 1 <= normalized} />
    ));
  };

  const activityTrend = useMemo(() => (
    (dashboardData.charts.activityTrend || []).map((item) => ({
      day: new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(`${item.dayKey}T00:00:00`)),
      profileViews: Number(item.profileViews || 0),
      whatsappClicks: Number(item.whatsappClicks || 0),
      callClicks: Number(item.callClicks || 0),
    }))
  ), [dashboardData.charts.activityTrend, locale]);

  const leadSourceData = useMemo(() => (
    (dashboardData.charts.leadSourceBreakdown || []).map((item) => ({
      name: leadTypeLabel(t, item.leadType),
      value: Number(item.value || 0),
      color: LEAD_COLORS[item.leadType] || '#6B7280',
    }))
  ), [dashboardData.charts.leadSourceBreakdown, t]);

  const sidebarItems = [
    { id: 'dashboard', label: t('vetDashboard.dashboard', 'Dashboard'), icon: <DashboardIcon /> },
    { id: 'profile', label: t('vetDashboard.myProfile', 'My Profile'), icon: <ProfileIcon /> },
    { id: 'reviews', label: t('vetDashboard.reviews', 'Reviews'), icon: <ReviewsIcon /> },
    { id: 'settings', label: t('vetDashboard.settings', 'Settings'), icon: <SettingsIcon /> },
  ];

  const statCards = [
    {
      id: 'views',
      label: t('vetDashboard.profileViews', 'Profile Views'),
      value: summary.profileViews,
      helper: t('vetDashboard.last30DaysViewsHelper', '{{count}} in last 30 days', { count: summary.last30DaysViews }),
      classes: darkMode ? 'from-blue-600 to-blue-700' : 'from-blue-500 to-blue-600',
      icon: <EyeIcon />,
    },
    {
      id: 'whatsapp',
      label: t('vetDashboard.whatsappLeads', 'WhatsApp Leads'),
      value: summary.whatsappClicks,
      helper: t('vetDashboard.totalLeadsHelper', '{{count}} total direct leads', { count: summary.totalLeads }),
      classes: darkMode ? 'from-emerald-600 to-emerald-700' : 'from-emerald-500 to-emerald-600',
      icon: <ChatIcon />,
    },
    {
      id: 'calls',
      label: t('vetDashboard.callLeads', 'Call Leads'),
      value: summary.callClicks,
      helper: t('vetDashboard.last30DaysLeadsHelper', '{{count}} direct leads in last 30 days', { count: summary.last30DaysLeads }),
      classes: darkMode ? 'from-amber-600 to-orange-700' : 'from-amber-500 to-orange-600',
      icon: <PhoneIcon />,
    },
    {
      id: 'reviews',
      label: t('vetDashboard.totalReviews', 'Total Reviews'),
      value: summary.totalReviews,
      helper: `${Number(summary.averageRating || 0).toFixed(1)} ${t('vetDashboard.averageRating', 'Average Rating')}`,
      classes: darkMode ? 'from-purple-600 to-fuchsia-700' : 'from-purple-500 to-fuchsia-600',
      icon: <div className="flex">{renderRatingStars(summary.averageRating)}</div>,
    },
    {
      id: 'completion',
      label: t('vetDashboard.profileCompletion', 'Profile Completion'),
      value: `${profileCompletion}%`,
      helper: t('vetDashboard.keepProfileUpdated', 'Keep your veterinarian profile updated'),
      classes: darkMode ? 'from-sky-600 to-cyan-700' : 'from-sky-500 to-cyan-600',
      icon: <ProfileIcon />,
    },
  ];

  const activeTabLabel = sidebarItems.find((item) => item.id === activeTab)?.label || t('vetDashboard.dashboard', 'Dashboard');

  if (isLoading) {
    return <FullPageLoader message={t('vetDashboard.loadingDashboard', 'Loading dashboard...')} />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-950' : 'bg-slate-100'}`}>
      <Toaster position="top-right" />

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 h-full w-64 transform shadow-xl transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}`}
      >
        <div className="p-5">
          <div className="mb-8 flex items-center justify-between">
            <h1 className={`text-xl font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
              {t('vetDashboard.vetPortal', 'Vet Portal')}
            </h1>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className={`lg:hidden ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <CloseIcon />
            </button>
          </div>

          <div className={`mb-8 rounded-2xl p-4 ${darkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-emerald-100">
                {veterinarian?.profile_photo ? (
                  <img src={veterinarian.profile_photo} alt={veterinarian.full_name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-emerald-700">
                    {veterinarian?.full_name?.charAt(0) || 'V'}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <h3 className={`truncate font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                  {t('vetDashboard.doctorPrefix', 'Dr.')} {veterinarian?.full_name || t('vetDashboard.veterinarian', 'Veterinarian')}
                </h3>
                <p className={`truncate text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {formatSpecialization(t, veterinarian?.specialization)}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                {t('vetDashboard.verified', 'Verified')}
              </span>
              <span className={`text-xs font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {profileCompletion}%
              </span>
            </div>
            <div className={`mt-2 h-2 overflow-hidden rounded-full ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${profileCompletion}%` }} />
            </div>
          </div>

          <nav className="space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === item.id
                    ? 'bg-emerald-600 text-white'
                    : darkMode
                      ? 'text-slate-300 hover:bg-slate-800'
                      : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => setDarkMode((current) => !current)}
            className={`mt-4 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
              darkMode ? 'text-yellow-400 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            {darkMode ? <SunIcon /> : <MoonIcon />}
            <span>{darkMode ? t('vetDashboard.lightMode', 'Light Mode') : t('vetDashboard.darkMode', 'Dark Mode')}</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className={`mt-4 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
              darkMode ? 'text-red-400 hover:bg-slate-800' : 'text-red-600 hover:bg-red-50'
            }`}
          >
            <LogoutIcon />
            <span>{t('vetDashboard.logout', 'Logout')}</span>
          </button>
        </div>
      </aside>

      <div className="lg:ml-64">
        <header className={`sticky top-0 z-30 border-b px-4 py-4 shadow-sm sm:px-6 ${
          darkMode ? 'border-slate-800 bg-slate-900/95 text-slate-100' : 'border-slate-200 bg-white/95 text-slate-900'
        }`}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className={`lg:hidden ${darkMode ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <MenuIcon />
              </button>
              <h2 className="text-lg font-semibold sm:text-xl">{activeTabLabel}</h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDarkMode((current) => !current)}
                className={`rounded-lg p-2 ${darkMode ? 'text-yellow-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {darkMode ? <SunIcon /> : <MoonIcon />}
              </button>
              <LanguageSwitcher />
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {statCards.map((card) => (
                  <div key={card.id} className={`rounded-2xl bg-gradient-to-br ${card.classes} p-5 text-white shadow-lg`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm text-white/80">{card.label}</p>
                        <p className="mt-2 text-3xl font-bold">{card.value}</p>
                        <p className="mt-2 text-xs text-white/75">{card.helper}</p>
                      </div>
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20">
                        {card.icon}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.7fr]">
                <div className={`rounded-2xl p-5 shadow-lg ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}`}>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">{t('vetDashboard.leadActivity', 'Lead Activity')}</h3>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {t('vetDashboard.last7Days', 'Last 7 days of profile visits and direct contact clicks')}
                    </p>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={activityTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#E2E8F0'} />
                      <XAxis dataKey="day" stroke={darkMode ? '#CBD5E1' : '#64748B'} />
                      <YAxis stroke={darkMode ? '#CBD5E1' : '#64748B'} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 12px 30px rgba(15, 23, 42, 0.16)',
                          color: darkMode ? '#F8FAFC' : '#0F172A',
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="profileViews" stroke="#3B82F6" strokeWidth={3} name={t('vetDashboard.profileViews', 'Profile Views')} />
                      <Line type="monotone" dataKey="whatsappClicks" stroke="#10B981" strokeWidth={3} name={t('vetDashboard.whatsappLeads', 'WhatsApp Leads')} />
                      <Line type="monotone" dataKey="callClicks" stroke="#F59E0B" strokeWidth={3} name={t('vetDashboard.callLeads', 'Call Leads')} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className={`rounded-2xl p-5 shadow-lg ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}`}>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">{t('vetDashboard.leadSourceBreakdown', 'Lead Source Breakdown')}</h3>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {t('vetDashboard.allTimeLeadMix', 'All-time mix of profile views and direct contact clicks')}
                    </p>
                  </div>
                  {leadSourceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie data={leadSourceData} dataKey="value" nameKey="name" outerRadius={95} innerRadius={55}>
                          {leadSourceData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className={`flex h-[280px] items-center justify-center text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {t('vetDashboard.noLeadData', 'No lead activity yet')}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className={`rounded-2xl p-5 shadow-lg ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}`}>
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">{t('vetDashboard.recentLeads', 'Recent Leads')}</h3>
                      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {t('vetDashboard.recentLeadsDesc', 'Latest direct contact clicks from farmers and visitors')}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${darkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>
                      {summary.totalLeads} {t('vetDashboard.totalLeads', 'Total Leads')}
                    </span>
                  </div>

                  {dashboardData.recentLeads.length > 0 ? (
                    <div className="space-y-3">
                      {dashboardData.recentLeads.map((lead) => (
                        <div
                          key={lead.id}
                          className={`rounded-2xl border p-4 ${darkMode ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50'}`}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-semibold">{lead.viewerName || t('vetDashboard.visitor', 'Visitor')}</p>
                              <p className={`mt-1 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {lead.viewerPhone || t('vetDashboard.anonymousLead', 'Visitor without saved phone')}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                lead.leadType === 'whatsapp_click'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}>
                                {leadTypeLabel(t, lead.leadType)}
                              </span>
                              {lead.sourcePage && (
                                <span className={`rounded-full px-3 py-1 text-xs font-medium ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600'}`}>
                                  {lead.sourcePage}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className={`mt-3 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                            {formatDateTime(lead.createdAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`rounded-2xl border border-dashed p-8 text-center text-sm ${darkMode ? 'border-slate-700 text-slate-400' : 'border-slate-300 text-slate-500'}`}>
                      {t('vetDashboard.noRecentLeads', 'No call or WhatsApp leads yet')}
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className={`rounded-2xl p-5 shadow-lg ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}`}>
                    <h3 className="text-lg font-semibold">{t('vetDashboard.profileStatus', 'Profile Status')}</h3>
                    <div className="mt-5 space-y-4">
                      <div>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className={darkMode ? 'text-slate-300' : 'text-slate-600'}>
                            {t('vetDashboard.profileCompletion', 'Profile Completion')}
                          </span>
                          <span className="font-semibold">{profileCompletion}%</span>
                        </div>
                        <div className={`h-2 overflow-hidden rounded-full ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${profileCompletion}%` }} />
                        </div>
                      </div>

                      <div className={`grid gap-3 rounded-2xl p-4 ${darkMode ? 'bg-slate-950/70' : 'bg-slate-50'}`}>
                        <div className="flex items-center justify-between text-sm">
                          <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>{t('vetDashboard.city', 'City')}</span>
                          <span className="font-medium">{veterinarian?.city || t('vetDashboard.notAvailable', 'N/A')}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>{t('vetDashboard.state', 'State')}</span>
                          <span className="font-medium">{veterinarian?.state || t('vetDashboard.notAvailable', 'N/A')}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>{t('vetDashboard.pincode', 'Pincode')}</span>
                          <span className="font-medium">{veterinarian?.pincode || t('vetDashboard.notAvailable', 'N/A')}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>{t('vetDashboard.services', 'Services')}</span>
                          <span className="font-medium">
                            {Array.isArray(veterinarian?.services) ? veterinarian.services.length : 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`rounded-2xl p-5 shadow-lg ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}`}>
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold">{t('vetDashboard.latestReview', 'Latest Review')}</h3>
                        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {summary.totalReviews} {t('vetDashboard.reviews', 'Reviews')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">{renderRatingStars(summary.averageRating)}</div>
                    </div>

                    {dashboardData.latestReview ? (
                      <div className={`rounded-2xl border p-4 ${darkMode ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50'}`}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold">{dashboardData.latestReview.userName}</p>
                            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                              {formatDate(dashboardData.latestReview.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {renderRatingStars(dashboardData.latestReview.rating)}
                          </div>
                        </div>
                        {dashboardData.latestReview.reviewText && (
                          <p className={`mt-3 text-sm leading-6 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            {dashboardData.latestReview.reviewText}
                          </p>
                        )}
                        {dashboardData.latestReview.vetResponse && (
                          <div className={`mt-4 rounded-2xl p-3 ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>
                            <p className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                              {t('vetDashboard.yourResponse', 'Your response')}
                            </p>
                            <p className={`mt-2 text-sm ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                              {dashboardData.latestReview.vetResponse}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={`rounded-2xl border border-dashed p-8 text-center text-sm ${darkMode ? 'border-slate-700 text-slate-400' : 'border-slate-300 text-slate-500'}`}>
                        {t('vetDashboard.noLatestReview', 'No reviews yet')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className={`rounded-2xl p-6 shadow-lg ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}`}>
              <div className="flex flex-col gap-6 lg:flex-row">
                <div className="flex-shrink-0">
                  <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-emerald-100">
                    {veterinarian?.profile_photo ? (
                      <img src={veterinarian.profile_photo} alt={veterinarian.full_name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-4xl font-bold text-emerald-700">
                        {veterinarian?.full_name?.charAt(0) || 'V'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1 space-y-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t('vetDashboard.fullName', 'Full Name')}</label>
                      <p className="mt-1 font-medium">{t('vetDashboard.doctorPrefix', 'Dr.')} {veterinarian?.full_name || t('vetDashboard.notAvailable', 'N/A')}</p>
                    </div>
                    <div>
                      <label className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t('vetDashboard.email', 'Email')}</label>
                      <p className="mt-1 font-medium">{veterinarian?.email || t('vetDashboard.notAvailable', 'N/A')}</p>
                    </div>
                    <div>
                      <label className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t('vetDashboard.phone', 'Phone')}</label>
                      <p className="mt-1 font-medium">{veterinarian?.phone_number || t('vetDashboard.notAvailable', 'N/A')}</p>
                    </div>
                    <div>
                      <label className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t('vetDashboard.licenseNumber', 'License Number')}</label>
                      <p className="mt-1 font-medium">{veterinarian?.license_number || t('vetDashboard.notAvailable', 'N/A')}</p>
                    </div>
                    <div>
                      <label className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t('vetDashboard.specialization', 'Specialization')}</label>
                      <p className="mt-1 font-medium">{formatSpecialization(t, veterinarian?.specialization) || t('vetDashboard.notAvailable', 'N/A')}</p>
                    </div>
                    <div>
                      <label className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t('vetDashboard.experience', 'Experience')}</label>
                      <p className="mt-1 font-medium">{veterinarian?.experience_years || 0} {t('vetDashboard.years', 'years')}</p>
                    </div>
                    <div>
                      <label className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t('vetDashboard.qualification', 'Qualification')}</label>
                      <p className="mt-1 font-medium">{veterinarian?.qualification || t('vetDashboard.notAvailable', 'N/A')}</p>
                    </div>
                    <div>
                      <label className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t('vetDashboard.consultationFee', 'Consultation Fee')}</label>
                      <p className="mt-1 font-medium">{veterinarian?.consultation_fee ? `₹${veterinarian.consultation_fee}` : t('vetDashboard.notAvailable', 'N/A')}</p>
                    </div>
                    <div>
                      <label className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t('vetDashboard.clinicName', 'Clinic Name')}</label>
                      <p className="mt-1 font-medium">{veterinarian?.clinic_name || t('vetDashboard.notAvailable', 'N/A')}</p>
                    </div>
                    <div>
                      <label className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t('vetDashboard.clinicAddress', 'Clinic Address')}</label>
                      <p className="mt-1 font-medium">{veterinarian?.clinic_address || t('vetDashboard.notAvailable', 'N/A')}</p>
                    </div>
                  </div>

                  <div>
                    <label className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t('vetDashboard.services', 'Services')}</label>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {Array.isArray(veterinarian?.services) && veterinarian.services.length > 0 ? (
                        veterinarian.services.map((service, index) => (
                          <span
                            key={`${service}-${index}`}
                            className={`rounded-full px-3 py-1 text-sm font-medium ${darkMode ? 'bg-slate-800 text-slate-200' : 'bg-emerald-50 text-emerald-700'}`}
                          >
                            {formatService(t, service)}
                          </span>
                        ))
                      ) : (
                        <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>
                          {t('vetDashboard.notAvailable', 'N/A')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div className={`rounded-2xl p-6 shadow-lg ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{t('vetDashboard.reviewSummary', 'Review Summary')}</h3>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {t('vetDashboard.totalReviewsHelper', '{{count}} reviews received', { count: summary.totalReviews })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">{renderRatingStars(summary.averageRating)}</div>
                    <span className="text-2xl font-bold">{Number(summary.averageRating || 0).toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <div className={`rounded-2xl p-6 shadow-lg ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}`}>
                <h3 className="text-lg font-semibold">{t('vetDashboard.latestReview', 'Latest Review')}</h3>
                {dashboardData.latestReview ? (
                  <div className={`mt-4 rounded-2xl border p-5 ${darkMode ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50'}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{dashboardData.latestReview.userName}</p>
                        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {formatDate(dashboardData.latestReview.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {renderRatingStars(dashboardData.latestReview.rating)}
                      </div>
                    </div>
                    {dashboardData.latestReview.reviewText && (
                      <p className={`mt-4 text-sm leading-7 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        {dashboardData.latestReview.reviewText}
                      </p>
                    )}
                    {dashboardData.latestReview.vetResponse && (
                      <div className={`mt-4 rounded-2xl p-4 ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>
                        <p className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {t('vetDashboard.yourResponse', 'Your response')}
                        </p>
                        <p className={`mt-2 text-sm ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                          {dashboardData.latestReview.vetResponse}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`mt-4 rounded-2xl border border-dashed p-8 text-center text-sm ${darkMode ? 'border-slate-700 text-slate-400' : 'border-slate-300 text-slate-500'}`}>
                    {t('vetDashboard.noLatestReview', 'No reviews yet')}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className={`rounded-2xl p-6 shadow-lg ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}`}>
              <h3 className="text-lg font-semibold">{t('vetDashboard.settings', 'Settings')}</h3>
              <div className="mt-6 space-y-4">
                <div className={`flex items-center justify-between rounded-2xl p-4 ${darkMode ? 'bg-slate-950/70' : 'bg-slate-50'}`}>
                  <div>
                    <p className="font-medium">{t('vetDashboard.darkMode', 'Dark Mode')}</p>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {t('vetDashboard.darkModeDesc', 'Switch the dashboard theme for comfortable viewing')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDarkMode((current) => !current)}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold ${darkMode ? 'bg-slate-800 text-slate-100' : 'bg-slate-900 text-white'}`}
                  >
                    {darkMode ? t('vetDashboard.lightMode', 'Light Mode') : t('vetDashboard.darkMode', 'Dark Mode')}
                  </button>
                </div>

                <div className={`flex items-center justify-between rounded-2xl p-4 ${darkMode ? 'bg-slate-950/70' : 'bg-slate-50'}`}>
                  <div>
                    <p className="font-medium">{t('vetDashboard.accountEmail', 'Account Email')}</p>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {veterinarian?.email || t('vetDashboard.notAvailable', 'N/A')}
                    </p>
                  </div>
                  <LanguageSwitcher />
                </div>

                <div className={`rounded-2xl p-4 ${darkMode ? 'bg-slate-950/70' : 'bg-slate-50'}`}>
                  <p className="font-medium">{t('vetDashboard.simpleDashboardNote', 'This dashboard tracks real profile views, call clicks, WhatsApp clicks, and reviews only.')}</p>
                  <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {t('vetDashboard.simpleDashboardNoteDesc', 'No appointment, patient, or platform earnings numbers are shown unless those features are added later.')}
                  </p>
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
