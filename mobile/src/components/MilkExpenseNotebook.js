import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { milkReportService as api } from '../services/api';
import { CATEGORIES, expenseKey } from '../utils/milkNotebook';
import { localDate, validDate, decimal, csvDocument } from '../utils/milkReportMath';
import { exportMilkCsv } from '../utils/exportMilkCsv';

export default function MilkExpenseNotebook({ cows, data, c, onSaved }) {
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [limit, setLimit] = useState(5);
  const money = value => '₹' + Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  const change = (key, value) => setForm(old => ({ ...old, [key]: value }));
  const begin = record => setForm({ scope: 'herd', expense_date: localDate(), kind: 'daily', notes: '', cow_id: '', request_id: expenseKey(), ...Object.fromEntries(CATEGORIES.map(key => [key, ''])), ...record });
  const button = (label, onPress, active = false) => <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={onPress} style={[s.button, active && s.active, busy && { opacity: .5 }]}><Text style={[s.buttonText, active && { color: '#fff' }]}>{label}</Text></TouchableOpacity>;
  const input = (key, label, numeric = false) => <View key={key} style={s.field}><Text style={s.text}>{label}</Text><TextInput accessibilityLabel={label} value={String(form[key] ?? '')} editable={!busy} onChangeText={value => change(key, value)} keyboardType={numeric ? 'decimal-pad' : 'default'} maxLength={key === 'notes' ? 2000 : 100} style={s.input} /></View>;
  const save = async () => {
    if (busy) return;
    if (!validDate(form.expense_date)) { Alert.alert(c('invalidDate')); return; }
    if (form.scope === 'animal' && !form.cow_id && !(form.id && form.cow_name)) { Alert.alert(c('chooseAnimal')); return; }
    const items = form.id ? [{ category: form.category, amount: form.amount, kind: form.category === 'feed' ? form.kind : 'daily' }] : CATEGORIES.filter(key => form[key] !== '' && decimal(form[key]) !== 0).map(key => ({ category: key, amount: form[key], kind: key === 'feed' ? form.kind : 'daily' }));
    if (!items.length || items.some(item => !Number.isFinite(decimal(item.amount)) || decimal(item.amount) <= 0)) { Alert.alert(c('invalidExpense')); return; }
    setBusy(true);
    try {
      const payload = { scope: form.scope, cow_id: form.scope === 'animal' ? form.cow_id || null : null, expense_date: form.expense_date, notes: form.notes, request_id: form.request_id };
      const result = form.id ? await api.updateExpense(form.id, { ...payload, ...items[0] }) : await api.createExpenses({ ...payload, items });
      if (!result?.success) throw result;
      setForm(null); onSaved();
    } catch (error) { Alert.alert(c(error?.response?.data?.reason || error?.reason || 'saveError')); }
    finally { setBusy(false); }
  };
  const remove = record => Alert.alert(c('remove'), c('confirmDelete'), [{ text: c('cancel'), style: 'cancel' }, { text: c('remove'), style: 'destructive', onPress: async () => {
    setBusy(true);
    try { const result = await api.deleteExpense(record.id); if (!result?.success) throw result; onSaved(); }
    catch { Alert.alert(c('saveError')); } finally { setBusy(false); }
  } }]);
  const download = async () => {
    setBusy(true);
    try {
      const rows = [['date','animal','category','kind','amount','notes','source','included_in_totals'],
        ...data.expenses.map(row => [row.expense_date,row.cow_name || c('herd'),row.category,row.kind,Number(row.amount),row.notes || '', 'expense-' + row.id,true]),
        ...data.reports.flatMap(row => CATEGORIES.filter(key => Number(row[key + '_cost']) > 0).map(key => [row.report_date,row.cow_name,key,'legacy',Number(row[key + '_cost']),row.notes || '', 'milk-' + row.id,data.includedIds.has(row.id)]))];
      await exportMilkCsv(csvDocument(rows), `milk-expenses-${localDate()}.csv`);
    } catch { Alert.alert(c('saveError')); } finally { setBusy(false); }
  };
  return <View style={s.card}>
    <View style={s.row}><Text style={s.title}>{c('expenseTitle')}</Text><Text style={s.title}>{money(data.total_cost)}</Text></View>
    <View style={s.row}>{button('+ ' + c('recordExpense'), () => begin(), true)}{button(c('details'), () => setExpanded(!expanded))}</View>
    {!!data.unknown_costs && <Text style={s.hint}>{c('missingCosts', { count: data.unknown_costs })}</Text>}
    {!!data.shared_excluded && <Text style={s.hint}>{c('shared', { amount: money(data.shared_excluded) })}</Text>}
    {expanded && <>
      {CATEGORIES.map(key => <View key={key} style={s.row}><Text style={s.text}>{c(key)}</Text><Text style={s.text}>{money(data.categories[key])}</Text></View>)}
      <Text style={s.hint}>{c('dataOnly')}</Text>
      {!!data.purchases && <Text style={s.hint}>{c('purchaseNote', { amount: money(data.purchases) })}</Text>}
      {data.expenses.slice(0,limit).map(row => <View key={row.id} style={s.entry}><Text style={s.title}>{c(row.category)} · {money(row.amount)}</Text><Text style={s.text}>{row.expense_date} · {row.cow_name || c('herd')}</Text>{!!row.notes && <Text style={s.text}>{row.notes}</Text>}<View style={s.row}>{button(c('edit'), () => begin(row))}{button(c('remove'), () => remove(row))}</View></View>)}
      {data.expenses.length > limit && button(c('next'), () => setLimit(limit + 5))}
      {button(c('exportExpenses'), download)}
    </>}
    <Modal visible={!!form} animationType="slide" onRequestClose={() => { if (!busy) setForm(null); }}>
      {form && <ScrollView contentContainerStyle={s.form} keyboardShouldPersistTaps="handled"><Text style={s.title}>{c('recordExpense')}</Text>
        {input('expense_date', c('date') + ' (YYYY-MM-DD)')}
        <Text style={s.text}>{c('scope')}</Text><View style={s.row}>{['herd','animal'].map(key => <View key={key}>{button(c(key === 'herd' ? 'herd' : 'individual'), () => change('scope', key), form.scope === key)}</View>)}</View>
        {form.scope === 'animal' && <View><Text style={s.text}>{c('animal')}</Text>{form.id && !form.cow_id && <Text style={s.hint}>{c('removed', { name: form.cow_name })}</Text>}<View style={s.row}>{cows.map(cow => <View key={cow.id}>{button(cow.cow_name + (cow.cow_tag ? ' · ' + cow.cow_tag : ''), () => change('cow_id',cow.id), String(form.cow_id) === String(cow.id))}</View>)}</View></View>}
        {form.id ? input('amount', c(form.category) + ' (₹)', true) : CATEGORIES.map(key => input(key,c(key) + ' (₹)',true))}
        {input('notes',c('notes'))}
        <View style={s.row}>{button(c('cancel'), () => setForm(null))}{button(c('save'),save,true)}</View>
      </ScrollView>}
    </Modal>
  </View>;
}
const s = StyleSheet.create({
  card: { backgroundColor: '#fff', borderColor: '#d3e2d8', borderWidth: 1, borderRadius: 14, padding: 16, gap: 12, marginBottom: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { color: '#164e3b', fontSize: 17, fontWeight: '700', flexShrink: 1 },
  text: { color: '#164e3b', fontSize: 15, flexShrink: 1 },
  hint: { color: '#536b60', fontSize: 13, lineHeight: 20 },
  button: { minHeight: 44, borderRadius: 8, borderWidth: 1, borderColor: '#c8dcd0', paddingHorizontal: 14, paddingVertical: 10, justifyContent: 'center' },
  buttonText: { color: '#164e3b', fontWeight: '600' }, active: { backgroundColor: '#11744e', borderColor: '#11744e' },
  entry: { borderTopWidth: 1, borderColor: '#d3e2d8', paddingTop: 12, gap: 8 },
  form: { padding: 24, paddingTop: 50, gap: 18, backgroundColor: '#fff', flexGrow: 1 },
  field: { gap: 6 }, input: { borderWidth: 1, borderColor: '#bed5c6', borderRadius: 8, padding: 12, minHeight: 46, color: '#164e3b', fontSize: 16 }
});
