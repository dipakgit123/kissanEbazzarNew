import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

const CATEGORY_OPTIONS = ['all', 'loan', 'subsidy', 'insurance', 'training', 'health', 'general'];
const ANIMAL_CATEGORY_OPTIONS = ['all', 'farm', 'pet', 'both'];

const getLocalizedValue = (scheme, field, language) => {
  const translations = scheme?.translations || {};
  const languageValue = translations[language]?.[field];
  const fallbackValue = translations.en?.[field];
  return languageValue || fallbackValue || scheme?.[field] || '';
};

const GovernmentSchemesPage = () => {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [schemes, setSchemes] = useState([]);
  const [featuredSchemes, setFeaturedSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const category = searchParams.get('category') || 'all';
  const animalCategory = searchParams.get('animalCategory') || 'all';
  const search = searchParams.get('search') || '';
  const language = i18n.resolvedLanguage || i18n.language || 'en';

  const fetchSchemes = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(currentPage),
        limit: '9',
        sortBy: 'is_featured',
        order: 'DESC'
      });
      if (category !== 'all') query.set('category', category);
      if (animalCategory !== 'all') query.set('animalCategory', animalCategory);
      if (search.trim()) query.set('search', search.trim());

      const response = await fetch(`${API_BASE_URL}/api/government-schemes?${query.toString()}`);
      const data = await response.json();
      if (data.success) {
        setSchemes(data.data.schemes || []);
        setTotalPages(data.data.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch government schemes:', error);
    } finally {
      setLoading(false);
    }
  }, [animalCategory, category, currentPage, search]);

  const fetchFeaturedSchemes = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/government-schemes/featured?limit=3`);
      const data = await response.json();
      if (data.success) {
        setFeaturedSchemes(data.data.schemes || []);
      }
    } catch (error) {
      console.error('Failed to fetch featured schemes:', error);
    }
  }, []);

  useEffect(() => {
    fetchSchemes();
    fetchFeaturedSchemes();
  }, [fetchFeaturedSchemes, fetchSchemes]);

  const updateFilter = (key, value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value === 'all' || !value) {
      nextParams.delete(key);
    } else {
      nextParams.set(key, value);
    }
    setCurrentPage(1);
    setSearchParams(nextParams);
  };

  const handleSearch = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    updateFilter('search', String(formData.get('search') || '').trim());
  };

  const heroScheme = featuredSchemes[0] || schemes[0];

  return (
    <main className="min-h-screen bg-[#f8f2e7]">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#87510a] via-[#b66f0d] to-[#d58a20] text-white">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, #fff 0 2px, transparent 2px)', backgroundSize: '34px 34px' }} />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_24rem] lg:px-8 lg:py-20">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-amber-100">{t('governmentSchemes.kicker')}</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight sm:text-6xl">
              {t('governmentSchemes.heroTitle')}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-amber-50">
              {t('governmentSchemes.heroSubtitle')}
            </p>
            <form onSubmit={handleSearch} className="mt-8 flex max-w-2xl flex-col gap-3 rounded-2xl bg-white/12 p-2 backdrop-blur sm:flex-row">
              <input
                name="search"
                defaultValue={search}
                placeholder={t('governmentSchemes.searchPlaceholder')}
                className="min-w-0 flex-1 rounded-xl border border-white/20 bg-white px-4 py-3 text-slate-900 outline-none"
              />
              <button className="rounded-xl bg-[#126b4f] px-6 py-3 font-bold text-white hover:bg-[#0f5a43]">
                {t('common.search')}
              </button>
            </form>
          </div>

          {heroScheme && (
            <Link to={`/government-schemes/${heroScheme.slug}`} className="group rounded-[2rem] bg-white p-5 text-slate-900 shadow-2xl shadow-black/20 transition hover:-translate-y-1">
              <div className="h-48 overflow-hidden rounded-[1.4rem] bg-amber-100">
                {heroScheme.image_url ? (
                  <img src={heroScheme.image_url} alt={heroScheme.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <SchemeIcon className="h-20 w-20 text-[#b66f0d]" />
                  </div>
                )}
              </div>
              <div className="mt-5">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#126b4f]">{t('governmentSchemes.featuredScheme')}</p>
                <h2 className="mt-2 text-2xl font-black leading-tight">{getLocalizedValue(heroScheme, 'title', language)}</h2>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{getLocalizedValue(heroScheme, 'short_description', language)}</p>
              </div>
            </Link>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#b66f0d]">{t('governmentSchemes.browseKicker')}</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">{t('governmentSchemes.browseTitle')}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((option) => (
              <FilterButton key={option} active={category === option} onClick={() => updateFilter('category', option)}>
                {option === 'all' ? t('governmentSchemes.all') : t(`governmentSchemes.categories.${option}`, { defaultValue: option })}
              </FilterButton>
            ))}
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          {ANIMAL_CATEGORY_OPTIONS.map((option) => (
            <FilterButton key={option} active={animalCategory === option} onClick={() => updateFilter('animalCategory', option)}>
              {option === 'all' ? t('governmentSchemes.allAnimals') : t(`governmentSchemes.animalCategories.${option}`, { defaultValue: option })}
            </FilterButton>
          ))}
        </div>

        {loading ? (
          <div className="rounded-[2rem] bg-white px-6 py-20 text-center text-slate-500 shadow-sm">{t('governmentSchemes.loading')}</div>
        ) : schemes.length === 0 ? (
          <div className="rounded-[2rem] bg-white px-6 py-20 text-center text-slate-500 shadow-sm">{t('governmentSchemes.empty')}</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {schemes.map((scheme) => (
              <SchemeCard key={scheme.id} scheme={scheme} language={language} t={t} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-10 flex justify-center gap-3">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              className="rounded-full border border-slate-200 bg-white px-5 py-2 font-semibold text-slate-700 disabled:opacity-40"
            >
              {t('common.back')}
            </button>
            <span className="rounded-full bg-white px-5 py-2 font-semibold text-slate-700">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              className="rounded-full border border-slate-200 bg-white px-5 py-2 font-semibold text-slate-700 disabled:opacity-40"
            >
              {t('common.next')}
            </button>
          </div>
        )}
      </section>
    </main>
  );
};

const SchemeCard = ({ scheme, language, t }) => {
  const title = getLocalizedValue(scheme, 'title', language);
  const description = getLocalizedValue(scheme, 'short_description', language);

  return (
    <Link to={`/government-schemes/${scheme.slug}`} className="group overflow-hidden rounded-[1.8rem] bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-48 bg-gradient-to-br from-amber-100 to-emerald-100">
        {scheme.image_url ? (
          <img src={scheme.image_url} alt={title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <SchemeIcon className="h-16 w-16 text-[#b66f0d]" />
          </div>
        )}
        <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold capitalize text-[#126b4f]">
          {scheme.category}
        </div>
      </div>
      <div className="p-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b66f0d]">{scheme.department || scheme.government_level}</p>
        <h3 className="mt-2 text-xl font-black leading-tight text-slate-900">{title}</h3>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{description}</p>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
          <InfoPill label={t('governmentSchemes.amount')} value={scheme.amount_label || '-'} />
          <InfoPill label={t('governmentSchemes.rate')} value={scheme.interest_rate || '-'} />
          <InfoPill label={t('governmentSchemes.for')} value={t(`governmentSchemes.animalCategories.${scheme.animal_category}`, { defaultValue: scheme.animal_category || 'both' })} />
        </div>
      </div>
    </Link>
  );
};

const FilterButton = ({ active, children, onClick }) => (
  <button
    onClick={onClick}
    className={`rounded-full px-4 py-2 text-sm font-bold capitalize transition ${
      active ? 'bg-[#126b4f] text-white shadow-lg shadow-emerald-900/10' : 'bg-white text-slate-600 ring-1 ring-black/5 hover:bg-emerald-50'
    }`}
  >
    {children}
  </button>
);

const InfoPill = ({ label, value }) => (
  <div className="rounded-2xl bg-[#f8f2e7] px-2 py-3">
    <p className="truncate font-black text-slate-900">{value}</p>
    <p className="mt-1 text-slate-500">{label}</p>
  </div>
);

const SchemeIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 21h18M5 21V9l7-4 7 4v12M9 21v-6h6v6M9 11h.01M12 11h.01M15 11h.01" />
  </svg>
);

export default GovernmentSchemesPage;
