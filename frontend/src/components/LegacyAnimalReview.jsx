import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config/api';
import { useExperienceText } from './AnimalExperience';
export default function LegacyAnimalReview() {
  const text = useExperienceText();
  const [rows, setRows] = useState([]), [busy, setBusy] = useState(false), [error, setError] = useState(false);
  const headers = { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' };
  useEffect(() => { let active = true; fetch(`${API_BASE_URL}/api/experience/unassigned`, { headers }).then(r => r.ok ? r.json() : null).then(data => { if (active) setRows(data?.data || []); }).catch(() => {}); return () => { active = false; }; }, []);
  const assign = async (row, group) => {
    if (busy) return; setBusy(true); setError(false);
    try { const response = await fetch(`${API_BASE_URL}/api/experience/unassigned/${row.kind}/${row.id}`, { method: 'PUT', headers, body: JSON.stringify({ animal_group: group }) }); if (!response.ok) throw new Error(); setRows(old => old.filter(item => item !== row)); }
    catch { setError(true); } finally { setBusy(false); }
  };
  if (!rows.length) return null;
  return <section className="border rounded-xl p-4 my-4"><h2>{text.unassigned}</h2>{error && <p role="alert">{text.error}</p>}{rows.map(row => <article key={`${row.kind}:${row.id}`}><div>{row.name}</div>{['farm', 'pet'].map(group => <button key={group} disabled={busy} onClick={() => assign(row, group)}>{text[group]}</button>)}</article>)}</section>;
}
