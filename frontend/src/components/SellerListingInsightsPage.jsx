import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { getBuffaloBreedOptions } from '../constants/buffaloBreeds';
import { getCatBreedOptions } from '../constants/catBreeds';
import { getCowBreedOptions } from '../constants/cowBreeds';
import { getDogBreedOptions } from '../constants/dogBreeds';
import { getGoatBreedOptions } from '../constants/goatBreeds';
import { getHorseBreedOptions } from '../constants/horseBreeds';
import { listingsService } from '../services/api';
import AppLoader from './AppLoader';

const FALLBACK_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="320"%3E%3Crect fill="%23EEF3EE" width="500" height="320"/%3E%3Ctext fill="%23718377" font-family="sans-serif" font-size="22" dy="8" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EAnimal%3C/text%3E%3C/svg%3E';

const TYPE_OPTIONS = {
  buffalo: getBuffaloBreedOptions,
  cat: getCatBreedOptions,
  cow: getCowBreedOptions,
  dog: getDogBreedOptions,
  goat: getGoatBreedOptions,
  horse: getHorseBreedOptions,
};

const formatCurrency = (value) => `\u20B9${Number(value || 0).toLocaleString('en-IN')}`;

const repairMojibakeText = (value) => {
  if (typeof value !== 'string' || !/[ÃÂà]/.test(value)) {
    return value;
  }

  try {
    const encodedBytes = value
      .split('')
      .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
      .join('');

    return decodeURIComponent(encodedBytes);
  } catch {
    return value;
  }
};

const getAppLanguage = (i18n) => {
  const language = i18n?.resolvedLanguage || i18n?.language || 'en';
  return language.split('-')[0];
};

const getLocalizedBreedName = (listing, language, t) => {
  const breed = listing?.breed || listing?.name;
  if (!breed) return t('animalTypes.animal', { defaultValue: 'Animal' });

  const getOptions = TYPE_OPTIONS[String(listing?.animal_type || '').toLowerCase()];
  if (!getOptions) return repairMojibakeText(breed);

  const match = getOptions(language, '').find((option) => option.value === breed);
  return repairMojibakeText(match?.label || breed);
};

const getAnimalTypeLabel = (type, t) => {
  if (!type) return t('animalTypes.animal', { defaultValue: 'Animal' });
  return t(`animalTypes.${String(type).toLowerCase()}`, { defaultValue: type });
};

