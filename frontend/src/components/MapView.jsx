import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { listingsService } from '../services/api';
import { FullPageLoader, InlineLoader } from './AppLoader';
import { safeJsonParse } from '../utils/stringUtils';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAXGS_YosP1JmJL1KaLbW4ibs-rblbnUNQ';

const ANIMAL_EMOJIS = {
  cow: '\uD83D\uDC04',
  buffalo: '\uD83D\uDC03',
  goat: '\uD83D\uDC10',
  sheep: '\uD83D\uDC11',
  horse: '\uD83D\uDC34',
  pig: '\uD83D\uDC37',
  bull: '\uD83D\uDC02',
  calf: '\uD83D\uDC2E',
  dog: '\uD83D\uDC15',
  cat: '\uD83D\uDC31',
  animal: '\uD83D\uDC04'
};

const CITY_COORDINATES = {
  pune: { lat: 18.5204, lng: 73.8567 },
  mumbai: { lat: 19.0760, lng: 72.8777 },
  nashik: { lat: 19.9975, lng: 73.7898 },
  kolhapur: { lat: 16.705, lng: 74.2433 },
  satara: { lat: 17.6805, lng: 74.0183 },
  sangli: { lat: 16.8524, lng: 74.5815 },
  solapur: { lat: 17.6599, lng: 75.9064 },
  aurangabad: { lat: 19.8762, lng: 75.3433 },
  nagpur: { lat: 21.1458, lng: 79.0882 },
  thane: { lat: 19.2183, lng: 72.9781 },
  ahmednagar: { lat: 19.0948, lng: 74.748 },
  jalgaon: { lat: 21.0077, lng: 75.5626 },
  akola: { lat: 20.7002, lng: 77.0082 },
  latur: { lat: 18.4088, lng: 76.5604 },
  dhule: { lat: 20.9042, lng: 74.7749 },
  nanded: { lat: 19.1383, lng: 77.321 },
  ratnagiri: { lat: 16.9902, lng: 73.312 },
  shirala: { lat: 16.9833, lng: 74.1333 },
  karad: { lat: 17.2862, lng: 74.1826 },
  default: { lat: 18.5204, lng: 73.8567 }
};

const LoadingComponent = ({ t }) => (
  <div className="w-full h-full">
    <FullPageLoader message={t('mapView.loadingMap')} className="min-h-full" />
  </div>
);

const ErrorComponent = ({ t }) => (
  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#E9F0F8] to-[#F0F8FF]">
    <div className="p-8 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="mb-2 text-lg font-semibold text-gray-800">{t('mapView.mapLoadingErrorTitle')}</h3>
      <p className="text-sm text-gray-600">{t('mapView.mapLoadingErrorBody')}</p>
    </div>
  </div>
);

const getAnimalEmoji = (type) => ANIMAL_EMOJIS[String(type || '').toLowerCase()] || ANIMAL_EMOJIS.animal;

const getMarkerColor = (type) => {
  const colors = {
    cow: '#22C55E',
    buffalo: '#6366F1',
    goat: '#EC4899',
    horse: '#8B5CF6',
    dog: '#14B8A6',
    cat: '#F97316',
    bull: '#F59E0B',
    animal: '#15BB73'
  };
  return colors[String(type || '').toLowerCase()] || '#15BB73';
};

const formatPrice = (price) => {
  if (!price) return '0';
  return Number(price).toLocaleString('en-IN');
};

const getDistanceColor = (distance) => {
  if (distance < 50) return 'text-green-600';
  if (distance < 100) return 'text-yellow-600';
  if (distance < 200) return 'text-orange-600';
  return 'text-red-600';
};

