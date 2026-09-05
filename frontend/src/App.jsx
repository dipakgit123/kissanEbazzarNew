// App.js - Corrected to work with your LoginForm that has built-in OTP
import { Suspense, lazy, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { safeJsonParse } from './utils/stringUtils';
import './App.css';
import AuthenticatedRoute from './components/AuthenticatedRoute';
import UserAppRoute from './components/UserAppRoute';
import AdminAppRoute from './components/AdminAppRoute';
import VeterinarianAppRoute from './components/VeterinarianAppRoute';
import ScrollToTop from './components/ScrollToTop';
import { WishlistProvider } from './contexts/WishlistContext.jsx';

const Layout = lazy(() => import('./components/Layout'));
const HomePage = lazy(() => import('./components/HomePage'));
const LoginForm = lazy(() => import('./components/LoginForm'));
const ProfileCompletion = lazy(() => import('./components/ProfileCompletion'));
const MapView = lazy(() => import('./components/MapView'));
const PregnancyCalendar = lazy(() => import('./components/PregnancyCalendar'));
const MilkReportsPage = lazy(() => import('./components/MilkReportsPage'));
const ProfilePage = lazy(() => import('./components/ProfilePage'));
const AnimalListingPage = lazy(() => import('./components/AnimalListingPage'));
const AnimalDetailPage = lazy(() => import('./components/AnimalDetailPage'));
const VeterinarianPage = lazy(() => import('./components/VeterinarianPage'));
const VeterinarianRegistrationForm = lazy(() => import('./components/VeterinarianRegistrationForm'));
const VeterinarianLogin = lazy(() => import('./components/VeterinarianLogin'));
const VeterinarianForgotPassword = lazy(() => import('./components/VeterinarianForgotPassword'));
const VeterinarianResetPassword = lazy(() => import('./components/VeterinarianResetPassword'));
const VeterinarianDashboard = lazy(() => import('./components/VeterinarianDashboard'));
const NearbyVeterinarians = lazy(() => import('./components/NearbyVeterinarians'));
const AppointmentBookingForm = lazy(() => import('./components/AppointmentBookingForm'));
const WishlistPage = lazy(() => import('./components/WishlistPage'));
const AIHealthCheck = lazy(() => import('./components/AIHealthCheck'));
const CallHistory = lazy(() => import('./components/CallHistory'));
const HelpCenter = lazy(() => import('./components/HelpCenter'));
const TermsPage = lazy(() => import('./components/TermsPage'));
const PrivacyPage = lazy(() => import('./components/PrivacyPage'));
const AboutPage = lazy(() => import('./components/AboutPage'));
const ContactPage = lazy(() => import('./components/ContactPage'));
const AdminLogin = lazy(() => import('./components/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const BuyAnimalsPage = lazy(() => import('./components/BuyAnimalsPage'));
const BlogList = lazy(() => import('./components/BlogList'));
const BlogDetail = lazy(() => import('./components/BlogDetail'));
const GovernmentSchemesPage = lazy(() => import('./components/GovernmentSchemesPage'));
const GovernmentSchemeDetail = lazy(() => import('./components/GovernmentSchemeDetail'));
const SellerListingInsightsPage = lazy(() => import('./components/SellerListingInsightsPage'));
const PetMatingPage = lazy(() => import('./components/PetMatingPage'));

const routeFallback = (
  <div className="min-h-screen bg-slate-50" />
);

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

  const [, setUserData] = useState(() => {
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
      <Suspense fallback={routeFallback}>
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
            <Route path="/seller-listings/:animalType/:id/insights" element={<SellerListingInsightsPage />} />
            <Route path="/veterinarian" element={<VeterinarianPage />} />
            <Route path="/pregnancy-calendar" element={<PregnancyCalendar />} />
            <Route path="/milk-reports" element={<MilkReportsPage />} />
            <Route path="/ai-health-check" element={<AIHealthCheck />} />
            <Route path="/pet-mating" element={<PetMatingPage />} />
            <Route path="/call-history" element={<CallHistory />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/map" element={<MapView />} />
          </Route>
        </Route>

        {/* Public routes with header/footer */}
        <Route element={<Layout showHeaderFooter={true} />}>
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/blogs" element={<BlogList />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />
          <Route path="/government-schemes" element={<GovernmentSchemesPage />} />
          <Route path="/government-schemes/:slug" element={<GovernmentSchemeDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
        </Routes>
      </Suspense>
    </WishlistProvider>
  );
}

export default App;
