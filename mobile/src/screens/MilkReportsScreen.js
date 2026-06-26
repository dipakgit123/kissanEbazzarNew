import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../utils/constants';
import { milkReportService } from '../services/api';
import CowLoader from '../components/CowLoader';
import AppHeader from '../components/AppHeader';
import FeatureHelpModal from '../components/FeatureHelpModal';
import { getLocalizedFeatureHelp } from '../constants/featureHelp';

const REPORT_TYPES = {
  INDIVIDUAL: 'individual',
  OVERALL: 'overall',
};

const FILTER_ALL = 'all';
const ANIMAL_TYPES = {
  COW: 'cow',
  BUFFALO: 'buffalo',
};

const PERIODS = {
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year',
};

const CHART_METRICS = {
  LITERS: 'liters',
  PROFIT: 'profit',
  REVENUE: 'revenue',
};

const REPORTS_PER_PAGE = 5;
const ANIMALS_PER_PAGE = 5;
const HELP_STORAGE_KEY = 'milkReportsHelpSeen';

const getTodayString = () => new Date().toISOString().slice(0, 10);
const getCurrentMonthString = () => new Date().toISOString().slice(0, 7);
const getCurrentYearString = () => String(new Date().getFullYear());

const initialAnimalForm = {
  animal_type: ANIMAL_TYPES.COW,
  cow_name: '',
  cow_tag: '',
  breed_name: '',
  age_years: '',
  notes: '',
};

const initialReportForm = {
  report_type: REPORT_TYPES.INDIVIDUAL,
  report_date: getTodayString(),
  cow_id: '',
  morning_liters: '',
  afternoon_liters: '',
  price_per_liter: '',
  feed_cost: '',
  medicine_cost: '',
  labor_cost: '',
  other_cost: '',
  notes: '',
};

const toNumber = (value) => {
  const parsed = Number.parseFloat(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseDateString = (value) => {
  if (!value) return null;
  const [yearText, monthText, dayText] = value.split('-');
  const year = Number.parseInt(yearText, 10);
  const month = Number.parseInt(monthText, 10);
  const day = Number.parseInt(dayText, 10);
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day));
};

const addUtcDays = (date, days) => {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
};

const getMonthRange = (monthValue) => {
  const [yearText, monthText] = (monthValue || getCurrentMonthString()).split('-');
  const year = Number.parseInt(yearText, 10);
  const month = Number.parseInt(monthText, 10);
  if (!year || !month) return null;
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0));
  return {
    fromDate: startDate.toISOString().slice(0, 10),
    toDate: endDate.toISOString().slice(0, 10),
    exportLabel: `${year}-${String(month).padStart(2, '0')}`,
  };
};

const getWeekRange = (dateValue) => {
  const anchorDate = parseDateString(dateValue || getTodayString());
  if (!anchorDate) return null;
  const startDate = addUtcDays(anchorDate, -6);
  return {
    fromDate: startDate.toISOString().slice(0, 10),
    toDate: anchorDate.toISOString().slice(0, 10),
    exportLabel: anchorDate.toISOString().slice(0, 10),
  };
};

const getYearRange = (yearValue) => {
  const year = Number.parseInt(yearValue || getCurrentYearString(), 10);
  if (!year) return null;
  return {
    fromDate: `${year}-01-01`,
    toDate: `${year}-12-31`,
    exportLabel: `${year}`,
  };
};

