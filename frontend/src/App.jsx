// App.js - Corrected to work with your LoginForm that has built-in OTP
import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { safeJsonParse } from './utils/stringUtils';
import { API_BASE_URL } from './config/api';
import './App.css';
import HomePage from './components/HomePage';
import Layout from './components/Layout';
import LocationSetup from './components/LocationSetup'; // Add location component
import LoginForm from './components/LoginForm'; // Your LoginForm with OTP built-in
import ProfileCompletion from './components/ProfileCompletion'; // Profile completion for first-time users
import MapView from './components/MapView';
import PregnancyCalendar from './components/PregnancyCalendar';
import MilkReportsPage from './components/MilkReportsPage';
import ProfilePage from './components/ProfilePage';
import AnimalListingPage from './components/AnimalListingPage';
import AnimalDetailPage from './components/AnimalDetailPage';
import VeterinarianPage from './components/VeterinarianPage';
import VeterinarianRegistrationForm from './components/VeterinarianRegistrationForm';
import VeterinarianLogin from './components/VeterinarianLogin';
import VeterinarianDashboard from './components/VeterinarianDashboard';
import NearbyVeterinarians from './components/NearbyVeterinarians';
import AppointmentBookingForm from './components/AppointmentBookingForm';
import WishlistPage from './components/WishlistPage';
import AIHealthCheck from './components/AIHealthCheck';
import CallHistory from './components/CallHistory';
import HelpCenter from './components/HelpCenter';
import TermsPage from './components/TermsPage';
import PrivacyPage from './components/PrivacyPage';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import BuyAnimalsPage from './components/BuyAnimalsPage';
import BlogList from './components/BlogList';
import BlogDetail from './components/BlogDetail';
import { WishlistProvider } from './contexts/WishlistContext.jsx';

function App() {
  // Initialize state from localStorage
  const [currentPage, setCurrentPage] = useState(() => {
    // Check if user has token (logged in before)
    const token = localStorage.getItem('token');
    const savedPage = localStorage.getItem('currentPage');
    const savedUser = localStorage.getItem('userData');

    // If user has token, go to saved page or home
    if (token) {
      if (savedUser) {
        const parsedUser = safeJsonParse(savedUser, null);
        if (parsedUser) {
          const hasProfile = !!(parsedUser?.full_name && parsedUser?.postal_code);
          const hasLocation = parsedUser?.latitude != null && parsedUser?.longitude != null;
          if (!hasProfile) return 'profile-completion';
          if (!hasLocation) return 'location';
          return 'home';
        }
      }
      return savedPage || 'home';
    }

    // If no token, always show login page
    return 'login';
  });

  const [userData, setUserData] = useState(() => {
    return safeJsonParse(localStorage.getItem('userData'), null);
  });

  // Derive hasLocation from userData instead of separate state
  const hasLocation = userData?.latitude != null && userData?.longitude != null;

  // Handle successful login (after OTP verification in LoginForm)
  const handleLoginSuccess = (response) => {
    // Store user data if needed
    if (response && response.user) {
      setUserData(response.user);
      localStorage.setItem('userData', JSON.stringify(response.user));
    }

    const hasProfile = !!(response?.user?.full_name && response?.user?.postal_code);
    const hasLocationFromUser = response?.user?.latitude != null && response?.user?.longitude != null;

    // Check if user needs to complete profile (first-time login)
    if (response.requiresProfileCompletion && !hasProfile) {
      setCurrentPage('profile-completion');
      localStorage.setItem('currentPage', 'profile-completion');
      window.location.href = '/profile-completion';
    }
    // Check if user needs to set location
    else if (response.requiresLocation && !hasLocationFromUser) {
      setCurrentPage('location');
      localStorage.setItem('currentPage', 'location');
      window.location.href = '/location-setup';
    }
    // User is fully set up, go to home
    else {
      setCurrentPage('home');
      localStorage.setItem('currentPage', 'home');
      window.location.href = '/';
    }
  };

  // Handle profile completion (first-time users)
  const handleProfileComplete = (response) => {
    // Update user data
    const currentUser = safeJsonParse(localStorage.getItem('userData'), {});
    const completedUser = response?.user || response?.location || {};
    const updatedUser = {
      ...currentUser,
      ...completedUser
    };
    setUserData(updatedUser);
    localStorage.setItem('userData', JSON.stringify(updatedUser));

    // Profile completed, location should be set too, go to home
    setCurrentPage('home');
    localStorage.setItem('currentPage', 'home');
    window.location.href = '/';
  };

  // Handle location setup completion
  const handleLocationSet = async () => {
    try {
      // Fetch updated user data from backend after location is set
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            // Update userData with fresh data from backend
            setUserData(data.user);
            localStorage.setItem('userData', JSON.stringify(data.user));
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch updated user data:', error);
      // Continue anyway - use existing data
    }

    // Navigate to home
    setCurrentPage('home');
    localStorage.setItem('currentPage', 'home');
    window.location.href = '/';
  };

  return (
    <WishlistProvider>
      <Routes>
        {/* Admin Routes - No Layout */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        {/* Veterinarian Routes - No Layout (Separate Auth Flow) */}
        <Route path="/veterinarian/login" element={<VeterinarianLogin />} />
        <Route path="/veterinarian/register" element={<VeterinarianRegistrationForm />} />
        <Route path="/veterinarian/dashboard" element={<VeterinarianDashboard />} />

        {/* Veterinarian Public Routes */}
        <Route path="/veterinarians" element={<NearbyVeterinarians />} />
        <Route path="/book-appointment/:vetId" element={<AppointmentBookingForm />} />

        {/* Routes without header/footer */}
        <Route element={<Layout showHeaderFooter={false} />}>
          <Route
            path="/login"
            element={<LoginForm onLoginSuccess={handleLoginSuccess} />}
          />
          <Route
            path="/profile-completion"
            element={<ProfileCompletion onComplete={handleProfileComplete} />}
          />
          <Route
            path="/location-setup"
            element={<LocationSetup onLocationSet={handleLocationSet} skipAllowed={true} />}
          />
        </Route>

        {/* Routes with header/footer */}
        <Route element={<Layout showHeaderFooter={true} />}>
          <Route
            path="/"
            element={
              currentPage === 'login' ? (
                <Navigate to="/login" replace />
              ) : currentPage === 'profile-completion' ? (
                <Navigate to="/profile-completion" replace />
              ) : currentPage === 'location' ? (
                <Navigate to="/location-setup" replace />
              ) : (
                <HomePage hasLocation={hasLocation} />
              )
            }
          />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/buy-animals" element={<BuyAnimalsPage />} />
          <Route path="/sell-animal" element={<AnimalListingPage />} />
          <Route path="/animal/:animalType/:id" element={<AnimalDetailPage />} />
          <Route path="/veterinarian" element={<VeterinarianPage />} />
          <Route path="/pregnancy-calendar" element={<PregnancyCalendar />} />
          <Route path="/milk-reports" element={<MilkReportsPage />} />
          <Route path="/ai-health-check" element={<AIHealthCheck />} />
          <Route path="/call-history" element={<CallHistory />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/blogs" element={<BlogList />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </WishlistProvider>
  );
}

export default App;
