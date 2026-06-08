import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { FullPageLoader } from './AppLoader';
import { milkReportService } from '../services/api';
import { localizeApiMessage } from '../utils/localizeApiMessage';

const getTodayString = () => new Date().toISOString().split('T')[0];
const getCurrentMonthString = () => new Date().toISOString().slice(0, 7);
const getCurrentYearString = () => `${new Date().getFullYear()}`;
const getLocaleFromLanguage = (language) => {
  if (language === 'mr') return 'mr-IN';
  if (language === 'hi') return 'hi-IN';
  return 'en-IN';
};
const REPORT_TYPES = {
  INDIVIDUAL: 'individual',
  OVERALL: 'overall'
};
const REPORT_TYPE_FILTERS = {
  ALL: 'all',
  INDIVIDUAL: 'individual',
  OVERALL: 'overall'
};
const ANIMAL_TYPES = {
  COW: 'cow',
  BUFFALO: 'buffalo'
};
const ANIMAL_TYPE_FILTERS = {
  ALL: 'all',
  COW: 'cow',
  BUFFALO: 'buffalo'
};

const initialCowFormData = () => ({
  animal_type: ANIMAL_TYPES.COW,
  cow_name: '',
  cow_tag: ''
});

const initialReportFormData = () => ({
  report_date: getTodayString(),
  report_type: REPORT_TYPES.INDIVIDUAL,
  cow_id: '',
  morning_liters: '',
  afternoon_liters: '',
  price_per_liter: '',
  feed_cost: '',
  medicine_cost: '',
  labor_cost: '',
  other_cost: '',
  notes: ''
});

const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})}`;

const formatLiters = (value) => `${Number(value || 0).toLocaleString('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})} L`;

const formatDate = (value, locale = 'en-IN') => {
  if (!value) return '';

  return new Date(value).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const toNumber = (value) => {
  const parsed = Number.parseFloat(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getStatusStyles = (status) => {
  if (status === 'profit') {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (status === 'loss') {
    return 'bg-rose-100 text-rose-700';
  }

  return 'bg-amber-100 text-amber-700';
};

const getMonthRange = (monthValue) => {
  const [yearText, monthText] = (monthValue || '').split('-');
  const year = Number.parseInt(yearText, 10);
  const month = Number.parseInt(monthText, 10);

  if (!year || !month) {
    return null;
  }

  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0));

  return {
    year,
    month,
    fromDate: startDate.toISOString().slice(0, 10),
    toDate: endDate.toISOString().slice(0, 10)
  };
};

const parseDateString = (value) => {
  if (!value) {
    return null;
  }

  const [yearText, monthText, dayText] = value.split('-');
  const year = Number.parseInt(yearText, 10);
  const month = Number.parseInt(monthText, 10);
  const day = Number.parseInt(dayText, 10);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, day));
};

const addUtcDays = (date, days) => {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
};

const getWeekRange = (dateValue) => {
  const anchorDate = parseDateString(dateValue || getTodayString());

  if (!anchorDate) {
    return null;
  }

  const startDate = addUtcDays(anchorDate, -6);

  return {
    fromDate: startDate.toISOString().slice(0, 10),
    toDate: anchorDate.toISOString().slice(0, 10),
    exportLabel: anchorDate.toISOString().slice(0, 10)
  };
};

const getYearRange = (yearValue) => {
  const year = Number.parseInt(yearValue, 10);

  if (!year) {
    return null;
  }

  return {
    fromDate: `${year}-01-01`,
    toDate: `${year}-12-31`,
    exportLabel: `${year}`
  };
};

const getPeriodRange = ({ period, weekDate, monthValue, yearValue }) => {
  if (period === 'week') {
    return getWeekRange(weekDate);
  }

  if (period === 'year') {
    return getYearRange(yearValue);
  }

  const monthRange = getMonthRange(monthValue);

  if (!monthRange) {
    return null;
  }

  return {
    ...monthRange,
    exportLabel: monthValue
  };
};

const getMonthShortLabel = (monthIndex, locale = 'en-IN') => (
  new Date(Date.UTC(2026, monthIndex, 1)).toLocaleDateString(locale, { month: 'short' })
);

const buildPeriodStats = (reports) => {
  const stats = {
    total_reports: reports.length,
    total_liters: 0,
    total_revenue: 0,
    total_cost: 0,
    net_profit_or_loss: 0,
    profitable_days: 0,
    loss_days: 0,
    break_even_days: 0,
    best_day: null,
    worst_day: null,
    best_cow: null,
    best_buffalo: null,
    unique_cows: new Set(),
    individual_reports_count: 0,
    overall_reports_count: 0,
    cow_reports_count: 0,
    buffalo_reports_count: 0,
    all_animal_total: {
      total_liters: 0,
      profit_or_loss: 0,
      report_count: 0
    },
    overall_herd_total: {
      total_liters: 0,
      profit_or_loss: 0,
      report_count: 0
    },
    average_liters_per_report: 0,
    average_profit_per_report: 0
  };

  const cowTotals = new Map();
  const buffaloTotals = new Map();

  reports.forEach((report) => {
    const liters = toNumber(report.total_liters);
    const revenue = toNumber(report.total_revenue);
    const cost = toNumber(report.total_cost);
    const profit = toNumber(report.profit_or_loss);
    const isIndividualReport = report.report_type !== REPORT_TYPES.OVERALL;
    const animalType = report.animal_type || ANIMAL_TYPES.COW;
    const cowKey = report.cow_id || `${report.cow_name}-${report.cow_tag || 'untagged'}`;

    stats.total_liters += liters;
    stats.total_revenue += revenue;
    stats.total_cost += cost;
    stats.net_profit_or_loss += profit;

    if (isIndividualReport) {
      stats.individual_reports_count += 1;
      stats.all_animal_total.total_liters += liters;
      stats.all_animal_total.profit_or_loss += profit;
      stats.all_animal_total.report_count += 1;
      stats.unique_cows.add(report.cow_name || cowKey);

      if (animalType === ANIMAL_TYPES.BUFFALO) {
        stats.buffalo_reports_count += 1;
      } else {
        stats.cow_reports_count += 1;
      }
    } else {
      stats.overall_reports_count += 1;
      stats.overall_herd_total.total_liters += liters;
      stats.overall_herd_total.profit_or_loss += profit;
      stats.overall_herd_total.report_count += 1;
    }

    if (profit > 0) {
      stats.profitable_days += 1;
    } else if (profit < 0) {
      stats.loss_days += 1;
    } else {
      stats.break_even_days += 1;
    }

    if (!stats.best_day || profit > toNumber(stats.best_day.profit_or_loss)) {
      stats.best_day = report;
    }

    if (!stats.worst_day || profit < toNumber(stats.worst_day.profit_or_loss)) {
      stats.worst_day = report;
    }

    const animalTotals = animalType === ANIMAL_TYPES.BUFFALO ? buffaloTotals : cowTotals;

    if (isIndividualReport && !animalTotals.has(cowKey)) {
      animalTotals.set(cowKey, {
        animal_type: animalType,
        cow_name: report.cow_name,
        cow_tag: report.cow_tag,
        total_liters: 0,
        profit_or_loss: 0
      });
    }

    if (isIndividualReport) {
      const cowSummary = animalTotals.get(cowKey);
      cowSummary.total_liters += liters;
      cowSummary.profit_or_loss += profit;
    }
  });

  const cowsByProfit = Array.from(cowTotals.values()).sort((a, b) => b.profit_or_loss - a.profit_or_loss);
  const buffaloByProfit = Array.from(buffaloTotals.values()).sort((a, b) => b.profit_or_loss - a.profit_or_loss);

  stats.best_cow = cowsByProfit[0] || null;
  stats.best_buffalo = buffaloByProfit[0] || null;
  stats.total_liters = Number(stats.total_liters.toFixed(2));
  stats.total_revenue = Number(stats.total_revenue.toFixed(2));
  stats.total_cost = Number(stats.total_cost.toFixed(2));
  stats.net_profit_or_loss = Number(stats.net_profit_or_loss.toFixed(2));
  stats.all_animal_total.total_liters = Number(stats.all_animal_total.total_liters.toFixed(2));
  stats.all_animal_total.profit_or_loss = Number(stats.all_animal_total.profit_or_loss.toFixed(2));
  stats.overall_herd_total.total_liters = Number(stats.overall_herd_total.total_liters.toFixed(2));
  stats.overall_herd_total.profit_or_loss = Number(stats.overall_herd_total.profit_or_loss.toFixed(2));
  stats.average_liters_per_report = reports.length ? Number((stats.total_liters / reports.length).toFixed(2)) : 0;
  stats.average_profit_per_report = reports.length ? Number((stats.net_profit_or_loss / reports.length).toFixed(2)) : 0;
  stats.unique_cows_count = stats.unique_cows.size;
  stats.has_only_individual_reports = reports.length > 0 && stats.overall_reports_count === 0;
  stats.has_only_overall_reports = reports.length > 0 && stats.individual_reports_count === 0;
  stats.has_mixed_report_types = stats.individual_reports_count > 0 && stats.overall_reports_count > 0;

  return stats;
};

const buildChartData = (reports, period, range, locale = 'en-IN') => {
  if (!range) {
    return [];
  }

  if (period === 'year') {
    const monthlyTotals = Array.from({ length: 12 }, (_, monthIndex) => ({
      key: monthIndex,
      name: getMonthShortLabel(monthIndex, locale),
      liters: 0,
      profit: 0,
      revenue: 0,
      reports: 0
    }));

    reports.forEach((report) => {
      const reportDate = parseDateString(report.report_date);
      const monthIndex = reportDate ? reportDate.getUTCMonth() : null;

      if (monthIndex === null || monthIndex < 0 || monthIndex > 11) {
        return;
      }

      monthlyTotals[monthIndex].liters += toNumber(report.total_liters);
      monthlyTotals[monthIndex].profit += toNumber(report.profit_or_loss);
      monthlyTotals[monthIndex].revenue += toNumber(report.total_revenue);
      monthlyTotals[monthIndex].reports += 1;
    });

    return monthlyTotals.map((item) => ({
      ...item,
      liters: Number(item.liters.toFixed(2)),
      profit: Number(item.profit.toFixed(2)),
      revenue: Number(item.revenue.toFixed(2))
    }));
  }

  const grouped = new Map();

  if (period === 'week') {
    let currentDate = parseDateString(range.fromDate);
    const endDate = parseDateString(range.toDate);

    while (currentDate && endDate && currentDate <= endDate) {
      const key = currentDate.toISOString().slice(0, 10);
      grouped.set(key, {
        key,
        name: currentDate.toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
        liters: 0,
        profit: 0,
        revenue: 0,
        reports: 0
      });
      currentDate = addUtcDays(currentDate, 1);
    }
  }

  [...reports]
    .sort((a, b) => new Date(a.report_date) - new Date(b.report_date))
    .forEach((report) => {
      const reportDate = parseDateString(report.report_date);
      const key = report.report_date;

      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          name: reportDate
            ? reportDate.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
            : report.report_date,
          liters: 0,
          profit: 0,
          revenue: 0,
          reports: 0
        });
      }

      const bucket = grouped.get(key);
      bucket.liters += toNumber(report.total_liters);
      bucket.profit += toNumber(report.profit_or_loss);
      bucket.revenue += toNumber(report.total_revenue);
      bucket.reports += 1;
    });

  return Array.from(grouped.values()).map((item) => ({
    ...item,
    liters: Number(item.liters.toFixed(2)),
    profit: Number(item.profit.toFixed(2)),
    revenue: Number(item.revenue.toFixed(2))
  }));
};

