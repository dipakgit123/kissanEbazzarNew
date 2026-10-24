import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { FiArrowRight, FiBookOpen, FiSearch, FiX } from 'react-icons/fi';
import { API_BASE_URL } from '../config/api';
import { BLOG_CATEGORIES, getReadingTime } from '../utils/blogUtils';
import './BlogEditorial.css';

const TOPICS = ['farming', 'cattle', 'health', 'dairy', 'market', 'technology', 'success'];

const BlogList = () => {
  const { t, i18n } = useTranslation();
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || 'all';
  const query = params.get('search') || '';
  const pageValue = Number(params.get('page'));
  const currentPage = Number.isSafeInteger(pageValue) && pageValue > 0 ? pageValue : 1;
  const [search, setSearch] = useState(query);
  const [blogs, setBlogs] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const resultsRef = useRef(null);
  const locale = i18n.resolvedLanguage === 'mr' ? 'mr-IN' : i18n.resolvedLanguage === 'hi' ? 'hi-IN' : 'en-IN';
  const label = value => t(`blog.categories.${value}`, { defaultValue: value.replace(/-/g, ' ') });
  const number = value => Number(value).toLocaleString(locale);
  const date = value => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  };

  useEffect(() => { setSearch(query); }, [query]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    const request = new URLSearchParams({ page: String(currentPage), limit: '9' });
    if (category !== 'all') request.set('category', category);
    if (query) request.set('search', query);
    (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/blogs?${request}`, { signal: controller.signal });
        const result = await response.json();
        if (!response.ok || !result.success || !Array.isArray(result.data?.blogs)) throw new Error('Could not load articles');
        if (controller.signal.aborted) return;
        setBlogs(result.data.blogs);
        setTotalPages(Math.max(1, Number(result.data.totalPages) || 1));
      } catch {
        if (!controller.signal.aborted) { setError(true); setBlogs([]); }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [category, currentPage, query, retry]);

  useEffect(() => {
    const controller = new AbortController();
    const load = async (endpoint, setter) => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/blogs/${endpoint}`, { signal: controller.signal });
        const result = await response.json();
        if (!controller.signal.aborted && response.ok && result.success && Array.isArray(result.data)) setter(result.data);
      } catch { /* Optional recommendations do not block the article list. */ }
    };
    load('featured?limit=3', setFeatured);
    load('categories', setCategories);
    return () => controller.abort();
  }, []);

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(params);
    next.delete('page');
    if (!value || value === 'all') next.delete(key); else next.set(key, value);
    setParams(next);
  };
  const clearFilters = () => { setSearch(''); setParams({}); };
  const changePage = page => {
    const next = new URLSearchParams(params);
    if (page === 1) next.delete('page'); else next.set('page', String(page));
    setParams(next);
    resultsRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  };
  const categoryNames = [...new Set([...categories.map(item => item.name).filter(Boolean), ...(categories.length ? [] : BLOG_CATEGORIES), ...(category === 'all' ? [] : [category])])];
  const featuredLead = featured[0];
  const showFeatured = featuredLead && !query && category === 'all' && currentPage === 1;
  const firstPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const metadata = blog => <div className="blog-card-meta"><span>{date(blog.published_at || blog.created_at)}</span><span>{t('blog.minRead', { count: blog.reading_time || getReadingTime(blog.content?.replace(/<[^>]*>/g, ' ')) })}</span></div>;
  const cover = blog => blog.featured_image ? <img src={blog.featured_image} alt="" loading="lazy" onError={event => { event.currentTarget.hidden = true; }} /> : <FiBookOpen aria-hidden="true" />;

  return (
    <main className="blog-shell blog-list-page">
      <div className="blog-container">
        <header className="blog-page-header"><div className="blog-heading-icon"><FiBookOpen aria-hidden="true" /></div><div><h1>{t('header.blog')}</h1><p>{t('blog.heroSubtitle')}</p></div></header>
        <section className="blog-filter-panel" aria-label={t('blog.browse')}>
          <div className="blog-filter-row">
            <form role="search" onSubmit={event => { event.preventDefault(); updateFilter('search', search.trim()); }} className="blog-search-form">
              <label className="sr-only" htmlFor="blog-search">{t('blog.searchPlaceholder')}</label>
              <div className="blog-search-field"><FiSearch aria-hidden="true" /><input id="blog-search" name="search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder={t('blog.searchPlaceholder')} /></div>
              <button type="submit" className="action-button action-button-primary">{t('blog.searchButton')}</button>
            </form>
            <div className="blog-category-field"><label htmlFor="blog-category">{t('blog.topicsTitle')}</label><select id="blog-category" value={category} onChange={event => updateFilter('category', event.target.value)}><option value="all">{t('blog.allArticles')}</option>{categoryNames.map(name => <option key={name} value={name}>{label(name)}</option>)}</select></div>
          </div>
          {(query || category !== 'all') ? <div className="blog-active-filters"><span>{[query && `“${query}”`, category !== 'all' && label(category)].filter(Boolean).join(' · ')}</span><button type="button" onClick={clearFilters}><FiX aria-hidden="true" />{t('blogUi.clearFilters')}</button></div> : <details className="blog-topic-disclosure"><summary>{t('blog.popularSearches')}</summary><div className="blog-topic-list">{TOPICS.map(topic => <button type="button" key={topic} onClick={() => updateFilter('search', t(`blog.topics.${topic}`))}>{t(`blog.topics.${topic}`)}</button>)}</div></details>}
        </section>
        {showFeatured && <section className="blog-featured" aria-labelledby="blog-featured-title">
          <h2 id="blog-featured-title" className="blog-section-title">{t('blog.editorsPicks')}</h2>
          <div className={`blog-featured-grid${featured.length === 1 ? ' is-single' : ''}`}>
            <Link to={`/blog/${featuredLead.slug}`} className="blog-featured-lead"><div className="blog-featured-image">{cover(featuredLead)}</div><div className="blog-featured-copy"><span className="blog-category-label">{label(featuredLead.category || 'general')}</span><h3>{featuredLead.title}</h3><p>{featuredLead.excerpt}</p>{metadata(featuredLead)}<span className="blog-read-link">{t('blogUi.readArticle')}<FiArrowRight aria-hidden="true" /></span></div></Link>
            {featured.length > 1 && <div className="blog-featured-more">{featured.slice(1, 3).map(blog => <Link to={`/blog/${blog.slug}`} key={blog.id}><div><span className="blog-category-label">{label(blog.category || 'general')}</span><h3>{blog.title}</h3>{metadata(blog)}</div><FiArrowRight aria-hidden="true" /></Link>)}</div>}
          </div>
        </section>}
        <section className="blog-results" ref={resultsRef} aria-labelledby="blog-results-title" aria-busy={loading}>
          <div className="blog-results-heading"><h2 id="blog-results-title">{category === 'all' ? t('blog.latestArticles') : t('blog.categoryStories', { category: label(category) })}</h2>{!loading && !error && totalPages > 1 && <span>{t('blogUi.pageOf', { page: number(currentPage), total: number(totalPages) })}</span>}</div>
          {loading ? <div className="blog-loading" role="status"><span className="blog-loading-indicator" aria-hidden="true" />{t('blog.loadingArticles')}</div> : error ? <div className="blog-empty" role="alert"><FiBookOpen aria-hidden="true" /><h3>{t('blogUi.loadError')}</h3><button type="button" className="action-button action-button-secondary" onClick={() => setRetry(value => value + 1)}>{t('blogUi.retry')}</button></div> : blogs.length ? <>
            <div className="blog-article-grid">{blogs.map(blog => <Link to={`/blog/${blog.slug}`} className="blog-article-card" key={blog.id}><div className="blog-card-cover">{cover(blog)}</div><div className="blog-card-copy"><span className="blog-category-label">{label(blog.category || 'general')}</span><h3>{blog.title}</h3><p>{blog.excerpt}</p>{metadata(blog)}<span className="blog-read-link">{t('blogUi.readArticle')}<FiArrowRight aria-hidden="true" /></span></div></Link>)}</div>
            {totalPages > 1 && <nav className="blog-pagination" aria-label={t('blogUi.pagination')}><button type="button" onClick={() => changePage(currentPage - 1)} disabled={currentPage <= 1}>{t('blog.previous')}</button><div className="blog-page-numbers">{Array.from({ length: Math.min(5, totalPages) }, (_, index) => firstPage + index).map(page => <button type="button" key={page} aria-current={page === currentPage ? 'page' : undefined} aria-label={t('blogUi.pageNumber', { page: number(page) })} onClick={() => changePage(page)}>{number(page)}</button>)}</div><button type="button" onClick={() => changePage(currentPage + 1)} disabled={currentPage >= totalPages}>{t('blog.next')}</button></nav>}
          </> : <div className="blog-empty"><FiSearch aria-hidden="true" /><h3>{t('blog.noArticlesFound')}</h3><p>{t('blog.noArticlesHelp')}</p>{(query || category !== 'all' || currentPage > 1) && <button type="button" className="action-button action-button-secondary" onClick={clearFilters}>{t('blog.allArticles')}</button>}</div>}
        </section>
      </div>
    </main>
  );
};

export default BlogList;
