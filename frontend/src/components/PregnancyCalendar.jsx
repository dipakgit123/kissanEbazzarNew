import SavedAnimalPicker from './SavedAnimalPicker';
import { getAnimalGroup, allowedSpecies } from '../utils/animalExperience';
import { cloneElement, useCallback, useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { FaBaby, FaCalendarDays, FaChevronLeft, FaChevronRight, FaPlus, FaXmark, FaPaw, FaCow, FaCat, FaDog, FaHorseHead, FaPen, FaTrashCan, FaListUl, FaBookOpen } from 'react-icons/fa6';
import { GiBuffaloHead, GiGoat, GiSheep, GiPig } from 'react-icons/gi';
import { pregnancyService } from '../services/api';
import { FullPageLoader } from './AppLoader';
import { DEFAULT_DURATIONS, businessToday, daysSinceBreeding, addDays, dateKey, dayNumber, daysRemaining, moveMonth, pregnancyProgress, recordOnDate, calendarDayRecords, recordsInMonth } from '../utils/pregnancyCalendar';
import './PregnancyCalendar.css';

const ICONS = { cow: FaCow, buffalo: GiBuffaloHead, goat: GiGoat, sheep: GiSheep, horse: FaHorseHead, dog: FaDog, cat: FaCat, pig: GiPig, other: FaPaw };
const STATUS_KEYS = { pregnant: 'statusActive', delivered: 'delivered', miscarriage: 'statusMiscarriage', false_pregnancy: 'statusFalsePregnancy', cancelled: 'statusCancelled' };
const emptyRecord = () => ({ animal_type: getAnimalGroup() === 'pet' ? 'dog' : 'cow', animal_name: '', ear_badge_number: '', pregnancy_duration_days: '', mating_date: businessToday(), mating_type: 'natural', notes: '' });
const emptyCheck = () => ({ checked_on: businessToday(), result: '', estimated_age_value: '', estimated_age_unit: 'months', next_check_date: '', doctor_name: '', notes: '', request_id: crypto.randomUUID() });
const emptyDelivery = () => ({ delivery_date: businessToday(), offspring_count: 1, offspring_gender: 'male', offspring_details: '' });

function AnimalIcon({ type }) {
  const Icon = ICONS[type] || FaPaw;
  return <Icon aria-hidden="true" />;
}

function Field({ label, children, wide = false }) {
  const id = useId();
  return <div className={`pregnancy-field${wide ? ' pregnancy-field-wide' : ''}`}><label htmlFor={id}>{label}</label>{cloneElement(children, { id })}</div>;
}

function RecordDialog({ title, busy, onClose, children, closeLabel }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    return () => { dialog.close(); document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return <dialog ref={ref} className="pregnancy-dialog" aria-labelledby="pregnancy-dialog-title" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <header><h2 id="pregnancy-dialog-title">{title}</h2><button type="button" className="pc-icon-button" aria-label={closeLabel} disabled={busy} onClick={onClose}><FaXmark /></button></header>
    {children}
  </dialog>;
}

export default function PregnancyCalendar() {
  const { t, i18n } = useTranslation();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState('active');
  const [mobileView, setMobileView] = useState('records');
  const [month, setMonth] = useState(() => moveMonth(new Date(), 0));
  const [selectedDate, setSelectedDate] = useState('');
  const [search, setSearch] = useState('');
  const [animalFilter, setAnimalFilter] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [today, setToday] = useState(businessToday);
  const [visibleCount, setVisibleCount] = useState(6);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyRecord);
  const [check, setCheck] = useState(null);
  const [durations, setDurations] = useState(DEFAULT_DURATIONS);
  const [delivery, setDelivery] = useState(emptyDelivery);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const operation = useRef(false);
  const requestVersion = useRef(0);
  useEffect(() => {
    const updateDay = () => setToday(businessToday(timezone));
    updateDay();
    const timer = window.setInterval(updateDay, 60000);
    document.addEventListener('visibilitychange', updateDay);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', updateDay); };
  }, [timezone]);
  const locale = ({ mr: 'mr-IN', hi: 'hi-IN' })[i18n.resolvedLanguage?.split('-')[0]] || 'en-IN';
  const checkText = (key, options) => t(`pregnancyCheck.${key}`, options);
  const checkStatus = record => record.status === 'pending_confirmation' ? checkText('pending') : record.status === 'not_pregnant' ? checkText('notPregnant') : record.status === 'pregnant' ? checkText(record.confirmed_on ? 'confirmed' : 'legacy') : STATUS_KEYS[record.status] ? text(STATUS_KEYS[record.status]) : checkText('unknown');
  const text = key => t(`pregnancy.${key}`);
  const ui = (key, options) => t(`pregnancyUi.${key}`, options);
  const animalName = type => text(`animal${type.charAt(0).toUpperCase() + type.slice(1)}`);
  const formatDate = value => Number.isFinite(dayNumber(value)) ? new Date(`${value}T12:00:00Z`).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—';

  const fetchRecords = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true); setError(false);
    try {
      const [result, durationResult] = await Promise.all([pregnancyService.getRecords(), pregnancyService.getDurations()]);
      if (version === requestVersion.current && durationResult.success) setDurations(previous => ({ ...previous, ...Object.fromEntries(durationResult.data.map(item => [item.animal_type, item.duration_days])) }));
      if (!result.success || !Array.isArray(result.data)) throw new Error('Invalid records response');
      if (version === requestVersion.current) { setRecords(result.data); if (result.data[0]?.calculation_timezone) setTimezone(result.data[0].calculation_timezone); }
    } catch {
      if (version === requestVersion.current) setError(true);
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, []);
  useEffect(() => { fetchRecords(); return () => { requestVersion.current += 1; }; }, [fetchRecords]);

  const openForm = (mode, record = null) => {
    setFormError('');
    setForm(record ? { ...emptyRecord(), ...record, notes: record.notes || '', ear_badge_number: record.ear_badge_number || '' } : { ...emptyRecord(), mating_date: today });
    setDelivery({ ...emptyDelivery(), delivery_date: today });
    setCheck({ ...emptyCheck(), checked_on: today });
    setModal({ mode, record });
  };
  const closeForm = () => { if (!operation.current) setModal(null); };

  const save = async event => {
    event.preventDefault();
    if (operation.current) return;
    setFormError('');
    if (!['delivery', 'check'].includes(modal.mode) && (!form.animal_name.trim() || !Number.isFinite(dayNumber(form.mating_date)) || form.mating_date > today)) {
      setFormError(ui('invalidRecord')); return;
    }
    if (modal.mode === 'delivery' && (!Number.isFinite(dayNumber(delivery.delivery_date)) || delivery.delivery_date < modal.record.mating_date || delivery.delivery_date > today || !Number.isInteger(Number(delivery.offspring_count)) || Number(delivery.offspring_count) < 1)) {
      setFormError(ui('invalidDelivery')); return;
    }
    if (modal.mode === 'check' && (!check.result || !Number.isFinite(dayNumber(check.checked_on)) || check.checked_on < modal.record.mating_date || check.checked_on > today)) { setFormError(checkText('invalidCheck')); return; }
    operation.current = true; setBusy(true);
    try {
      let response;
      if (modal.mode === 'check') {
        response = await pregnancyService.recordCheckup(modal.record.id, check);
      } else if (modal.mode === 'delivery') {
        response = await pregnancyService.markDelivered(modal.record.id, { ...delivery, offspring_count: Number(delivery.offspring_count) });
      } else {
        const payload = { animal_profile_id: form.animal_profile_id || null, animal_type: form.animal_type, animal_name: form.animal_name.trim(), ear_badge_number: form.ear_badge_number.trim(), mating_date: form.mating_date, mating_type: form.mating_type, notes: form.notes, ...(form.animal_type === 'other' ? { pregnancy_duration_days: Number(form.pregnancy_duration_days) } : {}) };
        response = modal.mode === 'edit' ? await pregnancyService.updateRecord(modal.record.id, payload) : await pregnancyService.createRecord(payload);
      }
      if (!response.success || !response.data) throw new Error(response.message);
      setRecords(previous => modal.mode === 'add' ? [response.data, ...previous] : previous.map(record => record.id === response.data.id ? response.data : record));
      if (['delivery', 'check'].includes(modal.mode) && animalFilter === String(modal.record.id)) setAnimalFilter('');
      if (modal.mode === 'add') { setTab('active'); setAnimalFilter(''); setSelectedDate(''); setSearch(''); setVisibleCount(6); setMobileView('records'); }
      toast.success(modal.mode === 'check' ? checkText('saved') : modal.mode === 'delivery' ? text('deliveryRecorded') : modal.mode === 'edit' ? ui('recordUpdated') : text('recordAdded'));
      setModal(null);
    } catch (err) {
      setFormError(err.message || (modal.mode === 'delivery' ? text('markDeliveredFailed') : text('createFailed')));
    } finally { operation.current = false; setBusy(false); }
  };

  const deleteRecord = async record => {
    if (operation.current || !window.confirm(text('deleteConfirm'))) return;
    operation.current = true; setBusy(true);
    try {
      const response = await pregnancyService.deleteRecord(record.id);
      if (!response.success) throw new Error(response.message);
      setRecords(previous => previous.filter(item => item.id !== record.id));
      if (String(record.id) === animalFilter) setAnimalFilter('');
      toast.success(ui('recordDeleted'));
    } catch (err) { toast.error(err.message || text('deleteFailed')); }
    finally { operation.current = false; setBusy(false); }
  };

  const activeRecords = records.filter(record => record.status === 'pregnant');
  const pendingRecords = records.filter(record => record.status === 'pending_confirmation');
  const dueSoon = activeRecords.filter(record => daysRemaining(record, today) >= 0 && daysRemaining(record, today) <= 30);
  const overdue = activeRecords.filter(record => daysRemaining(record, today) < 0);
  const tabRecords = records.filter(record => tab === 'all' || (tab === 'active' ? ['pregnant', 'pending_confirmation'].includes(record.status) : record.status === 'delivered'));
  const calendarRecords = tabRecords.filter(record => !animalFilter || String(record.id) === animalFilter);
  const monthRecords = recordsInMonth(tabRecords, month, today);
  const filtered = calendarRecords.filter(record => (!selectedDate || recordOnDate(record, selectedDate, today)) && `${record.animal_name} ${record.ear_badge_number || ''}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
    .sort((a, b) => tab === 'delivered' ? (b.actual_delivery_date || '').localeCompare(a.actual_delivery_date || '') : a.expected_delivery_date.localeCompare(b.expected_delivery_date));
  const duration = form.animal_type === 'other' ? Number(form.pregnancy_duration_days) : modal?.mode === 'edit' ? Number(form.pregnancy_duration_days) : durations[form.animal_type];
  const expectedDate = addDays(form.mating_date, duration);
  const firstDay = month.getDay();
  const monthDays = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const clearFilters = () => { setSelectedDate(''); setSearch(''); setAnimalFilter(''); setVisibleCount(6); };
  const chooseAnimal = value => { setAnimalFilter(value); setSelectedDate(''); setVisibleCount(6); };
  const selectDate = date => {
    setSelectedDate(value => value === date ? '' : date);
    setVisibleCount(6);
    setMobileView('records');
    if (window.matchMedia('(max-width: 899px)').matches) {
      requestAnimationFrame(() => document.getElementById('pc-records-title')?.focus({ preventScroll: true }));
    }
  };

  const durationReference = <details className="pc-reference pc-panel">
    <summary><FaBookOpen aria-hidden="true" />{text('pregnancyDurationReference')}<FaChevronRight className="pc-reference-chevron" aria-hidden="true" /></summary>
    <p>{ui('estimateHint')}</p>
    <div>{Object.entries(durations).filter(([type]) => allowedSpecies(type)).map(([type, days]) => <span key={type}><AnimalIcon type={type} /><strong>{animalName(type)}</strong>{type === 'other' ? text('customDurationRequired') : `${days} ${text('days')}`}</span>)}</div>
  </details>;

  if (loading) return <FullPageLoader message={text('loadingCalendar')} />;

  return <section className="pregnancy-page" aria-labelledby="pregnancy-title">
    <header className="pc-page-header">
      <div className="pc-heading-content">
        <span className="pc-heading-icon"><FaCalendarDays aria-hidden="true" /></span>
        <div><h1 id="pregnancy-title">{text('pageTitle')}</h1><p>{text('pageDescription')}</p></div>
      </div>
      <div className="pc-header-actions"><span className="pc-current-date">{text('today')}<strong>{formatDate(today)}</strong></span><button className="pc-button pc-primary" onClick={() => openForm('add')} disabled={error}><FaPlus aria-hidden="true" />{checkText('recordBreeding')}</button></div>
    </header>
    {error ? <div className="pc-empty pc-panel" role="alert"><FaCalendarDays /><h2>{text('loadFailed')}</h2><button className="pc-button pc-primary" onClick={fetchRecords}>{ui('retry')}</button></div> : <>
      <div className="pc-stats">
        {[[text('activePregnancies'), activeRecords.length, 'active'], [text('dueWithin30Days'), dueSoon.length, 'soon'], [ui('overdue'), overdue.length, 'overdue'], [text('delivered'), records.filter(record => record.status === 'delivered').length, 'delivered']].map(([label, count, variant]) => <div className={`pc-stat pc-stat-${variant}`} key={variant}><span>{label}</span><strong>{count.toLocaleString(locale)}</strong></div>)}
      </div>
      {pendingRecords.length > 0 && <p className="pc-muted">{checkText('waitingCount', { count: pendingRecords.length })}</p>}
      <div className="pc-mobile-switch" role="group" aria-label={ui('viewLabel')}>
        <button aria-pressed={mobileView === 'records'} onClick={() => setMobileView('records')}><FaListUl aria-hidden="true" />{ui('yourRecords')}</button>
        <button aria-pressed={mobileView === 'calendar'} onClick={() => setMobileView('calendar')}><FaCalendarDays aria-hidden="true" />{text('calendar')}</button>
      </div>
      <div className="pc-workspace" data-mobile-view={mobileView}>
        <aside className="pc-calendar-column">
        <section className="pc-panel pc-calendar" aria-labelledby="pc-month-title">
          <div className="pc-section-heading"><span className="pc-eyebrow"><FaCalendarDays />{text('calendar')}</span><button className="pc-text-button" onClick={() => { setMonth(moveMonth(new Date(), 0)); setSelectedDate(today); setVisibleCount(6); setMobileView('records'); }}>{text('today')}</button></div>
          <div className="pc-month-nav"><button className="pc-icon-button" aria-label={ui('previousMonth')} onClick={() => setMonth(value => moveMonth(value, -1))}><FaChevronLeft /></button><h2 id="pc-month-title" aria-live="polite">{month.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</h2><button className="pc-icon-button" aria-label={ui('nextMonth')} onClick={() => setMonth(value => moveMonth(value, 1))}><FaChevronRight /></button></div>
          <div className="pc-animal-filter"><label htmlFor="pregnancy-animal-filter">{ui('showAnimal')}</label><select id="pregnancy-animal-filter" value={animalFilter} onChange={event => chooseAnimal(event.target.value)}><option value="">{ui('allAnimals')}</option>{tabRecords.map(record => <option key={record.id} value={record.id}>{record.animal_name}{record.ear_badge_number ? ` · ${record.ear_badge_number}` : ` · #${record.id}`}</option>)}</select></div>
          <div className="pc-calendar-grid">
            {['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map(day => <span className="pc-weekday" key={day}>{text(day)}</span>)}
            {Array.from({ length: firstDay }, (_, i) => <span key={`blank-${i}`} aria-hidden="true" />)}
            {Array.from({ length: monthDays }, (_, i) => {
              const date = dateKey(new Date(month.getFullYear(), month.getMonth(), i + 1));
              const { active, due, delivered, pending } = calendarDayRecords(calendarRecords, date, today);
              const label = [formatDate(date), pending.length ? checkText('waitingCount', { count: pending.length }) : '', active.length ? ui('activeOnDay', { count: active.length }) : '', ...active.map(record => record.animal_name), due.length ? `${text('expectedDelivery')}: ${due.map(record => record.animal_name).join(', ')}` : '', delivered.length ? `${text('delivered')}: ${delivered.map(record => record.animal_name).join(', ')}` : ''].filter(Boolean).join(', ');
              return <button type="button" data-date={date} data-active-count={active.length} data-due-count={due.length} data-delivered-count={delivered.length} key={date} className={`pc-day${date === today ? ' is-today' : ''}${active.length ? ' has-active' : ''}${due.length ? ' has-due' : ''}`} aria-pressed={selectedDate === date} aria-current={date === today ? 'date' : undefined} aria-label={label} title={label} onClick={() => selectDate(date)}>
                <span className="pc-day-number">{(i + 1).toLocaleString(locale)}</span>
                {active.length > 0 && <span className="pc-animal-count">{ui('animalCount', { count: active.length, number: active.length.toLocaleString(locale) })}</span>}
                {due.length > 0 && <span className="pc-day-event pc-event-due">{ui('calendarDueShort', { number: due.length.toLocaleString(locale) })}</span>}
                {pending.length > 0 && <span className="pc-day-event">{ui('calendarCheckShort', { number: pending.length.toLocaleString(locale) })}</span>}
                {delivered.length > 0 && <span className="pc-day-event pc-event-delivered">{ui('deliveredCount', { number: delivered.length.toLocaleString(locale) })}</span>}
              </button>;
            })}
          </div>
          <details className="pc-calendar-help"><summary>{ui('calendarHelp')}</summary><p><strong>{ui('countExample', { number: (3).toLocaleString(locale) })}</strong> {ui('countExplanation')}</p><p>{ui('tapDayHint')}</p><p className="pc-delivery-help">{ui('dueExplanation')}</p></details>
          {monthRecords.length > 0 && <details className="pc-month-animals"><summary>{ui('animalsThisMonth', { count: monthRecords.length })}</summary><div>{monthRecords.map(record => <button type="button" key={record.id} className="pc-month-animal" aria-pressed={animalFilter === String(record.id)} onClick={() => chooseAnimal(animalFilter === String(record.id) ? '' : String(record.id))}><span className="pc-month-animal-icon"><AnimalIcon type={record.animal_type} /></span><span><strong>{record.animal_name}{record.ear_badge_number && ` · ${record.ear_badge_number}`}</strong><small>{!record.confirmed_on && record.status !== 'delivered' && checkText(record.status === 'pending_confirmation' ? 'pending' : 'legacy')}</small><small>{checkText('breedingDate')}: {formatDate(record.mating_date)}</small><small>{record.status === 'delivered' ? text('deliveryDate') : text('expectedDelivery')}: {formatDate(record.actual_delivery_date || record.expected_delivery_date)}</small></span></button>)}</div></details>}
        </section>
        {durationReference}
        </aside>

        <section className="pc-records" aria-labelledby="pc-records-title">
          <div className="pc-record-toolbar pc-panel">
          <div className="pc-section-heading"><div><h2 id="pc-records-title" tabIndex={-1}>{ui('yourRecords')}</h2><p className="pc-records-caption">{ui('recordsHint')}</p></div></div>
          <div className="pc-tabs" role="group" aria-label={ui('filterStatus')}>{['active', 'delivered', 'all'].map(value => <button key={value} aria-pressed={tab === value} onClick={() => { setTab(value); setAnimalFilter(''); setVisibleCount(6); }}>{text(value)}</button>)}</div>
          <label className="pc-search"><span className="sr-only">{ui('searchRecords')}</span><input type="search" value={search} onChange={event => { setSearch(event.target.value); setVisibleCount(6); }} placeholder={ui('searchRecords')} /></label>
          {selectedDate && <div className="pc-date-filter"><span>{formatDate(selectedDate)}</span><button className="pc-text-button" onClick={() => setSelectedDate('')}>{ui('clearDate')}</button></div>}
          {animalFilter && <div className="pc-date-filter"><span>{records.find(record => String(record.id) === animalFilter)?.animal_name}</span><button className="pc-text-button" onClick={() => chooseAnimal('')}>{ui('allAnimals')}</button></div>}
          </div>
          <div className="pc-record-list" aria-live="polite">
            {filtered.slice(0, visibleCount).map(record => {
              const remaining = daysRemaining(record, today);
              const active = record.status === 'pregnant';
              const open = active || record.status === 'pending_confirmation';
              const history = [...(record.checkups || [])].sort((a, b) => b.checked_on.localeCompare(a.checked_on) || b.id - a.id);
              return <article className="pc-record pc-panel" key={record.id}>
                <header><span className="pc-animal-icon"><AnimalIcon type={record.animal_type} /></span><div className="pc-animal-name"><h3>{record.animal_name}</h3><p>{animalName(record.animal_type)}{record.ear_badge_number && ` · ${record.ear_badge_number}`}</p></div><span className={`pc-status${active && remaining < 0 ? ' pc-status-overdue' : ''}`}>{checkStatus(record)}</span></header>
                <dl className="pc-record-dates"><div><dt>{checkText('breedingDate')}</dt><dd>{formatDate(record.mating_date)}</dd></div><div><dt>{record.status === 'delivered' ? text('deliveryDate') : text('expectedDelivery')}</dt><dd>{formatDate(record.status === 'delivered' ? record.actual_delivery_date : record.expected_delivery_date)}</dd></div></dl>
                {open && <div className="pc-progress"><div><span>{remaining < 0 ? checkText('passed', { count: Math.abs(remaining) }) : remaining === 0 ? text('expectedDelivery') + ': ' + text('today') : checkText('remaining', { count: remaining })}</span><span>{pregnancyProgress(record, today)}%</span></div><progress max="100" value={pregnancyProgress(record, today)} aria-label={`${record.animal_name}: ${text('progress')}`} /></div>}
                {open && record.last_check_result === 'recheck' && <p className="pc-muted">{checkText('recheck')}</p>}
                {open && record.next_check_date && <p className="pc-muted">{checkText('nextCheck')}: {formatDate(record.next_check_date)}</p>}
                {(open || record.status === 'delivered' || record.notes || record.offspring_details || history.length > 0 || record.date_corrections?.length > 0) && <details className="pc-record-details">
                  <summary>{ui('recordDetails')}</summary>
                  <div>
                {open && <p className="pc-muted">{checkText('elapsed', { count: Math.max(0, daysSinceBreeding(record, today)) })}{record.confirmed_on && <> · {checkText('lastChecked')}: {formatDate(history.find(item => item.result === 'pregnant')?.checked_on || record.confirmed_on)}</>}</p>}
                {open && !record.confirmed_on && <p className="pc-muted">{checkText('provisional')}</p>}
                {record.status === 'delivered' && <p className="pc-offspring"><FaBaby />{text('offspringCount')}: {record.offspring_count ?? '—'}{record.offspring_gender && ` · ${text(`gender${record.offspring_gender.charAt(0).toUpperCase() + record.offspring_gender.slice(1)}`)}`}</p>}
                {(record.notes || record.offspring_details) && <details className="pc-record-notes"><summary>{text('notes')}</summary>{record.notes && <p>{record.notes}</p>}{record.offspring_details && <p>{text('offspringDetails')}: {record.offspring_details}</p>}</details>}
                {history.length > 0 && <details className="pc-record-notes"><summary>{checkText('history')} ({history.length})</summary>{history.map(item => <p key={item.id}><strong>{formatDate(item.checked_on)} · {checkText(item.result === 'not_pregnant' ? 'notPregnant' : item.result === 'recheck' ? 'checkAgain' : 'pregnant')}</strong>{item.estimated_age_value && <> · {item.estimated_age_value} {checkText(item.estimated_age_unit)}</>}{item.doctor_name && <> · {item.doctor_name}</>}{item.next_check_date && <><br />{checkText('nextCheck')}: {formatDate(item.next_check_date)}</>}{item.notes && <><br />{item.notes}</>}</p>)}</details>}
                {record.date_corrections?.length > 0 && <details className="pc-record-notes"><summary>{checkText('corrections')}</summary>{record.date_corrections.map((item, index) => <p key={index}>{formatDate(item.previous_mating_date)} → {formatDate(item.mating_date)} · {item.previous_duration} → {item.duration} {checkText('days')}</p>)}</details>}
                  </div>
                </details>}
                <footer>
                  {open && <div className="pc-record-primary-actions">
                    <button className="pc-button pc-secondary" aria-label={checkText('recordCheck')} disabled={busy} onClick={() => openForm('check', record)}>{ui('doctorCheck')}</button>
                    {active && <button className="pc-button pc-primary pc-deliver-button" aria-label={text('markDelivered')} disabled={busy} onClick={() => openForm('delivery', record)}><FaBaby aria-hidden="true" />{ui('recordDeliveryShort')}</button>}
                  </div>}
                  <div className="pc-record-utilities">
                    {open && <button className="pc-icon-button pc-edit-button" aria-label={`${ui('editRecord')}: ${record.animal_name}`} title={ui('editRecord')} disabled={busy} onClick={() => openForm('edit', record)}><FaPen aria-hidden="true" /></button>}
                    <button className="pc-icon-button pc-delete" aria-label={`${text('delete')}: ${record.animal_name}`} title={text('delete')} disabled={busy} onClick={() => deleteRecord(record)}><FaTrashCan aria-hidden="true" /></button>
                  </div>
                </footer>
              </article>;
            })}
            {filtered.length === 0 && <div className="pc-empty pc-panel"><FaCalendarDays /><h3>{records.length ? ui('noMatches') : text('noRecords')}</h3><p>{ui('emptyHint')}</p>{(selectedDate || search || animalFilter) ? <button className="pc-button pc-secondary" onClick={clearFilters}>{ui('clearFilters')}</button> : <button className="pc-button pc-secondary" onClick={() => openForm('add')}>{checkText('recordBreeding')}</button>}</div>}
          </div>
          {filtered.length > visibleCount && <button className="pc-button pc-secondary pc-load-more" onClick={() => setVisibleCount(value => value + 6)}>{ui('showMore')}</button>}
        </section>
      </div>
    </>}

    {modal && <RecordDialog title={modal.mode === 'check' ? checkText('recordCheck') : modal.mode === 'delivery' ? text('recordDelivery') : modal.mode === 'edit' ? ui('editRecord') : checkText('recordBreeding')} busy={busy} onClose={closeForm} closeLabel={ui('close')}>
      <form onSubmit={save} className="pc-form">{modal.mode === 'add' && <SavedAnimalPicker onSelect={animal => setForm(previous => ({ ...previous, animal_profile_id: animal.id, animal_type: animal.species, animal_name: animal.name, ear_badge_number: animal.tag || '' }))} />}
        <fieldset disabled={busy}>
          {modal.mode === 'check' ? <>
            <p className="pc-form-animal"><AnimalIcon type={modal.record.animal_type} />{modal.record.animal_name}</p>
            <p className="pc-muted">{checkText('breedingDate')}: {formatDate(modal.record.mating_date)}</p>
            <p className="pc-muted">{checkText('anchorHelp')}</p>
            <div className="pc-form-grid">
              <Field label={checkText('checkedOn')}><input type="date" required min={modal.record.mating_date} max={today} value={check.checked_on} onChange={event => setCheck({ ...check, checked_on: event.target.value })} /></Field>
              <Field label={checkText('result')}><select required value={check.result} onChange={event => setCheck({ ...check, result: event.target.value, next_check_date: event.target.value === 'not_pregnant' ? '' : check.next_check_date })}><option value="">{checkText('chooseResult')}</option>{[['pregnant', 'pregnant'], ['not_pregnant', 'notPregnant'], ['recheck', 'checkAgain']].map(([value, key]) => <option key={value} value={value}>{checkText(key)}</option>)}</select></Field>
            </div>
            <details className="pc-record-notes"><summary>{checkText('details')}</summary><div className="pc-form-grid">
              <Field label={checkText('age')}><input type="number" min="0.01" max="1000" step="0.01" value={check.estimated_age_value} onChange={event => setCheck({ ...check, estimated_age_value: event.target.value })} /></Field>
              <Field label={checkText('ageUnit')}><select value={check.estimated_age_unit} onChange={event => setCheck({ ...check, estimated_age_unit: event.target.value })}>{['days', 'weeks', 'months'].map(unit => <option key={unit} value={unit}>{checkText(unit)}</option>)}</select></Field>
              {check.result !== 'not_pregnant' && <Field label={checkText('nextCheck')}><input type="date" min={addDays(check.checked_on, 1)} value={check.next_check_date} onChange={event => setCheck({ ...check, next_check_date: event.target.value })} /></Field>}
              <Field label={checkText('doctor')}><input maxLength="100" value={check.doctor_name} onChange={event => setCheck({ ...check, doctor_name: event.target.value })} /></Field>
              <Field label={text('notes')} wide><textarea rows="2" maxLength="5000" value={check.notes} onChange={event => setCheck({ ...check, notes: event.target.value })} /></Field>
            </div></details>
          </> : modal.mode === 'delivery' ? <>
            <p className="pc-form-animal"><AnimalIcon type={modal.record.animal_type} />{modal.record.animal_name}</p>
            <div className="pc-form-grid">
              <Field label={text('deliveryDate')}><input type="date" required min={modal.record.mating_date} max={today} value={delivery.delivery_date} onChange={event => setDelivery({ ...delivery, delivery_date: event.target.value })} /></Field>
              <Field label={text('offspringCount')}><input type="number" required min="1" max="100" step="1" value={delivery.offspring_count} onChange={event => setDelivery({ ...delivery, offspring_count: event.target.value })} /></Field>
              <Field label={text('offspringGender')} wide><select value={delivery.offspring_gender} onChange={event => setDelivery({ ...delivery, offspring_gender: event.target.value })}>{['male', 'female', 'mixed'].map(gender => <option key={gender} value={gender}>{text(`gender${gender.charAt(0).toUpperCase() + gender.slice(1)}`)}</option>)}</select></Field>
              <Field label={text('detailsOptional')} wide><textarea rows="3" maxLength="5000" placeholder={text('placeholderOffspringDetails')} value={delivery.offspring_details} onChange={event => setDelivery({ ...delivery, offspring_details: event.target.value })} /></Field>
            </div>
          </> : <>
            <div className="pc-form-grid">
              <Field label={text('animalType')}><select disabled={modal.mode === 'edit'} value={form.animal_type} onChange={event => setForm({ ...form, animal_profile_id: null, animal_type: event.target.value, pregnancy_duration_days: '' })}>{Object.keys(DEFAULT_DURATIONS).map(type => <option key={type} value={type}>{animalName(type)}</option>)}</select></Field>
              <Field label={text('animalName')}><input required maxLength="100" value={form.animal_name} placeholder={text('placeholderAnimalName')} onChange={event => setForm({ ...form, animal_name: event.target.value })} /></Field>
              <Field label={text('earBadgeNumber')}><input maxLength="100" value={form.ear_badge_number} placeholder={text('placeholderEarBadge')} onChange={event => setForm({ ...form, ear_badge_number: event.target.value })} /></Field>
              <Field label={checkText('breedingDate')}><input type="date" required max={today} value={form.mating_date} onChange={event => setForm({ ...form, mating_date: event.target.value })} /></Field>
              <Field label={checkText('breedingMethod')} wide><select value={form.mating_type} onChange={event => setForm({ ...form, mating_type: event.target.value })}>{['natural', 'artificial_insemination'].map(method => <option key={method} value={method}>{checkText(method)}</option>)}</select></Field>
              <p className="pc-muted pregnancy-field-wide">{checkText('breedingHelp')}</p>
              {form.animal_type === 'other' && <Field label={text('customPregnancyDurationDays')} wide><input type="number" min="1" max="1000" step="1" required value={form.pregnancy_duration_days} placeholder={text('placeholderCustomPregnancyDurationDays')} onChange={event => setForm({ ...form, pregnancy_duration_days: event.target.value })} /></Field>}
              <div className="pc-date-preview pregnancy-field-wide"><span>{text('expectedDelivery')}</span><strong>{expectedDate ? formatDate(expectedDate) : text('enterCustomDurationHint')}</strong><p>{ui('estimateHint')}</p></div>
              <Field label={text('notes')} wide><textarea rows="3" maxLength="5000" value={form.notes} placeholder={text('placeholderNotes')} onChange={event => setForm({ ...form, notes: event.target.value })} /></Field>
            </div>
          </>}
          {formError && <p className="pc-form-error" role="alert">{formError}</p>}
          <footer className="pc-form-actions"><button type="button" className="pc-button pc-secondary" onClick={closeForm}>{text('cancel')}</button><button type="submit" className="pc-button pc-primary">{busy ? ui('saving') : modal.mode === 'check' ? checkText('save') : modal.mode === 'delivery' ? text('confirmDelivery') : modal.mode === 'edit' ? ui('saveChanges') : text('addRecord')}</button></footer>
        </fieldset>
      </form>
    </RecordDialog>}
  </section>;
}
