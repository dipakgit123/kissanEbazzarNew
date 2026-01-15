import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { useVetAuth } from '../context/VetAuthContext';
import { COLORS } from '../utils/constants';

// Auth Screens
import LoginScreen from '../screens/LoginScreen';
import OTPVerificationScreen from '../screens/OTPVerificationScreen';
import ProfileCompletionScreen from '../screens/ProfileCompletionScreen';

// Veterinarian Screens
import VetLoginScreen from '../screens/VetLoginScreen';
import VetRegistrationScreen from '../screens/VetRegistrationScreen';
import VetOTPVerificationScreen from '../screens/VetOTPVerificationScreen';
import VetDashboardScreen from '../screens/VetDashboardScreen';

// Main Screens
import HomeScreen from '../screens/HomeScreen';
import AnimalDetailScreen from '../screens/AnimalDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SellAnimalScreen from '../screens/SellAnimalScreen';
import MapScreen from '../screens/MapScreen';
import VeterinarianScreen from '../screens/VeterinarianScreen';
import VetDetailScreen from '../screens/VetDetailScreen';
import PregnancyCalendarScreen from '../screens/PregnancyCalendarScreen';
import WishlistScreen from '../screens/WishlistScreen';
import AIHealthCheckScreen from '../screens/AIHealthCheckScreen';
import AIAssistantScreen from '../screens/AIAssistantScreen';
import ServicesScreen from '../screens/ServicesScreen';
import CategoryListingsScreen from '../screens/CategoryListingsScreen';
import CreateListingScreen from '../screens/CreateListingScreen';
import BuyAnimalsScreen from '../screens/BuyAnimalsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import CallHistoryScreen from '../screens/CallHistoryScreen';
import LocationSetupScreen from '../screens/LocationSetupScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator
const MainTabs = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'BuyAnimals') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'SellAnimal') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Services') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
          height: 65 + Math.max(insets.bottom, 0),
          borderTopWidth: 1,
          borderTopColor: COLORS.lightGray,
          backgroundColor: COLORS.white,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="BuyAnimals"
        component={BuyAnimalsScreen}
        options={{ tabBarLabel: 'Buy' }}
      />
      <Tab.Screen
        name="SellAnimal"
        component={SellAnimalScreen}
        options={{ tabBarLabel: 'Sell' }}
      />
      <Tab.Screen
        name="Services"
        component={ServicesScreen}
        options={{ tabBarLabel: 'Services' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

// Auth Stack Navigator (for farmers/users)
const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <Stack.Screen name="ProfileCompletion" component={ProfileCompletionScreen} />
      {/* Veterinarian Auth Screens - accessible from Login */}
      <Stack.Screen name="VetLogin" component={VetLoginScreen} />
      <Stack.Screen name="VetRegistration" component={VetRegistrationScreen} />
      <Stack.Screen name="VetOTPVerification" component={VetOTPVerificationScreen} />
    </Stack.Navigator>
  );
};

// Veterinarian Stack Navigator (after vet login)
const VetStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="VetDashboard" component={VetDashboardScreen} />
    </Stack.Navigator>
  );
};

// Main Stack Navigator (after login)
const MainStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="AnimalDetail"
        component={AnimalDetailScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="CategoryListings"
        component={CategoryListingsScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="CreateListing"
        component={CreateListingScreen}
        options={{
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="AIHealthCheck"
        component={AIHealthCheckScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Veterinarian"
        component={VeterinarianScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="VetDetail"
        component={VetDetailScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="PregnancyCalendar"
        component={PregnancyCalendarScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Wishlist"
        component={WishlistScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="AIAssistant"
        component={AIAssistantScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="BuyAnimals"
        component={BuyAnimalsScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="CallHistory"
        component={CallHistoryScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="LocationSetup"
        component={LocationSetupScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
};

// App Navigator
const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();
  const { isVetAuthenticated, loading: vetLoading } = useVetAuth();

  if (loading || vetLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Determine which stack to show
  const getActiveStack = () => {
    if (isVetAuthenticated) {
      return <VetStack />;
    }
    if (isAuthenticated) {
      return <MainStack />;
    }
    return <AuthStack />;
  };

  return (
    <NavigationContainer>
      {getActiveStack()}
    </NavigationContainer>
  );
};

export default AppNavigator;
