import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Linking,
  Alert,
  RefreshControl,
  ScrollView,
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS, formatPrice } from '../utils/constants';
import { listingsService } from '../services/api';
import CowLoader from '../components/CowLoader';
import AppHeader from '../components/AppHeader';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.5;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

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

const getAnimalMarkerIcon = (type) => {
  const icons = {
    cow: 'cow',
    buffalo: 'cow',
    goat: 'sheep',
    horse: 'horse',
    dog: 'dog-side',
    cat: 'cat',
    bull: 'cow',
    animal: 'paw',
    other: 'paw',
  };

  return icons[type?.toLowerCase()] || 'paw';
};

// Get distance color
const getDistanceColor = (distance) => {
  if (!distance) return COLORS.gray;
  if (distance < 20) return '#22C55E';
  if (distance < 50) return '#F59E0B';
  if (distance < 100) return '#F97316';
  return '#EF4444';
};

// Custom Marker Component
const AnimalMarker = ({ listing, isSelected, onPress }) => {
  const emoji = '';
  const color = getMarkerColor(listing.animal_type);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.markerContainer,
        isSelected && styles.selectedMarker,
        { borderColor: color }
      ]}
    >
      <Text style={styles.markerEmoji}>{emoji}</Text>
      {isSelected && (
        <View style={[styles.markerPrice, { backgroundColor: color }]}>
          <Text style={styles.markerPriceText}>₹{formatPrice(listing.expected_price)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const MapScreen = ({ navigation, route }) => {
  const mapRef = useRef(null);
  const targetParams = route?.params || {};
  const targetListingId = targetParams.listingId || targetParams.id || targetParams.listing?.id;
  const targetAnimalType = targetParams.animalType || targetParams.listing?.animal_type;
  const targetLatitude = Number(targetParams.latitude ?? targetParams.lat);
  const targetLongitude = Number(targetParams.longitude ?? targetParams.lng);
  const hasTargetCoordinates =
    Number.isFinite(targetLatitude) && Number.isFinite(targetLongitude);

  const [userLocation, setUserLocation] = useState(null);
  const [listings, setListings] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [mapReady, setMapReady] = useState(false);

  // Initialize map and fetch data
  useEffect(() => {
    initializeMap();
  }, []);

  const focusMapOnListing = useCallback((listing, delta = 0.05) => {
    if (mapRef.current && listing?.latitude && listing?.longitude) {
      mapRef.current.animateToRegion({
        latitude: parseFloat(listing.latitude),
        longitude: parseFloat(listing.longitude),
        latitudeDelta: delta,
        longitudeDelta: delta,
      }, 500);
    }
  }, []);

  useEffect(() => {
    if (mapReady && hasTargetCoordinates && selectedListing) {
      focusMapOnListing(selectedListing, 0.02);
    }
  }, [focusMapOnListing, hasTargetCoordinates, mapReady, selectedListing]);

  const initializeMap = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to use the map.');
        if (hasTargetCoordinates) {
          const selectedTarget = {
            ...(targetParams.listing || {}),
            id: targetListingId || targetParams.listing?.id || 'selected-location',
            animal_type: targetAnimalType || 'animal',
            breed_name: targetParams.listing?.breed_name || 'Selected animal',
            latitude: targetLatitude,
            longitude: targetLongitude,
          };
          setListings([selectedTarget]);
          setSelectedListing(selectedTarget);
        }
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserLocation(coords);

      // Fetch nearby listings
      await fetchListings(coords.latitude, coords.longitude);
    } catch (error) {
      console.error('Error initializing map:', error);
      if (hasTargetCoordinates) {
        const selectedTarget = {
          ...(targetParams.listing || {}),
          id: targetListingId || targetParams.listing?.id || 'selected-location',
          animal_type: targetAnimalType || 'animal',
          breed_name: targetParams.listing?.breed_name || 'Selected animal',
          latitude: targetLatitude,
          longitude: targetLongitude,
        };
        setListings([selectedTarget]);
        setSelectedListing(selectedTarget);
      } else {
        Alert.alert('Error', 'Failed to get your location');
        // Default to India center
        setUserLocation({
          latitude: 20.5937,
          longitude: 78.9629,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchListings = async (lat, lng) => {
    try {
      setRefreshing(true);
      let allListings = [];

      // Try nearby listings first
      try {
        const nearbyResponse = await listingsService.getNearbyListings(lat, lng, 500, 100);
        if (nearbyResponse.success && nearbyResponse.data) {
          allListings = nearbyResponse.data;
        }
      } catch (e) {
        console.log('Nearby listings not available:', e);
      }

      // If no nearby listings, get featured listings
      if (allListings.length === 0) {
        try {
          const featuredResponse = await listingsService.getFeaturedListings(100);
          if (featuredResponse.success && featuredResponse.data) {
            allListings = featuredResponse.data;
          }
        } catch (e) {
          console.log('Featured listings not available:', e);
        }
      }

      // City coordinates mapping for animals without coordinates
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
        'shirala': { lat: 16.9833, lng: 74.1333 },
        'karad': { lat: 17.2862, lng: 74.1826 },
        'default': { lat: 18.5204, lng: 73.8567 }
      };

      // Process listings and add coordinates if missing
      const processedListings = allListings.map((listing, index) => {
        let listingLat = parseFloat(listing.latitude);
        let listingLng = parseFloat(listing.longitude);

        // If no coordinates, get from city
        if (isNaN(listingLat) || isNaN(listingLng)) {
          const city = (listing.city || '').toLowerCase().trim();
          const cityCoord = cityCoordinates[city] || cityCoordinates['default'];

          // Add offset to prevent stacking
          const offset = 0.01 + (index * 0.005);
          const angle = (index * 137.5) * (Math.PI / 180);

          listingLat = cityCoord.lat + (offset * Math.cos(angle));
          listingLng = cityCoord.lng + (offset * Math.sin(angle));
        }

        // Calculate distance
        let distance = listing.distance;
        if (!distance && lat && lng) {
          const R = 6371;
          const dLat = (listingLat - lat) * Math.PI / 180;
          const dLng = (listingLng - lng) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(lat * Math.PI / 180) * Math.cos(listingLat * Math.PI / 180) *
                    Math.sin(dLng/2) * Math.sin(dLng/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          distance = R * c;
        }

        return {
          ...listing,
          latitude: listingLat,
          longitude: listingLng,
          distance: distance
        };
      });

      // Sort by distance
      let sortedListings = processedListings.sort((a, b) =>
        (a.distance || 0) - (b.distance || 0)
      );

      if (hasTargetCoordinates) {
        const matchedTarget = targetListingId
          ? sortedListings.find((item) => {
              const idMatches = String(item.id) === String(targetListingId);
              const typeMatches = targetAnimalType
                ? String(item.animal_type).toLowerCase() === String(targetAnimalType).toLowerCase()
                : true;
              return idMatches && typeMatches;
            })
          : null;

        const routeTargetListing = matchedTarget || {
          ...(targetParams.listing || {}),
          id: targetListingId || targetParams.listing?.id || 'selected-location',
          animal_type: targetAnimalType || 'animal',
          breed_name: targetParams.listing?.breed_name || 'Selected animal',
          city: targetParams.listing?.city,
          state: targetParams.listing?.state,
          expected_price: targetParams.listing?.expected_price,
          seller: targetParams.listing?.seller,
        };

        const selectedTarget = {
          ...routeTargetListing,
          latitude: targetLatitude,
          longitude: targetLongitude,
        };

        if (matchedTarget) {
          sortedListings = sortedListings.map((item) =>
            String(item.id) === String(matchedTarget.id) ? selectedTarget : item
          );
        } else {
          sortedListings = [selectedTarget, ...sortedListings];
        }

        setSelectedListing(selectedTarget);
        setTimeout(() => focusMapOnListing(selectedTarget, 0.02), 300);
      }

      setListings(sortedListings);
      console.log(`Loaded ${sortedListings.length} animals on map`);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    if (userLocation) {
      fetchListings(userLocation.latitude, userLocation.longitude);
    }
  }, [userLocation]);

  const handleMarkerPress = (listing) => {
    setSelectedListing(listing);
    focusMapOnListing(listing);
  };

  const handleCall = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleWhatsApp = (phone, listing) => {
    if (phone) {
      const message = `Hi! I'm interested in your ${listing.animal_type} listing: "${listing.breed_name}" - ₹${formatPrice(listing.expected_price)}. Is it still available?`;
      const url = `whatsapp://send?phone=91${phone}&text=${encodeURIComponent(message)}`;
      Linking.openURL(url).catch(() => {
        Linking.openURL(`https://wa.me/91${phone}?text=${encodeURIComponent(message)}`);
      });
    }
  };

  const handleViewDetails = (listing) => {
    navigation.navigate('AnimalDetail', {
      animalType: listing.animal_type,
      id: listing.id,
    });
  };

  // Filter listings by type
  const filteredListings = filterType === 'all'
    ? listings
    : listings.filter(l => l.animal_type?.toLowerCase() === filterType);

  // Get unique animal types
  const animalTypes = [...new Set(listings.map(l => l.animal_type?.toLowerCase()))].filter(Boolean);

  // Fit map to show all markers
  const fitToMarkers = () => {
    if (mapRef.current && filteredListings.length > 0) {
      const coordinates = filteredListings
        .filter(l => l.latitude && l.longitude)
        .map(l => ({
          latitude: parseFloat(l.latitude),
          longitude: parseFloat(l.longitude),
        }));

      if (userLocation) {
        coordinates.push(userLocation);
      }

      if (coordinates.length > 0) {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 50, right: 50, bottom: 250, left: 50 },
          animated: true,
        });
      }
    }
  };

  const renderListingCard = ({ item }) => {
    const isSelected = selectedListing?.id === item.id;
    const markerColor = getMarkerColor(item.animal_type);
    const distanceColor = getDistanceColor(item.distance);

    return (
      <TouchableOpacity
        style={[styles.listingCard, isSelected && styles.selectedCard]}
        onPress={() => handleMarkerPress(item)}
        activeOpacity={0.9}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.animalIconCircle, { backgroundColor: `${markerColor}18` }]}>
              <MaterialCommunityIcons
                name={getAnimalMarkerIcon(item.animal_type)}
                size={24}
                color={markerColor}
              />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.breed_name || 'Unknown Breed'}
              </Text>
              <Text style={styles.cardType}>{item.animal_type}</Text>
            </View>
          </View>
          <Text style={styles.cardPrice}>₹{formatPrice(item.expected_price)}</Text>
        </View>

        {/* Details */}
        <View style={styles.cardDetails}>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={COLORS.gray} />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.city || 'Unknown'}{item.state ? `, ${item.state}` : ''}
            </Text>
            {item.distance !== undefined && (
              <Text style={[styles.distanceText, { color: distanceColor }]}>
                {Math.round(item.distance)} km
              </Text>
            )}
          </View>

          {/* Extra info row */}
          {item.milk_capacity && (
            <View style={styles.milkRow}>
              <Ionicons name="water-outline" size={14} color={COLORS.blue} />
              <Text style={styles.milkValueText}>{item.milk_capacity}L/day</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.callBtn}
            onPress={() => handleCall(item.seller?.phone)}
          >
            <Ionicons name="call" size={16} color={COLORS.white} />
            <Text style={styles.btnText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.whatsappBtn}
            onPress={() => handleWhatsApp(item.seller?.phone, item)}
          >
            <Ionicons name="logo-whatsapp" size={16} color={COLORS.white} />
            <Text style={styles.btnText}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.viewBtn}
            onPress={() => handleViewDetails(item)}
          >
            <Ionicons name="eye" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <CowLoader message="Loading map" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader
        navigation={navigation}
        title="Animal Map"
        subtitle={`${filteredListings.length} animals nearby`}
        rightActions={[
          {
            icon: 'refresh',
            onPress: handleRefresh,
            disabled: refreshing,
            color: COLORS.primary,
            accessibilityLabel: 'Refresh map',
          },
        ]}
      />

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: userLocation?.latitude || 20.5937,
            longitude: userLocation?.longitude || 78.9629,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          }}
          showsUserLocation
          showsMyLocationButton={false}
          onMapReady={() => {
            setMapReady(true);
            if (!hasTargetCoordinates && !targetListingId) {
              setTimeout(fitToMarkers, 500);
            }
          }}
        >
          {/* User location circle */}
          {userLocation && (
            <>
              <Circle
                center={userLocation}
                radius={1000}
                fillColor="rgba(25, 113, 194, 0.10)"
                strokeColor="rgba(25, 113, 194, 0.28)"
                strokeWidth={2}
              />
              <Marker
                coordinate={userLocation}
                identifier="user-location"
                zIndex={1000}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={styles.userMarkerOuter}>
                  <View style={styles.userMarkerInner}>
                    <View style={styles.userMarkerDot} />
                  </View>
                </View>
                <Callout tooltip>
                  <View style={styles.userCallout}>
                    <Text style={styles.userCalloutText}>Your location</Text>
                  </View>
                </Callout>
              </Marker>
            </>
          )}

          {/* Animal markers */}
          {filteredListings.map((listing) =>
            listing.latitude && listing.longitude ? (
              <Marker
                key={`${listing.animal_type}-${listing.id}`}
                coordinate={{
                  latitude: parseFloat(listing.latitude),
                  longitude: parseFloat(listing.longitude),
                }}
                onPress={() => handleMarkerPress(listing)}
                anchor={{ x: 0.5, y: 1 }}
              >
                <View style={styles.markerWrap}>
                  <View style={[
                    styles.customMarker,
                    selectedListing?.id === listing.id && styles.selectedCustomMarker,
                    { borderColor: getMarkerColor(listing.animal_type) }
                  ]}>
                    <MaterialCommunityIcons
                      name={getAnimalMarkerIcon(listing.animal_type)}
                      size={24}
                      color={getMarkerColor(listing.animal_type)}
                    />
                  </View>
                  <View style={[styles.markerPointer, { borderTopColor: getMarkerColor(listing.animal_type) }]} />
                </View>
                <Callout tooltip onPress={() => handleViewDetails(listing)}>
                  <View style={styles.calloutContainer}>
                    <View style={styles.calloutContent}>
                      <Text style={styles.calloutTitle} numberOfLines={1}>
                        {listing.breed_name || 'Unknown'}
                      </Text>
                      <Text style={styles.calloutPrice}>
                        ₹{formatPrice(listing.expected_price)}
                      </Text>
                      <View style={styles.calloutLocationRow}>
                        <Ionicons name="location-outline" size={12} color={COLORS.gray} />
                        <Text style={styles.calloutLocationText}>
                          {listing.city || 'Unknown'}
                          {listing.distance ? ` (${Math.round(listing.distance)} km)` : ''}
                        </Text>
                      </View>
                      <Text style={styles.calloutHint}>Tap for details</Text>
                    </View>
                    <View style={styles.calloutArrow} />
                  </View>
                </Callout>
              </Marker>
            ) : null
          )}
        </MapView>

        {/* Map Controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity
            style={styles.mapControlBtn}
            onPress={() => {
              if (userLocation && mapRef.current) {
                mapRef.current.animateToRegion({
                  ...userLocation,
                  latitudeDelta: 0.1,
                  longitudeDelta: 0.1,
                }, 500);
              }
            }}
          >
            <Ionicons name="locate" size={22} color={COLORS.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mapControlBtn}
            onPress={fitToMarkers}
          >
            <Ionicons name="expand" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Animal Count Badge */}
        <View style={styles.countBadge}>
          <View style={styles.countIcon}>
            <MaterialCommunityIcons name="map-marker-multiple" size={22} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.countNumber}>{filteredListings.length}</Text>
            <Text style={styles.countLabel}>on map</Text>
          </View>
        </View>
      </View>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity
            style={[
              styles.filterPill,
              filterType === 'all' && styles.filterPillActive
            ]}
            onPress={() => setFilterType('all')}
          >
            <Text style={[
              styles.filterText,
              filterType === 'all' && styles.filterTextActive
            ]}>
              All ({listings.length})
            </Text>
          </TouchableOpacity>

          {animalTypes.map(type => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterPill,
                filterType === type && styles.filterPillActive
              ]}
              onPress={() => setFilterType(type)}
            >
              <MaterialCommunityIcons
                name={getAnimalMarkerIcon(type)}
                size={16}
                color={filterType === type ? COLORS.white : getMarkerColor(type)}
              />
              <Text style={[
                styles.filterText,
                filterType === type && styles.filterTextActive
              ]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Listings Title */}
        <View style={styles.listingsHeader}>
          <Text style={styles.listingsTitle}>
            {filteredListings.length > 0 ? 'Nearest Animals' : 'No Animals Found'}
          </Text>
          {refreshing && (
            <View style={styles.refreshIndicator}>
              <Text style={styles.refreshText}>Updating...</Text>
            </View>
          )}
        </View>

        {/* Listings */}
        <FlatList
          data={filteredListings}
          keyExtractor={(item) => `${item.animal_type}-${item.id}`}
          renderItem={renderListingCard}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listingsContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <MaterialCommunityIcons name="map-marker-off-outline" size={42} color={COLORS.borderStrong} />
              </View>
              <Text style={styles.emptyText}>No animals found nearby</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={handleRefresh}>
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.gray,
  },
  refreshBtn: {
    padding: 8,
  },
  spinning: {
    transform: [{ rotate: '360deg' }],
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  markerWrap: {
    alignItems: 'center',
  },
  customMarker: {
    backgroundColor: COLORS.white,
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  selectedCustomMarker: {
    transform: [{ scale: 1.2 }],
    shadowOpacity: 0.4,
    elevation: 8,
  },
  markerPointer: {
    width: 0,
    height: 0,
    marginTop: -2,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  markerEmoji: {
    width: 0,
    height: 0,
    opacity: 0,
  },
  userMarkerOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(25, 113, 194, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(25, 113, 194, 0.30)',
  },
  userMarkerInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.blue,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  userMarkerDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: COLORS.white,
  },
  userCallout: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  userCalloutText: {
    color: COLORS.black,
    fontSize: 12,
    fontWeight: '700',
  },
  mapControls: {
    position: 'absolute',
    top: 16,
    right: 16,
    gap: 8,
  },
  mapControlBtn: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.white,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  countBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    gap: 8,
  },
  countEmoji: {
    width: 0,
    height: 0,
    opacity: 0,
  },
  countIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  countLabel: {
    fontSize: 10,
    color: COLORS.gray,
  },
  calloutContainer: {
    alignItems: 'center',
  },
  calloutContent: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 4,
  },
  calloutPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  calloutLocation: {
    width: 0,
    height: 0,
    opacity: 0,
  },
  calloutLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  calloutLocationText: {
    fontSize: 12,
    color: COLORS.gray,
    flexShrink: 1,
  },
  calloutHint: {
    fontSize: 10,
    color: COLORS.primary,
    fontStyle: 'italic',
  },
  calloutArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.white,
  },
  bottomSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: height * 0.4,
  },
  filterContainer: {
    maxHeight: 44,
    marginBottom: 12,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
    marginRight: 8,
    gap: 4,
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
  },
  filterEmoji: {
    fontSize: 14,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray,
  },
  filterTextActive: {
    color: COLORS.white,
  },
  listingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  listingsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  refreshIndicator: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  refreshText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  listingsContent: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  listingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 4,
    width: width * 0.75,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCard: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '08',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  animalEmoji: {
    width: 0,
    height: 0,
    opacity: 0,
  },
  animalIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.black,
  },
  cardType: {
    fontSize: 12,
    color: COLORS.gray,
    textTransform: 'capitalize',
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  cardDetails: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.gray,
    marginLeft: 4,
  },
  distanceText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  milkRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  milkText: {
    width: 0,
    height: 0,
    opacity: 0,
  },
  milkValueText: {
    fontSize: 12,
    color: COLORS.blue,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.blue,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 4,
  },
  whatsappBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 4,
  },
  viewBtn: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary + '20',
    borderRadius: 10,
  },
  btnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    width: width - 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    width: 0,
    height: 0,
    opacity: 0,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: '600',
  },
});

export default MapScreen;
