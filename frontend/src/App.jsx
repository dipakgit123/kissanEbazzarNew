// App.js - Corrected to work with your LoginForm that has built-in OTP
import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { safeJsonParse } from './utils/stringUtils';
import './App.css';
import HomePage from './components/HomePage';
import Layout from './components/Layout';
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
import VeterinarianForgotPassword from './components/VeterinarianForgotPassword';
import VeterinarianResetPassword from './components/VeterinarianResetPassword';
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
import AuthenticatedRoute from './components/AuthenticatedRoute';
import UserAppRoute from './components/UserAppRoute';
import AdminAppRoute from './components/AdminAppRoute';
import VeterinarianAppRoute from './components/VeterinarianAppRoute';
import ScrollToTop from './components/ScrollToTop';
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
          if (!hasProfile) return 'profile-completion';
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

  // Handle successful login (after OTP verification in LoginForm)
  const handleLoginSuccess = (response) => {
    // Store user data if needed
    if (response && response.user) {
      setUserData(response.user);
      localStorage.setItem('userData', JSON.stringify(response.user));
    }

    const hasProfile = !!(response?.user?.full_name && response?.user?.postal_code);

    // Check if user needs to complete profile (first-time login)
    if (response.requiresProfileCompletion && !hasProfile) {
      setCurrentPage('profile-completion');
      localStorage.setItem('currentPage', 'profile-completion');
      window.location.href = '/profile-completion';
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

  return (
    <WishlistProvider>
      <ScrollToTop />
      <Routes>
        {/* Admin Routes - No Layout */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route element={<AdminAppRoute />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>

        {/* Veterinarian Routes - No Layout (Separate Auth Flow) */}
        <Route path="/veterinarian/login" element={<VeterinarianLogin />} />
        <Route path="/veterinarian/register" element={<VeterinarianRegistrationForm />} />
        <Route path="/veterinarian/forgot-password" element={<VeterinarianForgotPassword />} />
        <Route path="/veterinarian/reset-password" element={<VeterinarianResetPassword />} />
        <Route element={<VeterinarianAppRoute />}>
          <Route path="/veterinarian/dashboard" element={<VeterinarianDashboard />} />
        </Route>

        {/* Routes without header/footer */}
        <Route element={<Layout showHeaderFooter={false} />}>
          <Route
            path="/login"
            element={<LoginForm onLoginSuccess={handleLoginSuccess} />}
          />
        </Route>

        <Route element={<AuthenticatedRoute />}>
          <Route element={<Layout showHeaderFooter={false} />}>
            <Route
              path="/profile-completion"
              element={<ProfileCompletion onComplete={handleProfileComplete} />}
            />
          </Route>
        </Route>

        {/* Protected user app routes with header/footer */}
        <Route element={<UserAppRoute />}>
          <Route path="/veterinarians" element={<NearbyVeterinarians />} />
          <Route path="/book-appointment/:vetId" element={<AppointmentBookingForm />} />
          <Route element={<Layout showHeaderFooter={true} />}>
            <Route
              path="/"
              element={
                currentPage === 'login' ? (
                  <Navigate to="/login" replace />
                ) : currentPage === 'profile-completion' ? (
                  <Navigate to="/profile-completion" replace />
                ) : (
                  <HomePage />
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
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/map" element={<MapView />} />
          </Route>
        </Route>

        {/* Public routes with header/footer */}
        <Route element={<Layout showHeaderFooter={true} />}>
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/blogs" element={<BlogList />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </WishlistProvider>
  );
}

export default App;
