import LegacyAnimalReview from '../components/LegacyAnimalReview';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import AppHeader from '../components/AppHeader';
import api from '../services/api';
import { useAnimalExperience, useExperienceText } from '../context/AnimalExperienceContext';
import { registrySpeciesFor } from '../utils/animalExperience';

export default function MyAnimalsScreen({ navigation }) {
  const { group } = useAnimalExperience(), text = useExperienceText(), { t } = useTranslation();
  const empty = { name: '', species: group === 'pet' ? 'dog' : 'cow', tag: '', breed: '' };
  const [form, setForm] = useState(empty), [rows, setRows] = useState([]), [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false), [loading, setLoading] = useState(true), [error, setError] = useState(false);
  const load = async () => { setLoading(true); setError(false); try { setRows((await api.get('/api/my-animals')).data.data); } catch { setError(true); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const save = async () => {
    if (busy || !form.name.trim()) return; setBusy(true); setError(false);
    try { await api.request({ url: `/api/my-animals${editing ? '/' + editing : ''}`, method: editing ? 'PUT' : 'POST', data: form }); setEditing(null); setForm(empty); await load(); }
    catch { setError(true); } finally { setBusy(false); }
  };
  const remove = id => Alert.alert(text.remove, text.deleteConfirm, [{ text: text.cancel, style: 'cancel' }, { text: text.remove, style: 'destructive', onPress: async () => {
    if (busy) return; setBusy(true); try { await api.delete(`/api/my-animals/${id}`); await load(); } catch { setError(true); } finally { setBusy(false); }
  } }]);
  return <SafeAreaView style={styles.safe}><AppHeader safeArea={false} navigation={navigation} title={text.myAnimals} subtitle={text[group]} />
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {error && <TouchableOpacity onPress={load}><Text accessibilityRole="alert" style={styles.error}>{text.error} {text.retry}</Text></TouchableOpacity>}
      <LegacyAnimalReview /><View style={styles.card}>{['name', 'tag', 'breed'].map(key => <View key={key}><Text style={styles.label}>{text[key]}</Text><TextInput accessibilityLabel={text[key]} value={form[key] || ''} onChangeText={value => setForm({ ...form, [key]: value })} maxLength={100} style={styles.input} /></View>)}
        <Text style={styles.label}>{text.species}</Text><View style={styles.chips}>{registrySpeciesFor(group).map(species => <TouchableOpacity disabled={!!editing} accessibilityRole="button" accessibilityState={{ selected: form.species === species }} key={species} style={[styles.chip, form.species === species && styles.selected]} onPress={() => setForm({ ...form, species })}><Text>{t(`animalTypes.${species}`, species)}</Text></TouchableOpacity>)}</View>
        <TouchableOpacity accessibilityRole="button" disabled={busy || !form.name.trim()} onPress={save} style={styles.save}><Text style={styles.saveText}>{busy ? text.saving : editing ? text.save : text.add}</Text></TouchableOpacity>
        {editing && <TouchableOpacity onPress={() => { setEditing(null); setForm(empty); }} style={styles.chip}><Text>{text.cancel}</Text></TouchableOpacity>}
      </View>
      {loading ? <Text>{text.loading}</Text> : !rows.length && !error ? <Text>{text.empty}</Text> : rows.map(row => <View key={row.id} style={styles.card}><Text style={styles.name}>{row.name}</Text><Text>{t(`animalTypes.${row.species}`, row.species)}{row.tag ? ` · ${row.tag}` : ''}</Text><View style={styles.chips}>{['cow','buffalo','goat','sheep','horse','dog','cat','other'].includes(row.species) && <TouchableOpacity style={styles.chip} onPress={() => navigation.navigate('AIHealthCheck', { animalId: row.id, species: row.species })}><Text>{t('services.aiHealthCheck')}</Text></TouchableOpacity>}<TouchableOpacity disabled={busy} style={styles.chip} onPress={() => { setForm(row); setEditing(row.id); }}><Text>{text.edit}</Text></TouchableOpacity><TouchableOpacity disabled={busy} style={styles.chip} onPress={() => remove(row.id)}><Text>{text.remove}</Text></TouchableOpacity></View></View>)}
    </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#e8f0eb' }, content: { padding: 16, gap: 16 }, card: { padding: 18, borderRadius: 16, borderWidth: 1, borderColor: '#d1e1d7', backgroundColor: 'white', gap: 10 }, label: { color: '#173f34', marginBottom: 6, fontSize: 15 }, input: { borderWidth: 1, borderColor: '#bcd5c7', borderRadius: 8, padding: 12, fontSize: 16 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { padding: 12, borderWidth: 1, borderColor: '#bcd5c7', borderRadius: 8 }, selected: { backgroundColor: '#d8eee0', borderColor: '#11764f' }, save: { padding: 14, borderRadius: 10, backgroundColor: '#11764f', alignItems: 'center' }, saveText: { color: 'white', fontWeight: '700' }, name: { fontSize: 20, fontWeight: '700', color: '#173f34' }, error: { color: '#b42318' } });