const formatDayLabel = (day, language) => {
  if (!day) return '';
  const date = new Date(`${day}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(day).slice(5).replace('-', '/');

  return new Intl.DateTimeFormat(language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN', {
    day: '2-digit',
    month: 'short',
  }).format(date);
};

const getCallStatusLabel = (status, t) => {
  const normalized = String(status || '').toLowerCase();
  const fallback = status ? normalized.replace(/_/g, ' ') : t('profile.statusUnknown', { defaultValue: 'Unknown' });

  return t(`profile.callStatuses.${normalized}`, { defaultValue: fallback });
};

const buildSmoothPath = (points) => {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;

    const previous = points[index - 1];
    const controlX = previous.x + (point.x - previous.x) / 2;
    return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
  }, '');
};

const StatCard = ({ label, value, tone = 'green', helper }) => {
  const toneClass = {
    green: 'text-[#0F6E56] bg-[#E1F5EE]',
    orange: 'text-[#D85A30] bg-[#FAECE7]',
    dark: 'text-[#085041] bg-[#E8F1ED]',
    neutral: 'text-[#2C2C2A] bg-[#F5F4EF]',
  }[tone] || 'text-[#0F6E56] bg-[#E1F5EE]';

  return (
    <div className="rounded-2xl border border-[#E5E4DC] bg-white p-5 shadow-sm">
      <div className={`mb-4 inline-flex rounded-full px-3 py-1 text-xs font-black ${toneClass}`}>
        {label}
      </div>
      <p className="text-3xl font-black leading-none text-[#2C2C2A]">{value}</p>
      {helper ? <p className="mt-2 text-sm font-semibold text-[#5F5E5A]">{helper}</p> : null}
    </div>
  );
};

const MetricTrendChart = ({ data = [], metric, onMetricChange, language, t }) => {
  const color = metric === 'calls' ? '#D85A30' : '#1D9E75';
  const softColor = metric === 'calls' ? '#FAECE7' : '#E1F5EE';
  const label = metric === 'calls'
    ? t('profile.callsTrend', { defaultValue: 'Calls trend' })
    : t('profile.viewsTrend', { defaultValue: 'Views trend' });
  const total = data.reduce((sum, item) => sum + Number(item.count || 0), 0);

  const chart = useMemo(() => {
    const safeData = data.length > 0 ? data : [];
    const width = Math.max(560, safeData.length * 88);
    const height = 250;
    const left = 52;
    const right = 34;
    const top = 44;
    const bottom = 58;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const baseline = top + plotHeight;
    const maxValue = Math.max(1, ...safeData.map((item) => Number(item.count || 0)));
    const points = safeData.map((item, index) => {
      const x = safeData.length <= 1 ? left + plotWidth / 2 : left + (index / (safeData.length - 1)) * plotWidth;
      const y = top + (1 - Number(item.count || 0) / maxValue) * plotHeight;
      return { ...item, x, y, count: Number(item.count || 0) };
    });
    const linePath = buildSmoothPath(points);
    const areaPath = points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`
      : '';

    return {
      width,
      height,
      left,
      right,
      top,
      bottom,
      plotHeight,
      baseline,
      points,
      linePath,
      areaPath,
    };
  }, [data]);

  return (
    <section className="rounded-3xl border border-[#E5E4DC] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.14em] text-[#0F6E56]">
            {t('profile.performance', { defaultValue: 'Performance' })}
          </p>
          <h2 className="mt-1 text-2xl font-black text-[#2C2C2A]">{label}</h2>
          <p className="mt-1 text-sm font-semibold text-[#5F5E5A]">
            {t('profile.chartRangeFromListing', { defaultValue: 'From listing date' })}
          </p>
        </div>
        <div className="inline-flex rounded-2xl bg-[#F5F4EF] p-1">
          {['views', 'calls'].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onMetricChange(item)}
              className={`rounded-xl px-4 py-2 text-sm font-black transition ${
                metric === item ? 'bg-white text-[#0F6E56] shadow-sm' : 'text-[#5F5E5A] hover:text-[#2C2C2A]'
              }`}
            >
              {item === 'views'
                ? t('profile.viewsMetric', { defaultValue: 'Views' })
                : t('profile.callsMetric', { defaultValue: 'Calls' })}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-[#E5E4DC] bg-[#FBFAF6] p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-black text-[#2C2C2A]">
            {metric === 'calls'
              ? t('profile.calledByBuyers', { count: total, defaultValue: `${total} buyer calls` })
              : t('profile.seenByBuyers', { count: total, defaultValue: `${total} buyer views` })}
          </p>
          <span className="rounded-full px-3 py-1 text-xs font-black" style={{ color, backgroundColor: softColor }}>
            {total}
          </span>
        </div>

        {chart.points.length === 0 ? (
          <div className="flex min-h-[16rem] items-center justify-center rounded-xl bg-white text-center">
            <p className="max-w-sm text-sm font-semibold text-[#5F5E5A]">
              {t('profile.noMetricDataYet', { defaultValue: 'Activity will appear here after buyers view or call this listing.' })}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-2">
            <svg
              viewBox={`0 0 ${chart.width} ${chart.height}`}
              className="h-[16.5rem]"
              style={{ minWidth: chart.width }}
              role="img"
              aria-label={label}
            >
              <defs>
                <linearGradient id={`metric-area-${metric}`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity="0.18" />
                  <stop offset="100%" stopColor={color} stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {[0, 0.5, 1].map((line) => {
                const y = chart.top + line * chart.plotHeight;
                return (
                  <line
                    key={line}
                    x1={chart.left}
                    x2={chart.width - chart.right}
                    y1={y}
                    y2={y}
                    stroke="#E5E4DC"
                    strokeDasharray="5 7"
                  />
                );
              })}
              <line
                x1={chart.left}
                x2={chart.width - chart.right}
                y1={chart.baseline}
                y2={chart.baseline}
                stroke="#D8D8D0"
                strokeWidth="2"
              />
              {chart.points.length > 1 ? (
                <path d={chart.areaPath} fill={`url(#metric-area-${metric})`} />
              ) : null}
              {chart.points.map((point) => {
                const barHeight = Math.max(0, chart.baseline - point.y);
                return point.count > 0 ? (
                  <rect
                    key={`${point.day}-bar`}
                    x={point.x - 12}
                    y={point.y}
                    width="24"
                    height={barHeight}
                    rx="12"
                    fill={softColor}
                  />
                ) : null;
              })}
              {chart.points.length > 1 ? (
                <path
                  d={chart.linePath}
                  fill="none"
                  stroke="#2E3D4F"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}
              {chart.points.map((point) => (
                <g key={point.day}>
                  <circle cx={point.x} cy={point.y} r="9" fill="white" stroke={color} strokeWidth="5" />
                  <rect
                    x={point.x - 18}
                    y={Math.max(10, point.y - 38)}
                    width="36"
                    height="26"
                    rx="10"
                    fill="white"
                    stroke="#F0EFE8"
                  />
                  <text x={point.x} y={Math.max(28, point.y - 20)} textAnchor="middle" fontSize="14" fill="#5F5E5A" fontWeight="800">
                    {point.count}
                  </text>
                  <text x={point.x} y={chart.height - 24} textAnchor="middle" fontSize="13" fill="#758093" fontWeight="800">
                    {formatDayLabel(point.day, language)}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((item) => (
          <div key={item.day} className="flex items-center justify-between rounded-xl border border-[#E5E4DC] bg-[#FBFAF6] px-3 py-2">
            <span className="text-xs font-black text-[#5F5E5A]">{formatDayLabel(item.day, language)}</span>
            <span className="text-sm font-black" style={{ color }}>{Number(item.count || 0)}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

const SellerListingInsightsPage = () => {
  const { animalType, id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const language = getAppLanguage(i18n);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState(null);
  const [markingSold, setMarkingSold] = useState(false);
  const [metric, setMetric] = useState('views');

  const loadInsights = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await listingsService.getListingInsights(animalType, id);
      if (response?.success) {
        setInsights(response.data);
      }
    } catch (error) {
      if (!silent) {
        toast.error(error?.message || t('profile.insightsLoadFailed', { defaultValue: 'Failed to load listing analytics' }));
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [animalType, id, t]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  useEffect(() => {
    const interval = window.setInterval(() => loadInsights(true), 15000);
    return () => window.clearInterval(interval);
  }, [loadInsights]);

  const listing = insights?.listing;
  const summary = insights?.summary || {};
  const isSold = summary.isSold || listing?.status === 'sold';
  const listingTitle = useMemo(() => getLocalizedBreedName(listing, language, t), [language, listing, t]);
  const locationLabel = [listing?.city, listing?.state].filter(Boolean).join(', ') || t('profile.locationNotSet', { defaultValue: 'Location not set' });
  const activeTrend = metric === 'calls' ? insights?.trends?.calls || [] : insights?.trends?.views || [];
  const totalRecentActivity = useMemo(() => (
    (insights?.trends?.views || []).reduce((sum, item) => sum + Number(item.count || 0), 0) +
    (insights?.trends?.calls || []).reduce((sum, item) => sum + Number(item.count || 0), 0)
  ), [insights]);

  const handleMarkSold = async () => {
    if (!listing || isSold) return;
    if (!window.confirm(t('profile.markSoldConfirm', { defaultValue: 'Mark this listing as sold?' }))) return;

    setMarkingSold(true);
    try {
      const response = await listingsService.markListingAsSold(listing.animal_type, listing.id);
      if (response?.success) {
        toast.success(t('profile.markSoldSuccess', { defaultValue: 'Listing marked as sold.' }));
        await loadInsights(true);
      }
    } catch (error) {
      toast.error(error?.message || t('profile.markSoldFailed', { defaultValue: 'Failed to mark as sold.' }));
    } finally {
      setMarkingSold(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#F5F4EF]">
        <AppLoader message={t('profile.loadingInsights', { defaultValue: 'Loading listing analytics...' })} />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-[70vh] bg-[#F5F4EF] p-8 text-center">
        <h1 className="text-2xl font-black text-[#2C2C2A]">{t('profile.insightsNotFound', { defaultValue: 'Listing insights not found' })}</h1>
        <button onClick={() => navigate(-1)} className="mt-5 rounded-xl bg-[#1D9E75] px-5 py-3 font-bold text-white">
          {t('common.back', { defaultValue: 'Back' })}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F4EF] pb-16">
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-full border border-[#E5E4DC] bg-white px-4 py-2 text-sm font-black text-[#0F6E56] shadow-sm transition hover:border-[#1D9E75]"
        >
          <span aria-hidden="true">&lsaquo;</span>
          {t('profile.backToListings', { defaultValue: 'Back to listings' })}
        </button>

        <section className="overflow-hidden rounded-3xl border border-[#E5E4DC] bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="p-5 sm:p-8">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#E1F5EE] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#0F6E56]">
                  {getAnimalTypeLabel(listing.animal_type, t)}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${isSold ? 'bg-[#F5F4EF] text-[#5F5E5A]' : 'bg-[#FAECE7] text-[#D85A30]'}`}>
                  {isSold ? t('profile.sold', { defaultValue: 'Sold' }) : t('profile.active', { defaultValue: 'Active' })}
                </span>
              </div>

              <h1 className="mt-5 max-w-3xl text-3xl font-black leading-tight text-[#2C2C2A] sm:text-5xl">
                {listingTitle}
              </h1>
              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
                <p className="text-2xl font-black text-[#0F6E56]">{formatCurrency(listing.price || listing.expected_price)}</p>
                <p className="text-base font-bold text-[#5F5E5A]">{locationLabel}</p>
              </div>
              <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-[#5F5E5A]">
                {isSold
                  ? t('profile.animalSoldVisible', { defaultValue: 'Animal is marked as sold' })
                  : t('profile.animalVisibleToBuyers', { defaultValue: 'Animal is visible to buyers' })}
              </p>
            </div>

            <div className="border-t border-[#E5E4DC] bg-[#FBFAF6] p-5 lg:border-l lg:border-t-0">
              <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-[#E5E4DC] bg-white">
                <img
                  src={listing.photo1 || listing.photos?.[0] || FALLBACK_IMAGE}
                  alt={listingTitle}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={t('profile.totalViews', { defaultValue: 'Total views' })}
            value={summary.views || 0}
            tone="green"
            helper={t('profile.viewsMetricHelp', { defaultValue: 'Unique buyer views' })}
          />
          <StatCard
            label={t('profile.totalCalls', { defaultValue: 'Total calls' })}
            value={summary.calls || 0}
            tone="orange"
            helper={t('profile.callsMetricHelp', { defaultValue: 'Buyer call activity' })}
          />
          <StatCard
            label={t('profile.recentActivity', { defaultValue: 'Recent activity' })}
            value={totalRecentActivity}
            tone="dark"
            helper={t('profile.lastSevenDays', { defaultValue: 'Latest activity' })}
          />
          <StatCard
            label={t('profile.saleStatus', { defaultValue: 'Sale status' })}
            value={isSold ? t('profile.sold', { defaultValue: 'Sold' }) : t('profile.notSoldYet', { defaultValue: 'Not sold yet' })}
            tone="neutral"
            helper={isSold ? t('profile.alreadySold', { defaultValue: 'Already sold' }) : t('profile.readyForBuyers', { defaultValue: 'Ready for buyers' })}
          />
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
          <MetricTrendChart
            data={activeTrend}
            metric={metric}
            onMetricChange={setMetric}
            language={language}
            t={t}
          />

          <section className="rounded-3xl border border-[#E5E4DC] bg-white p-5 shadow-sm sm:p-6">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-[#0F6E56]">
              {t('profile.saleStatus', { defaultValue: 'Sale status' })}
            </p>
            <h2 className="mt-1 text-2xl font-black text-[#2C2C2A]">
              {t('profile.soldQuestion', { defaultValue: 'Is your animal sold?' })}
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#5F5E5A]">
              {t('profile.soldQuestionHelp', { defaultValue: 'Update the status when the animal is sold so buyers see accurate availability.' })}
            </p>
            <div className="mt-6 grid gap-3">
              <button
                disabled={isSold || markingSold}
                onClick={handleMarkSold}
                className="rounded-2xl bg-[#0F6E56] px-5 py-4 text-base font-black text-white shadow-sm transition hover:bg-[#085041] disabled:cursor-not-allowed disabled:bg-[#C9C8C0]"
              >
                {isSold ? t('profile.alreadySold', { defaultValue: 'Already sold' }) : t('profile.markAsSold', { defaultValue: 'Mark as sold' })}
              </button>
              <Link to={`/animal/${listing.animal_type}/${listing.id}`} className="rounded-2xl border border-[#E5E4DC] px-5 py-4 text-center text-base font-black text-[#2C2C2A] transition hover:border-[#1D9E75] hover:text-[#0F6E56]">
                {t('profile.viewPublicListing', { defaultValue: 'View public listing' })}
              </Link>
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-[#E5E4DC] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.14em] text-[#0F6E56]">
                {t('profile.callHistory', { defaultValue: 'Call History' })}
              </p>
              <h2 className="mt-1 text-2xl font-black text-[#2C2C2A]">
                {t('profile.recentBuyerCalls', { defaultValue: 'Recent buyer calls' })}
              </h2>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {(insights?.recentCalls || []).length === 0 ? (
              <p className="rounded-2xl bg-[#FBFAF6] p-4 text-sm font-semibold text-[#5F5E5A]">
                {t('profile.noBuyerCallsYet', { defaultValue: 'No buyer calls yet.' })}
              </p>
            ) : insights.recentCalls.map((call) => (
              <div key={call.id} className="flex flex-col gap-3 rounded-2xl border border-[#E5E4DC] bg-[#FBFAF6] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-black text-[#2C2C2A]">{call.buyerName || t('profile.buyerShort', { defaultValue: 'Buyer' })}</p>
                  <p className="text-sm font-semibold text-[#5F5E5A]">{call.buyerPhone || t('profile.na', { defaultValue: 'N/A' })}</p>
                </div>
                <span className="inline-flex w-fit rounded-full bg-[#E1F5EE] px-3 py-1 text-xs font-black text-[#0F6E56]">
                  {getCallStatusLabel(call.status, t)}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default SellerListingInsightsPage;
