'use strict';
const { createHash } = require('node:crypto');
const { validDate, round } = require('./milkReportMath');
const { shiftDate } = require('./milkNotebook');
const VERSION = 2;
const todayIndia = (now = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
const fail = (code, status = 400) => Object.assign(new Error(code), { code, status });
function validateRoutine(input, today = todayIndia()) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw fail('INVALID_ROUTINE');
  if (!validDate(input.since) || input.since > today) throw fail('INVALID_ROUTINE');
  const scalar = value => value == null || typeof value === 'string' || typeof value === 'number';
  if (!scalar(input.calving_months)) throw fail('INVALID_ROUTINE');
  const months = input.calving_months === '' || input.calving_months == null ? null : Number(input.calving_months);
  if (months !== null && (!Number.isInteger(months) || months < 0 || months > 120 || typeof input.calving_months === 'boolean')) throw fail('INVALID_ROUTINE');
  if (!['yes', 'no', 'unknown'].includes(input.water)) throw fail('INVALID_ROUTINE');
  if (!Array.isArray(input.changes) || !input.changes.length || input.changes.some(x => !['none', 'feed_changed', 'eating_less', 'unwell', 'unknown'].includes(x)) || new Set(input.changes).size !== input.changes.length || (input.changes.length > 1 && input.changes.some(x => ['none', 'unknown'].includes(x)))) throw fail('INVALID_ROUTINE');
  if (!Array.isArray(input.feed) || !input.feed.length || input.feed.length > 7 || new Set(input.feed.map(x => x?.type)).size !== input.feed.length) throw fail('INVALID_ROUTINE');
  const feed = input.feed.map(item => {
    if (!item || !['green', 'dry', 'packaged', 'grain', 'oilcake', 'other', 'unknown'].includes(item.type)) throw fail('INVALID_ROUTINE');
    if (!scalar(item.kg)) throw fail('INVALID_ROUTINE');
    const quantity = item.kg === '' || item.kg == null ? null : Number(item.kg);
    if (quantity !== null && (typeof item.kg === 'boolean' || !Number.isFinite(quantity) || quantity <= 0 || quantity > 200 || round(quantity) !== quantity || item.type === 'unknown')) throw fail('INVALID_ROUTINE');
    if (!scalar(item.price_per_kg)) throw fail('INVALID_ROUTINE');
    const price = item.price_per_kg === '' || item.price_per_kg == null ? null : Number(item.price_per_kg);
    if (price !== null && (!Number.isFinite(price) || price < 0 || price > 10000 || round(price) !== price || item.type === 'unknown')) throw fail('INVALID_ROUTINE');
    if (item.type === 'other' && (typeof item.description !== 'string' || !item.description.trim() || item.description.length > 120)) throw fail('INVALID_ROUTINE');
    return { type: item.type, kg: quantity, price_per_kg: price, ...(item.type === 'other' ? { description: item.description.trim() } : {}) };
  }).sort((a, b) => a.type.localeCompare(b.type));
  if (feed.length > 1 && feed.some(x => x.type === 'unknown')) throw fail('INVALID_ROUTINE');
  return { since: input.since, calving_months: months, water: input.water, changes: [...input.changes].sort(), feed };
}
// These are recorded-period facts, not a diagnosis or a feed ration calculation.
function summarize(reports, expenses, cowId, today = todayIndia()) {
  const end = shiftDate(today, -1); // Today's incomplete milkings must not look like a decline.
  const start = shiftDate(end, -13), split = shiftDate(end, -6);
  const available = reports.filter(r => r.report_type === 'individual' && String(r.cow_id) === String(cowId) && r.report_date >= start && r.report_date <= today);
  if (new Set(available.map(r => r.report_date)).size !== available.length) throw fail('DUPLICATE_RECORDS', 422);
  const latest = [...available].sort((a, b) => b.report_date.localeCompare(a.report_date))[0];
  const latestLiters = latest ? Number(latest.morning_liters) + Number(latest.afternoon_liters) : null;
  if (latest && (!Number.isFinite(latestLiters) || latestLiters < 0)) throw fail('INVALID_RECORDS', 422);
  const owned = reports.filter(r => r.report_type === 'individual' && String(r.cow_id) === String(cowId) && r.report_date >= start && r.report_date <= end);
  const days = new Map();
  for (const r of owned) {
    const liters = Number(r.morning_liters) + Number(r.afternoon_liters);
    if (!Number.isFinite(liters) || liters < 0) throw fail('INVALID_RECORDS', 422);
    // Duplicate animal/day records cannot safely be summed as separate milkings.
    if (days.has(r.report_date)) throw fail('DUPLICATE_RECORDS', 422);
    days.set(r.report_date, round(liters));
  }
  const window = (from, to) => {
    const values = [...days].filter(([date]) => date >= from && date <= to).map(([, liters]) => liters);
    return { from, to, days: values.length, average: values.length ? round(values.reduce((a, b) => a + b, 0) / values.length) : null };
  };
  const previous = window(start, shiftDate(split, -1)), recent = window(split, end);
  const sufficient = recent.days >= 5 && previous.days >= 5;
  const costs = { feed: 0, medicine: 0, labor: 0, other: 0 };
  const todayReport = available.find(r => r.report_date === today);
  const todayExpenses = expenses.filter(e => e.scope === 'animal' && String(e.cow_id) === String(cowId) && e.expense_date === today);
  const todayCosts = Object.fromEntries(Object.keys(costs).map(category => [category, round(Number(todayReport?.[category + '_cost'] || 0) + todayExpenses.filter(e => e.category === category && e.kind !== 'purchase').reduce((sum, e) => sum + Number(e.amount), 0))]));
  const individual = expenses.filter(e => e.scope === 'animal' && String(e.cow_id) === String(cowId) && e.expense_date >= start && e.expense_date <= end);
  for (const r of owned) for (const category of Object.keys(costs)) costs[category] += Number(r[category + '_cost'] || 0);
  let bulk = 0;
  for (const e of individual) {
    if (e.kind === 'purchase') bulk += Number(e.amount);
    else if (Object.hasOwn(costs, e.category)) costs[e.category] += Number(e.amount);
  }
  const missingCosts = owned.filter(r => r.expense_status !== 'none' && !Object.keys(costs).some(k => Number(r[k + '_cost']) > 0) && !individual.some(e => e.expense_date === r.report_date && e.kind !== 'purchase')).length;
  return { start, end, previous, recent, sufficient, recorded_days: available.length,
    today_costs: { date: today, categories: todayCosts, bulk_purchases: round(todayExpenses.filter(e => e.kind === 'purchase').reduce((sum, e) => sum + Number(e.amount), 0)), has_records: todayExpenses.length > 0 || todayReport?.expense_status === 'none' || Object.values(todayCosts).some(n => n > 0) },
    latest_milk: latest ? { date: latest.report_date, liters: round(latestLiters), may_be_partial: latest.report_date === today } : null,
    change_liters: sufficient ? round(recent.average - previous.average) : null,
    costs: Object.fromEntries(Object.entries(costs).map(([k, v]) => [k, round(v)])), bulk_purchases: round(bulk), missing_cost_days: missingCosts,
    shared_costs_excluded: expenses.some(e => e.scope === 'herd' && e.expense_date >= start && e.expense_date <= end),
    daily: [...days].sort(([a], [b]) => a.localeCompare(b)).map(([date, liters]) => ({ date, liters })) };
}
function feedingEstimate(routine) {
  const items = (routine?.feed || []).map(f => ({ type: f.type, kg: f.kg ?? null, price_per_kg: f.price_per_kg ?? null,
    daily_cost: f.kg != null && f.price_per_kg != null ? round(f.kg * f.price_per_kg) : null }));
  return { items, known_daily_cost: items.some(f => f.daily_cost != null) ? round(items.reduce((sum, f) => sum + (f.daily_cost ?? 0), 0)) : null,
    complete: items.length > 0 && items.every(f => f.type !== 'unknown' && f.daily_cost != null) };
}
function evidenceFor(routine, facts) {
  return {
    milk_records: { recorded_days: facts.recorded_days, latest: facts.latest_milk, trend_available: facts.sufficient, change_liters: facts.change_liters },
    feeding: { since: routine.since, items: routine.feed.map(({ type, kg, price_per_kg }) => ({ type, kg, price_per_kg: price_per_kg ?? null })) },
    feed_prices: feedingEstimate(routine),
    recorded_costs: { from: facts.start, to: facts.end, categories: facts.costs, bulk_purchases: facts.bulk_purchases, missing_cost_days: facts.missing_cost_days, shared_costs_excluded: facts.shared_costs_excluded, today: facts.today_costs },
    water: routine.water, recent_changes: routine.changes, calving: { months_at_confirmation: routine.calving_months }
  };
}
function fingerprint(data) { return createHash('sha256').update(JSON.stringify({ version: VERSION, ...data })).digest('hex'); }
module.exports = { validateRoutine, summarize, feedingEstimate, evidenceFor, fingerprint, todayIndia, fail };
