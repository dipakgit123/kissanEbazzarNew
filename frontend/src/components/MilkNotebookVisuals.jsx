import { CATEGORIES } from '../utils/milkNotebook';

export function TodayMilkChart({ data, c, liters, onDetails }) {
  const morning = data.days.reduce((sum, day) => sum + day.morning, 0);
  const evening = data.days.reduce((sum, day) => sum + day.evening, 0);
  const maximum = Math.max(morning, evening, 1);
  return <section className="mn-card mn-today-chart" aria-label={c('todayMilkChart')}>
    <div className="mn-row"><h2>{c('todayMilkChart')}</h2><strong>{data.recorded_days ? liters(data.total_liters) : '—'}</strong></div>
    {data.recorded_days ? <>
      <dl className="mn-milking-bars">
        {[[c('morning'), morning, 'morning'], [c('evening'), evening, 'evening']].map(([label, value, key]) => <div key={key} className={'mn-milking-column mn-milking-' + key}>
          <dt>{label}</dt><dd><strong>{liters(value)}</strong><span className="mn-milking-track" aria-hidden="true"><span style={{ height: `${value / maximum * 100}%` }} /></span></dd>
        </div>)}
      </dl>
      <button className="mn-chart-detail" onClick={onDetails}>{c('readHistory')} <span aria-hidden="true">→</span></button>
    </> : <p className="mn-empty">{c('noMilk')}</p>}
  </section>;
}

export function ExpenseBars({ data, c, money }) {
  const maximum = Math.max(1, ...CATEGORIES.map(key => data.categories[key]));
  return <div className="mn-expense-visual">
    <div className="mn-expense-bars">
      {CATEGORIES.map(key => <div key={key} className={'mn-expense-bar mn-expense-' + key}>
        <dl><dt>{c(key)}</dt><dd><strong>{money(data.categories[key])}</strong></dd></dl>
        <div className="mn-expense-track" aria-hidden="true"><span style={{ width: `${data.categories[key] / maximum * 100}%` }} /></div>
      </div>)}
    </div>
    <p className="mn-hint">{c(data.total_cost ? 'expenseChartHelp' : 'noRecordedExpenses')}</p>
    {!!data.purchases && <p className="mn-notice">{c('purchaseNote', { amount: money(data.purchases) })}</p>}
  </div>;
}
