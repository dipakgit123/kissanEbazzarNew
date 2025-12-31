import React, { useState, useEffect } from 'react';
import CircleBar from './CircleBar';
import AnimalCard from './AnimalCard';
import { listingsService, userService } from '../services/api';

import { Link } from 'react-router-dom';

const HomePage = ({ wishlist, addToWishlist, removeFromWishlist, isInWishlist }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAnimals, setFilteredAnimals] = useState([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [animalData, setAnimalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);

  // Toggle wishlist function
  const handleToggleWishlist = (animalId) => {
    const animal = animalData.find(a => a.id === animalId);
    if (isInWishlist(animalId)) {
      removeFromWishlist(animalId);
    } else {
      addToWishlist(animal);
    }
  };

  // Fetch user location and nearby listings
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Try to get user's location from profile first
        const token = localStorage.getItem('token');
        let lat = null;
        let lng = null;

        if (token) {
          try {
            const profileResponse = await userService.getProfile();
            if (profileResponse.success && profileResponse.user) {
              lat = profileResponse.user.latitude;
              lng = profileResponse.user.longitude;
              setUserLocation({
                latitude: lat,
                longitude: lng,
                city: profileResponse.user.city,
                state: profileResponse.user.state
              });
            }
          } catch (err) {
            console.log('Could not fetch user profile:', err);
          }
        }

        // If no user location, try browser geolocation
        if (!lat || !lng) {
          try {
            const position = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 5000,
                enableHighAccuracy: false
              });
            });
            lat = position.coords.latitude;
            lng = position.coords.longitude;
            setUserLocation({ latitude: lat, longitude: lng });
          } catch (err) {
            console.log('Could not get browser location:', err);
          }
        }

        // Fetch listings based on location
        let listings = [];
        let usedNearby = false;

        if (lat && lng) {
          // Try to get nearby listings sorted by distance
          const response = await listingsService.getNearbyListings(lat, lng, 100, 20);
          if (response.success && response.data && response.data.length > 0) {
            listings = response.data;
            usedNearby = true;
          }
        }

        // Fallback to featured listings if no location or nearby returned empty
        if (listings.length === 0) {
          const response = await listingsService.getFeaturedListings(20);
          if (response.success) {
            listings = response.data;
          }
          // Clear user location indicator if we're showing featured instead of nearby
          if (usedNearby === false && lat && lng) {
            // Keep location but note that we're showing all listings
            setUserLocation(prev => prev ? { ...prev, showingFeatured: true } : null);
          }
        }

        // Transform listings data for AnimalCard component
        const transformedListings = listings.map(listing => ({
          id: `${listing.animal_type}-${listing.id}`,
          listingId: listing.id,
          title: `${listing.breed_name || 'Unknown Breed'} | ${listing.animal_type.charAt(0).toUpperCase() + listing.animal_type.slice(1)}`,
          price: listing.expected_price ? Number(listing.expected_price).toLocaleString('en-IN') : '0',
          location: `${listing.city || 'Unknown'}${listing.distance ? ` (${Math.round(listing.distance)} km)` : ''}`,
          datePosted: formatTimeAgo(listing.created_at),
          imageSrc: listing.front_photo || listing.side_photo || 'https://via.placeholder.com/300x200?text=No+Image',
          sellerName: listing.seller?.name || 'Unknown Seller',
          phoneNumber: listing.seller?.phone || '',
          breed: listing.breed_name || 'Unknown',
          animalType: listing.animal_type.charAt(0).toUpperCase() + listing.animal_type.slice(1),
          milkProduction: listing.milk_capacity ? `${listing.milk_capacity}L` : 'N/A',
          distance: listing.distance,
          status: listing.status,
          sellerPhoto: listing.seller?.profile_photo
        }));

        setAnimalData(transformedListings);
      } catch (error) {
        console.error('Error fetching listings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper function to format time ago
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Recently';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim() === '') {
      setFilteredAnimals([]);
      return;
    }

    const filtered = animalData.filter(animal =>
      animal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      animal.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
      animal.animalType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      animal.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      animal.sellerName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setFilteredAnimals(filtered);
  };

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value.trim() === '') {
      setFilteredAnimals([]);
    }
  };

  const displayAnimals = filteredAnimals.length > 0 ? filteredAnimals : animalData;

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 200);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-gradient-to-br from-[#E9F0F8] to-[#F0F8FF] min-h-screen flex flex-col">
      {/* Sticky Search Bar */}
      {isScrolled && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3">
            {/* Mobile Layout */}
            <div className="block sm:hidden">
              <div className="flex items-center justify-between mb-3">
                {/* Logo */}
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#15BB73] to-[#0FA568] rounded-lg flex items-center justify-center shadow-lg">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-sm font-bold text-[#000600]">Kissan E-Bazzar</h1>
                    <p className="text-xs text-gray-600">Farmers Marketplace</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <Link
                    to="/sell-animal"
                    className="bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white px-3 py-1.5 rounded-lg font-semibold text-xs"
                  >
                    Sell
                  </Link>

                  {/* Wishlist Button */}
                  <Link
                    to="/wishlist"
                    className="relative w-8 h-8 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                    </svg>
                    {wishlist && wishlist.length > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {wishlist.length}
                      </span>
                    )}
                  </Link>

                  <Link
                    to="/profile"
                    className="w-8 h-8 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search animals..."
                  value={searchQuery}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 pl-8 pr-16 rounded-lg border-2 border-gray-200 focus:border-[#15BB73] focus:outline-none focus:ring-2 focus:ring-[#15BB73]/20 text-sm"
                />
                <svg className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <button
                  type="submit"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white px-3 py-1 rounded-md font-medium text-xs"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Desktop Layout */}
            <div className="hidden sm:flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#15BB73] to-[#0FA568] rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-[#000600]">Kissan E-Bazzar</h1>
                  <p className="text-xs text-gray-600">Farmers Marketplace</p>
                </div>
              </div>

              {/* Search Bar */}
              <div className="flex-1 max-w-2xl mx-8">
                <form onSubmit={handleSearch} className="relative">
                  <input
                    type="text"
                    placeholder="Search for animals, breeds, or locations..."
                    value={searchQuery}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pl-10 pr-24 rounded-xl border-2 border-gray-200 focus:border-[#15BB73] focus:outline-none focus:ring-2 focus:ring-[#15BB73]/20 text-sm shadow-sm"
                  />
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <button
                    type="submit"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-300 text-sm"
                  >
                    Search
                  </button>
                </form>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <Link
                  to="/sell-animal"
                  className="bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 text-sm"
                >
                  Sell Now
                </Link>

                {/* Wishlist Button */}
                <Link
                  to="/wishlist"
                  className="relative w-10 h-10 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center hover:from-[#15BB73] hover:to-[#0FA568] hover:text-white transition-all duration-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                  {wishlist && wishlist.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                      {wishlist.length}
                    </span>
                  )}
                </Link>

                <Link
                  to="/profile"
                  className="w-10 h-10 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center hover:from-[#15BB73] hover:to-[#0FA568] hover:text-white transition-all duration-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#15BB73]/10 to-[#0FA568]/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-[#000600] mb-4">
            Find Your Perfect Farm Animal
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Connect directly with farmers and find the best quality animals for your farm.
            Browse through verified listings and make informed decisions.
          </p>

          {/* Location indicator */}
          {userLocation && (userLocation.city || userLocation.state) && (
            <p className="text-sm text-gray-500 mb-4">
              Showing animals near <span className="font-semibold text-[#15BB73]">{userLocation.city}{userLocation.state ? `, ${userLocation.state}` : ''}</span>
            </p>
          )}

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search for animals, breeds, or locations..."
                value={searchQuery}
                onChange={handleInputChange}
                className="w-full px-6 py-4 pl-12 pr-32 rounded-2xl border-2 border-gray-200 focus:border-[#15BB73] focus:outline-none focus:ring-4 focus:ring-[#15BB73]/20 text-lg shadow-lg"
              />
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white px-6 py-2 rounded-xl font-medium hover:shadow-lg transition-all duration-300"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className={`flex-1 p-4 pb-20 transition-all duration-300 ${isScrolled ? 'pt-16 sm:pt-20' : ''}`}>
        {/* Animal Categories */}
        <div className="max-w-7xl mx-auto mb-8">
          <h3 className="text-2xl font-bold text-[#000600] mb-6 text-center">Browse by Category</h3>
          <CircleBar />
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Search Results Header */}
          {filteredAnimals.length > 0 && (
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-[#000600] mb-2">
                Search Results for "{searchQuery}"
              </h3>
              <p className="text-gray-600">
                Found {filteredAnimals.length} animal{filteredAnimals.length !== 1 ? 's' : ''} matching your search
              </p>
            </div>
          )}

          {/* Featured Listings */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-[#000600]">
                {filteredAnimals.length > 0 ? 'Search Results' : (userLocation && !userLocation.showingFeatured) ? 'Nearby Listings' : 'Featured Listings'}
              </h3>
              {userLocation && !userLocation.showingFeatured && !filteredAnimals.length && (
                <span className="text-sm text-gray-500 flex items-center">
                  <svg className="w-4 h-4 mr-1 text-[#15BB73]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Sorted by distance
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#15BB73]"></div>
                <span className="ml-3 text-gray-600">Loading listings...</span>
              </div>
            ) : displayAnimals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayAnimals.map((animal) => (
                  <AnimalCard
                    key={animal.id}
                    id={animal.id}
                    listingId={animal.listingId}
                    title={animal.title}
                    price={animal.price}
                    location={animal.location}
                    datePosted={animal.datePosted}
                    imageSrc={animal.imageSrc}
                    sellerName={animal.sellerName}
                    phoneNumber={animal.phoneNumber}
                    breed={animal.breed}
                    animalType={animal.animalType}
                    milkProduction={animal.milkProduction}
                    isInWishlist={isInWishlist(animal.id)}
                    onToggleWishlist={handleToggleWishlist}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🐄</div>
                <h3 className="text-2xl font-bold text-gray-600 mb-2">No animals found</h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery ?
                    'Try searching with different keywords like "cow", "buffalo", "goat", or location names' :
                    'Be the first to list an animal in your area!'
                  }
                </p>
                {searchQuery ? (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilteredAnimals([]);
                    }}
                    className="bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                  >
                    Clear Search
                  </button>
                ) : (
                  <Link
                    to="/sell-animal"
                    className="inline-block bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                  >
                    List Your Animal
                  </Link>
                )}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#000600] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-[#15BB73] to-[#0FA568] rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold">Kissan E-Bazzar</h3>
                  <p className="text-sm text-gray-400">Farmers Marketplace</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                Connecting farmers directly to consumers with modern technology and seamless experience.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/" className="hover:text-[#15BB73] transition-colors">Home</Link></li>
                <li><Link to="/sell-animal" className="hover:text-[#15BB73] transition-colors">Sell Animal</Link></li>
                <li><Link to="/profile" className="hover:text-[#15BB73] transition-colors">Profile</Link></li>
                <li><Link to="/about" className="hover:text-[#15BB73] transition-colors">About Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-[#15BB73] transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-[#15BB73] transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-[#15BB73] transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[#15BB73] transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Connect With Us</h4>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-[#15BB73] transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-[#15BB73] transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-[#15BB73] transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 Kissan E-Bazzar. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
