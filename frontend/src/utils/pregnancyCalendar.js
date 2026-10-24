// DATEONLY values are calendar days, not instants in the browser's timezone.
const DAY = 86400000;
export const DEFAULT_DURATIONS = { cow: 280, buffalo: 310, goat: 150, sheep: 150, horse: 340, dog: 63, cat: 65, pig: 114, other: 150 };

export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function dayNumber(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
  const stamp = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(stamp) && new Date(stamp).toISOString().slice(0, 10) === value ? stamp / DAY : NaN;
}

export function addDays(value, days) {
  const day = dayNumber(value);
  const duration = Number(days);
  if (!Number.isFinite(day) || !Number.isInteger(duration) || duration < 1 || duration > 1000) return '';
  return new Date((day + duration) * DAY).toISOString().slice(0, 10);
}

export function moveMonth(date, direction) {
  return new Date(date.getFullYear(), date.getMonth() + direction, 1);
}

export function daysRemaining(record, today = dateKey()) {
  if (record.days_remaining != null && Number.isFinite(Number(record.days_remaining)) && Number.isFinite(dayNumber(record.calculation_date))) return Number(record.days_remaining) - (dayNumber(today) - dayNumber(record.calculation_date));
  return dayNumber(record.expected_delivery_date) - dayNumber(today);
}

export function businessToday(timeZone = 'Asia/Kolkata', instant = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(instant).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function daysSinceBreeding(record, today = businessToday()) {
  if (record.days_since_breeding != null && Number.isFinite(Number(record.days_since_breeding)) && Number.isFinite(dayNumber(record.calculation_date))) return Number(record.days_since_breeding) + dayNumber(today) - dayNumber(record.calculation_date);
  return dayNumber(today) - dayNumber(record.mating_date);
}

export function recordOnDate(record, selected, today = dateKey()) {
  if (record.status === 'delivered') return record.actual_delivery_date === selected;
  if (record.status === 'pending_confirmation') return record.mating_date === selected || record.next_check_date === selected;
  if (record.status !== 'pregnant') return record.mating_date === selected;
  const end = record.expected_delivery_date < today ? today : record.expected_delivery_date;
  return selected >= record.mating_date && selected <= end;
}

export function pregnancyProgress(record, today = dateKey()) {
  const duration = Number(record.pregnancy_duration_days) || DEFAULT_DURATIONS[record.animal_type] || 150;
  return Math.min(100, Math.max(0, Math.round(daysSinceBreeding(record, today) / duration * 100))) || 0;
}

export function calendarDayRecords(records, selected, today = dateKey()) {
  return {
    // Older records are already marked pregnant; a missing examination history
    // must not hide their saved pregnancy periods or estimated delivery dates.
    active: records.filter(record => record.status === 'pregnant' && recordOnDate(record, selected, today)),
    due: records.filter(record => record.status === 'pregnant' && record.expected_delivery_date === selected),
    delivered: records.filter(record => record.status === 'delivered' && record.actual_delivery_date === selected),
    pending: records.filter(record => record.status === 'pending_confirmation' && recordOnDate(record, selected, today)),
  };
}

export function recordsInMonth(records, month, today = dateKey()) {
  const first = dateKey(new Date(month.getFullYear(), month.getMonth(), 1));
  const last = dateKey(new Date(month.getFullYear(), month.getMonth() + 1, 0));
  return records.filter(record => {
    if (record.status === 'delivered') return record.actual_delivery_date >= first && record.actual_delivery_date <= last;
    if (record.status === 'pending_confirmation') return (record.mating_date >= first && record.mating_date <= last) || (record.next_check_date >= first && record.next_check_date <= last);
    if (record.status !== 'pregnant') return false;
    const end = record.expected_delivery_date < today ? today : record.expected_delivery_date;
    return record.mating_date <= last && end >= first;
  });
}

