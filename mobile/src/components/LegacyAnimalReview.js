import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import api from '../services/api';
import { useExperienceText } from '../context/AnimalExperienceContext';
export default function LegacyAnimalReview() {
  const text = useExperienceText();
  const [rows, setRows] = useState([]), [busy, setBusy] = useState(false), [error, setError] = useState(false);
  useEffect(() => { let active = true; api.get('/api/experience/unassigned').then(response => { if (active) setRows(response.data.data || []); }).catch(() => {}); return () => { active = false; }; }, []);
  const assign = async (row, group) => { if (busy) return; setBusy(true); setError(false); try { await api.put(`/api/experience/unassigned/${row.kind}/${row.id}`, { animal_group: group }); setRows(old => old.filter(item => item !== row)); } catch { setError(true); } finally { setBusy(false); } };
  if (!rows.length) return null;
  return <View style={{ padding: 16, backgroundColor: 'white', borderRadius: 16, gap: 12 }}><Text style={{ fontWeight: '700' }}>{text.unassigned}</Text>{error && <Text>{text.error}</Text>}{rows.map(row => <View key={`${row.kind}:${row.id}`}><Text>{row.name}</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{['farm', 'pet'].map(group => <TouchableOpacity key={group} disabled={busy} onPress={() => assign(row, group)} style={{ padding: 12, borderWidth: 1, borderColor: '#bcd5c7', borderRadius: 8 }}><Text>{text[group]}</Text></TouchableOpacity>)}</View></View>)}</View>;
}
