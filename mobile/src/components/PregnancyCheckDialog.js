import { useRef, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { pregnancyService } from '../services/api';
import { dateOnly, dayDifference, businessToday } from '../utils/pregnancyDates';

// This UUID identifies a retry of a submission; it is not an authentication token.
const requestId = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const n = Math.floor(Math.random() * 16);
  return (c === 'x' ? n : (n & 3) | 8).toString(16);
});

export default function PregnancyCheckDialog({ record, styles, onClose, onSaved }) {
  const { t } = useTranslation();
  const label = key => t(`pregnancyCheck.${key}`);
  const [form, setForm] = useState(() => ({ checked_on: businessToday(record.calculation_timezone), result: '', estimated_age_value: '', estimated_age_unit: 'months', next_check_date: '', doctor_name: '', notes: '', request_id: requestId() }));
  const [details, setDetails] = useState(false);
  const [dateField, setDateField] = useState(null);
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const update = (key, value) => setForm(previous => ({ ...previous, [key]: value }));
  const save = async () => {
    if (saving.current) return;
    if (!form.result || !Number.isFinite(dayDifference(form.checked_on, record.mating_date)) || form.checked_on < record.mating_date || form.checked_on > businessToday(record.calculation_timezone)) {
      Alert.alert(t('common.error'), label('invalidCheck')); return;
    }
    saving.current = true; setBusy(true);
    try {
      const result = await pregnancyService.recordCheckup(record.id, form);
      if (!result.success) throw new Error(result.message);
      onSaved(result.data);
    } catch (error) { Alert.alert(t('common.error'), error.message); }
    finally { saving.current = false; setBusy(false); }
  };
  const dateInput = (field, title) => <View style={styles.inputGroup}>
    <Text style={styles.inputLabel}>{title}</Text>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={title} style={styles.input} disabled={busy} onPress={() => setDateField(field)}><Text>{form[field] || t('pregnancy.dateFormatPlaceholder')}</Text></TouchableOpacity>
    {field === 'next_check_date' && form[field] ? <TouchableOpacity disabled={busy} onPress={() => update(field, '')}><Text>{t('common.cancel')}</Text></TouchableOpacity> : null}
  </View>;
  return <Modal visible animationType="slide" transparent onRequestClose={() => !busy && onClose()}>
    <View style={styles.modalOverlay}><View style={styles.modalSheet}>
      <View style={styles.modalHeader}><Text style={[styles.modalTitle, { flex: 1 }]}>{label('recordCheck')}</Text><TouchableOpacity disabled={busy} accessibilityLabel={t('common.close')} onPress={onClose}><Text>×</Text></TouchableOpacity></View>
      <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.recordAnimalName}>{record.animal_name}</Text>
        <Text style={styles.sectionSubtitle}>{t('pregnancyCheck.breedingDate')}: {record.mating_date}</Text>
        <Text style={styles.sectionSubtitle}>{label('anchorHelp')}</Text>
        {dateInput('checked_on', label('checkedOn'))}
        <Text style={styles.inputLabel}>{label('result')}</Text>
        <View style={[styles.typeChipRow, { flexWrap: 'wrap' }]}>{[['pregnant', 'pregnant'], ['not_pregnant', 'notPregnant'], ['recheck', 'checkAgain']].map(([value, key]) => <TouchableOpacity key={value} disabled={busy} accessibilityRole="radio" accessibilityState={{ checked: form.result === value }} style={[styles.typeChip, form.result === value && styles.typeChipActive]} onPress={() => setForm(previous => ({ ...previous, result: value, next_check_date: value === 'not_pregnant' ? '' : previous.next_check_date }))}><Text style={styles.typeChipText}>{label(key)}</Text></TouchableOpacity>)}</View>
        <TouchableOpacity disabled={busy} onPress={() => setDetails(!details)}><Text style={styles.inputLabel}>{label('details')}</Text></TouchableOpacity>
        {details && <>
          <Text style={styles.inputLabel}>{label('age')}</Text><TextInput accessibilityLabel={label('age')} editable={!busy} style={styles.input} keyboardType="decimal-pad" value={form.estimated_age_value} onChangeText={value => update('estimated_age_value', value)} />
          <View style={[styles.typeChipRow, { flexWrap: 'wrap' }]}>{['days', 'weeks', 'months'].map(unit => <TouchableOpacity key={unit} disabled={busy} style={[styles.typeChip, form.estimated_age_unit === unit && styles.typeChipActive]} onPress={() => update('estimated_age_unit', unit)}><Text style={styles.typeChipText}>{label(unit)}</Text></TouchableOpacity>)}</View>
          {form.result !== 'not_pregnant' && dateInput('next_check_date', label('nextCheck'))}
          <Text style={styles.inputLabel}>{label('doctor')}</Text><TextInput accessibilityLabel={label('doctor')} editable={!busy} style={styles.input} maxLength={100} value={form.doctor_name} onChangeText={value => update('doctor_name', value)} />
          <Text style={styles.inputLabel}>{t('pregnancy.notes')}</Text><TextInput accessibilityLabel={t('pregnancy.notes')} editable={!busy} style={styles.input} multiline maxLength={5000} value={form.notes} onChangeText={value => update('notes', value)} />
        </>}
        {dateField && <>
          <DateTimePicker value={new Date(`${form[dateField] || businessToday(record.calculation_timezone)}T12:00:00`)} minimumDate={new Date(`${dateField === 'checked_on' ? record.mating_date : form.checked_on}T00:00:00`)} maximumDate={dateField === 'checked_on' ? new Date() : undefined} mode="date" onChange={(event, value) => { if (Platform.OS !== 'ios') setDateField(null); if (event.type !== 'dismissed' && value) update(dateField, dateOnly(value)); }} />
          {Platform.OS === 'ios' && <TouchableOpacity onPress={() => setDateField(null)}><Text>{t('common.close')}</Text></TouchableOpacity>}
        </>}
        <View style={styles.modalActionRow}><TouchableOpacity disabled={busy} style={styles.secondaryModalButton} onPress={onClose}><Text style={styles.secondaryModalButtonText}>{t('common.cancel')}</Text></TouchableOpacity><TouchableOpacity disabled={busy} style={styles.primaryModalButton} onPress={save}><Text style={styles.primaryModalButtonText}>{busy ? t('common.loading') : label('save')}</Text></TouchableOpacity></View>
      </ScrollView>
    </View></View>
  </Modal>;
}
