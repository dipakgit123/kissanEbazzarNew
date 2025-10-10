import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Wrapper, Status } from '@googlemaps/react-wrapper';

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

// Google Maps Component
const MapComponent = ({ userLocation, animalData, selectedAnimal, onAnimalSelect }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    if (mapRef.current && !map && window.google) {
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: userLocation || { lat: 18.5204, lng: 73.8567 }, // Default to Pune
        zoom: 12,
        mapTypeId: 'roadmap',
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });
      setMap(mapInstance);
    }
  }, [mapRef, map, userLocation]);

  // Add user location marker
  useEffect(() => {
    if (map && userLocation && window.google) {
      const userMarker = new window.google.maps.Marker({
        position: userLocation,
        map: map,
        title: 'Your Location',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#3B82F6',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3
        },
        animation: window.google.maps.Animation.BOUNCE
      });

      return () => {
        userMarker.setMap(null);
      };
    }
  }, [map, userLocation]);

  // Add animal markers
  useEffect(() => {
    if (map && window.google) {
      // Clear existing markers
      markers.forEach(marker => marker.setMap(null));
      
      const newMarkers = animalData.map((animal) => {
        const marker = new window.google.maps.Marker({
          position: animal.coordinates,
          map: map,
          title: animal.title,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: selectedAnimal?.id === animal.id ? '#F59E0B' : '#10B981',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          }
        });

        // Add click listener
        marker.addListener('click', () => {
          onAnimalSelect(animal);
        });

        return marker;
      });

      setMarkers(newMarkers);
    }
  }, [map, animalData, selectedAnimal, onAnimalSelect]);

  return <div ref={mapRef} className="w-full h-full" />;
};

// Get animal type emoji
const getAnimalEmoji = (type) => {
  const emojis = {
    'Cow': '🐄',
    'Buffalo': '🐃',
    'Goat': '🐐',
    'Sheep': '🐑',
    'Horse': '🐴',
    'Pig': '🐷',
    'Bull': '🐂',
    'Calf': '🐮'
  };
  return emojis[type] || '🐄';
};

