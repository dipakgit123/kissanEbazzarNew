import { getAnimalGroup } from '../utils/animalExperience';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { safeJsonParse } from '../utils/stringUtils';
import WishlistContext from './wishlistContextValue.js';

const identity = item => {
  const composite = String(item.id || '').match(/^([a-z]+)-(\d+)$/i);
  return { animal_type: String(item.animal_type || composite?.[1] || item.animalType || 'cow').toLowerCase(), animal_id: Number(item.animal_id || item.originalId || composite?.[2] || item.id) };
};
const normalize = item => {
  const key = identity(item);
  return { ...item, ...key, id: key.animal_type + '-' + key.animal_id,
    title: item.title || item.breed_name || item.breedName || key.animal_type,
    breed: item.breed || item.breed_name || item.breedName,
    originalId: key.animal_id,
    animalType: key.animal_type, imageSrc: item.imageSrc || item.front_photo || item.frontPhoto || item.sidePhoto || item.photo1 || item.photo_1,
    sellerName: item.sellerName || item.seller?.full_name || '',
    phoneNumber: item.phoneNumber || item.seller?.phone_number || '',
    milkProduction: item.milkProduction ?? item.milk_capacity ?? item.milkCapacity ?? 0,
    price: item.price || Number(item.expected_price || item.expectedPrice || 0).toLocaleString('en-IN'),
    location: item.location || item.city || '', addedAt: item.addedAt || item.added_at || new Date().toISOString(),
  };
};
export const WishlistProvider = ({ children }) => {
  const location = useLocation();
  const [, refreshSession] = useState(0);
  const token = localStorage.getItem('token');
  const user = safeJsonParse(localStorage.getItem('userData'), {});
  const cacheKey = (token && user?.id ? 'wishlist:user:' + user.id : 'wishlist:guest') + ':' + (getAnimalGroup() || 'farm');
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const requestVersion = useRef(0);
  const reload = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    setError(false);
    try {
      const data = token ? (await api.get('/api/wishlist')).data.wishlist : safeJsonParse(localStorage.getItem(cacheKey), []);
      if (version !== requestVersion.current || token !== localStorage.getItem('token')) return;
      if (!Array.isArray(data)) throw new Error('Invalid wishlist response');
      const items = data.map(normalize);
      setWishlist(items);
      localStorage.setItem(cacheKey, JSON.stringify(items));
    } catch {
      if (version === requestVersion.current) setError(true);
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [token, cacheKey]);
  useEffect(() => {
    setWishlist([]);
    reload();
    return () => { requestVersion.current += 1; };
  }, [reload]);
  useEffect(() => {
    const onStorage = event => {
      if (!event.key || ['token', 'userData'].includes(event.key)) refreshSession(version => version + 1);
      else if (event.key === cacheKey && !token) reload();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [reload, location.pathname, cacheKey, token]);
  const saveGuest = useCallback(items => {
    setWishlist(items);
    localStorage.setItem(cacheKey, JSON.stringify(items));
  }, [cacheKey]);
  const addToWishlist = useCallback(async item => {
    try {
      const normalized = normalize(item);
      if (token) { await api.post('/api/wishlist/add', identity(item)); await reload(); }
      else if (!wishlist.some(saved => saved.id === normalized.id)) saveGuest([...wishlist, normalized]);
      return { success: true };
    } catch (error) { return { success: false, message: error.message }; }
  }, [token, wishlist, reload, saveGuest]);
  const removeFromWishlist = useCallback(async id => {
    try {
      const item = wishlist.find(saved => saved.id === id);
      if (!item) return { success: true };
      if (token) { await api.post('/api/wishlist/remove', identity(item)); setWishlist(previous => previous.filter(saved => saved.id !== id)); await reload(); }
      else saveGuest(wishlist.filter(saved => saved.id !== id));
      return { success: true };
    } catch (error) { return { success: false, message: error.message }; }
  }, [token, wishlist, reload, saveGuest]);
  const isInWishlist = useCallback(id => wishlist.some(item => item.id === id), [wishlist]);
  const toggleWishlist = useCallback(item => isInWishlist(item.id) ? removeFromWishlist(item.id) : addToWishlist(item), [isInWishlist, removeFromWishlist, addToWishlist]);
  const clearWishlist = async () => {
    if (token) await api.delete('/api/wishlist/clear');
    saveGuest([]);
  };
  return <WishlistContext.Provider value={{ wishlist, loading, error, reload, addToWishlist, removeFromWishlist, isInWishlist, toggleWishlist, clearWishlist, getWishlistCount: () => wishlist.length }}>{children}</WishlistContext.Provider>;
};
