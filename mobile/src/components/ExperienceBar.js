import React from 'react';
import { Alert, View, Text, TouchableOpacity } from 'react-native';
import { useAnimalExperience, useExperienceText } from '../context/AnimalExperienceContext';
export default function ExperienceBar({ navigation }) {
  const { group } = useAnimalExperience();
  const text = useExperienceText();
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 14, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#d1e1d7' }}>
    <TouchableOpacity accessibilityRole="button" style={{ padding: 10, backgroundColor: '#edf5ef', borderRadius: 9 }} onPress={() => Alert.alert(text.choose, text.switchConfirm, [{ text: text.cancel, style: 'cancel' }, { text: text.continue, onPress: () => navigation.navigate('ChooseExperience') }])}><Text style={{ color: '#173f34', fontWeight: '700' }}>{text[group || 'farm']} ⇄</Text></TouchableOpacity>
    <TouchableOpacity accessibilityRole="button" style={{ padding: 10 }} onPress={() => navigation.navigate('MyAnimals')}><Text style={{ color: '#173f34' }}>{text.myAnimals}</Text></TouchableOpacity>
  </View>;
}
