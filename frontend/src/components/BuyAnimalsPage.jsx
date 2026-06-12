import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import CircleBar from './CircleBar';
import AnimalCard from './AnimalCard';
import DistanceToggle from './DistanceToggle';
import AppLoader from './AppLoader';
import { listingsService, userService } from '../services/api';
import { useWishlist } from '../contexts/useWishlist';
import cowCategoryImage from '../assets/images/cow1.png';
import buffaloCategoryImage from '../assets/images/buffelo1.png';
import goatCategoryImage from '../assets/images/goat1.png';
import bullCategoryImage from '../assets/images/bull1.png';
import horseCategoryImage from '../assets/images/horse1.png';
import dogCategoryImage from '../assets/images/Dog1.png';
import catCategoryImage from '../assets/images/cat1.png';

const BuyAnimalsPage = () => {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { t } = useTranslation();
  const [animalData, setAnimalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locationResolved, setLocationResolved] = useState(false);
  const [distanceMode, setDistanceMode] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBreed, setSelectedBreed] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [isSearchSticky, setIsSearchSticky] = useState(false);
  const [shouldScrollToListings, setShouldScrollToListings] = useState(false);
  const searchBarRef = useRef(null);
  const listingsSectionRef = useRef(null);

  const locationLabel = useMemo(() => {
    if (userLocation?.city && userLocation?.state && userLocation?.postalCode) {
      return `${userLocation.city}, ${userLocation.state}, ${userLocation.postalCode}`;
    }

    if (userLocation?.city && userLocation?.state) {
      return `${userLocation.city}, ${userLocation.state}`;
    }

    if (userLocation?.postalCode) {
      return userLocation.postalCode;
    }

    return t('buyPage.pageSubtitle');
  }, [t, userLocation]);

  const scrollToListings = useCallback(() => {
    setShouldScrollToListings(true);
  }, []);

  useEffect(() => {
    if (!shouldScrollToListings) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      listingsSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      setShouldScrollToListings(false);
    }, 120);

    return () => window.clearTimeout(timer);
  }, [shouldScrollToListings, selectedCategory, distanceMode, selectedBreed, minPrice, maxPrice, searchQuery]);

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

  const getCategoryLabel = useCallback(
    (category) => {
      if (!category) return '';
      const categoryKeyMap = {
        cow: 'cows',
        buffalo: 'buffalo',
        goat: 'goats',
        bull: 'bulls',
        horse: 'horses',
        dog: 'dogs',
        cat: 'cats',
        other: 'otherAnimals'
      };

      const translationKey = categoryKeyMap[category] || category;

      return t(`buyPage.${translationKey}`, {
        defaultValue: category.charAt(0).toUpperCase() + category.slice(1)
      });
    },
    [t]
  );

  const matchesSelectedCategory = useCallback((animal, category) => {
    if (!category) return true;

    const animalType = animal.animalType?.toLowerCase();
    const normalizedCategory = category.toLowerCase();

    if (normalizedCategory === 'cow' || normalizedCategory === 'bull') {
      return animalType === 'cow' || animalType === 'bull' || animalType === 'animal';
    }

    if (normalizedCategory === 'other') {
      return !['cow', 'bull', 'buffalo', 'goat', 'horse', 'dog', 'cat'].includes(animalType);
    }

    return animalType === normalizedCategory || animalType?.includes(normalizedCategory);
  }, []);

  const formatPriceValue = useCallback(
    (value) => new Intl.NumberFormat('en-IN').format(Number(value) || 0),
    []
  );

  const getPriceFilterLabel = useCallback(() => {
    if (minPrice && maxPrice) {
      return t('buyPage.priceFilterRange', {
        min: formatPriceValue(minPrice),
        max: formatPriceValue(maxPrice)
      });
    }

    if (minPrice) {
      return t('buyPage.priceFilterMin', {
        min: formatPriceValue(minPrice)
      });
    }

    if (maxPrice) {
      return t('buyPage.priceFilterMax', {
        max: formatPriceValue(maxPrice)
      });
    }

    return '';
  }, [formatPriceValue, maxPrice, minPrice, t]);

  const categoryItems = useMemo(
    () => [
      {
        key: 'cow',
        label: t('buyPage.cows'),
        helper: t('buyPage.browseCows'),
        image: cowCategoryImage,
      },
      {
        key: 'buffalo',
        label: t('buyPage.buffalo'),
        helper: t('buyPage.browseBuffalo'),
        image: buffaloCategoryImage,
      },
      {
        key: 'goat',
        label: t('buyPage.goats'),
        helper: t('buyPage.browseGoats'),
        image: goatCategoryImage,
      },
      {
        key: 'bull',
        label: t('buyPage.bulls'),
        helper: t('buyPage.browseBulls'),
        image: bullCategoryImage,
      },
      {
        key: 'horse',
        label: t('buyPage.horses'),
        helper: t('buyPage.browseHorses'),
        image: horseCategoryImage,
      },
      {
        key: 'dog',
        label: t('buyPage.dogs'),
        helper: t('buyPage.browseDogs'),
        image: dogCategoryImage,
      },
      {
        key: 'cat',
        label: t('buyPage.cats'),
        helper: t('buyPage.browseCats'),
        image: catCategoryImage,
      },
      {
        key: 'other',
        label: t('buyPage.otherAnimals'),
        helper: t('buyPage.browseAll'),
        image: null,
      },
    ],
    [t]
  );

  const clearAllFilters = useCallback(() => {
    setSelectedCategory(null);
    setSearchQuery('');
    setSelectedBreed('');
    setMinPrice('');
    setMaxPrice('');
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

  // Fetch listings based on distance mode
  useEffect(() => {
    if (!locationResolved) {
      return;
    }

    const fetchListings = async () => {
      setLoading(true);
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

        // Transform listings data - same as HomePage
        const transformedListings = listings.map(listing => ({
          id: `${listing.animal_type}-${listing.id}`,
          listingId: listing.id,
          title: `${listing.breed_name || 'Unknown Breed'} | ${listing.animal_type.charAt(0).toUpperCase() + listing.animal_type.slice(1)}`,
          price: listing.expected_price ? Number(listing.expected_price).toLocaleString('en-IN') : '0',
          priceValue: Number(listing.expected_price) || 0,
          location: listing.city || 'Unknown',
          datePosted: formatTimeAgo(listing.created_at),
          imageSrc: listing.front_photo || listing.side_photo || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect fill="%23f0f0f0" width="300" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="16" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E',
          sellerName: listing.seller?.name || 'Unknown Seller',
          sellerId: listing.seller?.id,
          phoneNumber: listing.seller?.phone || '',
          breed: listing.breed_name || 'Unknown',
          animalType: listing.animal_type.charAt(0).toUpperCase() + listing.animal_type.slice(1),
          milkProduction: listing.milk_capacity ? `${listing.milk_capacity}L` : 'N/A',
          distance: listing.distance,
          latitude: listing.latitude,
          longitude: listing.longitude,
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
  }, [distanceMode, userLocation, formatTimeAgo, locationResolved]);

  const animalsForSelectedCategory = useMemo(() => {
    if (!selectedCategory) return [];
    return animalData.filter((animal) => matchesSelectedCategory(animal, selectedCategory));
  }, [animalData, matchesSelectedCategory, selectedCategory]);

  const availableBreeds = useMemo(() => {
    if (!selectedCategory) return [];

    const uniqueBreeds = new Map();

    animalsForSelectedCategory.forEach((animal) => {
      const breed = animal.breed?.trim();
      if (!breed) return;

      const normalizedBreed = breed.toLowerCase();
      if (!uniqueBreeds.has(normalizedBreed)) {
        uniqueBreeds.set(normalizedBreed, breed);
      }
    });

    return Array.from(uniqueBreeds.values()).sort((a, b) => a.localeCompare(b));
  }, [animalsForSelectedCategory, selectedCategory]);

  // Filter animals by category, breed, price, and search query
  const filteredAnimals = useMemo(() => {
    let filtered = animalData;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((animal) => matchesSelectedCategory(animal, selectedCategory));
    }

    if (selectedBreed) {
      filtered = filtered.filter(
        (animal) => animal.breed?.toLowerCase() === selectedBreed.toLowerCase()
      );
    }

    if (minPrice) {
      filtered = filtered.filter((animal) => animal.priceValue >= Number(minPrice));
    }

    if (maxPrice) {
      filtered = filtered.filter((animal) => animal.priceValue <= Number(maxPrice));
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
  }, [animalData, matchesSelectedCategory, maxPrice, minPrice, searchQuery, selectedBreed, selectedCategory]);

  const handleCategoryClick = (category) => {
    setSelectedBreed('');
    setMinPrice('');
    setMaxPrice('');
    setSelectedCategory(category);
    scrollToListings();
  };

  const clearCategoryFilter = () => {
    setSelectedBreed('');
    setMinPrice('');
    setMaxPrice('');
    setSelectedCategory(null);
    scrollToListings();
  };

  const handleDistanceModeChange = (mode) => {
    setDistanceMode(mode);
    scrollToListings();
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
                  placeholder={t('buyPage.searchPlaceholder')}
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
                {filteredAnimals.length} {filteredAnimals.length === 1 ? t('buyPage.result') : t('buyPage.results')}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section ref={searchBarRef} className="mb-8 overflow-hidden rounded-[2rem] border border-cyan-100 bg-white/75 shadow-[0_24px_70px_rgba(15,23,42,0.07)] backdrop-blur-sm">
          <div className="border-b border-cyan-100/80 px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-w-0 items-center gap-3 text-sm text-slate-600">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8fff5] text-[#15BB73] shadow-sm">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-700">{locationLabel}</p>
                  <p className="text-xs text-slate-500">{t('buyPage.pageSubtitle')}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center xl:justify-end">
                <div className="flex items-center justify-between gap-3 rounded-full bg-slate-50 px-4 py-2 text-sm text-slate-600 shadow-inner">
                  <span className="font-medium">{t('buyPage.nearby')}</span>
                  <button
                    type="button"
                    onClick={() => handleDistanceModeChange(distanceMode === 'nearby' ? 'all' : 'nearby')}
                    className={`relative h-7 w-14 rounded-full transition-colors duration-300 ${
                      distanceMode === 'nearby' ? 'bg-[#15BB73]' : 'bg-slate-300'
                    }`}
                    aria-pressed={distanceMode === 'nearby'}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                        distanceMode === 'nearby' ? 'translate-x-8' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="relative min-w-0 sm:w-72">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder={t('buyPage.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-full border border-slate-200 bg-white px-10 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-[#15BB73] focus:ring-2 focus:ring-[#15BB73]/20"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition hover:text-slate-600"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-4 sm:px-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-[#000600] sm:text-3xl">{t('buyPage.browseByCategory')}</h1>
                <p className="mt-1 text-sm text-slate-500">{t('buyPage.browseCategorySubtitle')}</p>
              </div>
              <span className="hidden rounded-full bg-[#eefcf5] px-4 py-2 text-sm font-medium text-[#0f8b54] sm:inline-flex">
                {filteredAnimals.length} {filteredAnimals.length === 1 ? t('buyPage.result') : t('buyPage.results')}
              </span>
            </div>

            <div className="hide-scrollbar -mx-1 overflow-x-auto pb-1">
              <div className="flex min-w-max gap-2 px-1 sm:gap-3">
                {categoryItems.map((category) => {
                  const isSelected = selectedCategory === category.key;

                  return (
                    <button
                      key={category.key}
                      type="button"
                      onClick={() => handleCategoryClick(category.key)}
                      className={`group flex h-[84px] w-[96px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-[1rem] border px-2 py-2.5 text-center transition-all duration-300 sm:h-[96px] sm:w-[112px] ${
                        isSelected
                          ? 'border-[#15BB73] bg-[#e9fff5] shadow-[0_14px_30px_rgba(21,187,115,0.18)]'
                          : 'border-cyan-100 bg-[linear-gradient(135deg,#ecffff_0%,#f9fffd_100%)] shadow-sm hover:-translate-y-0.5 hover:shadow-md'
                      }`}
                    >
                      <div className={`relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[0.8rem] sm:h-12 sm:w-12 ${
                        category.image ? 'bg-white/80 shadow-sm' : 'bg-slate-100'
                      }`}>
                        {category.image ? (
                          <img
                            src={category.image}
                            alt={category.label}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <svg className="h-5 w-5 text-slate-400 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 5v14m7-7H5" />
                          </svg>
                        )}
                      </div>

                      <div className="w-full min-w-0">
                        <p className={`truncate text-xs font-bold leading-tight sm:text-sm ${isSelected ? 'text-[#0f8b54]' : 'text-[#125f66]'}`}>
                          {category.label}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {selectedCategory && (
          <section className="mb-8 overflow-hidden rounded-[1.75rem] border border-emerald-100 bg-white shadow-[0_18px_50px_rgba(21,187,115,0.08)]">
            <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-cyan-50 px-5 py-5 sm:px-7">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700/80">
                    {t('buyPage.refineSelectionKicker')}
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-[#0f2f23]">
                    {t('buyPage.refineSelectionTitle', { category: getCategoryLabel(selectedCategory) })}
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm text-gray-600">
                    {t('buyPage.refineSelectionSubtitle')}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/90 px-4 py-3 text-sm text-gray-600 shadow-sm ring-1 ring-emerald-100">
                  <span className="font-semibold text-[#0f2f23]">{animalsForSelectedCategory.length}</span>{' '}
                  {animalsForSelectedCategory.length === 1 ? t('buyPage.result') : t('buyPage.results')}
                </div>
              </div>
            </div>

            <div className="grid gap-4 px-5 py-5 sm:px-7 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.8fr)_minmax(0,0.8fr)]">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  {t('buyPage.breedNameFilter')}
                </label>
                <select
                  value={selectedBreed}
                  onChange={(e) => setSelectedBreed(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm transition-all duration-200 hover:border-emerald-200 hover:shadow-md focus:border-[#15BB73] focus:ring-2 focus:ring-[#15BB73]"
                >
                  <option value="">{t('buyPage.selectBreed')}</option>
                  {availableBreeds.map((breed) => (
                    <option key={breed} value={breed}>
                      {breed}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  {t('buyPage.minPrice')}
                </label>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  placeholder={t('buyPage.minPrice')}
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm transition-all duration-200 hover:border-emerald-200 hover:shadow-md focus:border-[#15BB73] focus:ring-2 focus:ring-[#15BB73]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  {t('buyPage.maxPrice')}
                </label>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  placeholder={t('buyPage.maxPrice')}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm transition-all duration-200 hover:border-emerald-200 hover:shadow-md focus:border-[#15BB73] focus:ring-2 focus:ring-[#15BB73]"
                />
              </div>
            </div>
          </section>
        )}

        {/* Active Filters */}
        {(selectedCategory || searchQuery || selectedBreed || minPrice || maxPrice) && (
          <div className="mb-6 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-gray-700">{t('buyPage.activeFilters')}</span>
              
              {selectedCategory && (
                <button
                  onClick={clearCategoryFilter}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#15BB73]/10 text-[#15BB73] rounded-lg text-sm font-medium hover:bg-[#15BB73]/20 transition-colors"
                >
                  <span>{getCategoryLabel(selectedCategory)}</span>
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
                  <span>{t('buyPage.searchFilter', { query: searchQuery })}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {selectedBreed && (
                <button
                  onClick={() => setSelectedBreed('')}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100"
                >
                  <span>{t('buyPage.breedFilterChip', { breed: selectedBreed })}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {(minPrice || maxPrice) && (
                <button
                  onClick={() => {
                    setMinPrice('');
                    setMaxPrice('');
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-100"
                >
                  <span>{getPriceFilterLabel()}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              <button
                onClick={clearAllFilters}
                className="ml-auto text-sm text-gray-600 hover:text-[#15BB73] font-medium transition-colors"
              >
                {t('buyPage.clearAll')}
              </button>
            </div>
            
            <div className="mt-2 text-sm text-gray-600">
              {filteredAnimals.length === 1
                ? t('buyPage.showingResults', { count: filteredAnimals.length })
                : t('buyPage.showingResultsPlural', { count: filteredAnimals.length })}
            </div>
          </div>
        )}

        {/* Listings */}
        <div id="animal-listings" ref={listingsSectionRef} className="mb-8 scroll-mt-28">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
            <div>
              <h3 className="text-2xl font-bold text-[#000600]">
                {selectedCategory
                  ? getCategoryLabel(selectedCategory)
                  : searchQuery
                    ? t('buyPage.searchResults')
                    : selectedBreed
                      ? t('buyPage.breedResults', { breed: selectedBreed })
                    : distanceMode === 'nearby'
                      ? t('home.nearbyAnimals')
                      : t('home.allAvailableAnimals')}
              </h3>
              {distanceMode === 'nearby' && !selectedCategory && !searchQuery && (
                <p className="text-sm text-gray-600 mt-1">{t('buyPage.within100km')}</p>
              )}
            </div>
            {userLocation && distanceMode === 'nearby' && (
              <span className="text-sm text-gray-500 flex items-center">
                <svg className="w-4 h-4 mr-1 text-[#15BB73]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t('buyPage.sortedByDistance')}
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <AppLoader message={t('home.findingAnimals')} size="medium" />
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
            <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-700 mb-2">{t('buyPage.noAnimalsFound')}</h3>
              <p className="text-gray-500 mb-6">
                {searchQuery
                  ? t('buyPage.noSearchResults', { query: searchQuery })
                  : selectedBreed
                    ? t('buyPage.noBreedResults', { breed: selectedBreed })
                  : selectedCategory
                    ? t('buyPage.noCategoryResults', { category: getCategoryLabel(selectedCategory) })
                    : t('buyPage.checkBackLater')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {(selectedCategory || searchQuery || selectedBreed || minPrice || maxPrice) && (
                  <button
                    onClick={clearAllFilters}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {t('buyPage.clearFiltersAndViewAll')}
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