const buildProfitChartData = (reports, period, locale = 'en-IN') => (
  [...reports]
    .sort((a, b) => new Date(a.report_date) - new Date(b.report_date))
    .map((report, index) => ({
      key: `profit-${report.id || index}`,
      name: `${report.cow_name} (${new Date(report.report_date).toLocaleDateString(locale, {
        day: 'numeric',
        month: period === 'year' ? 'short' : 'numeric'
      })})`,
      shortName: report.cow_name,
      profit: Number(toNumber(report.profit_or_loss).toFixed(2)),
      reports: 1,
      cow: report.cow_name,
      cowTag: report.cow_tag,
      reportDate: report.report_date,
      status: report.profit_status
    }))
);

const buildReportFormDataFromReport = (report) => ({
  report_date: report.report_date || getTodayString(),
  report_type: report.report_type || REPORT_TYPES.INDIVIDUAL,
  cow_id: report.cow_id ? `${report.cow_id}` : '',
  morning_liters: report.morning_liters ?? '',
  afternoon_liters: report.afternoon_liters ?? '',
  price_per_liter: report.price_per_liter ?? '',
  feed_cost: report.feed_cost ?? '',
  medicine_cost: report.medicine_cost ?? '',
  labor_cost: report.labor_cost ?? '',
  other_cost: report.other_cost ?? '',
  notes: report.notes || ''
});

const buildCowFormDataFromCow = (cow) => ({
  animal_type: cow.animal_type || ANIMAL_TYPES.COW,
  cow_name: cow.cow_name || '',
  cow_tag: cow.cow_tag || ''
});

const panelClassName = 'rounded-xl border border-gray-200 bg-white shadow-sm';
const mutedPanelClassName = 'rounded-xl border border-gray-200 bg-gray-50';
const inputClassName = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100';
const labelClassName = 'mb-2 block text-sm font-semibold text-gray-700';
const primaryButtonClassName = 'inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60';
const secondaryButtonClassName = 'inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50';
const subtleButtonClassName = 'inline-flex items-center justify-center rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 transition hover:bg-green-100';
const infoButtonClassName = 'inline-flex items-center justify-center rounded-lg border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-100';
const dangerButtonClassName = 'inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60';
const COWS_PER_PAGE = 10;
const REPORTS_PER_PAGE = 10;

