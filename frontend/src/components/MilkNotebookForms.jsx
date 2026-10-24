import { useEffect, useRef, useState } from 'react';
import { milkReportService as api } from '../services/api';
import { localizeApiMessage } from '../utils/localizeApiMessage';
import { localDate, normalizeValues, validateValues, OPTIONAL_FIELDS, USAGE_FIELDS, decimal } from '../utils/milkReportMath';
import { CATEGORIES, expenseKey } from '../utils/milkNotebook';

export function NotebookField({ label, children }) {
  return <label className="mn-field"><span>{label}</span>{children}</label>;
}
export default function MilkNotebookForms({ modal, cows, c, t, language, onClose, onSaved }) {
  const dialog = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const kind = modal.kind;
  const existing = modal.record;
  const [form, setForm] = useState(() => ({
    report_date: localDate(), expense_date: localDate(), report_type: cows.length ? 'individual' : 'overall',
    scope: 'herd', cow_id: cows.length === 1 ? cows[0].id : '', cow_name: '', cow_tag: '', animal_type: 'cow',
    morning_liters: '', afternoon_liters: '', price_per_liter: '', expense_status: 'unknown', notes: '',
    ...Object.fromEntries([...OPTIONAL_FIELDS, ...USAGE_FIELDS, ...CATEGORIES.map(x => x + '_cost'), ...CATEGORIES].map(x => [x, ''])),
    request_id: expenseKey(), kind: 'daily', category: 'feed', amount: '', ...modal.prefill, ...existing
  }));
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current.showModal();
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  const set = (key, value) => setForm(old => ({ ...old, [key]: value }));
  const input = (key, label, type = 'text', props = {}) => <NotebookField label={label} key={key}><input name={key} type={type} value={form[key] ?? ''} onChange={e => set(key, e.target.value)} {...(type === 'number' ? { min: 0, max: 99999999.99, step: '0.01', inputMode: 'decimal' } : {})} {...props} /></NotebookField>;
  const select = (key, label, options) => <NotebookField label={label}><select name={key} value={form[key] ?? ''} onChange={e => set(key, e.target.value)}>{options.map(([value, title]) => <option value={value} key={value}>{title}</option>)}</select></NotebookField>;
  const animalSelect = existing && !existing.cow_id && (existing.report_type === 'individual' || existing.scope === 'animal') && !form.cow_id
    ? <p>{c('removed', { name: existing.cow_name })}</p>
    : select('cow_id', c('animal'), [['', c('chooseAnimal')], ...cows.map(cow => [cow.id, `${cow.cow_name}${cow.cow_tag ? ' · ' + cow.cow_tag : ''}`])]);
  const save = async event => {
    event.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      let response;
      if (kind === 'animal') {
        const payload = { ...form, cow_name: form.cow_name.trim() };
        if (!payload.cow_name) throw Error(c('name'));
        response = existing ? await api.updateCow(existing.id, payload) : await api.createCow(payload);
      } else if (kind === 'milk') {
        const validation = validateValues(form);
        if (validation) throw Error(t('milkTracking.' + validation.reason));
        if (form.report_type === 'individual' && !form.cow_id && !(existing?.report_type === 'individual' && !existing.cow_id)) throw Error(c('chooseAnimal'));
        const payload = { ...form, ...normalizeValues(form), cow_id: form.report_type === 'overall' ? null : form.cow_id || null };
        response = existing ? await api.updateReport(existing.id, payload) : await api.createReport(payload);
      } else {
        if (form.scope === 'animal' && !form.cow_id && !(existing?.scope === 'animal' && !existing.cow_id)) throw Error(c('chooseAnimal'));
        const items = existing ? [{ category: form.category, amount: form.amount, kind: form.category === 'feed' ? form.kind : 'daily' }] : CATEGORIES.filter(key => form[key] !== '' && decimal(form[key]) !== 0).map(key => ({ category: key, amount: form[key], kind: key === 'feed' ? form.kind : 'daily' }));
        if (!items.length || items.some(item => !Number.isFinite(decimal(item.amount)) || decimal(item.amount) <= 0)) throw Error(c('invalidExpense'));
        const payload = { expense_date: form.expense_date, scope: form.scope, cow_id: form.scope === 'animal' ? form.cow_id || null : null, notes: form.notes, request_id: form.request_id };
        response = existing ? await api.updateExpense(existing.id, { ...payload, ...items[0] }) : await api.createExpenses({ ...payload, items });
      }
      if (!response?.success) throw response;
      onSaved();
    } catch (cause) {
      const problem = cause?.response?.data || cause;
      setError(problem?.code === 'MILK_NOTEBOOK' ? c(problem.reason) : problem?.code === 'MILK_VALIDATION' ? t('milkTracking.' + problem.reason) : cause instanceof Error && !cause.response && !cause.isAxiosError ? cause.message : localizeApiMessage({ language }, t, problem?.message, 'milkTracking.saveError', c('saveError')));
    } finally { setBusy(false); }
  };
  return <dialog ref={dialog} className="mn-dialog" onCancel={e => { e.preventDefault(); if (!busy) onClose(); }} aria-labelledby="notebook-form-title">
    <form onSubmit={save} className="milk-notebook">
      <header className="mn-dialog-head"><h2 id="notebook-form-title">{existing ? c('edit') + ' · ' : ''}{c(kind === 'animal' ? 'addAnimal' : kind === 'milk' ? 'recordMilk' : 'recordExpense')}</h2><button type="button" onClick={onClose} disabled={busy} aria-label={c('close')}>×</button></header>
      <fieldset disabled={busy} className="mn-form-body">
        {kind === 'animal' ? <div className="mn-form-grid">
          {input('cow_name', c('name'), 'text', { required: true, maxLength: 100 })}{input('cow_tag', c('tag'), 'text', { maxLength: 100 })}
          {select('animal_type', c('animal'), [['cow', c('cow')], ['buffalo', c('buffalo')]])}
          {input('breed_name', t('milkReports.fields.breed'))}
          {input('age_years', t('milkReports.fields.ageInYears'), 'number', { max: 999.9, step: '0.1' })}
        </div> : <>
          <div className="mn-form-grid">
            {input(kind === 'milk' ? 'report_date' : 'expense_date', c('date'), 'date', { required: true })}
            {kind === 'milk' ? select('report_type', c('scope'), [['overall', c('herd')], ['individual', c('individual')]]) : select('scope', c('scope'), [['herd', c('herd')], ['animal', c('individual')]])}
            {(kind === 'milk' ? form.report_type === 'individual' : form.scope === 'animal') && animalSelect}
          </div>
          {kind === 'milk' ? <>
            <div className="mn-form-grid">{input('morning_liters', c('morning'), 'number')}{input('afternoon_liters', c('evening'), 'number')}{input('price_per_liter', c('rate'), 'number', { required: true })}</div>
            <details className="mn-disclosure"><summary>{c('optionalSales')}</summary><p>{t('milkTracking.detailsHelp')}</p><div className="mn-form-grid">{[...OPTIONAL_FIELDS, ...USAGE_FIELDS].map(key => input(key, t('milkTracking.' + key), 'number'))}</div></details>
            {existing && CATEGORIES.some(key => Number(existing[key + '_cost']) > 0) && <details className="mn-disclosure"><summary>{c('legacy')}</summary><p>{c('legacyHelp')}</p><div className="mn-form-grid">{CATEGORIES.map(key => input(key + '_cost', c(key) + ' (₹)', 'number'))}</div></details>}
          </> : <>
            <div className="mn-form-grid">{existing ? <>{select('category', c('category'), CATEGORIES.map(key => [key, c(key)]))}{input('amount', c('amount') + ' (₹)', 'number', { required: true, min: 0.01 })}</> : CATEGORIES.map(key => input(key, c(key) + ' (₹)', 'number'))}</div>
          </>}
        </>}
        <NotebookField label={c('notes')}><textarea name="notes" value={form.notes || ''} onChange={e => set('notes', e.target.value)} maxLength={2000} rows={2} /></NotebookField>
      </fieldset>
      {error && <p role="alert" className="mn-error">{error}</p>}
      <footer className="mn-dialog-foot"><button type="button" onClick={onClose} disabled={busy}>{c('cancel')}</button><button className="mn-primary" type="submit" disabled={busy}>{busy ? '…' : c('save')}</button></footer>
    </form>
  </dialog>;
}
