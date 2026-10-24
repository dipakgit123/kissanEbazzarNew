import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';
import { FullPageLoader } from './AppLoader';
import { FiArrowLeft, FiArrowRight, FiBookOpen, FiLink, FiShare2 } from 'react-icons/fi';
import { getReadingTime } from '../utils/blogUtils';
import './BlogEditorial.css';

const getViewStorageKey = (slug) => `blog-view-tracked:${slug}`;


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

  if (loading) return <main className="blog-shell"><div className="blog-reading-container"><FullPageLoader message={t('blog.loadingArticle')} /></div></main>;
  if (!blog) return <main className="blog-shell"><div className="blog-reading-container"><div className="blog-empty"><h1>{t('blog.articleNotFound')}</h1><p>{t('blog.articleMissing')}</p><Link to="/blogs" className="action-button action-button-secondary">{t('blog.returnToJournal')}</Link></div></div></main>;

  return (
    <main className="blog-shell blog-detail-page">
      <div className="blog-reading-container">
        <nav className="blog-reading-toolbar" aria-label={t('blog.articleDetails')}>
          <Link to="/blogs" className="blog-back-link"><FiArrowLeft aria-hidden="true" />{t('blog.backToJournal')}</Link>
          <div className="blog-share-actions"><button type="button" onClick={shareLink} className="blog-share-button"><FiLink aria-hidden="true" />{t('blog.copyLink')}</button><button type="button" onClick={shareWhatsApp} className="blog-share-button"><FiShare2 aria-hidden="true" />{t('blog.shareWhatsapp')}</button></div>
        </nav>
        <article className="blog-reading-paper">
          <header className="blog-reading-heading">
            <div className="blog-reading-category"><Link to={`/blogs?category=${encodeURIComponent(blog.category || 'general')}`}>{getCategoryLabel(blog.category)}</Link>{blog.is_featured && <span>{t('blog.featured')}</span>}</div>
            <h1>{blog.title}</h1>
            {blog.excerpt && <p>{blog.excerpt}</p>}
            <div className="blog-reading-meta"><span>{blog.author?.full_name || blog.author?.username || t('common.admin', { defaultValue: 'Admin' })}</span><time dateTime={blog.published_at || blog.created_at}>{formatDate(blog.published_at || blog.created_at)}</time><span>{t('blog.minRead', { count: blog.reading_time || getReadingTime(blog.content?.replace(/<[^>]*>/g, ' ')) })}</span><span>{Number(blog.views || 0).toLocaleString(locale)} {t('blog.views')}</span></div>
          </header>
          {blog.featured_image && <img className="blog-reading-image" src={blog.featured_image} alt={blog.title} onError={event => { event.currentTarget.hidden = true; }} />}
          <div className="blog-prose" dangerouslySetInnerHTML={{ __html: sanitizedBlogContent }} />
          {Array.isArray(blog.tags) && blog.tags.length > 0 && <div className="blog-tags"><span>{t('blog.tagged')}</span>{blog.tags.map((tag, index) => <Link key={index} to={`/blogs?search=${encodeURIComponent(tag)}`}>#{tag}</Link>)}</div>}
        </article>
        {relatedBlogs.length > 0 && <section className="blog-related" aria-labelledby="blog-related-title"><h2 id="blog-related-title">{t('blog.relatedArticles')}</h2><div className="blog-article-grid">{relatedBlogs.map(related => <Link key={related.id} to={`/blog/${related.slug}`} className="blog-article-card"><div className="blog-card-cover">{related.featured_image ? <img src={related.featured_image} alt="" loading="lazy" onError={event => { event.currentTarget.hidden = true; }} /> : <FiBookOpen aria-hidden="true" />}</div><div className="blog-card-copy"><span className="blog-category-label">{getCategoryLabel(related.category)}</span><h3>{related.title}</h3><div className="blog-card-meta">{t('blog.minRead', { count: related.reading_time || getReadingTime(related.content?.replace(/<[^>]*>/g, ' ')) })}</div><span className="blog-read-link">{t('blogUi.readArticle')}<FiArrowRight aria-hidden="true" /></span></div></Link>)}</div></section>}
      </div>
    </main>
  );
};

export default BlogDetail;
