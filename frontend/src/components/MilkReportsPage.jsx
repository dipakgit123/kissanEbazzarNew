import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { milkReportService as api } from '../services/api';
import { localDate, csvDocument, VALUE_FIELDS } from '../utils/milkReportMath';
import { CATEGORIES, notebookData, notebookRange, dateList } from '../utils/milkNotebook';
import { notebookCopy } from '../utils/milkNotebookCopy';
import MilkNotebookForms, { NotebookField } from './MilkNotebookForms';
import { TodayMilkChart, ExpenseBars } from './MilkNotebookVisuals';
import './MilkNotebook.css';
import MilkAdvice from './MilkAdvice';

function MilkTrend({ data, range, period, c, date, liters, onDay, onMonth }) {
  const [page, setPage] = useState(0);
  const dates = dateList(range.from, range.to);
  const map = new Map(data.days.map(day => [day.date, day]));
  const monthly = period === 'year';
  const buckets = monthly ? Array.from({ length: 12 }, (_, index) => {
    const month = range.from.slice(0, 4) + '-' + String(index + 1).padStart(2, '0');
    const days = data.days.filter(day => day.date.startsWith(month) && day.milk !== null);
    return { key: month, value: days.length ? days.reduce((total, day) => total + day.milk, 0) : null, label: date(month + '-01', { month: 'short' }) };
  }) : dates.map(key => ({ key, value: map.get(key)?.milk ?? null, label: date(key, { day: 'numeric', month: 'short' }) }));
  const count = monthly ? 6 : 7;
  const start = Math.min(page * count, Math.max(0, Math.ceil(buckets.length / count) - 1) * count);
  const visible = buckets.slice(start, start + count);
  const maximum = Math.max(1, ...visible.map(bucket => bucket.value || 0));
  return <section className="mn-card">
    <div className="mn-row"><div><h2>{c('trend')}</h2><p>{c('coverage', { count: data.recorded_days, total: dates.length })}</p></div><span className="mn-unit">L</span></div>
    {data.recorded_days < 3 ? <><p className="mn-hint">{c('fewDays')}</p><div className="mn-few-days">{data.days.filter(day => day.milk !== null).map(day => <button key={day.date} onClick={() => onDay(day.date)}><span>{date(day.date)}</span><strong>{liters(day.milk)}</strong></button>)}{!data.recorded_days && <p>{c('noEntry')}</p>}</div></> : <>
      <div className="mn-bars" style={{ '--columns': visible.length }}>
        {visible.map(bucket => <button key={bucket.key} className="mn-bar" onClick={() => monthly ? onMonth(bucket.key) : onDay(bucket.key)} aria-label={`${bucket.label}: ${bucket.value === null ? c('noEntry') : liters(bucket.value)}`}>
          <strong>{bucket.value === null ? '—' : liters(bucket.value)}</strong>
          <span className="mn-bar-track"><span className={bucket.value === null ? 'mn-bar-missing' : 'mn-bar-fill'} style={{ height: bucket.value === null ? '100%' : `${Math.max(3, (bucket.value / maximum) * 100)}%` }} /></span>
          <span>{bucket.label}</span>{bucket.value === null && <small>{c('noEntry')}</small>}
        </button>)}
      </div>
      {buckets.length > count && <div className="mn-chart-pages"><button disabled={start === 0} onClick={() => setPage(Math.max(0, page - 1))}>{c('previous')}</button><span>{visible[0]?.label} – {visible.at(-1)?.label}</span><button disabled={start + count >= buckets.length} onClick={() => setPage(page + 1)}>{c('next')}</button></div>}
    </>}
  </section>;
}

