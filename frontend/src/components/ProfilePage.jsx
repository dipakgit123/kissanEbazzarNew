import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import EditProfileForm from './EditProfileForm';
import CallHistory from './CallHistory';
import { userService, listingsService } from '../services/api';
import { API_BASE_URL } from '../config/api';
import { SUPPORT_WHATSAPP_NUMBER, SUPPORT_WHATSAPP_MESSAGE } from '../config/support';
import toast from 'react-hot-toast';
import { safeJsonParse } from '../utils/stringUtils';
import { InlineLoader } from './AppLoader';
import { useWishlist } from '../contexts/useWishlist';
import { localizeApiMessage } from '../utils/localizeApiMessage';

const FALLBACK_ANIMAL_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23f0f0f0" width="80" height="80"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="10" dy="4" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';

const ProfilePage = ({ onBack }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { wishlist } = useWishlist();
  const [editing, setEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [user, setUser] = useState({
    name: '',
    location: '',
    phone: '',
    address: '',
    postal_code: '',
    city: '',
    state: '',
    completion: 0,
  });

  const [animalListings, setAnimalListings] = useState([]);
  const [buffaloListings, setBuffaloListings] = useState([]);
  const [catListings, setCatListings] = useState([]);
  const [dogListings, setDogListings] = useState([]);
  const [goatListings, setGoatListings] = useState([]);
  const [horseListings, setHorseListings] = useState([]);
  const [otherListings, setOtherListings] = useState([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showMyAnimals, setShowMyAnimals] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showCallHistory, setShowCallHistory] = useState(false);
  const [callHistoryTab, setCallHistoryTab] = useState('all');
  const [markingSoldId, setMarkingSoldId] = useState(null);
  const likedAnimals = Array.isArray(wishlist) ? wishlist : [];

  const formatProfileLocation = useCallback((userData) => {
    const address = userData?.address?.trim();
    const city = userData?.city?.trim();
    const state = userData?.state?.trim();
    const postalCode = userData?.postal_code?.trim();

    const locationParts = [];
    if (address) locationParts.push(address);
    if (city) locationParts.push(city);
    if (state && state !== city) locationParts.push(state);
    if (postalCode) locationParts.push(postalCode);

    return locationParts.length > 0 ? locationParts.join(', ') : t('profile.locationNotSet');
  }, [t]);

  const buildUserViewModel = useCallback((userData) => {
    let completion = 0;
    if (userData?.full_name) completion += 20;
    if (userData?.phone_number) completion += 20;
    if (userData?.address) completion += 20;
    if (userData?.postal_code) completion += 20;
    if (userData?.profile_photo) completion += 20;

    return {
      name: userData?.full_name || t('profile.user'),
      full_name: userData?.full_name || '',
      location: formatProfileLocation(userData),
      phone: userData?.phone_number || '',
      phone_number: userData?.phone_number || '',
      address: userData?.address || '',
      postal_code: userData?.postal_code || '',
      city: userData?.city || '',
      state: userData?.state || '',
      country: userData?.country || 'India',
      latitude: userData?.latitude || '',
      longitude: userData?.longitude || '',
      profile_photo: userData?.profile_photo || null,
      completion,
    };
  }, [formatProfileLocation, t]);

  const getTotalListings = () => {
    return animalListings.length + buffaloListings.length + catListings.length +
           dogListings.length + goatListings.length + horseListings.length +
           otherListings.length;
  };

  const handleMessageUs = () => {
    if (!SUPPORT_WHATSAPP_NUMBER) {
      toast.error(t('profile.supportWhatsAppMissing') || 'Support WhatsApp number not configured');
      return;
    }
    const message = t('profile.supportWhatsAppMessage') || SUPPORT_WHATSAPP_MESSAGE;
    const whatsappUrl = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const openCallHistory = (tab) => {
    setCallHistoryTab(tab);
    setShowCallHistory(true);
  };

  const fetchUserProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const response = await userService.getProfile();
      if (response.success && response.user) {
        setUser(buildUserViewModel(response.user));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setProfileLoading(false);
    }
  }, [buildUserViewModel]);


  const fetchAllListings = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('token');

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // Use the combined API endpoint to fetch all listings at once
      const response = await listingsService.getMyListings();
      console.log('API Response:', response);
      console.log('Listings:', response.listings);
      
      if (response.success) {
        const listings = response.listings || [];
        
        // Separate listings by type
        const cows = listings.filter(l => l.animal_type === 'cow' || l.type === 'cow');
        const buffalos = listings.filter(l => l.animal_type === 'buffalo' || l.type === 'buffalo');
        const cats = listings.filter(l => l.animal_type === 'cat' || l.type === 'cat');
        const dogs = listings.filter(l => l.animal_type === 'dog' || l.type === 'dog');
        const goats = listings.filter(l => l.animal_type === 'goat' || l.type === 'goat');
        const horses = listings.filter(l => l.animal_type === 'horse' || l.type === 'horse');
        const others = listings.filter(l => l.animal_type === 'other' || l.type === 'other');
        
        setAnimalListings(cows);
        setBuffaloListings(buffalos);
        setCatListings(cats);
        setDogListings(dogs);
        setGoatListings(goats);
        setHorseListings(horses);
        setOtherListings(others);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
      // Set empty arrays on error
      setAnimalListings([]);
      setBuffaloListings([]);
      setCatListings([]);
      setDogListings([]);
      setGoatListings([]);
      setHorseListings([]);
      setOtherListings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserProfile();
    const timer = setTimeout(() => {
      fetchAllListings();
    }, 100);

    return () => clearTimeout(timer);
  }, [fetchAllListings, fetchUserProfile]);

  const handleSaveProfile = async (profileData) => {
    try {
      setSavingProfile(true);
      const response = await userService.updateProfile(profileData);

      if (response?.success && response?.user) {
        localStorage.setItem('userData', JSON.stringify(response.user));
        setUser(buildUserViewModel(response.user));
        await fetchUserProfile();
        setEditing(false);
        toast.success(t('profile.updateSuccess') || 'Profile updated successfully');
      } else {
        toast.error(
          localizeApiMessage(
            i18n,
            t,
            response?.message,
            'profile.updateFailed',
            'Failed to update profile.'
          )
        );
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(t('profile.updateFailed') || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePhotoUpdate = (photoUrl) => {
    if (typeof photoUrl === 'undefined') {
      fetchUserProfile();
      return;
    }

      setUser(prev => {
      const updated = { ...prev, profile_photo: photoUrl };
      const completion =
        (updated.full_name ? 20 : 0) +
        (updated.phone_number ? 20 : 0) +
        (updated.address ? 20 : 0) +
        (updated.postal_code ? 20 : 0) +
        (updated.profile_photo ? 20 : 0);
      return { ...updated, completion };
    });

    const saved = localStorage.getItem('userData');
    if (saved) {
      const userData = safeJsonParse(saved, {});
      if (userData && typeof userData === 'object') {
        localStorage.setItem('userData', JSON.stringify({ ...userData, profile_photo: photoUrl }));
      }
    }
  };

  const getListingEndpoint = (listingType) => {
    const type = (listingType || 'cow').toLowerCase();
    const map = {
      cow: 'animals',
      buffalo: 'buffalos',
      goat: 'goats',
      horse: 'horses',
      cat: 'cats',
      dog: 'dogs',
      other: 'other-animals'
    };
    return map[type] || 'animals';
  };

  const handleDeleteListing = async (listingId, listingType) => {
    if (!listingId) return;
    const confirmMessage = t('profile.deleteConfirm') || 'Are you sure you want to delete this listing?';
    if (!window.confirm(confirmMessage)) return;

    try {
      const token = localStorage.getItem('token');
      const endpoint = getListingEndpoint(listingType);
      const response = await axios.delete(`${API_BASE_URL}/api/${endpoint}/listings/${listingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response?.data?.success) {
        setShowDeleteConfirm(null);
        if (selectedAnimal?.id === listingId) {
          setSelectedAnimal(null);
        }
        await fetchAllListings();
        toast.success(t('profile.deleteSuccess') || 'Listing deleted successfully');
      } else {
        toast.error(
          localizeApiMessage(
            i18n,
            t,
            response?.data?.message,
            'profile.deleteFailed',
            'Failed to delete listing'
          )
        );
      }
    } catch (error) {
      console.error('Error deleting listing:', error);
      toast.error(t('profile.deleteFailed') || 'Failed to delete listing');
    }
  };

  const getListingType = (listing) => {
    return (listing?.animal_type || listing?.type || 'cow').toLowerCase();
  };

  const isListingSold = (listing) => {
    return (listing?.status || '').toLowerCase() === 'sold';
  };

  const handleMarkAsSold = async (listingId, listingType) => {
    if (!listingId) return;
    const confirmMessage = t('profile.markSoldConfirm') || 'Mark this listing as sold?';
    if (!window.confirm(confirmMessage)) return;

    try {
      setMarkingSoldId(listingId);
      const type = (listingType || 'cow').toLowerCase();
      const response = await listingsService.markListingAsSold(type, listingId);

      if (response?.success) {
        if (selectedAnimal?.id === listingId) {
          setSelectedAnimal(prev => (prev ? { ...prev, status: 'sold' } : prev));
        }
        await fetchAllListings();
        toast.success(t('profile.markSoldSuccess') || 'Listing marked as sold.');
      } else {
        toast.error(
          localizeApiMessage(
            i18n,
            t,
            response?.message,
            'profile.markSoldFailed',
            'Failed to mark as sold.'
          )
        );
      }
    } catch (error) {
      console.error('Error marking listing as sold:', error);
      toast.error(t('profile.markSoldFailed') || 'Failed to mark as sold.');
    } finally {
      setMarkingSoldId(null);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h1 className="text-xl font-bold text-gray-900">{t('profile.myProfile')}</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        
        {/* Profile Header Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          {profileLoading ? (
            <div className="flex min-h-[220px] items-center justify-center">
              <InlineLoader message={t('profile.loading') || 'Loading...'} size="small" />
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden border-4 border-white shadow-lg">
                  {user.profile_photo ? (
                    <img src={user.profile_photo} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name ? user.name[0].toUpperCase() : 'U'
                  )}
                </div>
                {user.completion === 100 && (
                  <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1.5 border-2 border-white shadow-md">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                  {user.completion === 100 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {t('profile.verified') || 'Verified'}
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{user.location}</span>
                  </div>
                  <div className="hidden sm:block text-gray-300">|</div>
                  <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{user.phone}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600 font-medium">{t('profile.completion') || 'Profile Completion'}</span>
                    <span className="text-green-600 font-bold">{user.completion}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-500 to-green-600 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${user.completion}%` }}
                    ></div>
                  </div>
                  {user.completion < 100 && (
                    <p className="text-xs text-gray-500 mt-1.5">{t('profile.completeMessage') || 'Complete your profile to unlock all features'}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setEditing(true)}
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    {t('profile.editProfile') || 'Edit Profile'}
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(t('profile.logoutConfirm') || 'Are you sure you want to logout?')) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('userData');
                        localStorage.removeItem('currentPage');
                        window.location.href = '/login';
                      }
                    }}
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {t('profile.logout') || 'Logout'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Animals Listed */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{t('profile.animalsListed')}</p>
                <p className="text-3xl font-bold text-gray-900">{loading ? '...' : getTotalListings()}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          {/* Calls Made */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{t('profile.callsMade')}</p>
                <p className="text-3xl font-bold text-gray-900">0</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Calls Received */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{t('profile.callsReceived')}</p>
                <p className="text-3xl font-bold text-gray-900">0</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3h5m0 0v5m0-5l-6 6M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Listings & Activity Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">{t('profile.listingsActivity')}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{t('profile.listingsActivityDesc')}</p>
          </div>
          <div className="divide-y divide-gray-100">
            <button
              onClick={() => setShowMyAnimals(true)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">{t('profile.myListings')}</p>
                  <p className="text-xs text-gray-500">{getTotalListings()} {t('profile.animalsListed2') || 'animals listed'}</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => openCallHistory('made')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3h5m0 0v5m0-5l-6 6M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">{t('profile.callsMadeLabel')}</p>
                  <p className="text-xs text-gray-500">{t('profile.callsMadeDesc')}</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => openCallHistory('received')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3h5m0 0v5m0-5l-6 6M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">{t('profile.callsReceivedLabel') || 'Calls Received'}</p>
                  <p className="text-xs text-gray-500">{t('profile.callsReceivedDesc') || 'View incoming call history'}</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>


        {/* Saved & Engagement Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">{t('profile.likedAnimals') || 'Liked Animals'}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{t('profile.likedAnimalsDesc') || 'Animals you liked'}</p>
          </div>
          <div className="divide-y divide-gray-100">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">{t('profile.likedAnimals') || 'Liked Animals'}</p>
                    <p className="text-xs text-gray-500">
                      {likedAnimals.length} {t('profile.likedAnimalsCount') || 'liked animals'}
                    </p>
                  </div>
                </div>
                <Link
                  to="/wishlist"
                  className="text-xs font-semibold text-green-600 hover:text-green-700"
                >
                  {t('profile.viewAll') || 'View all'}
                </Link>
              </div>

              {likedAnimals.length === 0 ? (
                <p className="mt-3 text-xs text-gray-500">
                  {t('profile.likedAnimalsEmpty') || 'No liked animals yet'}
                </p>
              ) : (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {likedAnimals.slice(0, 4).map((animal) => (
                    <div
                      key={animal.id}
                      className="flex items-center gap-3 bg-gray-50 rounded-lg p-2"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                        <img
                          src={animal.imageSrc || animal.photo1 || animal.front_photo || FALLBACK_ANIMAL_IMAGE}
                          alt={animal.title || 'Animal'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{animal.title || 'Animal'}</p>
                        <p className="text-xs text-gray-500 truncate">{animal.location || ''}</p>
                      </div>
                      <span className="text-xs font-semibold text-green-700 flex-shrink-0">
                        {t('animalDetail.currency')}{animal.price}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Support Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">{t('profile.support')}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{t('profile.supportDesc')}</p>
          </div>
          <div className="divide-y divide-gray-100">
            <button
              type="button"
              onClick={handleMessageUs}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">{t('profile.messageUs')}</p>
                  <p className="text-xs text-gray-500">{t('profile.messageUsDesc')}</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">{t('profile.helpCenter')}</p>
                  <p className="text-xs text-gray-500">{t('profile.helpCenterDesc')}</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            <EditProfileForm
              initialData={user}
              onSave={handleSaveProfile}
              onCancel={() => setEditing(false)}
              onPhotoUpdate={handlePhotoUpdate}
              loading={savingProfile}
            />
          </div>
        </div>
      )}

      {/* My Animals Modal */}
      {showMyAnimals && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">{t("profile.myAnimals")} ({getTotalListings()})</h2>
              <button
                onClick={() => {
                  setShowMyAnimals(false);
                  setSelectedAnimal(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="text-center py-12">
                  <InlineLoader message="Loading animals..." />
                </div>
              ) : getTotalListings() === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <p className="text-gray-600 mb-2">No animals listed yet</p>
                  <p className="text-sm text-gray-500">Start by adding your first animal</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...animalListings, ...buffaloListings, ...catListings, ...dogListings, ...goatListings, ...horseListings, ...otherListings].map((animal) => (
                    <div key={`${animal.animal_type || animal.type || 'cow'}-${animal.id}`} className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all">
                      <div className="flex gap-4">
                        {(animal.photo1 || animal.front_photo) && <img src={(animal.photo1 || animal.front_photo)} alt={animal.breed || animal.breed_name} className="w-20 h-20 rounded-lg object-cover" />}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 mb-1 truncate">{animal.breed || animal.breed_name}</h3>
                          <p className="text-sm text-gray-600 mb-2 capitalize">{animal.animal_type || animal.type || 'cow'}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-lg font-bold text-green-600">{t("animalDetail.currency")}{((animal.price || animal.expected_price) || 0).toLocaleString()}</p>
                            {isListingSold(animal) && (
                              <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs font-semibold rounded-full">
                                {t('profile.sold') || 'Sold'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <button
                          onClick={() => navigate(`/seller-listings/${getListingType(animal)}/${animal.id}/insights`)}
                          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                        >
                          {t('profile.viewInsights') || 'View Insights'}
                        </button>
                        <button
                          onClick={() => handleMarkAsSold(animal.id, getListingType(animal))}
                          disabled={isListingSold(animal) || markingSoldId === animal.id}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isListingSold(animal)
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                          }`}
                        >
                          {markingSoldId === animal.id
                            ? (t('profile.markingSold') || 'Marking...')
                            : (isListingSold(animal) ? (t('profile.sold') || 'Sold') : (t('profile.markSold') || 'Mark Sold'))}
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(animal)}
                          className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                        >
                          {t("profile.delete")}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{t("profile.deleteListing")}</h3>
              <p className="text-gray-600 mb-6">{t("profile.deleteConfirm")} "{showDeleteConfirm.breed_name}"? {t("profile.deleteCannotUndo")}</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors">{t("profile.cancel")}</button>
                <button onClick={() => handleDeleteListing(showDeleteConfirm.id, showDeleteConfirm.animal_type || showDeleteConfirm.type || 'cow')} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors">{t("profile.delete")}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Call History Modal */}
      {showCallHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">{t("profile.callHistory")}</h2>
              <button onClick={() => setShowCallHistory(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <CallHistory initialTab={callHistoryTab} />
            </div>
          </div>
        </div>
      )}

      {/* Animal Details Modal */}
      {selectedAnimal && !showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">{t("profile.animalDetails")}</h2>
              <button onClick={() => setSelectedAnimal(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {(selectedAnimal.photo1 || selectedAnimal.front_photo) && (
                <img
                  src={selectedAnimal.photo1 || selectedAnimal.front_photo}
                  alt={selectedAnimal.breed || selectedAnimal.breed_name}
                  className="w-full h-64 object-cover rounded-lg mb-6"
                />
              )}
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedAnimal.breed || selectedAnimal.breed_name}</h3>
                  <p className="text-3xl font-bold text-green-600">{t("animalDetail.currency")}{((selectedAnimal.price || selectedAnimal.expected_price) || 0).toLocaleString()}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-gray-500">{t("profile.type")}</p><p className="font-semibold text-gray-900 capitalize">{selectedAnimal.animal_type || selectedAnimal.type || 'cow'}</p></div>
                  <div><p className="text-sm text-gray-500">{t("profile.age")}</p><p className="font-semibold text-gray-900">{selectedAnimal.age || t("profile.na")}</p></div>
                  <div><p className="text-sm text-gray-500">{t("profile.weight")}</p><p className="font-semibold text-gray-900">{selectedAnimal.weight || t("profile.na")} {t("profile.kg")}</p></div>
                  <div><p className="text-sm text-gray-500">{t("profile.milkCapacity")}</p><p className="font-semibold text-gray-900">{selectedAnimal.milk_capacity || t("profile.na")} {t("profile.lPerDay")}</p></div>
                </div>
                {selectedAnimal.description && <div><p className="text-sm text-gray-500 mb-1">{t("profile.description")}</p><p className="text-gray-700">{selectedAnimal.description}</p></div>}
                <div className="flex items-center gap-3 pt-2">
                  <span className="text-sm text-gray-500">{t('profile.status') || 'Status'}:</span>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                    isListingSold(selectedAnimal) ? 'bg-gray-200 text-gray-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {isListingSold(selectedAnimal) ? (t('profile.sold') || 'Sold') : (t('profile.active') || 'Active')}
                  </span>
                </div>
                {!isListingSold(selectedAnimal) && (
                  <div className="pt-2">
                    <button
                      onClick={() => handleMarkAsSold(selectedAnimal.id, getListingType(selectedAnimal))}
                      disabled={markingSoldId === selectedAnimal.id}
                      className="px-4 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-semibold hover:bg-amber-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {markingSoldId === selectedAnimal.id
                        ? (t('profile.markingSold') || 'Marking...')
                        : (t('profile.markSold') || 'Mark as Sold')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;

