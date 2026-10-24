import React, { useState } from 'react';
import { ScrollView, View, Text, Image, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAnimalExperience, useExperienceText } from '../context/AnimalExperienceContext';

const selectionImages = {
  farm: require('../assets/experience/farm-animals.jpg'),
  pet: require('../assets/experience/pet-animals.jpg'),
};

export default function AnimalExperienceScreen({ navigation }) {
  const { group, select } = useAnimalExperience();
  const text = useExperienceText();
  const wide = useWindowDimensions().width >= 700;
  const [busy, setBusy] = useState(false), [error, setError] = useState(false);
  const choose = async value => {
    if (busy) return;
    setBusy(true); setError(false);
    try { await select(value); if (value === group) navigation.goBack(); }
    catch { setError(true); } finally { setBusy(false); }
  };
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.container}>
    <View style={styles.panel}><Text style={styles.title}>{text.choose}</Text><Text style={styles.hint}>{text.hint}</Text>
      <View style={[styles.cards, wide && { flexDirection: 'row' }]}>{['farm', 'pet'].map(value => <TouchableOpacity key={value} disabled={busy} accessibilityRole="button" onPress={() => choose(value)} style={[styles.card, wide && { flex: 1, minWidth: 0 }, busy && { opacity: .6 }]}>
        <Image source={selectionImages[value]} style={{ width: '100%', aspectRatio: 1.5, borderRadius: 10 }} resizeMode="contain" accessible={false} /><Text style={styles.heading}>{text[value]}</Text><Text style={styles.hint}>{text[value + 'Species']}</Text><Text style={styles.action}>{busy ? text.saving : text.continue} →</Text>
      </TouchableOpacity>)}</View>
      {error && <Text accessibilityRole="alert" style={styles.error}>{text.error}</Text>}
      {group && <TouchableOpacity disabled={busy} onPress={() => navigation.goBack()} style={styles.cancel}><Text>{text.cancel}</Text></TouchableOpacity>}
    </View>
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#e8f0eb' }, container: { flexGrow: 1, justifyContent: 'center', padding: 20 }, panel: { width: '100%', maxWidth: 800, alignSelf: 'center', padding: 22, borderRadius: 20, borderWidth: 1, borderColor: '#d1e1d7', backgroundColor: 'white' }, title: { fontSize: 27, fontWeight: '700', color: '#173f34' }, hint: { fontSize: 16, color: '#566e64', lineHeight: 25, marginTop: 8 }, cards: { gap: 16, marginTop: 22 }, card: { padding: 20, borderWidth: 1, borderColor: '#bcd5c7', borderRadius: 15, backgroundColor: '#f7faf8' }, icon: { fontSize: 36 }, heading: { fontSize: 23, fontWeight: '700', color: '#173f34', marginTop: 8 }, action: { marginTop: 16, fontSize: 17, fontWeight: '700', color: '#11764f' }, cancel: { padding: 14, alignItems: 'center' }, error: { color: '#b42318', marginTop: 12 } });