export default function MilkReportsPage() {
  const { t, i18n } = useTranslation();
  const language = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0];
  const c = notebookCopy(language);
  const locale = ['mr', 'hi'].includes(language) ? language + '-IN' : 'en-IN';
  const money = value => Number(value || 0).toLocaleString(locale, { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
  const liters = value => Number(value || 0).toLocaleString(locale, { maximumFractionDigits: 2 }) + ' L';
  const date = (value, options = { day: 'numeric', month: 'short', year: 'numeric' }) => new Date(value + 'T12:00:00Z').toLocaleDateString(locale, { timeZone: 'UTC', ...options });
  const [today, setToday] = useState(localDate);
  const [tab, setTab] = useState('today');
  const [period, setPeriod] = useState('week');
  const [value, setValue] = useState(localDate);
  const [from, setFrom] = useState(localDate);
  const [to, setTo] = useState(localDate);
  const [animal, setAnimal] = useState('');
  const [species, setSpecies] = useState('all');
  const [type, setType] = useState('all');
  const [loaded, setLoaded] = useState({ cows: [], reports: [], expenses: [] });
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState(false);
  const [version, setVersion] = useState(0);
  const [modal, setModal] = useState(null);
  const [openDay, setOpenDay] = useState(null);
  const [limit, setLimit] = useState(14);
  const sequence = useRef(0);
  const range = notebookRange(tab, period, value, from, to, today);
  const start = range?.from;
  const end = range?.to;
  useEffect(() => { const timer = setInterval(() => setToday(localDate()), 60000); return () => clearInterval(timer); }, []);
  const load = useCallback(async () => {
    const request = ++sequence.current;
    if (!start || !end) { setLoaded({ cows: [], reports: [], expenses: [] }); setBusy(false); return; }
    setBusy(true); setError(false);
    try {
      const results = await Promise.all([api.getCows(), api.getReports({ from_date: start, to_date: end }), api.getExpenses({ from_date: start, to_date: end })]);
      if (results.some(result => !result?.success || !Array.isArray(result.data))) throw Error('Invalid response');
      if (request === sequence.current) setLoaded({ cows: results[0].data, reports: results[1].data, expenses: results[2].data });
    } catch { if (request === sequence.current) { setLoaded({ cows: [], reports: [], expenses: [] }); setError(true); } }
    finally { if (request === sequence.current) setBusy(false); }
  }, [start, end]);
  useEffect(() => {
    load();
    // Invalidate in-flight requests when the range changes or the page unmounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { sequence.current++; };
  }, [load, version]);
  const data = useMemo(() => notebookData(loaded.reports, loaded.expenses, tab === 'today' ? '' : animal, tab === 'today' ? 'all' : type, tab === 'today' ? 'all' : species), [loaded, animal, type, species, tab]);
  const setPeriodValue = next => { setPeriod(next); setValue(next === 'month' ? today.slice(0, 7) : next === 'year' ? today.slice(0, 4) : today); setLimit(14); setOpenDay(null); };
  const selectDay = day => { setOpenDay(day); setLimit(366); setTimeout(() => document.getElementById('mn-day-' + day)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 30); };
  const [deleting, setDeleting] = useState(false);
  const remove = async (kind, record) => {
    if (deleting || !window.confirm(c(kind === 'animal' ? 'confirmAnimalDelete' : 'confirmDelete'))) return;
    setDeleting(true);
    try {
      const result = await (kind === 'animal' ? api.deleteCow(record.id) : kind === 'milk' ? api.deleteReport(record.id) : api.deleteExpense(record.id));
      if (!result?.success) throw Error('Failed');
      if (kind === 'animal' && String(record.id) === animal) setAnimal('');
      setVersion(old => old + 1);
    } catch { toast.error(c('saveError')); }
    finally { setDeleting(false); }
  };
  const manage = (kind, record) => <div className="mn-actions"><button onClick={() => setModal({ kind, record })}>{c('edit')}</button><button className="mn-danger" disabled={deleting} onClick={() => remove(kind, record)}>{c('remove')}</button></div>;
  const download = kind => {
    if (busy || error || !range) return;
    let rows;
    if (kind === 'milk') {
      const fields = ['report_date', 'report_type', 'animal_type', 'cow_name', 'cow_tag', ...VALUE_FIELDS, 'total_liters', 'total_revenue', 'total_cost', 'profit_or_loss', 'amount_pending', 'expense_status', 'notes'];
      rows = [[...fields, 'estimated_sales', 'included_in_totals'], ...data.reports.map(report => [...fields.map(field => report[field] ?? ''), report.revenue_is_estimated, data.includedIds.has(report.id)])];
    } else {
      rows = [['date', 'scope', 'animal', 'tag', 'category', 'kind', 'amount', 'notes', 'source', 'included_in_totals'],
        ...data.expenses.map(expense => [expense.expense_date, expense.scope, expense.cow_name || '', expense.cow_tag || '', expense.category, expense.kind, Number(expense.amount), expense.notes || '', 'expense-' + expense.id, true]),
        ...data.reports.flatMap(report => CATEGORIES.filter(key => Number(report[key + '_cost']) > 0).map(key => [report.report_date, report.report_type, report.cow_name, report.cow_tag || '', key, 'legacy', Number(report[key + '_cost']), report.notes || '', 'milk-' + report.id, data.includedIds.has(report.id)]))];
    }
    const url = URL.createObjectURL(new Blob([csvDocument(rows)], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `milk-notebook-${kind}-${start}-${end}.csv`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const chooseAnimal = <NotebookField label={c('animal')}><select value={animal} onChange={e => { setAnimal(e.target.value); setSpecies('all'); setType('all'); }}><option value="">{c('all')}</option>{loaded.cows.map(cow => <option key={cow.id} value={cow.id}>{cow.cow_name}{cow.cow_tag ? ' · ' + cow.cow_tag : ''}</option>)}</select></NotebookField>;
  const days = openDay && !data.days.some(day => day.date === openDay) ? [{ date: openDay, milk: null, reports: [], expenses: [], cost: 0, value: 0 }, ...data.days] : data.days;
  return <main className="milk-notebook mn-page">
    <header className="mn-card mn-heading"><div><h1>{c('title')}</h1><p>{c('subtitle')}</p></div><div className="mn-actions"><button className="mn-primary" disabled={busy || error} onClick={() => setModal({ kind: 'milk' })}>+ {c('recordMilk')}</button><button disabled={busy || error} onClick={() => setModal({ kind: 'expense' })}>+ {c('recordExpense')}</button></div></header>
    <nav className="mn-tabs" aria-label={c('title')}>{['today', 'history', 'animals'].map(key => <button key={key} aria-current={tab === key ? 'page' : undefined} onClick={() => { setTab(key); setOpenDay(null); }}>{c(key)}</button>)}</nav>
    {!busy && !error && <MilkAdvice cows={loaded.cows} language={language} revision={version} />}
    {tab === 'history' && <section className="mn-card mn-filters">
      <div className="mn-filter-main"><div className="mn-actions">{['week', 'month'].map(key => <button key={key} aria-pressed={period === key} onClick={() => setPeriodValue(key)}>{c(key)}</button>)}</div>
        {period !== 'custom' && <NotebookField label={c(period === 'week' ? 'endDate' : period)}><input type={period === 'week' ? 'date' : period === 'month' ? 'month' : 'number'} min={period === 'year' ? 1900 : undefined} max={period === 'year' ? 9999 : undefined} value={value} onChange={e => setValue(e.target.value)} /></NotebookField>}{chooseAnimal}
      </div>
      <details className="mn-more"><summary>{c('more')}</summary><div className="mn-form-grid">
        <NotebookField label={c('period')}><select value={period} onChange={e => setPeriodValue(e.target.value)}>{['week', 'month', 'year', 'custom'].map(key => <option key={key} value={key}>{c(key)}</option>)}</select></NotebookField>
        {period === 'custom' && <>{[[from, setFrom, 'from'], [to, setTo, 'to']].map(([current, change, key]) => <NotebookField label={c(key)} key={key}><input type="date" value={current} onChange={e => change(e.target.value)} /></NotebookField>)}</>}
        <NotebookField label={c('scope')}><select value={type} onChange={e => { setType(e.target.value); setAnimal(''); }}><option value="all">{c('allTypes')}</option><option value="overall">{c('herd')}</option><option value="individual">{c('individual')}</option></select></NotebookField>
        <NotebookField label={c('animal')}><select value={species} onChange={e => { setSpecies(e.target.value); setAnimal(''); }}><option value="all">{c('allSpecies')}</option><option value="cow">{c('cow')}</option><option value="buffalo">{c('buffalo')}</option></select></NotebookField>
      </div></details>
    </section>}
    {!range || error ? <section role="alert" className="mn-card mn-error">{c(!range ? 'invalidDate' : 'loadError')}{range && <button onClick={load}>{c('retry')}</button>}</section> : busy ? <section className="mn-card" role="status" aria-busy="true">{t('common.loading', { defaultValue: 'Loading…' })}</section> : tab === 'animals' ? <section className="mn-card">
      <div className="mn-row"><h2>{c('animals')}</h2><button className="mn-primary" onClick={() => setModal({ kind: 'animal' })}>+ {c('addAnimal')}</button></div>
      {!loaded.cows.length && <p className="mn-empty">{c('noAnimals')}</p>}
      <div className="mn-animal-grid">{loaded.cows.map(cow => <article className="mn-animal" key={cow.id}><div><h3>{cow.cow_name}</h3><p>{c(cow.animal_type)}{cow.cow_tag ? ' · ' + cow.cow_tag : ''}</p></div><button onClick={() => { setAnimal(String(cow.id)); setSpecies('all'); setType('all'); setTab('history'); }}>{c('readHistory')}</button>{manage('animal', cow)}</article>)}</div>
    </section> : <>
      <section className="mn-card mn-overview">
        <div className="mn-row"><h2>{tab === 'today' ? date(today) : start === end ? date(start) : `${date(start)} – ${date(end)}`}</h2></div>
        <div className="mn-kpis">{[
          ['milk', data.recorded_days ? liters(data.total_liters) : '—'],
          [data.estimated_reports ? 'estimatedSales' : 'sales', data.recorded_days ? money(data.total_revenue) : '—'],
          ['cost', data.days.length ? money(data.total_cost) : '—'],
          ['balance', data.recorded_days ? money(data.balance) : '—']
        ].map(([key, number]) => <div key={key} className={key === 'balance' ? 'mn-balance' : ''}><span>{c(key)}</span><strong>{number}</strong></div>)}</div>
        <p className="mn-hint">{c('figuresHelp')}</p>
        {!!data.unknown_costs && <p className="mn-notice">{c('missingCosts', { count: data.unknown_costs })}</p>}
        {!!data.excluded_reports && <p className="mn-hint">{c('overlap')}</p>}
        {!!data.shared_excluded && <p className="mn-notice">{c('shared', { amount: money(data.shared_excluded) })}</p>}
        {tab === 'history' && type !== 'all' && <p className="mn-hint">{c('expenseFilterHelp')}</p>}
        {tab === 'today' && !data.recorded_days && <p className="mn-empty">{c('noMilk')}</p>}
      </section>
      <div className={`mn-finance-grid${tab === 'today' ? ' mn-today-visuals' : ''}`}>
        {tab === 'today' ? <>
          <TodayMilkChart data={data} c={c} liters={liters} onDetails={() => selectDay(today)} />
          <section className="mn-card mn-expense-chart" aria-label={c('expenseTitle')}><div className="mn-row"><h2>{c('expenseTitle')}</h2><strong>{money(data.total_cost)}</strong></div><ExpenseBars data={data} c={c} money={money} /></section>
        </> : <details className="mn-card"><summary>{c('expenseTitle')} · {money(data.total_cost)}</summary><ExpenseBars data={data} c={c} money={money} /></details>}
        <details className="mn-card mn-payments"><summary>{c('received')} · {data.counted_reports > data.unrecorded_payments ? money(data.amount_received) : '—'}</summary>{data.counted_reports > data.unrecorded_payments ? <dl className="mn-costs"><div><dt>{c('received')}</dt><dd>{money(data.amount_received)}</dd></div><div><dt>{c('pending')}</dt><dd>{money(data.amount_pending)}</dd></div></dl> : <p className="mn-empty">{c('unknownPayment')}</p>}{!!data.unrecorded_payments && <p className="mn-hint">{c('paymentHelp', { count: data.unrecorded_payments })}</p>}</details>
      </div>
      {tab === 'history' && <MilkTrend key={`${start}-${end}-${animal}-${type}-${species}`} data={data} range={range} period={period} c={c} date={date} liters={liters} onDay={selectDay} onMonth={month => { setPeriod('month'); setValue(month); setOpenDay(null); }} />}
      <section className="mn-card"><div className="mn-row"><h2>{c('dailyRecords')}</h2><details className="mn-export"><summary>{c('download')}</summary><div className="mn-actions"><button disabled={!data.reports.length} onClick={() => download('milk')}>{c('exportMilk')}</button><button disabled={!data.expenses.length && !data.total_cost} onClick={() => download('expenses')}>{c('exportExpenses')}</button></div></details></div>
        {!days.length && <p className="mn-empty">{c('noRecords')}</p>}
        {days.slice(0, limit).map(day => <article className="mn-day" id={'mn-day-' + day.date} key={day.date}>
          <button className="mn-day-toggle" aria-expanded={openDay === day.date} onClick={() => setOpenDay(openDay === day.date ? null : day.date)}><span><strong>{date(day.date)}</strong><small>{day.milk === null ? day.expenses.length ? c('noMilkDay') : c('noEntry') : c('morningEvening', { morning: day.morning, evening: day.evening })}</small></span><span><strong>{day.milk === null ? '—' : liters(day.milk)}</strong><small>{c('cost')}: {money(day.cost)}</small></span><span aria-hidden="true">{openDay === day.date ? '−' : '+'}</span></button>
          {openDay === day.date && <div className="mn-day-details">
            {day.reports.map(report => <article key={'milk-' + report.id} className="mn-entry"><div className="mn-row"><h3>{report.report_type === 'overall' ? c('herd') : report.cow_name}{report.cow_tag ? ' · ' + report.cow_tag : ''}</h3>{manage('milk', report)}</div><p>{c('summary', { milk: liters(report.total_liters), sales: money(report.total_revenue), cost: money(report.total_cost) })}</p>{!data.includedIds.has(report.id) && <p className="mn-notice">{c('notCounted')}</p>}
              <p className="mn-hint">{c('morningEvening', { morning: report.morning_liters, evening: report.afternoon_liters })}</p><p>{report.revenue_is_estimated ? c('estimatedSales') : c('sales')}: {money(report.total_revenue)}</p>
              <p>{report.amount_received === null ? c('unknownPayment') : `${c('received')}: ${money(report.amount_received)} · ${c('pending')}: ${money(report.amount_pending)}`}</p>
              {!!report.total_cost && <p>{c('legacy')}: {CATEGORIES.filter(key => Number(report[key + '_cost'])).map(key => `${c(key)} ${money(report[key + '_cost'])}`).join(' · ')}</p>}
              {report.expense_status === 'none' && !report.total_cost && <p className="mn-hint">{c('confirmedNone')}</p>}{report.notes && <p>{report.notes}</p>}
            </article>)}
            {day.expenses.map(expense => <article key={'expense-' + expense.id} className="mn-entry"><div className="mn-row"><div><h3>{c(expense.category)} · {money(expense.amount)}</h3><p>{expense.scope === 'herd' ? c('herd') : expense.cow_name}{expense.cow_tag ? ' · ' + expense.cow_tag : ''}{expense.kind === 'purchase' ? ' · ' + c('bulk') : ''}</p></div>{manage('expense', expense)}</div>{expense.notes && <p>{expense.notes}</p>}</article>)}
            <div className="mn-actions"><button onClick={() => setModal({ kind: 'milk', prefill: { report_date: day.date } })}>+ {c('recordMilk')}</button><button onClick={() => setModal({ kind: 'expense', prefill: { expense_date: day.date } })}>+ {c('recordExpense')}</button></div>
          </div>}
        </article>)}
        {days.length > limit && <button className="mn-load-more" onClick={() => setLimit(limit + 14)}>{c('next')}</button>}
      </section>
    </>}
    {modal && <MilkNotebookForms key={`${modal.kind}-${modal.record?.id || 'new'}`} modal={modal} cows={loaded.cows} c={c} t={t} language={language} onClose={() => setModal(null)} onSaved={() => { setModal(null); setVersion(old => old + 1); toast.success(c('saved')); }} />}
  </main>;
}
