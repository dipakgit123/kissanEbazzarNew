import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import CircleBar from './CircleBar';
import AnimalCard from './AnimalCard';
import DistanceToggle from './DistanceToggle';
import CowLoader from './CowLoader';
import { listingsService, userService } from '../services/api';

import { Link } from 'react-router-dom';

// Debounce hook for search
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

const HomePage = ({ wishlist, addToWishlist, removeFromWishlist, isInWishlist }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAnimals, setFilteredAnimals] = useState([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [animalData, setAnimalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [distanceMode, setDistanceMode] = useState('all'); // 'all' = 500km, 'nearby' = 100km
  const [selectedCategory, setSelectedCategory] = useState(null); // Category filter from CircleBar

  // Search-related states
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [searchMode, setSearchMode] = useState('local'); // 'local' or 'api'
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Debounced search query for real-time search
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Quick search tags
  const quickSearchTags = useMemo(() => [
    { label: t('animalTypes.cow'), icon: '🐄', query: 'cow' },
    { label: t('animalTypes.buffalo'), icon: '🐃', query: 'buffalo' },
    { label: t('animalTypes.goat'), icon: '🐐', query: 'goat' },
    { label: t('animalTypes.horse'), icon: '🐴', query: 'horse' },
    { label: t('animalTypes.dog'), icon: '🐕', query: 'dog' },
    { label: t('animalTypes.cat'), icon: '🐱', query: 'cat' },
  ], [t]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 5));
    }
  }, []);

  // Save search to recent searches
  const saveRecentSearch = useCallback((query) => {
    if (!query.trim()) return;
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  }, [recentSearches]);

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  }, []);

  // Toggle wishlist function
  const handleToggleWishlist = (animalId) => {
    const animal = animalData.find(a => a.id === animalId) || filteredAnimals.find(a => a.id === animalId);
    if (!animal) return;

    if (isInWishlist(animalId)) {
      removeFromWishlist(animalId);
    } else {
      addToWishlist(animal);
    }
  };

  // Helper function to format time ago - defined before useEffect
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
          // For "All Available" - fetch ALL animals without distance filter
          const response = await listingsService.getFeaturedListings(100); // increased limit for all animals
          if (response.success && response.data) {
            listings = response.data;
          }
        } else {
          // For "Nearby Animals" - fetch only within 100km radius
          if (userLocation?.latitude && userLocation?.longitude) {
            const response = await listingsService.getNearbyListings(
              userLocation.latitude,
              userLocation.longitude,
              100, // Always 100km for nearby mode
              50
            );
            if (response.success && response.data && response.data.length > 0) {
              listings = response.data;
            }
          }

          // Fallback to featured listings if no location or no nearby listings found
          if (listings.length === 0) {
            const response = await listingsService.getFeaturedListings(50);
            if (response.success) {
              listings = response.data;
            }
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
          imageSrc: listing.front_photo || listing.side_photo || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect fill="%23f0f0f0" width="300" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="16" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E',
          sellerName: listing.seller?.name || 'Unknown Seller',
          sellerId: listing.seller?.id,
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

  // Transform listing data helper
  const transformListing = useCallback((listing) => ({
    id: `${listing.animal_type}-${listing.id}`,
    listingId: listing.id,
    title: `${listing.breed_name || 'Unknown Breed'} | ${listing.animal_type?.charAt(0).toUpperCase() + listing.animal_type?.slice(1)}`,
    price: listing.expected_price ? Number(listing.expected_price).toLocaleString('en-IN') : '0',
    location: `${listing.city || 'Unknown'}${listing.distance ? ` (${Math.round(listing.distance)} km)` : ''}`,
    datePosted: formatTimeAgo(listing.created_at),
    imageSrc: listing.front_photo || listing.side_photo || listing.photo_1 || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect fill="%23f0f0f0" width="300" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="16" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E',
    sellerName: listing.seller?.name || 'Unknown Seller',
    sellerId: listing.seller?.id,
    phoneNumber: listing.seller?.phone || '',
    breed: listing.breed_name || 'Unknown',
    animalType: listing.animal_type?.charAt(0).toUpperCase() + listing.animal_type?.slice(1),
    milkProduction: listing.milk_capacity ? `${listing.milk_capacity}L` : 'N/A',
    distance: listing.distance,
    status: listing.status,
    sellerPhoto: listing.seller?.profile_photo
  }), [formatTimeAgo]);

  // Perform local search (fast, on existing data)
  const performLocalSearch = useCallback((query) => {
    if (!query.trim()) {
      setFilteredAnimals([]);
      return [];
    }

    const searchTerms = query.toLowerCase().split(' ').filter(t => t.length > 0);

    const filtered = animalData.filter(animal => {
      const searchableText = [
        animal.title,
        animal.breed,
        animal.animalType,
        animal.location,
        animal.sellerName
      ].join(' ').toLowerCase();

      return searchTerms.every(term => searchableText.includes(term));
    });

    // Sort by relevance (exact matches first)
    filtered.sort((a, b) => {
      const aExact = a.title.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
      const bExact = b.title.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
      return bExact - aExact;
    });

    setFilteredAnimals(filtered);
    return filtered;
  }, [animalData]);

  // Perform API search (comprehensive, searches database)
  const performApiSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setFilteredAnimals([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await listingsService.searchListings(query, { limit: 50 });
      if (response.success && response.data) {
        const transformedResults = response.data.map(transformListing);
        setFilteredAnimals(transformedResults);
        setSearchMode('api');
      }
    } catch (error) {
      console.error('API search error:', error);
      // Fallback to local search
      performLocalSearch(query);
    } finally {
      setIsSearching(false);
    }
  }, [transformListing, performLocalSearch]);

  // Real-time search effect (debounced)
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      // First do local search for instant results
      const localResults = performLocalSearch(debouncedSearchQuery);

      // If local results are few, also search API for more comprehensive results
      if (localResults.length < 5 && debouncedSearchQuery.length >= 2) {
        performApiSearch(debouncedSearchQuery);
      }
    } else {
      setFilteredAnimals([]);
      setSearchMode('local');
    }
  }, [debouncedSearchQuery, performLocalSearch, performApiSearch]);

  // Handle form submit (explicit search)
  const handleSearch = useCallback((e) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery.trim());
      setShowSuggestions(false);
      performApiSearch(searchQuery);
    }
  }, [searchQuery, saveRecentSearch, performApiSearch]);

  // Handle input change
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(true);

    if (value.trim() === '') {
      setFilteredAnimals([]);
      setSearchMode('local');
    }
  }, []);

  // Handle quick search tag click
  const handleQuickSearch = useCallback((query) => {
    setSearchQuery(query);
    saveRecentSearch(query);
    setShowSuggestions(false);
    performApiSearch(query);
  }, [saveRecentSearch, performApiSearch]);

  // Handle recent search click
  const handleRecentSearchClick = useCallback((query) => {
    setSearchQuery(query);
    setShowSuggestions(false);
    performApiSearch(query);
  }, [performApiSearch]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setFilteredAnimals([]);
    setSearchMode('local');
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  }, []);

  // Handle category click from CircleBar
  const handleCategoryClick = useCallback((category, apiEndpoint) => {
    // Toggle category - if same category is clicked, deselect it
    if (selectedCategory === category) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
      // Clear any active search when selecting a category
      if (searchQuery) {
        setSearchQuery('');
        setFilteredAnimals([]);
      }
    }
  }, [selectedCategory, searchQuery]);

  // Clear category filter
  const clearCategoryFilter = useCallback(() => {
    setSelectedCategory(null);
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get search suggestions based on current input
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];

    const query = searchQuery.toLowerCase();
    const suggestions = [];

    // Add matching animal types
    quickSearchTags.forEach(tag => {
      if (tag.query.includes(query) && !suggestions.includes(tag.query)) {
        suggestions.push(tag.query);
      }
    });

    // Add matching breeds from existing data
    animalData.forEach(animal => {
      const breed = animal.breed.toLowerCase();
      if (breed.includes(query) && !suggestions.includes(breed)) {
        suggestions.push(breed);
      }
    });

    // Add matching locations
    animalData.forEach(animal => {
      const location = animal.location.split(' (')[0].toLowerCase();
      if (location.includes(query) && !suggestions.includes(location)) {
        suggestions.push(location);
      }
    });

    return suggestions.slice(0, 5);
  }, [searchQuery, quickSearchTags, animalData]);

  // Filter animals by selected category
  const categoryFilteredAnimals = useMemo(() => {
    if (!selectedCategory) return animalData;

    return animalData.filter(animal => {
      const animalType = animal.animalType?.toLowerCase();
      const category = selectedCategory.toLowerCase();

      // Match category to animal type
      if (category === 'cow' || category === 'bull') {
        return animalType === 'cow' || animalType === 'bull' || animalType === 'animal';
      }
      return animalType === category || animalType?.includes(category);
    });
  }, [animalData, selectedCategory]);

  const displayAnimals = filteredAnimals.length > 0 || searchQuery.trim() ? filteredAnimals : categoryFilteredAnimals;
  const isShowingSearchResults = searchQuery.trim() && filteredAnimals.length > 0;
  const isShowingCategoryResults = selectedCategory && !searchQuery.trim();

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

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-white via-[#F0F8FF] to-[#E9F0F8] py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Side - Banner Image */}
            <div className="order-1 lg:order-1">
              <div className="relative">
                {/* Main Banner Image */}
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <img 
                    src="/src/assets/images/farmer_fixed_1920x1400.png" 
                    alt={t('home.heroTitle') + ' ' + t('home.heroTitleHighlight')} 
                    className="w-full h-auto object-contain"
                  />
                  {/* Overlay gradient for better text visibility if needed */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none"></div>
                </div>
              </div>
            </div>

            {/* Right Side - Text Content and Search */}
            <div className="order-2 lg:order-2 space-y-6">
              {/* Heading */}
              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#000600] leading-tight">
                  {t('home.heroTitle')}<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#15BB73] to-[#0FA568]">{t('home.heroTitleHighlight')}</span>
                </h1>
                <p className="text-base sm:text-lg text-gray-600 max-w-xl">
                  {t('home.heroDescription')}
                </p>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 px-4 bg-gradient-to-r from-[#15BB73]/5 to-[#0FA568]/5 rounded-xl border border-[#15BB73]/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#15BB73] to-[#0FA568] rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-[#000600]">{t('home.farmersCount')}</div>
                    <div className="text-xs text-gray-600">{t('home.farmers')}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#15BB73] to-[#0FA568] rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-[#000600]">{t('home.verified')}</div>
                    <div className="text-xs text-gray-600">{t('home.sellers')}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#15BB73] to-[#0FA568] rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-[#000600]">{t('home.secure')}</div>
                    <div className="text-xs text-gray-600">{t('home.chatAndDeals')}</div>
                  </div>
                </div>
              </div>

              {/* Buy and Sell Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/sell-animal"
                  className="flex-1 group relative overflow-hidden bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white px-6 py-3 rounded-lg font-semibold text-sm sm:text-base shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <div className="relative z-10 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>{t('header.sell')}</span>
                  </div>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                </Link>

                <button
                  onClick={() => {
                    // Scroll to animal listings section
                    const listingsSection = document.querySelector('#animal-listings');
                    if (listingsSection) {
                      listingsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="flex-1 group relative overflow-hidden bg-white text-[#15BB73] border-2 border-[#15BB73] px-6 py-3 rounded-lg font-semibold text-sm sm:text-base shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 hover:bg-[#15BB73] hover:text-white"
                >
                  <div className="relative z-10 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span>{t('home.buyAnimals')}</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Feature Cards Section */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* AI Assistant Card */}
            <button
              onClick={() => {
                // Trigger the AI Assistant floating widget to open
                const aiButton = document.querySelector('button[class*="fixed bottom"]');
                if (aiButton) {
                  aiButton.click();
                  // Smooth scroll to show the button area
                  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                }
              }}
              className="group relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2 hover:scale-105 cursor-pointer"
            >
              <div className="relative h-56 overflow-hidden">
                <img
                  src="/src/assets/images/AI Assistant.png"
                  alt="AI Assistant"
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 via-blue-900/30 to-transparent"></div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white drop-shadow-lg">{t('home.aiAssistant')}</h3>
                    <p className="text-xs text-white/80 mt-1">{t('home.aiAssistantDesc')}</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-300">
                    <svg className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>

            {/* Veterinarian Card */}
            <Link
              to="/veterinarian"
              className="group relative bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2 hover:scale-105"
            >
              <div className="relative h-56 overflow-hidden">
                <img
                  src="/src/assets/images/veternarian.png"
                  alt="Veterinarian"
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-green-900/60 via-green-900/30 to-transparent"></div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white drop-shadow-lg">{t('home.veterinarian')}</h3>
                    <p className="text-xs text-white/80 mt-1">{t('home.veterinarianDesc')}</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-300">
                    <svg className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>

            {/* AI Health Card */}
            <Link
              to="/ai-health-check"
              className="group relative bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2 hover:scale-105"
            >
              <div className="relative h-56 overflow-hidden">
                <img
                  src="/src/assets/images/AI health.png"
                  alt="AI Health Check"
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/60 via-purple-900/30 to-transparent"></div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white drop-shadow-lg">{t('home.aiHealth')}</h3>
                    <p className="text-xs text-white/80 mt-1">{t('home.aiHealthDesc')}</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-300">
                    <svg className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>

            {/* Pregnancy Calendar Card */}
            <Link
              to="/pregnancy-calendar"
              className="group relative bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2 hover:scale-105"
            >
              <div className="relative h-56 overflow-hidden">
                <img
                  src="/src/assets/images/pregnancy calender.png"
                  alt="Pregnancy Calendar"
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-pink-900/60 via-pink-900/30 to-transparent"></div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white drop-shadow-lg">{t('home.pregnancyCalendar')}</h3>
                    <p className="text-xs text-white/80 mt-1">{t('home.pregnancyCalendarDesc')}</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-300">
                    <svg className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Animal Listings Preview Section */}
          <div className="mt-16">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#000600]">
                {t('home.allAvailableAnimals')}
              </h2>
              <Link
                to="/buy-animals"
                className="flex items-center gap-2 bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold text-sm sm:text-base hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <span>{t('home.viewAll')}</span>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Animal Cards Grid - First 4 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {animalData.slice(0, 4).map((animal) => (
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
                  sellerId={animal.sellerId}
                  phoneNumber={animal.phoneNumber}
                  breed={animal.breed}
                  animalType={animal.animalType}
                  milkProduction={animal.milkProduction}
                  isInWishlist={isInWishlist(animal.id)}
                  onToggleWishlist={handleToggleWishlist}
                />
              ))}
            </div>

            {/* Show message if no animals available */}
            {animalData.length === 0 && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">{t('home.noAnimalsAvailable')}</h3>
                <p className="text-gray-500">{t('home.checkBackLater')}</p>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* App Download Banner - Full Width with Padding */}
      <section className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] my-16 bg-gradient-to-r from-[#F0F8FF] to-[#E9F0F8] px-4 sm:px-6 md:px-8 lg:px-12 py-8">
        <a 
          href="#" 
          className="block rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
        >
          <img 
            src="/src/assets/images/playstore.png" 
            alt={t('home.downloadApp')} 
            className="w-full h-auto object-cover"
          />
        </a>
      </section>

      {/* Main Content */}
      <main className={`flex-1 p-4 pb-20 transition-all duration-300 ${isScrolled ? 'pt-16 sm:pt-20' : ''}`}>

        <div className="max-w-7xl mx-auto">
          {/* Search Results Header */}
          {isShowingSearchResults && (
            <div className="mb-6 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-[#000600]">
                      {t('home.searchResultsFor')} "{searchQuery}"
                    </h3>
                    {searchMode === 'api' && (
                      <span className="px-2 py-0.5 bg-[#15BB73]/10 text-[#15BB73] text-xs font-medium rounded-full">
                        {t('home.databaseSearch')}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm">
                    Found {filteredAnimals.length} animal{filteredAnimals.length !== 1 ? 's' : ''} matching your search
                    {isSearching && <span className="ml-2 text-[#15BB73]">• {t('home.searchingMore')}</span>}
                  </p>
                </div>
                <button
                  onClick={clearSearch}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-[#15BB73] hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* {t('home.categoryFilter')} Header */}
          {isShowingCategoryResults && (
            <div className="mb-6 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-[#000600]">
                      {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}s
                    </h3>
                    <span className="px-2 py-0.5 bg-[#15BB73]/10 text-[#15BB73] text-xs font-medium rounded-full">
                      {t('home.categoryFilter')}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Found {categoryFilteredAnimals.length} {selectedCategory}{categoryFilteredAnimals.length !== 1 ? 's' : ''} available
                  </p>
                </div>
                <button
                  onClick={clearCategoryFilter}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-[#15BB73] hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {t('home.clearFilter')}
                </button>
              </div>
            </div>
          )}

          {/* Listings - Only show when searching or category filtering */}
          {(isShowingSearchResults || isShowingCategoryResults) && (
            <div id="animal-listings" className="mb-8 scroll-mt-20">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-[#000600]">
                  {isShowingSearchResults
                    ? t('home.searchResults')
                    : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}s`}
                </h3>
              </div>

              {loading || (isSearching && filteredAnimals.length === 0) ? (
                <div className="flex justify-center items-center py-12">
                  <CowLoader message={isSearching ? t('home.searching', { query: searchQuery }) : t('home.findingAnimals')} size="medium" />
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
                      sellerId={animal.sellerId}
                      phoneNumber={animal.phoneNumber}
                      breed={animal.breed}
                      animalType={animal.animalType}
                      milkProduction={animal.milkProduction}
                      isInWishlist={isInWishlist(animal.id)}
                      onToggleWishlist={handleToggleWishlist}
                    />
                  ))}
                </div>
              ) : searchQuery.trim() ? (
                <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-gray-600 mb-2">No results for "{searchQuery}"</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  {t('home.noResultsDescription')}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={clearSearch}
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                  >
                    {t('home.clearSearch')}
                  </button>
                  <div className="flex flex-wrap justify-center gap-2">
                    {quickSearchTags.slice(0, 4).map((tag) => (
                      <button
                        key={tag.query}
                        onClick={() => handleQuickSearch(tag.query)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white rounded-xl font-medium hover:shadow-lg transition-all"
                      >
                        <span>{tag.icon}</span>
                        {tag.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : isShowingCategoryResults ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
                <div className="text-6xl mb-4">
                  {selectedCategory === 'cow' ? '🐄' :
                   selectedCategory === 'buffalo' ? '🐃' :
                   selectedCategory === 'bull' ? '🐂' :
                   selectedCategory === 'goat' ? '🐐' :
                   selectedCategory === 'horse' ? '🐴' :
                   selectedCategory === 'dog' ? '🐕' :
                   selectedCategory === 'cat' ? '🐱' : '🐾'}
                </div>
                <h3 className="text-2xl font-bold text-gray-600 mb-2">
                  No {selectedCategory}s found in your area
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  There are no {selectedCategory}s available{distanceMode === 'nearby' ? ' within 100 km' : ''}. Try browsing all categories or list your own.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={clearCategoryFilter}
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                  >
                    {t('home.viewAllAnimals')}
                  </button>
                  <Link
                    to="/sell-animal"
                    className="px-6 py-3 bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    List Your {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🐄</div>
                <h3 className="text-2xl font-bold text-gray-600 mb-2">{t('home.noAnimalsFound')}</h3>
                <p className="text-gray-500 mb-6">
                  {t('home.beFirstToList')}
                </p>
                <Link
                  to="/sell-animal"
                  className="inline-block bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                >
                  {t('home.listYourAnimal')}
                </Link>
              </div>
            )}
            </div>
          )}
        </div>
      </main>

    </div>
  );
};

export default HomePage;
