import { Link } from 'react-router-dom';
import LegacyAnimalReview from './LegacyAnimalReview';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useExperienceText } from './AnimalExperience';
import { getAnimalGroup, registrySpeciesFor } from '../utils/animalExperience';
import { API_BASE_URL } from '../config/api';

export default function MyAnimals() {
  const text = useExperienceText();
  const { t } = useTranslation();
  const empty = { name: '', species: getAnimalGroup() === 'pet' ? 'dog' : 'cow', tag: '', breed: '' };
  const [rows, setRows] = useState([]), [form, setForm] = useState(empty), [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false), [loading, setLoading] = useState(true), [error, setError] = useState(false);
  const request = async (path = '', method = 'GET', body) => {
    const response = await fetch(`${API_BASE_URL}/api/my-animals${path}`, { method, headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    if (!response.ok) throw new Error();
    return response.json();
  };
  const load = async () => { setLoading(true); setError(false); try { setRows((await request()).data); } catch { setError(true); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const save = async event => {
    event.preventDefault(); if (busy) return; setBusy(true); setError(false);
    try { await request(editing ? `/${editing}` : '', editing ? 'PUT' : 'POST', form); setForm(empty); setEditing(null); await load(); }
    catch { setError(true); } finally { setBusy(false); }
  };
  const remove = async id => {
    if (busy || !window.confirm(text.deleteConfirm)) return;
    setBusy(true); try { await request(`/${id}`, 'DELETE'); await load(); } catch { setError(true); } finally { setBusy(false); }
  };
  return <main className="animal-registry"><h1>{text.myAnimals}</h1><p>{text[getAnimalGroup() || 'farm']}</p>
    {error && <div role="alert">{text.error} <button onClick={load}>{text.retry}</button></div>}
    <LegacyAnimalReview /><form onSubmit={save}>
      <label>{text.name}<input required maxLength={100} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
      <label>{text.species}<select value={form.species} disabled={!!editing} onChange={e => setForm({ ...form, species: e.target.value })}>{registrySpeciesFor(getAnimalGroup()).map(species => <option key={species} value={species}>{t(`animalTypes.${species}`, species)}</option>)}</select></label>
      {['tag', 'breed'].map(key => <label key={key}>{text[key]}<input maxLength={100} value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })} /></label>)}
      <button disabled={busy}>{busy ? text.saving : editing ? text.save : text.add}</button>
      {editing && <button type="button" disabled={busy} onClick={() => { setEditing(null); setForm(empty); }}>{text.cancel}</button>}
    </form>
    {loading ? <p>{text.loading}</p> : rows.length === 0 && !error ? <p>{text.empty}</p> : rows.map(row => <article key={row.id}><div><strong>{row.name}</strong><p>{t(`animalTypes.${row.species}`, row.species)}{row.tag ? ` · ${row.tag}` : ''}</p></div>{['cow','buffalo','goat','sheep','horse','dog','cat','other'].includes(row.species) && <Link className="experience-switch" to={`/ai-health-check?animalId=${row.id}&species=${row.species}`}>{t('header.healthCheck')}</Link>}<button disabled={busy} onClick={() => { setEditing(row.id); setForm(row); }}>{text.edit}</button><button disabled={busy} onClick={() => remove(row.id)}>{text.remove}</button></article>)}
  </main>;
}