const MapComponent = ({
  animalData,
  onAnimalSelect,
  onMapReady,
  selectedAnimal,
  t,
  userLocation
}) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (mapRef.current && !map && window.google) {
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: userLocation || CITY_COORDINATES.default,
        zoom: 10,
        mapTypeId: 'roadmap',
        mapTypeControl: true,
        mapTypeControlOptions: {
          position: window.google.maps.ControlPosition.TOP_LEFT,
          style: window.google.maps.MapTypeControlStyle.DROPDOWN_MENU
        },
        fullscreenControl: true,
        streetViewControl: false,
        zoomControl: true,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_CENTER
        },
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'poi.business',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      setMap(mapInstance);
      onMapReady?.(mapInstance);
    }
  }, [map, onMapReady, userLocation]);

  useEffect(() => {
    if (map && userLocation && window.google) {
      const userCircle = new window.google.maps.Circle({
        center: userLocation,
        radius: 200,
        fillColor: '#3B82F6',
        fillOpacity: 0.2,
        strokeColor: '#3B82F6',
        strokeOpacity: 0.4,
        strokeWeight: 2,
        map
      });

      const userMarker = new window.google.maps.Marker({
        position: userLocation,
        map,
        title: t('mapView.yourLocationTitle'),
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#3B82F6',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3
        },
        zIndex: 1000
      });

      return () => {
        userMarker.setMap(null);
        userCircle.setMap(null);
      };
    }
  }, [map, t, userLocation]);

  useEffect(() => {
    if (!map || !window.google) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    if (animalData.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();

    if (userLocation) {
      bounds.extend(new window.google.maps.LatLng(userLocation.lat, userLocation.lng));
    }

    animalData.forEach((animal) => {
      const lat = parseFloat(animal.latitude);
      const lng = parseFloat(animal.longitude);

      if (Number.isNaN(lat) || Number.isNaN(lng)) return;

      const position = { lat, lng };
      const emoji = getAnimalEmoji(animal.animalType || animal.animal_type);
      const color = getMarkerColor(animal.animalType || animal.animal_type);
      const isSelected = selectedAnimal?.id === animal.id;

      const marker = new window.google.maps.Marker({
        position,
        map,
        title: animal.breed_name || animal.title || t('mapView.unknownBreed'),
        icon: {
          url: `data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="58" viewBox="0 0 48 58">
              <defs>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.3"/>
                </filter>
              </defs>
              <g filter="url(#shadow)">
                <path d="M24 0C10.745 0 0 10.745 0 24c0 18 24 34 24 34s24-16 24-34C48 10.745 37.255 0 24 0z" fill="${isSelected ? color : '#FFFFFF'}" stroke="${color}" stroke-width="3"/>
              </g>
              <text x="24" y="28" text-anchor="middle" font-size="20">${emoji}</text>
            </svg>
          `)}`,
          scaledSize: new window.google.maps.Size(48, 58),
          anchor: new window.google.maps.Point(24, 58)
        },
        animation: null,
        zIndex: isSelected ? 999 : 1
      });

      marker.addListener('click', () => {
        onAnimalSelect(animal);
        map.panTo(position);
        window.setTimeout(() => {
          if (document.activeElement && typeof document.activeElement.blur === 'function') {
            document.activeElement.blur();
          }
        }, 0);
      });

      markersRef.current.push(marker);
      bounds.extend(position);
    });

    if (markersRef.current.length > 0) {
      map.fitBounds(bounds, { padding: 50 });
      window.google.maps.event.addListenerOnce(map, 'idle', () => {
        if (map.getZoom() > 14) map.setZoom(14);
      });
    }
  }, [animalData, map, onAnimalSelect, selectedAnimal, t, userLocation]);

  useEffect(() => {
    if (!map || markersRef.current.length === 0) return;

    markersRef.current.forEach((marker, index) => {
      const animal = animalData[index];
      const isSelected = selectedAnimal?.id === animal?.id;
      const color = getMarkerColor(animal?.animalType || animal?.animal_type);
      const emoji = getAnimalEmoji(animal?.animalType || animal?.animal_type);

      marker.setIcon({
        url: `data:image/svg+xml,${encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="58" viewBox="0 0 48 58">
            <defs>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.3"/>
              </filter>
            </defs>
            <g filter="url(#shadow)">
              <path d="M24 0C10.745 0 0 10.745 0 24c0 18 24 34 24 34s24-16 24-34C48 10.745 37.255 0 24 0z" fill="${isSelected ? color : '#FFFFFF'}" stroke="${color}" stroke-width="3"/>
            </g>
            <text x="24" y="28" text-anchor="middle" font-size="20">${emoji}</text>
          </svg>
        `)}`,
        scaledSize: new window.google.maps.Size(48, 58),
        anchor: new window.google.maps.Point(24, 58)
      });

      marker.setAnimation(null);
      marker.setZIndex(isSelected ? 999 : 1);

      if (isSelected && animal) {
        const lat = parseFloat(animal.latitude);
        const lng = parseFloat(animal.longitude);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
          map.panTo({ lat, lng });
        }
      }
    });
  }, [animalData, map, selectedAnimal]);

  return <div ref={mapRef} className="h-full w-full" />;
};

