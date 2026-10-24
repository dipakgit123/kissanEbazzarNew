import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { safeJsonParse } from './stringUtils';

export function getStoredUser() {
  const user = safeJsonParse(localStorage.getItem('userData'), null);
  return user && typeof user === 'object' && !Array.isArray(user) ? user : {};
}

export const speciesFor = group => group === 'pet' ? ['dog', 'cat', 'other'] : ['cow', 'buffalo', 'goat', 'sheep', 'horse', 'pig', 'other'];
export const allowedSpecies = (value, group = getAnimalGroup()) => speciesFor(group).includes(({ animal: 'cow', bull: 'cow' })[String(value).toLowerCase()] || String(value).toLowerCase());
export function getAnimalGroup() {
  try {
    const user = getStoredUser();
    if (localStorage.getItem(`animalSelectionRequired:${user.id}`) === 'true') return null;
    const saved = localStorage.getItem(`animalGroup:${user.id || 'guest'}`) || user.metadata?.animal_group;
    return ['farm', 'pet'].includes(saved) ? saved : null;
  } catch { return null; }
}
export function requireAnimalSelection() {
  const user = getStoredUser();
  localStorage.setItem(`animalSelectionRequired:${user.id}`, 'true');
}
export function isAnimalSelectionRequired() {
  const user = getStoredUser();
  return localStorage.getItem(`animalSelectionRequired:${user.id}`) === 'true';
}
export function featureAllowed(path, group = getAnimalGroup()) {
  if (/milk-reports|MilkReports|government-schemes|GovernmentScheme/.test(path)) return group !== 'pet';
  if (/pet-mating|PetMating/.test(path)) return group === 'pet';
  return true;
}
export async function saveAnimalGroup(group) {
  const response = await fetch(`${API_BASE_URL}/api/experience`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ animal_group: group }) });
  if (!response.ok) throw new Error('Unable to save');
  const user = getStoredUser();
  localStorage.setItem(`animalGroup:${user.id || 'guest'}`, group);
  localStorage.setItem('userData', JSON.stringify({ ...user, metadata: { ...user.metadata, animal_group: group } }));
  localStorage.removeItem(`animalSelectionRequired:${user.id}`);
}

// Cover the existing fetch-based services as well as axios, without touching external URLs.
export function installExperienceFetch() {
  if (window.__experienceFetchInstalled) return;
  window.__experienceFetchInstalled = true;
  axios.interceptors.request.use(config => {
    const url = new URL(config.url, config.baseURL || API_BASE_URL || window.location.origin);
    if (url.origin === new URL(API_BASE_URL || '/', window.location.origin).origin && url.pathname.startsWith('/api/')) config.headers['X-Animal-Group'] = getAnimalGroup() || 'farm';
    return config;
  });
  const original = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url, window.location.origin);
    if (url.origin === new URL(API_BASE_URL || '/', window.location.origin).origin && url.pathname.startsWith('/api/')) {
      const headers = new Headers(input instanceof Request ? input.headers : init.headers);
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
      headers.set('X-Animal-Group', getAnimalGroup() || 'farm');
      return original(input, { ...init, headers });
    }
    return original(input, init);
  };
}

export const registrySpeciesFor = group => group === 'pet' ? ['dog', 'cat', 'rabbit', 'bird', 'other'] : ['cow', 'buffalo', 'goat', 'sheep', 'horse', 'pig', 'chicken', 'duck', 'camel', 'donkey', 'rabbit', 'other'];
