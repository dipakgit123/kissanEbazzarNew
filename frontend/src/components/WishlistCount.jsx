import { useWishlist } from '../contexts/useWishlist';
import { useEffect } from 'react';

/**
 * WishlistCount Component
 * Invisible component that updates parent Layout with wishlist count
 * This avoids prop drilling while allowing Layout to display count
 */
const WishlistCount = () => {
  const { getWishlistCount, wishlist } = useWishlist();

  // Update layout's wishlist count when wishlist changes
  useEffect(() => {
    // Notify parent layout of count change
    if (window.updateWishlistCount) {
      window.updateWishlistCount(getWishlistCount());
    }
  }, [wishlist, getWishlistCount]);

  return null; // This component doesn't render anything
};

export default WishlistCount;
