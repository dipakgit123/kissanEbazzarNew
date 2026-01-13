import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import CircleBar from './CircleBar';
import AnimalCard from './AnimalCard';
import DistanceToggle from './DistanceToggle';
import CowLoader from './CowLoader';
import { listingsService, userService } from '../services/api';

const BuyAnimalsPage = ({ wishlist, addToWishlist, removeFromWishlist, isInWishlist }) => {
  const { t } = useTranslation();
  const [animalData, setAnimalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [distanceMode, setDistanceMode] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchSticky, setIsSearchSticky] = useState(false);
  const searchBarRef = useRef(null);

  // Scroll effect for sticky search bar
  useEffect(() => {
    const handleScroll = () => {
      if (searchBarRef.current) {
        const rect = searchBarRef.current.getBoundingClientRect();
        // Make sticky when search bar reaches the top (after header)
        setIsSearchSticky(rect.top <= 80); // 80px is approximately header height
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Toggle wishlist function
  const handleToggleWishlist = (animalId) => {
    const animal = animalData.find(a => a.id === animalId);
    if (isInWishlist(animalId)) {
      removeFromWishlist(animalId);
    } else {
      addToWishlist(animal);
    }
  };

  // Helper function to format time ago
  const formatTimeAgo = useCallback((dateString) => {
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
  }, []);

  // Fetch user location on mount
  useEffect(() => {
    const fetchUserLocation = async () => {
      try {
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
              return;
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
      } catch (error) {
        console.error('Error fetching user location:', error);
      }
    };

    fetchUserLocation();
  }, []);

  // Fetch listings based on distance mode
  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        let listings = [];

        if (distanceMode === 'all') {
          const response = await listingsService.getFeaturedListings(100);
          if (response.success && response.data) {
            listings = response.data;
          }
        } else {
          if (userLocation?.latitude && userLocation?.longitude) {
            const response = await listingsService.getNearbyListings(
              userLocation.latitude,
              userLocation.longitude,
              100,
              50
            );
            if (response.success && response.data && response.data.length > 0) {
              listings = response.data;
            }
          }

          if (listings.length === 0) {
            const response = await listingsService.getFeaturedListings(50);
            if (response.success) {
              listings = response.data;
            }
          }
        }

        // Transform listings data - same as HomePage
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

    fetchListings();
  }, [distanceMode, userLocation, formatTimeAgo]);

  // Filter animals by category and search query
  const filteredAnimals = useMemo(() => {
    let filtered = animalData;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(animal => {
        const animalType = animal.animalType?.toLowerCase();
        const category = selectedCategory.toLowerCase();

        if (category === 'cow' || category === 'bull') {
          return animalType === 'cow' || animalType === 'bull' || animalType === 'animal';
        }
        return animalType === category || animalType?.includes(category);
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(animal => 
        animal.title?.toLowerCase().includes(query) ||
        animal.breed?.toLowerCase().includes(query) ||
        animal.animalType?.toLowerCase().includes(query) ||
        animal.location?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [animalData, selectedCategory, searchQuery]);

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
  };

  const clearCategoryFilter = () => {
    setSelectedCategory(null);
  };

  return (
    <div className="bg-gradient-to-br from-[#E9F0F8] to-[#F0F8FF] min-h-screen">
      {/* Sticky Search Bar Container - Integrates into navbar */}
      {isSearchSticky && (
        <div className="fixed top-16 sm:top-20 left-0 right-0 z-40 bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-center gap-4">
              {/* Centered Search Input */}
              <div className="flex-1 max-w-2xl relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search animals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#15BB73] focus:border-transparent transition-all duration-200 text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {/* Results count on the right */}
              <span className="hidden sm:block text-sm text-gray-600 whitespace-nowrap">
                {filteredAnimals.length} {filteredAnimals.length === 1 ? 'result' : 'results'}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#000600] mb-2">{t('home.buyAnimals')}</h1>
          <p className="text-gray-600 text-sm sm:text-base">Browse and purchase quality farm animals</p>
        </div>

        {/* Search & Filter Section */}
        <div ref={searchBarRef} className="mb-8">
          <div className="bg-gradient-to-br from-white via-blue-50/30 to-green-50/30 rounded-xl shadow-lg border border-gray-100 p-4 sm:p-5 backdrop-blur-sm">
            {/* Search Bar */}
            <div className="relative mb-3">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#15BB73] to-[#0FA568] flex items-center justify-center shadow-md">
                  <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <input
                type="text"
                placeholder="Search by breed, type, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-11 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#15BB73] focus:border-[#15BB73] transition-all duration-200 text-sm shadow-sm hover:shadow-md"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <div className="w-7 h-7 rounded-full bg-gray-100 hover:bg-red-100 flex items-center justify-center transition-colors group">
                    <svg className="h-3.5 w-3.5 text-gray-500 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </button>
              )}
            </div>

            {/* Distance Toggle */}
            <div className="flex items-center justify-center">
              <div className="inline-flex items-center bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg p-1 shadow-inner">
                <button
                  onClick={() => setDistanceMode('all')}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-300 ${
                    distanceMode === 'all'
                      ? 'bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <svg className={`w-4 h-4 ${distanceMode === 'all' ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>All Animals</span>
                  </div>
                </button>
                <button
                  onClick={() => setDistanceMode('nearby')}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-300 ${
                    distanceMode === 'nearby'
                      ? 'bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <svg className={`w-4 h-4 ${distanceMode === 'nearby' ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Nearby (100 km)</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Browse by Category Section */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h3 className="text-2xl sm:text-3xl font-bold text-[#000600] mb-2">Browse by Category</h3>
            <p className="text-gray-600 text-sm">Select an animal type to explore available listings</p>
          </div>
          
          {/* Category Grid - Same structure as HomePage feature cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Cow Card */}
              <button
                onClick={() => handleCategoryClick('cow')}
                className={`group relative rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2 hover:scale-105 ${
                  selectedCategory === 'cow' ? 'ring-4 ring-[#15BB73]' : ''
                }`}
              >
                <div className="relative h-40 sm:h-48 overflow-hidden bg-gradient-to-br from-blue-50 to-green-50">
                  <img
                    src="/src/assets/images/cow1.png"
                    alt="Cows"
                    className="w-full h-full object-contain opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 p-4"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 via-blue-900/10 to-transparent"></div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-white drop-shadow-lg">Cows</h3>
                      <p className="text-xs text-white/80 mt-1">Browse cows</p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-300">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </button>

              {/* Buffalo Card */}
              <button
                onClick={() => handleCategoryClick('buffalo')}
                className={`group relative rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2 hover:scale-105 ${
                  selectedCategory === 'buffalo' ? 'ring-4 ring-[#15BB73]' : ''
                }`}
              >
                <div className="relative h-40 sm:h-48 overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50">
                  <img
                    src="/src/assets/images/buffelo1.png"
                    alt="Buffalo"
                    className="w-full h-full object-contain opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 p-4"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/40 via-purple-900/10 to-transparent"></div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-white drop-shadow-lg">Buffalo</h3>
                      <p className="text-xs text-white/80 mt-1">Browse buffalo</p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-300">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </button>

              {/* Goat Card */}
              <button
                onClick={() => handleCategoryClick('goat')}
                className={`group relative rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2 hover:scale-105 ${
                  selectedCategory === 'goat' ? 'ring-4 ring-[#15BB73]' : ''
                }`}
              >
                <div className="relative h-40 sm:h-48 overflow-hidden bg-gradient-to-br from-orange-50 to-yellow-50">
                  <img
                    src="/src/assets/images/goat1.png"
                    alt="Goats"
                    className="w-full h-full object-contain opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 p-4"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-orange-900/40 via-orange-900/10 to-transparent"></div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-white drop-shadow-lg">Goats</h3>
                      <p className="text-xs text-white/80 mt-1">Browse goats</p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-300">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </button>

              {/* Bull Card */}
              <button
                onClick={() => handleCategoryClick('bull')}
                className={`group relative rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2 hover:scale-105 ${
                  selectedCategory === 'bull' ? 'ring-4 ring-[#15BB73]' : ''
                }`}
              >
                <div className="relative h-40 sm:h-48 overflow-hidden bg-gradient-to-br from-red-50 to-orange-50">
                  <img
                    src="/src/assets/images/bull1.png"
                    alt="Bulls"
                    className="w-full h-full object-contain opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 p-4"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-red-900/40 via-red-900/10 to-transparent"></div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-white drop-shadow-lg">Bulls</h3>
                      <p className="text-xs text-white/80 mt-1">Browse bulls</p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-300">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </button>

              {/* Horse Card */}
              <button
                onClick={() => handleCategoryClick('horse')}
                className={`group relative rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2 hover:scale-105 ${
                  selectedCategory === 'horse' ? 'ring-4 ring-[#15BB73]' : ''
                }`}
              >
                <div className="relative h-40 sm:h-48 overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50">
                  <img
                    src="/src/assets/images/horse1.png"
                    alt="Horses"
                    className="w-full h-full object-contain opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 p-4"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-amber-900/40 via-amber-900/10 to-transparent"></div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-white drop-shadow-lg">Horses</h3>
                      <p className="text-xs text-white/80 mt-1">Browse horses</p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-300">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </button>

              {/* Dog Card */}
              <button
                onClick={() => handleCategoryClick('dog')}
                className={`group relative rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2 hover:scale-105 ${
                  selectedCategory === 'dog' ? 'ring-4 ring-[#15BB73]' : ''
                }`}
              >
                <div className="relative h-40 sm:h-48 overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50">
                  <img
                    src="/src/assets/images/Dog1.png"
                    alt="Dogs"
                    className="w-full h-full object-contain opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 p-4"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 via-blue-900/10 to-transparent"></div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-white drop-shadow-lg">Dogs</h3>
                      <p className="text-xs text-white/80 mt-1">Browse dogs</p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-300">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </button>

              {/* Cat Card */}
              <button
                onClick={() => handleCategoryClick('cat')}
                className={`group relative rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2 hover:scale-105 ${
                  selectedCategory === 'cat' ? 'ring-4 ring-[#15BB73]' : ''
                }`}
              >
                <div className="relative h-40 sm:h-48 overflow-hidden bg-gradient-to-br from-pink-50 to-purple-50">
                  <img
                    src="/src/assets/images/cat1.png"
                    alt="Cats"
                    className="w-full h-full object-contain opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 p-4"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-pink-900/40 via-pink-900/10 to-transparent"></div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-white drop-shadow-lg">Cats</h3>
                      <p className="text-xs text-white/80 mt-1">Browse cats</p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-300">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </button>

              {/* Other Animals Card */}
              <button
                onClick={() => handleCategoryClick('other')}
                className={`group relative rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2 hover:scale-105 ${
                  selectedCategory === 'other' ? 'ring-4 ring-[#15BB73]' : ''
                }`}
              >
                <div className="relative h-40 sm:h-48 overflow-hidden bg-gradient-to-br from-gray-50 to-slate-50">
                  <div className="w-full h-full flex items-center justify-center p-4">
                    <svg className="w-20 h-20 sm:w-24 sm:h-24 text-gray-400 group-hover:text-gray-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 via-gray-900/10 to-transparent"></div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-white drop-shadow-lg">Other Animals</h3>
                      <p className="text-xs text-white/80 mt-1">Browse all</p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-300">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </button>
          </div>
        </div>

        {/* Active Filters */}
        {(selectedCategory || searchQuery) && (
          <div className="mb-6 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-gray-700">Active Filters:</span>
              
              {selectedCategory && (
                <button
                  onClick={clearCategoryFilter}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#15BB73]/10 text-[#15BB73] rounded-lg text-sm font-medium hover:bg-[#15BB73]/20 transition-colors"
                >
                  <span>{selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                >
                  <span>Search: "{searchQuery}"</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              <button
                onClick={() => {
                  clearCategoryFilter();
                  setSearchQuery('');
                }}
                className="ml-auto text-sm text-gray-600 hover:text-[#15BB73] font-medium transition-colors"
              >
                Clear All
              </button>
            </div>
            
            <div className="mt-2 text-sm text-gray-600">
              Showing {filteredAnimals.length} {filteredAnimals.length === 1 ? 'result' : 'results'}
            </div>
          </div>
        )}

        {/* Listings */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
            <div>
              <h3 className="text-2xl font-bold text-[#000600]">
                {selectedCategory
                  ? `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}s`
                  : searchQuery
                    ? 'Search Results'
                    : distanceMode === 'nearby'
                      ? 'Nearby Animals'
                      : 'All Available Animals'}
              </h3>
              {distanceMode === 'nearby' && !selectedCategory && !searchQuery && (
                <p className="text-sm text-gray-600 mt-1">Within 100 km from your location</p>
              )}
            </div>
            {userLocation && distanceMode === 'nearby' && (
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
            <div className="flex justify-center items-center py-12">
              <CowLoader message="Finding animals for you..." size="medium" />
            </div>
          ) : filteredAnimals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAnimals.map((animal) => (
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
            <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-700 mb-2">No Animals Found</h3>
              <p className="text-gray-500 mb-6">
                {searchQuery
                  ? `No results found for "${searchQuery}"`
                  : selectedCategory
                    ? `No ${selectedCategory}s available at the moment`
                    : 'Check back later for new listings'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {(selectedCategory || searchQuery) && (
                  <button
                    onClick={() => {
                      clearCategoryFilter();
                      setSearchQuery('');
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Clear Filters & View All
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuyAnimalsPage;
