import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import api from '../services/api';
import { registerExperienceSwitch, setRequestAnimalGroup } from '../utils/animalExperience';
import { useTranslation } from 'react-i18next';
import copy from '../utils/animalExperienceText.json';

const Context = createContext(null);
export function AnimalExperienceProvider({ children }) {
  const { user, token, updateUser, requiresAnimalSelection, completeAnimalSelection } = useAuth();
  const account = useRef(token);
  account.current = token;
  const [group, setGroup] = useState(null), [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setGroup(null); setRequestAnimalGroup(null); setLoading(true);
    const load = async () => {
      if (!user?.id || !token || requiresAnimalSelection) { if (active) setLoading(false); return; }
      const cached = await AsyncStorage.getItem(`animalGroup:${user.id}`);
      let value = cached || user.metadata?.animal_group;
      if (!['farm', 'pet'].includes(value)) {
        try { const response = await api.get('/api/experience', { timeout: 5000 }); value = response.data.animal_group || value; } catch { /* Selection remains available when no preference can be loaded. */ }
      }
      if (active) {
        const valid = ['farm', 'pet'].includes(value) ? value : null;
        setRequestAnimalGroup(valid); setGroup(valid); setLoading(false);
      }
    };
    load().catch(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user?.id, token, requiresAnimalSelection]);
  const select = async value => {
    if (!['farm', 'pet'].includes(value) || !user?.id) return false;
    const ownerToken = token;
    await api.put('/api/experience', { animal_group: value });
    if (account.current !== ownerToken) return false;
    await AsyncStorage.setItem(`animalGroup:${user.id}`, value);
    if (account.current !== ownerToken) return false;
    setRequestAnimalGroup(value); setGroup(value);
    await updateUser({ ...user, metadata: { ...user.metadata, animal_group: value } });
    if (account.current !== ownerToken) return false;
    if (requiresAnimalSelection) await completeAnimalSelection();
    return true;
  };
  useEffect(() => { registerExperienceSwitch(requiresAnimalSelection ? null : select); return () => registerExperienceSwitch(null); }, [user, token, requiresAnimalSelection]);
  return <Context.Provider value={{ group: requiresAnimalSelection ? null : group, loading, select }}>{children}</Context.Provider>;
}
export const useAnimalExperience = () => useContext(Context);
export const useExperienceText = () => {
  const { i18n } = useTranslation();
  return copy[i18n.language?.split('-')[0]] || copy.en;
};
