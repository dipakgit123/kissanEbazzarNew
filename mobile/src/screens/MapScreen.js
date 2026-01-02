import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS, formatPrice, getAnimalTypeIcon } from '../utils/constants';
import { listingsService } from '../services/api';

const { width, height } = Dimensions.get('window');

const MapScreen = ({ navigation }) => {
  const mapRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [listings, setListings] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeMap();
  }, []);

  const initializeMap = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to use the map.');
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
      const response = await listingsService.getNearbyListings(
        coords.latitude,
        coords.longitude,
        100,
        50
      );

      if (response.success && response.data) {
        setListings(response.data);
      }
    } catch (error) {
      console.error('Error initializing map:', error);
      Alert.alert('Error', 'Failed to get your location');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerPress = (listing) => {
    setSelectedListing(listing);
  };

  const handleCall = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleWhatsApp = (phone, listing) => {
    if (phone) {
      const message = `Hi! I'm interested in your ${listing.animal_type} listing: "${listing.breed_name}" - ₹${formatPrice(listing.expected_price)}`;
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

  const getDistanceColor = (distance) => {
    if (!distance) return COLORS.gray;
    if (distance < 20) return COLORS.green;
    if (distance < 50) return COLORS.yellow;
    if (distance < 100) return COLORS.primary;
    return COLORS.red;
  };

  const renderListingCard = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.listingCard,
        selectedListing?.id === item.id && styles.selectedCard,
      ]}
      onPress={() => {
        setSelectedListing(item);
        if (item.latitude && item.longitude) {
          mapRef.current?.animateToRegion({
            latitude: parseFloat(item.latitude),
            longitude: parseFloat(item.longitude),
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          });
        }
      }}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.animalEmoji}>{getAnimalTypeIcon(item.animal_type)}</Text>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.breed_name || 'Unknown Breed'}
          </Text>
          <Text style={styles.cardType}>{item.animal_type}</Text>
        </View>
        <Text style={styles.cardPrice}>₹{formatPrice(item.expected_price)}</Text>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={COLORS.gray} />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.city || 'Unknown'}
          </Text>
          {item.distance && (
            <Text style={[styles.distanceText, { color: getDistanceColor(item.distance) }]}>
              {Math.round(item.distance)} km
            </Text>
          )}
        </View>
      </View>

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading Map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>Animal Map</Text>
          <Text style={styles.subtitle}>Find animals near you</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={initializeMap}
        >
          <Ionicons name="refresh" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: userLocation?.latitude || 20.5937,
            longitude: userLocation?.longitude || 78.9629,
            latitudeDelta: 0.5,
            longitudeDelta: 0.5,
          }}
          showsUserLocation
          showsMyLocationButton
        >
          {listings.map((listing) =>
            listing.latitude && listing.longitude ? (
              <Marker
                key={`${listing.animal_type}-${listing.id}`}
                coordinate={{
                  latitude: parseFloat(listing.latitude),
                  longitude: parseFloat(listing.longitude),
                }}
                onPress={() => handleMarkerPress(listing)}
              >
                <View style={[
                  styles.markerContainer,
                  selectedListing?.id === listing.id && styles.selectedMarker,
                ]}>
                  <Text style={styles.markerEmoji}>{getAnimalTypeIcon(listing.animal_type)}</Text>
                </View>
              </Marker>
            ) : null
          )}
        </MapView>

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Nearby Animals: {listings.length}</Text>
        </View>
      </View>

      {/* Listings List */}
      <View style={styles.listingsContainer}>
        <Text style={styles.listingsTitle}>
          {listings.length > 0 ? 'Nearest Animals' : 'No Animals Found'}
        </Text>
        <FlatList
          data={listings}
          keyExtractor={(item) => `${item.animal_type}-${item.id}`}
          renderItem={renderListingCard}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listingsContent}
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.gray,
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
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    backgroundColor: COLORS.white,
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  selectedMarker: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryDark,
  },
  markerEmoji: {
    fontSize: 20,
  },
  legend: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
  },
  listingsContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  listingsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  listingsContent: {
    paddingHorizontal: 12,
  },
  listingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 4,
    width: width * 0.75,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedCard: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  animalEmoji: {
    fontSize: 28,
    marginRight: 10,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
  },
  cardType: {
    fontSize: 12,
    color: COLORS.gray,
    textTransform: 'capitalize',
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  cardDetails: {
    marginBottom: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 4,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: 'bold',
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
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  whatsappBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  viewBtn: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary + '20',
    borderRadius: 8,
  },
  btnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default MapScreen;
