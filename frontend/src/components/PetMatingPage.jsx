import { Children, cloneElement, isValidElement, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import SavedAnimalPicker from './SavedAnimalPicker';
import { getCatBreedOptions } from '../constants/catBreeds';
import { getDogBreedOptions } from '../constants/dogBreeds';
import { petMatingService as api } from '../services/api';
import translations from '../utils/petMatingCopy.json';
import './PetMatingPage.css';
const empty = {
  pet_type: 'dog',
  pet_name: '',
  breed: '',
  gender: 'male',
  age_months: '',
  fee_type: 'negotiable',
  fee_amount: '',
  owner_phone: '',
  city: '',
  state: '',
  description: '',
  vaccination_status: 'unknown',
  last_vaccination_date: '',
  deworming_status: 'unknown',
  last_deworming_date: '',
  mating_experience: 'unknown',
  medical_notes: '',
  available_from: '',
  available_to: '',
  animal_profile_id: ''
};
const reasons = ['fake', 'inappropriate', 'wrong_information', 'spam', 'animal_welfare', 'other'];
const where = p => [p.city, p.state].filter(Boolean).join(', ');
const message = e => e?.response?.data?.message || e?.message || 'Unable to complete this request';
const fee = (p, ui, lang) => p.fee_type === 'paid' ? new Intl.NumberFormat(lang === 'en' ? 'en-IN' : `${lang}-IN`, {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
}).format(Number(p.fee_amount || 0)) : ui[p.fee_type] || ui.negotiable;
function Dialog({
  title,
  children,
  onClose,
  busy = false,
  ui
}) {
  const ref = useRef(null),
    close = useRef(onClose),
    blocked = useRef(busy);
  close.current = onClose;
  blocked.current = busy;
  useEffect(() => {
    const el = ref.current,
      trigger = document.activeElement,
      overflow = document.body.style.overflow;
    el.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      el.close();
      document.body.style.overflow = overflow;
      if (trigger?.isConnected) trigger.focus();
    };
  }, []);
  return <dialog ref={ref} className="mating-dialog" aria-labelledby="mating-dialog-title" onCancel={e => {
    e.preventDefault();
    if (!blocked.current) close.current();
  }}><header><h2 id="mating-dialog-title">{title}</h2><button type="button" disabled={busy} aria-label={ui.close} onClick={onClose}>×</button></header><div className="mating-dialog-body">{children}</div></dialog>;
}
function Field({
  label,
  children,
  error
}) {
  const id = useId();
  return <div className="mating-field"><label htmlFor={id}>{label}</label>{Children.map(children, child => isValidElement(child) && ['input', 'select', 'textarea'].includes(child.type) ? cloneElement(child, { id, 'aria-describedby': error ? `${id}-error` : undefined }) : child)}{error && <small id={`${id}-error`} role="alert">{error}</small>}</div>;
}
function Gallery({
  profile,
  ui
}) {
  const [index, setIndex] = useState(0),
    photos = profile.photos || [];
  return <div className="mating-gallery">{photos.length > 0 && <img className="mating-main-photo" src={photos[index] || photos[0]} alt={profile.pet_name} />}{photos.length > 1 && <div className="mating-thumbnails">{photos.map((src, i) => <button key={src + i} type="button" aria-label={`${profile.pet_name} ${i + 1}/${photos.length}`} aria-pressed={i === index} onClick={() => setIndex(i)}><img src={src} alt="" /></button>)}</div>}{profile.video_url && <video controls preload="metadata" playsInline src={profile.video_url} aria-label={ui.video} />}</div>;
}
function Editor({
  profile,
  onClose,
  onSaved,
  t,
  ui,
  lang
}) {
  const [form, setForm] = useState(() => Object.fromEntries(Object.entries(empty).map(([key, value]) => [key, profile?.[key] ?? value])));
  const [photos, setPhotos] = useState([]),
    [video, setVideo] = useState(null),
    [removeVideo, setRemoveVideo] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [fields, setFields] = useState({});
  const lock = useRef(false);
  const update = (key, value) => setForm(old => ({
    ...old,
    [key]: value,
    ...(key === 'pet_type' ? {
      breed: '',
      animal_profile_id: ''
    } : {}),
    ...(key === 'fee_type' && value !== 'paid' ? {
      fee_amount: ''
    } : {})
  }));
  const breeds = useMemo(() => {
    const list = (form.pet_type === 'cat' ? getCatBreedOptions : getDogBreedOptions)(lang, t('petMating.selectBreed'));
    return form.breed && !list.some(b => b.value === form.breed) ? [...list, {
      value: form.breed,
      label: form.breed
    }] : list;
  }, [form.pet_type, form.breed, lang, t]);
  const previews = useMemo(() => photos.map(file => URL.createObjectURL(file)), [photos]);
  useEffect(() => () => previews.forEach(url => URL.revokeObjectURL(url)), [previews]);
  const input = (key, label, props = {}) => <Field label={label} error={fields[key]}><input {...props} name={key} value={form[key]} onChange={e => update(key, e.target.value)} aria-invalid={Boolean(fields[key])} /></Field>;
  const select = (key, label, values) => <Field label={label} error={fields[key]}><select name={key} value={form[key]} onChange={e => update(key, e.target.value)}>{values.map(v => <option key={v} value={v}>{ui[v] || t(`petMating.${v}`, {
          defaultValue: v
        })}</option>)}</select></Field>;
  const submit = async e => {
    e.preventDefault();
    if (lock.current) return;
    if (!photos.length && !profile?.photos?.length) {
      setError(t('petMating.photoRequired'));
      return;
    }
    lock.current = true;
    setBusy(true);
    setError('');
    setFields({});
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value ?? ''));
    photos.forEach(file => data.append('photos', file));
    if (video) data.append('video', video);
    if (removeVideo && !video) data.append('remove_video', 'true');
    try {
      if (profile) await api.updateProfile(profile.id, data);else await api.createProfile(data);
      toast.success(ui.saved);
      onSaved();
    } catch (e) {
      setError(message(e));
      setFields(e?.fields || e?.response?.data?.fields || {});
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return <Dialog title={profile ? ui.edit : ui.create} onClose={onClose} busy={busy} ui={ui}><form onSubmit={submit} className="mating-editor">
  {!profile && <SavedAnimalPicker supportedSpecies={['dog', 'cat']} onSelect={a => setForm(old => ({
        ...old,
        pet_type: a.species,
        pet_name: a.name,
        breed: a.breed || '',
        animal_profile_id: a.id
      }))} />}
  <Field label={t('petMating.addPhotos')}><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={e => {
          const files = Array.from(e.target.files || []);
          if (files.length > 5 || files.some(f => f.size > 25 * 1024 * 1024 || !f.type.startsWith('image/'))) {
            setError(ui.mediaLimit);
            e.target.value = '';
            return;
          }
          setPhotos(files);
          setError('');
        }} /><small>{ui.newPhotos}</small></Field>
  <div className="mating-thumbnails">{(previews.length ? previews : profile?.photos || []).map((src, i) => <img key={src} src={src} alt={`${ui.existingPhotos} ${i + 1}`} />)}</div>
  <div className="mating-form-grid">
   <Field label={t('petMating.petType')}><select value={form.pet_type} onChange={e => update('pet_type', e.target.value)}>{['dog', 'cat'].map(v => <option key={v} value={v}>{t(`animalTypes.${v}`)}</option>)}</select></Field>
   {input('pet_name', t('petMating.petName'), {
          required: true,
          maxLength: 120
        })}
   <Field label={t('petMating.selectBreed')} error={fields.breed}><select required value={form.breed} onChange={e => update('breed', e.target.value)}>{breeds.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}</select></Field>
   {select('gender', t('petMating.gender'), ['male', 'female'])}{input('age_months', t('petMating.ageMonths'), {
          type: 'number',
          min: 1,
          max: 600,
          step: 1
        })}{input('owner_phone', t('petMating.ownerPhone'), {
          type: 'tel',
          required: true,
          maxLength: 30,
          autoComplete: 'tel'
        })}
   {select('fee_type', ui.feeType, ['negotiable', 'free', 'paid'])}{form.fee_type === 'paid' && input('fee_amount', t('petMating.feePrice'), {
          type: 'number',
          required: true,
          min: 0.01,
          max: 100000000,
          step: 0.01
        })}{input('city', t('petMating.city'), {
          maxLength: 120
        })}{input('state', t('petMating.state'), {
          maxLength: 120
        })}
  </div>
  <details className="mating-optional"><summary>{ui.health}</summary><div className="mating-form-grid">
   {select('vaccination_status', ui.vaccination, ['unknown', 'not_vaccinated', 'partial', 'up_to_date'])}{input('last_vaccination_date', ui.vaccinationDate, {
            type: 'date',
            max: new Date().toISOString().slice(0, 10)
          })}{select('deworming_status', ui.deworming, ['unknown', 'not_done', 'done'])}{input('last_deworming_date', ui.dewormingDate, {
            type: 'date',
            max: new Date().toISOString().slice(0, 10)
          })}{select('mating_experience', ui.experience, ['unknown', 'first_time', 'experienced'])}{input('available_from', ui.from, {
            type: 'date'
          })}{input('available_to', ui.until, {
            type: 'date',
            min: form.available_from || undefined
          })}
  </div><Field label={ui.medical}><textarea maxLength={2000} value={form.medical_notes} onChange={e => update('medical_notes', e.target.value)} /></Field></details>
  <Field label={t('petMating.description')}><textarea maxLength={4000} rows={3} value={form.description} onChange={e => update('description', e.target.value)} /></Field>
  <Field label={t('petMating.addVideoOptional')}><input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={e => {
          const file = e.target.files?.[0];
          if (file && file.size > 25 * 1024 * 1024) {
            setError(ui.mediaLimit);
            e.target.value = '';
            return;
          }
          setVideo(file || null);
          setRemoveVideo(false);
        }} /></Field>
  {profile?.video_url && !video && <label className="mating-checkbox"><input type="checkbox" checked={removeVideo} onChange={e => setRemoveVideo(e.target.checked)} />{ui.removeVideo}</label>}{error && <p className="mating-error" role="alert">{error}</p>}
  <div className="mating-actions"><button type="button" disabled={busy} onClick={onClose}>{ui.cancel}</button><button className="primary" disabled={busy}>{busy ? t('common.loading') : ui.save}</button></div>
 </form></Dialog>;
}
function Report({
  profile,
  onClose,
  ui
}) {
  const [reason, setReason] = useState(''),
    [description, setDescription] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  return <Dialog title={ui.report} onClose={onClose} busy={busy} ui={ui}><form className="mating-editor" onSubmit={async e => {
      e.preventDefault();
      if (busy) return;
      setBusy(true);
      try {
        await api.reportProfile(profile.id, {
          reason,
          description
        });
        toast.success(ui.reportSent);
        onClose();
      } catch (e) {
        setError(message(e));
      } finally {
        setBusy(false);
      }
    }}><Field label={ui.reason}><select required value={reason} onChange={e => setReason(e.target.value)}><option value="">{ui.chooseReason}</option>{reasons.map(v => <option key={v} value={v}>{ui[v]}</option>)}</select></Field><Field label={ui.details}><textarea required minLength={5} maxLength={2000} rows={4} value={description} onChange={e => setDescription(e.target.value)} /></Field>{error && <p className="mating-error" role="alert">{error}</p>}<button className="primary" disabled={busy}>{ui.submitReport}</button></form></Dialog>;
}
export default function PetMatingPage() {
  const {
      t,
      i18n
    } = useTranslation(),
    lang = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0],
    ui = translations[lang] || translations.en;
  const [filters, setFilters] = useState({
      petType: 'all',
      breed: '',
      gender: 'all',
      search: ''
    }),
    [search, setSearch] = useState(''),
    [page, setPage] = useState(1),
    [pages, setPages] = useState(1),
    [total, setTotal] = useState(0);
  const [profiles, setProfiles] = useState([]),
    [mine, setMine] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [editor, setEditor] = useState(null),
    [selected, setSelected] = useState(null),
    [report, setReport] = useState(null),
    [actionBusy, setActionBusy] = useState(false);
  const filterBreeds = useMemo(() => {
    const placeholder = t('petMating.allBreeds', { defaultValue: 'All breeds' });
    const options = filters.petType === 'dog' ? getDogBreedOptions(lang, placeholder) : filters.petType === 'cat' ? getCatBreedOptions(lang, placeholder) : [...getDogBreedOptions(lang, placeholder), ...getCatBreedOptions(lang, placeholder)];
    return options.filter((item, index) => options.findIndex(other => other.value === item.value) === index);
  }, [filters.petType, lang, t]);
  const request = useRef(0),
    detailRequest = useRef(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setFilters(old => old.search === search ? old : {
        ...old,
        search
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  const load = useCallback(async () => {
    const id = ++request.current;
    setLoading(true);
    setError('');
    try {
      const [publicData, ownData] = await Promise.all([api.getProfiles({
        ...filters,
        page,
        limit: 12
      }), api.getMyProfiles()]);
      if (id !== request.current) return;
      const data = publicData.data;
      setProfiles(data.profiles || []);
      setMine((ownData.data?.profiles || []).filter(p => p.status !== 'removed'));
      setTotal(data.total || 0);
      setPages(data.totalPages || 1);
      if (page > data.totalPages) setPage(Math.max(1, data.totalPages));
    } catch (e) {
      if (id === request.current) setError(message(e));
    } finally {
      if (id === request.current) setLoading(false);
    }
  }, [filters, page]);
  useEffect(() => {
    load();
    return () => {
      request.current++;
    };
  }, [load]);
  const open = async p => {
    const id = ++detailRequest.current;
    setSelected({
      loading: true
    });
    try {
      const r = await api.getProfile(p.id);
      if (id === detailRequest.current) setSelected(r.data.profile);
    } catch (e) {
      if (id === detailRequest.current) {
        setSelected(null);
        toast.error(message(e));
      }
    }
  };
  const closeDetail = () => {
    detailRequest.current++;
    setSelected(null);
  };
  const status = async (p, value) => {
    if (actionBusy) return;
    setActionBusy(true);
    try {
      await api.updateStatus(p.id, value);
      toast.success(ui.updated);
      await load();
    } catch (e) {
      toast.error(message(e));
    } finally {
      setActionBusy(false);
    }
  };
  const remove = async p => {
    if (actionBusy || !window.confirm(t('petMating.deleteConfirm'))) return;
    setActionBusy(true);
    try {
      await api.deleteProfile(p.id);
      await load();
    } catch (e) {
      toast.error(message(e));
    } finally {
      setActionBusy(false);
    }
  };
  const contact = async (p, whatsapp = false) => {
    if (actionBusy) return;
    setActionBusy(true);
    try {
      const r = await api.trackContact(p.id);
      const phone = String(r.data.owner_phone || '').replace(/[^\d+]/g, '');
      if (!phone) throw Error(t('petMating.noPhone'));
      if (whatsapp) {
        const digits = phone.replace(/\D/g, '');
        window.location.href = `https://wa.me/${digits.length === 10 ? '91' + digits : digits}`;
      } else window.location.href = `tel:${phone}`;
    } catch (e) {
      toast.error(message(e));
    } finally {
      setActionBusy(false);
    }
  };
  const filter = (key, value) => {
    setPage(1);
    setFilters(old => ({
      ...old,
      [key]: value,
      ...(key === 'petType' ? { breed: '' } : {})
    }));
  };
  return <main className="mating-page"><header className="mating-page-header"><div><h1>{ui.title}</h1><p>{ui.intro}</p></div><button className="primary" onClick={() => setEditor({})}>{ui.create}</button></header>
  <section className="mating-filters" aria-label={t('common.filter', {
      defaultValue: 'Filters'
    })}><Field label={t('petMating.searchLabel')}><input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('petMating.searchPlaceholder')} /></Field><Field label={t('petMating.petType')}><select value={filters.petType} onChange={e => filter('petType', e.target.value)}><option value="all">{t('petMating.allPets')}</option>{['dog', 'cat'].map(v => <option key={v} value={v}>{t(`animalTypes.${v}`)}</option>)}</select></Field><Field label={t('petMating.selectBreed')}><select value={filters.breed} onChange={e => filter('breed', e.target.value)}>{filterBreeds.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}</select></Field><Field label={t('petMating.gender')}><select value={filters.gender} onChange={e => filter('gender', e.target.value)}><option value="all">{t('petMating.allGenders')}</option>{['male', 'female'].map(v => <option key={v} value={v}>{t(`petMating.${v}`)}</option>)}</select></Field></section>
  {mine.length > 0 && <details className="mating-mine" open><summary>{ui.mine} ({mine.length})</summary><div className="mating-owner-grid">{mine.map(p => <article key={p.id}><div><strong>{p.pet_name}</strong><p>{p.breed} · {ui[p.status === 'matched' ? 'matchedStatus' : p.status]}</p></div><div className="mating-actions">{['active', 'paused', 'matched'].includes(p.status) && <><button disabled={actionBusy} onClick={() => setEditor(p)}>{ui.edit}</button><button disabled={actionBusy} onClick={() => status(p, p.status === 'active' ? 'paused' : 'active')}>{p.status === 'active' ? ui.pause : ui.activate}</button>{p.status !== 'matched' && <button disabled={actionBusy} onClick={() => status(p, 'matched')}>{ui.matched}</button>}</>}<button className="danger" disabled={actionBusy} onClick={() => remove(p)}>{ui.delete}</button></div></article>)}</div></details>}
  <div className="mating-section-title"><h2>{ui.browse}</h2><span>{total} {ui.total}</span></div>
  {error ? <div className="mating-empty" role="alert"><p>{error}</p><button onClick={load}>{ui.retry}</button></div> : loading ? <div className="mating-empty" role="status">{t('common.loading')}</div> : profiles.length ? <div className="mating-profile-grid">{profiles.map(p => <article className="mating-profile-card" key={p.id}><button onClick={() => open(p)}><img src={p.photos?.[0]} alt={p.pet_name} loading="lazy" /><div><div className="mating-section-title"><h3>{p.pet_name}</h3><span>{fee(p, ui, lang)}</span></div><p>{t(`animalTypes.${p.pet_type}`)} · {p.breed} · {t(`petMating.${p.gender}`)}</p><p>{where(p) || t('profile.locationNotSet')}</p><span className="mating-view">{t('petMating.viewDetails', {
                defaultValue: 'View details'
              })} →</span></div></button></article>)}</div> : <div className="mating-empty"><h3>{ui.empty}</h3><button onClick={() => {
        setSearch('');
        setFilters({
          petType: 'all',
          gender: 'all',
          search: ''
        });
        setPage(1);
      }}>{ui.clear}</button></div>}
  {pages > 1 && <nav className="mating-pagination" aria-label={ui.page}><button disabled={loading || page <= 1} onClick={() => setPage(p => p - 1)}>{ui.previous}</button><span>{ui.page} {page} / {pages}</span><button disabled={loading || page >= pages} onClick={() => setPage(p => p + 1)}>{ui.next}</button></nav>}
  {editor && <Editor profile={editor.id ? editor : null} onClose={() => setEditor(null)} onSaved={() => {
      setEditor(null);
      load();
    }} t={t} ui={ui} lang={lang} />}
  {selected && <Dialog title={selected.pet_name || ui.loadingDetails} onClose={closeDetail} ui={ui}>{selected.loading ? <p role="status">{ui.loadingDetails}</p> : <><div className="mating-detail-grid"><Gallery profile={selected} ui={ui} /><div><h3>{selected.breed} · {t(`petMating.${selected.gender}`)}</h3><dl className="mating-facts">{[[ui.feeType, fee(selected, ui, lang)], [t('petMating.ageMonths'), selected.age_months], [t('petMating.city'), where(selected)], [ui.vaccination, ui[selected.vaccination_status]], [ui.vaccinationDate, selected.last_vaccination_date], [ui.deworming, ui[selected.deworming_status]], [ui.dewormingDate, selected.last_deworming_date], [ui.experience, ui[selected.mating_experience]], [ui.from, selected.available_from], [ui.until, selected.available_to]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || ui.unknown}</dd></div>)}</dl><p className="mating-description">{selected.description}</p>{selected.medical_notes && <p className="mating-description">{selected.medical_notes}</p>}</div></div><p className="mating-note">{ui.healthNote}</p><div className="mating-actions"><button className="primary" disabled={actionBusy} onClick={() => contact(selected)}>{ui.contact}</button><button disabled={actionBusy} onClick={() => contact(selected, true)}>{ui.whatsapp}</button><button className="danger" onClick={() => {
            setReport(selected);
            closeDetail();
          }}>{ui.report}</button></div></>}</Dialog>}
  {report && <Report profile={report} onClose={() => setReport(null)} ui={ui} />}
 </main>;
}
