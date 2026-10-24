import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { healthRequest } from '../services/healthReports';
import { checkedHealthResult, healthError, healthText, reportText, urgencyCode } from '../utils/healthReport';
const button = 'rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-900 disabled:opacity-50';
const card = 'mb-4 rounded-2xl border border-slate-200 bg-white p-4';

export default function HealthReportTools({ report, onOpen, onDelete, language, disabled }) {
  const c = healthText(language);
  const [history, setHistory] = useState(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [question, setQuestion] = useState('');
  const [comparison, setComparison] = useState(null);
  useEffect(() => { setQuestion(''); setError(''); setComparison(null); }, [report?.id]);
  const run = async fn => { setBusy(true); setError(''); try { await fn(); } catch (err) { setError(healthError(err, c)); } finally { setBusy(false); } };
  const load = next => run(async () => { const data = await healthRequest(`/reports?page=${next}`); setHistory(data); setPage(next); });
  const open = item => { try { onOpen({ ...item, analysis: checkedHealthResult(item.analysis) }); } catch (err) { setError(healthError(err, c)); } };
  const download = () => {
    const url = URL.createObjectURL(new Blob([reportText(report, c)], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `animal-health-${report.id}.txt`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const ask = () => run(async () => {
    const prompt = question.trim(); if (!prompt) return;
    const data = await healthRequest(`/reports/${report.id}/ask`, { method: 'POST', body: JSON.stringify({ prompt, languageHint: language }) });
    onOpen({ ...report, messages: [...(report.messages || []), { question: prompt, answer: data.data.answer }] }); setQuestion(''); setHistory(null);
  });
  const sameAnimal = item => report && (report.context.cowId ? item.context.cowId === report.context.cowId : report.context.animalTag && item.context.animalTag === report.context.animalTag && item.context.animalType === report.context.animalType);
  return <fieldset disabled={disabled || busy} className="min-w-0">
    <div className={card}>
      <button className={button} onClick={() => history ? setHistory(null) : load(1)}>{c('history')}</button>
      {history && <div className="mt-3 space-y-3">
        {!history.data.length && <p>{c('empty')}</p>}
        {history.data.map(item => <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3" key={item.id}>
          <span className="min-w-0 break-words text-sm">{item.context.animalName || item.analysis.animalType} {item.context.animalTag} · {new Date(item.createdAt).toLocaleDateString(language)}</span>
          <div className="flex flex-wrap gap-2"><button className={button} onClick={() => open(item)}>{c('open')}</button>
            {item.id !== report?.id && sameAnimal(item) && <button className={button} onClick={() => setComparison(item)}>{c('compare')}</button>}
            <button className={button} onClick={() => { if (window.confirm(c('confirmDelete'))) run(async () => { await healthRequest(`/reports/${item.id}`, { method: 'DELETE' }); setHistory(null); if (item.id === report?.id) onDelete(); }); }}>{c('delete')}</button></div>
        </div>)}
        <div className="flex gap-2"><button className={button} disabled={page <= 1} onClick={() => load(page - 1)}>{c('previous')}</button><span>{page}</span><button className={button} disabled={page * 10 >= history.total} onClick={() => load(page + 1)}>{c('more')}</button></div>
      </div>}
      {comparison && report && <div className="mt-3"><p>{c('compareHint')}</p><div className="grid gap-3 sm:grid-cols-2">{[comparison, report].map(item => <div key={item.id} className="rounded-xl border p-3"><b>{new Date(item.createdAt).toLocaleDateString(language)}</b><p>{item.analysis.overallHealth}</p><ul>{(item.analysis.visibleSigns || []).map((line, i) => <li key={i}>{line}</li>)}</ul></div>)}</div></div>}
    </div>
    {report && <>
      <div className={card} style={{ borderColor: urgencyCode(report.analysis) === 'emergency' ? '#b42318' : undefined }}>
        <p className="font-bold" style={{ color: ['emergency', 'soon'].includes(urgencyCode(report.analysis)) ? '#b42318' : '#164b3b' }}>{c(urgencyCode(report.analysis) === 'unknown' ? 'uncertain' : urgencyCode(report.analysis))}</p>
        <p className="my-2 text-sm">{report.analysis.whenToSeeVet}</p>
        <div className="flex flex-wrap gap-2"><Link className={button} to="/veterinarians">{c('vet')}</Link><button className={button} onClick={download}>{c('download')}</button><button className={button} onClick={() => run(async () => { if (navigator.share) { try { await navigator.share({ title: c('saved'), text: reportText(report, c) }); } catch (err) { if (err.name !== 'AbortError') throw err; } } else download(); })}>{c('share')}</button></div>
        <p className="mt-2 text-xs">{c('vetHint')}</p>
      </div>
      <details className={card}><summary className="cursor-pointer font-semibold">{c('followup')}</summary>
        {(report.messages || []).map((message, index) => <div className="my-3 border-b pb-3 text-sm" key={index}><b>{message.question}</b><p className="whitespace-pre-wrap">{message.answer}</p></div>)}
        <label htmlFor="health-report-question" className="mt-3 block text-sm">{c('question')}</label>
        <textarea id="health-report-question" value={question} maxLength={2000} onChange={event => setQuestion(event.target.value)} className="mt-1 w-full rounded-xl border p-3" />
        <button className={button} disabled={!question.trim()} onClick={ask}>{c('ask')}</button>
      </details>
    </>}
    {busy && <p role="status">{c('waiting')}</p>}{error && <p className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3" role="alert">{error}</p>}
  </fieldset>;
}
