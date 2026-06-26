import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import { COLORS } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api';
import AppHeader from '../components/AppHeader';

const LocationSetupScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  
  const [formData, setFormData] = useState({
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    pincode: user?.pincode || '',
    latitude: user?.latitude || '',
    longitude: user?.longitude || '',
  });

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), t('locationSetup.permissionDenied'));
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setFormData(prev => ({
        ...prev,
        latitude: location.coords.latitude.toFixed(6),
        longitude: location.coords.longitude.toFixed(6),
      }));

      // Reverse geocode to get address
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        setFormData(prev => ({
          ...prev,
          city: address.city || prev.city,
          state: address.region || prev.state,
          pincode: address.postalCode || prev.pincode,
          address: `${address.street || ''}, ${address.name || ''}`.trim(),
        }));
      }

      Alert.alert(t('common.success'), t('locationSetup.locationCaptured'));
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert(t('common.error'), t('locationSetup.locationError'));
    } finally {
      setGettingLocation(false);
    }
  };

  const handleSave = async () => {
    if (!formData.address || !formData.city || !formData.state) {
      Alert.alert(t('common.error'), t('locationSetup.fillRequired'));
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      Alert.alert(t('common.error'), t('locationSetup.setCoordinates'));
      return;
    }

    setLoading(true);
    try {
      const response = await userService.updateLocation(formData);
      if (response.success) {
        await updateUser(response.user);
        Alert.alert(t('common.success'), t('locationSetup.locationUpdated'), [
          { text: t('common.ok'), onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      Alert.alert(t('common.error'), error.message || t('errors.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        navigation={navigation}
        title={t('locationSetup.title')}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={24} color={COLORS.primary} />
          <Text style={styles.infoBannerText}>
            {t('locationSetup.infoMessage')}
          </Text>
        </View>

        {/* Auto Location Button */}
        <TouchableOpacity
          style={styles.autoLocationButton}
          onPress={getCurrentLocation}
          disabled={gettingLocation}
        >
          {gettingLocation ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="navigate" size={22} color="#fff" />
              <Text style={styles.autoLocationText}>{t('locationSetup.useCurrentLocation')}</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t('locationSetup.orEnterManually')}</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Manual Entry Form */}
        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('locationSetup.addressLabel')} *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={t('locationSetup.addressPlaceholder')}
              placeholderTextColor="#9CA3AF"
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>{t('locationSetup.cityLabel')} *</Text>
              <TextInput
                style={styles.input}
                placeholder={t('locationSetup.cityLabel')}
                placeholderTextColor="#9CA3AF"
                value={formData.city}
                onChangeText={(text) => setFormData({ ...formData, city: text })}
              />
            </View>

            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>{t('locationSetup.stateLabel')} *</Text>
              <TextInput
                style={styles.input}
                placeholder={t('locationSetup.stateLabel')}
                placeholderTextColor="#9CA3AF"
                value={formData.state}
                onChangeText={(text) => setFormData({ ...formData, state: text })}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('locationSetup.pincodeLabel')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('locationSetup.pincodePlaceholder')}
              placeholderTextColor="#9CA3AF"
              value={formData.pincode}
              onChangeText={(text) => setFormData({ ...formData, pincode: text })}
              keyboardType="numeric"
              maxLength={6}
            />
          </View>

          <View style={styles.coordinatesSection}>
            <Text style={styles.coordinatesTitle}>{t('locationSetup.gpsCoordinates')} *</Text>
            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>{t('locationSetup.latitude')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('locationSetup.latitude')}
                  placeholderTextColor="#9CA3AF"
                  value={formData.latitude}
                  onChangeText={(text) => setFormData({ ...formData, latitude: text })}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>{t('locationSetup.longitude')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('locationSetup.longitude')}
                  placeholderTextColor="#9CA3AF"
                  value={formData.longitude}
                  onChangeText={(text) => setFormData({ ...formData, longitude: text })}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Location Preview */}
          {formData.latitude && formData.longitude && (
            <View style={styles.locationPreview}>
              <Ionicons name="location" size={20} color={COLORS.primary} />
              <Text style={styles.locationPreviewText}>
                {t('locationSetup.location')}: {formData.latitude}, {formData.longitude}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>{t('locationSetup.saveLocation')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary + '15',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    lineHeight: 20,
  },
  autoLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  autoLocationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 10,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginHorizontal: 16,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#1F2937',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  coordinatesSection: {
    marginBottom: 20,
  },
  coordinatesTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  locationPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  locationPreviewText: {
    fontSize: 13,
    color: '#374151',
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default LocationSetupScreen;
