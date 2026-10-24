import { getAnimalGroup, switchForNotification } from '../utils/animalExperience';
import { createNavigationContainerRef } from '@react-navigation/native';
import logger from '../utils/logger';

export const navigationRef = createNavigationContainerRef();

let pendingNavigation = null;

const firstValue = (...values) => values.find((value) => value !== undefined && value !== null && value !== '');

const getTarget = (data = {}, isVeterinarian = false) => {
  const type = String(data.type || 'system');
  const appointmentId = firstValue(data.appointment_id, data.appointmentId);
  const listingId = firstValue(data.listing_id, data.listingId);
  const animalType = firstValue(data.animal_type, data.animalType, data.listing_type);

  if (type.includes('appointment')) return { name: 'Notifications' };
  if (type === 'vet_contact' || type === 'vet_status') return { name: isVeterinarian ? 'VetDashboard' : 'Notifications' };
  if (type === 'health_report' && !isVeterinarian) return { name: 'AIHealthCheck', params: { reportId: data.report_id } };
  if (type === 'milk_reminder' && !isVeterinarian) return { name: 'MilkReports' };
  if (type === 'pet_status' && !isVeterinarian) return { name: 'PetMating', params: { profileId: data.profile_id } };
  if (type === 'scheme_published' && !isVeterinarian) return { name: 'GovernmentSchemeDetail', params: { slug: data.slug } };
  if (type === 'blog_published' && !isVeterinarian) return { name: 'NotificationArticle', params: { slug: data.slug } };
  if (type.includes('call')) {
    return { name: 'CallHistory' };
  }

  if (['new_listing', 'price_drop', 'contact'].includes(type) && listingId && animalType) {
    return {
      name: 'AnimalDetail',
      params: { id: listingId, animalType },
    };
  }

  if (type === 'listing_sold' && !isVeterinarian) return { name: 'Wishlist' };

  if (type.includes('pregnancy') && !isVeterinarian) {
    return {
      name: 'PregnancyCalendar',
      params: data.record_id ? { recordId: data.record_id } : undefined,
    };
  }

  return { name: 'Notifications' };
};

export const navigateFromNotification = (data, isVeterinarian = false) => {
  const species = data?.animal_type || data?.animalType;
  const group = ['farm', 'pet'].includes(data?.animal_group) ? data.animal_group
    : ['dog', 'cat'].includes(species) || data?.type === 'pet_status' ? 'pet'
    : ['cow', 'buffalo', 'goat', 'horse', 'sheep', 'pig'].includes(species) || ['milk_reminder', 'scheme_published'].includes(data?.type) ? 'farm' : null;
  if (!isVeterinarian && group && group !== getAnimalGroup()) {
    const target = getTarget(data, false);
    switchForNotification(group).then(switched => {
      if (!switched) return;
      pendingNavigation = target;
      setTimeout(flushPendingNotificationNavigation, 100);
    }).catch(() => { pendingNavigation = { name: 'Notifications' }; flushPendingNotificationNavigation(); });
    return false;
  }

  const target = getTarget(data, isVeterinarian);

  if (!navigationRef.isReady() || !hasRoute(navigationRef.getRootState(), target.name)) {
    pendingNavigation = target;
    return false;
  }

  try {
    navigationRef.navigate(target.name, target.params);
    return true;
  } catch (error) {
    logger.error('Unable to navigate from notification:', error);
    pendingNavigation = { name: 'Notifications' };
    return false;
  }
};

export const flushPendingNotificationNavigation = () => {
  if (!pendingNavigation || !navigationRef.isReady() || !hasRoute(navigationRef.getRootState(), pendingNavigation.name)) return;
  const target = pendingNavigation;
  pendingNavigation = null;
  navigationRef.navigate(target.name, target.params);
};

const hasRoute = (state, name) => Boolean(state?.routeNames?.includes(name) || state?.routes?.some(route => hasRoute(route.state, name)));
export const clearPendingNotificationNavigation = () => { pendingNavigation = null; };
