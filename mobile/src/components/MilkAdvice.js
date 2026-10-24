import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { adviceCopy, adviceEvidence, adviceSections, changeTypes, feedingTypes, newRoutine, toggleChange, toggleFeed, useMilkAdvice } from '../utils/useMilkAdvice';

function AdviceAnimal({ cowId, language, revision, onVet }) {
  const c = adviceCopy(language), { data, error, busy, request } = useMilkAdvice(cowId, revision, language);
  const [form, setForm] = useState(null), [costsOpen, setCostsOpen] = useState(false), [detailsOpen, setDetailsOpen] = useState(false);
  const draft = form || (data && !data.routine ? newRoutine() : null), facts = data?.facts;
  const number = n => Number(n).toLocaleString(['mr', 'hi'].includes(language) ? language + '-IN' : 'en-IN', { maximumFractionDigits: 2 });
  const button = (label, action, selected = false, disabled = false) => <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected, disabled: busy || disabled }} disabled={busy || disabled} onPress={action} style={[s.button, selected && s.selected, (busy || disabled) && s.disabled]}><Text style={[s.text, selected && s.white]}>{label}</Text></TouchableOpacity>;
  const update = fn => setForm(fn(draft));
  const input = (label, value, onChangeText, numeric = false, maxLength = 120) => <View style={s.field}><Text style={s.text}>{label}</Text><TextInput accessibilityLabel={label} editable={!busy} style={s.input} value={String(value ?? '')} onChangeText={onChangeText} keyboardType={numeric ? 'decimal-pad' : 'default'} maxLength={maxLength} /></View>;
  const feedField = (type, field, value) => update(old => ({ ...old, feed: old.feed.map(item => item.type === type ? { ...item, [field]: value } : item) }));
  const saveAndAdvise = async value => { if (await request('save', value)) { setForm(null); await request('generate'); } };
  return <View style={s.content}>
    {busy && <View accessibilityLiveRegion="polite"><ActivityIndicator color="#117552" /><Text style={s.hint}>{c('loading')}</Text></View>}
    {error && <View accessibilityRole="alert" style={s.notice}><Text style={s.text}>{c(error)}</Text>{button(c('retry'), () => request(error.startsWith('AI_') && data?.status === 'ready' ? 'generate' : 'load'))}</View>}
    {data && <>
      <Text style={data.status === 'vet_first' ? s.notice : s.hint}>{c(data.status === 'ready' && data.mode === 'initial' ? 'initial' : data.status)}</Text>
      {data.status === 'vet_first' && button(c('vet'), onVet, true)}
      {draft && <View style={s.content}>
        <Text style={s.heading}>{c('q1')}</Text>{input(c('months'), draft.calving_months, value => update(old => ({ ...old, calving_months: value })), true, 3)}
        <Text style={s.heading}>{c('q2')}</Text><Text style={s.hint}>{c('quantityHelp')}</Text>
        {feedingTypes.map(type => { const item = draft.feed.find(f => f.type === type); return <View key={type} style={s.feed}>
          {button(c(type), () => update(old => toggleFeed(old, type)), !!item)}
          {item && type !== 'unknown' && input(`${c(type)} · ${c('quantity')}`, item.kg, value => feedField(type, 'kg', value), true, 6)}
          {item && type !== 'unknown' && input(`${c(type)} · ${c('price')}`, item.price_per_kg, value => feedField(type, 'price_per_kg', value), true, 8)}
          {item && type === 'other' && input(c('otherDescription'), item.description, value => feedField(type, 'description', value))}
        </View>; })}
        {input(c('since') + ' (YYYY-MM-DD)', draft.since, value => update(old => ({ ...old, since: value })), false, 10)}
        <Text style={s.heading}>{c('q3')}</Text><View style={s.row}>{['yes', 'no', 'unknown'].map(value => <View key={value}>{button(c(value), () => update(old => ({ ...old, water: value })), draft.water === value)}</View>)}</View>
        <Text style={s.heading}>{c('q4')}</Text><View style={s.row}>{changeTypes.map(value => <View key={value}>{button(c(value), () => update(old => toggleChange(old, value)), draft.changes.includes(value))}</View>)}</View>
        <Text style={s.hint}>{c('priceHelp')}</Text><Text style={s.hint}>{c('privacy')}</Text>
        {button(c('save'), () => saveAndAdvise(draft), true, !draft.feed.length)}
        {data.routine && button(c('cancel'), () => setForm(null))}
      </View>}
      {!draft && data.status === 'ready' && !data.advice && <><Text style={s.hint}>{c('privacy')}</Text>{button(c('generate'), () => request('generate'), true)}</>}
      {!draft && data.advice?.sections && <View accessibilityLiveRegion="polite"><Text style={s.heading}>{c('generated')}</Text><Text style={s.hint}>{c('date')}: {new Date(data.advice.generated_at).toLocaleDateString()}</Text>{adviceSections.map(key => { const section = data.advice.sections[key]; return <View key={key} style={[s.panel, { marginTop: 12 }]}><Text style={s.heading}>{c(key)}</Text><Text style={s.text}>{section.action}</Text><Text style={s.heading}>{c('because')}</Text><Text style={s.text}>{section.reason}</Text><Text style={s.hint}>{c('basedOn')}</Text>{section.evidence.map(id => <Text style={s.hint} key={id}>{adviceEvidence(id, data, c, number)}</Text>)}{section.evidence.includes('feed_prices') && <Text style={s.hint}>{c('estimateHelp')}</Text>}</View>; })}</View>}
      {!draft && data.routine && <>{button(c('edit'), () => setForm(JSON.parse(JSON.stringify(data.routine))))}{data.status === 'confirm_routine' && button(c('confirm'), () => saveAndAdvise(data.routine))}</>}
      {facts && <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: detailsOpen }} onPress={() => setDetailsOpen(!detailsOpen)} style={s.button}><Text style={s.heading}>{c('details')}</Text></TouchableOpacity>}
      {detailsOpen && <>
        {data.routine && <View style={s.panel}><Text style={s.heading}>{c('saved')}</Text><Text style={s.text}>{adviceEvidence('feeding', data, c, number)}</Text><Text style={s.hint}>{c('since')}: {data.routine.since}</Text><Text style={s.text}>{adviceEvidence('feed_prices', data, c, number)}</Text><Text style={s.hint}>{c('estimateHelp')}</Text></View>}
        <Text style={s.text}>{adviceEvidence('milk_records', data, c, number)}</Text>
      {facts && <View style={s.panel}><Text style={s.heading}>{c('trend')}</Text><Text style={s.hint}>{facts.start} — {facts.end}</Text>{facts.sufficient ? ['previous', 'recent'].map(key => { const item = facts[key], maximum = Math.max(facts.previous.average || 0, facts.recent.average || 0, 1); return <View key={key} style={s.period}>
        <Text style={s.heading}>{c(key)}</Text><Text style={s.hint}>{number(item.days)} {c('coverage')}</Text><Text style={s.amount}>{item.average == null ? c('noData') : `${number(item.average)} L`}</Text><Text style={s.hint}>{c('average')}</Text><View accessible={false} style={s.track}><View style={[s.bar, { width: `${(item.average || 0) / maximum * 100}%` }]} /></View>
      </View>; }) : <Text style={s.hint}>{c('noTrend')}</Text>}{button(c('costTitle') + (costsOpen ? ' −' : ' +'), () => setCostsOpen(!costsOpen))}
        {costsOpen && <><View>{Object.entries(facts.costs).map(([key, amount]) => <View style={s.costRow} key={key}><Text style={[s.text, s.flex]}>{c(key === 'other' ? 'otherCost' : key)}</Text><Text style={s.text}>₹{number(amount)}</Text></View>)}</View><Text style={s.text}>{c('bulk')}: ₹{number(facts.bulk_purchases)}</Text><Text style={s.hint}>{c('costHelp')}</Text>{facts.missing_cost_days > 0 && <Text style={s.hint}>{c('missingCosts')}: {number(facts.missing_cost_days)}</Text>}</>}
      </View>}
      </>}
      <Text style={s.hint}>{c('disclaimer')}</Text>
    </>}
  </View>;
}
export default function MilkAdvice({ cows, language, revision, onVet }) {
  const [expanded, setExpanded] = useState(false), [cowId, setCowId] = useState('');
  const c = adviceCopy(language), available = cows.filter(cow => ['cow', 'buffalo'].includes(cow.animal_type));
  const selected = available.some(cow => String(cow.id) === cowId) ? cowId : '';
  return <View style={s.card}><Text style={s.title}>{c('title')}</Text><Text style={s.hint}>{c('intro')}</Text><TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded }} style={s.button} onPress={() => setExpanded(!expanded)}><Text style={s.heading}>{c('open')} {expanded ? '−' : '+'}</Text></TouchableOpacity>{expanded && <><Text style={s.heading}>{c('choose')}</Text><View style={s.row}>{available.map(cow => <TouchableOpacity key={cow.id} accessibilityRole="button" accessibilityState={{ selected: String(cow.id) === selected }} style={[s.button, String(cow.id) === selected && s.selected]} onPress={() => setCowId(String(cow.id))}><Text style={[s.text, String(cow.id) === selected && s.white]}>{cow.cow_name}{cow.cow_tag ? ` · ${cow.cow_tag}` : ''}</Text></TouchableOpacity>)}</View>{selected && <AdviceAnimal key={selected} cowId={selected} language={language?.split('-')[0]} revision={revision} onVet={onVet} />}</>}</View>;
}
const s = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#d7e5dc', borderTopWidth: 4, borderTopColor: '#117552', gap: 12 },
  title: { fontSize: 21, fontWeight: '700', color: '#164538' }, heading: { fontSize: 16, fontWeight: '700', color: '#164538', lineHeight: 24 },
  text: { fontSize: 15, color: '#164538', lineHeight: 23, flexShrink: 1 }, hint: { fontSize: 14, color: '#51695d', lineHeight: 22 },
  content: { gap: 16 }, panel: { backgroundColor: '#f3f8f5', padding: 14, borderRadius: 12, gap: 12 },
  button: { paddingHorizontal: 14, paddingVertical: 12, minHeight: 46, borderWidth: 1, borderColor: '#b9cfc3', borderRadius: 10, alignItems: 'center', justifyContent: 'center', maxWidth: '100%' },
  selected: { backgroundColor: '#117552', borderColor: '#117552' }, white: { color: '#fff' }, disabled: { opacity: .5 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, field: { gap: 8 }, input: { padding: 12, borderWidth: 1, borderColor: '#b9cfc3', borderRadius: 10, backgroundColor: '#fff', color: '#164538', fontSize: 16, minHeight: 48 },
  feed: { gap: 10 }, notice: { padding: 12, backgroundColor: '#fff6df', color: '#704b10', borderRadius: 10, lineHeight: 24 },
  period: { gap: 6, paddingVertical: 10 }, amount: { fontSize: 23, fontWeight: '700', color: '#117552' },
  track: { height: 14, backgroundColor: '#dce9e1', borderRadius: 6, overflow: 'hidden' }, bar: { height: '100%', backgroundColor: '#117552', borderRadius: 6 },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#d7e5dc' }, flex: { flex: 1 }
});
