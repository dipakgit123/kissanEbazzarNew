import { getAnimalGroup, allowedSpecies } from '../utils/animalExperience';
import { useExperienceText } from './AnimalExperience';
import Link from './ExperienceLink';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import AnimalCard from './AnimalCard';
import AppLoader from './AppLoader';
import GovernmentSchemesBanner from './GovernmentSchemesBanner';
import { listingsService, userService } from '../services/api';
import { useWishlist } from '../contexts/useWishlist';
import { safeJsonParse } from '../utils/stringUtils';
import { API_BASE_URL } from '../config/api';
import milkReportImage from '../assets/images/milk_report.jpeg';
import farmerHeroImage from '../assets/images/farmer_fixed_1920x1400.png';
import veterinarianFeatureImage from '../assets/images/veternarian.png';
import aiHealthFeatureImage from '../assets/images/AI health.png';
import pregnancyCalendarFeatureImage from '../assets/images/pregnancy calender.png';
import petMatingFeatureImage from '../assets/images/mating_feature.png';
import petHomeHeroImage from '../assets/images/pet-features/home-hero.jpg';
import petVeterinarianImage from '../assets/images/pet-features/veterinarian.jpg';
import petAiHealthImage from '../assets/images/pet-features/ai-health.jpg';
import petPregnancyImage from '../assets/images/pet-features/pregnancy.jpg';
import playStoreBannerImage from '../assets/images/playstore.png';
import './HomePage.css';



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

