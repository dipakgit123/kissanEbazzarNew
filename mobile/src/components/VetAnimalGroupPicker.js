import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useExperienceText } from '../context/AnimalExperienceContext';
export default function VetAnimalGroupPicker({ value = [], onChange }) {
  const text = useExperienceText();
  return <View style={{ padding: 16, backgroundColor: '#f7faf8', borderRadius: 12, marginVertical: 14 }}><Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 12 }}>{text.vetGroups}</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>{['farm', 'pet'].map(group => <TouchableOpacity key={group} accessibilityRole="checkbox" accessibilityState={{ checked: value.includes(group) }} onPress={() => onChange(value.includes(group) ? value.filter(item => item !== group) : [...value, group])} style={{ padding: 14, borderWidth: 1, borderColor: '#bcd5c7', borderRadius: 10, backgroundColor: value.includes(group) ? '#d8eee0' : 'white' }}><Text>{value.includes(group) ? '✓ ' : ''}{text[group]}</Text></TouchableOpacity>)}</View></View>;
}
