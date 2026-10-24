import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { FiHome, FiArrowLeft, FiArrowRight, FiLink, FiExternalLink, FiChevronDown } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';
import { schemeLanguage, schemeLocale, schemeText, schemeItems, schemeAmount, schemeDeadline, schemeWebsite } from '../utils/governmentSchemes';
import './GovernmentSchemes.css';
import SchemeVisualIcon from './SchemeVisualIcon';

const GovernmentSchemeDetail = () => {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const language = schemeLanguage(i18n.resolvedLanguage || i18n.language);
  const [scheme, setScheme] = useState(null);
  const [relatedSchemes, setRelatedSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [retry, setRetry] = useState(0);
  const [activeSection, setActiveSection] = useState(null);
  const sectionRefs = useRef({});

  useEffect(() => {
    let active = true;
    setLoading(true); setError(false); setNotFound(false); setActiveSection(null);
    const key = `scheme-view-tracked:${slug}`;
    const trackView = sessionStorage.getItem(key) === null;
    if (trackView) sessionStorage.setItem(key, 'pending');
    (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/government-schemes/${encodeURIComponent(slug)}?trackView=${trackView}`);
        const result = await response.json();
        if (!response.ok || !result.success || !result.data) {
          if (trackView) sessionStorage.removeItem(key);
          if (active) { setScheme(null); setNotFound(response.status === 404); setError(response.status !== 404); }
          return;
        }
        if (trackView) sessionStorage.setItem(key, 'tracked');
        if (active) { setScheme(result.data); setRelatedSchemes(Array.isArray(result.relatedSchemes) ? result.relatedSchemes : []); }
      } catch {
        if (trackView) sessionStorage.removeItem(key);
        if (active) { setScheme(null); setError(true); }
      } finally { if (active) setLoading(false); }
    })();
    // Do not repeat view tracking when language changes or let an older route replace the current scheme.
    return () => { active = false; };
  }, [slug, retry]);

  const title = schemeText(scheme, 'title', language);
  useEffect(() => {
    if (!title) return;
    const previous = document.title;
    document.title = `${title} - ${t('governmentSchemes.detailTitle')}`;
    return () => { document.title = previous; };
  }, [title, t]);

  const shareScheme = async () => {
    try { await navigator.clipboard.writeText(window.location.href); toast.success(t('governmentSchemes.linkCopied')); }
    catch { toast.error(t('governmentSchemes.linkCopyFailed')); }
  };
  const officialUrl = schemeWebsite(scheme?.official_url);
  const description = schemeText(scheme, 'description', language);
  const sections = [
    { field: 'benefits', title: 'benefits', empty: 'noBenefits', open: true },
    { field: 'eligibility', title: 'eligibility', empty: 'noEligibility', open: true },
    { field: 'required_documents', title: 'requiredDocuments', empty: 'noDocuments' },
    { field: 'application_steps', title: 'howToApply', empty: 'noSteps', ordered: true }
  ];

  const openSection = field => {
    const section = sectionRefs.current[field];
    if (!section) return;
    section.open = true;
    setActiveSection(field);
    section.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    section.querySelector('summary')?.focus({ preventScroll: true });
  };

  return <main className="gs-page gs-detail-page"><div className="gs-container">
    <nav className="gs-toolbar" aria-label={t('governmentSchemes.detailTitle')}><Link to="/government-schemes"><FiArrowLeft aria-hidden="true" />{t('governmentSchemes.backToSchemes')}</Link><button type="button" onClick={shareScheme}><FiLink aria-hidden="true" />{t('schemeUi.copyLink')}</button></nav>
    {loading ? <div className="gs-empty" role="status">{t('governmentSchemes.loadingDetails')}</div> : error || notFound || !scheme ? <div className="gs-empty" role="alert"><h1>{t(notFound ? 'schemeUi.notFound' : 'schemeUi.detailError')}</h1>{!notFound && <button type="button" className="action-button action-button-secondary" onClick={() => setRetry(value => value + 1)}>{t('schemeUi.retry')}</button>}</div> : <>
      <header className="gs-detail-header">
        <div className="gs-detail-identity"><div className="gs-detail-image"><FiHome aria-hidden="true" />{scheme.image_url && <img src={scheme.image_url} alt="" onError={event => { event.currentTarget.hidden = true; }} />}</div><div><div className="gs-detail-labels"><Link to={`/government-schemes?category=${encodeURIComponent(scheme.category || 'general')}`}>{t(`governmentSchemes.categories.${scheme.category || 'general'}`)}</Link><span>{t(`schemeUi.levels.${scheme.government_level || 'other'}`)}</span><span>{t(`governmentSchemes.animalCategories.${scheme.animal_category || 'both'}`)}</span></div><h1>{title}</h1>{scheme.department && <p className="gs-department">{scheme.department}</p>}</div></div>
        {schemeText(scheme, 'short_description', language) && <p className="gs-intro">{schemeText(scheme, 'short_description', language)}</p>}
        <dl className="gs-detail-facts"><div><dt>{t('governmentSchemes.amount')}</dt><dd>{schemeAmount(scheme.amount_label, language) || t('schemeUi.notSpecified')}</dd></div><div><dt>{t('governmentSchemes.interest')}</dt><dd>{scheme.interest_rate || t('schemeUi.notSpecified')}</dd></div><div><dt>{t('schemeUi.recordStatus')}</dt><dd>{t(`governmentSchemes.statuses.${scheme.status}`, { defaultValue: scheme.status || t('schemeUi.notSpecified') })}</dd></div></dl>
      </header>
      <nav className="gs-section-nav" aria-label={t('schemeVisual.jumpTo')}>
        {sections.map(section => <button type="button" key={section.field} aria-pressed={activeSection === section.field} aria-controls={`scheme-section-${section.field}`} onClick={() => openSection(section.field)}><SchemeVisualIcon kind={section.field} /><span>{t(`governmentSchemes.${section.title}`)}</span></button>)}
      </nav>
      <div className="gs-detail-layout">
        <aside className="gs-apply-panel"><h2>{t('governmentSchemes.applyForScheme')}</h2><dl><div><dt>{t('governmentSchemes.deadline')}</dt><dd>{schemeDeadline(scheme.deadline, language) || t('schemeUi.notSpecified')}</dd></div><div><dt>{t('governmentSchemes.state')}</dt><dd>{scheme.state || t('governmentSchemes.allIndia')}</dd></div></dl>
          {officialUrl ? <a href={officialUrl} target="_blank" rel="noopener noreferrer" className="action-button action-button-primary gs-official-link">{t('governmentSchemes.openOfficialWebsite')}<FiExternalLink aria-hidden="true" /></a> : <p className="gs-no-link">{t('governmentSchemes.noOfficialLink')}</p>}
          {scheme.contact_info && <div className="gs-contact"><h3>{t('schemeUi.contact')}</h3><p>{scheme.contact_info}</p></div>}
          <p className="gs-view-count">{t('governmentSchemes.views')}: {Number(scheme.views || 0).toLocaleString(schemeLocale(language))}</p>
        </aside>
        <div className="gs-detail-sections" key={slug}>
          {sections.map(section => {
            const items = schemeItems(scheme, section.field, language);
            return <details className="gs-detail-section" id={`scheme-section-${section.field}`} ref={element => { sectionRefs.current[section.field] = element; }} key={section.field} open={section.open || undefined} onToggle={event => { if (!event.currentTarget.open && activeSection === section.field) setActiveSection(null); }}><summary><span className="gs-section-icon"><SchemeVisualIcon kind={section.field} /></span><h2>{t(`governmentSchemes.${section.title}`)}</h2><FiChevronDown aria-hidden="true" /></summary><div className="gs-section-body">{items.length ? section.ordered ? <ol className="gs-steps">{items.map((item, index) => <li key={index}><span aria-hidden="true">{(index + 1).toLocaleString(schemeLocale(language))}</span><p>{item}</p></li>)}</ol> : <ul className="gs-checklist">{items.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p className="gs-unspecified">{t(`governmentSchemes.${section.empty}`)}</p>}</div></details>;
          })}
          {description && <details className="gs-detail-section"><summary><h2>{t('governmentSchemes.schemeDetails')}</h2><FiChevronDown aria-hidden="true" /></summary><div className="gs-section-body gs-description">{description}</div></details>}
        </div>
      </div>
      {relatedSchemes.length > 0 && <section className="gs-related" aria-labelledby="gs-related-title"><h2 id="gs-related-title">{t('governmentSchemes.relatedSchemes')}</h2><div>{relatedSchemes.map(related => <Link to={`/government-schemes/${related.slug}`} key={related.id}><span><small>{t(`governmentSchemes.categories.${related.category || 'general'}`)}</small><strong>{schemeText(related, 'title', language)}</strong></span><FiArrowRight aria-hidden="true" /></Link>)}</div></section>}
    </>}
  </div></main>;
};

export default GovernmentSchemeDetail;