const HomePage = () => {
  const { t } = useTranslation();
  const experienceText = useExperienceText();
  const pet = getAnimalGroup() === 'pet';
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAnimals, setFilteredAnimals] = useState([]);
  const [animalData, setAnimalData] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [featuredScheme, setFeaturedScheme] = useState(null);
  const [locationResolved, setLocationResolved] = useState(false);
  const distanceMode = 'all';
  const [selectedCategory, setSelectedCategory] = useState(null);
  const isFetchingListingsRef = useRef(false);
  const lastListingsFetchAtRef = useRef(0);

  // Search-related states
  const [isSearching, setIsSearching] = useState(false);
  const [searchMode, setSearchMode] = useState('local'); // 'local' or 'api'

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

  // Save search to recent searches
  const saveRecentSearch = useCallback((query) => {
    if (!query.trim()) return;
    const saved = localStorage.getItem('recentSearches');
    const recentSearches = safeJsonParse(saved, []);
    const searchHistory = Array.isArray(recentSearches) ? recentSearches : [];
    const updated = [query, ...searchHistory.filter((item) => item !== query)].slice(0, 5);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  }, []);

  // Toggle wishlist function
  const handleToggleWishlist = (animalId) => {
    const animal = animalData.find(a => a.id === animalId) || filteredAnimals.find(a => a.id === animalId);
    if (!animal) return;

    return toggleWishlist(animal);
  };

  // Helper function to format time ago - defined before useEffect
  const formatTimeAgo = useCallback((dateString) => {
    if (!dateString) return t('time.recently');

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return t('time.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('time.hoursAgo', { count: diffHours });
    if (diffDays === 1) return t('time.dayAgo');
    if (diffDays < 7) return t('time.daysAgo', { count: diffDays });
    if (diffDays < 30) return t('time.weeksAgo', { count: Math.floor(diffDays / 7) });
    return t('time.monthsAgo', { count: Math.floor(diffDays / 30) });
  }, [t]);

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
                state: profileResponse.user.state,
                postalCode: profileResponse.user.postal_code
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
      } finally {
        setLocationResolved(true);
      }
    };

    fetchUserLocation();
  }, []);

  // Transform listing data helper
  const transformListing = useCallback((listing) => ({
    id: `${listing.animal_type}-${listing.id}`,
    listingId: listing.id,
    title: `${listing.breed_name || 'Unknown Breed'} | ${listing.animal_type?.charAt(0).toUpperCase() + listing.animal_type?.slice(1)}`,
    price: listing.expected_price ? Number(listing.expected_price).toLocaleString('en-IN') : '0',
    location: listing.city || 'Unknown',
    datePosted: formatTimeAgo(listing.created_at),
    imageSrc: listing.front_photo || listing.side_photo || listing.photo_1 || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect fill="%23f0f0f0" width="300" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="16" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E',
    sellerName: listing.seller?.name || 'Unknown Seller',
    sellerId: listing.seller?.id,
    phoneNumber: listing.seller?.phone || '',
    breed: listing.breed_name || 'Unknown',
    animalType: listing.animal_type?.charAt(0).toUpperCase() + listing.animal_type?.slice(1),
    milkProduction: listing.milk_capacity ? `${listing.milk_capacity}L` : 'N/A',
    distance: listing.distance,
    latitude: listing.latitude,
    longitude: listing.longitude,
    status: listing.status,
    sellerPhoto: listing.seller?.profile_photo,
    createdAt: listing.created_at
  }), [formatTimeAgo]);

  const sortAnimalsByLatest = useCallback((listings) => (
    [...listings].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  ), []);

  const fetchListings = useCallback(async ({ showLoader = false } = {}) => {
    if (!locationResolved || isFetchingListingsRef.current) {
      return;
    }

    isFetchingListingsRef.current = true;
    if (showLoader) {
      setLoading(true);
    }

    try {
      let listings = [];

      if (distanceMode === 'all') {
        const response = await listingsService.getFeaturedListings(100, {
          latitude: userLocation?.latitude,
          longitude: userLocation?.longitude,
          postalCode: userLocation?.postalCode
        });
        if (response.success && response.data) {
          listings = response.data;
        }
      } else {
        if (userLocation?.latitude && userLocation?.longitude) {
          const response = await listingsService.getNearbyListings(
            userLocation.latitude,
            userLocation.longitude,
            100,
            50,
            { postalCode: userLocation.postalCode }
          );
          if (response.success && response.data && response.data.length > 0) {
            listings = response.data;
          }
        }

        if (listings.length === 0) {
          const response = await listingsService.getFeaturedListings(50, {
            latitude: userLocation?.latitude,
            longitude: userLocation?.longitude,
            postalCode: userLocation?.postalCode
          });
          if (response.success) {
            listings = response.data;
          }
        }
      }

      setAnimalData(sortAnimalsByLatest(listings.map(transformListing)));
      lastListingsFetchAtRef.current = Date.now();
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      isFetchingListingsRef.current = false;
      setLoading(false);
    }
  }, [distanceMode, locationResolved, sortAnimalsByLatest, transformListing, userLocation]);

  // Fetch latest listings for home page
  useEffect(() => {
    fetchListings({ showLoader: true });
  }, [fetchListings]);

  useEffect(() => {
    const fetchMyListings = async () => {
      if (!localStorage.getItem('token')) {
        setMyListings([]);
        return;
      }

      try {
        const response = await listingsService.getMyListings();
        if (response?.success) {
          setMyListings((response.listings || []).slice(0, 4));
        }
      } catch (error) {
        console.error('Failed to load seller listings:', error);
        setMyListings([]);
      }
    };

    fetchMyListings();
  }, []);

  useEffect(() => {
    const fetchFeaturedScheme = async () => {
      if (pet) return;
      try {
        const featuredResponse = await fetch(`${API_BASE_URL}/api/government-schemes/featured?limit=1`);
        const featuredData = await featuredResponse.json();
        const firstFeaturedScheme = featuredData?.data?.schemes?.[0];

        if (firstFeaturedScheme) {
          setFeaturedScheme(firstFeaturedScheme);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/government-schemes?limit=1`);
        const data = await response.json();
        setFeaturedScheme(data?.data?.schemes?.[0] || null);
      } catch (error) {
        console.error('Failed to load government scheme banner:', error);
      }
    };

    fetchFeaturedScheme();
  }, []);

  // Refresh latest listings when the user comes back to the tab/page
  useEffect(() => {
    const maybeRefreshListings = () => {
      const now = Date.now();
      if (now - lastListingsFetchAtRef.current < 15000) {
        return;
      }

      fetchListings();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        maybeRefreshListings();
      }
    };

    const handleWindowFocus = () => {
      maybeRefreshListings();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [fetchListings]);

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
      const response = await listingsService.searchListings(query, {
        limit: 50,
        latitude: userLocation?.latitude,
        longitude: userLocation?.longitude,
        postalCode: userLocation?.postalCode
      });
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
  }, [transformListing, performLocalSearch, userLocation?.latitude, userLocation?.longitude, userLocation?.postalCode]);

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

  // Handle quick search tag click
  const handleQuickSearch = useCallback((query) => {
    setSearchQuery(query);
    saveRecentSearch(query);
    performApiSearch(query);
  }, [saveRecentSearch, performApiSearch]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setFilteredAnimals([]);
    setSearchMode('local');
  }, []);

  // Clear category filter
  const clearCategoryFilter = useCallback(() => {
    setSelectedCategory(null);
  }, []);

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

  return (
    <div className="home-page site-background min-h-screen flex flex-col">

      {/* Hero Section */}
      <section className="home-overview py-4 sm:py-6 lg:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Content */}
          <div className="home-hero-card grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
            {/* Left Side - Banner Image */}
            <div className="order-1 lg:order-1">
              <div className="relative">
                {/* Main Banner Image */}
                <div className="home-hero-image relative rounded-2xl overflow-hidden">
                  <img
                    src={pet ? petHomeHeroImage : farmerHeroImage}
                    alt={pet ? experienceText.petTitle : t('home.heroTitle') + ' ' + t('home.heroTitleHighlight')}
                    className="w-full h-auto object-contain"
                  />
                  {/* Overlay gradient for better text visibility if needed */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none"></div>
                </div>
              </div>
            </div>

            {/* Right Side - Text Content and Search */}
            <div className="order-2 lg:order-2 space-y-4">
              {/* Heading */}
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-ink leading-tight">
                  {pet ? experienceText.petTitle : t('home.heroTitle')}<br />
                  <span className="text-primary">{!pet && t('home.heroTitleHighlight')}</span>
                </h1>
                <p className="text-sm sm:text-base text-gray-600 max-w-xl">
                  {pet ? experienceText.petHint : t('home.heroDescription')}
                </p>
              </div>

              {/* Trust Indicators */}
              <div className="home-trust grid grid-cols-1 sm:grid-cols-3 gap-3 py-3 px-3 rounded-xl border border-line">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-base font-bold text-ink">{pet ? experienceText.pet : t('home.farmersCount')}</div>
                    <div className="text-xs text-gray-600">{pet ? t('animalTypes.dog') + ' / ' + t('animalTypes.cat') : t('home.farmers')}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-base font-bold text-ink">{t('home.verified')}</div>
                    <div className="text-xs text-gray-600">{t('home.sellers')}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-base font-bold text-ink">{t('home.secure')}</div>
                    <div className="text-xs text-gray-600">{t('home.chatAndDeals')}</div>
                  </div>
                </div>
              </div>

              {/* Buy and Sell Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Link
                  to="/sell-animal"
                  className="action-button action-button-primary flex-1"
                >
                  <div className="relative z-10 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>{t('header.sell')}</span>
                  </div>
                </Link>

                <Link
                  to="/buy-animals"
                  className="action-button action-button-secondary flex-1"
                >
                  <div className="relative z-10 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span>{t('home.buyAnimals')}</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Feature Cards Section */}
          <div className={`home-feature-grid ${pet ? 'home-pet-feature-grid' : ''} mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`}>
            {/* Milk Reports Card */}
            <Link
              to="/milk-reports"
              className="group relative bg-primary rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2 hover:scale-105"
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={milkReportImage}
                  alt="Milk Reports"
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/65 via-teal-900/30 to-transparent"></div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white drop-shadow-lg">{t('home.milkReports')}</h3>
                    <p className="text-xs text-white/80 mt-1">{t('home.milkReportsDesc')}</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-300">
                    <svg className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>

            {/* Veterinarian Card */}
            <Link
              to="/veterinarian"
              className="group relative bg-primary rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2 hover:scale-105"
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={pet ? petVeterinarianImage : veterinarianFeatureImage}
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
              className="group relative bg-purple-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2 hover:scale-105"
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={pet ? petAiHealthImage : aiHealthFeatureImage}
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

            {/* Pet Mating Card */}
            <Link
              to="/pet-mating"
              className="group relative bg-forest rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2 hover:scale-105"
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={petMatingFeatureImage}
                  alt={t('petMating.title', { defaultValue: 'Pet Mating' })}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#082F25]/70 via-forest/30 to-transparent"></div>
              </div>
              <div className="absolute inset-0 p-4 flex flex-col justify-end">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white drop-shadow-lg">{t('petMating.title', { defaultValue: 'Pet Mating' })}</h3>
                    <p className="text-xs text-white/80 mt-1">{t('petMating.homeDesc', { defaultValue: 'Find trusted dog and cat mates' })}</p>
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
              className="group relative bg-pink-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2 hover:scale-105"
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={pet ? petPregnancyImage : pregnancyCalendarFeatureImage}
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

          {/* Government Schemes Banner */}
          {!pet && <GovernmentSchemesBanner featuredScheme={featuredScheme} />}

          {/* Seller Listings Preview */}
          {myListings.length > 0 && (
            <div className="mt-8">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
                    {t('profile.sellerDashboard', { defaultValue: 'Seller dashboard' })}
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-ink sm:text-3xl">
                    {t('profile.myAnimals', { defaultValue: 'My animals' })}
                  </h2>
                </div>
                <Link to="/profile" className="text-sm font-black text-primary hover:text-primary-hover">
                  {t('profile.viewAll', { defaultValue: 'View all' })}
                </Link>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {myListings.map((listing) => {
                  const type = listing.animal_type || listing.type || 'cow';
                  const image = listing.photo1 || listing.front_photo || listing.photos?.[0];
                  const isSold = String(listing.status || '').toLowerCase() === 'sold';

                  return (
                    <Link
                      key={`${type}-${listing.id}`}
                      to={`/seller-listings/${type}/${listing.id}/insights`}
                      className="group overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                    >
                      <div className={`flex items-center gap-2 px-5 py-3 text-sm font-black ${isSold ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-700'}`}>
                        <span className={`flex h-6 w-6 items-center justify-center rounded-full ${isSold ? 'bg-slate-300' : 'bg-emerald-500'} text-white`}>
                          ✓
                        </span>
                        {isSold
                          ? t('profile.animalSoldVisible', { defaultValue: 'Animal is marked as sold' })
                          : t('profile.animalVisibleToBuyers', { defaultValue: 'Animal is visible to buyers' })}
                      </div>
                      <div className="flex gap-5 p-5">
                        <div className="h-28 w-28 flex-none overflow-hidden rounded-2xl bg-slate-100">
                          <img src={image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="160" height="160"%3E%3Crect width="160" height="160" fill="%23EDF5EF"/%3E%3C/svg%3E'} alt={listing.breed || listing.breed_name || 'Animal'} className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xl font-black text-slate-900 line-clamp-1">{listing.breed || listing.breed_name || t('animalTypes.animal')}</p>
                              <p className="mt-1 text-sm font-bold uppercase tracking-wide text-slate-500">{type}</p>
                            </div>
                            <span className="text-2xl text-primary transition-transform group-hover:translate-x-1">›</span>
                          </div>
                          <p className="mt-3 text-2xl font-black text-slate-900">
                            ₹{Number(listing.price || listing.expected_price || 0).toLocaleString('en-IN')}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                            <span className="rounded-full bg-slate-100 px-3 py-1">{listing.views || 0} {t('profile.views', { defaultValue: 'views' })}</span>
                            <span className="rounded-full bg-slate-100 px-3 py-1">{[listing.city, listing.state].filter(Boolean).join(', ') || t('profile.locationNotSpecified')}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Animal Listings Preview Section */}
          <div className="mt-8">
            {/* Section Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-ink">
                {t('home.allAvailableAnimals')}
              </h2>
              <Link
                to="/buy-animals"
                className="action-button action-button-primary shrink-0"
              >
                <span>{t('home.viewAll')}</span>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Animal Cards Grid - First 4 */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <AppLoader message={t('home.findingAnimals')} size="medium" />
              </div>
            ) : animalData.length > 0 ? (
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
                  latitude={animal.latitude}
                  longitude={animal.longitude}
                  distance={animal.distance}
                  userLocation={userLocation}
                  isInWishlist={isInWishlist(animal.id)}
                  onToggleWishlist={handleToggleWishlist}
                />
                ))}
              </div>
            ) : (
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

      {/* App banner follows the same centered width as the home content. */}
      <section className="home-download">
        <a 
          href="#" 
          className="home-download-link"
        >
          <img 
            src={playStoreBannerImage}
            alt={t('home.downloadApp')} 
            width={1920}
            height={700}
            className="home-download-image"
          />
        </a>
      </section>

      {/* Main Content */}
      <section className="home-results w-full max-w-7xl mx-auto px-4 pb-6 sm:px-6 lg:px-8" hidden={!(isShowingSearchResults || isShowingCategoryResults)}>

        <div className="max-w-7xl mx-auto">
          {/* Search Results Header */}
          {isShowingSearchResults && (
            <div className="mb-6 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-ink">
                      {t('home.searchResultsFor')} "{searchQuery}"
                    </h3>
                    {searchMode === 'api' && (
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                        {t('home.databaseSearch')}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm">
                    Found {filteredAnimals.length} animal{filteredAnimals.length !== 1 ? 's' : ''} matching your search
                    {isSearching && <span className="ml-2 text-primary">• {t('home.searchingMore')}</span>}
                  </p>
                </div>
                <button
                  onClick={clearSearch}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
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
                    <h3 className="text-xl font-bold text-ink">
                      {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}s
                    </h3>
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                      {t('home.categoryFilter')}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Found {categoryFilteredAnimals.length} {selectedCategory}{categoryFilteredAnimals.length !== 1 ? 's' : ''} available
                  </p>
                </div>
                <button
                  onClick={clearCategoryFilter}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
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
                <h3 className="text-2xl font-bold text-ink">
                  {isShowingSearchResults
                    ? t('home.searchResults')
                    : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}s`}
                </h3>
              </div>

              {loading || (isSearching && filteredAnimals.length === 0) ? (
                <div className="flex justify-center items-center py-12">
                  <AppLoader message={isSearching ? t('home.searching', { query: searchQuery }) : t('home.findingAnimals')} size="medium" />
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
                      latitude={animal.latitude}
                      longitude={animal.longitude}
                      distance={animal.distance}
                      userLocation={userLocation}
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
                    {quickSearchTags.filter(tag => allowedSpecies(tag.query)).slice(0, 4).map((tag) => (
                      <button
                        key={tag.query}
                        onClick={() => handleQuickSearch(tag.query)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl font-medium hover:shadow-lg transition-all"
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
                    className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:shadow-lg transition-all"
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
                  className="inline-block bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                >
                  {t('home.listYourAnimal')}
                </Link>
              </div>
            )}
            </div>
          )}
        </div>
      </section>

    </div>
  );
};

export default HomePage;
