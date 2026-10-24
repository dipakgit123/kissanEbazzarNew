'use strict';

// Kept identical in the web/mobile milkReportMath modules; parity is checked by
// scripts/test-milk-reports.cjs so all clients use the same accounting rules.
const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const round = value => Math.round((number(value) + Number.EPSILON) * 100) / 100;
const blank = value => value === '' || value === null || value === undefined;
const BASE_FIELDS = ['morning_liters', 'afternoon_liters', 'price_per_liter', 'feed_cost', 'medicine_cost', 'labor_cost', 'other_cost'];
const OPTIONAL_FIELDS = ['morning_sold_liters', 'afternoon_sold_liters', 'morning_price_per_liter', 'afternoon_price_per_liter', 'amount_received'];
const USAGE_FIELDS = ['home_liters', 'calf_liters', 'discarded_liters'];
const VALUE_FIELDS = [...BASE_FIELDS, ...OPTIONAL_FIELDS, ...USAGE_FIELDS];
const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const validDate = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value && Number(value.slice(0, 4)) >= 1900;
};
const decimal = value => {
  if (blank(value)) return 0;
  if (!['number', 'string'].includes(typeof value) || !/^\d+(\.\d{1,2})?$/.test(String(value).trim())) return NaN;
  const parsed = Number(value);
  return parsed >= 0 && parsed <= 99999999.99 ? parsed : NaN;
};
const normalizeValues = values => Object.fromEntries(VALUE_FIELDS.map(field => [field,
  OPTIONAL_FIELDS.includes(field) && blank(values[field]) ? null : decimal(values[field])
]));
const calculate = report => {
  const morning = number(report.morning_liters);
  const evening = number(report.afternoon_liters);
  const soldMorning = blank(report.morning_sold_liters) ? morning : number(report.morning_sold_liters);
  const soldEvening = blank(report.afternoon_sold_liters) ? evening : number(report.afternoon_sold_liters);
  const morningRate = blank(report.morning_price_per_liter) ? number(report.price_per_liter) : number(report.morning_price_per_liter);
  const eveningRate = blank(report.afternoon_price_per_liter) ? number(report.price_per_liter) : number(report.afternoon_price_per_liter);
  const revenue = round(soldMorning * morningRate + soldEvening * eveningRate);
  const cost = round(['feed_cost', 'medicine_cost', 'labor_cost', 'other_cost'].reduce((sum, field) => sum + number(report[field]), 0));
  const profit = round(revenue - cost);
  const received = blank(report.amount_received) ? null : round(report.amount_received);
  return {
    total_liters: round(morning + evening), total_sold_liters: round(soldMorning + soldEvening),
    total_revenue: revenue, total_cost: cost, profit_or_loss: profit,
    profit_status: profit > 0 ? 'profit' : profit < 0 ? 'loss' : 'break_even',
    revenue_is_estimated: blank(report.morning_sold_liters) || blank(report.afternoon_sold_liters),
    amount_received: received, amount_pending: received === null ? null : round(revenue - received),
    unallocated_liters: round(morning + evening - soldMorning - soldEvening - USAGE_FIELDS.reduce((sum, field) => sum + number(report[field]), 0))
  };
};
const validateValues = values => {
  for (const field of VALUE_FIELDS) {
    if (!blank(values[field]) && !Number.isFinite(decimal(values[field]))) return { field, reason: 'invalidNumber' };
  }
  if ((!blank(values.morning_sold_liters) && number(values.morning_sold_liters) > number(values.morning_liters)) ||
      (!blank(values.afternoon_sold_liters) && number(values.afternoon_sold_liters) > number(values.afternoon_liters))) return { reason: 'soldTooMuch' };
  const used = USAGE_FIELDS.reduce((sum, field) => sum + number(values[field]), 0);
  if (used > 0 && (blank(values.morning_sold_liters) || blank(values.afternoon_sold_liters))) return { reason: 'enterSold' };
  const result = calculate(values);
  if (result.unallocated_liters < 0) return { reason: 'usageTooMuch' };
  if (result.amount_pending !== null && result.amount_pending < 0) return { reason: 'receivedTooMuch' };
  return null;
};
// A whole-herd record is authoritative for that day. Keep individual records
// for animal comparisons/editing/export, but never add them to that day's herd total.
const selectTotals = reports => {
  const herdDates = new Set(reports.filter(report => report.report_type === 'overall').map(report => report.report_date));
  return reports.filter(report => report.report_type === 'overall' || !herdDates.has(report.report_date));
};
const summarize = reports => {
  const included = selectTotals(reports);
  const stats = { total_reports: reports.length, counted_reports: included.length, excluded_reports: reports.length - included.length,
    total_liters: 0, total_sold_liters: 0, total_revenue: 0, total_cost: 0, net_profit_or_loss: 0,
    amount_received: 0, amount_pending: 0, unrecorded_payments: 0, estimated_reports: 0,
    profitable_days: 0, loss_days: 0, break_even_days: 0, best_day: null, worst_day: null,
    best_cow: null, best_buffalo: null };
  const days = new Map();
  included.forEach(report => {
    const data = calculate(report);
    for (const key of ['total_liters', 'total_sold_liters', 'total_revenue', 'total_cost', 'amount_received', 'amount_pending']) stats[key] += number(data[key]);
    stats.net_profit_or_loss += data.profit_or_loss;
    if (data.amount_received === null) stats.unrecorded_payments++;
    if (data.revenue_is_estimated) stats.estimated_reports++;
    days.set(report.report_date, round((days.get(report.report_date) || 0) + data.profit_or_loss));
  });
  for (const [date, profit] of days) {
    stats[profit > 0 ? 'profitable_days' : profit < 0 ? 'loss_days' : 'break_even_days']++;
    if (!stats.best_day || profit > stats.best_day.profit_or_loss) stats.best_day = { report_date: date, profit_or_loss: profit };
    if (!stats.worst_day || profit < stats.worst_day.profit_or_loss) stats.worst_day = { report_date: date, profit_or_loss: profit };
  }
  const animals = new Map();
  for (const report of reports.filter(item => item.report_type !== 'overall')) {
    const key = report.cow_id || `${report.animal_type}:${report.cow_name}:${report.cow_tag || ''}`;
    const animal = animals.get(key) || { cow_name: report.cow_name, cow_tag: report.cow_tag, animal_type: report.animal_type, total_liters: 0, profit_or_loss: 0 };
    const data = calculate(report);
    animal.total_liters = round(animal.total_liters + data.total_liters);
    animal.profit_or_loss = round(animal.profit_or_loss + data.profit_or_loss);
    animals.set(key, animal);
  }
  for (const animal of animals.values()) {
    const key = animal.animal_type === 'buffalo' ? 'best_buffalo' : 'best_cow';
    if (!stats[key] || animal.profit_or_loss > stats[key].profit_or_loss) stats[key] = animal;
  }
  for (const key of ['total_liters','total_sold_liters','total_revenue','total_cost','net_profit_or_loss','amount_received','amount_pending']) stats[key] = round(stats[key]);
  return stats;
};
const csvCell = value => {
  // Preserve numeric negatives; protect user-controlled text from spreadsheet formulas.
  let text = String(value ?? '');
  if (typeof value !== 'number' && /^[\s\uFEFF]*[=+\-@\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};
const csvDocument = rows => '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n');

module.exports = { number, round, blank, BASE_FIELDS, OPTIONAL_FIELDS, USAGE_FIELDS, VALUE_FIELDS, localDate, validDate, decimal, normalizeValues, calculate, validateValues, selectTotals, summarize, csvCell, csvDocument };
