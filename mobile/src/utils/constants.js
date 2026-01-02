// App Colors
export const COLORS = {
  primary: '#15BB73',
  primaryDark: '#0FA568',
  secondary: '#E9F0F8',
  background: '#F0F8FF',
  white: '#FFFFFF',
  black: '#000600',
  gray: '#6B7280',
  lightGray: '#E5E7EB',
  red: '#EF4444',
  blue: '#3B82F6',
  yellow: '#F59E0B',
  green: '#10B981',
};

// Animal Types
export const ANIMAL_TYPES = [
  { id: 'cow', name: 'Cow', icon: '🐄', endpoint: 'animals' },
  { id: 'buffalo', name: 'Buffalo', icon: '🐃', endpoint: 'buffalos' },
  { id: 'horse', name: 'Horse', icon: '🐴', endpoint: 'horses' },
  { id: 'goat', name: 'Goat', icon: '🐐', endpoint: 'goats' },
  { id: 'dog', name: 'Dog', icon: '🐕', endpoint: 'dogs' },
  { id: 'cat', name: 'Cat', icon: '🐈', endpoint: 'cats' },
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
    year: 'numeric'
  });
};

// Get animal type label
export const getAnimalTypeLabel = (type) => {
  const animal = ANIMAL_TYPES.find(a => a.id === type?.toLowerCase());
  return animal?.name || type;
};

// Get animal type icon
export const getAnimalTypeIcon = (type) => {
  const animal = ANIMAL_TYPES.find(a => a.id === type?.toLowerCase());
  return animal?.icon || '🐾';
};