const getPeriodRange = ({ period, weekDate, monthValue, yearValue }) => {
  if (period === PERIODS.WEEK) return getWeekRange(weekDate);
  if (period === PERIODS.YEAR) return getYearRange(yearValue);
  return getMonthRange(monthValue);
};

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN', {
  maximumFractionDigits: 0,
})}`;

const formatCurrencyPrecise = (value) => `₹${Number(value || 0).toLocaleString('en-IN', {
  maximumFractionDigits: 2,
})}`;

const formatLiters = (value) => `${Number(value || 0).toLocaleString('en-IN', {
  maximumFractionDigits: 1,
})} L`;

const formatDate = (value, locale = 'en-IN') => {
  if (!value) return '';
  return new Date(value).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getReportProfitStatus = (report) => {
  const profit = toNumber(report.profit_or_loss);
  if (profit > 0) return 'profit';
  if (profit < 0) return 'loss';
  return 'same';
};

const enrichReport = (report) => ({
  ...report,
  total_liters: report.total_liters ?? (toNumber(report.morning_liters) + toNumber(report.afternoon_liters)),
  total_revenue: report.total_revenue ?? ((toNumber(report.morning_liters) + toNumber(report.afternoon_liters)) * toNumber(report.price_per_liter)),
  total_cost: report.total_cost ?? (
    toNumber(report.feed_cost) + toNumber(report.medicine_cost) + toNumber(report.labor_cost) + toNumber(report.other_cost)
  ),
  profit_or_loss: report.profit_or_loss ?? (
    ((toNumber(report.morning_liters) + toNumber(report.afternoon_liters)) * toNumber(report.price_per_liter))
    - (toNumber(report.feed_cost) + toNumber(report.medicine_cost) + toNumber(report.labor_cost) + toNumber(report.other_cost))
  ),
});

const buildStats = (reports) => {
  const stats = {
    total_reports: reports.length,
    total_liters: 0,
    total_revenue: 0,
    total_cost: 0,
    net_profit_or_loss: 0,
    profitable_days: 0,
    loss_days: 0,
    all_animal_total: { total_liters: 0, profit_or_loss: 0 },
    overall_herd_total: { total_liters: 0, profit_or_loss: 0 },
    best_cow: null,
    best_buffalo: null,
  };

  reports.forEach((report) => {
    const totalLiters = toNumber(report.total_liters);
    const revenue = toNumber(report.total_revenue);
    const cost = toNumber(report.total_cost);
    const profit = toNumber(report.profit_or_loss);
    const status = getReportProfitStatus(report);

    stats.total_liters += totalLiters;
    stats.total_revenue += revenue;
    stats.total_cost += cost;
    stats.net_profit_or_loss += profit;
    if (status === 'profit') stats.profitable_days += 1;
    if (status === 'loss') stats.loss_days += 1;

    if (report.report_type === REPORT_TYPES.OVERALL) {
      stats.overall_herd_total.total_liters += totalLiters;
      stats.overall_herd_total.profit_or_loss += profit;
    } else {
      stats.all_animal_total.total_liters += totalLiters;
      stats.all_animal_total.profit_or_loss += profit;

      const currentBestKey = report.animal_type === ANIMAL_TYPES.BUFFALO ? 'best_buffalo' : 'best_cow';
      if (!stats[currentBestKey] || profit > toNumber(stats[currentBestKey].profit_or_loss)) {
        stats[currentBestKey] = report;
      }
    }
  });

  return stats;
};

const buildChartData = (reports, period, range, locale, metric) => {
  if (!range) return [];

  if (metric === CHART_METRICS.PROFIT) {
    return reports.map((report) => ({
      key: `report-${report.id}`,
      label: report.cow_name || report.report_date,
      helper: formatDate(report.report_date, locale),
      value: toNumber(report.profit_or_loss),
    }));
  }

  const buckets = {};
  reports.forEach((report) => {
    const date = parseDateString(report.report_date);
    if (!date) return;

    let key = report.report_date;
    let label = date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });

    if (period === PERIODS.YEAR) {
      key = report.report_date.slice(0, 7);
      label = date.toLocaleDateString(locale, { month: 'short' });
    }

    if (!buckets[key]) {
      buckets[key] = { key, label, helper: '', value: 0, reports: 0 };
    }

    buckets[key].value += metric === CHART_METRICS.REVENUE ? toNumber(report.total_revenue) : toNumber(report.total_liters);
    buckets[key].reports += 1;
  });

  return Object.values(buckets).sort((a, b) => a.key.localeCompare(b.key));
};

const buildCsv = (reports, t) => {
  const header = [
    t('milkReports.date'),
    t('milkReports.reportType'),
    t('milkReports.animalType'),
    t('milkReports.animal'),
    t('milkReports.tag'),
    t('milkReports.morningLiters'),
    t('milkReports.eveningLiters'),
    t('milkReports.totalMilk'),
    t('milkReports.pricePerLiter'),
    t('milkReports.moneyIn'),
    t('milkReports.moneyOut'),
    t('milkReports.result'),
    t('milkReports.notes'),
  ];

  const rows = reports.map((report) => [
    report.report_date,
    report.report_type === REPORT_TYPES.OVERALL ? t('milkReports.overall') : t('milkReports.individual'),
    report.animal_type ? t(`animalTypes.${report.animal_type}`) : '',
    report.report_type === REPORT_TYPES.OVERALL ? t('milkReports.overallHerd') : (report.cow_name || ''),
    report.cow_tag || '',
    report.morning_liters ?? '',
    report.afternoon_liters ?? '',
    report.total_liters ?? '',
    report.price_per_liter ?? '',
    report.total_revenue ?? '',
    report.total_cost ?? '',
    report.profit_or_loss ?? '',
    (report.notes || '').replace(/\r?\n/g, ' '),
  ]);

  return [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
};

const buildAnimalCsv = (animals, t) => {
  const header = [
    t('milkReports.animalType'),
    t('milkReports.animal'),
    t('milkReports.tag'),
    t('milkReports.breed'),
    t('milkReports.age'),
    t('milkReports.notes'),
  ];

  const rows = animals.map((animal) => [
    animal.animal_type ? t(`animalTypes.${animal.animal_type}`) : '',
    animal.cow_name || '',
    animal.cow_tag || '',
    animal.breed_name || '',
    animal.age_years || '',
    (animal.notes || '').replace(/\r?\n/g, ' '),
  ]);

  return [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
};

const MilkReportsScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const locale = i18n.resolvedLanguage === 'mr' ? 'mr-IN' : i18n.resolvedLanguage === 'hi' ? 'hi-IN' : 'en-IN';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingAnimal, setSavingAnimal] = useState(false);
  const [savingReport, setSavingReport] = useState(false);
  const [animals, setAnimals] = useState([]);
  const [allReports, setAllReports] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(PERIODS.MONTH);
  const [selectedWeekDate, setSelectedWeekDate] = useState(getTodayString());
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthString());
  const [selectedYear, setSelectedYear] = useState(getCurrentYearString());
  const [reportTypeFilter, setReportTypeFilter] = useState(FILTER_ALL);
  const [animalTypeFilter, setAnimalTypeFilter] = useState(FILTER_ALL);
  const [animalFilter, setAnimalFilter] = useState(FILTER_ALL);
  const [chartMetric, setChartMetric] = useState(CHART_METRICS.LITERS);
  const [animalForm, setAnimalForm] = useState(initialAnimalForm);
  const [reportForm, setReportForm] = useState(initialReportForm);
  const [animalModalVisible, setAnimalModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [editingAnimalId, setEditingAnimalId] = useState(null);
  const [editingReportId, setEditingReportId] = useState(null);
  const [animalPage, setAnimalPage] = useState(1);
  const [reportPage, setReportPage] = useState(1);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [analysisExpanded, setAnalysisExpanded] = useState(false);
  const [animalsExpanded, setAnimalsExpanded] = useState(false);
  const [reportsExpanded, setReportsExpanded] = useState(true);
  const milkReportsHelp = getLocalizedFeatureHelp('milkReports', i18n.resolvedLanguage || i18n.language);

  const selectedAnimal = useMemo(
    () => animals.find((animal) => String(animal.id) === String(reportForm.cow_id)),
    [animals, reportForm.cow_id]
  );

  const activeRange = useMemo(() => getPeriodRange({
    period: selectedPeriod,
    weekDate: selectedWeekDate,
    monthValue: selectedMonth,
    yearValue: selectedYear,
  }), [selectedMonth, selectedPeriod, selectedWeekDate, selectedYear]);

  const filteredReports = useMemo(() => {
    if (!activeRange) return [];

    return allReports
      .map(enrichReport)
      .filter((report) => report.report_date >= activeRange.fromDate && report.report_date <= activeRange.toDate)
      .filter((report) => reportTypeFilter === FILTER_ALL || report.report_type === reportTypeFilter)
      .filter((report) => animalTypeFilter === FILTER_ALL || report.animal_type === animalTypeFilter)
      .filter((report) => animalFilter === FILTER_ALL || String(report.cow_id) === String(animalFilter))
      .sort((a, b) => String(b.report_date).localeCompare(String(a.report_date)));
  }, [activeRange, allReports, animalFilter, animalTypeFilter, reportTypeFilter]);

  const stats = useMemo(() => buildStats(filteredReports), [filteredReports]);
  const totalAnimalPages = Math.max(1, Math.ceil(animals.length / ANIMALS_PER_PAGE));
  const totalReportPages = Math.max(1, Math.ceil(filteredReports.length / REPORTS_PER_PAGE));
  const paginatedAnimals = useMemo(() => {
    const start = (animalPage - 1) * ANIMALS_PER_PAGE;
    return animals.slice(start, start + ANIMALS_PER_PAGE);
  }, [animalPage, animals]);
  const paginatedReports = useMemo(() => {
    const start = (reportPage - 1) * REPORTS_PER_PAGE;
    return filteredReports.slice(start, start + REPORTS_PER_PAGE);
  }, [filteredReports, reportPage]);
  const chartData = useMemo(
    () => buildChartData(filteredReports, selectedPeriod, activeRange, locale, chartMetric),
    [activeRange, chartMetric, filteredReports, locale, selectedPeriod]
  );
  const maxChartValue = useMemo(() => {
    const values = chartData.map((point) => Math.abs(toNumber(point.value)));
    return Math.max(...values, 1);
  }, [chartData]);

  const preview = useMemo(() => {
    const totalLiters = toNumber(reportForm.morning_liters) + toNumber(reportForm.afternoon_liters);
    const revenue = totalLiters * toNumber(reportForm.price_per_liter);
    const cost = toNumber(reportForm.feed_cost) + toNumber(reportForm.medicine_cost)
      + toNumber(reportForm.labor_cost) + toNumber(reportForm.other_cost);
    const profit = revenue - cost;
    return { totalLiters, revenue, cost, profit };
  }, [reportForm]);

  const periodLabel = useMemo(() => {
    if (!activeRange) return t('milkReports.selectedPeriod');
    if (selectedPeriod === PERIODS.WEEK) {
      return t('milkReports.last7DaysEnding', { date: formatDate(selectedWeekDate, locale) });
    }
    if (selectedPeriod === PERIODS.YEAR) {
      return t('milkReports.yearLabel', { year: selectedYear });
    }
    const monthDate = parseDateString(`${selectedMonth}-01`);
    return monthDate
      ? monthDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
      : t('milkReports.selectedPeriod');
  }, [activeRange, locale, selectedMonth, selectedPeriod, selectedWeekDate, selectedYear, t]);

  const loadData = useCallback(async ({ showLoader = false } = {}) => {
    if (showLoader) setLoading(true);

    try {
      const [animalsResult, reportsResult] = await Promise.all([
        milkReportService.getCows(),
        milkReportService.getReports(),
      ]);

      const nextAnimals = animalsResult.success ? animalsResult.data || [] : [];
      setAnimals(nextAnimals);
      setAllReports(reportsResult.success ? reportsResult.data || [] : []);
      setReportForm((current) => {
        if (current.report_type === REPORT_TYPES.INDIVIDUAL && !current.cow_id && nextAnimals.length > 0) {
          return { ...current, cow_id: String(nextAnimals[0].id) };
        }
        return current;
      });
    } catch (error) {
      Alert.alert(t('common.error'), error.message || t('milkReports.errors.loadData'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    loadData({ showLoader: true });
  }, [loadData]);

  useEffect(() => {
    const checkHelp = async () => {
      const seen = await AsyncStorage.getItem(HELP_STORAGE_KEY);
      if (!seen) setHelpVisible(true);
    };
    checkHelp();
  }, []);

  useEffect(() => {
    setReportPage(1);
  }, [animalFilter, animalTypeFilter, reportTypeFilter, selectedMonth, selectedPeriod, selectedWeekDate, selectedYear]);

  useEffect(() => {
    if (animalPage > totalAnimalPages) setAnimalPage(totalAnimalPages);
  }, [animalPage, totalAnimalPages]);

  useEffect(() => {
    if (reportPage > totalReportPages) setReportPage(totalReportPages);
  }, [reportPage, totalReportPages]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const closeHelp = async () => {
    await AsyncStorage.setItem(HELP_STORAGE_KEY, '1');
    setHelpVisible(false);
  };

  const updateAnimalForm = (key, value) => {
    setAnimalForm((current) => ({ ...current, [key]: value }));
  };

  const updateReportForm = (key, value) => {
    setReportForm((current) => {
      if (key === 'report_type' && value === REPORT_TYPES.OVERALL) {
        return { ...current, report_type: value, cow_id: '' };
      }
      if (key === 'report_type' && value === REPORT_TYPES.INDIVIDUAL) {
        return { ...current, report_type: value, cow_id: current.cow_id || (animals[0]?.id ? String(animals[0].id) : '') };
      }
      return { ...current, [key]: value };
    });
  };

  const openCreateAnimal = () => {
    setEditingAnimalId(null);
    setAnimalForm(initialAnimalForm);
    setAnimalModalVisible(true);
  };

  const openEditAnimal = (animal) => {
    setEditingAnimalId(animal.id);
    setAnimalForm({
      animal_type: animal.animal_type || ANIMAL_TYPES.COW,
      cow_name: animal.cow_name || '',
      cow_tag: animal.cow_tag || '',
      breed_name: animal.breed_name || '',
      age_years: animal.age_years ? String(animal.age_years) : '',
      notes: animal.notes || '',
    });
    setAnimalModalVisible(true);
  };

  const openCreateReport = () => {
    setEditingReportId(null);
    setReportForm({
      ...initialReportForm,
      report_date: getTodayString(),
      cow_id: animals[0]?.id ? String(animals[0].id) : '',
    });
    setReportModalVisible(true);
  };

  const openEditReport = (report) => {
    setEditingReportId(report.id);
    setReportForm({
      report_type: report.report_type || REPORT_TYPES.INDIVIDUAL,
      report_date: report.report_date || getTodayString(),
      cow_id: report.cow_id ? String(report.cow_id) : '',
      morning_liters: report.morning_liters ? String(report.morning_liters) : '',
      afternoon_liters: report.afternoon_liters ? String(report.afternoon_liters) : '',
      price_per_liter: report.price_per_liter ? String(report.price_per_liter) : '',
      feed_cost: report.feed_cost ? String(report.feed_cost) : '',
      medicine_cost: report.medicine_cost ? String(report.medicine_cost) : '',
      labor_cost: report.labor_cost ? String(report.labor_cost) : '',
      other_cost: report.other_cost ? String(report.other_cost) : '',
      notes: report.notes || '',
    });
    setReportModalVisible(true);
  };

  const handleSaveAnimal = async () => {
    if (!animalForm.cow_name.trim()) {
      Alert.alert(t('common.error'), t('milkReports.errors.animalNameRequired'));
      return;
    }

    setSavingAnimal(true);
    try {
      const payload = {
        ...animalForm,
        cow_name: animalForm.cow_name.trim(),
        cow_tag: animalForm.cow_tag.trim(),
        breed_name: animalForm.breed_name.trim(),
        notes: animalForm.notes.trim(),
      };
      if (editingAnimalId) {
        await milkReportService.updateCow(editingAnimalId, payload);
      } else {
        await milkReportService.createCow(payload);
      }
      setAnimalModalVisible(false);
      await loadData();
      Alert.alert(t('common.success'), editingAnimalId ? t('milkReports.success.animalUpdated') : t('milkReports.success.animalCreated'));
    } catch (error) {
      Alert.alert(t('common.error'), error.message || t('milkReports.errors.saveAnimal'));
    } finally {
      setSavingAnimal(false);
    }
  };

  const handleSaveReport = async () => {
    if (!reportForm.report_date.trim()) {
      Alert.alert(t('common.error'), t('milkReports.errors.reportDateRequired'));
      return;
    }

    if (reportForm.report_type === REPORT_TYPES.INDIVIDUAL && !reportForm.cow_id) {
      Alert.alert(t('common.error'), t('milkReports.errors.selectAnimal'));
      return;
    }

    setSavingReport(true);
    try {
      if (editingReportId) {
        await milkReportService.updateReport(editingReportId, reportForm);
      } else {
        await milkReportService.createReport(reportForm);
      }
      setReportModalVisible(false);
      await loadData();
      Alert.alert(t('common.success'), editingReportId ? t('milkReports.success.reportUpdated') : t('milkReports.success.reportCreated'));
    } catch (error) {
      Alert.alert(t('common.error'), error.message || t('milkReports.errors.saveReport'));
    } finally {
      setSavingReport(false);
    }
  };

  const handleDeleteReport = (report) => {
    Alert.alert(t('milkReports.deleteReportTitle'), t('milkReports.deleteReportMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await milkReportService.deleteReport(report.id);
            await loadData();
          } catch (error) {
            Alert.alert(t('common.error'), error.message || t('milkReports.errors.deleteReport'));
          }
        },
      },
    ]);
  };

  const handleDeleteAnimal = (animal) => {
    Alert.alert(t('milkReports.deleteAnimalTitle'), t('milkReports.deleteAnimalMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await milkReportService.deleteCow(animal.id);
            await loadData();
          } catch (error) {
            Alert.alert(t('common.error'), error.message || t('milkReports.errors.deleteAnimal'));
          }
        },
      },
    ]);
  };

  const handleExportCsv = async () => {
    if (filteredReports.length === 0) {
      Alert.alert(t('milkReports.noDataYet'), t('milkReports.addEntriesToSeeChart'));
      return;
    }

    const csv = buildCsv(filteredReports, t);
    await Share.share({
      title: `milk-reports-${selectedPeriod}-${activeRange?.exportLabel || 'all'}.csv`,
      message: csv,
    });
  };

  const handleExportAnimalsCsv = async () => {
    if (animals.length === 0) {
      Alert.alert(t('milkReports.noAnimals'), t('milkReports.noAnimalsDesc'));
      return;
    }

    await Share.share({
      title: 'milk-report-animals.csv',
      message: buildAnimalCsv(animals, t),
    });
  };

  const renderPeriodButton = (value, label) => (
    <TouchableOpacity
      style={[styles.segmentButton, selectedPeriod === value && styles.segmentButtonActive]}
      onPress={() => setSelectedPeriod(value)}
      activeOpacity={0.85}
    >
      <Text style={[styles.segmentText, selectedPeriod === value && styles.segmentTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderChoice = (active, label, onPress, keyValue) => (
    <TouchableOpacity
      key={keyValue}
      style={[styles.choicePill, active && styles.choicePillActive]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={[styles.choicePillText, active && styles.choicePillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderPagination = (page, totalPages, setPage) => (
    <View style={styles.pagination}>
      <TouchableOpacity
        style={[styles.pageButton, page <= 1 && styles.pageButtonDisabled]}
        disabled={page <= 1}
        onPress={() => setPage((current) => Math.max(1, current - 1))}
      >
        <Text style={styles.pageButtonText}>{t('milkReports.previous')}</Text>
      </TouchableOpacity>
      <Text style={styles.pageText}>{t('milkReports.pageOf', { page, total: totalPages })}</Text>
      <TouchableOpacity
        style={[styles.pageButton, page >= totalPages && styles.pageButtonDisabled]}
        disabled={page >= totalPages}
        onPress={() => setPage((current) => Math.min(totalPages, current + 1))}
      >
        <Text style={styles.pageButtonText}>{t('milkReports.next')}</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <CowLoader message={t('milkReports.loading')} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader
        safeArea={false}
        navigation={navigation}
        title={t('milkReports.title')}
        subtitle={t('milkReports.subtitle')}
        leading={<Ionicons name="water-outline" size={20} color={COLORS.primary} />}
        rightActions={[
          {
            icon: 'help-circle-outline',
            onPress: () => setHelpVisible(true),
            color: COLORS.primary,
            backgroundColor: COLORS.primarySoft,
            accessibilityLabel: 'Open milk reports help',
          },
        ]}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: 32 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        <View style={styles.actionRowTop}>
          <TouchableOpacity style={styles.primaryAction} onPress={openCreateReport} activeOpacity={0.9}>
            <Ionicons name="add" size={20} color={COLORS.surface} />
            <Text style={styles.primaryActionText}>{t('milkReports.addDailyReport')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryAction} onPress={openCreateAnimal} activeOpacity={0.9}>
            <Ionicons name="paw-outline" size={20} color={COLORS.primary} />
            <Text style={styles.secondaryActionText}>{t('milkReports.addAnimal')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>{t('milkReports.show')}</Text>
              <Text style={styles.sectionSubtitle}>{periodLabel}</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.downloadButton} onPress={handleExportCsv} activeOpacity={0.85}>
                <Ionicons name="download-outline" size={17} color={COLORS.primary} />
                <Text style={styles.downloadText}>{t('milkReports.download')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButtonSmall}
                onPress={() => setFiltersExpanded((current) => !current)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={filtersExpanded ? 'chevron-up' : 'options-outline'}
                  size={18}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.segmentRow}>
            {renderPeriodButton(PERIODS.WEEK, t('milkReports.week'))}
            {renderPeriodButton(PERIODS.MONTH, t('milkReports.month'))}
            {renderPeriodButton(PERIODS.YEAR, t('milkReports.year'))}
          </View>

          <View style={styles.inputGrid}>
            {selectedPeriod === PERIODS.WEEK ? (
              <Input label={t('milkReports.weekEnding')} value={selectedWeekDate} onChangeText={setSelectedWeekDate} placeholder="2026-06-19" />
            ) : null}
            {selectedPeriod === PERIODS.MONTH ? (
              <Input label={t('milkReports.month')} value={selectedMonth} onChangeText={setSelectedMonth} placeholder="2026-06" />
            ) : null}
            {selectedPeriod === PERIODS.YEAR ? (
              <Input label={t('milkReports.year')} value={selectedYear} onChangeText={setSelectedYear} keyboardType="number-pad" placeholder="2026" />
            ) : null}
          </View>

          {filtersExpanded ? (
            <>
              <Text style={styles.inputLabel}>{t('milkReports.reportType')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choiceRow}>
                {renderChoice(reportTypeFilter === FILTER_ALL, t('milkReports.allReportTypes'), () => setReportTypeFilter(FILTER_ALL))}
                {renderChoice(reportTypeFilter === REPORT_TYPES.INDIVIDUAL, t('milkReports.individual'), () => setReportTypeFilter(REPORT_TYPES.INDIVIDUAL))}
                {renderChoice(reportTypeFilter === REPORT_TYPES.OVERALL, t('milkReports.overall'), () => setReportTypeFilter(REPORT_TYPES.OVERALL))}
              </ScrollView>

              <Text style={styles.inputLabel}>{t('milkReports.animalType')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choiceRow}>
                {renderChoice(animalTypeFilter === FILTER_ALL, t('milkReports.allAnimals'), () => setAnimalTypeFilter(FILTER_ALL))}
                {renderChoice(animalTypeFilter === ANIMAL_TYPES.COW, t('animalTypes.cow'), () => setAnimalTypeFilter(ANIMAL_TYPES.COW))}
                {renderChoice(animalTypeFilter === ANIMAL_TYPES.BUFFALO, t('animalTypes.buffalo'), () => setAnimalTypeFilter(ANIMAL_TYPES.BUFFALO))}
              </ScrollView>

              <Text style={styles.inputLabel}>{t('milkReports.chooseAnimal')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choiceRow}>
                {renderChoice(animalFilter === FILTER_ALL, t('milkReports.allAnimals'), () => setAnimalFilter(FILTER_ALL))}
                {animals.map((animal) => renderChoice(
                  String(animalFilter) === String(animal.id),
                  animal.cow_name,
                  () => setAnimalFilter(String(animal.id)),
                  `filter-animal-${animal.id}`
                ))}
              </ScrollView>
            </>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsGrid}>
          <StatCard label={t('milkReports.totalMilk')} value={formatLiters(stats.total_liters)} helper={t('milkReports.entriesCount', { count: stats.total_reports })} />
          <StatCard label={t('milkReports.moneyIn')} value={formatCurrency(stats.total_revenue)} helper={t('milkReports.fromMilkSelling')} />
          <StatCard label={t('milkReports.moneyOut')} value={formatCurrency(stats.total_cost)} helper={t('milkReports.costHint')} />
          <StatCard
            label={t('milkReports.finalResult')}
            value={formatCurrency(stats.net_profit_or_loss)}
            helper={t('milkReports.profitLossCount', { profit: stats.profitable_days, loss: stats.loss_days })}
            valueStyle={stats.net_profit_or_loss >= 0 ? styles.profitText : styles.lossText}
          />
        </ScrollView>

        <CollapsibleSection
          title={t('milkReports.dashboard', { defaultValue: 'Dashboard & analysis' })}
          subtitle={periodLabel}
          expanded={analysisExpanded}
          onToggle={() => setAnalysisExpanded((current) => !current)}
        >
        <View style={styles.chartSummaryGrid}>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t('milkReports.easyChart')}</Text>
            <Text style={styles.sectionSubtitle}>
              {chartMetric === CHART_METRICS.PROFIT ? t('milkReports.chartProfitHelp') : t('milkReports.chartSimpleHelp')}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choiceRow}>
              {renderChoice(chartMetric === CHART_METRICS.LITERS, t('milkReports.chartMilk'), () => setChartMetric(CHART_METRICS.LITERS))}
              {renderChoice(chartMetric === CHART_METRICS.PROFIT, t('milkReports.chartProfitLoss'), () => setChartMetric(CHART_METRICS.PROFIT))}
              {renderChoice(chartMetric === CHART_METRICS.REVENUE, t('milkReports.chartMoneyIn'), () => setChartMetric(CHART_METRICS.REVENUE))}
            </ScrollView>

            {chartData.length === 0 ? (
              <View style={styles.emptyChart}>
                <Ionicons name="bar-chart-outline" size={34} color={COLORS.borderStrong} />
                <Text style={styles.emptyTitle}>{t('milkReports.noDataYet')}</Text>
                <Text style={styles.emptySubtitle}>{t('milkReports.addEntriesToSeeChart')}</Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartScroll}>
                {chartData.map((point) => {
                  const isNegative = toNumber(point.value) < 0;
                  const barHeight = 28 + (Math.abs(toNumber(point.value)) / maxChartValue) * 150;
                  return (
                    <View key={point.key} style={styles.chartPoint}>
                      <View style={styles.chartBarWrap}>
                        <View
                          style={[
                            styles.chartBar,
                            {
                              height: barHeight,
                              backgroundColor: isNegative ? COLORS.error : chartMetric === CHART_METRICS.REVENUE ? COLORS.info : COLORS.primary,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.chartLabel} numberOfLines={1}>{point.label}</Text>
                      <Text style={styles.chartValue} numberOfLines={1}>
                        {chartMetric === CHART_METRICS.LITERS ? formatLiters(point.value) : formatCurrency(point.value)}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t('milkReports.easySummary')}</Text>
            <View style={[styles.resultBox, stats.net_profit_or_loss >= 0 ? styles.resultProfit : styles.resultLoss]}>
              <Text style={styles.resultLabel}>{t('milkReports.thisTime')}</Text>
              <Text style={[styles.resultTitle, stats.net_profit_or_loss >= 0 ? styles.profitText : styles.lossText]}>
                {stats.net_profit_or_loss >= 0 ? t('milkReports.youAreInProfit') : t('milkReports.youAreInLoss')}
              </Text>
              <Text style={styles.resultAmount}>{formatCurrencyPrecise(stats.net_profit_or_loss)}</Text>
            </View>
            <SummaryRow label={t('milkReports.allAnimalTotal')} value={formatLiters(stats.all_animal_total.total_liters)} helper={formatCurrency(stats.all_animal_total.profit_or_loss)} />
            <SummaryRow label={t('milkReports.overallHerdTotal')} value={formatLiters(stats.overall_herd_total.total_liters)} helper={formatCurrency(stats.overall_herd_total.profit_or_loss)} />
            <SummaryRow
              label={t('milkReports.bestCow')}
              value={stats.best_cow?.cow_name || '-'}
              helper={stats.best_cow ? `${formatCurrency(stats.best_cow.profit_or_loss)} - ${formatLiters(stats.best_cow.total_liters)}` : t('milkReports.noDataYet')}
            />
          </View>
        </View>
        </CollapsibleSection>

        <CollapsibleSection
          title={t('milkReports.myAnimals')}
          subtitle={t('milkReports.myAnimalsDesc')}
          countLabel={t('milkReports.animalsCount', { count: animals.length })}
          expanded={animalsExpanded}
          onToggle={() => setAnimalsExpanded((current) => !current)}
          rightAction={(
            <TouchableOpacity style={styles.smallExportButton} onPress={handleExportAnimalsCsv}>
              <Ionicons name="download-outline" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        >
          {animals.length === 0 ? (
            <EmptyState icon="paw-outline" title={t('milkReports.noAnimals')} subtitle={t('milkReports.noAnimalsDesc')} />
          ) : (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.table}>
                  <View style={styles.tableRowHeader}>
                    <Text style={[styles.tableHeaderCell, styles.cellType]}>{t('milkReports.animalType')}</Text>
                    <Text style={[styles.tableHeaderCell, styles.cellName]}>{t('milkReports.animal')}</Text>
                    <Text style={[styles.tableHeaderCell, styles.cellTag]}>{t('milkReports.tag')}</Text>
                    <Text style={[styles.tableHeaderCell, styles.cellAction]}>{t('milkReports.action')}</Text>
                  </View>
                  {paginatedAnimals.map((animal) => (
                    <View key={animal.id} style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.cellType]}>{t(`animalTypes.${animal.animal_type || ANIMAL_TYPES.COW}`)}</Text>
                      <Text style={[styles.tableCellStrong, styles.cellName]}>{animal.cow_name}</Text>
                      <Text style={[styles.tableCell, styles.cellTag]}>{animal.cow_tag || '-'}</Text>
                      <View style={[styles.tableActions, styles.cellAction]}>
                        <TouchableOpacity style={styles.editButton} onPress={() => openEditAnimal(animal)}>
                          <Text style={styles.editButtonText}>{t('common.edit')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteAnimal(animal)}>
                          <Text style={styles.deleteButtonText}>{t('common.delete')}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
              {renderPagination(animalPage, totalAnimalPages, setAnimalPage)}
            </>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title={t('milkReports.dailyReports')}
          subtitle={t('milkReports.entriesFor', { period: periodLabel })}
          countLabel={t('milkReports.totalReports', { count: filteredReports.length })}
          expanded={reportsExpanded}
          onToggle={() => setReportsExpanded((current) => !current)}
          rightAction={(
            <TouchableOpacity style={styles.smallExportButton} onPress={handleExportCsv}>
              <Ionicons name="download-outline" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        >
          {filteredReports.length === 0 ? (
            <EmptyState icon="water-outline" title={t('milkReports.noReports')} subtitle={t('milkReports.noReportsDesc')} />
          ) : (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.reportTable}>
                  <View style={styles.tableRowHeader}>
                    <Text style={[styles.tableHeaderCell, styles.cellDate]}>{t('milkReports.date')}</Text>
                    <Text style={[styles.tableHeaderCell, styles.cellTypeWide]}>{t('milkReports.reportType')}</Text>
                    <Text style={[styles.tableHeaderCell, styles.cellName]}>{t('milkReports.animal')}</Text>
                    <Text style={[styles.tableHeaderCell, styles.cellMilk]}>{t('milkReports.totalMilk')}</Text>
                    <Text style={[styles.tableHeaderCell, styles.cellMoney]}>{t('milkReports.moneyIn')}</Text>
                    <Text style={[styles.tableHeaderCell, styles.cellMoney]}>{t('milkReports.moneyOut')}</Text>
                    <Text style={[styles.tableHeaderCell, styles.cellMoney]}>{t('milkReports.result')}</Text>
                    <Text style={[styles.tableHeaderCell, styles.cellAction]}>{t('milkReports.action')}</Text>
                  </View>
                  {paginatedReports.map((report) => {
                    const isProfit = toNumber(report.profit_or_loss) >= 0;
                    return (
                      <View key={report.id} style={styles.tableRow}>
                        <Text style={[styles.tableCell, styles.cellDate]}>{formatDate(report.report_date, locale)}</Text>
                        <Text style={[styles.tableCell, styles.cellTypeWide]}>
                          {report.report_type === REPORT_TYPES.OVERALL ? t('milkReports.overall') : t('milkReports.individual')}
                        </Text>
                        <Text style={[styles.tableCellStrong, styles.cellName]}>
                          {report.report_type === REPORT_TYPES.OVERALL ? t('milkReports.overallHerd') : (report.cow_name || '-')}
                        </Text>
                        <Text style={[styles.tableCellStrong, styles.cellMilk]}>
                          {formatLiters(report.total_liters)}
                          {'\n'}
                          <Text style={styles.tableSubText}>M {formatLiters(report.morning_liters)} | A {formatLiters(report.afternoon_liters)}</Text>
                        </Text>
                        <Text style={[styles.tableCellStrong, styles.cellMoney]}>{formatCurrency(report.total_revenue)}</Text>
                        <Text style={[styles.tableCellStrong, styles.cellMoney]}>{formatCurrency(report.total_cost)}</Text>
                        <Text style={[styles.tableCellStrong, styles.cellMoney, isProfit ? styles.profitText : styles.lossText]}>
                          {formatCurrency(report.profit_or_loss)}
                        </Text>
                        <View style={[styles.tableActions, styles.cellAction]}>
                          <TouchableOpacity style={styles.editButton} onPress={() => openEditReport(report)}>
                            <Text style={styles.editButtonText}>{t('common.edit')}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteReport(report)}>
                            <Text style={styles.deleteButtonText}>{t('common.delete')}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
              {renderPagination(reportPage, totalReportPages, setReportPage)}
            </>
          )}
        </CollapsibleSection>
      </ScrollView>

      <FeatureHelpModal
        visible={helpVisible}
        onClose={closeHelp}
        title={milkReportsHelp?.localized?.title || t('milkReports.howToUseTitle')}
        imageSource={milkReportsHelp?.image}
        helpContent={milkReportsHelp?.localized}
        t={t}
      />
      <AnimalModal
        visible={animalModalVisible}
        onClose={() => setAnimalModalVisible(false)}
        animalForm={animalForm}
        updateAnimalForm={updateAnimalForm}
        onSave={handleSaveAnimal}
        saving={savingAnimal}
        editing={Boolean(editingAnimalId)}
        renderChoice={renderChoice}
        t={t}
      />
      <ReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        reportForm={reportForm}
        updateReportForm={updateReportForm}
        animals={animals}
        selectedAnimal={selectedAnimal}
        preview={preview}
        onSave={handleSaveReport}
        saving={savingReport}
        editing={Boolean(editingReportId)}
        renderChoice={renderChoice}
        t={t}
      />
    </SafeAreaView>
  );
};

const StatCard = ({ label, value, helper, valueStyle }) => (
  <View style={styles.statCard}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, valueStyle]}>{value}</Text>
    <Text style={styles.statHelper}>{helper}</Text>
  </View>
);

const SummaryRow = ({ label, value, helper }) => (
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={styles.summaryValue}>{value}</Text>
    <Text style={styles.summaryHelper}>{helper}</Text>
  </View>
);

const EmptyState = ({ icon, title, subtitle }) => (
  <View style={styles.emptyState}>
    <Ionicons name={icon} size={34} color={COLORS.borderStrong} />
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptySubtitle}>{subtitle}</Text>
  </View>
);

const CollapsibleSection = ({
  title,
  subtitle,
  countLabel,
  expanded,
  onToggle,
  rightAction,
  children,
}) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      <TouchableOpacity style={styles.sectionHeaderToggle} onPress={onToggle} activeOpacity={0.85}>
        <View style={styles.sectionHeaderText}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={COLORS.primary}
        />
      </TouchableOpacity>
      <View style={styles.headerActions}>
        {countLabel ? <Text style={styles.countBadge}>{countLabel}</Text> : null}
        {rightAction}
      </View>
    </View>
    {expanded ? <View style={styles.collapsibleBody}>{children}</View> : null}
  </View>
);

const AnimalModal = ({ visible, onClose, animalForm, updateAnimalForm, onSave, saving, editing, renderChoice, t }) => (
  <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
      <View style={styles.modalCard}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{editing ? t('milkReports.editAnimal') : t('milkReports.addAnimal')}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.inputLabel}>{t('milkReports.animalType')}</Text>
          <View style={styles.choiceRow}>
            {renderChoice(animalForm.animal_type === ANIMAL_TYPES.COW, t('animalTypes.cow'), () => updateAnimalForm('animal_type', ANIMAL_TYPES.COW))}
            {renderChoice(animalForm.animal_type === ANIMAL_TYPES.BUFFALO, t('animalTypes.buffalo'), () => updateAnimalForm('animal_type', ANIMAL_TYPES.BUFFALO))}
          </View>
          <Input label={t('milkReports.animalName')} value={animalForm.cow_name} onChangeText={(value) => updateAnimalForm('cow_name', value)} placeholder={t('milkReports.animalNamePlaceholder')} />
          <Input label={t('milkReports.tag')} value={animalForm.cow_tag} onChangeText={(value) => updateAnimalForm('cow_tag', value)} placeholder={t('milkReports.tagPlaceholder')} />
          <Input label={t('milkReports.breed')} value={animalForm.breed_name} onChangeText={(value) => updateAnimalForm('breed_name', value)} placeholder={t('milkReports.breedPlaceholder')} />
          <Input label={t('milkReports.age')} value={animalForm.age_years} onChangeText={(value) => updateAnimalForm('age_years', value)} keyboardType="decimal-pad" placeholder="3" />
          <Input label={t('milkReports.notes')} value={animalForm.notes} onChangeText={(value) => updateAnimalForm('notes', value)} placeholder={t('milkReports.notesPlaceholder')} multiline />
          <TouchableOpacity style={styles.modalSubmit} onPress={onSave} disabled={saving}>
            {saving ? <ActivityIndicator color={COLORS.surface} /> : <Text style={styles.modalSubmitText}>{editing ? t('milkReports.updateAnimal') : t('milkReports.saveAnimal')}</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  </Modal>
);

const ReportModal = ({ visible, onClose, reportForm, updateReportForm, animals, selectedAnimal, preview, onSave, saving, editing, renderChoice, t }) => (
  <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
      <View style={styles.modalCard}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{editing ? t('milkReports.editReport') : t('milkReports.addDailyReport')}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.inputLabel}>{t('milkReports.reportType')}</Text>
          <View style={styles.choiceRow}>
            {renderChoice(reportForm.report_type === REPORT_TYPES.INDIVIDUAL, t('milkReports.individual'), () => updateReportForm('report_type', REPORT_TYPES.INDIVIDUAL))}
            {renderChoice(reportForm.report_type === REPORT_TYPES.OVERALL, t('milkReports.overall'), () => updateReportForm('report_type', REPORT_TYPES.OVERALL))}
          </View>

          <Input label={t('milkReports.reportDate')} value={reportForm.report_date} onChangeText={(value) => updateReportForm('report_date', value)} placeholder="2026-06-19" />

          {reportForm.report_type === REPORT_TYPES.INDIVIDUAL ? (
            <>
              <Text style={styles.inputLabel}>{t('milkReports.selectAnimal')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choiceRow}>
                {animals.map((animal) => renderChoice(
                  String(reportForm.cow_id) === String(animal.id),
                  animal.cow_name,
                  () => updateReportForm('cow_id', String(animal.id)),
                  `report-animal-${animal.id}`
                ))}
              </ScrollView>
              {selectedAnimal ? (
                <Text style={styles.selectedHelp}>
                  {t(`animalTypes.${selectedAnimal.animal_type || ANIMAL_TYPES.COW}`)}
                  {selectedAnimal.cow_tag ? ` - ${t('milkReports.tag')}: ${selectedAnimal.cow_tag}` : ''}
                </Text>
              ) : null}
            </>
          ) : (
            <View style={styles.overallNotice}>
              <Ionicons name="information-circle-outline" size={18} color={COLORS.warning} />
              <Text style={styles.overallNoticeText}>{t('milkReports.overallHelp')}</Text>
            </View>
          )}

          <View style={styles.twoColumn}>
            <Input label={t('milkReports.morningLiters')} value={reportForm.morning_liters} onChangeText={(value) => updateReportForm('morning_liters', value)} keyboardType="decimal-pad" placeholder="5" containerStyle={styles.flexInput} />
            <Input label={t('milkReports.eveningLiters')} value={reportForm.afternoon_liters} onChangeText={(value) => updateReportForm('afternoon_liters', value)} keyboardType="decimal-pad" placeholder="4" containerStyle={styles.flexInput} />
          </View>
          <Input label={t('milkReports.pricePerLiter')} value={reportForm.price_per_liter} onChangeText={(value) => updateReportForm('price_per_liter', value)} keyboardType="decimal-pad" placeholder="40" />
          <View style={styles.twoColumn}>
            <Input label={t('milkReports.feedCost')} value={reportForm.feed_cost} onChangeText={(value) => updateReportForm('feed_cost', value)} keyboardType="decimal-pad" placeholder="120" containerStyle={styles.flexInput} />
            <Input label={t('milkReports.medicineCost')} value={reportForm.medicine_cost} onChangeText={(value) => updateReportForm('medicine_cost', value)} keyboardType="decimal-pad" placeholder="0" containerStyle={styles.flexInput} />
          </View>
          <View style={styles.twoColumn}>
            <Input label={t('milkReports.laborCost')} value={reportForm.labor_cost} onChangeText={(value) => updateReportForm('labor_cost', value)} keyboardType="decimal-pad" placeholder="0" containerStyle={styles.flexInput} />
            <Input label={t('milkReports.otherCost')} value={reportForm.other_cost} onChangeText={(value) => updateReportForm('other_cost', value)} keyboardType="decimal-pad" placeholder="0" containerStyle={styles.flexInput} />
          </View>
          <Input label={t('milkReports.notes')} value={reportForm.notes} onChangeText={(value) => updateReportForm('notes', value)} placeholder={t('milkReports.notesPlaceholder')} multiline />
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>{t('milkReports.liveSummary')}</Text>
            <Text style={styles.previewText}>{t('milkReports.totalMilk')}: {formatLiters(preview.totalLiters)}</Text>
            <Text style={styles.previewText}>{t('milkReports.revenue')}: {formatCurrency(preview.revenue)}</Text>
            <Text style={styles.previewText}>{t('milkReports.cost')}: {formatCurrency(preview.cost)}</Text>
            <Text style={[styles.previewText, preview.profit >= 0 ? styles.profitText : styles.lossText]}>
              {t('milkReports.result')}: {formatCurrency(preview.profit)}
            </Text>
          </View>
          <TouchableOpacity style={styles.modalSubmit} onPress={onSave} disabled={saving}>
            {saving ? <ActivityIndicator color={COLORS.surface} /> : <Text style={styles.modalSubmitText}>{editing ? t('milkReports.updateReport') : t('milkReports.saveReport')}</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  </Modal>
);

const Input = ({ label, containerStyle, multiline = false, ...props }) => (
  <View style={[styles.inputWrap, containerStyle]}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      style={[styles.input, multiline && styles.textArea]}
      placeholderTextColor={COLORS.borderStrong}
      multiline={multiline}
      {...props}
    />
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  loadingText: { marginTop: 12, color: COLORS.textMuted, fontWeight: '600' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceAlt,
  },
  headerTextWrap: { flex: 1 },
  eyebrow: { fontSize: 11, fontWeight: '900', color: COLORS.primary, textTransform: 'uppercase' },
  title: { marginTop: 2, fontSize: 22, fontWeight: '900', color: COLORS.text },
  subtitle: { marginTop: 2, fontSize: 13, color: COLORS.textMuted },
  scrollView: { flex: 1 },
  content: { padding: 14, gap: 14 },
  filterCard: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionCard: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  sectionHeaderToggle: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  sectionHeaderText: { flex: 1, minWidth: 0 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text },
  sectionSubtitle: { marginTop: 3, fontSize: 13, color: COLORS.textMuted },
  segmentRow: {
    flexDirection: 'row',
    padding: 4,
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceAlt,
  },
  segmentButton: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12 },
  segmentButtonActive: { backgroundColor: COLORS.surface },
  segmentText: { color: COLORS.textMuted, fontWeight: '800' },
  segmentTextActive: { color: COLORS.text },
  inputGrid: { marginTop: 12 },
  choiceRow: { flexDirection: 'row', gap: 8, paddingVertical: 8 },
  choicePill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  choicePillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  choicePillText: { color: COLORS.textMuted, fontWeight: '800' },
  choicePillTextActive: { color: COLORS.surface },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: COLORS.primarySoft,
  },
  downloadText: { color: COLORS.primary, fontWeight: '900' },
  iconButtonSmall: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primarySoft,
  },
  statsGrid: { flexDirection: 'row', gap: 10, paddingRight: 2 },
  statCard: {
    width: 172,
    padding: 14,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '800' },
  statValue: { marginTop: 8, fontSize: 20, color: COLORS.text, fontWeight: '900' },
  statHelper: { marginTop: 6, fontSize: 12, color: COLORS.textMuted },
  actionRowTop: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionRow: { flexDirection: 'row', gap: 10 },
  primaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
  },
  primaryActionText: { color: COLORS.surface, fontSize: 14, fontWeight: '900' },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  secondaryActionText: { color: COLORS.primary, fontSize: 14, fontWeight: '900' },
  chartSummaryGrid: { gap: 14 },
  collapsibleBody: { marginTop: 14 },
  emptyChart: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
    padding: 16,
  },
  chartScroll: { alignItems: 'flex-end', gap: 14, minHeight: 240, paddingTop: 14, paddingBottom: 4 },
  chartPoint: { width: 74, alignItems: 'center' },
  chartBarWrap: { height: 180, justifyContent: 'flex-end', alignItems: 'center' },
  chartBar: { width: 48, borderTopLeftRadius: 10, borderTopRightRadius: 10 },
  chartLabel: { marginTop: 8, fontSize: 11, color: COLORS.textMuted, fontWeight: '700' },
  chartValue: { marginTop: 3, fontSize: 11, color: COLORS.text, fontWeight: '900' },
  resultBox: { padding: 14, borderRadius: 16, borderWidth: 1, marginTop: 12 },
  resultProfit: { backgroundColor: COLORS.successSoft, borderColor: COLORS.success },
  resultLoss: { backgroundColor: COLORS.errorSoft, borderColor: COLORS.error },
  resultLabel: { color: COLORS.text, fontWeight: '800' },
  resultTitle: { marginTop: 6, fontSize: 19, fontWeight: '900' },
  resultAmount: { marginTop: 4, color: COLORS.textMuted, fontWeight: '700' },
  summaryRow: {
    marginTop: 10,
    padding: 13,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryLabel: { color: COLORS.text, fontWeight: '800' },
  summaryValue: { marginTop: 6, color: COLORS.text, fontSize: 19, fontWeight: '900' },
  summaryHelper: { marginTop: 4, color: COLORS.primary, fontSize: 12, fontWeight: '800' },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    overflow: 'hidden',
    color: COLORS.text,
    backgroundColor: COLORS.surfaceAlt,
    fontWeight: '900',
    fontSize: 12,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  smallExportButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primarySoft,
  },
  emptyState: { alignItems: 'center', padding: 28 },
  emptyTitle: { marginTop: 10, color: COLORS.text, fontSize: 16, fontWeight: '900', textAlign: 'center' },
  emptySubtitle: { marginTop: 5, color: COLORS.textMuted, textAlign: 'center', lineHeight: 19 },
  table: { minWidth: 650, marginTop: 14, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, overflow: 'hidden' },
  reportTable: { minWidth: 1040, marginTop: 14, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, overflow: 'hidden' },
  tableRowHeader: { flexDirection: 'row', backgroundColor: COLORS.surfaceAlt, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tableRow: { flexDirection: 'row', alignItems: 'center', minHeight: 68, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tableHeaderCell: { padding: 12, color: COLORS.textMuted, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  tableCell: { padding: 12, color: COLORS.textMuted, fontSize: 13, fontWeight: '700' },
  tableCellStrong: { padding: 12, color: COLORS.text, fontSize: 14, fontWeight: '900' },
  tableSubText: { color: COLORS.textMuted, fontSize: 11, fontWeight: '600' },
  cellType: { width: 120 },
  cellName: { width: 160 },
  cellTag: { width: 130 },
  cellAction: { width: 210 },
  cellDate: { width: 120 },
  cellTypeWide: { width: 150 },
  cellMilk: { width: 150 },
  cellMoney: { width: 140 },
  tableActions: { flexDirection: 'row', gap: 8, paddingHorizontal: 12 },
  editButton: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 10, backgroundColor: COLORS.infoSoft, borderWidth: 1, borderColor: COLORS.info },
  editButtonText: { color: COLORS.info, fontWeight: '900' },
  deleteButton: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 10, backgroundColor: COLORS.errorSoft, borderWidth: 1, borderColor: COLORS.error },
  deleteButtonText: { color: COLORS.error, fontWeight: '900' },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 12 },
  pageButton: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border },
  pageButtonDisabled: { opacity: 0.45 },
  pageButtonText: { color: COLORS.text, fontWeight: '800' },
  pageText: { color: COLORS.text, fontWeight: '900' },
  inputWrap: { marginTop: 12 },
  inputLabel: { marginTop: 12, marginBottom: 7, fontSize: 13, fontWeight: '900', color: COLORS.text },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
    fontWeight: '700',
  },
  textArea: { minHeight: 92, paddingTop: 12, textAlignVertical: 'top' },
  twoColumn: { flexDirection: 'row', gap: 10 },
  flexInput: { flex: 1 },
  selectedHelp: { marginTop: 4, color: COLORS.textMuted, fontWeight: '700' },
  overallNotice: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 12, backgroundColor: COLORS.warningSoft, marginTop: 8 },
  overallNoticeText: { flex: 1, color: COLORS.text, fontWeight: '700' },
  previewCard: { marginTop: 14, padding: 13, borderRadius: 14, backgroundColor: COLORS.primarySoft, borderWidth: 1, borderColor: COLORS.secondary },
  previewTitle: { color: COLORS.text, fontWeight: '900', marginBottom: 6 },
  previewText: { color: COLORS.text, fontWeight: '700', marginTop: 3 },
  profitText: { color: COLORS.success },
  lossText: { color: COLORS.error },
  helpOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(44,44,42,0.45)', padding: 20 },
  helpCard: { width: '100%', maxWidth: 420, padding: 16, borderRadius: 22, backgroundColor: COLORS.surface },
  helpStep: { flexDirection: 'row', gap: 12, marginTop: 14 },
  helpIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primarySoft },
  helpTextWrap: { flex: 1 },
  helpTitle: { color: COLORS.text, fontWeight: '900', fontSize: 15 },
  helpBody: { marginTop: 3, color: COLORS.textMuted, lineHeight: 19 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(44,44,42,0.45)' },
  modalCard: { maxHeight: '88%', padding: 16, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: COLORS.background },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  modalTitle: { flex: 1, color: COLORS.text, fontSize: 20, fontWeight: '900' },
  modalSubmit: { marginTop: 18, minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: COLORS.primary },
  modalSubmitText: { color: COLORS.surface, fontWeight: '900', fontSize: 16 },
});

export default MilkReportsScreen;
