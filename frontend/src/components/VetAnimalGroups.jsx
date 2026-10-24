import React, { useEffect, useState } from 'react';
import { useExperienceText } from './AnimalExperience';
import { API_BASE_URL } from '../config/api';
export function VetAnimalGroupPicker({ value = [], onChange }) {
  const text = useExperienceText();
  return <fieldset className="border rounded-xl p-4 my-4"><legend>{text.vetGroups}</legend><div className="flex flex-wrap gap-5">{['farm', 'pet'].map(group => <label className="flex items-center gap-2" key={group}><input type="checkbox" checked={value.includes(group)} onChange={e => onChange(e.target.checked ? [...value, group] : value.filter(item => item !== group))} />{text[group]}</label>)}</div></fieldset>;
}
export default function VetAnimalGroups() {
  const text = useExperienceText();
  const [groups, setGroups] = useState([]), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(false), [saved, setSaved] = useState(false);
  const request = async (method, data) => {
    const response = await fetch(`${API_BASE_URL}/api/veterinarians/profile/me`, { method, headers: { Authorization: `Bearer ${localStorage.getItem('vetToken')}`, 'Content-Type': 'application/json' }, body: data ? JSON.stringify(data) : undefined });
    if (!response.ok) throw new Error(); return response.json();
  };
  useEffect(() => { let active = true; request('GET').then(data => { if (active) setGroups((data.data || data.veterinarian)?.animal_groups || []); }).catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  const save = async () => { setBusy(true); setError(false); setSaved(false); try { await request('PUT', { animal_groups: groups }); setSaved(true); } catch { setError(true); } finally { setBusy(false); } };
  return <section className="bg-white rounded-xl p-4 my-4 border"><VetAnimalGroupPicker value={groups} onChange={value => { setGroups(value); setSaved(false); }} />{error && <p role="alert">{text.error}</p>}{saved && <p role="status">{text.saved || 'Saved'}</p>}<button className="px-5 py-3 rounded-lg bg-primary text-white" disabled={busy || loading || !groups.length} onClick={save}>{busy ? text.saving : text.save}</button></section>;
}
