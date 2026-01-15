import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { VetAuthProvider } from './src/context/VetAuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { WishlistProvider } from './src/context/WishlistContext';
import AppNavigator from './src/navigation/AppNavigator';
import './src/i18n/config'; // Initialize i18n

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <VetAuthProvider>
          <NotificationProvider>
            <WishlistProvider>
              <StatusBar style="auto" />
              <AppNavigator />
            </WishlistProvider>
          </NotificationProvider>
        </VetAuthProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
