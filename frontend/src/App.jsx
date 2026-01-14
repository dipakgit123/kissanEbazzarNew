// App.js - Corrected to work with your LoginForm that has built-in OTP
import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import HomePage from './components/HomePage';
import Layout from './components/Layout';
import LocationSetup from './components/LocationSetup'; // Add location component
import LoginForm from './components/LoginForm'; // Your LoginForm with OTP built-in
import ProfileCompletion from './components/ProfileCompletion'; // Profile completion for first-time users
import MapView from './components/MapView';
import PregnancyCalendar from './components/PregnancyCalendar';
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
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import BuyAnimalsPage from './components/BuyAnimalsPage';

function App() {
  // Initialize state from localStorage
  const [currentPage, setCurrentPage] = useState(() => {
    // Check if user has token (logged in before)
    const token = localStorage.getItem('token');
    const savedPage = localStorage.getItem('currentPage');
    
    // If user has token, go to saved page or home
    if (token) {
      return savedPage || 'home';
    }
    
    // If no token, always show login page
    return 'login';
  });
  const [wishlist, setWishlist] = useState(() => {
    const saved = localStorage.getItem('wishlist');
    return saved ? JSON.parse(saved) : [];
  });
  const [hasLocation, setHasLocation] = useState(() => {
    return localStorage.getItem('hasLocation') === 'true';
  });
  const [userData, setUserData] = useState(() => {
    const saved = localStorage.getItem('userData');
    return saved ? JSON.parse(saved) : null;
  });

  // Handle successful login (after OTP verification in LoginForm)
  const handleLoginSuccess = (response) => {
    // Store user data if needed
    if (response && response.user) {
      setUserData(response.user);
      localStorage.setItem('userData', JSON.stringify(response.user));
    }

    // Check if user needs to complete profile (first-time login)
    if (response.requiresProfileCompletion) {
      setCurrentPage('profile-completion');
      localStorage.setItem('currentPage', 'profile-completion');
      window.location.href = '/profile-completion';
    }
    // Check if user needs to set location
    else if (response.requiresLocation) {
      setCurrentPage('location');
      localStorage.setItem('currentPage', 'location');
      window.location.href = '/location-setup';
    }
    // User is fully set up, go to home
    else {
      setCurrentPage('home');
      localStorage.setItem('currentPage', 'home');
      setHasLocation(true);
      localStorage.setItem('hasLocation', 'true');
      window.location.href = '/';
    }
  };

  // Handle profile completion (first-time users)
  const handleProfileComplete = (response) => {
    // Update user data
    const currentUser = JSON.parse(localStorage.getItem('userData') || '{}');
    const updatedUser = {
      ...currentUser,
      ...response.location
    };
    setUserData(updatedUser);
    localStorage.setItem('userData', JSON.stringify(updatedUser));

    // Profile completed, location should be set too, go to home
    setCurrentPage('home');
    localStorage.setItem('currentPage', 'home');
    setHasLocation(true);
    localStorage.setItem('hasLocation', 'true');
    window.location.href = '/';
  };

  // Handle location setup completion
  const handleLocationSet = () => {
    setHasLocation(true);
    setCurrentPage('home');
    localStorage.setItem('hasLocation', 'true');
    localStorage.setItem('currentPage', 'home');
    window.location.href = '/';
  };

  // Wishlist functions with localStorage persistence
  const addToWishlist = (animal) => {
    setWishlist(prev => {
      const exists = prev.find(item => item.id === animal.id);
      if (exists) return prev;
      const newWishlist = [...prev, { ...animal, addedAt: new Date().toISOString() }];
      localStorage.setItem('wishlist', JSON.stringify(newWishlist));
      return newWishlist;
    });
  };

  const removeFromWishlist = (animalId) => {
    setWishlist(prev => {
      const newWishlist = prev.filter(item => item.id !== animalId);
      localStorage.setItem('wishlist', JSON.stringify(newWishlist));
      return newWishlist;
    });
  };

  const isInWishlist = (animalId) => {
    return wishlist.some(item => item.id === animalId);
  };

  return (
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
      <Route element={<Layout showHeaderFooter={false} wishlistCount={wishlist.length} />}>
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
      <Route element={<Layout showHeaderFooter={true} wishlistCount={wishlist.length} />}>
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
              <HomePage
                wishlist={wishlist}
                addToWishlist={addToWishlist}
                removeFromWishlist={removeFromWishlist}
                isInWishlist={isInWishlist}
                hasLocation={hasLocation}
              />
            )
          }
        />
        <Route path="/profile" element={<ProfilePage wishlistCount={wishlist.length} />} />
        <Route path="/buy-animals" element={<BuyAnimalsPage wishlist={wishlist} addToWishlist={addToWishlist} removeFromWishlist={removeFromWishlist} isInWishlist={isInWishlist} />} />
        <Route path="/sell-animal" element={<AnimalListingPage />} />
        <Route path="/animal/:animalType/:id" element={<AnimalDetailPage />} />
        <Route path="/veterinarian" element={<VeterinarianPage />} />
        <Route path="/pregnancy-calendar" element={<PregnancyCalendar />} />
        <Route path="/ai-health-check" element={<AIHealthCheck />} />
        <Route path="/call-history" element={<CallHistory />} />
        <Route path="/wishlist" element={<WishlistPage wishlist={wishlist} removeFromWishlist={removeFromWishlist} isInWishlist={isInWishlist} />} />
        <Route path="/map" element={<MapView wishlist={wishlist} addToWishlist={addToWishlist} removeFromWishlist={removeFromWishlist} isInWishlist={isInWishlist} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;