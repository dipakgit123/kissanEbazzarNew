import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import blogHeroImage from '../assets/images/blog.png';
import { API_BASE_URL } from '../config/api';
import './BlogEditorial.css';

const TOPIC_PRESETS = ['farming', 'cattle', 'health', 'dairy', 'market', 'technology', 'success'];

const CATEGORY_STYLES = {
  general: 'bg-stone-100 text-stone-700',
  farming: 'bg-emerald-100 text-emerald-800',
  'cattle-care': 'bg-amber-100 text-amber-800',
  'animal-health': 'bg-rose-100 text-rose-800',
  'market-trends': 'bg-sky-100 text-sky-800',
  technology: 'bg-cyan-100 text-cyan-800',
  'success-stories': 'bg-fuchsia-100 text-fuchsia-800',
  'tips-tricks': 'bg-orange-100 text-orange-800'
};

const BlogList = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [blogs, setBlogs] = useState([]);
  const [featuredBlogs, setFeaturedBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const categoryFilter = searchParams.get('category') || 'all';
  const searchQuery = searchParams.get('search') || '';

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/api/blogs?page=${currentPage}&limit=9`;
      if (categoryFilter !== 'all') url += `&category=${categoryFilter}`;
      if (searchQuery) url += `&search=${searchQuery}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setBlogs(data.data.blogs);
        setTotalPages(data.data.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch blogs:', error);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, currentPage, searchQuery]);

  const fetchFeaturedBlogs = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blogs/featured?limit=3`);
      const data = await response.json();

      if (data.success) {
        setFeaturedBlogs(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch featured blogs:', error);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blogs/categories`);
      const data = await response.json();

      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, []);

  useEffect(() => {
    fetchBlogs();
    fetchFeaturedBlogs();
    fetchCategories();
  }, [fetchBlogs, fetchFeaturedBlogs, fetchCategories]);

  const handleCategoryChange = (category) => {
    const nextParams = new URLSearchParams(searchParams);
    if (category === 'all') {
      nextParams.delete('category');
    } else {
      nextParams.set('category', category);
    }
    setSearchParams(nextParams);
    setCurrentPage(1);
  };

  const handleSearch = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const searchValue = String(formData.get('search') || '').trim();
    const nextParams = new URLSearchParams(searchParams);

    if (searchValue) {
      nextParams.set('search', searchValue);
    } else {
      nextParams.delete('search');
    }

    setSearchParams(nextParams);
    setCurrentPage(1);
  };

  const locale = i18n.resolvedLanguage === 'mr' ? 'mr-IN' : i18n.resolvedLanguage === 'hi' ? 'hi-IN' : 'en-IN';

  const formatDate = (date) =>
    new Date(date).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

  const getReadingTime = (content) => {
    const words = content?.split(/\s+/).length || 0;
    return Math.ceil(words / 200) || 1;
  };

  const getCategoryColor = (category) => CATEGORY_STYLES[category] || CATEGORY_STYLES.general;
  const getCategoryLabel = useCallback(
    (category) => {
      const normalizedCategory = category || 'general';
      return t(`blog.categories.${normalizedCategory}`, {
        defaultValue: normalizedCategory.replace(/-/g, ' ')
      });
    },
    [t]
  );
  const getTopicLabel = useCallback(
    (topic) =>
      t(`blog.topics.${topic}`, {
        defaultValue: topic
      }),
    [t]
  );

  const featuredLead = featuredBlogs[0];
  const featuredSecondary = featuredBlogs.slice(1);

  return (
    <div className="blog-shell min-h-screen">
      <section className="border-b border-black/5 bg-gradient-to-br from-[#113f30] via-[#165744] to-[#1b7660] text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.96fr)_minmax(0,0.92fr)] lg:gap-12">
            <div className="max-w-2xl text-center lg:text-left">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100/80">
                {t('blog.journal')}
              </p>
              <h1 className="blog-serif text-4xl leading-[1.02] sm:text-[4.15rem] lg:text-[4.6rem]">
                {t('blog.heroTitle')}
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-emerald-50/82 sm:text-lg">
                {t('blog.heroSubtitle')}
              </p>

              <form onSubmit={handleSearch} className="mx-auto mt-10 max-w-2xl lg:mx-0 lg:max-w-xl">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    name="search"
                    defaultValue={searchQuery}
                    placeholder={t('blog.searchPlaceholder')}
                    className="blog-search min-w-0 flex-1 rounded-full px-6 py-4 text-base focus:outline-none focus:ring-2 focus:ring-white/60"
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-white px-7 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#124332] transition hover:bg-emerald-50"
                  >
                    {t('blog.searchButton')}
                  </button>
                </div>
              </form>
            </div>

            <div className="mx-auto flex w-full max-w-[38rem] lg:mx-0 lg:h-full lg:justify-self-end">
              <div className="w-full overflow-hidden rounded-[1.9rem] bg-[rgba(7,55,42,0.12)] shadow-[0_30px_80px_rgba(0,0,0,0.18)]">
                  <img
                    src={blogHeroImage}
                    alt={t('blog.heroImageAlt')}
                    className="h-auto w-full object-contain object-center sm:h-[27rem] sm:object-cover lg:h-[31rem]"
                  />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        {featuredLead && currentPage === 1 && !searchQuery && categoryFilter === 'all' && (
          <section className="mb-14">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="blog-kicker mb-2">{t('blog.editorsPicks')}</p>
                <h2 className="blog-serif text-3xl text-[color:var(--blog-strong)]">{t('blog.featuredWriting')}</h2>
              </div>
            </div>

            <div className="blog-feature-grid">
              <article
                onClick={() => navigate(`/blog/${featuredLead.slug}`)}
                className="blog-panel cursor-pointer overflow-hidden rounded-[2rem]"
              >
                <div className="grid lg:grid-cols-[1.1fr_minmax(0,0.9fr)]">
                  <div className="overflow-hidden">
                    {featuredLead.featured_image ? (
                      <img
                        src={featuredLead.featured_image}
                        alt={featuredLead.title}
                        className="blog-card-image h-72 w-full object-cover lg:h-full"
                      />
                    ) : (
                      <div className="flex h-72 items-center justify-center bg-gradient-to-br from-emerald-100 to-stone-100 lg:h-full">
                        <div className="rounded-full border border-emerald-800/10 bg-white/70 px-6 py-3 text-sm uppercase tracking-[0.3em] text-emerald-900/60">
                          {t('blog.featuredStory')}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-between p-7 sm:p-9">
                    <div>
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getCategoryColor(featuredLead.category)}`}>
                        {getCategoryLabel(featuredLead.category)}
                      </span>
                      <h3 className="blog-serif mt-5 text-3xl leading-tight text-[color:var(--blog-strong)] sm:text-[2.35rem]">
                        {featuredLead.title}
                      </h3>
                      <p className="mt-5 text-base leading-7 text-[color:var(--blog-body)]">
                        {featuredLead.excerpt}
                      </p>
                    </div>

                    <div className="mt-8 border-t border-black/6 pt-5 text-sm text-[color:var(--blog-muted)]">
                      <div className="flex flex-wrap items-center gap-3">
                        <span>{formatDate(featuredLead.published_at || featuredLead.created_at)}</span>
                        <span className="blog-divider-dot" />
                        <span>{t('blog.minRead', { count: featuredLead.reading_time || getReadingTime(featuredLead.content) })}</span>
                        {featuredLead.author && (
                          <>
                            <span className="blog-divider-dot" />
                            <span>{featuredLead.author.full_name || featuredLead.author.username || t('common.admin', { defaultValue: 'Admin' })}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </article>

              <div className="space-y-5">
                {featuredSecondary.map((blog) => (
                  <article
                    key={blog.id}
                    onClick={() => navigate(`/blog/${blog.slug}`)}
                    className="blog-card cursor-pointer rounded-[1.6rem] p-5"
                  >
                    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${getCategoryColor(blog.category)}`}>
                      {getCategoryLabel(blog.category)}
                    </span>
                    <h3 className="blog-serif mt-4 text-2xl leading-tight text-[color:var(--blog-strong)]">
                      {blog.title}
                    </h3>
                    <p className="blog-line-clamp-3 mt-3 text-sm leading-6 text-[color:var(--blog-body)]">
                      {blog.excerpt}
                    </p>
                    <div className="mt-5 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.16em] text-[color:var(--blog-muted)]">
                      <span>{formatDate(blog.published_at || blog.created_at)}</span>
                      <span className="blog-divider-dot" />
                      <span>{t('blog.minRead', { count: blog.reading_time || getReadingTime(blog.content) })}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section>
            <div className="mb-7 flex flex-col gap-3 border-b border-black/6 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="blog-kicker mb-2">{t('blog.archive')}</p>
                <h2 className="blog-serif text-3xl text-[color:var(--blog-strong)]">
                  {categoryFilter !== 'all'
                    ? t('blog.categoryStories', { category: getCategoryLabel(categoryFilter) })
                    : t('blog.latestArticles')}
                </h2>
              </div>
              <p className="text-sm text-[color:var(--blog-muted)]">
                {loading ? t('blog.loadingArticles') : t('blog.piecesOnPage', { count: blogs.length })}
              </p>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div key={item} className="blog-card blog-archive-row overflow-hidden rounded-[1.6rem] animate-pulse">
                    <div className="blog-archive-media bg-stone-200" />
                    <div className="flex-1 p-5 sm:p-5">
                      <div className="h-3 w-24 rounded-full bg-stone-200" />
                      <div className="mt-4 h-7 w-11/12 rounded-full bg-stone-200" />
                      <div className="mt-2 h-7 w-3/4 rounded-full bg-stone-200" />
                      <div className="mt-4 h-4 w-full rounded-full bg-stone-200" />
                      <div className="mt-2 h-4 w-5/6 rounded-full bg-stone-200" />
                      <div className="mt-5 h-4 w-1/2 rounded-full bg-stone-200" />
                    </div>
                  </div>
                ))}
              </div>
            ) : blogs.length > 0 ? (
              <>
                <div className="space-y-4">
                  {blogs.map((blog) => (
                    <article
                      key={blog.id}
                      onClick={() => navigate(`/blog/${blog.slug}`)}
                      className="blog-card blog-archive-row cursor-pointer overflow-hidden rounded-[1.6rem]"
                    >
                      <div className="blog-archive-media overflow-hidden">
                        {blog.featured_image ? (
                          <img
                            src={blog.featured_image}
                            alt={blog.title}
                            className="blog-card-image h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full min-h-[11rem] items-center justify-center bg-gradient-to-br from-stone-100 to-emerald-50">
                            <div className="rounded-full border border-stone-900/10 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.22em] text-stone-500">
                              {t('blog.fieldNotes')}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col justify-between p-5 sm:p-5">
                        <div>
                          <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${getCategoryColor(blog.category)}`}>
                            {getCategoryLabel(blog.category)}
                          </span>

                          <h3 className="blog-serif mt-3 text-[1.5rem] leading-tight text-[color:var(--blog-strong)] blog-line-clamp-2 sm:text-[1.75rem]">
                            {blog.title}
                          </h3>

                          <p className="mt-3 text-[0.95rem] leading-7 text-[color:var(--blog-body)] blog-line-clamp-2">
                            {blog.excerpt}
                          </p>
                        </div>

                        <div className="mt-4 border-t border-black/6 pt-3">
                          <div className="flex flex-wrap items-center gap-3 text-sm text-[color:var(--blog-muted)]">
                            <span>{formatDate(blog.published_at || blog.created_at)}</span>
                            <span className="blog-divider-dot" />
                            <span>{t('blog.minRead', { count: blog.reading_time || getReadingTime(blog.content) })}</span>
                            {blog.author && (
                              <>
                                <span className="blog-divider-dot" />
                                <span className="truncate">
                                  {blog.author.full_name || blog.author.username || t('common.admin', { defaultValue: 'Admin' })}
                                </span>
                              </>
                            )}
                          </div>

                          {blog.author && (
                            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[color:var(--blog-muted)]">
                              {t('blog.contributor')}
                            </p>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      disabled={currentPage === 1}
                      className="blog-chip rounded-full px-5 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {t('blog.previous')}
                    </button>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = index + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = index + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + index;
                      } else {
                        pageNumber = currentPage - 2 + index;
                      }

                      const isActive = currentPage === pageNumber;

                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`rounded-full px-4 py-3 text-sm font-semibold ${isActive ? 'blog-chip blog-chip-active' : 'blog-chip'}`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                      disabled={currentPage === totalPages}
                      className="blog-chip rounded-full px-5 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {t('blog.next')}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="blog-panel rounded-[1.8rem] px-8 py-16 text-center">
                <p className="blog-kicker mb-3">{t('blog.noResults')}</p>
                <h3 className="blog-serif text-3xl text-[color:var(--blog-strong)]">{t('blog.noArticlesFound')}</h3>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[color:var(--blog-body)]">
                  {t('blog.noArticlesHelp')}
                </p>
              </div>
            )}
          </section>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <section className="blog-panel rounded-[1.8rem] p-6">
              <p className="blog-kicker mb-3">{t('blog.browse')}</p>
              <h3 className="blog-serif text-2xl text-[color:var(--blog-strong)]">{t('blog.topicsTitle')}</h3>
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  onClick={() => handleCategoryChange('all')}
                  className={`rounded-full px-4 py-2 text-sm font-medium ${categoryFilter === 'all' ? 'blog-chip blog-chip-active' : 'blog-chip'}`}
                >
                  {t('blog.allArticles')}
                </button>
                {categories.map((category) => (
                  <button
                    key={category.name}
                    onClick={() => handleCategoryChange(category.name)}
                    className={`rounded-full px-4 py-2 text-sm font-medium ${categoryFilter === category.name ? 'blog-chip blog-chip-active' : 'blog-chip'}`}
                  >
                    {getCategoryLabel(category.name)} ({category.count})
                  </button>
                ))}
              </div>
            </section>

            <section className="blog-panel rounded-[1.8rem] p-6">
              <p className="blog-kicker mb-3">{t('blog.startHere')}</p>
              <h3 className="blog-serif text-2xl text-[color:var(--blog-strong)]">{t('blog.popularSearches')}</h3>
              <div className="mt-5 flex flex-wrap gap-2">
                {TOPIC_PRESETS.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => {
                      const nextParams = new URLSearchParams(searchParams);
                      nextParams.set('search', topic);
                      setSearchParams(nextParams);
                      setCurrentPage(1);
                    }}
                    className="blog-chip rounded-full px-4 py-2 text-sm font-medium"
                  >
                    #{getTopicLabel(topic)}
                  </button>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default BlogList;
