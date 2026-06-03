import { useState, useEffect, useCallback } from 'react';
import { safeJsonParse } from '../utils/stringUtils';
import WishlistContext from './wishlistContextValue.js';

/**
 * Wishlist Context
 * Provides wishlist functionality to all components without prop drilling
 */
export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState(() => {
    const saved = localStorage.getItem('wishlist');
    const parsed = safeJsonParse(saved, []);
    // ✅ Ensure wishlist is always an array
    return Array.isArray(parsed) ? parsed : [];
  });

  // Persist wishlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  /**
   * Add an item to wishlist
   * @param {Object} item - Animal listing item
   */
  const addToWishlist = useCallback((item) => {
    setWishlist(prev => {
      // ✅ Ensure prev is always an array
      const currentWishlist = Array.isArray(prev) ? prev : [];
      if (currentWishlist.some(wishlistItem => wishlistItem.id === item.id)) {
        return currentWishlist; // No-op if already exists
      }
      return [...currentWishlist, item];
    });
  }, []);

  /**
   * Remove an item from wishlist
   * @param {number|string} itemId - ID of the item to remove
   */
  const removeFromWishlist = useCallback((itemId) => {
    setWishlist(prev => prev.filter(item => item.id !== itemId));
  }, []);

  /**
   * Check if an item is in wishlist
   * @param {number|string} itemId - ID of the item to check
   * @returns {boolean}
   */
  const isInWishlist = useCallback((itemId) => {
    // ✅ Handle null wishlist gracefully
    if (!wishlist || !Array.isArray(wishlist)) {
      return false;
    }
    return wishlist.some(item => item.id === itemId);
  }, [wishlist]);

  /**
   * Toggle item in wishlist (add if not present, remove if present)
   * Single-pass operation - O(n) instead of O(3n)
   * @param {Object} item - Animal listing item
   */
  const toggleWishlist = useCallback((item) => {
    setWishlist(prev => {
      // ✅ Ensure prev is always an array
      const currentWishlist = Array.isArray(prev) ? prev : [];
      const exists = currentWishlist.some(wishlistItem => wishlistItem.id === item.id);
      if (exists) {
        return currentWishlist.filter(wishlistItem => wishlistItem.id !== item.id);
      }
      return [...currentWishlist, item];
    });
  }, []);

  /**
   * Clear entire wishlist
   */
  const clearWishlist = () => {
    setWishlist([]);
  };

  /**
   * Get wishlist count
   * @returns {number}
   */
  const getWishlistCount = () => {
    // ✅ Handle null wishlist gracefully
    if (!wishlist || !Array.isArray(wishlist)) {
      return 0;
    }
    return wishlist.length;
  };

  const value = {
    wishlist,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    toggleWishlist,
    clearWishlist,
    getWishlistCount
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};
