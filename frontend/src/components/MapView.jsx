import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { listingsService } from '../services/api';

// Google Maps API Key
const GOOGLE_MAPS_API_KEY = 'AIzaSyAXGS_YosP1JmJL1KaLbW4ibs-rblbnUNQ';

// Loading component
const LoadingComponent = () => (
  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#E9F0F8] to-[#F0F8FF]">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-[#15BB73] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600 font-medium">Loading Map...</p>
    </div>
  </div>
);

// Error component
const ErrorComponent = () => (
  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#E9F0F8] to-[#F0F8FF]">
    <div className="text-center p-8">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Map Loading Error</h3>
      <p className="text-gray-600 text-sm">Unable to load the map. Please check your internet connection and try again.</p>
    </div>
  </div>
);

// Get animal type emoji
const getAnimalEmoji = (type) => {
  const emojis = {
    'cow': '🐄',
    'buffalo': '🐃',
    'goat': '🐐',
    'sheep': '🐑',
    'horse': '🐴',
    'pig': '🐷',
    'bull': '🐂',
    'calf': '🐮',
    'dog': '🐕',
    'cat': '🐱',
    'animal': '🐄'
  };
  return emojis[type?.toLowerCase()] || '🐄';
};

// Get marker color based on animal type
const getMarkerColor = (type) => {
  const colors = {
    'cow': '#22C55E',
    'buffalo': '#6366F1',
    'goat': '#EC4899',
    'horse': '#8B5CF6',
    'dog': '#14B8A6',
    'cat': '#F97316',
    'bull': '#F59E0B',
    'animal': '#15BB73'
  };
  return colors[type?.toLowerCase()] || '#15BB73';
};

// Format price to Indian format
const formatPrice = (price) => {
  if (!price) return '0';
  return Number(price).toLocaleString('en-IN');
};

