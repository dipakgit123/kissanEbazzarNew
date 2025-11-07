// App.js - Corrected to work with your LoginForm that has built-in OTP
import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import HomePage from './components/HomePage';
import Layout from './components/Layout';
import LocationSetup from './components/LocationSetup'; // Add location component
import LoginForm from './components/LoginForm'; // Your LoginForm with OTP built-in
import MapView from './components/MapView';
import PregnancyCalendar from './components/PregnancyCalendar';
import ProfilePage from './components/ProfilePage';
import AnimalListingPage from './components/AnimalListingPage';
import VeterinarianPage from './components/VeterinarianPage';
import WishlistPage from './components/WishlistPage';

function App() {
  // Initialize state from localStorage
  const [currentPage, setCurrentPage] = useState(() => {
    return localStorage.getItem('currentPage') || 'login';
  });
  const [wishlist, setWishlist] = useState([]);
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
    // Move to location setup after successful OTP verification
    setCurrentPage('location');
    localStorage.setItem('currentPage', 'location');
    window.location.href = '/location-setup';
  };

  // Handle location setup completion
  const handleLocationSet = () => {
    setHasLocation(true);
    setCurrentPage('home');
    localStorage.setItem('hasLocation', 'true');
    localStorage.setItem('currentPage', 'home');
    window.location.href = '/';
  };

  // Wishlist functions
  const addToWishlist = (animal) => {
    setWishlist(prev => {
      const exists = prev.find(item => item.id === animal.id);
      if (exists) return prev;
      return [...prev, { ...animal, addedAt: new Date().toISOString() }];
    });
  };

  const removeFromWishlist = (animalId) => {
    setWishlist(prev => prev.filter(item => item.id !== animalId));
  };

  const isInWishlist = (animalId) => {
    return wishlist.some(item => item.id === animalId);
  };

  return (
    <Routes>
      {/* Routes without header/footer */}
      <Route element={<Layout showHeaderFooter={false} wishlistCount={wishlist.length} />}>
        <Route
          path="/login"
          element={<LoginForm onLoginSuccess={handleLoginSuccess} />}
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
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/sell-animal" element={<AnimalListingPage />} />
        <Route path="/veterinarian" element={<VeterinarianPage />} />
        <Route path="/pregnancy-calendar" element={<PregnancyCalendar />} />
        <Route path="/wishlist" element={<WishlistPage wishlist={wishlist} removeFromWishlist={removeFromWishlist} isInWishlist={isInWishlist} />} />
        <Route path="/map" element={<MapView wishlist={wishlist} addToWishlist={addToWishlist} removeFromWishlist={removeFromWishlist} isInWishlist={isInWishlist} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;