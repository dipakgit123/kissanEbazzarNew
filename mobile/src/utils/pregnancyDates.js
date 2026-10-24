export function dateOnly(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function dayDifference(a, b) {
  const parse = value => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
    const stamp = Date.parse(`${value}T00:00:00Z`);
    return Number.isFinite(stamp) && new Date(stamp).toISOString().slice(0, 10) === value ? stamp : NaN;
  };
  return (parse(a) - parse(b)) / 86400000;
}
export const openBreeding = record => ['pregnant', 'pending_confirmation'].includes(record.status);

export function businessToday(timeZone = 'Asia/Kolkata') {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
export const remainingDays = (record, today = businessToday()) => record.days_remaining != null && record.calculation_date ? Number(record.days_remaining) - dayDifference(today, record.calculation_date) : dayDifference(record.expected_delivery_date, today);
export const elapsedDays = (record, today = businessToday()) => record.days_since_breeding != null && record.calculation_date ? Number(record.days_since_breeding) + dayDifference(today, record.calculation_date) : dayDifference(today, record.mating_date);
