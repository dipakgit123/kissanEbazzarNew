import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { FiHome, FiSearch, FiX, FiArrowRight, FiChevronDown, FiMapPin } from 'react-icons/fi';
import SchemeVisualIcon from './SchemeVisualIcon';
import schemeHero from '../assets/images/government-scheme-assistance.webp';
import { API_BASE_URL } from '../config/api';
import { SCHEME_CATEGORIES, SCHEME_ANIMALS, schemeLanguage, schemeLocale, schemeText, schemeItems, schemeAmount, schemeDeadline } from '../utils/governmentSchemes';
import './GovernmentSchemes.css';

const GovernmentSchemesPage = () => {
  const { t, i18n } = useTranslation();
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || 'all';
  const animalCategory = params.get('animalCategory') || 'all';
  const search = params.get('search') || '';
  const pageValue = Number(params.get('page'));
  const currentPage = Number.isSafeInteger(pageValue) && pageValue > 0 ? pageValue : 1;
  const language = schemeLanguage(i18n.resolvedLanguage || i18n.language);
  const [draftSearch, setDraftSearch] = useState(search);
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const resultsRef = useRef(null);
  const number = value => Number(value).toLocaleString(schemeLocale(language));
  const categoryLabel = value => t(`governmentSchemes.categories.${value}`, { defaultValue: value });
  const animalLabel = value => t(`governmentSchemes.animalCategories.${value}`, { defaultValue: value });

  useEffect(() => { setDraftSearch(search); }, [search]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(false);
    const query = new URLSearchParams({ page: String(currentPage), limit: '9', sortBy: 'is_featured', order: 'DESC' });
    if (category !== 'all') query.set('category', category);
    if (animalCategory !== 'all') query.set('animalCategory', animalCategory);
    if (search.trim()) query.set('search', search.trim());
    (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/government-schemes?${query}`, { signal: controller.signal });
        const result = await response.json();
        if (!response.ok || !result.success || !Array.isArray(result.data?.schemes)) throw new Error('Unable to load schemes');
        if (controller.signal.aborted) return;
        setSchemes(result.data.schemes);
        setTotalPages(Math.max(1, Number(result.data.totalPages) || 1));
      } catch {
        if (!controller.signal.aborted) { setSchemes([]); setError(true); }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    })();
    return () => controller.abort();
  }, [category, animalCategory, currentPage, search, retry]);

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(params); next.delete('page');
    if (!value || value === 'all') next.delete(key); else next.set(key, value);
    setParams(next);
  };
  const clearFilters = () => { setDraftSearch(''); setParams({}); };
  const changePage = page => {
    const next = new URLSearchParams(params);
    if (page === 1) next.delete('page'); else next.set('page', String(page));
    setParams(next); resultsRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  };
  const filtered = search || category !== 'all' || animalCategory !== 'all';

  return <main className="gs-page"><div className="gs-container">
    <header className="gs-discovery-hero">
      <div className="gs-hero-copy"><span className="gs-hero-eyebrow"><FiHome aria-hidden="true" />{t('governmentSchemes.kicker')}</span><h1>{t('schemeVisual.heroTitle')}</h1><p>{t('schemeUi.subtitle')}</p><a href="#scheme-results-title" className="gs-hero-explore">{t('schemeVisual.explore')}<FiArrowRight aria-hidden="true" /></a></div>
      <div className="gs-hero-art"><img src={schemeHero} alt="" /><span className="gs-hero-caption"><SchemeVisualIcon kind="benefits" />{t('schemeVisual.heroCaption')}</span></div>
    </header>
    <section className="gs-filters" aria-label={t('schemeUi.filterSchemes')}>
      <div className="gs-category-picker"><p>{t('schemeVisual.chooseSupport')}</p><div className="gs-category-options" role="group" aria-label={t('schemeUi.schemeType')}>{['all', ...SCHEME_CATEGORIES].map(value => <button type="button" data-category={value} key={value} aria-pressed={category === value} onClick={() => updateFilter('category', value)}><span><SchemeVisualIcon kind={value} /></span>{value === 'all' ? t('governmentSchemes.all') : categoryLabel(value)}</button>)}</div></div>
      <form role="search" className="gs-search" onSubmit={event => { event.preventDefault(); updateFilter('search', draftSearch.trim()); }}><label htmlFor="scheme-search" className="sr-only">{t('governmentSchemes.searchPlaceholder')}</label><div><FiSearch aria-hidden="true" /><input id="scheme-search" type="search" name="search" value={draftSearch} onChange={event => setDraftSearch(event.target.value)} placeholder={t('governmentSchemes.searchPlaceholder')} /></div><button type="submit" className="action-button action-button-primary">{t('common.search')}</button></form>
      <div className="gs-filter-fields"><label htmlFor="scheme-animal"><span>{t('governmentSchemes.for')}</span><select id="scheme-animal" value={animalCategory} onChange={event => updateFilter('animalCategory', event.target.value)}><option value="all">{t('governmentSchemes.allAnimals')}</option>{[...new Set([...SCHEME_ANIMALS, ...(animalCategory === 'all' ? [] : [animalCategory])])].map(value => <option key={value} value={value}>{animalLabel(value)}</option>)}</select></label></div>
      {filtered && <div className="gs-applied-filters"><span>{[search && `“${search}”`, category !== 'all' && categoryLabel(category), animalCategory !== 'all' && animalLabel(animalCategory)].filter(Boolean).join(' · ')}</span><button type="button" onClick={clearFilters}><FiX aria-hidden="true" />{t('schemeUi.clearFilters')}</button></div>}
    </section>
    <section className="gs-results" ref={resultsRef} aria-labelledby="scheme-results-title" aria-busy={loading}>
      <div className="gs-results-heading"><h2 id="scheme-results-title">{t('governmentSchemes.browseTitle')}</h2>{!loading && !error && totalPages > 1 && <span>{t('schemeUi.pageOf', { page: number(currentPage), total: number(totalPages) })}</span>}</div>
      {loading ? <div className="gs-empty" role="status">{t('governmentSchemes.loading')}</div> : error ? <div className="gs-empty" role="alert"><p>{t('schemeUi.loadError')}</p><button type="button" className="action-button action-button-secondary" onClick={() => setRetry(value => value + 1)}>{t('schemeUi.retry')}</button></div> : schemes.length ? <div className="gs-card-grid">{schemes.map(scheme => <article key={scheme.id} className="gs-card" data-category={scheme.category}>
        <Link to={`/government-schemes/${scheme.slug}`} className="gs-card-main"><div className="gs-card-heading"><div className="gs-card-image"><SchemeVisualIcon kind={scheme.category} />{scheme.image_url && <img src={scheme.image_url} alt="" loading="lazy" onError={event => { event.currentTarget.hidden = true; }} />}</div><div><div className="gs-card-labels"><span>{categoryLabel(scheme.category || 'general')}</span>{scheme.is_featured && <span className="gs-featured-label">{t('governmentSchemes.featuredScheme')}</span>}</div><h3>{schemeText(scheme, 'title', language)}</h3></div></div>
        <p className="gs-card-description">{schemeText(scheme, 'short_description', language)}</p>
        <dl className="gs-card-facts"><div><dt>{t('governmentSchemes.amount')}</dt><dd>{schemeAmount(scheme.amount_label, language) || t('schemeUi.notSpecified')}</dd></div>{scheme.interest_rate && <div><dt>{t('governmentSchemes.interest')}</dt><dd>{scheme.interest_rate}</dd></div>}<div><dt>{t('governmentSchemes.for')}</dt><dd>{animalLabel(scheme.animal_category || 'both')}</dd></div></dl>
        <div className="gs-card-scope"><span>{scheme.department || t(`schemeUi.levels.${scheme.government_level || 'other'}`)}</span><span><FiMapPin aria-hidden="true" />{scheme.state || t('governmentSchemes.allIndia')}</span></div></Link>
        <details className="gs-card-preview"><summary><SchemeVisualIcon kind="eligibility" /><span>{t('schemeVisual.checkEligibility')}</span><FiChevronDown aria-hidden="true" /></summary>{schemeItems(scheme, 'eligibility', language).length ? <ul>{schemeItems(scheme, 'eligibility', language).map((item, index) => <li key={index}>{item}</li>)}</ul> : <p>{t('governmentSchemes.noEligibility')}</p>}</details>
        <div className="gs-card-footer">{scheme.deadline && <span>{t('governmentSchemes.deadline')}: {schemeDeadline(scheme.deadline, language)}</span>}<Link to={`/government-schemes/${scheme.slug}`} className="gs-card-open">{t('schemeUi.viewDetails')}<FiArrowRight aria-hidden="true" /></Link></div>
      </article>)}</div> : <div className="gs-empty"><FiSearch aria-hidden="true" /><p>{t('governmentSchemes.empty')}</p>{(filtered || currentPage > 1) && <button type="button" className="action-button action-button-secondary" onClick={clearFilters}>{t('schemeUi.showAll')}</button>}</div>}
      {!loading && !error && totalPages > 1 && <nav className="gs-pagination" aria-label={t('schemeUi.pagination')}><button type="button" onClick={() => changePage(currentPage - 1)} disabled={currentPage <= 1}>{t('common.back')}</button><span>{number(currentPage)} / {number(totalPages)}</span><button type="button" onClick={() => changePage(currentPage + 1)} disabled={currentPage >= totalPages}>{t('common.next')}</button></nav>}
    </section>
  </div></main>;
};

export default GovernmentSchemesPage;
