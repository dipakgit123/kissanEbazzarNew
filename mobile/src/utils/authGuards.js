import React from 'react';
import { View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from './constants';
import CowLoader from '../components/CowLoader';

/**
 * Safe JSON parse with fallback
 */
const safeJsonParse = (str, fallback = null) => {
  try {
    return JSON.parse(str);
  } catch (error) {
    return fallback;
  }
};

/**
 * Authentication Guard Component
 * Protects routes that require authentication
 * Redirects to login if user is not authenticated
 */
const withAuthGuard = (WrappedComponent, userType = 'user') => {
  return function AuthGuardedComponent(props) {
    const [isAuthenticated, setIsAuthenticated] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
      checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
      try {
        const tokenKey = userType === 'vet' ? 'vetToken' : 'token';
        const token = await AsyncStorage.getItem(tokenKey);

        setIsAuthenticated(!!token);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <CowLoader message="" size="large" />
        </View>
      );
    }

    if (!isAuthenticated) {
      // Navigation will be handled by the auth context
      // Return null to prevent rendering
      return null;
    }

    return <WrappedComponent {...props} />;
  };
};

/**
 * Role-based Guard Component
 * Protects routes that require specific user roles
 */
const withRoleGuard = (WrappedComponent, allowedRoles = []) => {
  return function RoleGuardedComponent(props) {
    const [hasRole, setHasRole] = React.useState(false);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
      checkUserRole();
    }, []);

    const checkUserRole = async () => {
      try {
        // Parallel read of both storage items
        const [userData, vetData] = await Promise.all([
          AsyncStorage.getItem('userData'),
          AsyncStorage.getItem('vetData')
        ]);

        if (userData) {
          const user = safeJsonParse(userData);
          if (user) {
            setHasRole(allowedRoles.includes('user') || allowedRoles.includes(user.role));
          }
        } else if (vetData) {
          const vet = safeJsonParse(vetData);
          if (vet) {
            setHasRole(allowedRoles.includes('vet') || allowedRoles.includes(vet.role));
          }
        }
      } catch (error) {
        setHasRole(false);
      } finally {
        setLoading(false);
      }
    };

    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <CowLoader message="" size="large" />
        </View>
      );
    }

    if (!hasRole) {
      // User doesn't have required role
      return null;
    }

    return <WrappedComponent {...props} />;
  };
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
});

export { withAuthGuard, withRoleGuard };
