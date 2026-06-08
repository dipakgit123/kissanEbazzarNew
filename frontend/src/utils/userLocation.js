import { userService } from '../services/api';
import { safeJsonParse } from './stringUtils';

const parseCoordinate = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildLocation = (source) => {
  if (!source) {
    return null;
  }

  const latitude = parseCoordinate(source.latitude);
  const longitude = parseCoordinate(source.longitude);

  if (latitude == null || longitude == null) {
    return null;
  }

  return {
    latitude,
    longitude,
    city: source.city || '',
    state: source.state || '',
    pincode: source.pincode || source.postal_code || ''
  };
};

const getStoredLocationCandidates = () => {
  const userData = safeJsonParse(localStorage.getItem('userData'), null);
  const savedUserLocation = safeJsonParse(localStorage.getItem('userLocation'), null);

  return [userData, savedUserLocation];
};

const getBrowserLocation = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      reject,
      {
        timeout: 8000,
        enableHighAccuracy: false,
        maximumAge: 300000
      }
    );
  });

export const resolveUserLocation = async () => {
  const token = localStorage.getItem('token');

  if (token) {
    try {
      const profileResponse = await userService.getProfile();
      const profileLocation = buildLocation(profileResponse?.user);

      if (profileLocation) {
        localStorage.setItem('userLocation', JSON.stringify(profileLocation));
        return profileLocation;
      }
    } catch (error) {
      console.error('Could not fetch user profile location:', error);
    }
  }

  for (const candidate of getStoredLocationCandidates()) {
    const storedLocation = buildLocation(candidate);
    if (storedLocation) {
      return storedLocation;
    }
  }

  try {
    const browserLocation = buildLocation(await getBrowserLocation());
    if (browserLocation) {
      localStorage.setItem('userLocation', JSON.stringify(browserLocation));
      return browserLocation;
    }
  } catch (error) {
    console.error('Could not get browser location:', error);
  }

  return null;
};
