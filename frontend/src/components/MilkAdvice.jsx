import { useState } from 'react';
import { Link } from 'react-router-dom';
import { adviceCopy, adviceEvidence, adviceSections, changeTypes, feedingTypes, newRoutine, toggleChange, toggleFeed, useMilkAdvice } from '../utils/useMilkAdvice';
import './MilkAdvice.css';

function AdviceAnimal({ cowId, language, revision }) {
  const c = adviceCopy(language), { data, error, busy, request } = useMilkAdvice(cowId, revision, language);
  const [form, setForm] = useState(null);
  const locale = ['mr', 'hi'].includes(language) ? language + '-IN' : 'en-IN';
  const num = n => Number(n).toLocaleString(locale, { maximumFractionDigits: 2 });
  const facts = data?.facts, draft = form || (data && !data.routine ? newRoutine() : null);
  const update = fn => setForm(fn(draft));
  const feedField = (type, field, value) => update(old => ({ ...old, feed: old.feed.map(item => item.type === type ? { ...item, [field]: value } : item) }));
  const saveAndAdvise = async value => { if (await request('save', value)) { setForm(null); await request('generate'); } };
  return <div className="ma-content" aria-busy={busy}>
    {busy && <p role="status">{c('loading')}</p>}
    {error && <div className="mn-notice" role="alert"><p>{c(error)}</p><button disabled={busy} onClick={() => request(error.startsWith('AI_') && data?.status === 'ready' ? 'generate' : 'load')}>{c('retry')}</button></div>}
    {data && <>
      <p className={data.status === 'vet_first' ? 'mn-notice' : 'mn-hint'}>{c(data.status === 'ready' && data.mode === 'initial' ? 'initial' : data.status)}</p>
      {data.status === 'vet_first' && <Link className="ma-vet" to="/veterinarians">{c('vet')} →</Link>}
      {draft && <form className="ma-form" onSubmit={async e => { e.preventDefault(); await saveAndAdvise(draft); }}>
        <fieldset disabled={busy}><legend>{c('q1')}</legend><label>{c('months')}<input type="number" min="0" max="120" step="1" value={draft.calving_months ?? ''} onChange={e => update(old => ({ ...old, calving_months: e.target.value }))} /></label></fieldset>
        <fieldset disabled={busy}><legend>{c('q2')}</legend><p className="mn-hint">{c('quantityHelp')}</p><div className="ma-feeds">{feedingTypes.map(type => { const item = draft.feed.find(f => f.type === type); return <div key={type} className={`ma-feed ${item ? 'ma-selected' : ''}`}>
          <label className="ma-check"><input type="checkbox" checked={!!item} onChange={() => update(old => toggleFeed(old, type))} />{c(type)}</label>
          {item && type !== 'unknown' && <label>{c('quantity')}<input aria-label={`${c(type)} · ${c('quantity')}`} type="number" inputMode="decimal" min="0.01" max="200" step="0.01" value={item.kg ?? ''} onChange={e => feedField(type, 'kg', e.target.value)} /></label>}
          {item && type !== 'unknown' && <label>{c('price')}<input aria-label={`${c(type)} · ${c('price')}`} type="number" inputMode="decimal" min="0" max="10000" step="0.01" value={item.price_per_kg ?? ''} onChange={e => feedField(type, 'price_per_kg', e.target.value)} /></label>}
          {item && type === 'other' && <label>{c('otherDescription')}<input required maxLength={120} value={item.description || ''} onChange={e => feedField(type, 'description', e.target.value)} /></label>}
        </div>; })}</div><label>{c('since')}<input required type="date" max={newRoutine().since} value={draft.since} onChange={e => update(old => ({ ...old, since: e.target.value }))} /></label></fieldset>
        <fieldset disabled={busy}><legend>{c('q3')}</legend><div className="ma-options">{['yes', 'no', 'unknown'].map(value => <label className="ma-check" key={value}><input type="radio" name={`water-${cowId}`} checked={draft.water === value} onChange={() => update(old => ({ ...old, water: value }))} />{c(value)}</label>)}</div></fieldset>
        <fieldset disabled={busy}><legend>{c('q4')}</legend><div className="ma-options">{changeTypes.map(value => <label className="ma-check" key={value}><input type="checkbox" checked={draft.changes.includes(value)} onChange={() => update(old => toggleChange(old, value))} />{c(value)}</label>)}</div></fieldset>
        <p className="mn-hint">{c('priceHelp')}</p><p className="mn-hint">{c('privacy')}</p>
        <div className="mn-actions"><button className="mn-primary" disabled={busy || !draft.feed.length} type="submit">{c('save')}</button>{data.routine && <button disabled={busy} type="button" onClick={() => setForm(null)}>{c('cancel')}</button>}</div>
      </form>}
      {!draft && data.status === 'ready' && !data.advice && <><p className="mn-hint">{c('privacy')}</p><button className="mn-primary" disabled={busy} onClick={() => request('generate')}>{c('generate')}</button></>}
      {!draft && data.advice?.sections && <section className="ma-results" aria-live="polite"><h3>{c('generated')}</h3><p className="mn-hint">{c('date')}: {new Date(data.advice.generated_at).toLocaleDateString(locale)}</p><div className="ma-plan-grid">{adviceSections.map(key => { const section = data.advice.sections[key]; return <article className="ma-plan" key={key}><h3>{c(key)}</h3><p className="ma-action">{section.action}</p><strong>{c('because')}</strong><p>{section.reason}</p><details><summary>{c('basedOn')}</summary>{section.evidence.map(id => <p className="mn-hint" key={id}>{adviceEvidence(id, data, c, num)}</p>)}{section.evidence.includes('feed_prices') && <p className="mn-hint">{c('estimateHelp')}</p>}</details></article>; })}</div></section>}
      {!draft && data.routine && <div className="mn-actions"><button disabled={busy} onClick={() => setForm(JSON.parse(JSON.stringify(data.routine)))}>{c('edit')}</button>{data.status === 'confirm_routine' && <button disabled={busy} onClick={() => saveAndAdvise(data.routine)}>{c('confirm')}</button>}</div>}
      {facts && <details className="ma-details"><summary>{c('details')}</summary>
        {data.routine && <div className="ma-saved"><h3>{c('saved')}</h3><p>{adviceEvidence('feeding', data, c, num)}</p><p>{c('since')}: {data.routine.since}</p><p>{adviceEvidence('feed_prices', data, c, num)}</p><p className="mn-hint">{c('estimateHelp')}</p></div>}
        <p>{adviceEvidence('milk_records', data, c, num)}</p>
      {facts && <div className="ma-facts"><h3>{c('trend')}</h3><p className="mn-hint">{facts.start} — {facts.end}</p>{facts.sufficient ? <div className="ma-comparison">{['previous', 'recent'].map(key => { const item = facts[key], maximum = Math.max(facts.previous.average || 0, facts.recent.average || 0, 1); return <div key={key}><strong>{c(key)}</strong><p>{num(item.days)} {c('coverage')}</p><strong>{item.average == null ? c('noData') : `${num(item.average)} L`}</strong><small>{c('average')}</small><div className="ma-track" aria-hidden="true"><span style={{ width: `${(item.average || 0) / maximum * 100}%` }} /></div></div>; })}</div> : <p>{c('noTrend')}</p>}
        <details><summary>{c('costTitle')}</summary><dl>{Object.entries(facts.costs).map(([key, amount]) => <div key={key}><dt>{c(key === 'other' ? 'otherCost' : key)}</dt><dd>₹{num(amount)}</dd></div>)}<div><dt>{c('bulk')}</dt><dd>₹{num(facts.bulk_purchases)}</dd></div></dl><p>{c('costHelp')}</p>{facts.missing_cost_days > 0 && <p>{c('missingCosts')}: {num(facts.missing_cost_days)}</p>}</details></div>}
      </details>}
      <p className="mn-hint">{c('disclaimer')}</p>
    </>}
  </div>;
}
export default function MilkAdvice({ cows, language, revision }) {
  const [expanded, setExpanded] = useState(false), [cowId, setCowId] = useState('');
  const c = adviceCopy(language), available = cows.filter(cow => ['cow', 'buffalo'].includes(cow.animal_type));
  const selected = available.some(cow => String(cow.id) === cowId) ? cowId : '';
  return <section className="mn-card ma-card"><div className="mn-row"><div><h2>{c('title')}</h2><p>{c('intro')}</p></div><button aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{c('open')} {expanded ? '−' : '+'}</button></div>{expanded && <><label className="ma-selector">{c('choose')}<select aria-label={c('choose')} value={selected} onChange={e => setCowId(e.target.value)}><option value="">{c('choose')}</option>{available.map(cow => <option key={cow.id} value={cow.id}>{cow.cow_name}{cow.cow_tag ? ` · ${cow.cow_tag}` : ''}</option>)}</select></label>{selected && <AdviceAnimal key={selected} cowId={selected} language={language} revision={revision} />}</>}</section>;
}
