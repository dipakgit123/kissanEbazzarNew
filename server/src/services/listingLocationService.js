const geocodingService = require('./geocodingService');

const normalizeText = (value) => String(value || '').trim();

const parseCoordinate = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const looksVerboseLocation = (value) => {
  const normalized = normalizeText(value);
  if (!normalized) {
    return true;
  }

  return normalized.includes(',') || /\d{4,}/.test(normalized) || normalized.length > 32;
};

const extractSimpleCity = (value) => {
  const normalized = normalizeText(value);
  if (!normalized) {
    return null;
  }

  const parts = normalized
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  const firstAlphaPart = parts.find((part) => /[a-zA-Z\u0900-\u097F]/.test(part) && !/\d{4,}/.test(part));
  return firstAlphaPart || normalized;
};

const mergeLocation = (base, resolved) => ({
  latitude: parseCoordinate(base.latitude) ?? parseCoordinate(resolved?.latitude),
  longitude: parseCoordinate(base.longitude) ?? parseCoordinate(resolved?.longitude),
  city: normalizeText(resolved?.city) || extractSimpleCity(base.city),
  state: normalizeText(resolved?.state) || normalizeText(base.state) || null,
  pincode: normalizeText(base.pincode) || normalizeText(resolved?.postal_code) || null
});

class ListingLocationService {
  async resolveLocationFromUser(user) {
    const base = {
      latitude: user?.latitude,
      longitude: user?.longitude,
      city: user?.city,
      state: user?.state,
      pincode: user?.postal_code
    };

    const postalCode = normalizeText(user?.postal_code);
    if (postalCode) {
      try {
        const location = await geocodingService.getLocationFromPostalCode(postalCode, 'IN');
        return mergeLocation(base, location);
      } catch (error) {
        // fall through to place-based normalization
      }
    }

    if (normalizeText(user?.city) || normalizeText(user?.state)) {
      const location = await geocodingService.getLocationFromPlace({
        city: normalizeText(user?.city),
        state: normalizeText(user?.state),
        country: 'India'
      });

      if (location) {
        return mergeLocation(base, location);
      }
    }

    return mergeLocation(base, null);
  }

  async normalizeListingLocation(location, seller = null) {
    const base = {
      latitude: location?.latitude,
      longitude: location?.longitude,
      city: location?.city || seller?.city,
      state: location?.state || seller?.state,
      pincode: location?.pincode || location?.postal_code
    };

    const shouldResolve =
      !normalizeText(base.city) ||
      looksVerboseLocation(base.city) ||
      !normalizeText(base.state);

    if (normalizeText(base.pincode)) {
      try {
        const resolved = await geocodingService.getLocationFromPostalCode(base.pincode, 'IN');
        return mergeLocation(base, resolved);
      } catch (error) {
        // fall through
      }
    }

    if (shouldResolve && (normalizeText(base.city) || normalizeText(base.state))) {
      const resolved = await geocodingService.getLocationFromPlace({
        city: extractSimpleCity(base.city),
        state: normalizeText(base.state),
        country: 'India'
      });

      if (resolved) {
        return mergeLocation(base, resolved);
      }
    }

    return mergeLocation(base, null);
  }
}

module.exports = new ListingLocationService();