const MilkReportsPage = () => {
  const { t, i18n } = useTranslation();
  const locale = getLocaleFromLanguage(i18n.resolvedLanguage || i18n.language);
  const [cows, setCows] = useState([]);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCowForm, setShowCowForm] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [editingCowId, setEditingCowId] = useState(null);
  const [editingReportId, setEditingReportId] = useState(null);
  const [savingCow, setSavingCow] = useState(false);
  const [savingReport, setSavingReport] = useState(false);
  const [deletingCowId, setDeletingCowId] = useState(null);
  const [deletingReportId, setDeletingReportId] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedWeekDate, setSelectedWeekDate] = useState(getTodayString());
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthString());
  const [selectedYear, setSelectedYear] = useState(getCurrentYearString());
  const [selectedChartMetric, setSelectedChartMetric] = useState('liters');
  const [selectedReportTypeFilter, setSelectedReportTypeFilter] = useState(REPORT_TYPE_FILTERS.ALL);
  const [selectedAnimalTypeFilter, setSelectedAnimalTypeFilter] = useState(ANIMAL_TYPE_FILTERS.ALL);
  const [selectedCowFilter, setSelectedCowFilter] = useState('');
  const [currentCowPage, setCurrentCowPage] = useState(1);
  const [currentReportPage, setCurrentReportPage] = useState(1);
  const [showIntroModal, setShowIntroModal] = useState(true);
  const [cowFormData, setCowFormData] = useState(initialCowFormData);
  const [reportFormData, setReportFormData] = useState(initialReportFormData);

  const activeRange = useMemo(() => getPeriodRange({
    period: selectedPeriod,
    weekDate: selectedWeekDate,
    monthValue: selectedMonth,
    yearValue: selectedYear
  }), [selectedPeriod, selectedWeekDate, selectedMonth, selectedYear]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const reportParams = {};

      if (activeRange) {
        reportParams.from_date = activeRange.fromDate;
        reportParams.to_date = activeRange.toDate;
      }

      if (selectedCowFilter) {
        reportParams.cow_id = selectedCowFilter;
      }

      if (selectedReportTypeFilter !== REPORT_TYPE_FILTERS.ALL) {
        reportParams.report_type = selectedReportTypeFilter;
      }

      if (selectedAnimalTypeFilter !== ANIMAL_TYPE_FILTERS.ALL) {
        reportParams.animal_type = selectedAnimalTypeFilter;
      }

      const [cowsResponse, reportsResponse] = await Promise.all([
        milkReportService.getCows(),
        milkReportService.getReports(reportParams)
      ]);

      const nextReports = reportsResponse?.data || [];
      setCows(cowsResponse?.data || []);
      setReports(nextReports);
      setStats(buildPeriodStats(nextReports));
    } catch (error) {
      console.error('Failed to load milk tracker data:', error);
      toast.error(
        localizeApiMessage(
          i18n,
          t,
          error?.message,
          'milkReports.errors.loadData',
          'Failed to load milk tracker data'
        )
      );
    } finally {
      setLoading(false);
    }
  }, [activeRange, selectedAnimalTypeFilter, selectedCowFilter, selectedReportTypeFilter, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedCow = useMemo(() => (
    reportFormData.report_type === REPORT_TYPES.INDIVIDUAL
      ? cows.find((cow) => `${cow.id}` === `${reportFormData.cow_id}`)
      : null
  ), [cows, reportFormData.cow_id, reportFormData.report_type]);

  const reportTypeOptions = useMemo(() => ([
    { value: REPORT_TYPES.INDIVIDUAL, label: t('milkReports.reportTypes.individual') },
    { value: REPORT_TYPES.OVERALL, label: t('milkReports.reportTypes.overall') }
  ]), [t]);

  const reportTypeFilterOptions = useMemo(() => ([
    { value: REPORT_TYPE_FILTERS.INDIVIDUAL, label: t('milkReports.reportTypeFilters.individual') },
    { value: REPORT_TYPE_FILTERS.OVERALL, label: t('milkReports.reportTypeFilters.overall') },
    { value: REPORT_TYPE_FILTERS.ALL, label: t('milkReports.reportTypeFilters.all') }
  ]), [t]);
  const animalTypeOptions = useMemo(() => ([
    { value: ANIMAL_TYPES.COW, label: t('animalTypes.cow') },
    { value: ANIMAL_TYPES.BUFFALO, label: t('animalTypes.buffalo') }
  ]), [t]);
  const animalTypeFilterOptions = useMemo(() => ([
    { value: ANIMAL_TYPE_FILTERS.ALL, label: t('milkReports.animalTypeFilters.all') },
    { value: ANIMAL_TYPE_FILTERS.COW, label: t('animalTypes.cow') },
    { value: ANIMAL_TYPE_FILTERS.BUFFALO, label: t('animalTypes.buffalo') }
  ]), [t]);

  const preview = useMemo(() => {
    const totalLiters = toNumber(reportFormData.morning_liters) + toNumber(reportFormData.afternoon_liters);
    const totalRevenue = totalLiters * toNumber(reportFormData.price_per_liter);
    const totalCost = (
      toNumber(reportFormData.feed_cost) +
      toNumber(reportFormData.medicine_cost) +
      toNumber(reportFormData.labor_cost) +
      toNumber(reportFormData.other_cost)
    );
    const profitOrLoss = totalRevenue - totalCost;

    return {
      totalLiters,
      totalRevenue,
      totalCost,
      profitOrLoss,
      profitStatus: profitOrLoss > 0 ? 'profit' : profitOrLoss < 0 ? 'loss' : 'break_even'
    };
  }, [reportFormData]);

  const chartData = useMemo(() => (
    selectedChartMetric === 'profit'
      ? buildProfitChartData(reports, selectedPeriod, locale)
      : buildChartData(reports, selectedPeriod, activeRange, locale)
  ), [reports, selectedPeriod, activeRange, selectedChartMetric, locale]);
  const periodLabel = useMemo(() => {
    if (!activeRange) {
      return t('milkReports.selectedPeriod');
    }

    if (selectedPeriod === 'week') {
      return t('milkReports.last7DaysEnding', { date: formatDate(selectedWeekDate, locale) });
    }

    if (selectedPeriod === 'year') {
      return t('milkReports.yearLabel', { year: selectedYear });
    }

    const monthRange = getMonthRange(selectedMonth);
    if (!monthRange) {
      return t('milkReports.selectedPeriod');
    }

    return new Date(Date.UTC(monthRange.year, monthRange.month - 1, 1)).toLocaleDateString(locale, {
      month: 'long',
      year: 'numeric'
    });
  }, [activeRange, locale, selectedMonth, selectedPeriod, selectedWeekDate, selectedYear, t]);
  const chartMetricMeta = {
    liters: {
      label: t('milkReports.chartMilk'),
      color: '#16a34a',
      formatter: formatLiters
    },
    profit: {
      label: t('milkReports.chartProfitLoss'),
      color: '#0f172a',
      formatter: formatCurrency
    },
    revenue: {
      label: t('milkReports.chartMoneyIn'),
      color: '#2563eb',
      formatter: formatCurrency
    }
  };
  const profitReportSummary = useMemo(() => ({
    profit: reports.filter((report) => report.profit_status === 'profit').length,
    loss: reports.filter((report) => report.profit_status === 'loss').length,
    breakEven: reports.filter((report) => report.profit_status === 'break_even').length
  }), [reports]);
  const totalCowPages = Math.max(1, Math.ceil(cows.length / COWS_PER_PAGE));
  const paginatedCows = useMemo(() => {
    const startIndex = (currentCowPage - 1) * COWS_PER_PAGE;
    return cows.slice(startIndex, startIndex + COWS_PER_PAGE);
  }, [cows, currentCowPage]);
  const cowRangeStart = cows.length === 0 ? 0 : ((currentCowPage - 1) * COWS_PER_PAGE) + 1;
  const cowRangeEnd = Math.min(currentCowPage * COWS_PER_PAGE, cows.length);
  const totalReportPages = Math.max(1, Math.ceil(reports.length / REPORTS_PER_PAGE));
  const paginatedReports = useMemo(() => {
    const startIndex = (currentReportPage - 1) * REPORTS_PER_PAGE;
    return reports.slice(startIndex, startIndex + REPORTS_PER_PAGE);
  }, [reports, currentReportPage]);
  const reportRangeStart = reports.length === 0 ? 0 : ((currentReportPage - 1) * REPORTS_PER_PAGE) + 1;
  const reportRangeEnd = Math.min(currentReportPage * REPORTS_PER_PAGE, reports.length);
  const currentReportModeLabel = useMemo(() => {
    if (selectedReportTypeFilter === REPORT_TYPE_FILTERS.OVERALL) {
      return t('milkReports.reportTypeFilters.overall');
    }

    if (selectedReportTypeFilter === REPORT_TYPE_FILTERS.ALL) {
      return t('milkReports.reportTypeFilters.all');
    }

    return t('milkReports.reportTypeFilters.individual');
  }, [selectedReportTypeFilter, t]);
  const currentAnimalTypeLabel = useMemo(() => {
    if (selectedAnimalTypeFilter === ANIMAL_TYPE_FILTERS.COW) {
      return t('animalTypes.cow');
    }

    if (selectedAnimalTypeFilter === ANIMAL_TYPE_FILTERS.BUFFALO) {
      return t('animalTypes.buffalo');
    }

    return t('milkReports.animalTypeFilters.all');
  }, [selectedAnimalTypeFilter, t]);
  const selectedReportDisplayName = reportFormData.report_type === REPORT_TYPES.OVERALL
    ? t('milkReports.overallHerd')
    : (selectedCow?.cow_name || t('milkReports.selectedCow'));

  useEffect(() => {
    setCurrentReportPage(1);
  }, [selectedPeriod, selectedWeekDate, selectedMonth, selectedYear, selectedAnimalTypeFilter, selectedCowFilter, selectedReportTypeFilter]);

  useEffect(() => {
    if (currentCowPage > totalCowPages) {
      setCurrentCowPage(totalCowPages);
    }
  }, [currentCowPage, totalCowPages]);

  useEffect(() => {
    if (currentReportPage > totalReportPages) {
      setCurrentReportPage(totalReportPages);
    }
  }, [currentReportPage, totalReportPages]);

  const openCreateCowForm = () => {
    setEditingCowId(null);
    setCowFormData(initialCowFormData());
    setShowCowForm(true);
  };

  const openEditCowForm = (cow) => {
    setEditingCowId(cow.id);
    setCowFormData(buildCowFormDataFromCow(cow));
    setShowCowForm(true);
  };

  const closeCowForm = () => {
    setShowCowForm(false);
    setEditingCowId(null);
    setCowFormData(initialCowFormData());
  };

  const openCreateReportForm = () => {
    setEditingReportId(null);
    const defaultReportType = cows.length > 0 ? REPORT_TYPES.INDIVIDUAL : REPORT_TYPES.OVERALL;
    setReportFormData({
      ...initialReportFormData(),
      report_type: defaultReportType,
      cow_id: defaultReportType === REPORT_TYPES.INDIVIDUAL && cows[0] ? `${cows[0].id}` : ''
    });
    setShowReportForm(true);
  };

  const openEditReportForm = (report) => {
    setEditingReportId(report.id);
    setReportFormData(buildReportFormDataFromReport(report));
    setShowReportForm(true);
  };

  const closeReportForm = () => {
    setShowReportForm(false);
    setEditingReportId(null);
    setReportFormData(initialReportFormData());
  };

  const handleCowChange = (event) => {
    const { name, value } = event.target;
    setCowFormData((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleReportChange = (event) => {
    const { name, value } = event.target;
    setReportFormData((current) => ({
      ...current,
      ...(name === 'report_type'
        ? {
            report_type: value,
            cow_id: value === REPORT_TYPES.INDIVIDUAL
              ? (current.cow_id || (cows[0] ? `${cows[0].id}` : ''))
              : ''
          }
        : {}),
      [name]: value
    }));
  };

  const handleReportTypeFilterChange = (value) => {
    setSelectedReportTypeFilter(value);

    if (value === REPORT_TYPE_FILTERS.OVERALL && selectedCowFilter) {
      setSelectedCowFilter('');
    }

    if (value === REPORT_TYPE_FILTERS.OVERALL) {
      setSelectedAnimalTypeFilter(ANIMAL_TYPE_FILTERS.ALL);
    }
  };

  const handleAnimalTypeFilterChange = (value) => {
    setSelectedAnimalTypeFilter(value);

    if (selectedCowFilter) {
      const matchingAnimal = cows.find((cow) => `${cow.id}` === `${selectedCowFilter}`);
      if (value !== ANIMAL_TYPE_FILTERS.ALL && matchingAnimal?.animal_type !== value) {
        setSelectedCowFilter('');
      }
    }
  };

  const handleSaveCow = async (event) => {
    event.preventDefault();
    setSavingCow(true);

    try {
      const payload = {
        ...cowFormData,
        animal_type: cowFormData.animal_type,
        cow_name: `${cowFormData.cow_name || ''}`.trim(),
        cow_tag: `${cowFormData.cow_tag || ''}`.trim()
      };

      const response = editingCowId
        ? await milkReportService.updateCow(editingCowId, payload)
        : await milkReportService.createCow(payload);

      if (response?.success) {
        toast.success(
          localizeApiMessage(
            i18n,
            t,
            response.message,
            editingCowId ? 'milkReports.success.cowUpdated' : 'milkReports.success.cowAdded',
            editingCowId ? 'Animal updated successfully' : 'Animal added successfully'
          )
        );
        closeCowForm();
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to save cow:', error);
      toast.error(
        localizeApiMessage(
          i18n,
          t,
          error?.message,
          'milkReports.errors.saveCow',
          'Failed to save cow'
        )
      );
    } finally {
      setSavingCow(false);
    }
  };

  const handleDeleteCow = async (cowId) => {
    const shouldDelete = window.confirm(t('milkReports.confirm.deleteCow'));
    if (!shouldDelete) {
      return;
    }

    try {
      setDeletingCowId(cowId);
      const response = await milkReportService.deleteCow(cowId);
      if (response?.success) {
        if (`${selectedCowFilter}` === `${cowId}`) {
          setSelectedCowFilter('');
        }
        toast.success(
          localizeApiMessage(
            i18n,
            t,
            response.message,
            'milkReports.success.cowDeleted',
            'Animal deleted successfully'
          )
        );
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to delete cow:', error);
      toast.error(
        localizeApiMessage(
          i18n,
          t,
          error?.message,
          'milkReports.errors.deleteCow',
          'Failed to delete cow'
        )
      );
    } finally {
      setDeletingCowId(null);
    }
  };

  const handleSaveReport = async (event) => {
    event.preventDefault();
    setSavingReport(true);

    try {
      const payload = {
        ...reportFormData,
        report_type: reportFormData.report_type,
        cow_id: reportFormData.report_type === REPORT_TYPES.INDIVIDUAL
          ? Number.parseInt(reportFormData.cow_id, 10)
          : null,
        morning_liters: toNumber(reportFormData.morning_liters),
        afternoon_liters: toNumber(reportFormData.afternoon_liters),
        price_per_liter: toNumber(reportFormData.price_per_liter),
        feed_cost: toNumber(reportFormData.feed_cost),
        medicine_cost: toNumber(reportFormData.medicine_cost),
        labor_cost: toNumber(reportFormData.labor_cost),
        other_cost: toNumber(reportFormData.other_cost)
      };

      const response = editingReportId
        ? await milkReportService.updateReport(editingReportId, payload)
        : await milkReportService.createReport(payload);

      if (response?.success) {
        toast.success(
          localizeApiMessage(
            i18n,
            t,
            response.message,
            editingReportId ? 'milkReports.success.reportUpdated' : 'milkReports.success.reportCreated',
            editingReportId ? 'Milk report updated successfully' : 'Milk report created successfully'
          )
        );
        closeReportForm();
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to save milk report:', error);
      toast.error(
        localizeApiMessage(
          i18n,
          t,
          error?.message,
          'milkReports.errors.saveReport',
          'Failed to save milk report'
        )
      );
    } finally {
      setSavingReport(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    const shouldDelete = window.confirm(t('milkReports.confirm.deleteReport'));
    if (!shouldDelete) {
      return;
    }

    try {
      setDeletingReportId(reportId);
      const response = await milkReportService.deleteReport(reportId);
      if (response?.success) {
        toast.success(
          localizeApiMessage(
            i18n,
            t,
            response.message,
            'milkReports.success.reportDeleted',
            'Milk report deleted successfully'
          )
        );
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to delete milk report:', error);
      toast.error(
        localizeApiMessage(
          i18n,
          t,
          error?.message,
          'milkReports.errors.deleteReport',
          'Failed to delete milk report'
        )
      );
    } finally {
      setDeletingReportId(null);
    }
  };

  const handleExportCsv = () => {
    if (reports.length === 0) {
      toast.error(t('milkReports.errors.noExportData'));
      return;
    }

    const header = [
      t('milkReports.table.date'),
      t('milkReports.table.reportType'),
      t('milkReports.fields.animalType'),
      t('milkReports.table.cow'),
      t('milkReports.table.cowTag'),
      t('milkReports.fields.morningLiters'),
      t('milkReports.fields.afternoonLiters'),
      t('milkReports.fields.totalLiters'),
      t('milkReports.fields.pricePerLiter'),
      t('milkReports.table.moneyIn'),
      t('milkReports.fields.feedCost'),
      t('milkReports.fields.medicineCost'),
      t('milkReports.fields.laborCost'),
      t('milkReports.fields.otherCost'),
      t('milkReports.fields.totalCost'),
      t('milkReports.table.result'),
      t('milkReports.fields.profitStatus'),
      t('milkReports.fields.notes')
    ];

    const rows = reports.map((report) => ([
      report.report_date,
      report.report_type === REPORT_TYPES.OVERALL ? t('milkReports.reportTypes.overall') : t('milkReports.reportTypes.individual'),
      report.animal_type ? t(`animalTypes.${report.animal_type}`) : '',
      report.cow_name || '',
      report.cow_tag || '',
      report.morning_liters ?? '',
      report.afternoon_liters ?? '',
      report.total_liters ?? '',
      report.price_per_liter ?? '',
      report.total_revenue ?? '',
      report.feed_cost ?? '',
      report.medicine_cost ?? '',
      report.labor_cost ?? '',
      report.other_cost ?? '',
      report.total_cost ?? '',
      report.profit_or_loss ?? '',
      report.profit_status ?? '',
      (report.notes || '').replace(/\r?\n/g, ' ')
    ]));

    const csvContent = [header, ...rows]
      .map((row) => row.map((cell) => `"${`${cell ?? ''}`.replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `milk-reports-${selectedReportTypeFilter}-${selectedAnimalTypeFilter}-${selectedPeriod}-${activeRange?.exportLabel || 'all'}${selectedCowFilter ? `-animal-${selectedCowFilter}` : ''}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <FullPageLoader message={t('milkReports.loading')} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 pb-6 pt-8 sm:px-6 sm:pb-6 sm:pt-10 lg:px-8">
        <div className={`${panelClassName} mb-6 overflow-hidden`}>
          <div className="border-b border-gray-200 px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-green-700">{t('milkReports.eyebrow')}</p>
                <h1 className="mt-2 text-3xl font-bold text-gray-900">{t('milkReports.title')}</h1>
                <p className="mt-2 max-w-3xl text-sm text-gray-600">
                  {t('milkReports.subtitle')}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                <button type="button" onClick={openCreateCowForm} className={subtleButtonClassName}>
                  {t('milkReports.addCow')}
                </button>
                <button type="button" onClick={openCreateReportForm} className={primaryButtonClassName}>
                  {t('milkReports.addDailyReport')}
                </button>
              </div>
            </div>
          </div>

          <div className="px-4 py-4 sm:px-6 sm:py-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 xl:items-end">
              <div>
                <label className={labelClassName}>{t('milkReports.show')}</label>
                <div className="grid grid-cols-3 gap-2 rounded-lg bg-gray-100 p-1">
                  {[
                    { value: 'week', label: t('milkReports.period.week') },
                    { value: 'month', label: t('milkReports.period.month') },
                    { value: 'year', label: t('milkReports.period.year') }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSelectedPeriod(option.value)}
                      className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                        selectedPeriod === option.value
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClassName}>
                  {selectedPeriod === 'week' ? t('milkReports.lastDay') : selectedPeriod === 'year' ? t('milkReports.period.year') : t('milkReports.period.month')}
                </label>
                {selectedPeriod === 'week' ? (
                  <input
                    type="date"
                    value={selectedWeekDate}
                    onChange={(event) => setSelectedWeekDate(event.target.value)}
                    className={inputClassName}
                  />
                ) : null}
                {selectedPeriod === 'month' ? (
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(event) => setSelectedMonth(event.target.value)}
                    className={inputClassName}
                  />
                ) : null}
                {selectedPeriod === 'year' ? (
                  <input
                    type="number"
                    min="2000"
                    max="2100"
                    value={selectedYear}
                    onChange={(event) => setSelectedYear(event.target.value)}
                    className={inputClassName}
                  />
                ) : null}
              </div>

              <div>
                <label className={labelClassName}>{t('milkReports.fields.reportType')}</label>
                <select
                  value={selectedReportTypeFilter}
                  onChange={(event) => handleReportTypeFilterChange(event.target.value)}
                  className={inputClassName}
                >
                  {reportTypeFilterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClassName}>{t('milkReports.fields.animalType')}</label>
                <select
                  value={selectedAnimalTypeFilter}
                  onChange={(event) => handleAnimalTypeFilterChange(event.target.value)}
                  className={inputClassName}
                  disabled={selectedReportTypeFilter === REPORT_TYPE_FILTERS.OVERALL}
                >
                  {animalTypeFilterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClassName}>{t('milkReports.chooseCow')}</label>
                <select
                  value={selectedCowFilter}
                  onChange={(event) => setSelectedCowFilter(event.target.value)}
                  className={inputClassName}
                  disabled={selectedReportTypeFilter === REPORT_TYPE_FILTERS.OVERALL}
                >
                  <option value="">
                    {selectedReportTypeFilter === REPORT_TYPE_FILTERS.OVERALL ? t('milkReports.notNeededForOverall') : t('milkReports.allCows')}
                  </option>
                  {cows.filter((cow) => (
                    selectedAnimalTypeFilter === ANIMAL_TYPE_FILTERS.ALL || cow.animal_type === selectedAnimalTypeFilter
                  )).map((cow) => (
                    <option key={cow.id} value={cow.id}>
                      {cow.cow_name} - {t(`animalTypes.${cow.animal_type || ANIMAL_TYPES.COW}`)}{cow.cow_tag ? ` (${cow.cow_tag})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className={`${mutedPanelClassName} px-4 py-3 md:col-span-2 xl:col-span-1`}>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('milkReports.nowShowing')}</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{periodLabel}</p>
                <p className="mt-1 text-sm text-gray-500">
                  {currentReportModeLabel} | {currentAnimalTypeLabel}{selectedCowFilter ? ` | ${t('milkReports.oneCow')}` : ` | ${t('milkReports.allCows')}`}
                </p>
              </div>

              <div className="flex md:col-span-2 xl:col-span-1 xl:justify-end">
                <button type="button" onClick={handleExportCsv} className={`${secondaryButtonClassName} h-[46px] w-full xl:w-auto`}>
                  {t('milkReports.download')}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className={`${panelClassName} p-5`}>
            <p className="text-sm font-medium text-gray-500">{t('milkReports.milk')}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{formatLiters(stats?.total_liters)}</p>
            <p className="mt-2 text-sm text-gray-500">{t('milkReports.entriesCount', { count: stats?.total_reports || 0 })} • {currentReportModeLabel}</p>
          </div>

          <div className={`${panelClassName} p-5`}>
            <p className="text-sm font-medium text-gray-500">{t('milkReports.moneyIn')}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{formatCurrency(stats?.total_revenue)}</p>
            <p className="mt-2 text-sm text-gray-500">{t('milkReports.fromMilkSelling')}</p>
          </div>

          <div className={`${panelClassName} p-5`}>
            <p className="text-sm font-medium text-gray-500">{t('milkReports.moneyOut')}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{formatCurrency(stats?.total_cost)}</p>
            <p className="mt-2 text-sm text-gray-500">{t('milkReports.costHint')}</p>
          </div>

          <div className={`${panelClassName} p-5`}>
            <p className="text-sm font-medium text-gray-500">{t('milkReports.finalResult')}</p>
            <p className={`mt-2 text-3xl font-bold ${Number(stats?.net_profit_or_loss || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {formatCurrency(stats?.net_profit_or_loss)}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {t('milkReports.profitLossCount', { profit: stats?.profitable_days || 0, loss: stats?.loss_days || 0 })}
            </p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <div className={`${panelClassName} p-4 sm:p-6`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{t('milkReports.easyChart')}</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedChartMetric === 'profit'
                    ? t('milkReports.chartProfitHelp')
                    : t('milkReports.chartSimpleHelp')}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { value: 'liters', label: t('milkReports.chartMilk') },
                { value: 'profit', label: t('milkReports.chartProfitLoss') },
                { value: 'revenue', label: t('milkReports.chartMoneyIn') }
              ].map((metric) => (
                <button
                  key={metric.value}
                  type="button"
                  onClick={() => setSelectedChartMetric(metric.value)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    selectedChartMetric === metric.value
                      ? 'bg-green-600 text-white'
                      : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {metric.label}
                </button>
              ))}
            </div>

            <div className="mt-6 h-[260px] sm:h-[320px]">
              {chartData.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-center">
                  <div>
                    <p className="text-lg font-semibold text-gray-700">{t('milkReports.noDataYet')}</p>
                    <p className="mt-2 text-sm text-gray-500">{t('milkReports.addEntriesToSeeChart')}</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="name"
                      stroke="#6b7280"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => value.length > 14 ? `${value.slice(0, 14)}...` : value}
                    />
                    <YAxis stroke="#6b7280" tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)'
                      }}
                      formatter={(value) => [chartMetricMeta[selectedChartMetric].formatter(value), chartMetricMeta[selectedChartMetric].label]}
                      labelFormatter={(label, payload) => {
                        const point = payload?.[0]?.payload;
                        if (!point) {
                          return label;
                        }

                        if (selectedChartMetric === 'profit') {
                          return `${point.cow} - ${formatDate(point.reportDate, locale)}`;
                        }

                        return t('milkReports.entriesLabel', { label, count: point.reports });
                      }}
                    />
                    <Bar dataKey={selectedChartMetric} radius={[8, 8, 0, 0]}>
                      {chartData.map((entry) => (
                        <Cell
                          key={`${entry.key}-${selectedChartMetric}`}
                          fill={
                            selectedChartMetric === 'profit'
                              ? entry.profit >= 0 ? '#16a34a' : '#dc2626'
                              : chartMetricMeta[selectedChartMetric].color
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="mt-4 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
              {selectedChartMetric === 'profit' ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p>
                    <span className="font-semibold text-gray-900">{t('milkReports.chartProfitLoss')}</span> {t('milkReports.profitShownEachEntry')}
                  </p>
                  <div className="flex flex-wrap gap-3 text-xs font-semibold">
                    <span className="text-green-700">{t('milkReports.profitCount', { count: profitReportSummary.profit })}</span>
                    <span className="text-red-700">{t('milkReports.lossCount', { count: profitReportSummary.loss })}</span>
                    <span className="text-amber-700">{t('milkReports.sameCount', { count: profitReportSummary.breakEven })}</span>
                  </div>
                </div>
              ) : (
                <span><span className="font-semibold text-gray-900">{chartMetricMeta[selectedChartMetric].label}</span> {t('milkReports.shownHere')}</span>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className={`${panelClassName} p-4 sm:p-6`}>
              <h2 className="text-xl font-bold text-gray-900">{t('milkReports.easySummary')}</h2>
              <div className="mt-4 space-y-4">
                <div className={`${Number(stats?.net_profit_or_loss || 0) >= 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'} rounded-xl border p-4`}>
                  <p className="text-sm font-semibold text-gray-900">{t('milkReports.thisTime')}</p>
                  <p className={`mt-2 text-2xl font-bold ${Number(stats?.net_profit_or_loss || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {Number(stats?.net_profit_or_loss || 0) >= 0 ? t('milkReports.youAreInProfit') : t('milkReports.youAreInLoss')}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">{formatCurrency(stats?.net_profit_or_loss)}</p>
                </div>

                <div className={`${mutedPanelClassName} p-4`}>
                  <p className="text-sm font-semibold text-gray-900">{t('milkReports.allAnimalTotal')}</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">{formatLiters(stats?.all_animal_total?.total_liters)}</p>
                  <p className={`mt-1 text-xs font-semibold ${Number(stats?.all_animal_total?.profit_or_loss || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {formatCurrency(stats?.all_animal_total?.profit_or_loss)}
                  </p>
                </div>

                <div className={`${mutedPanelClassName} p-4`}>
                  <p className="text-sm font-semibold text-gray-900">{t('milkReports.overallHerdTotal')}</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">{formatLiters(stats?.overall_herd_total?.total_liters)}</p>
                  <p className={`mt-1 text-xs font-semibold ${Number(stats?.overall_herd_total?.profit_or_loss || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {formatCurrency(stats?.overall_herd_total?.profit_or_loss)}
                  </p>
                </div>

                <div className={`${mutedPanelClassName} p-4`}>
                  <p className="text-sm font-semibold text-gray-900">{t('milkReports.bestCow')}</p>
                  <p className="mt-2 text-sm text-gray-600">
                    {stats?.best_cow ? stats.best_cow.cow_name : t('milkReports.noDataYet')}
                  </p>
                  {stats?.best_cow?.cow_tag ? (
                    <p className="mt-1 text-xs text-gray-500">{t('milkReports.tag')}: {stats.best_cow.cow_tag}</p>
                  ) : null}
                  {stats?.best_cow ? (
                    <p className="mt-2 text-sm font-semibold text-green-700">
                      {formatCurrency(stats.best_cow.profit_or_loss)} - {formatLiters(stats.best_cow.total_liters)}
                    </p>
                  ) : null}
                </div>

                <div className={`${mutedPanelClassName} p-4`}>
                  <p className="text-sm font-semibold text-gray-900">{t('milkReports.bestBuffalo')}</p>
                  <p className="mt-2 text-sm text-gray-600">
                    {stats?.best_buffalo ? stats.best_buffalo.cow_name : t('milkReports.noDataYet')}
                  </p>
                  {stats?.best_buffalo?.cow_tag ? (
                    <p className="mt-1 text-xs text-gray-500">{t('milkReports.tag')}: {stats.best_buffalo.cow_tag}</p>
                  ) : null}
                  {stats?.best_buffalo ? (
                    <p className="mt-2 text-sm font-semibold text-green-700">
                      {formatCurrency(stats.best_buffalo.profit_or_loss)} - {formatLiters(stats.best_buffalo.total_liters)}
                    </p>
                  ) : null}
                </div>

                <div className={`${mutedPanelClassName} p-4`}>
                  <p className="text-sm font-semibold text-gray-900">{t('milkReports.reportModeSummary')}</p>
                  <p className="mt-2 text-sm text-gray-600">{currentReportModeLabel}</p>
                  <p className="mt-2 text-xs text-gray-500">
                    {t('milkReports.reportTypeCountSummary', {
                      individual: stats?.individual_reports_count || 0,
                      overall: stats?.overall_reports_count || 0
                    })}
                  </p>
                </div>

                <div className={`${mutedPanelClassName} p-4`}>
                  <p className="text-sm font-semibold text-gray-900">{t('milkReports.animalTypeSummary')}</p>
                  <p className="mt-2 text-sm text-gray-600">{currentAnimalTypeLabel}</p>
                  <p className="mt-2 text-xs text-gray-500">
                    {t('milkReports.animalTypeCountSummary', {
                      cow: stats?.cow_reports_count || 0,
                      buffalo: stats?.buffalo_reports_count || 0
                    })}
                  </p>
                </div>

                <div className={`${mutedPanelClassName} p-4`}>
                  <p className="text-sm font-semibold text-gray-900">{t('milkReports.bestEntry')}</p>
                  <p className="mt-2 text-sm text-gray-600">
                    {stats?.best_day ? `${stats.best_day.cow_name} - ${formatDate(stats.best_day.report_date, locale)}` : t('milkReports.noDataYet')}
                  </p>
                  {stats?.best_day ? (
                    <p className={`mt-2 text-sm font-semibold ${Number(stats.best_day.profit_or_loss) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {formatCurrency(stats.best_day.profit_or_loss)}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className={`${panelClassName} mb-6 p-4 sm:p-6`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{t('milkReports.myCows')}</h2>
              <p className="mt-1 text-sm text-gray-500">{t('milkReports.eachCowSeparate')}</p>
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-700">
              {t('milkReports.cowsCount', { count: cows.length })}
            </span>
          </div>

          <div className="mt-6">
            {cows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-10 text-center">
                <p className="text-lg font-semibold text-gray-700">{t('milkReports.noCowsYet')}</p>
                <p className="mt-2 text-sm text-gray-500">{t('milkReports.noCowsAdded')}</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="space-y-4 p-4 md:hidden">
                  {paginatedCows.map((cow) => (
                    <div key={cow.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-lg font-bold text-gray-900">{cow.cow_name}</h3>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                              {t(`animalTypes.${cow.animal_type || ANIMAL_TYPES.COW}`)}
                            </span>
                            {cow.cow_tag ? (
                              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-200">
                                {cow.cow_tag}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <button type="button" onClick={() => openEditCowForm(cow)} className={`${infoButtonClassName} flex-1`}>
                          {t('common.edit')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCow(cow.id)}
                          disabled={deletingCowId === cow.id}
                          className={`${dangerButtonClassName} flex-1`}
                        >
                          {deletingCowId === cow.id ? t('milkReports.deleting') : t('common.delete')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{t('milkReports.fields.animalType')}</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{t('milkReports.table.cow')}</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{t('milkReports.table.cowTag')}</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">{t('milkReports.table.action')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {paginatedCows.map((cow) => (
                        <tr key={cow.id} className="align-top">
                          <td className="px-4 py-4 text-sm text-gray-700">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                              {t(`animalTypes.${cow.animal_type || ANIMAL_TYPES.COW}`)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700">
                            <p className="font-semibold text-gray-900">{cow.cow_name}</p>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700">
                            {cow.cow_tag ? (
                              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                                {cow.cow_tag}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex justify-end gap-2">
                              <button type="button" onClick={() => openEditCowForm(cow)} className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100">
                                {t('common.edit')}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCow(cow.id)}
                                disabled={deletingCowId === cow.id}
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {deletingCowId === cow.id ? t('milkReports.deleting') : t('common.delete')}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-gray-600">
                    {t('milkReports.showingRange', { start: cowRangeStart, end: cowRangeEnd, total: cows.length })}
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentCowPage((page) => Math.max(1, page - 1))}
                      disabled={currentCowPage === 1}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {t('milkReports.previous')}
                    </button>
                    <span className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-gray-200">
                      {t('milkReports.pageOf', { page: currentCowPage, total: totalCowPages })}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentCowPage((page) => Math.min(totalCowPages, page + 1))}
                      disabled={currentCowPage === totalCowPages}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {t('common.next')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={`${panelClassName} p-4 sm:p-6`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{t('milkReports.dailyReports')}</h2>
              <p className="mt-1 text-sm text-gray-500">
                {t('milkReports.entriesFor', { period: periodLabel })} {t('milkReports.entriesModeFor', { mode: currentReportModeLabel })}{selectedCowFilter ? ` ${t('milkReports.withSelectedCow')}` : ''}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{reports.length}</span> {t('milkReports.totalReports')}
            </div>
          </div>

          <div className="mt-6">
            {reports.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-10 text-center">
                <p className="text-lg font-semibold text-gray-700">{t('milkReports.noMilkReportsYet')}</p>
                <p className="mt-2 text-sm text-gray-500">{t('milkReports.saveDailyMilkReport')}</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="space-y-4 p-4 md:hidden">
                  {paginatedReports.map((report) => (
                    <div key={report.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-500">{formatDate(report.report_date, locale)}</p>
                          <h3 className="mt-1 text-lg font-bold text-gray-900">{report.cow_name}</h3>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                              {report.report_type === REPORT_TYPES.OVERALL ? t('milkReports.reportTypes.overall') : t('milkReports.reportTypes.individual')}
                            </span>
                            {report.animal_type ? (
                              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                                {t(`animalTypes.${report.animal_type}`)}
                              </span>
                            ) : null}
                            {report.cow_tag ? (
                              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-200">
                                {report.cow_tag}
                              </span>
                            ) : null}
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${getStatusStyles(report.profit_status)}`}>
                              {t(`milkReports.status.${report.profit_status}`)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('milkReports.table.result')}</p>
                          <p className={`mt-1 text-lg font-bold ${Number(report.profit_or_loss) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {formatCurrency(report.profit_or_loss)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-gray-200 bg-white p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('milkReports.table.milk')}</p>
                          <p className="mt-1 text-base font-bold text-gray-900">{formatLiters(report.total_liters)}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {t('milkReports.short.morning')} {formatLiters(report.morning_liters)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {t('milkReports.short.afternoon')} {formatLiters(report.afternoon_liters)}
                          </p>
                        </div>

                        <div className="rounded-lg border border-gray-200 bg-white p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('milkReports.table.moneyIn')}</p>
                          <p className="mt-1 text-base font-bold text-gray-900">{formatCurrency(report.total_revenue)}</p>
                          <p className="mt-1 text-xs text-gray-500">{formatCurrency(report.price_per_liter)} {t('milkReports.perLiter')}</p>
                        </div>

                        <div className="rounded-lg border border-gray-200 bg-white p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('milkReports.table.moneyOut')}</p>
                          <p className="mt-1 text-base font-bold text-gray-900">{formatCurrency(report.total_cost)}</p>
                          <p className="mt-1 text-xs text-gray-500">{t('milkReports.fields.feedCost')} {formatCurrency(report.feed_cost)}</p>
                          <p className="text-xs text-gray-500">{t('milkReports.fields.medicineCost')} {formatCurrency(report.medicine_cost)}</p>
                        </div>

                        <div className="rounded-lg border border-gray-200 bg-white p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('milkReports.table.result')}</p>
                          <p className={`mt-1 text-base font-bold ${Number(report.profit_or_loss) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {formatCurrency(report.profit_or_loss)}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">{t('milkReports.fields.laborCost')} {formatCurrency(report.labor_cost)}</p>
                          <p className="text-xs text-gray-500">{t('milkReports.fields.otherCost')} {formatCurrency(report.other_cost)}</p>
                        </div>
                      </div>

                      {report.notes ? (
                        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-600">
                          {report.notes}
                        </div>
                      ) : null}

                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <button type="button" onClick={() => openEditReportForm(report)} className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100">
                          {t('common.edit')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReport(report.id)}
                          disabled={deletingReportId === report.id}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingReportId === report.id ? t('milkReports.deleting') : t('common.delete')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{t('milkReports.table.date')}</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{t('milkReports.table.reportType')}</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{t('milkReports.table.cow')}</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{t('milkReports.table.milk')}</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{t('milkReports.table.moneyIn')}</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{t('milkReports.table.moneyOut')}</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{t('milkReports.table.result')}</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{t('milkReports.table.notes')}</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">{t('milkReports.table.action')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {paginatedReports.map((report) => (
                        <tr key={report.id} className="align-top">
                          <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">{formatDate(report.report_date, locale)}</td>
                          <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                              {report.report_type === REPORT_TYPES.OVERALL ? t('milkReports.reportTypes.overall') : t('milkReports.reportTypes.individual')}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="min-w-[140px]">
                              <p className="font-semibold text-gray-900">{report.cow_name}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                {report.animal_type ? (
                                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                    {t(`animalTypes.${report.animal_type}`)}
                                  </span>
                                ) : null}
                                {report.cow_tag ? (
                                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                                    {report.cow_tag}
                                  </span>
                                ) : null}
                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${getStatusStyles(report.profit_status)}`}>
                                  {t(`milkReports.status.${report.profit_status}`)}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700">
                            <p className="font-semibold text-gray-900">{formatLiters(report.total_liters)}</p>
                            <p className="mt-1 text-xs text-gray-500">
                              {t('milkReports.short.morning')} {formatLiters(report.morning_liters)} | {t('milkReports.short.afternoon')} {formatLiters(report.afternoon_liters)}
                            </p>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700">
                            <p className="font-semibold text-gray-900">{formatCurrency(report.total_revenue)}</p>
                            <p className="mt-1 text-xs text-gray-500">{formatCurrency(report.price_per_liter)} {t('milkReports.perLiter')}</p>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700">
                            <p className="font-semibold text-gray-900">{formatCurrency(report.total_cost)}</p>
                            <p className="mt-1 text-xs text-gray-500">
                              {t('milkReports.fields.feedCost')} {formatCurrency(report.feed_cost)} | {t('milkReports.fields.medicineCost')} {formatCurrency(report.medicine_cost)}
                            </p>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700">
                            <p className={`font-semibold ${Number(report.profit_or_loss) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                              {formatCurrency(report.profit_or_loss)}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {t('milkReports.fields.laborCost')} {formatCurrency(report.labor_cost)} | {t('milkReports.fields.otherCost')} {formatCurrency(report.other_cost)}
                            </p>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">
                            <div className="max-w-[180px] whitespace-normal break-words">
                              {report.notes || '-'}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex justify-end gap-2">
                              <button type="button" onClick={() => openEditReportForm(report)} className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100">
                                {t('common.edit')}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteReport(report.id)}
                                disabled={deletingReportId === report.id}
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {deletingReportId === report.id ? t('milkReports.deleting') : t('common.delete')}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-gray-600">
                    {t('milkReports.showingRange', { start: reportRangeStart, end: reportRangeEnd, total: reports.length })}
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentReportPage((page) => Math.max(1, page - 1))}
                      disabled={currentReportPage === 1}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {t('milkReports.previous')}
                    </button>
                    <span className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-gray-200">
                      {t('milkReports.pageOf', { page: currentReportPage, total: totalReportPages })}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentReportPage((page) => Math.min(totalReportPages, page + 1))}
                      disabled={currentReportPage === totalReportPages}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {t('common.next')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCowForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-gray-200 px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingCowId ? t('milkReports.forms.editCow') : t('milkReports.forms.addCow')}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">{t('milkReports.forms.cowHelp')}</p>
                </div>
                <button
                  type="button"
                  onClick={closeCowForm}
                  className={secondaryButtonClassName}
                >
                  {t('common.close')}
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveCow} className="space-y-6 p-4 sm:p-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClassName}>{t('milkReports.fields.animalType')}</label>
                  <select
                    name="animal_type"
                    value={cowFormData.animal_type}
                    onChange={handleCowChange}
                    className={inputClassName}
                  >
                    {animalTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClassName}>{t('milkReports.fields.cowName')}</label>
                  <input
                    type="text"
                    name="cow_name"
                    value={cowFormData.cow_name}
                    onChange={handleCowChange}
                    className={inputClassName}
                    placeholder={t('milkReports.placeholders.cowName')}
                    required
                  />
                </div>

                <div>
                  <label className={labelClassName}>{t('milkReports.fields.cowTag')}</label>
                  <input
                    type="text"
                    name="cow_tag"
                    value={cowFormData.cow_tag}
                    onChange={handleCowChange}
                    className={inputClassName}
                    placeholder={t('milkReports.placeholders.cowTag')}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeCowForm}
                  className={secondaryButtonClassName}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={savingCow}
                  className={primaryButtonClassName}
                >
                  {savingCow ? t('milkReports.saving') : editingCowId ? t('milkReports.forms.updateCow') : t('milkReports.forms.saveCow')}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showIntroModal ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm sm:items-center">
          <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/30 bg-white shadow-2xl sm:max-h-[90vh]">
            <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-lime-500 px-5 py-6 text-white sm:px-8 sm:py-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100">{t('milkReports.eyebrow')}</p>
                  <h2 className="mt-3 text-2xl font-bold sm:text-3xl">{t('milkReports.welcomeTitle')}</h2>
                  <p className="mt-3 max-w-2xl text-sm text-emerald-50 sm:text-base">
                    {t('milkReports.welcomeSubtitle')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIntroModal(false)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-8">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">1</span>
                  <p className="mt-4 text-base font-semibold text-slate-900">{t('milkReports.welcomeStep1Title')}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{t('milkReports.step1')}</p>
                </div>
                <div className="rounded-2xl border border-sky-100 bg-sky-50 p-5">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sky-600 text-sm font-bold text-white">2</span>
                  <p className="mt-4 text-base font-semibold text-slate-900">{t('milkReports.welcomeStep2Title')}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{t('milkReports.step2')}</p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-white">3</span>
                  <p className="mt-4 text-base font-semibold text-slate-900">{t('milkReports.welcomeStep3Title')}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{t('milkReports.step3')}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 bg-white px-5 py-4 sm:px-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowIntroModal(false)}
                  className={secondaryButtonClassName}
                >
                  {t('common.close')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowIntroModal(false)}
                  className={primaryButtonClassName}
                >
                  {t('milkReports.startNow')}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showReportForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-gray-200 px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingReportId ? t('milkReports.forms.editReport') : t('milkReports.forms.addReport')}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {reportFormData.report_type === REPORT_TYPES.OVERALL ? t('milkReports.forms.overallReportHelp') : t('milkReports.forms.reportHelp')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeReportForm}
                  className={secondaryButtonClassName}
                >
                  {t('common.close')}
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveReport} className="space-y-6 p-4 sm:p-6">
              <div>
                <label className={labelClassName}>{t('milkReports.fields.reportType')}</label>
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1">
                  {reportTypeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleReportChange({ target: { name: 'report_type', value: option.value } })}
                      disabled={option.value === REPORT_TYPES.INDIVIDUAL && cows.length === 0}
                      className={`rounded-md px-3 py-2.5 text-sm font-semibold transition ${
                        reportFormData.report_type === option.value
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClassName}>{t('milkReports.fields.reportDate')}</label>
                  <input
                    type="date"
                    name="report_date"
                    value={reportFormData.report_date}
                    onChange={handleReportChange}
                    className={inputClassName}
                    required
                  />
                </div>

                {reportFormData.report_type === REPORT_TYPES.INDIVIDUAL ? (
                  <div>
                    <label className={labelClassName}>{t('milkReports.fields.selectCow')}</label>
                    <select
                      name="cow_id"
                      value={reportFormData.cow_id}
                      onChange={handleReportChange}
                      className={inputClassName}
                      required
                    >
                      <option value="">{t('milkReports.forms.selectACow')}</option>
                      {cows.map((cow) => (
                        <option key={cow.id} value={cow.id}>
                          {cow.cow_name} - {t(`animalTypes.${cow.animal_type || ANIMAL_TYPES.COW}`)}{cow.cow_tag ? ` (${cow.cow_tag})` : ''}
                        </option>
                      ))}
                    </select>
                    {cows.length === 0 ? (
                      <p className="mt-2 text-xs text-red-600">{t('milkReports.errors.addCowFirst')}</p>
                    ) : null}
                  </div>
                ) : (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    <p className="font-semibold">{t('milkReports.overallHerd')}</p>
                    <p className="mt-1 text-amber-800">{t('milkReports.forms.overallSelectionHelp')}</p>
                  </div>
                )}
              </div>

              {selectedCow ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  <p className="font-semibold text-gray-800">{selectedCow.cow_name}</p>
                  <p className="mt-1">
                    {t(`animalTypes.${selectedCow.animal_type || ANIMAL_TYPES.COW}`)} | {selectedCow.cow_tag ? `${t('milkReports.tag')}: ${selectedCow.cow_tag}` : t('milkReports.noTagAdded')}
                    {selectedCow.breed_name ? ` | ${t('milkReports.fields.breed')}: ${selectedCow.breed_name}` : ''}
                  </p>
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <div>
                  <label className={labelClassName}>{t('milkReports.fields.morningLiters')}</label>
                  <input
                    type="number"
                    name="morning_liters"
                    value={reportFormData.morning_liters}
                    onChange={handleReportChange}
                    min="0"
                    step="0.01"
                    className={inputClassName}
                    required
                  />
                </div>

                <div>
                  <label className={labelClassName}>{t('milkReports.fields.afternoonLiters')}</label>
                  <input
                    type="number"
                    name="afternoon_liters"
                    value={reportFormData.afternoon_liters}
                    onChange={handleReportChange}
                    min="0"
                    step="0.01"
                    className={inputClassName}
                    required
                  />
                </div>

                <div>
                  <label className={labelClassName}>{t('milkReports.fields.pricePerLiter')}</label>
                  <input
                    type="number"
                    name="price_per_liter"
                    value={reportFormData.price_per_liter}
                    onChange={handleReportChange}
                    min="0"
                    step="0.01"
                    className={inputClassName}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <label className={labelClassName}>{t('milkReports.fields.feedCost')}</label>
                  <input
                    type="number"
                    name="feed_cost"
                    value={reportFormData.feed_cost}
                    onChange={handleReportChange}
                    min="0"
                    step="0.01"
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label className={labelClassName}>{t('milkReports.fields.medicineCost')}</label>
                  <input
                    type="number"
                    name="medicine_cost"
                    value={reportFormData.medicine_cost}
                    onChange={handleReportChange}
                    min="0"
                    step="0.01"
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label className={labelClassName}>{t('milkReports.fields.laborCost')}</label>
                  <input
                    type="number"
                    name="labor_cost"
                    value={reportFormData.labor_cost}
                    onChange={handleReportChange}
                    min="0"
                    step="0.01"
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label className={labelClassName}>{t('milkReports.fields.otherCost')}</label>
                  <input
                    type="number"
                    name="other_cost"
                    value={reportFormData.other_cost}
                    onChange={handleReportChange}
                    min="0"
                    step="0.01"
                    className={inputClassName}
                  />
                </div>
              </div>

              <div>
                <label className={labelClassName}>{t('milkReports.fields.notes')}</label>
                <textarea
                  name="notes"
                  value={reportFormData.notes}
                  onChange={handleReportChange}
                  rows="3"
                  className={inputClassName}
                  placeholder={t('milkReports.placeholders.reportNotes')}
                />
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">{t('milkReports.liveSummary')}</p>
                    <h3 className="mt-2 text-xl font-bold text-gray-900">{selectedReportDisplayName}</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      {reportFormData.report_type === REPORT_TYPES.OVERALL ? t('milkReports.reportBelongsOverallHerd') : t('milkReports.reportBelongsSelectedCow')}
                    </p>
                  </div>

                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getStatusStyles(preview.profitStatus)}`}>
                    {t(`milkReports.status.${preview.profitStatus}`)}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('milkReports.fields.totalLiters')}</p>
                    <p className="mt-2 text-xl font-bold text-gray-900">{formatLiters(preview.totalLiters)}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('milkReports.table.moneyIn')}</p>
                    <p className="mt-2 text-xl font-bold text-gray-900">{formatCurrency(preview.totalRevenue)}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('milkReports.fields.totalCost')}</p>
                    <p className="mt-2 text-xl font-bold text-gray-900">{formatCurrency(preview.totalCost)}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('milkReports.table.result')}</p>
                    <p className={`mt-2 text-xl font-bold ${preview.profitOrLoss >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {formatCurrency(preview.profitOrLoss)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeReportForm}
                  className={secondaryButtonClassName}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={savingReport}
                  className={primaryButtonClassName}
                >
                  {savingReport ? t('milkReports.saving') : editingReportId ? t('milkReports.forms.updateReport') : t('milkReports.forms.saveReport')}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MilkReportsPage;
