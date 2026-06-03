/**
 * Authentication-related constants
 * Centralizes all stringly-typed values for authentication
 */

/**
 * Token storage keys
 */
export const TOKEN_KEYS = {
  USER_TOKEN: 'token',
  VET_TOKEN: 'vetToken',
  USER_DATA: 'userData',
  VET_DATA: 'vetData'
};

/**
 * User roles
 */
export const USER_ROLES = {
  USER: 'user',
  VET: 'vet',
  ADMIN: 'admin'
};

/**
 * Page routes
 */
export const ROUTES = {
  LOGIN: '/login',
  HOME: '/',
  PROFILE_COMPLETION: '/profile-completion',
  LOCATION_SETUP: '/location-setup',
  PROFILE: '/profile',
  WISHLIST: '/wishlist',
  BLOGS: '/blogs',
  ADMIN_LOGIN: '/admin/login',
  ADMIN_DASHBOARD: '/admin/dashboard',
  VET_LOGIN: '/veterinarian/login',
  VET_REGISTER: '/veterinarian/register',
  VET_DASHBOARD: '/veterinarian/dashboard'
};

/**
 * Current page keys for localStorage
 */
export const PAGE_KEYS = {
  LOGIN: 'login',
  HOME: 'home',
  PROFILE_COMPLETION: 'profile-completion',
  LOCATION: 'location'
};
