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

  if (type.includes('appointment')) {
    return {
      name: isVeterinarian ? 'VetAppointments' : 'MyAppointments',
      params: appointmentId ? { focusAppointmentId: appointmentId } : undefined,
    };
  }

  if (type.includes('call')) {
    return { name: 'CallHistory' };
  }

  if (['new_listing', 'price_drop', 'contact', 'listing_sold'].includes(type) && listingId && animalType) {
    return {
      name: 'AnimalDetail',
      params: { id: listingId, animalType },
    };
  }

  if (type.includes('pregnancy') && !isVeterinarian) {
    return {
      name: 'PregnancyCalendar',
      params: data.record_id ? { recordId: data.record_id } : undefined,
    };
  }

  return { name: 'Notifications' };
};

export const navigateFromNotification = (data, isVeterinarian = false) => {
  const target = getTarget(data, isVeterinarian);

  if (!navigationRef.isReady()) {
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
  if (!pendingNavigation || !navigationRef.isReady()) return;
  const target = pendingNavigation;
  pendingNavigation = null;
  navigationRef.navigate(target.name, target.params);
};
