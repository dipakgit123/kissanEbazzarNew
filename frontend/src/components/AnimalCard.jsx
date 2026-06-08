import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';
import { safeJsonParse } from '../utils/stringUtils';

/*
  Props
  -----
  title        : string  – listing title
  price        : string / number – price text
  location     : string
  datePosted   : string (e.g. "1 day ago")
  images       : array – array of photo URLs
  imageSrc     : string – fallback single photo URL (for backward compatibility)
  sellerName   : string
  phoneNumber  : string – seller's phone number
  breed        : string – breed name
  age          : string – age of animal
  milkProduction : string – milk production capacity
  healthCondition : string – health condition
  pregnancyStatus : string – pregnancy status
  onCallClick  : () => void  (optional)
  onWhatsAppClick : () => void (optional)
  animalType   : string – type of animal (cow, buffalo, etc.)
  listingId    : number – database ID of the listing
*/
const AnimalCard = ({
  title,
  price,
  location,
  datePosted,
  images = [],
  imageSrc,
  sellerName,
  phoneNumber,
  onCallClick,
  onWhatsAppClick,
  isInWishlist = false,
  onToggleWishlist = () => {},
  id,
  animalType,
  listingId,
  sellerId,
  latitude,
  longitude,
  distance,
  userLocation
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const currentUser = safeJsonParse(localStorage.getItem('userData'), null);
  const currentUserId = currentUser?.id ?? currentUser?.user_id ?? null;
  const currentUserCity = userLocation?.city || currentUser?.city || '';

  const displayImage = images.find((img) => img && img.trim() !== '') || imageSrc;

  const normalizedLatitude = Number(latitude);
  const normalizedLongitude = Number(longitude);
  const hasExactLocation = Number.isFinite(normalizedLatitude) && Number.isFinite(normalizedLongitude);
  const normalizedUserLatitude = Number(userLocation?.latitude);
  const normalizedUserLongitude = Number(userLocation?.longitude);
  const hasUserCoordinates = Number.isFinite(normalizedUserLatitude) && Number.isFinite(normalizedUserLongitude);

  const normalizePlace = (value) => String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  const getEditDistance = (source, target) => {
    if (source === target) {
      return 0;
    }

    const rows = source.length + 1;
    const cols = target.length + 1;
    const matrix = Array.from({ length: rows }, () => Array(cols).fill(0));

    for (let row = 0; row < rows; row += 1) {
      matrix[row][0] = row;
    }

    for (let col = 0; col < cols; col += 1) {
      matrix[0][col] = col;
    }

    for (let row = 1; row < rows; row += 1) {
      for (let col = 1; col < cols; col += 1) {
        const cost = source[row - 1] === target[col - 1] ? 0 : 1;
        matrix[row][col] = Math.min(
          matrix[row - 1][col] + 1,
          matrix[row][col - 1] + 1,
          matrix[row - 1][col - 1] + cost
        );
      }
    }

    return matrix[source.length][target.length];
  };

  const isSameCity = useMemo(() => {
    if (!currentUserCity || !location) {
      return false;
    }

    const normalizedCurrentCity = normalizePlace(currentUserCity);
    const normalizedListingCity = normalizePlace(location);

    if (!normalizedCurrentCity || !normalizedListingCity) {
      return false;
    }

    if (
      normalizedCurrentCity === normalizedListingCity ||
      normalizedCurrentCity.includes(normalizedListingCity) ||
      normalizedListingCity.includes(normalizedCurrentCity)
    ) {
      return true;
    }

    return getEditDistance(normalizedCurrentCity, normalizedListingCity) <= 2;
  }, [currentUserCity, location]);

  const computedDistance = useMemo(() => {
    const serverDistance = Number(distance);
    if (Number.isFinite(serverDistance) && serverDistance >= 0) {
      return serverDistance;
    }

    const toRadians = (value) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;

    if (hasExactLocation && hasUserCoordinates) {
      const dLat = toRadians(normalizedLatitude - normalizedUserLatitude);
      const dLon = toRadians(normalizedLongitude - normalizedUserLongitude);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(normalizedUserLatitude)) *
          Math.cos(toRadians(normalizedLatitude)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return earthRadiusKm * c;
    }

    return null;
  }, [
    distance,
    hasExactLocation,
    hasUserCoordinates,
    normalizedLatitude,
    normalizedLongitude,
    normalizedUserLatitude,
    normalizedUserLongitude
  ]);

  const formattedDistance = useMemo(() => {
    if (!Number.isFinite(computedDistance)) {
      return null;
    }

    if (isSameCity && computedDistance > 100) {
      return t('animalCard.sameCity');
    }

    return computedDistance < 10
      ? computedDistance.toFixed(1)
      : Math.round(computedDistance).toString();
  }, [computedDistance, isSameCity, t]);

  const isOwnListing = useMemo(() => {
    if (!currentUserId || !sellerId) {
      return false;
    }

    return String(currentUserId) === String(sellerId);
  }, [currentUserId, sellerId]);
  // Handle call action
  const handleCall = async () => {
    // Log the call in backend first
    try {
      const token = localStorage.getItem('token');
      if (token && listingId && sellerId) {
        // Get user location if available
        let latitude = null;
        let longitude = null;
        
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((position) => {
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;
          });
        }
        
        // Log the call
        await axios.post(
          `${API_BASE_URL}/api/call-logs`,
          {
            receiverId: sellerId, // seller's user ID
            receiverPhoneNumber: phoneNumber,
            callType: 'animal_listing',
            listingId: listingId,
            listingType: animalType ? animalType.toLowerCase() : 'animal',
            callerLatitude: latitude,
            callerLongitude: longitude
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
      }
    } catch (error) {
      console.error('Error logging call:', error);
      // Continue with call even if logging fails
    }
    
    // Make the actual call
    if (onCallClick) {
      onCallClick();
    } else {
      window.location.href = `tel:${phoneNumber}`;
    }
  };

  // Handle WhatsApp action
  const handleWhatsApp = (e) => {
    e.stopPropagation();
    if (onWhatsAppClick) {
      onWhatsAppClick();
    } else {
      // Default behavior - redirect to WhatsApp
      const message = `Hi! I'm interested in your animal listing: "${title}" - ₹${price}`;
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  // Handle card click to navigate to detail page
  const handleCardClick = () => {
    if (animalType && listingId) {
      navigate(`/animal/${animalType.toLowerCase()}/${listingId}`);
    }
  };

  const handleLocationClick = (e) => {
    e.stopPropagation();

    if (!hasExactLocation) {
      navigate('/map');
      return;
    }

    const params = new URLSearchParams({
      listingId: String(listingId || ''),
      lat: String(normalizedLatitude),
      lng: String(normalizedLongitude)
    });

    navigate(`/map?${params.toString()}`);
  };

  // Handle call with stop propagation
  const handleCallClick = (e) => {
    e.stopPropagation();
    handleCall();
  };

  // Handle wishlist with stop propagation
  const handleWishlistClick = async (e) => {
    e.stopPropagation();
    
    if (isWishlistLoading) return;
    
    setIsWishlistLoading(true);
    
    try {
      await onToggleWishlist(id);
      
      // Show success toast
      if (isInWishlist) {
        toast.success(t('animalCard.removedFromWishlist'), {
          duration: 2000,
          icon: '💔',
        });
      } else {
        toast.success(t('animalCard.addedToWishlist'), {
          duration: 2000,
          icon: '❤️',
        });
      }
    } catch {
      toast.error(t('common.error') || 'Something went wrong', {
        duration: 2000,
      });
    } finally {
      setIsWishlistLoading(false);
    }
  };

  return (
    <div
      className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden w-full max-w-sm mx-auto group hover:shadow-xl transition-all duration-300 cursor-pointer"
      onClick={handleCardClick}
    >
        {/* Image Container */}
      <div className="relative overflow-hidden h-52 bg-gray-50">
        {displayImage && (
          <img
            src={displayImage}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}
        
        {/* Price Badge */}
        <div className="absolute top-3 right-3 bg-green-600 text-white px-2.5 py-1 rounded-lg text-sm font-bold shadow-md">
          ₹{price}
        </div>
        
        {/* Wishlist Button */}
        <button
          onClick={handleWishlistClick}
          disabled={isWishlistLoading}
          className={`absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-200 ${
            isWishlistLoading 
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : isInWishlist
              ? 'bg-red-500 text-white'
              : 'bg-white/90 text-gray-600 hover:bg-red-500 hover:text-white'
          }`}
          aria-label={isInWishlist ? t('animalCard.removeFromWishlist') : t('animalCard.addToWishlist')}
        >
          {isWishlistLoading ? (
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg 
              className="w-4 h-4" 
              fill={isInWishlist ? "currentColor" : "none"} 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
              />
            </svg>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-bold text-base leading-tight text-gray-800 mb-2 line-clamp-2 group-hover:text-green-600 transition-colors duration-200" title={title}>
          {title}
        </h3>
        
        {/* Location & Date */}
        <div className="flex items-center justify-between gap-3 text-xs text-gray-500 mb-3">
          <button
            type="button"
            onClick={handleLocationClick}
            className="flex items-center gap-1 min-w-0 text-left text-gray-600 hover:text-green-600 transition-colors"
            title={hasExactLocation ? t('animalCard.viewOnMap') : location}
          >
            <svg className="w-3.5 h-3.5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span className="truncate max-w-[120px]">{location}</span>
            {isOwnListing ? (
              <span className="hidden sm:inline text-[11px] text-green-700 whitespace-nowrap">
                · {t('animalCard.addedByYou')}
              </span>
            ) : formattedDistance && (
              <span className="hidden sm:inline text-[11px] text-green-700 whitespace-nowrap">
                · {formattedDistance === t('animalCard.sameCity')
                  ? formattedDistance
                  : t('animalCard.distanceAway', { distance: formattedDistance })}
              </span>
            )}
          </button>
          {isOwnListing ? (
            <span className="sm:hidden text-[11px] font-medium text-green-700 whitespace-nowrap">
              {t('animalCard.addedByYou')}
            </span>
          ) : formattedDistance && (
            <span className="sm:hidden text-[11px] font-medium text-green-700 whitespace-nowrap">
              {formattedDistance === t('animalCard.sameCity')
                ? formattedDistance
                : t('animalCard.distanceAway', { distance: formattedDistance })}
            </span>
          )}
          <div className="flex items-center gap-1 whitespace-nowrap">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{datePosted}</span>
          </div>
        </div>

        {/* Seller Info */}
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-xs">
            {sellerName?.charAt(0) || 'S'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{sellerName}</p>
            <p className="text-xs text-gray-500">{t('animalCard.verifiedSeller')}</p>
          </div>
        </div>

        {/* Action Buttons - Compact & Clean */}
        <div className="flex gap-2">
          <button
            onClick={handleCallClick}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-1.5"
            title={t('animalCard.callNow')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="text-sm">{t('animalCard.call')}</span>
          </button>
          <button
            onClick={handleWhatsApp}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-1.5"
            title={t('animalCard.whatsapp')}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
            </svg>
            <span className="text-sm">{t('animalCard.whatsapp')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnimalCard;