const MapView = ({ addToWishlist, removeFromWishlist, isInWishlist }) => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [userLocation, setUserLocation] = useState(null);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [nearestAnimals, setNearestAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const mapInstanceRef = useRef(null);
  const hasAppliedQuerySelectionRef = useRef(false);
  const requestedListingId = searchParams.get('listingId');
  const requestedLatitude = Number(searchParams.get('lat'));
  const requestedLongitude = Number(searchParams.get('lng'));
  const currentUser = safeJsonParse(localStorage.getItem('userData'), null);
  const currentUserId = currentUser?.id ?? currentUser?.user_id ?? null;

  const getAnimalTypeLabel = useCallback((type) => (
    t(`animalTypes.${String(type || '').toLowerCase()}`, {
      defaultValue: type || t('animalTypes.other')
    })
  ), [t]);

  const fetchAnimals = useCallback(async (lat, lng) => {
    try {
      setRefreshing(true);
      let allAnimals = [];

      try {
        const nearbyResponse = await listingsService.getNearbyListings(lat, lng, 500, 100);
        if (nearbyResponse.success && nearbyResponse.data) {
          allAnimals = nearbyResponse.data;
        }
      } catch (err) {
        console.log('Nearby listings not available:', err);
      }

      if (allAnimals.length === 0) {
        try {
          const featuredResponse = await listingsService.getFeaturedListings(100);
          if (featuredResponse.success && featuredResponse.data) {
            allAnimals = featuredResponse.data;
          }
        } catch (err) {
          console.log('Featured listings not available:', err);
        }
      }

      const processedAnimals = allAnimals.map((animal, index) => {
        let animalLat = parseFloat(animal.latitude);
        let animalLng = parseFloat(animal.longitude);

        if (Number.isNaN(animalLat) || Number.isNaN(animalLng)) {
          const city = String(animal.city || '').toLowerCase().trim();
          const cityCoord = CITY_COORDINATES[city] || CITY_COORDINATES.default;
          const offset = 0.01 + (index * 0.005);
          const angle = (index * 137.5) * (Math.PI / 180);
          animalLat = cityCoord.lat + (offset * Math.cos(angle));
          animalLng = cityCoord.lng + (offset * Math.sin(angle));
        }

        let distance = animal.distance;
        if (!distance && lat && lng) {
          const radius = 6371;
          const dLat = ((animalLat - lat) * Math.PI) / 180;
          const dLng = ((animalLng - lng) * Math.PI) / 180;
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat * Math.PI) / 180) *
            Math.cos((animalLat * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          distance = radius * c;
        }

        return {
          ...animal,
          latitude: animalLat,
          longitude: animalLng,
          distance
        };
      });

      const sortedAnimals = processedAnimals.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      setNearestAnimals(sortedAnimals);
      setError(null);
    } catch (err) {
      console.error('Error fetching animals:', err);
      setError(t('mapView.fetchAnimalsFailed'));
      setNearestAnimals([]);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          fetchAnimals(location.lat, location.lng);
        },
        (err) => {
          console.error('Error getting location:', err);
          setUserLocation(CITY_COORDINATES.default);
          fetchAnimals(CITY_COORDINATES.default.lat, CITY_COORDINATES.default.lng);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }

    setUserLocation(CITY_COORDINATES.default);
    fetchAnimals(CITY_COORDINATES.default.lat, CITY_COORDINATES.default.lng);
    return undefined;
  }, [fetchAnimals]);

  const handleRefresh = useCallback(() => {
    if (userLocation) {
      fetchAnimals(userLocation.lat, userLocation.lng);
    }
  }, [fetchAnimals, userLocation]);

  const handleToggleWishlist = useCallback((animal) => {
    if (isInWishlist?.(animal.id)) {
      removeFromWishlist?.(animal.id);
      return;
    }

    addToWishlist?.(animal);
  }, [addToWishlist, isInWishlist, removeFromWishlist]);

  const filteredAnimals = filterType === 'all'
    ? nearestAnimals
    : nearestAnimals.filter((animal) => (animal.animalType || animal.animal_type)?.toLowerCase() === filterType);

  const animalTypes = [...new Set(
    nearestAnimals.map((animal) => (animal.animalType || animal.animal_type)?.toLowerCase())
  )].filter(Boolean);

  const getDistanceMeta = useCallback((animal) => {
    const sellerId = animal?.seller?.id ?? animal?.sellerId ?? null;
    if (currentUserId && sellerId && String(currentUserId) === String(sellerId)) {
      return {
        label: t('animalCard.addedByYou'),
        className: 'text-green-700'
      };
    }

    if (animal?.distance === null || animal?.distance === undefined || Number.isNaN(Number(animal.distance))) {
      return null;
    }

    const normalizedDistance = Number(animal.distance);
    const distanceValue = normalizedDistance < 10
      ? normalizedDistance.toFixed(1)
      : Math.round(normalizedDistance).toString();

    return {
      label: t('animalCard.distanceAway', { distance: distanceValue }),
      className: getDistanceColor(normalizedDistance)
    };
  }, [currentUserId, t]);

  useEffect(() => {
    if (hasAppliedQuerySelectionRef.current || nearestAnimals.length === 0) return;

    let matchedAnimal = null;

    if (requestedListingId) {
      matchedAnimal = nearestAnimals.find((animal) => String(animal.id) === String(requestedListingId));
    }

    if (!matchedAnimal && Number.isFinite(requestedLatitude) && Number.isFinite(requestedLongitude)) {
      matchedAnimal = nearestAnimals.find((animal) => (
        Number(animal.latitude) === requestedLatitude &&
        Number(animal.longitude) === requestedLongitude
      ));
    }

    if (matchedAnimal) {
      setSelectedAnimal(matchedAnimal);
    }

    hasAppliedQuerySelectionRef.current = true;
  }, [nearestAnimals, requestedLatitude, requestedListingId, requestedLongitude]);

  const render = (status) => {
    switch (status) {
      case Status.LOADING:
        return <LoadingComponent t={t} />;
      case Status.FAILURE:
        return <ErrorComponent t={t} />;
      case Status.SUCCESS:
        return (
          <MapComponent
            animalData={filteredAnimals}
            onAnimalSelect={setSelectedAnimal}
            onMapReady={(map) => { mapInstanceRef.current = map; }}
            selectedAnimal={selectedAnimal}
            t={t}
            userLocation={userLocation}
          />
        );
      default:
        return <LoadingComponent t={t} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E9F0F8] to-[#F0F8FF]">
      <div className="border-b border-gray-200 bg-white shadow-lg">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8 lg:py-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#15BB73] to-[#0FA568] shadow-lg lg:h-12 lg:w-12">
              <svg className="h-6 w-6 text-white lg:h-7 lg:w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#000600] lg:text-2xl">{t('mapView.title')}</h1>
              <p className="text-xs text-gray-600 lg:text-sm">{t('mapView.subtitle')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)] flex-col lg:flex-row">
        <div className="relative h-64 flex-1 lg:h-full">
          {loading ? (
            <LoadingComponent t={t} />
          ) : (
            <Wrapper apiKey={GOOGLE_MAPS_API_KEY} render={render} />
          )}

          <div className="absolute right-2 top-2 z-10 space-y-2 lg:right-4 lg:top-4">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-lg transition-colors hover:bg-gray-50 lg:h-12 lg:w-12 ${refreshing ? 'animate-spin' : ''}`}
              title={t('mapView.refreshMap')}
            >
              <svg className="h-5 w-5 text-gray-600 lg:h-6 lg:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            <button
              onClick={() => {
                toast(t('mapView.mapInfoToast', { count: filteredAnimals.length }), {
                  icon: '\uD83D\uDCCD',
                  duration: 5000
                });
              }}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-lg transition-colors hover:bg-gray-50 lg:h-12 lg:w-12"
              title={t('mapView.mapInfo')}
            >
              <svg className="h-5 w-5 text-gray-600 lg:h-6 lg:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>

          <div className="absolute left-2 top-2 z-10 rounded-lg bg-white px-3 py-2 shadow-lg lg:left-4 lg:top-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{getAnimalEmoji('cow')}</span>
              <div>
                <div className="text-sm font-bold text-gray-800">{t('mapView.animalsCount', { count: filteredAnimals.length })}</div>
                <div className="text-xs text-gray-500">{t('mapView.onMap')}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="h-96 w-full overflow-y-auto bg-white shadow-lg lg:h-full lg:w-96">
          <div className="p-4 lg:p-6">
            <div className="mb-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#000600] lg:text-xl">{t('mapView.nearestAnimals')}</h2>
                {refreshing && (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#15BB73] border-t-transparent"></div>
                )}
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                    filterType === 'all'
                      ? 'bg-[#15BB73] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t('mapView.allFilter', { count: nearestAnimals.length })}
                </button>
                {animalTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                      filterType === type
                        ? 'bg-[#15BB73] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span>{getAnimalEmoji(type)}</span>
                    <span>{getAnimalTypeLabel(type)}</span>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {filteredAnimals.length > 0 ? (
              <div className="space-y-3 lg:space-y-4">
                {filteredAnimals.map((animal) => {
                  const distanceMeta = getDistanceMeta(animal);

                  return (
                    <div
                      key={`${animal.animal_type || animal.animalType}-${animal.id}`}
                      className={`cursor-pointer rounded-xl border-2 p-3 transition-all duration-300 hover:shadow-lg lg:p-4 ${
                        selectedAnimal?.id === animal.id
                          ? 'border-[#15BB73] bg-green-50'
                          : 'border-gray-200 bg-white hover:border-green-300'
                      }`}
                      onClick={() => setSelectedAnimal(animal)}
                    >
                      <div className="mb-2 flex items-start justify-between lg:mb-3">
                        <div className="flex items-center space-x-2 lg:space-x-3">
                          <span className="text-xl lg:text-2xl">{getAnimalEmoji(animal.animalType || animal.animal_type)}</span>
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-xs font-semibold text-gray-800 lg:text-sm">
                              {animal.breed_name || animal.title || t('mapView.unknownBreed')}
                            </h3>
                            <p className="text-xs capitalize text-gray-600">
                              {animal.breed || ''}
                              {animal.breed ? ' • ' : ''}
                              {getAnimalTypeLabel(animal.animalType || animal.animal_type)}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleToggleWishlist(animal);
                          }}
                          className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full transition-all duration-300 lg:h-8 lg:w-8 ${
                            isInWishlist?.(animal.id)
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-red-500 hover:text-white'
                          }`}
                        >
                          <svg className="h-3 w-3 lg:h-4 lg:w-4" fill={isInWishlist?.(animal.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                      </div>

                      <div className="mb-2 flex items-center justify-between lg:mb-3">
                        <div className="flex min-w-0 flex-1 items-center space-x-1 lg:space-x-2">
                          <svg className="h-3 w-3 flex-shrink-0 text-gray-400 lg:h-4 lg:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          <span className="truncate text-xs text-gray-600 lg:text-sm">
                            {animal.city || t('mapView.unknownLocation')}{animal.state ? `, ${animal.state}` : ''}
                          </span>
                        </div>
                        {distanceMeta && (
                          <span className={`ml-2 flex-shrink-0 text-xs font-bold lg:text-sm ${distanceMeta.className}`}>
                            {distanceMeta.label}
                          </span>
                        )}
                      </div>

                      {animal.milk_capacity && (
                        <div className="mb-2 flex items-center text-xs text-blue-600">
                          <span className="mr-1">{'\uD83E\uDD5B'}</span>
                          {t('mapView.milkPerDay', { count: animal.milk_capacity })}
                        </div>
                      )}

                      <div className="mb-2 flex items-center justify-between lg:mb-3">
                        <span className="text-base font-bold text-[#15BB73] lg:text-lg">
                          {'\u20B9'}{formatPrice(animal.expected_price || animal.price)}
                        </span>
                        <span className="truncate text-xs text-gray-600 lg:text-sm">
                          {t('mapView.sellerLabel')}: {animal.seller?.name || t('mapView.unknownSeller')}
                        </span>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            window.open(`tel:${animal.seller?.phone || animal.phoneNumber}`, '_self');
                          }}
                          className="flex-1 rounded-lg bg-gradient-to-r from-[#15BB73] to-[#0FA568] px-2 py-2 text-xs font-semibold text-white transition-all duration-300 hover:shadow-lg lg:px-3 lg:text-sm"
                        >
                          {t('animalCard.call')}
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            const phone = animal.seller?.phone || animal.phoneNumber;
                            const message = t('mapView.whatsAppMessage', {
                              animalType: getAnimalTypeLabel(animal.animalType || animal.animal_type),
                              title: animal.breed_name || animal.title || t('mapView.unknownBreed'),
                              price: formatPrice(animal.expected_price || animal.price)
                            });
                            window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(message)}`, '_blank');
                          }}
                          className="flex-1 rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-2 py-2 text-xs font-semibold text-white transition-all duration-300 hover:shadow-lg lg:px-3 lg:text-sm"
                        >
                          {t('animalCard.chat')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : loading ? (
              <div className="py-6 text-center lg:py-8">
                <InlineLoader message={t('mapView.loadingAnimals')} />
              </div>
            ) : (
              <div className="py-6 text-center lg:py-8">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 lg:mb-4 lg:h-16 lg:w-16">
                  <svg className="h-6 w-6 text-gray-400 lg:h-8 lg:w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 lg:text-base">{t('mapView.noAnimalsFoundNearby')}</p>
                <button
                  onClick={handleRefresh}
                  className="mt-4 font-semibold text-[#15BB73] hover:underline"
                >
                  {t('mapView.tryRefreshing')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
