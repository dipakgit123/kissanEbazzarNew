import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../context/AuthContext';
import { useVetAuth } from '../context/VetAuthContext';
import { COLORS } from '../utils/constants';
import CowLoader from '../components/CowLoader';

// Auth Screens
import LoginScreen from '../screens/LoginScreen';
import OTPVerificationScreen from '../screens/OTPVerificationScreen';
import ProfileCompletionScreen from '../screens/ProfileCompletionScreen';

// Veterinarian Screens
import VetLoginScreen from '../screens/VetLoginScreen';
import VetRegistrationScreen from '../screens/VetRegistrationScreen';
import VetOTPVerificationScreen from '../screens/VetOTPVerificationScreen';
import VetDashboardScreen from '../screens/VetDashboardScreen';
import VetAppointmentsScreen from '../screens/VetAppointmentsScreen';
import EditVetProfileScreen from '../screens/EditVetProfileScreen';

// Main Screens
import HomeScreen from '../screens/HomeScreen';
import AnimalDetailScreen from '../screens/AnimalDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SellAnimalScreen from '../screens/SellAnimalScreen';
import MapScreen from '../screens/MapScreen';
import VeterinarianScreen from '../screens/VeterinarianScreen';
import VetDetailScreen from '../screens/VetDetailScreen';
import PregnancyCalendarScreen from '../screens/PregnancyCalendarScreen';
import MilkReportsScreen from '../screens/MilkReportsScreen';
import WishlistScreen from '../screens/WishlistScreen';
import AIHealthCheckScreen from '../screens/AIHealthCheckScreen';
import AIAssistantScreen from '../screens/AIAssistantScreen';
import CategoryListingsScreen from '../screens/CategoryListingsScreen';
import CreateListingScreen from '../screens/CreateListingScreen';
import BuyAnimalsScreen from '../screens/BuyAnimalsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import CallHistoryScreen from '../screens/CallHistoryScreen';
import LocationSetupScreen from '../screens/LocationSetupScreen';
import ServicesScreen from '../screens/ServicesScreen';
import AppointmentBookingScreen from '../screens/AppointmentBookingScreen';
import MyAppointmentsScreen from '../screens/MyAppointmentsScreen';
import LegalDocumentScreen from '../screens/LegalDocumentScreen';
import GovernmentSchemesScreen from '../screens/GovernmentSchemesScreen';
import GovernmentSchemeDetailScreen from '../screens/GovernmentSchemeDetailScreen';
import SellerListingInsightsScreen from '../screens/SellerListingInsightsScreen';
import PetMatingScreen from '../screens/PetMatingScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    background: COLORS.background,
    card: COLORS.surface,
    text: COLORS.text,
    border: COLORS.border,
    notification: COLORS.accent,
  },
};

// Bottom Tab Navigator
const MainTabs = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const getTabMeta = (routeName, focused) => {
    switch (routeName) {
      case 'Home':
        return {
          icon: focused ? 'home' : 'home-outline',
          label: t('navigation.home'),
        };
      case 'BuyAnimals':
        return {
          icon: focused ? 'cart' : 'cart-outline',
          label: t('navigation.buy'),
        };
      case 'SellAnimal':
        return {
          icon: 'pricetag',
          label: t('navigation.sell'),
        };
      case 'AIAssistant':
        return {
          icon: focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline',
          label: t('navigation.aiAssistant'),
        };
      case 'Profile':
        return {
          icon: focused ? 'person' : 'person-outline',
          label: t('navigation.profile'),
        };
      default:
        return {
          icon: 'ellipse-outline',
          label: routeName,
        };
    }
  };

  return (
    <Tab.Navigator
      backBehavior="history"
      screenOptions={({ route }) => ({
        tabBarShowLabel: false,
        tabBarIcon: ({ focused }) => {
          const { icon, label } = getTabMeta(route.name, focused);
          const iconColor = focused ? COLORS.primary : '#B4B2A9';

          if (route.name === 'SellAnimal') {
            return (
              <View style={styles.centerTabWrapper}>
                <View style={styles.centerTabButton}>
                  <Ionicons name={icon} size={26} color={COLORS.surface} />
                </View>
                <Text style={styles.centerTabLabel}>{label}</Text>
              </View>
            );
          }

          return (
            <View style={styles.tabItem}>
              <Ionicons name={icon} size={22} color={iconColor} />
              <Text
                numberOfLines={1}
                style={[
                  styles.tabLabel,
                  { color: focused ? COLORS.primary : '#B4B2A9' },
                ]}
              >
                {label}
              </Text>
            </View>
          );
        },
        tabBarButton: (props) => (
          <TouchableOpacity
            {...props}
            activeOpacity={0.85}
            style={[
              route.name === 'SellAnimal' ? styles.centerTabPressable : styles.tabPressable,
              props.style,
            ]}
          />
        ),
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#B4B2A9',
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 10,
          height: 78 + Math.max(insets.bottom, 0),
          borderTopWidth: 1,
          borderTopColor: '#E5E4DC',
          backgroundColor: COLORS.surface,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          elevation: 18,
          shadowColor: '#2C2C2A',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.12,
          shadowRadius: 22,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: t('navigation.home') }}
      />
      <Tab.Screen
        name="BuyAnimals"
        component={BuyAnimalsScreen}
        options={{ tabBarLabel: t('navigation.buy') }}
      />
      <Tab.Screen
        name="SellAnimal"
        component={SellAnimalScreen}
        options={{ tabBarAccessibilityLabel: t('navigation.sell') }}
      />
      <Tab.Screen
        name="AIAssistant"
        component={AIAssistantScreen}
        options={{ tabBarAccessibilityLabel: t('navigation.aiAssistant') }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarAccessibilityLabel: t('navigation.profile') }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabPressable: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 4,
  },
  centerTabPressable: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -16,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minWidth: 54,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 12,
  },
  centerTabWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTabButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: COLORS.surface,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  centerTabLabel: {
    marginTop: 6,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '600',
    color: '#B4B2A9',
  },
});

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
      <Stack.Screen name="LegalDocument" component={LegalDocumentScreen} />
    </Stack.Navigator>
  );
};

// Veterinarian Stack Navigator (after vet login)
const VetStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="VetDashboard" component={VetDashboardScreen} />
      <Stack.Screen 
        name="VetAppointments" 
        component={VetAppointmentsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen 
        name="EditVetProfile" 
        component={EditVetProfileScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen 
        name="VetDetail" 
        component={VetDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen 
        name="CallHistory" 
        component={CallHistoryScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="LegalDocument"
        component={LegalDocumentScreen}
        options={{ animation: 'slide_from_right' }}
      />
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
        name="SellerListingInsights"
        component={SellerListingInsightsScreen}
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
        name="MilkReports"
        component={MilkReportsScreen}
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
        name="Map"
        component={MapScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Services"
        component={ServicesScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="GovernmentSchemes"
        component={GovernmentSchemesScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="GovernmentSchemeDetail"
        component={GovernmentSchemeDetailScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="PetMating"
        component={PetMatingScreen}
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
      <Stack.Screen
        name="AppointmentBooking"
        component={AppointmentBookingScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="MyAppointments"
        component={MyAppointmentsScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="LegalDocument"
        component={LegalDocumentScreen}
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
        <CowLoader message="" size="large" />
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
    <NavigationContainer theme={navigationTheme}>
      {getActiveStack()}
    </NavigationContainer>
  );
};

export default AppNavigator;
