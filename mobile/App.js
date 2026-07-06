import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import Toast from 'react-native-toast-message';
import { AuthProvider } from './src/context/AuthContext';
import { VetAuthProvider } from './src/context/VetAuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { WishlistProvider } from './src/context/WishlistContext';
import AppNavigator from './src/navigation/AppNavigator';
import AnimatedSplash from './src/components/AnimatedSplash';
import { BeautifulFeedbackProvider, beautifulToastConfig } from './src/components/BeautifulFeedback';
import { applyGlobalTypography } from './src/utils/typography';
import './src/i18n/config'; // Initialize i18n

applyGlobalTypography();

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  if (!appIsReady) {
    return null;
  }

  if (showSplash) {
    return <AnimatedSplash onFinish={handleSplashFinish} />;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <VetAuthProvider>
          <NotificationProvider>
            <WishlistProvider>
              <BeautifulFeedbackProvider>
                <StatusBar style="light" backgroundColor="#15BB73" />
                <AppNavigator />
                <Toast config={beautifulToastConfig} />
              </BeautifulFeedbackProvider>
            </WishlistProvider>
          </NotificationProvider>
        </VetAuthProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