// Google Maps Component with real markers
const MapComponent = ({ userLocation, animalData, selectedAnimal, onAnimalSelect, onMapReady }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);

  // Initialize map
  useEffect(() => {
    if (mapRef.current && !map && window.google) {
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: userLocation || { lat: 18.5204, lng: 73.8567 },
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
      if (onMapReady) onMapReady(mapInstance);
    }
  }, [mapRef, map, userLocation, onMapReady]);

  // Add user location marker with pulsing effect
  useEffect(() => {
    if (map && userLocation && window.google) {
      // Pulsing circle animation
      const userCircle = new window.google.maps.Circle({
        center: userLocation,
        radius: 200,
        fillColor: '#3B82F6',
        fillOpacity: 0.2,
        strokeColor: '#3B82F6',
        strokeOpacity: 0.4,
        strokeWeight: 2,
        map: map
      });

      const userMarker = new window.google.maps.Marker({
        position: userLocation,
        map: map,
        title: 'Your Location',
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

      // Info window for user location
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="p-2">
            <div class="font-bold text-blue-600">📍 Your Location</div>
            <div class="text-sm text-gray-600">Animals are shown relative to here</div>
          </div>
        `
      });

      userMarker.addListener('click', () => {
        infoWindow.open(map, userMarker);
      });

      return () => {
        userMarker.setMap(null);
        userCircle.setMap(null);
      };
    }
  }, [map, userLocation]);

  // Add animal markers
  useEffect(() => {
    if (map && window.google && animalData.length > 0) {
      // Clear existing markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      // Close any open info window
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }

      // Create info window
      infoWindowRef.current = new window.google.maps.InfoWindow();

      // Create markers for each animal
      const bounds = new window.google.maps.LatLngBounds();

      if (userLocation) {
        bounds.extend(new window.google.maps.LatLng(userLocation.lat, userLocation.lng));
      }

      animalData.forEach((animal) => {
        const lat = parseFloat(animal.latitude);
        const lng = parseFloat(animal.longitude);

        if (!isNaN(lat) && !isNaN(lng)) {
          const position = { lat, lng };
          const emoji = getAnimalEmoji(animal.animalType || animal.animal_type);
          const color = getMarkerColor(animal.animalType || animal.animal_type);
          const isSelected = selectedAnimal?.id === animal.id;

          // Create custom marker with SVG
          const marker = new window.google.maps.Marker({
            position: position,
            map: map,
            title: animal.breed_name || animal.title || 'Animal',
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
            animation: isSelected ? window.google.maps.Animation.BOUNCE : null,
            zIndex: isSelected ? 999 : 1
          });

          // Create info window content
          const infoContent = `
            <div class="p-3 max-w-xs">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-2xl">${emoji}</span>
                <div>
                  <div class="font-bold text-gray-800">${animal.breed_name || animal.title || 'Unknown'}</div>
                  <div class="text-xs text-gray-500 capitalize">${animal.animalType || animal.animal_type}</div>
                </div>
              </div>
              <div class="text-lg font-bold text-green-600 mb-2">₹${formatPrice(animal.expected_price || animal.price)}</div>
              <div class="flex items-center text-sm text-gray-600 mb-2">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                </svg>
                ${animal.city || 'Unknown'}${animal.distance ? ` (${Math.round(animal.distance)} km)` : ''}
              </div>
              ${animal.milk_capacity ? `<div class="text-sm text-blue-600 mb-2">🥛 ${animal.milk_capacity}L milk/day</div>` : ''}
              <div class="text-xs text-gray-500">Seller: ${animal.seller?.name || 'Unknown'}</div>
            </div>
          `;

          // Add click listener
          marker.addListener('click', () => {
            infoWindowRef.current.setContent(infoContent);
            infoWindowRef.current.open(map, marker);
            onAnimalSelect(animal);

            // Smooth pan to marker
            map.panTo(position);
          });

          markersRef.current.push(marker);
          bounds.extend(position);
        }
      });

      // Fit bounds if we have markers
      if (markersRef.current.length > 0) {
        map.fitBounds(bounds, { padding: 50 });

        // Don't zoom in too much
        const listener = window.google.maps.event.addListenerOnce(map, 'idle', () => {
          if (map.getZoom() > 14) map.setZoom(14);
        });
      }
    }
  }, [map, animalData, selectedAnimal, onAnimalSelect, userLocation]);

  // Update marker when selection changes
  useEffect(() => {
    if (map && markersRef.current.length > 0) {
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
          scaledSize: new window.google.maps.Size(isSelected ? 56 : 48, isSelected ? 68 : 58),
          anchor: new window.google.maps.Point(isSelected ? 28 : 24, isSelected ? 68 : 58)
        });

        marker.setAnimation(isSelected ? window.google.maps.Animation.BOUNCE : null);
        marker.setZIndex(isSelected ? 999 : 1);

        // Pan to selected marker
        if (isSelected && animal) {
          const lat = parseFloat(animal.latitude);
          const lng = parseFloat(animal.longitude);
          if (!isNaN(lat) && !isNaN(lng)) {
            map.panTo({ lat, lng });
          }
        }
      });
    }
  }, [selectedAnimal, map, animalData]);

  return <div ref={mapRef} className="w-full h-full" />;
};

// Get distance color
const getDistanceColor = (distance) => {
  if (distance < 50) return 'text-green-600';
  if (distance < 100) return 'text-yellow-600';
  if (distance < 200) return 'text-orange-600';
  return 'text-red-600';
};

const MapView = ({ wishlist = [], addToWishlist, removeFromWishlist, isInWishlist }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [nearestAnimals, setNearestAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const mapInstanceRef = useRef(null);

  // Fetch real animals from API
  const fetchAnimals = useCallback(async (lat, lng) => {
    try {
      setRefreshing(true);
      let allAnimals = [];

      // Try nearby listings first
      try {
        const nearbyResponse = await listingsService.getNearbyListings(lat, lng, 500, 100);
        if (nearbyResponse.success && nearbyResponse.data) {
          allAnimals = nearbyResponse.data;
        }
      } catch (e) {
        console.log('Nearby listings not available:', e);
      }

      // If no nearby listings, get featured listings
      if (allAnimals.length === 0) {
        try {
          const featuredResponse = await listingsService.getFeaturedListings(100);
          if (featuredResponse.success && featuredResponse.data) {
            allAnimals = featuredResponse.data;
          }
        } catch (e) {
          console.log('Featured listings not available:', e);
        }
      }

      // For animals without coordinates, generate coordinates based on city
      // This is a temporary solution - ideally coordinates should be stored in DB
      const cityCoordinates = {
        'pune': { lat: 18.5204, lng: 73.8567 },
        'mumbai': { lat: 19.0760, lng: 72.8777 },
        'nashik': { lat: 19.9975, lng: 73.7898 },
        'kolhapur': { lat: 16.7050, lng: 74.2433 },
        'satara': { lat: 17.6805, lng: 74.0183 },
        'sangli': { lat: 16.8524, lng: 74.5815 },
        'solapur': { lat: 17.6599, lng: 75.9064 },
        'aurangabad': { lat: 19.8762, lng: 75.3433 },
        'nagpur': { lat: 21.1458, lng: 79.0882 },
        'thane': { lat: 19.2183, lng: 72.9781 },
        'ahmednagar': { lat: 19.0948, lng: 74.7480 },
        'jalgaon': { lat: 21.0077, lng: 75.5626 },
        'akola': { lat: 20.7002, lng: 77.0082 },
        'latur': { lat: 18.4088, lng: 76.5604 },
        'dhule': { lat: 20.9042, lng: 74.7749 },
        'nanded': { lat: 19.1383, lng: 77.3210 },
        'ratnagiri': { lat: 16.9902, lng: 73.3120 },
        'shirala': { lat: 16.9833, lng: 74.1333 },
        'karad': { lat: 17.2862, lng: 74.1826 },
        'default': { lat: 18.5204, lng: 73.8567 } // Default to Pune
      };

      // Process animals and add coordinates if missing
      const processedAnimals = allAnimals.map((animal, index) => {
        let animalLat = parseFloat(animal.latitude);
        let animalLng = parseFloat(animal.longitude);

        // If no coordinates, try to get from city
        if (isNaN(animalLat) || isNaN(animalLng)) {
          const city = (animal.city || '').toLowerCase().trim();
          const cityCoord = cityCoordinates[city] || cityCoordinates['default'];

          // Add small random offset to prevent markers from stacking
          const offset = 0.01 + (index * 0.005);
          const angle = (index * 137.5) * (Math.PI / 180); // Golden angle for distribution

          animalLat = cityCoord.lat + (offset * Math.cos(angle));
          animalLng = cityCoord.lng + (offset * Math.sin(angle));
        }

        // Calculate distance from user
        let distance = animal.distance;
        if (!distance && lat && lng) {
          const R = 6371;
          const dLat = (animalLat - lat) * Math.PI / 180;
          const dLng = (animalLng - lng) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(lat * Math.PI / 180) * Math.cos(animalLat * Math.PI / 180) *
                    Math.sin(dLng/2) * Math.sin(dLng/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          distance = R * c;
        }

        return {
          ...animal,
          latitude: animalLat,
          longitude: animalLng,
          distance: distance
        };
      });

      // Sort by distance
      const sortedAnimals = processedAnimals.sort((a, b) =>
        (a.distance || 0) - (b.distance || 0)
      );

      setNearestAnimals(sortedAnimals);
      setError(null);

      console.log(`Loaded ${sortedAnimals.length} animals on map`);
    } catch (err) {
      console.error('Error fetching animals:', err);
      setError('Failed to fetch animals. Please try again.');
      setNearestAnimals([]);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  // Get user's current location
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
        (error) => {
          console.error('Error getting location:', error);
          // Default to Pune
          const defaultLocation = { lat: 18.5204, lng: 73.8567 };
          setUserLocation(defaultLocation);
          fetchAnimals(defaultLocation.lat, defaultLocation.lng);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );

      // Watch position for real-time updates
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
    } else {
      const defaultLocation = { lat: 18.5204, lng: 73.8567 };
      setUserLocation(defaultLocation);
      fetchAnimals(defaultLocation.lat, defaultLocation.lng);
    }
  }, [fetchAnimals]);

  // Refresh animals
  const handleRefresh = () => {
    if (userLocation) {
      fetchAnimals(userLocation.lat, userLocation.lng);
    }
  };

  // Toggle wishlist
  const handleToggleWishlist = (animal) => {
    if (isInWishlist && isInWishlist(animal.id)) {
      removeFromWishlist && removeFromWishlist(animal.id);
    } else {
      addToWishlist && addToWishlist(animal);
    }
  };

  // Filter animals by type
  const filteredAnimals = filterType === 'all'
    ? nearestAnimals
    : nearestAnimals.filter(a => (a.animalType || a.animal_type)?.toLowerCase() === filterType);

  // Get unique animal types for filter
  const animalTypes = [...new Set(nearestAnimals.map(a => (a.animalType || a.animal_type)?.toLowerCase()))].filter(Boolean);

  // Render function for Google Maps
  const render = (status) => {
    switch (status) {
      case Status.LOADING:
        return <LoadingComponent />;
      case Status.FAILURE:
        return <ErrorComponent />;
      case Status.SUCCESS:
        return (
          <MapComponent
            userLocation={userLocation}
            animalData={filteredAnimals}
            selectedAnimal={selectedAnimal}
            onAnimalSelect={setSelectedAnimal}
            onMapReady={(map) => { mapInstanceRef.current = map; }}
          />
        );
      default:
        return <LoadingComponent />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E9F0F8] to-[#F0F8FF]">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-[#15BB73] to-[#0FA568] rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 lg:w-7 lg:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-[#000600]">Animal Map</h1>
                <p className="text-xs lg:text-sm text-gray-600">Find animals near you</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              {userLocation && (
                <div className="text-xs lg:text-sm text-gray-600 hidden sm:block">
                  <span className="font-semibold">Your Location:</span> {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                </div>
              )}
              <Link
                to="/"
                className="bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white px-3 py-2 lg:px-4 lg:py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 text-sm lg:text-base w-full sm:w-auto text-center"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)]">
        {/* Map Area */}
        <div className="flex-1 relative h-64 lg:h-full">
          {loading ? (
            <LoadingComponent />
          ) : (
            <Wrapper apiKey={GOOGLE_MAPS_API_KEY} render={render} />
          )}

          {/* Map Controls */}
          <div className="absolute top-2 right-2 lg:top-4 lg:right-4 space-y-2 z-10">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`w-10 h-10 lg:w-12 lg:h-12 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors ${refreshing ? 'animate-spin' : ''}`}
              title="Refresh map"
            >
              <svg className="w-5 h-5 lg:w-6 lg:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            <button
              onClick={() => {
                alert(`Animals on Map: ${filteredAnimals.length}\n\nClick on any marker to see details.\nUse the sidebar to browse and contact sellers.`);
              }}
              className="w-10 h-10 lg:w-12 lg:h-12 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
              title="Map info"
            >
              <svg className="w-5 h-5 lg:w-6 lg:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>

          {/* Animal Count Badge */}
          <div className="absolute top-2 left-2 lg:top-4 lg:left-4 bg-white rounded-lg shadow-lg px-3 py-2 z-10">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🐄</span>
              <div>
                <div className="text-sm font-bold text-gray-800">{filteredAnimals.length} Animals</div>
                <div className="text-xs text-gray-500">on map</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-96 bg-white shadow-lg overflow-y-auto h-96 lg:h-full">
          <div className="p-4 lg:p-6">
            {/* Filter by Animal Type */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg lg:text-xl font-bold text-[#000600]">Nearest Animals</h2>
                {refreshing && (
                  <div className="w-5 h-5 border-2 border-[#15BB73] border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>

              {/* Type Filter */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    filterType === 'all'
                      ? 'bg-[#15BB73] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All ({nearestAnimals.length})
                </button>
                {animalTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                      filterType === type
                        ? 'bg-[#15BB73] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span>{getAnimalEmoji(type)}</span>
                    <span className="capitalize">{type}</span>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            {filteredAnimals.length > 0 ? (
              <div className="space-y-3 lg:space-y-4">
                {filteredAnimals.map((animal) => (
                  <div
                    key={`${animal.animal_type || animal.animalType}-${animal.id}`}
                    className={`p-3 lg:p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                      selectedAnimal?.id === animal.id
                        ? 'border-[#15BB73] bg-green-50'
                        : 'border-gray-200 bg-white hover:border-green-300'
                    }`}
                    onClick={() => setSelectedAnimal(animal)}
                  >
                    <div className="flex items-start justify-between mb-2 lg:mb-3">
                      <div className="flex items-center space-x-2 lg:space-x-3">
                        <span className="text-xl lg:text-2xl">{getAnimalEmoji(animal.animalType || animal.animal_type)}</span>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-800 text-xs lg:text-sm truncate">
                            {animal.breed_name || animal.title || 'Unknown Breed'}
                          </h3>
                          <p className="text-xs text-gray-600 capitalize">
                            {animal.breed || ''} • {animal.animalType || animal.animal_type}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleWishlist(animal);
                        }}
                        className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                          isInWishlist && isInWishlist(animal.id)
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-red-500 hover:text-white'
                        }`}
                      >
                        <svg className="w-3 h-3 lg:w-4 lg:h-4" fill={isInWishlist && isInWishlist(animal.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex items-center justify-between mb-2 lg:mb-3">
                      <div className="flex items-center space-x-1 lg:space-x-2 min-w-0 flex-1">
                        <svg className="w-3 h-3 lg:w-4 lg:h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <span className="text-xs lg:text-sm text-gray-600 truncate">
                          {animal.city || 'Unknown'}{animal.state ? `, ${animal.state}` : ''}
                        </span>
                      </div>
                      {animal.distance && (
                        <span className={`text-xs lg:text-sm font-bold ${getDistanceColor(animal.distance)} flex-shrink-0 ml-2`}>
                          {animal.distance.toFixed(1)} km
                        </span>
                      )}
                    </div>

                    {/* Extra info */}
                    {animal.milk_capacity && (
                      <div className="text-xs text-blue-600 mb-2 flex items-center">
                        <span className="mr-1">🥛</span>
                        {animal.milk_capacity}L milk/day
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-2 lg:mb-3">
                      <span className="text-base lg:text-lg font-bold text-[#15BB73]">
                        ₹{formatPrice(animal.expected_price || animal.price)}
                      </span>
                      <span className="text-xs lg:text-sm text-gray-600 truncate">
                        Seller: {animal.seller?.name || 'Unknown'}
                      </span>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`tel:${animal.seller?.phone || animal.phoneNumber}`, '_self');
                        }}
                        className="flex-1 bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white py-2 px-2 lg:px-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 text-xs lg:text-sm"
                      >
                        Call
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const phone = animal.seller?.phone || animal.phoneNumber;
                          const message = `Hi! I'm interested in your ${animal.animalType || animal.animal_type} listing: "${animal.breed_name || animal.title}" (₹${formatPrice(animal.expected_price || animal.price)}). Is it still available?`;
                          window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(message)}`, '_blank');
                        }}
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-2 lg:px-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 text-xs lg:text-sm"
                      >
                        WhatsApp
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : loading ? (
              <div className="text-center py-6 lg:py-8">
                <div className="w-12 h-12 border-4 border-[#15BB73] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">Loading animals...</p>
              </div>
            ) : (
              <div className="text-center py-6 lg:py-8">
                <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 lg:mb-4">
                  <svg className="w-6 h-6 lg:w-8 lg:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm lg:text-base">No animals found nearby</p>
                <button
                  onClick={handleRefresh}
                  className="mt-4 text-[#15BB73] font-semibold hover:underline"
                >
                  Try refreshing
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
