import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load wishlist from AsyncStorage on mount
    useEffect(() => {
        loadWishlist();
    }, []);

    const loadWishlist = async () => {
        try {
            const savedWishlist = await AsyncStorage.getItem('wishlist');
            if (savedWishlist) {
                setWishlist(JSON.parse(savedWishlist));
            }
        } catch (error) {
            console.error('Error loading wishlist:', error);
        } finally {
            setLoading(false);
        }
    };

    const addToWishlist = async (animal) => {
        try {
            const exists = wishlist.find(item => item.id === animal.id);
            if (exists) {
                console.log('Animal already in wishlist');
                return;
            }

            const newWishlist = [...wishlist, { ...animal, addedAt: new Date().toISOString() }];
            setWishlist(newWishlist);
            await AsyncStorage.setItem('wishlist', JSON.stringify(newWishlist));
            console.log('Added to wishlist:', animal.breed_name || animal.title);
        } catch (error) {
            console.error('Error adding to wishlist:', error);
        }
    };

    const removeFromWishlist = async (animalId) => {
        try {
            const newWishlist = wishlist.filter(item => item.id !== animalId);
            setWishlist(newWishlist);
            await AsyncStorage.setItem('wishlist', JSON.stringify(newWishlist));
            console.log('Removed from wishlist');
        } catch (error) {
            console.error('Error removing from wishlist:', error);
        }
    };

    const isInWishlist = (animalId) => {
        return wishlist.some(item => item.id === animalId);
    };

    const clearWishlist = async () => {
        try {
            setWishlist([]);
            await AsyncStorage.removeItem('wishlist');
        } catch (error) {
            console.error('Error clearing wishlist:', error);
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
