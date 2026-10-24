import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getAnimalGroup, saveAnimalGroup } from '../utils/animalExperience';
import { useExperienceText } from './AnimalExperience';
import { API_BASE_URL } from '../config/api';
export default function AnimalDetailExperience({ children }) {
  const { animalType, id } = useParams(), text = useExperienceText();
  const [busy, setBusy] = useState(false), [error, setError] = useState(false);
  const [otherGroup, setOtherGroup] = useState(null), [resolving, setResolving] = useState(animalType === 'other');
  useEffect(() => {
    if (animalType !== 'other') return;
    const abort = new AbortController();
    setResolving(true);
    fetch(`${API_BASE_URL}/api/experience/listing-group/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, signal: abort.signal })
      .then(r => r.ok ? r.json() : null).then(data => { if (!abort.signal.aborted) setOtherGroup(data?.animal_group || null); })
      .catch(() => {}).finally(() => { if (!abort.signal.aborted) setResolving(false); });
    return () => abort.abort();
  }, [animalType, id]);
  const group = ['dog', 'cat'].includes(animalType) ? 'pet' : ['cow', 'buffalo', 'horse', 'goat'].includes(animalType) ? 'farm' : otherGroup;
  if (resolving) return <p className="p-6" role="status">{text.loading}</p>;
  if (!group || group === getAnimalGroup()) return children;
  return <main className="experience-page"><section className="experience-panel"><h1>{text[group]}</h1><p>{text.hint}</p>{error && <p role="alert">{text.error}</p>}<button className="experience-switch" disabled={busy} onClick={async () => { setBusy(true); try { await saveAnimalGroup(group); window.location.reload(); } catch { setError(true); setBusy(false); } }}>{busy ? text.saving : text.continue}</button></section></main>;
}
