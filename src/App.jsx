import { useState } from 'react';
import './App.css';
import LoginForm from './components/LoginForm';
import MobileVerification from './components/MobileVerification';
import ProfilePage from './components/ProfilePage';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './components/HomePage';
import SellAnimalForm from './components/SellAnimalForm';
import VeterinarianPage from './components/VeterinarianPage';
import PregnancyCalendar from './components/PregnancyCalendar';
import WishlistPage from './components/WishlistPage';
import MapView from './components/MapView';
import Layout from './components/Layout';

function App() {
  const [currentPage, setCurrentPage] = useState('login'); // 'login', 'verification', or 'home'
  const [formData, setFormData] = useState(null);
  const [wishlist, setWishlist] = useState([]);

  // Handle form submission from LoginForm
  const handleLoginSubmit = (data) => {
    setFormData(data);
    setCurrentPage('verification');
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

  // Handle back button from MobileVerification
  const handleBackToLogin = () => {
    setCurrentPage('login');
  };

  // Handle successful OTP verification
  const handleVerificationSuccess = () => {
    setCurrentPage('home');
  };

  // Determine if we should show header/footer
  const shouldShowHeaderFooter = !['login', 'verification'].includes(currentPage);

  return (
    <Routes>
      <Route element={<Layout showHeaderFooter={shouldShowHeaderFooter} wishlistCount={wishlist.length} />}>
        <Route 
          path="/" 
          element={
            currentPage === 'login' ? (
              <LoginForm onSubmit={handleLoginSubmit} />
            ) : currentPage === 'verification' ? (
              <MobileVerification 
                onBack={handleBackToLogin} 
                onSuccess={handleVerificationSuccess} 
              />
            ) : (
              <HomePage 
                wishlist={wishlist}
                addToWishlist={addToWishlist}
                removeFromWishlist={removeFromWishlist}
                isInWishlist={isInWishlist}
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