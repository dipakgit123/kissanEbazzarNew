import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import api from '../services/api';
import { useExperienceText } from '../context/AnimalExperienceContext';
export default function SavedAnimalPicker({ onSelect, supportedSpecies }) {
  const [animals, setAnimals] = useState([]);
  const text = useExperienceText();
  useEffect(() => { let active = true; api.get('/api/my-animals').then(response => { if (active) setAnimals((response.data.data || []).filter(row => (supportedSpecies || ['cow','buffalo','goat','sheep','horse','pig','dog','cat','other']).includes(row.species))); }).catch(() => {}); return () => { active = false; }; }, []);
  if (!animals.length) return null;
  return <View style={{ marginVertical: 12 }}><Text style={{ fontWeight: '700' }}>{text.myAnimals}</Text><ScrollView horizontal contentContainerStyle={{ gap: 8, paddingVertical: 10 }}>{animals.map(animal => <TouchableOpacity key={animal.id} onPress={() => onSelect(animal)} style={{ padding: 12, borderWidth: 1, borderColor: '#bcd5c7', borderRadius: 10 }}><Text>{animal.name}{animal.tag ? ` · ${animal.tag}` : ''}</Text></TouchableOpacity>)}</ScrollView></View>;
}
