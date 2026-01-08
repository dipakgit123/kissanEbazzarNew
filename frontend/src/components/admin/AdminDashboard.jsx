import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [topSellers, setTopSellers] = useState([]);
  const [locationStats, setLocationStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [admin, setAdmin] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const adminData = localStorage.getItem('adminData');
    const adminToken = localStorage.getItem('adminToken');

    if (!adminToken) {
      navigate('/admin/login');
      return;
    }

    if (adminData) {
      setAdmin(JSON.parse(adminData));
    }

    fetchDashboardData();

    // Update time every minute
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, [navigate]);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('adminToken');

    try {
      const [statsRes, activityRes, sellersRes, locationRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/admin/dashboard/activity?limit=10`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/admin/dashboard/top-sellers?limit=5`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/admin/dashboard/location-stats`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const [statsData, activityData, sellersData, locationData] = await Promise.all([
        statsRes.json(),
        activityRes.json(),
        sellersRes.json(),
        locationRes.json()
      ]);

      if (statsData.success) setStats(statsData.data);
      if (activityData.success) setRecentActivity(activityData.data);
      if (sellersData.success) setTopSellers(sellersData.data);
      if (locationData.success) setLocationStats(locationData.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    navigate('/admin/login');
  };

  const getAnimalEmoji = (type) => {
    const emojis = { cow: '🐄', buffalo: '🐃', goat: '🐐', horse: '🐴', dog: '🐕', cat: '🐈' };
    return emojis[type] || '🐾';
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'users', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { id: 'listings', label: 'Listings', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { id: 'veterinarians', label: 'Veterinarians', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { id: 'reports', label: 'Reports', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin"></div>
            <div className="absolute inset-3 rounded-full border-4 border-transparent border-t-emerald-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
          </div>
          <p className="text-gray-400 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-[#1e293b] border-r border-slate-700/50 flex flex-col transition-all duration-300 fixed h-full z-50`}>
        {/* Logo */}
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="text-lg font-bold text-white">KissanEbazzar</h1>
                <p className="text-xs text-slate-400">Admin Panel</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-400 shadow-lg shadow-emerald-500/5'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <svg className={`w-5 h-5 flex-shrink-0 ${activeTab === item.id ? 'text-emerald-400' : 'text-slate-500 group-hover:text-emerald-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
              {activeTab === item.id && !sidebarCollapsed && (
                <div className="ml-auto w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar Toggle */}
        <div className="p-4 border-t border-slate-700/50">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
          >
            <svg className={`w-5 h-5 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 ${sidebarCollapsed ? 'ml-20' : 'ml-64'} transition-all duration-300`}>
        {/* Header */}
        <header className="bg-[#1e293b]/80 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-40">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white capitalize">{activeTab === 'overview' ? 'Dashboard' : activeTab}</h2>
                <p className="text-sm text-slate-400 mt-1">
                  {currentTime.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>

              <div className="flex items-center space-x-4">
                {/* Refresh Button */}
                <button
                  onClick={fetchDashboardData}
                  className="p-2 rounded-xl bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>

                {/* Notifications */}
                <button className="relative p-2 rounded-xl bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full"></span>
                </button>

                {/* Admin Profile */}
                <div className="flex items-center space-x-3 pl-4 border-l border-slate-700/50">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold">
                    {(admin?.full_name || admin?.username)?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-white">{admin?.full_name || admin?.username}</p>
                    <p className="text-xs text-slate-400 capitalize">{admin?.role?.replace('_', ' ')}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Logout"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {activeTab === 'overview' && (
            <OverviewTab
              stats={stats}
              recentActivity={recentActivity}
              topSellers={topSellers}
              locationStats={locationStats}
              getAnimalEmoji={getAnimalEmoji}
              formatNumber={formatNumber}
              formatDate={formatDate}
            />
          )}
          {activeTab === 'analytics' && <AnalyticsTab stats={stats} getAnimalEmoji={getAnimalEmoji} />}
          {activeTab === 'users' && <UsersTab API_URL={API_URL} />}
          {activeTab === 'listings' && <ListingsTab API_URL={API_URL} getAnimalEmoji={getAnimalEmoji} formatPrice={formatPrice} />}
          {activeTab === 'veterinarians' && <VeterinariansTab API_URL={API_URL} formatDate={formatDate} />}
          {activeTab === 'reports' && <ReportsTab stats={stats} />}
        </main>
      </div>
    </div>
  );
};

// Overview Tab with Charts
const OverviewTab = ({ stats, recentActivity, topSellers, locationStats, getAnimalEmoji, formatNumber, formatDate }) => {
  // Chart data for listings by category
  const categoryData = {
    labels: stats?.listings?.byCategory ? Object.keys(stats.listings.byCategory).map(k => k.charAt(0).toUpperCase() + k.slice(1)) : [],
    datasets: [{
      data: stats?.listings?.byCategory ? Object.values(stats.listings.byCategory).map(v => v.total) : [],
      backgroundColor: [
        'rgba(16, 185, 129, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(20, 184, 166, 0.8)',
      ],
      borderWidth: 0,
    }]
  };

  // Line chart for user growth simulation
  const userGrowthData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [{
      label: 'Users',
      data: [12, 19, 25, 32, 45, 55, stats?.users?.total || 60],
      fill: true,
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      borderColor: 'rgba(16, 185, 129, 1)',
      tension: 0.4,
      pointBackgroundColor: 'rgba(16, 185, 129, 1)',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
    }]
  };

  // Bar chart for listings comparison
  const listingsComparisonData = {
    labels: stats?.listings?.byCategory ? Object.keys(stats.listings.byCategory).map(k => k.charAt(0).toUpperCase() + k.slice(1)) : [],
    datasets: [
      {
        label: 'Active',
        data: stats?.listings?.byCategory ? Object.values(stats.listings.byCategory).map(v => v.active) : [],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderRadius: 8,
      },
      {
        label: 'Sold',
        data: stats?.listings?.byCategory ? Object.values(stats.listings.byCategory).map(v => v.sold) : [],
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
        borderRadius: 8,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: { display: false, color: 'rgba(255,255,255,0.1)' },
        ticks: { color: 'rgba(255,255,255,0.5)' },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: 'rgba(255,255,255,0.5)' },
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: 'rgba(255,255,255,0.7)',
          padding: 20,
          usePointStyle: true,
        }
      }
    },
    cutout: '70%',
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 shadow-xl shadow-blue-500/20">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-blue-200 bg-white/20 px-2 py-1 rounded-full">
                +{stats?.users?.newThisMonth || 0} this month
              </span>
            </div>
            <p className="text-4xl font-bold text-white mb-1">{formatNumber(stats?.users?.total || 0)}</p>
            <p className="text-blue-200">Total Users</p>
          </div>
        </div>

        {/* Total Listings */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-6 shadow-xl shadow-emerald-500/20">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <span className="text-xs font-medium text-emerald-200 bg-white/20 px-2 py-1 rounded-full">
                {stats?.listings?.active || 0} active
              </span>
            </div>
            <p className="text-4xl font-bold text-white mb-1">{formatNumber(stats?.listings?.total || 0)}</p>
            <p className="text-emerald-200">Total Listings</p>
          </div>
        </div>

        {/* Animals Sold */}
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 shadow-xl shadow-amber-500/20">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-amber-200 bg-white/20 px-2 py-1 rounded-full">
                {stats?.listings?.total ? ((stats.listings.sold / stats.listings.total) * 100).toFixed(0) : 0}% rate
              </span>
            </div>
            <p className="text-4xl font-bold text-white mb-1">{formatNumber(stats?.listings?.sold || 0)}</p>
            <p className="text-amber-200">Animals Sold</p>
          </div>
        </div>

        {/* Total Views */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 to-violet-700 rounded-2xl p-6 shadow-xl shadow-purple-500/20">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-purple-200 bg-white/20 px-2 py-1 rounded-full">
                {stats?.listings?.total ? Math.round((stats?.listings?.totalViews || 0) / stats.listings.total) : 0} avg/listing
              </span>
            </div>
            <p className="text-4xl font-bold text-white mb-1">{formatNumber(stats?.listings?.totalViews || 0)}</p>
            <p className="text-purple-200">Total Views</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Growth Chart */}
        <div className="lg:col-span-2 bg-[#1e293b] rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">User Growth</h3>
              <p className="text-sm text-slate-400">Monthly new registrations</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
              <span className="text-sm text-slate-400">Users</span>
            </div>
          </div>
          <div className="h-72">
            <Line data={userGrowthData} options={chartOptions} />
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-700/50">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white">Listings by Category</h3>
            <p className="text-sm text-slate-400">Distribution across animal types</p>
          </div>
          <div className="h-72">
            <Doughnut data={categoryData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Listings Comparison */}
        <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Active vs Sold</h3>
              <p className="text-sm text-slate-400">Listings comparison by category</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
                <span className="text-sm text-slate-400">Active</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                <span className="text-sm text-slate-400">Sold</span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <Bar data={listingsComparisonData} options={chartOptions} />
          </div>
        </div>

        {/* Category Cards */}
        <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-700/50">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white">Category Overview</h3>
            <p className="text-sm text-slate-400">Quick stats by animal type</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {stats?.listings?.byCategory && Object.entries(stats.listings.byCategory).map(([type, data]) => (
              <div key={type} className="bg-slate-800/50 rounded-xl p-4 text-center hover:bg-slate-800 transition-colors cursor-pointer group">
                <span className="text-3xl mb-2 block group-hover:scale-110 transition-transform">{getAnimalEmoji(type)}</span>
                <p className="text-xl font-bold text-white">{data.total}</p>
                <p className="text-xs text-slate-400 capitalize mb-2">{type}s</p>
                <div className="flex justify-center gap-2 text-xs">
                  <span className="text-emerald-400">{data.active}</span>
                  <span className="text-slate-600">/</span>
                  <span className="text-amber-400">{data.sold}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-[#1e293b] rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Recent Activity</h3>
              <p className="text-sm text-slate-400">Latest platform activities</p>
            </div>
            <button className="text-emerald-400 text-sm hover:text-emerald-300">View All</button>
          </div>
          <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  activity.type === 'new_user'
                    ? 'bg-blue-500/20 text-blue-400'
                    : activity.type === 'sale'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {activity.type === 'new_user' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  ) : activity.type === 'sale' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <span className="text-lg">{getAnimalEmoji(activity.animalType)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">
                    {activity.type === 'new_user' && `New user registered: ${activity.data.full_name || activity.data.phone_number}`}
                    {activity.type === 'new_listing' && `New ${activity.animalType} listed: ${activity.data.breed_name || activity.data.breedName}`}
                    {activity.type === 'sale' && `${activity.animalType} marked as sold: ${activity.data.breed_name || activity.data.breedName}`}
                  </p>
                  <p className="text-xs text-slate-400">{formatDate(activity.timestamp)}</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs ${
                  activity.type === 'new_user' ? 'bg-blue-500/10 text-blue-400' :
                  activity.type === 'sale' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-emerald-500/10 text-emerald-400'
                }`}>
                  {activity.type === 'new_user' ? 'User' : activity.type === 'sale' ? 'Sale' : 'Listing'}
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-slate-400">No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Sellers */}
        <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Top Sellers</h3>
              <p className="text-sm text-slate-400">Most active farmers</p>
            </div>
          </div>
          <div className="space-y-4">
            {topSellers.map((seller, index) => (
              <div key={seller.id} className="flex items-center space-x-4 p-3 bg-slate-800/50 rounded-xl">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                  index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white' :
                  index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800' :
                  index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                  'bg-slate-700 text-slate-300'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">
                    {seller.user?.full_name || seller.user?.phone_number || 'Unknown'}
                  </p>
                  <p className="text-xs text-slate-400">{seller.user?.city || 'Location unknown'}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-400">{seller.count}</p>
                  <p className="text-xs text-slate-400">listings</p>
                </div>
              </div>
            ))}
            {topSellers.length === 0 && (
              <div className="text-center py-8">
                <p className="text-slate-400">No sellers data yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Location Stats */}
      {locationStats && (
        <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-700/50">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white">Geographic Distribution</h3>
            <p className="text-sm text-slate-400">Users by location</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {/* By State */}
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-4 flex items-center">
                <svg className="w-4 h-4 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Top States
              </h4>
              <div className="space-y-3">
                {locationStats.byState?.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center">
                    <span className="text-sm text-white w-32 truncate">{item.state || 'Unknown'}</span>
                    <div className="flex-1 mx-4">
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                          style={{ width: `${(item.count / (locationStats.byState?.[0]?.count || 1)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-slate-300 w-12 text-right">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* By City */}
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-4 flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Top Cities
              </h4>
              <div className="space-y-3">
                {locationStats.byCity?.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center">
                    <span className="text-sm text-white w-32 truncate">{item.city || 'Unknown'}</span>
                    <div className="flex-1 mx-4">
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                          style={{ width: `${(item.count / (locationStats.byCity?.[0]?.count || 1)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-slate-300 w-12 text-right">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Analytics Tab with More Charts
const AnalyticsTab = ({ stats, getAnimalEmoji }) => {
  // Views by category chart
  const viewsData = {
    labels: stats?.listings?.byCategory ? Object.keys(stats.listings.byCategory).map(k => k.charAt(0).toUpperCase() + k.slice(1)) : [],
    datasets: [{
      label: 'Views',
      data: stats?.listings?.byCategory ? Object.values(stats.listings.byCategory).map(v => v.views) : [],
      backgroundColor: 'rgba(139, 92, 246, 0.8)',
      borderRadius: 8,
    }]
  };

  // Conversion funnel data
  const conversionData = {
    labels: ['Total Listings', 'Active', 'Sold'],
    datasets: [{
      data: [
        stats?.listings?.total || 0,
        stats?.listings?.active || 0,
        stats?.listings?.sold || 0
      ],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
      ],
      borderWidth: 0,
    }]
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'rgba(255,255,255,0.7)',
          padding: 20,
          usePointStyle: true,
        }
      }
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: 'rgba(255,255,255,0.5)' },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: 'rgba(255,255,255,0.5)' },
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Verification Rate</p>
              <p className="text-3xl font-bold text-emerald-400">
                {stats?.users?.total ? ((stats.users.verified / stats.users.total) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${stats?.users?.total ? ((stats.users.verified / stats.users.total) * 100) : 0}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Conversion Rate</p>
              <p className="text-3xl font-bold text-amber-400">
                {stats?.listings?.total ? ((stats.listings.sold / stats.listings.total) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <div className="mt-4 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full"
              style={{ width: `${stats?.listings?.total ? ((stats.listings.sold / stats.listings.total) * 100) : 0}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Avg Views/Listing</p>
              <p className="text-3xl font-bold text-blue-400">
                {stats?.listings?.total ? Math.round(stats.listings.totalViews / stats.listings.total) : 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Active Pregnancies</p>
              <p className="text-3xl font-bold text-pink-400">{stats?.pregnancy?.active || 0}</p>
            </div>
            <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Views by Category */}
        <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-700/50">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white">Views by Category</h3>
            <p className="text-sm text-slate-400">Total views per animal type</p>
          </div>
          <div className="h-72">
            <Bar data={viewsData} options={barOptions} />
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-700/50">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white">Listing Funnel</h3>
            <p className="text-sm text-slate-400">From listing to sale</p>
          </div>
          <div className="h-72">
            <Pie data={conversionData} options={pieOptions} />
          </div>
        </div>
      </div>

      {/* Category Performance Table */}
      <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-700/50">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-white">Category Performance</h3>
          <p className="text-sm text-slate-400">Detailed breakdown by animal type</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-300">Category</th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-slate-300">Total</th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-slate-300">Active</th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-slate-300">Sold</th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-slate-300">Views</th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-slate-300">Conversion</th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-slate-300">Performance</th>
              </tr>
            </thead>
            <tbody>
              {stats?.listings?.byCategory && Object.entries(stats.listings.byCategory).map(([type, data]) => {
                const conversionRate = data.total ? ((data.sold / data.total) * 100) : 0;
                return (
                  <tr key={type} className="border-b border-slate-700/30 hover:bg-slate-800/50">
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getAnimalEmoji(type)}</span>
                        <span className="text-white font-medium capitalize">{type}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right text-white font-medium">{data.total}</td>
                    <td className="py-4 px-4 text-right text-emerald-400 font-medium">{data.active}</td>
                    <td className="py-4 px-4 text-right text-amber-400 font-medium">{data.sold}</td>
                    <td className="py-4 px-4 text-right text-blue-400 font-medium">{data.views}</td>
                    <td className="py-4 px-4 text-right text-purple-400 font-medium">{conversionRate.toFixed(1)}%</td>
                    <td className="py-4 px-4">
                      <div className="flex justify-end">
                        <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              conversionRate > 50 ? 'bg-emerald-500' :
                              conversionRate > 25 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(conversionRate, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Users Tab Component
const UsersTab = ({ API_URL }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const fetchUsers = async () => {
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`${API_URL}/api/admin/users?page=${page}&limit=20&search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.data.users);
        setTotalPages(data.data.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBlock = async (userId, blocked) => {
    const token = localStorage.getItem('adminToken');
    try {
      await fetch(`${API_URL}/api/admin/users/${userId}/block`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ blocked })
      });
      fetchUsers();
    } catch (error) {
      console.error('Failed to toggle block:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-[#1e293b] rounded-2xl p-4 border border-slate-700/50">
        <div className="relative">
          <svg className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search users by name, phone, or city..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-800/50">
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300">User</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300">Phone</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300">Location</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300">Status</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300">Joined</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-slate-700/30 hover:bg-slate-800/30">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold">
                        {(user.full_name || user.phone_number)?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.full_name || 'No name'}</p>
                        <p className="text-xs text-slate-400">ID: {user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-300">{user.phone_number}</td>
                  <td className="py-4 px-6 text-slate-300">{user.city || '-'}, {user.state || '-'}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.is_blocked ? 'bg-red-500/20 text-red-400' :
                      user.is_verified ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {user.is_blocked ? 'Blocked' : user.is_verified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-400 text-sm">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => toggleBlock(user.id, !user.is_blocked)}
                      className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                        user.is_blocked
                          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      }`}
                    >
                      {user.is_blocked ? 'Unblock' : 'Block'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-slate-700/50">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-slate-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors"
          >
            Previous
          </button>
          <span className="text-slate-400">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-slate-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

// Listings Tab Component
const ListingsTab = ({ API_URL, getAnimalEmoji, formatPrice }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [animalType, setAnimalType] = useState('all');
  const [status, setStatus] = useState('all');

  useEffect(() => {
    fetchListings();
  }, [page, animalType, status]);

  const fetchListings = async () => {
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`${API_URL}/api/admin/listings?page=${page}&limit=20&animalType=${animalType}&status=${status}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setListings(data.data.listings);
        setTotalPages(data.data.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteListing = async (type, id) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;

    const token = localStorage.getItem('adminToken');
    try {
      await fetch(`${API_URL}/api/admin/listings/${type}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchListings();
    } catch (error) {
      console.error('Failed to delete listing:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-[#1e293b] rounded-2xl p-4 border border-slate-700/50">
        <div className="flex flex-wrap gap-4">
          <select
            value={animalType}
            onChange={(e) => { setAnimalType(e.target.value); setPage(1); }}
            className="px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Animals</option>
            <option value="cow">Cows</option>
            <option value="buffalo">Buffalos</option>
            <option value="goat">Goats</option>
            <option value="horse">Horses</option>
            <option value="dog">Dogs</option>
            <option value="cat">Cats</option>
          </select>

          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="sold">Sold</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {listings.map((listing) => (
          <div key={`${listing.animalType}-${listing.id}`} className="bg-[#1e293b] rounded-2xl border border-slate-700/50 overflow-hidden group hover:border-emerald-500/50 transition-colors">
            <div className="aspect-video bg-slate-800 relative overflow-hidden">
              {(listing.front_photo || listing.frontPhoto) ? (
                <img
                  src={listing.front_photo || listing.frontPhoto}
                  alt={listing.breed_name || listing.breedName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-slate-700 to-slate-800">
                  {getAnimalEmoji(listing.animalType)}
                </div>
              )}
              <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium ${
                listing.status === 'active' ? 'bg-emerald-500' :
                listing.status === 'sold' ? 'bg-amber-500' :
                'bg-red-500'
              } text-white`}>
                {listing.status}
              </span>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                <p className="text-white font-medium truncate">{listing.breed_name || listing.breedName}</p>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-emerald-400 font-bold text-lg">{formatPrice(listing.expected_price || listing.expectedPrice)}</p>
                <span className="text-xl">{getAnimalEmoji(listing.animalType)}</span>
              </div>
              <p className="text-slate-400 text-sm mb-3 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {listing.city}, {listing.state}
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                <span className="text-xs text-slate-500 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {listing.views || 0} views
                </span>
                <button
                  onClick={() => deleteListing(listing.animalType, listing.id)}
                  className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {listings.length === 0 && (
        <div className="text-center py-16">
          <svg className="w-20 h-20 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-slate-400 text-lg">No listings found</p>
        </div>
      )}

      {/* Pagination */}
      {listings.length > 0 && (
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-slate-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors"
          >
            Previous
          </button>
          <span className="text-slate-400">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-slate-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

// Reports Tab Component
// Veterinarians Tab Component
const VeterinariansTab = ({ API_URL, formatDate }) => {
  const [veterinarians, setVeterinarians] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, verified, rejected, suspended
  const [selectedVet, setSelectedVet] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchVeterinarians();
    fetchStats();
  }, [filter]);

  const fetchVeterinarians = async () => {
    setLoading(true);
    const token = localStorage.getItem('adminToken');
    try {
      const statusParam = filter !== 'all' ? `?status=${filter}` : '';
      const response = await fetch(`${API_URL}/api/admin/veterinarians${statusParam}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setVeterinarians(data.data.veterinarians || []);
      }
    } catch (error) {
      console.error('Failed to fetch veterinarians:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    const token = localStorage.getItem('adminToken');
    try {
      const response = await fetch(`${API_URL}/api/admin/veterinarians/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleVerify = async (vetId) => {
    if (!confirm('Are you sure you want to verify this veterinarian? An email with login credentials will be sent.')) {
      return;
    }

    setActionLoading(true);
    const token = localStorage.getItem('adminToken');
    try {
      const response = await fetch(`${API_URL}/api/admin/veterinarians/${vetId}/verify`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes: 'Verified by admin' })
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message);
        fetchVeterinarians();
        fetchStats();
        setShowModal(false);
        setSelectedVet(null);
      } else {
        alert('Verification failed: ' + data.message);
      }
    } catch (error) {
      console.error('Verification error:', error);
      alert('Failed to verify veterinarian');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (vetId) => {
    if (!rejectReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setActionLoading(true);
    const token = localStorage.getItem('adminToken');
    try {
      const response = await fetch(`${API_URL}/api/admin/veterinarians/${vetId}/reject`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: rejectReason })
      });

      const data = await response.json();
      if (data.success) {
        alert('Veterinarian rejected successfully');
        fetchVeterinarians();
        fetchStats();
        setShowModal(false);
        setSelectedVet(null);
        setRejectReason('');
      } else {
        alert('Rejection failed: ' + data.message);
      }
    } catch (error) {
      console.error('Rejection error:', error);
      alert('Failed to reject veterinarian');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'pending': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'suspended': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-[#1e293b] rounded-xl p-4 border border-slate-700/50">
          <p className="text-sm text-slate-400 mb-1">Total</p>
          <p className="text-3xl font-bold text-white">{stats?.total || 0}</p>
        </div>
        <div className="bg-[#1e293b] rounded-xl p-4 border border-amber-500/20">
          <p className="text-sm text-amber-400 mb-1">Pending</p>
          <p className="text-3xl font-bold text-amber-400">{stats?.pending || 0}</p>
        </div>
        <div className="bg-[#1e293b] rounded-xl p-4 border border-emerald-500/20">
          <p className="text-sm text-emerald-400 mb-1">Verified</p>
          <p className="text-3xl font-bold text-emerald-400">{stats?.verified || 0}</p>
        </div>
        <div className="bg-[#1e293b] rounded-xl p-4 border border-red-500/20">
          <p className="text-sm text-red-400 mb-1">Rejected</p>
          <p className="text-3xl font-bold text-red-400">{stats?.rejected || 0}</p>
        </div>
        <div className="bg-[#1e293b] rounded-xl p-4 border border-gray-500/20">
          <p className="text-sm text-gray-400 mb-1">Suspended</p>
          <p className="text-3xl font-bold text-gray-400">{stats?.suspended || 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-3">
        {['all', 'pending', 'verified', 'rejected', 'suspended'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
              filter === f
                ? 'bg-emerald-500 text-white'
                : 'bg-[#1e293b] text-slate-400 hover:text-white border border-slate-700/50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Veterinarians List */}
      <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
          </div>
        ) : veterinarians.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-slate-400">No veterinarians found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50 border-b border-slate-700/50">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300">Veterinarian</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300">Contact</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300">License</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300">Specialization</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300">Location</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300">Status</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300">Registered</th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {veterinarians.map((vet) => (
                  <tr key={vet.id} className="border-b border-slate-700/30 hover:bg-slate-800/30">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                          {vet.full_name?.[0]?.toUpperCase() || 'V'}
                        </div>
                        <div>
                          <p className="text-white font-medium">{vet.full_name}</p>
                          <p className="text-xs text-slate-400">{vet.qualification}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm text-white">{vet.phone_number}</p>
                      <p className="text-xs text-slate-400">{vet.email || 'No email'}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm text-white font-mono">{vet.license_number}</p>
                      <p className="text-xs text-slate-400">{vet.experience_years} years exp</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm text-white capitalize">{vet.specialization}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm text-white">{vet.city}, {vet.state}</p>
                      <p className="text-xs text-slate-400">{vet.pincode}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border capitalize ${getStatusColor(vet.verification_status)}`}>
                        {vet.verification_status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm text-slate-400">{formatDate(vet.created_at)}</p>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedVet(vet);
                            setShowModal(true);
                          }}
                          className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                          title="View Details"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        {vet.verification_status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleVerify(vet.id)}
                              className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                              title="Verify"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedVet(vet);
                                setShowModal(true);
                              }}
                              className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                              title="Reject"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedVet && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e293b] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-700/50">
            {/* Modal Header */}
            <div className="sticky top-0 bg-[#1e293b] border-b border-slate-700/50 p-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white">Veterinarian Details</h3>
                <p className="text-slate-400 text-sm mt-1">Review and verify the application</p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedVet(null);
                  setRejectReason('');
                }}
                className="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Personal Info */}
              <div className="bg-slate-800/50 rounded-xl p-6">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Personal Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Full Name</p>
                    <p className="text-white font-medium">{selectedVet.full_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Phone Number</p>
                    <p className="text-white font-medium">{selectedVet.phone_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Email</p>
                    <p className="text-white font-medium">{selectedVet.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Experience</p>
                    <p className="text-white font-medium">{selectedVet.experience_years} years</p>
                  </div>
                </div>
              </div>

              {/* Professional Info */}
              <div className="bg-slate-800/50 rounded-xl p-6">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Professional Details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">License Number</p>
                    <p className="text-white font-medium font-mono">{selectedVet.license_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Qualification</p>
                    <p className="text-white font-medium">{selectedVet.qualification}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Specialization</p>
                    <p className="text-white font-medium capitalize">{selectedVet.specialization}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Consultation Fee</p>
                    <p className="text-white font-medium">₹{selectedVet.consultation_fee || 'Not set'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-400 mb-1">Services</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedVet.services?.map((service, i) => (
                        <span key={i} className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="bg-slate-800/50 rounded-xl p-6">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Location & Clinic
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Clinic Name</p>
                    <p className="text-white font-medium">{selectedVet.clinic_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">City, State</p>
                    <p className="text-white font-medium">{selectedVet.city}, {selectedVet.state}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-400 mb-1">Address</p>
                    <p className="text-white font-medium">{selectedVet.clinic_address || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="bg-slate-800/50 rounded-xl p-6">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Uploaded Documents
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {selectedVet.license_document && (
                    <a href={selectedVet.license_document} target="_blank" rel="noopener noreferrer" className="block p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
                      <p className="text-sm text-white font-medium mb-1">License Document</p>
                      <p className="text-xs text-blue-400">View Document →</p>
                    </a>
                  )}
                  {selectedVet.degree_certificate && (
                    <a href={selectedVet.degree_certificate} target="_blank" rel="noopener noreferrer" className="block p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
                      <p className="text-sm text-white font-medium mb-1">Degree Certificate</p>
                      <p className="text-xs text-blue-400">View Document →</p>
                    </a>
                  )}
                  {selectedVet.aadhar_document && (
                    <a href={selectedVet.aadhar_document} target="_blank" rel="noopener noreferrer" className="block p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
                      <p className="text-sm text-white font-medium mb-1">Aadhar Document</p>
                      <p className="text-xs text-blue-400">View Document →</p>
                    </a>
                  )}
                </div>
              </div>

              {/* Actions for Pending */}
              {selectedVet.verification_status === 'pending' && (
                <div className="bg-slate-800/50 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-white mb-4">Verification Actions</h4>
                  
                  {/* Reject Reason Input */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Rejection Reason (if rejecting)
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Enter reason for rejection..."
                      rows="3"
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleVerify(selectedVet.id)}
                      disabled={actionLoading}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading ? 'Processing...' : '✓ Verify & Send Credentials'}
                    </button>
                    <button
                      onClick={() => handleReject(selectedVet.id)}
                      disabled={actionLoading || !rejectReason.trim()}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading ? 'Processing...' : '✗ Reject Application'}
                    </button>
                  </div>
                </div>
              )}

              {/* Status Info */}
              {selectedVet.verification_status !== 'pending' && (
                <div className={`rounded-xl p-4 border ${
                  selectedVet.verification_status === 'verified' ? 'bg-emerald-500/10 border-emerald-500/30' :
                  selectedVet.verification_status === 'rejected' ? 'bg-red-500/10 border-red-500/30' :
                  'bg-gray-500/10 border-gray-500/30'
                }`}>
                  <p className="text-white font-medium">
                    Status: <span className="capitalize">{selectedVet.verification_status}</span>
                  </p>
                  {selectedVet.rejection_reason && (
                    <p className="text-sm text-slate-300 mt-2">
                      Reason: {selectedVet.rejection_reason}
                    </p>
                  )}
                  {selectedVet.verified_at && (
                    <p className="text-sm text-slate-400 mt-2">
                      Verified on: {formatDate(selectedVet.verified_at)}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ReportsTab = ({ stats }) => {
  return (
    <div className="space-y-6">
      {/* Quick Summary */}
      <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-bold text-white mb-6">Platform Summary Report</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-slate-800/50 rounded-xl">
            <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-white mb-2">{stats?.users?.total || 0}</p>
            <p className="text-slate-400">Total Registered Users</p>
            <p className="text-sm text-emerald-400 mt-2">{stats?.users?.verified || 0} verified</p>
          </div>

          <div className="text-center p-6 bg-slate-800/50 rounded-xl">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-white mb-2">{stats?.listings?.total || 0}</p>
            <p className="text-slate-400">Total Listings Created</p>
            <p className="text-sm text-amber-400 mt-2">{stats?.listings?.sold || 0} sold successfully</p>
          </div>

          <div className="text-center p-6 bg-slate-800/50 rounded-xl">
            <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-white mb-2">{stats?.listings?.totalViews || 0}</p>
            <p className="text-slate-400">Total Listing Views</p>
            <p className="text-sm text-blue-400 mt-2">{stats?.contacts?.total || 0} contact interactions</p>
          </div>
        </div>
      </div>

      {/* Download Reports */}
      <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-bold text-white mb-6">Generate Reports</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors text-left group">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">Users Report</p>
                <p className="text-sm text-slate-400">All registered users data</p>
              </div>
            </div>
          </button>

          <button className="p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors text-left group">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">Listings Report</p>
                <p className="text-sm text-slate-400">All animal listings data</p>
              </div>
            </div>
          </button>

          <button className="p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors text-left group">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center group-hover:bg-amber-500/30 transition-colors">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">Sales Report</p>
                <p className="text-sm text-slate-400">Sold animals data</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-bold text-white mb-4">System Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-800/50 rounded-xl">
            <p className="text-slate-400 text-sm">Platform Version</p>
            <p className="text-white font-medium">KissanEbazzar v1.0.0</p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-xl">
            <p className="text-slate-400 text-sm">Last Updated</p>
            <p className="text-white font-medium">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
