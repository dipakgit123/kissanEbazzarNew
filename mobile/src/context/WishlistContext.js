import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { wishlistService } from '../services/api';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load wishlist from backend on mount
    useEffect(() => {
        loadWishlist();
    }, []);

    const loadWishlist = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            
            if (!token) {
                // User not logged in, load from local storage
                const savedWishlist = await AsyncStorage.getItem('wishlist');
                if (savedWishlist) {
                    setWishlist(JSON.parse(savedWishlist));
                }
            } else {
                // User logged in, fetch from backend
                const response = await wishlistService.getWishlist();
                if (response.success) {
                    setWishlist(response.wishlist || []);
                }
            }
        } catch (error) {
            console.error('Error loading wishlist:', error);
            // Fallback to local storage on error
            try {
                const savedWishlist = await AsyncStorage.getItem('wishlist');
                if (savedWishlist) {
                    setWishlist(JSON.parse(savedWishlist));
                }
            } catch (e) {
                console.error('Error loading local wishlist:', e);
            }
        } finally {
            setLoading(false);
        }
    };

    const addToWishlist = async (animal) => {
        try {
            const token = await AsyncStorage.getItem('token');
            
            // Determine animal type from the object
            let animalType = animal.animal_type || animal.animalType;
            
            // If not present, try to infer from category or default to 'cow'
            if (!animalType) {
                if (animal.category) {
                    animalType = animal.category.toLowerCase();
                } else {
                    // Map from breed or other fields
                    animalType = 'cow'; // default
                }
            }
            
            const animalId = animal.id;

            if (!token) {
                // User not logged in, save to local storage
                const exists = wishlist.find(item => item.id === animalId);
                if (exists) {
                    console.log('Animal already in wishlist');
                    return { success: false, message: 'Already in wishlist' };
                }

                const newWishlist = [...wishlist, { ...animal, addedAt: new Date().toISOString() }];
                setWishlist(newWishlist);
                await AsyncStorage.setItem('wishlist', JSON.stringify(newWishlist));
                console.log('Added to wishlist (local):', animal.breed_name || animal.title);
                return { success: true, message: 'Added to wishlist' };
            }

            // User logged in, save to backend
            const response = await wishlistService.addToWishlist(animalType, animalId);
            
            if (response.success) {
                // Reload wishlist from backend
                await loadWishlist();
                console.log('Added to wishlist (backend):', animal.breed_name || animal.title);
            }
            
            return response;
        } catch (error) {
            console.error('Error adding to wishlist:', error);
            return { success: false, message: error.message };
        }
    };

    const removeFromWishlist = async (animalId, animalType = null) => {
        try {
            const token = await AsyncStorage.getItem('token');

            if (!token) {
                // User not logged in, remove from local storage
                const newWishlist = wishlist.filter(item => item.id !== animalId);
                setWishlist(newWishlist);
                await AsyncStorage.setItem('wishlist', JSON.stringify(newWishlist));
                console.log('Removed from wishlist (local)');
                return { success: true };
            }

            // User logged in, remove from backend
            // Find animal type from wishlist if not provided
            if (!animalType) {
                const item = wishlist.find(w => w.animal_id === animalId || w.id === animalId);
                animalType = item?.animal_type || item?.animalType || 'cow';
                console.log('🔍 Animal type lookup:', { animalId, found: !!item, animalType });
                console.log('🔍 Wishlist item:', JSON.stringify(item));
            }

            console.log('📤 Removing from wishlist:', { animalType, animalId });
            const response = await wishlistService.removeFromWishlist(animalType, animalId);
            
            if (response.success) {
                // Reload wishlist from backend
                await loadWishlist();
                console.log('Removed from wishlist (backend)');
            }
            
            return response;
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            return { success: false, message: error.message };
        }
    };

    const isInWishlist = (animalId) => {
        return wishlist.some(item => item.id === animalId || item.animal_id === animalId);
    };

    const clearWishlist = async () => {
        try {
            const token = await AsyncStorage.getItem('token');

            if (!token) {
                // User not logged in, clear local storage
                setWishlist([]);
                await AsyncStorage.removeItem('wishlist');
                return { success: true };
            }

            // User logged in, clear from backend
            const response = await wishlistService.clearWishlist();
            
            if (response.success) {
                setWishlist([]);
            }
            
            return response;
        } catch (error) {
            console.error('Error clearing wishlist:', error);
            return { success: false, message: error.message };
        }
    };

    return (
        <WishlistContext.Provider
            value={{
                wishlist,
                addToWishlist,
                removeFromWishlist,
                isInWishlist,
                clearWishlist,
                loading,
            }}
        >
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
};
