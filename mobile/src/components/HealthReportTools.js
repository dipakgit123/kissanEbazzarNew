import React, { useEffect, useState } from 'react';
import { Alert, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { healthRequest } from '../services/healthReports';
import { checkedHealthResult, healthError, healthText, reportText, urgencyCode } from '../utils/healthReport';
const Button = ({ title, onPress, disabled }) => <TouchableOpacity accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.button, disabled && { opacity: 0.5 }]}><Text style={styles.buttonText}>{title}</Text></TouchableOpacity>;

export default function HealthReportTools({ report, onOpen, onDelete, language, disabled, navigation }) {
  const c = healthText(language);
  const [history, setHistory] = useState(null), [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [question, setQuestion] = useState(''), [expanded, setExpanded] = useState(false);
  const [comparison, setComparison] = useState(null);
  useEffect(() => { setQuestion(''); setError(''); setComparison(null); }, [report?.id]);
  const run = async fn => { setBusy(true); setError(''); try { await fn(); } catch (err) { setError(healthError(err, c)); } finally { setBusy(false); } };
  const load = next => run(async () => { setHistory(await healthRequest(`/reports?page=${next}`)); setPage(next); });
  const download = () => run(async () => {
    if (!FileSystem.cacheDirectory || !await Sharing.isAvailableAsync()) { await Share.share({ message: reportText(report, c) }); return; }
    const uri = `${FileSystem.cacheDirectory}animal-health-${report.id}.txt`;
    try { await FileSystem.writeAsStringAsync(uri, reportText(report, c), { encoding: FileSystem.EncodingType.UTF8 }); await Sharing.shareAsync(uri, { mimeType: 'text/plain', UTI: 'public.plain-text' }); }
    finally { await FileSystem.deleteAsync(uri, { idempotent: true }); }
  });
  const ask = () => run(async () => {
    const prompt = question.trim(); if (!prompt) return;
    const data = await healthRequest(`/reports/${report.id}/ask`, { method: 'POST', body: { prompt, languageHint: language } });
    onOpen({ ...report, messages: [...(report.messages || []), { question: prompt, answer: data.data.answer }] }); setQuestion(''); setHistory(null);
  });
  const sameAnimal = item => report && (report.context.cowId ? item.context.cowId === report.context.cowId : report.context.animalTag && item.context.animalTag === report.context.animalTag && item.context.animalType === report.context.animalType);
  return <View pointerEvents={disabled || busy ? 'none' : 'auto'}>
    <View style={styles.card}><Button title={c('history')} disabled={disabled || busy} onPress={() => history ? setHistory(null) : load(1)} />
      {history && <>{!history.data.length && <Text>{c('empty')}</Text>}{history.data.map(item => <View key={item.id} style={styles.item}>
        <Text>{item.context.animalName || item.analysis.animalType} {item.context.animalTag} · {new Date(item.createdAt).toLocaleDateString(language)}</Text>
        <View style={styles.row}><Button title={c('open')} onPress={() => run(async () => onOpen({ ...item, analysis: checkedHealthResult(item.analysis) }))} />
          {item.id !== report?.id && sameAnimal(item) && <Button title={c('compare')} onPress={() => setComparison(item)} />}
          <Button title={c('delete')} onPress={() => Alert.alert(c('delete'), c('confirmDelete'), [{ text: c('previous'), style: 'cancel' }, { text: c('delete'), style: 'destructive', onPress: () => run(async () => { await healthRequest(`/reports/${item.id}`, { method: 'DELETE' }); setHistory(null); if (item.id === report?.id) onDelete(); }) }])} /></View>
      </View>)}<View style={styles.row}><Button title={c('previous')} disabled={page <= 1} onPress={() => load(page - 1)} /><Text>{page}</Text><Button title={c('more')} disabled={page * 10 >= history.total} onPress={() => load(page + 1)} /></View></>}
      {comparison && report && <><Text>{c('compareHint')}</Text>{[comparison, report].map(item => <View style={styles.item} key={item.id}><Text style={styles.title}>{new Date(item.createdAt).toLocaleDateString(language)}</Text><Text>{item.analysis.overallHealth}</Text>{(item.analysis.visibleSigns || []).map((line, i) => <Text key={i}>{line}</Text>)}</View>)}</>}
    </View>
    {report && <><View style={[styles.card, ['emergency', 'soon'].includes(urgencyCode(report.analysis)) && { borderColor: '#b42318' }]}>
      <Text style={[styles.title, ['emergency', 'soon'].includes(urgencyCode(report.analysis)) && { color: '#b42318' }]}>{c(urgencyCode(report.analysis) === 'unknown' ? 'uncertain' : urgencyCode(report.analysis))}</Text>
      <Text style={styles.paragraph}>{report.analysis.whenToSeeVet}</Text><View style={styles.row}><Button title={c('vet')} onPress={() => navigation.navigate('Veterinarian')} /><Button title={c('download')} onPress={download} /><Button title={c('share')} onPress={() => run(async () => Share.share({ message: reportText(report, c) }))} /></View><Text style={styles.paragraph}>{c('vetHint')}</Text>
    </View><View style={styles.card}><Button title={c('followup')} onPress={() => setExpanded(!expanded)} />{expanded && <>{(report.messages || []).map((message, i) => <View key={i} style={styles.item}><Text style={styles.title}>{message.question}</Text><Text style={styles.paragraph}>{message.answer}</Text></View>)}<TextInput style={styles.input} accessibilityLabel={c('question')} placeholder={c('question')} value={question} onChangeText={setQuestion} maxLength={2000} multiline /><Button title={c('ask')} disabled={!question.trim()} onPress={ask} /></>}</View></>}
    {busy && <Text accessibilityRole="alert">{c('waiting')}</Text>}{error ? <Text accessibilityRole="alert" style={{ color: '#b42318', padding: 12 }}>{error}</Text> : null}
  </View>;
}
const styles = StyleSheet.create({ card: { padding: 16, borderWidth: 1, borderColor: '#d4e3da', borderRadius: 16, backgroundColor: '#fff', marginBottom: 14 }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 8 }, button: { padding: 12, borderWidth: 1, borderColor: '#c9dcd2', borderRadius: 10, marginVertical: 3 }, buttonText: { color: '#164b3b', fontWeight: '600' }, input: { borderWidth: 1, borderColor: '#c9dcd2', padding: 12, borderRadius: 10, marginVertical: 6, color: '#164b3b' }, item: { borderTopWidth: 1, borderColor: '#d4e3da', paddingVertical: 12 }, title: { fontWeight: '700', color: '#164b3b', fontSize: 16 }, paragraph: { color: '#40594e', marginVertical: 8, lineHeight: 22 } });
