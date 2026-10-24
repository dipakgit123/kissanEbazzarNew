import { useEffect, useRef, useState } from 'react';
import { milkReportService as api } from '../services/api';
import copy from './milkAdviceCopy.json';
import planCopy from './milkAdvicePlanCopy.json';
export const adviceCopy = language => key => planCopy[language?.split('-')[0]]?.[key] || copy[language?.split('-')[0]]?.[key] || planCopy.en[key] || copy.en[key] || copy.en.error;
export const adviceSections = ['milk', 'feed_cost', 'next_week'];
export function adviceEvidence(id, data, c, num = String) {
  const { facts, routine, feed_estimate: estimate } = data;
  if (id === 'milk_records') return facts.latest_milk ? `${c('latestMilk')}: ${num(facts.latest_milk.liters)} L · ${facts.latest_milk.date}${facts.latest_milk.may_be_partial ? ' · ' + c('partialMilk') : ''}` : c('noMilkAdvice');
  if (id === 'feeding') return c('feedInfo') + ': ' + routine.feed.map(f => c(f.type) + (f.kg == null ? ' · ' + c('unknown') : ` · ${num(f.kg)} kg`)).join(' / ');
  if (id === 'feed_prices') return estimate?.known_daily_cost != null ? `${c(estimate.complete ? 'estimatedDaily' : 'partialDaily')}: ₹${num(estimate.known_daily_cost)}` : c('priceUnknown');
  if (id === 'recorded_costs') return `${c('costInfo')}: ₹${num(facts.costs.feed)} · ${facts.start} — ${facts.end}.${facts.today_costs?.has_records ? ` ${facts.today_costs.date}: ₹${num(facts.today_costs.categories.feed)}.` : ''} ${c('costHelp')}`;
  if (id === 'water') return c('waterInfo') + ': ' + c(routine.water);
  if (id === 'recent_changes') return c('changesInfo') + ': ' + routine.changes.map(c).join(' / ');
  if (id === 'calving') return c('calvingInfo') + ': ' + (routine.calving_months == null ? c('unknown') : num(routine.calving_months));
  return '';
}
export const feedingTypes = ['green', 'dry', 'packaged', 'grain', 'oilcake', 'other', 'unknown'];
export const changeTypes = ['none', 'feed_changed', 'eating_less', 'unwell', 'unknown'];
export const newRoutine = () => ({ since: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()), calving_months: '', feed: [], water: 'unknown', changes: ['none'] });
export function toggleFeed(form, type) {
  const found = form.feed.some(item => item.type === type);
  return { ...form, feed: found ? form.feed.filter(item => item.type !== type) : type === 'unknown' ? [{ type, kg: null }] : [...form.feed.filter(item => item.type !== 'unknown'), { type, kg: null, ...(type === 'other' ? { description: '' } : {}) }] };
}
export function toggleChange(form, type) {
  if (['none', 'unknown'].includes(type)) return { ...form, changes: [type] };
  const selected = form.changes.includes(type) ? form.changes.filter(item => item !== type) : [...form.changes.filter(item => !['none', 'unknown'].includes(item)), type];
  return { ...form, changes: selected.length ? selected : ['none'] };
}
export function useMilkAdvice(cowId, revision, language = 'en') {
  const lang = ['en', 'mr', 'hi'].includes(language?.split('-')[0]) ? language.split('-')[0] : 'en';
  const [data, setData] = useState(null), [error, setError] = useState(null), [busy, setBusy] = useState(false);
  const serial = useRef(0), pending = useRef(false);
  const request = async (kind, form) => {
    if (!cowId || pending.current) return false;
    const id = ++serial.current; pending.current = true; setBusy(true); setError(null);
    try {
      const result = await (kind === 'save' ? api.saveFeeding(cowId, { ...form, language: lang }) : kind === 'generate' ? api.generateAdvice(cowId, lang) : api.getAdvice(cowId, lang));
      if (!result?.success || !result.data) throw result;
      if (id !== serial.current) return false;
      setData(result.data); return true;
    } catch (err) {
      if (id === serial.current) setError(err?.response?.data?.code || err?.code || 'error');
      return false;
    } finally { if (id === serial.current) { pending.current = false; setBusy(false); } }
  };
  useEffect(() => {
    serial.current++; pending.current = false; setData(null); setError(null); setBusy(false);
    request('load');
    return () => { serial.current++; pending.current = false; };
    // Each animal/revision starts a fresh request; stale responses are ignored.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cowId, revision, lang]);
  return { data, error, busy, request };
}
