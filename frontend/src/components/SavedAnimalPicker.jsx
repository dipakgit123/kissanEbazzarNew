import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config/api';
import { useExperienceText } from './AnimalExperience';
export default function SavedAnimalPicker({ onSelect, supportedSpecies }) {
  const [savedAnimals, setAnimals] = useState([]);
  const text = useExperienceText();
  useEffect(() => { const abort = new AbortController(); fetch(`${API_BASE_URL}/api/my-animals`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, signal: abort.signal }).then(r => r.ok ? r.json() : null).then(data => { if (!abort.signal.aborted) setAnimals(Array.isArray(data?.data) ? data.data : []); }).catch(() => {}); return () => abort.abort(); }, []);
  const animals = savedAnimals.filter(row => (supportedSpecies || ['cow','buffalo','goat','sheep','horse','pig','dog','cat','other']).includes(row.species));
  if (!animals.length) return null;
  return <label>{text.myAnimals}<select defaultValue="" onChange={event => { const animal = animals.find(row => String(row.id) === event.target.value); if (animal) onSelect(animal); }}><option value="">—</option>{animals.map(animal => <option key={animal.id} value={animal.id}>{animal.name}{animal.tag ? ` · ${animal.tag}` : ''}</option>)}</select></label>;
}
