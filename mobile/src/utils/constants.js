// App Colors
export const COLORS = {
  primary: '#1D9E75',
  primaryLight: '#5DCAA5',
  primarySoft: '#E1F5EE',
  primaryDark: '#0F6E56',
  primaryDeep: '#085041',
  secondary: '#9FE1CB',

  accent: '#D85A30',
  accentLight: '#F0997B',
  accentSoft: '#FAECE7',
  accentDark: '#993C1D',
  accentDeep: '#712B13',

  background: '#F5F4EF',
  surface: '#FFFFFF',
  surfaceAlt: '#F5F4EF',
  white: '#FFFFFF',
  black: '#2C2C2A',
  text: '#2C2C2A',
  textMuted: '#5F5E5A',
  gray: '#5F5E5A',
  lightGray: '#E5E4DC',
  border: '#E5E4DC',
  borderStrong: '#B4B2A9',

  success: '#22A05B',
  successSoft: '#D3F9D8',
  warning: '#E8A000',
  warningSoft: '#FFF3BF',
  error: '#E03131',
  errorSoft: '#FFE3E3',
  info: '#1971C2',
  infoSoft: '#D0EBFF',

  // Legacy aliases kept for compatibility with existing screens.
  red: '#E03131',
  blue: '#1971C2',
  yellow: '#E8A000',
  green: '#22A05B',
};

// Animal Types
export const ANIMAL_TYPES = [
  { id: 'cow', name: 'Cow', icon: '\uD83D\uDC04', endpoint: 'animals' },
  { id: 'buffalo', name: 'Buffalo', icon: '\uD83D\uDC03', endpoint: 'buffalos' },
  { id: 'horse', name: 'Horse', icon: '\uD83D\uDC34', endpoint: 'horses' },
  { id: 'goat', name: 'Goat', icon: '\uD83D\uDC10', endpoint: 'goats' },
  { id: 'dog', name: 'Dog', icon: '\uD83D\uDC15', endpoint: 'dogs' },
  { id: 'cat', name: 'Cat', icon: '\uD83D\uDC08', endpoint: 'cats' },
  { id: 'other', name: 'Other Animals', icon: '\uD83D\uDC3E', endpoint: 'other' },
];

// Format price to Indian format
export const formatPrice = (price) => {
  if (!price) return '0';
  return Number(price).toLocaleString('en-IN');
};

// Format time ago
export const formatTimeAgo = (dateString) => {
  if (!dateString) return 'Recently';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
};

// Format date
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

// Get animal type label
export const getAnimalTypeLabel = (type) => {
  const animal = ANIMAL_TYPES.find((a) => a.id === type?.toLowerCase());
  return animal?.name || type;
};

// Get animal type icon
export const getAnimalTypeIcon = (type) => {
  const animal = ANIMAL_TYPES.find((a) => a.id === type?.toLowerCase());
  return animal?.icon || '\uD83D\uDC3E';
};
