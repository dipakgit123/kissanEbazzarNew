import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';
import { FullPageLoader } from './AppLoader';
import './BlogEditorial.css';

const getViewStorageKey = (slug) => `blog-view-tracked:${slug}`;

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

const BlogDetail = () => {
  const { t, i18n } = useTranslation();
  const { slug } = useParams();
  const navigate = useNavigate();

  const [blog, setBlog] = useState(null);
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBlog = useCallback(async () => {
    setLoading(true);
    const viewStorageKey = getViewStorageKey(slug);
    const shouldTrackView = sessionStorage.getItem(viewStorageKey) === null;

    if (shouldTrackView) {
      sessionStorage.setItem(viewStorageKey, 'pending');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/blogs/slug/${slug}?trackView=${shouldTrackView}`);
      const data = await response.json();

      if (data.success) {
        setBlog(data.data);
        setRelatedBlogs(data.relatedBlogs || []);
        document.title = `${data.data.title} - ${t('header.blog', { defaultValue: 'Blog' })}`;

        if (shouldTrackView) {
          sessionStorage.setItem(viewStorageKey, 'tracked');
        }
      } else {
        if (shouldTrackView) {
          sessionStorage.removeItem(viewStorageKey);
        }
        navigate('/blogs', { replace: true });
      }
    } catch {
      if (shouldTrackView) {
        sessionStorage.removeItem(viewStorageKey);
      }
      navigate('/blogs', { replace: true });
    } finally {
      setLoading(false);
    }
  }, [navigate, slug, t]);

  useEffect(() => {
    fetchBlog();
  }, [fetchBlog]);

  const locale = i18n.resolvedLanguage === 'mr' ? 'mr-IN' : i18n.resolvedLanguage === 'hi' ? 'hi-IN' : 'en-IN';

  const sanitizedBlogContent = useMemo(() => {
    const rawContent = blog?.content ? blog.content.replace(/\n/g, '<br />') : '';
    const sanitized = DOMPurify.sanitize(rawContent, {
      USE_PROFILES: { html: true },
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'img'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title'],
      FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select'],
      FORBID_ATTR: ['style']
    });

    const container = document.createElement('div');
    container.innerHTML = sanitized;

    container.querySelectorAll('a').forEach((link) => {
      const href = link.getAttribute('href') || '';
      const isExternal = /^(https?:)?\/\//i.test(href);

      if (isExternal) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer nofollow');
      } else {
        link.removeAttribute('target');
        link.setAttribute('rel', 'nofollow');
      }
    });

    container.querySelectorAll('img').forEach((image) => {
      image.removeAttribute('srcset');
      image.removeAttribute('sizes');
      image.setAttribute('loading', 'lazy');
      image.setAttribute('decoding', 'async');
    });

    return container.innerHTML;
  }, [blog?.content]);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

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

  const shareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t('blog.linkCopied'));
    } catch {
      toast.error(t('blog.linkCopyFailed'));
    }
  };

  const shareWhatsApp = () => {
    const message = t('blog.shareMessage', { title: blog.title, url: window.location.href });
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="blog-shell min-h-screen">
        <FullPageLoader message={t('blog.loadingArticle')} className="min-h-screen" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="blog-shell min-h-screen">
        <div className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-4 text-center sm:px-6">
          <div className="blog-panel rounded-[2rem] px-8 py-14">
            <p className="blog-kicker mb-3">{t('blog.notFound')}</p>
            <h1 className="blog-serif text-4xl text-[color:var(--blog-strong)]">{t('blog.articleNotFound')}</h1>
            <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[color:var(--blog-body)]">{t('blog.articleMissing')}</p>
            <Link
              to="/blogs"
              className="mt-8 inline-flex rounded-full bg-[color:var(--blog-accent)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:brightness-110"
            >
              {t('blog.returnToJournal')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-shell min-h-screen">
      <div className="border-b border-black/6 bg-white/55 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to="/blogs"
            className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-[0.18em] text-[color:var(--blog-muted)] transition hover:text-[color:var(--blog-accent)]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('blog.backToJournal')}
          </Link>

          <div className="hidden items-center gap-3 md:flex">
            <button onClick={shareLink} className="blog-share-button rounded-full px-4 py-2 text-sm font-medium">
              {t('blog.copyLink')}
            </button>
            <button onClick={shareWhatsApp} className="blog-share-button rounded-full px-4 py-2 text-sm font-medium">
              {t('blog.share')}
            </button>
          </div>
        </div>
      </div>

      <article className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mx-auto grid max-w-6xl gap-10 xl:grid-cols-[minmax(0,1fr)_19rem] xl:items-start">
          <div className="max-w-3xl">
            <p className="blog-kicker mb-5">{t('blog.journal')}</p>

            <div className="flex flex-wrap items-center gap-3">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getCategoryColor(blog.category)}`}>
                {getCategoryLabel(blog.category)}
              </span>
              {blog.is_featured && (
                <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
                  {t('blog.featured')}
                </span>
              )}
            </div>

            <h1 className="blog-serif mt-6 text-4xl leading-[1.04] text-[color:var(--blog-strong)] sm:text-5xl lg:text-[3.7rem]">
              {blog.title}
            </h1>

            {blog.excerpt && (
              <p className="blog-serif mt-6 max-w-2xl text-xl leading-9 text-[color:var(--blog-body)]">
                {blog.excerpt}
              </p>
            )}
          </div>

          <aside className="xl:pt-10">
            <div className="blog-meta-card rounded-[1.8rem] p-6">
              <p className="blog-kicker mb-4">{t('blog.articleDetails')}</p>

              <div className="flex items-center gap-4 border-b border-black/6 pb-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800">
                  {(blog.author?.full_name || blog.author?.username || 'A')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[color:var(--blog-strong)]">
                    {blog.author?.full_name || blog.author?.username || t('common.admin', { defaultValue: 'Admin' })}
                  </p>
                  <p className="text-sm text-[color:var(--blog-muted)]">{t('blog.publishedByEditorial')}</p>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm text-[color:var(--blog-body)]">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[color:var(--blog-muted)]">{t('blog.published')}</span>
                  <span className="text-right">{formatDate(blog.published_at || blog.created_at)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[color:var(--blog-muted)]">{t('blog.readingTime')}</span>
                  <span>{t('blog.minCompact', { count: blog.reading_time || 5 })}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[color:var(--blog-muted)]">{t('blog.views')}</span>
                  <span>{blog.views || 0}</span>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={shareLink} className="blog-share-button rounded-full px-4 py-2 text-sm font-medium">
                  {t('blog.copyLink')}
                </button>
                <button onClick={shareWhatsApp} className="blog-share-button rounded-full px-4 py-2 text-sm font-medium">
                  {t('blog.share')}
                </button>
              </div>
            </div>
          </aside>
        </div>

        {blog.featured_image && (
          <div className="blog-hero-frame mx-auto mt-12 max-w-5xl overflow-hidden rounded-[2rem] p-3 sm:p-4">
            <img
              src={blog.featured_image}
              alt={blog.title}
              className="max-h-[34rem] w-full rounded-[1.45rem] object-cover"
            />
          </div>
        )}

        <div className="mx-auto mt-12 grid max-w-5xl gap-10 lg:grid-cols-[5rem_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-3">
              <button
                onClick={shareLink}
                className="blog-share-button flex h-12 w-12 items-center justify-center rounded-full"
                aria-label={t('blog.copyArticleLink')}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={shareWhatsApp}
                className="blog-share-button flex h-12 w-12 items-center justify-center rounded-full"
                aria-label={t('blog.shareWhatsapp')}
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </button>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="blog-prose-wrap rounded-[1.8rem] px-6 py-8 sm:px-10 sm:py-10">
              <div
                className="blog-prose"
                dangerouslySetInnerHTML={{
                  __html: sanitizedBlogContent
                }}
              />
            </div>

            {blog.tags && blog.tags.length > 0 && (
              <div className="mt-14 border-t border-black/6 pt-8">
                <p className="blog-kicker mb-4">{t('blog.tagged')}</p>
                <div className="flex flex-wrap gap-2">
                  {blog.tags.map((tag, index) => (
                    <span key={index} className="blog-chip rounded-full px-4 py-2 text-sm font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-10 flex flex-wrap gap-3 border-t border-black/6 pt-8 md:hidden">
              <button onClick={shareLink} className="blog-share-button rounded-full px-5 py-3 text-sm font-medium">
                {t('blog.copyLink')}
              </button>
              <button onClick={shareWhatsApp} className="blog-share-button rounded-full px-5 py-3 text-sm font-medium">
                {t('blog.shareWhatsapp')}
              </button>
            </div>
          </div>
        </div>

        {relatedBlogs.length > 0 && (
          <section className="mx-auto mt-20 max-w-6xl border-t border-black/6 pt-12">
            <div className="mb-8">
              <p className="blog-kicker mb-2">{t('blog.continueReading')}</p>
              <h2 className="blog-serif text-3xl text-[color:var(--blog-strong)]">{t('blog.relatedArticles')}</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {relatedBlogs.map((relatedBlog) => (
                <Link
                  key={relatedBlog.id}
                  to={`/blog/${relatedBlog.slug}`}
                  className="blog-card overflow-hidden rounded-[1.6rem]"
                >
                  {relatedBlog.featured_image ? (
                    <img
                      src={relatedBlog.featured_image}
                      alt={relatedBlog.title}
                      className="blog-card-image h-44 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-44 items-center justify-center bg-gradient-to-br from-stone-100 to-emerald-50">
                      <div className="rounded-full border border-stone-900/10 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.22em] text-stone-500">
                        {t('blog.relatedRead')}
                      </div>
                    </div>
                  )}
                  <div className="p-5">
                    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${getCategoryColor(relatedBlog.category)}`}>
                      {getCategoryLabel(relatedBlog.category)}
                    </span>
                    <h3 className="blog-serif mt-4 text-2xl leading-tight text-[color:var(--blog-strong)] blog-line-clamp-3">
                      {relatedBlog.title}
                    </h3>
                    <p className="mt-4 text-xs uppercase tracking-[0.16em] text-[color:var(--blog-muted)]">
                      {t('blog.minRead', { count: relatedBlog.reading_time || 5 })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
};

export default BlogDetail;
