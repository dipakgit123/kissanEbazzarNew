import React, { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../config/api';
import { getAnimalGroup, getStoredUser, saveAnimalGroup, isAnimalSelectionRequired } from '../utils/animalExperience';
import copy from '../utils/animalExperienceText.json';
import './AnimalExperience.css';
import farmAnimalsImage from '../assets/images/experience/farm-animals.jpg';
import petAnimalsImage from '../assets/images/experience/pet-animals.jpg';

export const useExperienceText = () => {
  const { i18n } = useTranslation();
  return copy[i18n.language?.split('-')[0]] || copy.en;
};
export function ExperienceSwitcher() {
  const text = useExperienceText();
  return <Link className="experience-switch" to="/choose-experience" onClick={event => { if (!window.confirm(text.switchConfirm)) event.preventDefault(); }}>{text[getAnimalGroup() || 'farm']} <span aria-hidden="true">⇄</span></Link>;
}
export default function AnimalExperience() {
  const text = useExperienceText();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const selecting = useRef(false);
  const navigate = useNavigate();
  const user = getStoredUser();
  const next = user.full_name && user.postal_code ? '/' : '/profile-completion';
  useEffect(() => {
    if (getAnimalGroup() || isAnimalSelectionRequired()) return;
    const abort = new AbortController();
    fetch(`${API_BASE_URL}/api/experience`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, signal: abort.signal })
      .then(r => r.ok ? r.json() : null).then(data => {
        if (!abort.signal.aborted && !selecting.current && ['farm', 'pet'].includes(data?.animal_group)) {
          localStorage.setItem(`animalGroup:${user.id}`, data.animal_group);
          window.location.replace(next);
        }
      }).catch(() => {});
    return () => abort.abort();
  }, [next, user.id]);
  if (!localStorage.getItem('token')) return <Navigate to="/login" replace />;
  const select = async group => {
    if (selecting.current) return;
    selecting.current = true;
    setBusy(true); setError(false);
    try { await saveAnimalGroup(group); window.location.assign(next); }
    catch { selecting.current = false; setBusy(false); setError(true); }
  };
  return <main className="experience-page"><section className="experience-panel">
    <h1>{text.choose}</h1><p>{text.hint}</p>
    <div className="experience-cards">{['farm', 'pet'].map(group => <button className="experience-card" key={group} disabled={busy} onClick={() => select(group)}>
      <img className="experience-image" src={group === 'farm' ? farmAnimalsImage : petAnimalsImage} alt="" width="960" height="640" />
      <strong>{text[group]}</strong><span>{text[group + 'Species']}</span><b>{busy ? text.saving : text.continue} →</b>
    </button>)}</div>
    {error && <p role="alert">{text.error}</p>}
    {getAnimalGroup() && <button className="experience-cancel" onClick={() => navigate(-1)} disabled={busy}>{text.cancel}</button>}
  </section></main>;
}
