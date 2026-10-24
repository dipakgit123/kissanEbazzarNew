'use strict';
const timezone = () => process.env.APP_TIMEZONE || process.env.NOTIFICATION_TIMEZONE || 'Asia/Kolkata';
const parts = (instant, zone = timezone()) => Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
  timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
}).formatToParts(instant).map(({ type, value }) => [type, value]));
const calendarDate = (instant = new Date(), zone = timezone()) => {
  const p = parts(instant, zone);
  return `${p.year}-${p.month}-${p.day}`;
};
const addCalendarDays = (date, days) => {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};
const appointmentInstant = (date, time, zone = timezone()) => {
  const target = Date.parse(`${date}T${time}Z`);
  if (!Number.isFinite(target)) return new Date(NaN);
  let instant = target;
  for (let i = 0; i < 3; i += 1) {
    const p = parts(new Date(instant), zone);
    const wallTime = Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`);
    const correction = target - wallTime;
    if (!correction) break;
    instant += correction;
  }
  const p = parts(new Date(instant), zone);
  if (`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}` !== `${date}T${time}`) return new Date(NaN);
  return new Date(instant);
};
module.exports = { calendarDate, addCalendarDays, appointmentInstant };
