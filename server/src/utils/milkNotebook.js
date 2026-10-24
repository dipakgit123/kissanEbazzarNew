const { calculate, selectTotals, summarize, round, localDate, validDate } = require('./milkReportMath');

const CATEGORIES = ['feed', 'medicine', 'labor', 'other'];
const expenseKey = () => `expense-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
const shiftDate = (value, days) => {
  const date = new Date(value + 'T12:00:00Z');
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};
const dateList = (from, to) => {
  if (!validDate(from) || !validDate(to) || from > to) return [];
  const dates = [];
  for (let day = from; day <= to && dates.length < 366; day = shiftDate(day, 1)) {
    dates.push(day);
    if (day === to) break;
  }
  return dates;
};
function notebookRange(tab, period, value, from, to, today = localDate()) {
  if (tab === 'today' || tab === 'animals') return { from: today, to: today };
  if (period === 'week') return validDate(value) ? { from: shiftDate(value, -6), to: value } : null;
  if (period === 'month') {
    if (!/^\d{4}-\d{2}$/.test(value) || !validDate(value + '-01')) return null;
    const last = new Date(value + '-01T12:00:00Z');
    last.setUTCMonth(last.getUTCMonth() + 1, 0);
    return { from: value + '-01', to: last.toISOString().slice(0, 10) };
  }
  if (period === 'year') return /^\d{4}$/.test(value) && Number(value) >= 1900 ? { from: value + '-01-01', to: value + '-12-31' } : null;
  return validDate(from) && validDate(to) && from <= to && (new Date(to) - new Date(from)) / 86400000 <= 365 ? { from, to } : null;
}
function notebookData(allReports, allExpenses, animal = '', type = 'all', species = 'all') {
  const reports = allReports.filter(report => (!animal || String(report.cow_id) === String(animal)) && (type === 'all' || report.report_type === type) && (species === 'all' || report.animal_type === species)).map(report => ({ ...report, ...calculate(report) }));
  const expenses = allExpenses.filter(expense => (!animal || String(expense.cow_id) === String(animal)) && (species === 'all' || expense.animal_type === species));
  const included = selectTotals(reports);
  const includedIds = new Set(included.map(report => report.id));
  const stats = summarize(reports);
  const categories = Object.fromEntries(CATEGORIES.map(category => [category, 0]));
  const days = new Map();
  const getDay = date => {
    if (!days.has(date)) days.set(date, { date, milk: null, morning: 0, evening: 0, value: 0, cost: 0, purchases: 0, reports: [], expenses: [], unknown: 0 });
    return days.get(date);
  };
  for (const report of reports) {
    const day = getDay(report.report_date);
    day.reports.push(report);
    if (!includedIds.has(report.id)) continue;
    day.milk = round((day.milk || 0) + report.total_liters);
    day.morning = round(day.morning + Number(report.morning_liters || 0));
    day.evening = round(day.evening + Number(report.afternoon_liters || 0));
    day.value = round(day.value + report.total_revenue);
    day.cost = round(day.cost + report.total_cost);
    for (const category of CATEGORIES) categories[category] += Number(report[category + '_cost'] || 0);
    const hasExpense = expenses.some(expense => expense.expense_date === report.report_date && (expense.scope === 'herd' || (expense.cow_id != null && String(expense.cow_id) === String(report.cow_id))));
    if (report.expense_status !== 'none' && !report.total_cost && !hasExpense) day.unknown++;
  }
  for (const expense of expenses) {
    const day = getDay(expense.expense_date);
    day.expenses.push(expense);
    day.cost = round(day.cost + Number(expense.amount));
    categories[expense.category] += Number(expense.amount);
    if (expense.kind === 'purchase') day.purchases = round(day.purchases + Number(expense.amount));
  }
  const daily = [...days.values()].map(day => ({ ...day, balance: round(day.value - day.cost) })).sort((a, b) => b.date.localeCompare(a.date));
  const totalCost = round(daily.reduce((sum, day) => sum + day.cost, 0));
  return { reports, expenses, includedIds, days: daily, categories: Object.fromEntries(Object.entries(categories).map(([key, amount]) => [key, round(amount)])),
    ...stats, total_cost: totalCost, balance: round(stats.total_revenue - totalCost),
    recorded_days: daily.filter(day => day.milk !== null).length,
    unknown_costs: daily.reduce((sum, day) => sum + day.unknown, 0),
    purchases: round(daily.reduce((sum, day) => sum + day.purchases, 0)),
    shared_excluded: animal || species !== 'all' ? round(allExpenses.filter(expense => expense.scope === 'herd').reduce((sum, expense) => sum + Number(expense.amount), 0)) : 0
  };
}

module.exports = { CATEGORIES, expenseKey, shiftDate, dateList, notebookRange, notebookData };
