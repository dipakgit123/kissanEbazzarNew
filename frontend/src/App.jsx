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
import SellAnimalForm from './components/SellAnimalForm';
import VeterinarianPage from './components/VeterinarianPage';
import WishlistPage from './components/WishlistPage';

function App() {
  const [currentPage, setCurrentPage] = useState('login'); // 'login', 'location', or 'home'
  const [wishlist, setWishlist] = useState([]);
  const [hasLocation, setHasLocation] = useState(false);
  const [userData, setUserData] = useState(null);

  // Handle successful login (after OTP verification in LoginForm)
  const handleLoginSuccess = (response) => {
    // Store user data if needed
    if (response && response.user) {
      setUserData(response.user);
    }
    // Move to location setup after successful OTP verification
    setCurrentPage('location');
  };

  // Handle location setup completion
  const handleLocationSet = () => {
    setHasLocation(true);
    setCurrentPage('home');
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

  // Determine if we should show header/footer
  const shouldShowHeaderFooter = !['login', 'location'].includes(currentPage);

  return (
    <Routes>
      <Route element={<Layout showHeaderFooter={shouldShowHeaderFooter} wishlistCount={wishlist.length} />}>
        <Route 
          path="/" 
          element={
            currentPage === 'login' ? (
              <LoginForm onLoginSuccess={handleLoginSuccess} />
            ) : currentPage === 'location' ? (
              <LocationSetup 
                onLocationSet={handleLocationSet}
                skipAllowed={true}
              />
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
        <Route path="/sell-animal" element={<SellAnimalForm />} />
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