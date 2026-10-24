import { getAnimalGroup } from '../utils/animalExperience';
import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { wishlistService } from '../services/api';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();
const typeOf = item => String(item.animal_type || item.animalType || 'cow').toLowerCase();
const matches = (item, id, type) => Number(item.animal_id ?? item.id) === Number(id) && typeOf(item) === String(type || '').toLowerCase();

export const WishlistProvider = ({ children }) => {
  const { user, token, loading: authLoading } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const generation = useRef(0);
  const account = useRef(token);
  account.current = token;
  const cacheKey = (token && user?.id ? 'wishlist:user:' + user.id : 'wishlist:guest') + ':' + (getAnimalGroup() || 'farm');

  const loadWishlist = useCallback(async () => {
    const request = ++generation.current;
    setLoading(true);
    try {
      let items;
      if (token) {
        const response = await wishlistService.getWishlist();
        items = response.wishlist || [];
      } else {
        const saved = await AsyncStorage.getItem(cacheKey);
        items = saved ? JSON.parse(saved) : [];
      }
      if (request === generation.current && account.current === token) {
        setWishlist(Array.isArray(items) ? items : []);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(Array.isArray(items) ? items : []));
      }
    } catch (error) {
      if (request === generation.current && account.current === token) {
        try {
          const saved = await AsyncStorage.getItem(cacheKey);
          const items = saved ? JSON.parse(saved) : [];
          if (request === generation.current && account.current === token) setWishlist(Array.isArray(items) ? items : []);
        } catch {
          if (request === generation.current && account.current === token) setWishlist([]);
        }
      }
    } finally {
      if (request === generation.current) setLoading(false);
    }
  }, [token, cacheKey]);

  useEffect(() => {
    setWishlist([]);
    if (!authLoading) loadWishlist();
    return () => { generation.current += 1; };
  }, [token, user?.id, authLoading, loadWishlist]);

  const saveLocal = async items => {
    setWishlist(items);
    await AsyncStorage.setItem(cacheKey, JSON.stringify(items));
    return { success: true };
  };
  const addToWishlist = async animal => {
    const type = typeOf(animal);
    const id = animal.animal_id ?? animal.id;
    try {
      if (!token) {
        if (wishlist.some(item => matches(item, id, type))) return { success: true };
        return saveLocal([...wishlist, { ...animal, animal_type: type, addedAt: new Date().toISOString() }]);
      }
      const result = await wishlistService.addToWishlist(type, id);
      if (result.success && account.current === token) await loadWishlist();
      return result;
    } catch (error) { return { success: false, message: error.message }; }
  };
  const removeFromWishlist = async (id, type) => {
    if (!type) return { success: false, message: 'Animal type is required' };
    try {
      if (!token) return saveLocal(wishlist.filter(item => !matches(item, id, type)));
      const result = await wishlistService.removeFromWishlist(String(type).toLowerCase(), id);
      if (result.success && account.current === token) await loadWishlist();
      return result;
    } catch (error) { return { success: false, message: error.message }; }
  };
  const clearWishlist = async () => {
    try {
      if (token) await wishlistService.clearWishlist();
      if (account.current === token) return saveLocal([]);
      return { success: true };
    } catch (error) { return { success: false, message: error.message }; }
  };
  const isInWishlist = (id, type) => wishlist.some(item => matches(item, id, type));
  return <WishlistContext.Provider value={{ wishlist, loading, addToWishlist, removeFromWishlist, clearWishlist, isInWishlist }}>{children}</WishlistContext.Provider>;
};
export const useWishlist = () => {
  const value = useContext(WishlistContext);
  if (!value) throw new Error('useWishlist must be used within WishlistProvider');
  return value;
};
