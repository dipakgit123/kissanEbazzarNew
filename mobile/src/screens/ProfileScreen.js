import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import { userService, listingsService } from '../services/api';

const { width } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user, updateUser, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [myListings, setMyListings] = useState([]);
  const [showListings, setShowListings] = useState(false);
  const [loadingListings, setLoadingListings] = useState(false);
  const scrollViewRef = useRef(null);
  const pincodeInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    fullName: user?.full_name || '',
    email: user?.email || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    pincode: user?.postal_code || '',
    profilePhoto: user?.profile_photo || null,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.full_name || '',
        email: user.email || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        pincode: user.postal_code || '',
        profilePhoto: user.profile_photo || null,
      });
    }
  }, [user]);

  // Refresh profile data on screen focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      try {
        const response = await userService.getProfile();
        if (response.success && response.user) {
          await updateUser(response.user);
        }
        // Load listings
        loadMyListings();
      } catch (error) {
        console.error('Error refreshing profile:', error);
      }
    });

    return unsubscribe;
  }, [navigation]);

  // Load user's listings
  const loadMyListings = async () => {
    // Only load if user is authenticated
    if (!user) {
      setLoadingListings(false);
      return;
    }
    
    setLoadingListings(true);
    try {
      const response = await userService.getMyListings();
      if (response.success && response.listings) {
        setMyListings(response.listings);
      }
    } catch (error) {
      console.error('Error loading listings:', error);
      // Don't show error if it's just authentication issue
      if (error.message !== 'No token provided. Authorization header required.') {
        // Handle other errors if needed
      }
    } finally {
      setLoadingListings(false);
    }
  };

  // Load listings on mount
  useEffect(() => {
    loadMyListings();
  }, []);

  const handleMarkAsSold = async (listing) => {
    Alert.alert(
      t('profile.markAsSold'),
      t('profile.markAsSoldConfirm', { breed: listing.breed_name || listing.breed }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('profile.markAsSold'),
          style: 'destructive',
          onPress: async () => {
            try {
              const animalType = listing.animal_type || listing.type;
              const response = await listingsService.markListingAsSold(animalType, listing.id);
              
              if (response.success) {
                Alert.alert(t('common.success'), t('profile.markAsSoldSuccess'));
                // Reload listings to show updated status
                await loadMyListings();
              } else {
                Alert.alert(t('common.error'), response.message || t('profile.markAsSoldError'));
              }
            } catch (error) {
              console.error('Error marking as sold:', error);
              Alert.alert(t('common.error'), error.message || t('profile.markAsSoldError'));
            }
          },
        },
      ]
    );
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('profile.permissionRequired'), t('profile.allowPhotoAccess'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadProfilePhoto(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('profile.permissionRequired'), t('profile.allowCameraAccess'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadProfilePhoto(result.assets[0]);
    }
  };

  const uploadProfilePhoto = async (photo) => {
    setUploadingPhoto(true);
    try {
      console.log('Uploading photo:', photo.uri);
      const response = await userService.uploadProfilePhoto(photo.uri);
      console.log('Upload response:', response);
      
      if (response.success && response.user) {
        // Update context with new user data
        await updateUser(response.user);
        
        // Update form data
        setFormData(prev => ({ 
          ...prev, 
          profilePhoto: response.user.profile_photo 
        }));
        
        Alert.alert(t('common.success'), t('profile.photoUpdated'));
      } else {
        Alert.alert(t('common.error'), response.message || t('errors.uploadFailed'));
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      let errorMessage = 'Failed to upload photo';
      
      if (error.message === 'Network Error') {
        errorMessage = 'Network error. Please check:\n• WiFi/mobile data is on\n• Server is running\n• Correct IP address in settings';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Upload Failed', errorMessage);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const deleteProfilePhoto = async () => {
    Alert.alert(
      t('profile.removePhoto'),
      t('profile.removePhotoConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            setUploadingPhoto(true);
            try {
              console.log('Deleting photo...');
              const response = await userService.deleteProfilePhoto();
              console.log('Delete response:', response);
              
              if (response.success && response.user) {
                // Update context with new user data
                await updateUser(response.user);
                
                // Update form data
                setFormData(prev => ({ 
                  ...prev, 
                  profilePhoto: null 
                }));
                
                Alert.alert(t('common.success'), t('profile.photoRemoved'));
              } else {
                Alert.alert(t('common.error'), response.message || t('errors.uploadFailed'));
              }
            } catch (error) {
              console.error('Delete photo error:', error);
              Alert.alert(t('common.error'), error.message || t('errors.uploadFailed'));
            } finally {
              setUploadingPhoto(false);
            }
          },
        },
      ]
    );
  };

  const showPhotoOptions = () => {
    const options = [
      { text: t('profile.takePhoto'), onPress: takePhoto },
      { text: t('profile.chooseLibrary'), onPress: pickImage },
    ];

    if (formData.profilePhoto) {
      options.push({ text: t('profile.removePhoto'), onPress: deleteProfilePhoto, style: 'destructive' });
    }

    options.push({ text: t('common.cancel'), style: 'cancel' });

    Alert.alert(t('profile.photoOptions'), t('profile.chooseOption'), options);
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.fullName.trim()) {
      Alert.alert(t('common.error'), t('profile.nameRequired'));
      return;
    }

    // Validate email if provided
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        Alert.alert(t('common.error'), t('profile.invalidEmail'));
        return;
      }
    }

    // Validate pincode if provided
    if (formData.pincode && formData.pincode.trim() && formData.pincode.trim().length !== 6) {
      Alert.alert(t('common.error'), t('profile.invalidPincode'));
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        full_name: formData.fullName.trim(),
        email: formData.email?.trim() || '',
        address: formData.address?.trim() || '',
        city: formData.city?.trim() || '',
        state: formData.state?.trim() || '',
        postal_code: formData.pincode?.trim() || '',
      };

      console.log('Updating profile with:', updateData);
      const response = await userService.updateProfile(updateData);
      console.log('Update response:', response);
      
      if (response.success && response.user) {
        // Update context with new user data
        await updateUser(response.user);
        
        // Update form data with returned values
        setFormData({
          fullName: response.user.full_name || '',
          email: response.user.email || '',
          address: response.user.address || '',
          city: response.user.city || '',
          state: response.user.state || '',
          pincode: response.user.postal_code || '',
          profilePhoto: response.user.profile_photo || null,
        });
        
        setEditing(false);
        
        // Show success message with location update if pincode changed
        if (response.user.city && response.user.state) {
          Alert.alert(
            t('common.success'), 
            t('profile.profileUpdateLocation', { city: response.user.city, state: response.user.state })
          );
        } else {
          Alert.alert(t('common.success'), t('profile.profileUpdateSuccess'));
        }
      } else {
        Alert.alert(t('common.error'), response.message || t('profile.profileUpdateError'));
      }
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert(t('common.error'), error.message || t('profile.profileUpdateError'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: user?.full_name || '',
      email: user?.email || '',
      address: user?.address || '',
      city: user?.city || '',
      state: user?.state || '',
      pincode: user?.postal_code || '',
      profilePhoto: user?.profile_photo || null,
    });
    setEditing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      t('common.logout'),
      t('profile.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.logout'), style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleShareApp = async () => {
    try {
      const message = 'Check out Kissan eBazaar - Buy and Sell Animals Online!\n\n' +
                     'Download the app now:\n' +
                     'Android: https://play.google.com/store/apps/details?id=com.kissanebazaar\n' +
                     'iOS: https://apps.apple.com/app/kissan-ebazaar/id123456789';
      
      const result = await Share.share({
        message: message,
        title: 'Kissan eBazaar App',
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('Shared via:', result.activityType);
        } else {
          console.log('App shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share the app');
      console.error('Error sharing app:', error);
    }
  };

  const getAnimalEmoji = (type) => {
    const emojiMap = {
      cow: '🐄',
      buffalo: '🐃',
      goat: '🐐',
      sheep: '🐑',
      horse: '🐴',
      dog: '🐕',
      cat: '🐱',
      pig: '🐷',
    };
    return emojiMap[type?.toLowerCase()] || '🐾';
  };

  const renderMenuItem = (icon, title, subtitle, onPress, rightIcon = 'chevron-forward') => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuIconContainer}>
        <Ionicons name={icon} size={22} color={COLORS.primary} />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name={rightIcon} size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
        {!editing ? (
          <TouchableOpacity onPress={() => setEditing(true)}>
            <Ionicons name="create" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            {uploadingPhoto ? (
              <View style={styles.profileImagePlaceholder}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : formData.profilePhoto ? (
              <Image source={{ uri: formData.profilePhoto }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={50} color="#9CA3AF" />
              </View>
            )}
            <TouchableOpacity style={styles.cameraButton} onPress={showPhotoOptions}>
              <Ionicons name="camera" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{user?.full_name || 'User'}</Text>
          <Text style={styles.userPhone}>{user?.phone_number}</Text>
        </View>

        {editing ? (
          /* Edit Form */
          <View style={styles.editSection}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('profile.fullName')} *</Text>
              <TextInput
                style={styles.input}
                value={formData.fullName}
                onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                placeholder={t('profile.enterFullName')}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('profile.email')}</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder={t('profile.enterEmail')}
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('profile.address')}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                placeholder={t('profile.enterAddress')}
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>{t('profile.city')}</Text>
                <TextInput
                  style={styles.input}
                  value={formData.city}
                  onChangeText={(text) => setFormData({ ...formData, city: text })}
                  placeholder={t('profile.enterCity')}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>{t('profile.state')}</Text>
                <TextInput
                  style={styles.input}
                  value={formData.state}
                  onChangeText={(text) => setFormData({ ...formData, state: text })}
                  placeholder={t('profile.enterState')}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('profile.pincode')}</Text>
              <TextInput
                ref={pincodeInputRef}
                style={styles.input}
                value={formData.pincode}
                onChangeText={(text) => setFormData({ ...formData, pincode: text })}
                placeholder={t('profile.enterPincode')}
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                maxLength={6}
                returnKeyType="done"
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 300);
                }}
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton, loading && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>{t('profile.saveChanges')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Profile Menu */
          <>
            {/* My Listings Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('profile.myListings')}</Text>
              <View style={styles.menuContainer}>
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => setShowListings(!showListings)}
                >
                  <View style={styles.menuIconContainer}>
                    <Ionicons name="pricetags" size={20} color={COLORS.primary} />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={styles.menuTitle}>{t('profile.myListings')}</Text>
                    <Text style={styles.menuSubtitle}>
                      {loadingListings ? t('common.loading') : `${myListings.length} ${t('profile.animalsListed')}`}
                    </Text>
                  </View>
                  <Ionicons 
                    name={showListings ? "chevron-up" : "chevron-forward"} 
                    size={20} 
                    color="#9CA3AF" 
                  />
                </TouchableOpacity>
              </View>

              {/* Expanded Listings View */}
              {showListings && (
                <View style={styles.expandedListingsContainer}>
                  {loadingListings ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color={COLORS.primary} />
                      <Text style={styles.loadingText}>{t('profile.loadingListings')}</Text>
                    </View>
                  ) : myListings.length > 0 ? (
                    <View style={styles.listingsContainer}>
                      {myListings.map((listing) => {
                        const imageUrl = listing.front_photo || listing.frontPhoto || listing.photo1 || listing.photos?.[0];
                        const breedName = listing.breed_name || listing.breedName || listing.breed || listing.name || 'Unknown Breed';
                        const price = listing.expected_price || listing.expectedPrice || listing.price || 0;
                        const animalType = listing.animal_type || listing.type || 'animal';
                        const milkCapacity = listing.milk_capacity || listing.milkCapacity;
                        const age = listing.age;
                        const city = listing.city;
                        const state = listing.state;

                        return (
                          <TouchableOpacity
                            key={`${listing.type}-${listing.id}`}
                            style={styles.myListingCard}
                            onPress={() => navigation.navigate('AnimalDetail', { 
                              animalType: animalType,
                              id: listing.id
                            })}
                            activeOpacity={0.8}
                          >
                            {/* Image Section */}
                            <View style={styles.myListingImageContainer}>
                              {imageUrl ? (
                                <Image source={{ uri: imageUrl }} style={styles.myListingImage} />
                              ) : (
                                <View style={styles.myListingPlaceholder}>
                                  <Text style={styles.myListingPlaceholderEmoji}>
                                    {getAnimalEmoji(animalType)}
                                  </Text>
                                </View>
                              )}
                              
                              {/* Status Badge */}
                              {listing.status && (
                                <View style={[styles.statusBadge, { 
                                  backgroundColor: listing.status === 'active' ? '#10B981' : 
                                                  listing.status === 'sold' ? '#EF4444' : '#F59E0B' 
                                }]}>
                                  <Text style={styles.statusText}>
                                    {t(`profile.${listing.status}`)?.toUpperCase()}
                                  </Text>
                                </View>
                              )}
                            </View>

                            {/* Content Section */}
                            <View style={styles.myListingContent}>
                              {/* Top Row: Type & Price */}
                              <View style={styles.myListingTopRow}>
                                <View style={styles.myListingTypeBadge}>
                                  <Text style={styles.myListingTypeText}>
                                    {animalType.charAt(0).toUpperCase() + animalType.slice(1)}
                                  </Text>
                                </View>
                                <Text style={styles.myListingPrice}>₹{price?.toLocaleString()}</Text>
                              </View>

                              {/* Breed Name */}
                              <Text style={styles.myListingBreedName} numberOfLines={2}>
                                {breedName}
                              </Text>

                              {/* Info Row */}
                              <View style={styles.myListingInfoRow}>
                                {milkCapacity && (
                                  <View style={styles.myListingInfoItem}>
                                    <Ionicons name="water" size={14} color="#3B82F6" />
                                    <Text style={styles.myListingInfoText}>{milkCapacity}L/day</Text>
                                  </View>
                                )}
                                {age && (
                                  <View style={styles.myListingInfoItem}>
                                    <Ionicons name="time-outline" size={14} color="#10B981" />
                                    <Text style={styles.myListingInfoText}>{age}</Text>
                                  </View>
                                )}
                              </View>

                              {/* Location */}
                              <View style={styles.myListingLocation}>
                                <Ionicons name="location-outline" size={14} color="#6B7280" />
                                <Text style={styles.myListingLocationText} numberOfLines={1}>
                                  {[city, state].filter(Boolean).join(', ') || t('profile.locationNotSpecified')}
                                </Text>
                              </View>

                              {/* Mark as Sold Button */}
                              {listing.status === 'active' && (
                                <TouchableOpacity
                                  style={styles.markSoldButton}
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsSold(listing);
                                  }}
                                  activeOpacity={0.7}
                                >
                                  <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                                  <Text style={styles.markSoldButtonText}>{t('profile.markAsSold')}</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : (
                    <View style={styles.emptyListings}>
                      <Ionicons name="list" size={48} color="#D1D5DB" />
                      <Text style={styles.emptyText}>{t('profile.noListingsYet')}</Text>
                      <Text style={styles.emptySubtext}>{t('profile.noListingsDesc')}</Text>
                      <TouchableOpacity 
                        style={styles.addListingButton}
                        onPress={() => navigation.navigate('SellAnimal')}
                      >
                        <Ionicons name="pricetag" size={20} color="#fff" />
                        <Text style={styles.addListingText}>{t('profile.addListing')}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* My Activity */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('profile.myActivity')}</Text>
              <View style={styles.menuContainer}>
                {renderMenuItem('heart', t('profile.wishlist'), t('profile.wishlistDesc'), () => navigation.navigate('Wishlist'))}
                {renderMenuItem('calendar', t('profile.myAppointments'), t('profile.myAppointmentsDesc'), () => navigation.navigate('MyAppointments'))}
                {renderMenuItem('call', t('profile.callHistory'), t('profile.callHistoryDesc'), () => navigation.navigate('CallHistory'))}
              </View>
            </View>

            {/* Settings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('profile.settings')}</Text>
              <View style={styles.menuContainer}>
                {renderMenuItem('location', t('profile.locationSetup'), t('profile.locationSetupDesc'), () => navigation.navigate('LocationSetup'))}
                {renderMenuItem('notifications', t('profile.notifications'), t('profile.notificationsDesc'), () => navigation.navigate('NotificationSettings'))}
                {renderMenuItem('language', t('profile.language'), 'English', () => {})}
                {renderMenuItem('shield-checkmark', t('profile.privacyPolicy'), '', () => navigation.navigate('LegalDocument', { type: 'privacy' }))}
                {renderMenuItem('document-text', t('profile.termsConditions'), '', () => navigation.navigate('LegalDocument', { type: 'terms' }))}
              </View>
            </View>

            {/* Support */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('profile.support')}</Text>
              <View style={styles.menuContainer}>
                {renderMenuItem('help-circle', t('profile.helpSupport'), t('profile.helpSupportDesc'), () => {})}
                {renderMenuItem('star', t('profile.rateUs'), t('profile.rateUsDesc'), () => {})}
                {renderMenuItem('share-social', t('profile.shareApp'), t('profile.shareAppDesc'), handleShareApp)}
                {renderMenuItem('information-circle', t('profile.about'), t('profile.aboutDesc'), () => {})}
              </View>
            </View>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out" size={22} color="#EF4444" />
              <Text style={styles.logoutText}>{t('common.logout')}</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </>
        )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 15,
    color: '#6B7280',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  listingsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 10,
  },
  editSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1F2937',
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 30,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    marginLeft: 8,
  },
  buttonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  // My Listings - Full Width Card Styles (matches Wishlist)
  expandedListingsContainer: {
    marginTop: 16,
  },
  listingsContainer: {
    marginTop: 0,
  },
  myListingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  myListingImageContainer: {
    width: '100%',
    height: 220,
    position: 'relative',
    backgroundColor: '#F3F4F6',
  },
  myListingImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  myListingPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  myListingPlaceholderEmoji: {
    fontSize: 64,
    opacity: 0.5,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  myListingContent: {
    padding: 16,
  },
  myListingTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  myListingTypeBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  myListingTypeText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  myListingPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
  },
  myListingBreedName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
    lineHeight: 24,
  },
  myListingInfoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  myListingInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 5,
  },
  myListingInfoText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  myListingLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  myListingLocationText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  emptyListings: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  addListingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  addListingText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  markSoldButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  markSoldButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
});

export default ProfileScreen;
