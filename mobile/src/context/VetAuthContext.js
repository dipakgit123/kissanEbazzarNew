import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { veterinarianService } from '../services/api';

const VetAuthContext = createContext({});

export const VetAuthProvider = ({ children }) => {
  const [veterinarian, setVeterinarian] = useState(null);
  const [vetToken, setVetToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVetAuthenticated, setIsVetAuthenticated] = useState(false);

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('vetToken');
      const storedVet = await AsyncStorage.getItem('veterinarianData');

      if (storedToken) {
        setVetToken(storedToken);
        setIsVetAuthenticated(true);

        if (storedVet) {
          setVeterinarian(JSON.parse(storedVet));
        }

        // Fetch fresh veterinarian data
        try {
          const response = await veterinarianService.getProfile();
          if (response.success && response.data) {
            setVeterinarian(response.data);
            await AsyncStorage.setItem('veterinarianData', JSON.stringify(response.data));
          }
        } catch (error) {
          console.log('Error fetching veterinarian profile:', error);
          // If token is invalid, logout
          if (error.message?.includes('401') || error.message?.includes('Invalid')) {
            await logout();
          }
        }
      }
    } catch (error) {
      console.log('Error loading stored vet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (authToken, vetData) => {
    try {
      await AsyncStorage.setItem('vetToken', authToken);
      if (vetData) {
        await AsyncStorage.setItem('veterinarianData', JSON.stringify(vetData));
      }
      setVetToken(authToken);
      setVeterinarian(vetData);
      setIsVetAuthenticated(true);
    } catch (error) {
      console.log('Error saving vet auth data:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('vetToken');
      await AsyncStorage.removeItem('veterinarianData');
      setVetToken(null);
      setVeterinarian(null);
      setIsVetAuthenticated(false);
    } catch (error) {
      console.log('Error during vet logout:', error);
    }
  };

  const updateVeterinarian = async (vetData) => {
    try {
      setVeterinarian(vetData);
      await AsyncStorage.setItem('veterinarianData', JSON.stringify(vetData));
    } catch (error) {
      console.log('Error updating vet data:', error);
    }
  };

  return (
    <VetAuthContext.Provider
      value={{
        veterinarian,
        vetToken,
        loading,
        isVetAuthenticated,
        login,
        logout,
        updateVeterinarian,
      }}
    >
      {children}
    </VetAuthContext.Provider>
  );
};

export const useVetAuth = () => {
  const context = useContext(VetAuthContext);
  if (!context) {
    throw new Error('useVetAuth must be used within a VetAuthProvider');
  }
  return context;
};

export default VetAuthContext;