const MapView = ({ wishlist, addToWishlist, removeFromWishlist, isInWishlist }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [nearestAnimals, setNearestAnimals] = useState([]);
  const [mapCenter, setMapCenter] = useState({ lat: 18.5204, lng: 73.8567 }); // Default to Pune
  

  // Sample animal data with coordinates
  const animalData = [
    {
      id: 1,
      title: "High Quality Gir Cow | 20L Milk Daily",
      price: "85,000",
      location: "Pune (45 km)",
      datePosted: "2 hours ago",
      imageSrc: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTS4LKYx3t9wCKfn3DIRuxJB7-biALX_vle8w&s",
      sellerName: "Rajesh Kumar",
      phoneNumber: "9922527421",
      breed: "Gir",
      animalType: "Cow",
      milkProduction: "20L",
      coordinates: { lat: 18.5204, lng: 73.8567 },
      address: "Pune, Maharashtra"
    },
    {
      id: 2,
      title: "Healthy Buffalo | 15L Milk Capacity",
      price: "65,000",
      location: "Mumbai (120 km)",
      datePosted: "1 day ago",
      imageSrc: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTS4LKYx3t9wCKfn3DIRuxJB7-biALX_vle8w&s",
      sellerName: "Priya Sharma",
      phoneNumber: "9922527421",
      breed: "Murrah",
      animalType: "Buffalo",
      milkProduction: "15L",
      coordinates: { lat: 19.0760, lng: 72.8777 },
      address: "Mumbai, Maharashtra"
    },
    {
      id: 3,
      title: "Premium Goat | 3L Milk Daily",
      price: "25,000",
      location: "Nashik (180 km)",
      datePosted: "3 days ago",
      imageSrc: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTS4LKYx3t9wCKfn3DIRuxJB7-biALX_vle8w&s",
      sellerName: "Vikram Singh",
      phoneNumber: "9922527421",
      breed: "Boer",
      animalType: "Goat",
      milkProduction: "3L",
      coordinates: { lat: 19.9975, lng: 73.7898 },
      address: "Nashik, Maharashtra"
    },
    {
      id: 4,
      title: "Strong Bull | For Breeding",
      price: "1,20,000",
      location: "Aurangabad (250 km)",
      datePosted: "5 days ago",
      imageSrc: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTS4LKYx3t9wCKfn3DIRuxJB7-biALX_vle8w&s",
      sellerName: "Amit Patel",
      phoneNumber: "9922527421",
      breed: "Holstein",
      animalType: "Bull",
      milkProduction: "N/A",
      coordinates: { lat: 19.8762, lng: 75.3433 },
      address: "Aurangabad, Maharashtra"
    },
    {
      id: 5,
      title: "Young Calf | 6 Months Old",
      price: "35,000",
      location: "Kolhapur (300 km)",
      datePosted: "1 week ago",
      imageSrc: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTS4LKYx3t9wCKfn3DIRuxJB7-biALX_vle8w&s",
      sellerName: "Sunita Desai",
      phoneNumber: "9922527421",
      breed: "Jersey",
      animalType: "Calf",
      milkProduction: "N/A",
      coordinates: { lat: 16.7050, lng: 74.2433 },
      address: "Kolhapur, Maharashtra"
    },
    {
      id: 6,
      title: "Pregnant Cow | Due in 2 Months",
      price: "95,000",
      location: "Satara (200 km)",
      datePosted: "2 weeks ago",
      imageSrc: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTS4LKYx3t9wCKfn3DIRuxJB7-biALX_vle8w&s",
      sellerName: "Ramesh Joshi",
      phoneNumber: "9922527421",
      breed: "Sahiwal",
      animalType: "Cow",
      milkProduction: "18L",
      coordinates: { lat: 17.6805, lng: 74.0183 },
      address: "Satara, Maharashtra"
    }
  ];

  // Get user's current location with real-time tracking
  useEffect(() => {
    if (navigator.geolocation) {
      // Get current position
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Fallback to Pune coordinates
          setUserLocation({
            lat: 18.5204,
            lng: 73.8567
          });
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
        (error) => {
          console.error('Error watching location:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 1000
        }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    } else {
      // Fallback to Pune coordinates
      setUserLocation({
        lat: 18.5204,
        lng: 73.8567
      });
    }
  }, []);

  // Calculate distance between two coordinates
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Calculate nearest animals
  useEffect(() => {
    if (userLocation) {
      const animalsWithDistance = animalData.map(animal => ({
        ...animal,
        distance: calculateDistance(
          userLocation.lat,
          userLocation.lng,
          animal.coordinates.lat,
          animal.coordinates.lng
        )
      })).sort((a, b) => a.distance - b.distance);

      setNearestAnimals(animalsWithDistance);
    }
  }, [userLocation]);

  // Toggle wishlist function
  const handleToggleWishlist = (animalId) => {
    const animal = animalData.find(a => a.id === animalId);
    if (isInWishlist(animalId)) {
      removeFromWishlist(animalId);
    } else {
      addToWishlist(animal);
    }
  };

  // Get animal type emoji
  const getAnimalEmoji = (type) => {
    const emojis = {
      'Cow': '🐄',
      'Buffalo': '🐃',
      'Goat': '🐐',
      'Sheep': '🐑',
      'Horse': '🐴',
      'Pig': '🐷',
      'Bull': '🐂',
      'Calf': '🐮'
    };
    return emojis[type] || '🐄';
  };

  // Get distance color
  const getDistanceColor = (distance) => {
    if (distance < 50) return 'text-green-600';
    if (distance < 100) return 'text-yellow-600';
    if (distance < 200) return 'text-orange-600';
    return 'text-red-600';
  };

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
            animalData={animalData}
            selectedAnimal={selectedAnimal}
            onAnimalSelect={setSelectedAnimal}
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
          <Wrapper apiKey={GOOGLE_MAPS_API_KEY} render={render} />
          
          {/* Map Controls */}
          <div className="absolute top-2 right-2 lg:top-4 lg:right-4 space-y-2 z-10">
            <button
              onClick={() => {
                // Refresh map view
                window.location.reload();
              }}
              className="w-10 h-10 lg:w-12 lg:h-12 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
              title="Refresh map"
            >
              <svg className="w-5 h-5 lg:w-6 lg:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            
            <button
              onClick={() => {
                // Show map info
                alert('Google Maps Integration\n\n• Real-time map with satellite view\n• Click on animal markers to select them\n• Use sidebar to view details and contact sellers\n• All animals are sorted by distance from your location');
              }}
              className="w-10 h-10 lg:w-12 lg:h-12 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
              title="Map info"
            >
              <svg className="w-5 h-5 lg:w-6 lg:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-96 bg-white shadow-lg overflow-y-auto h-96 lg:h-full">
          <div className="p-4 lg:p-6">
            <h2 className="text-lg lg:text-xl font-bold text-[#000600] mb-4">Nearest Animals</h2>
            
            {nearestAnimals.length > 0 ? (
              <div className="space-y-3 lg:space-y-4">
                {nearestAnimals.map((animal) => (
                  <div
                    key={animal.id}
                    className={`p-3 lg:p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                      selectedAnimal?.id === animal.id 
                        ? 'border-[#15BB73] bg-green-50' 
                        : 'border-gray-200 bg-white hover:border-green-300'
                    }`}
                    onClick={() => setSelectedAnimal(animal)}
                  >
                    <div className="flex items-start justify-between mb-2 lg:mb-3">
                      <div className="flex items-center space-x-2 lg:space-x-3">
                        <span className="text-xl lg:text-2xl">{getAnimalEmoji(animal.animalType)}</span>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-800 text-xs lg:text-sm truncate">{animal.title}</h3>
                          <p className="text-xs text-gray-600">{animal.breed} • {animal.animalType}</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleWishlist(animal.id);
                        }}
                        className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                          isInWishlist(animal.id) 
                            ? 'bg-red-500 text-white' 
                            : 'bg-gray-100 text-gray-600 hover:bg-red-500 hover:text-white'
                        }`}
                      >
                        <svg className="w-3 h-3 lg:w-4 lg:h-4" fill={isInWishlist(animal.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex items-center justify-between mb-2 lg:mb-3">
                      <div className="flex items-center space-x-1 lg:space-x-2 min-w-0 flex-1">
                        <svg className="w-3 h-3 lg:w-4 lg:h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <span className="text-xs lg:text-sm text-gray-600 truncate">{animal.address}</span>
                      </div>
                      <span className={`text-xs lg:text-sm font-bold ${getDistanceColor(animal.distance)} flex-shrink-0 ml-2`}>
                        {animal.distance.toFixed(1)} km
                      </span>
                    </div>

                    <div className="flex items-center justify-between mb-2 lg:mb-3">
                      <span className="text-base lg:text-lg font-bold text-[#15BB73]">₹{animal.price}</span>
                      <span className="text-xs lg:text-sm text-gray-600 truncate">Seller: {animal.sellerName}</span>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`tel:${animal.phoneNumber}`, '_self');
                        }}
                        className="flex-1 bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white py-2 px-2 lg:px-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 text-xs lg:text-sm"
                      >
                        Call
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://wa.me/${animal.phoneNumber}?text=${encodeURIComponent(`Hi! I'm interested in your ${animal.title} (₹${animal.price}). Is it still available?`)}`, '_blank');
                        }}
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-2 lg:px-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 text-xs lg:text-sm"
                      >
                        WhatsApp
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 lg:py-8">
                <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 lg:mb-4">
                  <svg className="w-6 h-6 lg:w-8 lg:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm lg:text-base">No animals found nearby</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
