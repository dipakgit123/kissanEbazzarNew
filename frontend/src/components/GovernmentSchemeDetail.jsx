import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';

const getViewStorageKey = (slug) => `scheme-view-tracked:${slug}`;

const getLocalizedValue = (scheme, field, language) => {
  const translations = scheme?.translations || {};
  const languageValue = translations[language]?.[field];
  const fallbackValue = translations.en?.[field];
  return languageValue || fallbackValue || scheme?.[field] || '';
};

const getLocalizedArray = (scheme, field, language) => {
  const translations = scheme?.translations || {};
  const languageValue = translations[language]?.[field];
  const fallbackValue = translations.en?.[field];
  const rawValue = Array.isArray(languageValue)
    ? languageValue
    : Array.isArray(fallbackValue)
      ? fallbackValue
      : scheme?.[field];
  return Array.isArray(rawValue) ? rawValue : [];
};

const GovernmentSchemeDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [scheme, setScheme] = useState(null);
  const [relatedSchemes, setRelatedSchemes] = useState([]);
  const [loading, setLoading] = useState(true);

  const language = i18n.resolvedLanguage || i18n.language || 'en';

  const fetchScheme = useCallback(async () => {
    setLoading(true);
    const viewStorageKey = getViewStorageKey(slug);
    const shouldTrackView = sessionStorage.getItem(viewStorageKey) === null;

    if (shouldTrackView) {
      sessionStorage.setItem(viewStorageKey, 'pending');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/government-schemes/${slug}?trackView=${shouldTrackView}`);
      const data = await response.json();

      if (data.success) {
        setScheme(data.data);
        setRelatedSchemes(data.relatedSchemes || []);
        document.title = `${data.data.title} - ${t('governmentSchemes.detailTitle')}`;
        if (shouldTrackView) sessionStorage.setItem(viewStorageKey, 'tracked');
      } else {
        if (shouldTrackView) sessionStorage.removeItem(viewStorageKey);
        navigate('/government-schemes', { replace: true });
      }
    } catch (error) {
      if (shouldTrackView) sessionStorage.removeItem(viewStorageKey);
      console.error('Failed to fetch scheme:', error);
      navigate('/government-schemes', { replace: true });
    } finally {
      setLoading(false);
    }
  }, [navigate, slug]);

  useEffect(() => {
    fetchScheme();
  }, [fetchScheme]);

  const localized = useMemo(() => {
    if (!scheme) return null;
    return {
      title: getLocalizedValue(scheme, 'title', language),
      shortDescription: getLocalizedValue(scheme, 'short_description', language),
      description: getLocalizedValue(scheme, 'description', language),
      benefits: getLocalizedArray(scheme, 'benefits', language),
      eligibility: getLocalizedArray(scheme, 'eligibility', language),
      requiredDocuments: getLocalizedArray(scheme, 'required_documents', language),
      applicationSteps: getLocalizedArray(scheme, 'application_steps', language)
    };
  }, [language, scheme]);

  const shareScheme = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t('governmentSchemes.linkCopied'));
    } catch {
      toast.error(t('governmentSchemes.linkCopyFailed'));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f2e7] text-slate-500">
        {t('governmentSchemes.loadingDetails')}
      </div>
    );
  }

  if (!scheme || !localized) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#f8f2e7]">
      <section className="bg-gradient-to-br from-[#8b520a] via-[#b66f0d] to-[#dd942c] text-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between gap-4">
            <Link to="/government-schemes" className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-bold backdrop-blur hover:bg-white/25">
              <span aria-hidden="true">&lt;</span>
              {t('governmentSchemes.backToSchemes')}
            </Link>
            <button onClick={shareScheme} className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold backdrop-blur hover:bg-white/25">
              {t('governmentSchemes.share')}
            </button>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-end">
            <div>
              <div className="mb-4 flex flex-wrap gap-2">
                <Badge>{scheme.category}</Badge>
                <Badge>{scheme.animal_category}</Badge>
                <Badge>{scheme.government_level}</Badge>
              </div>
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-amber-100">{scheme.department || 'Government Scheme'}</p>
              <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight sm:text-6xl">{localized.title}</h1>
              {localized.shortDescription && (
                <p className="mt-5 max-w-3xl text-lg leading-8 text-amber-50">{localized.shortDescription}</p>
              )}
            </div>

            <div className="rounded-[2rem] bg-white p-4 shadow-2xl shadow-black/20">
              <div className="h-64 overflow-hidden rounded-[1.5rem] bg-amber-100">
                {scheme.image_url ? (
                  <img src={scheme.image_url} alt={localized.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <SchemeIcon className="h-20 w-20 text-[#b66f0d]" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_20rem] lg:px-8">
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label={t('governmentSchemes.amount')} value={scheme.amount_label || '-'} />
            <StatCard label={t('governmentSchemes.interest')} value={scheme.interest_rate || '-'} />
            <StatCard label={t('governmentSchemes.status')} value={t(`governmentSchemes.statuses.${scheme.status}`, { defaultValue: scheme.status || '-' })} />
          </div>

          {localized.description && (
            <Section title={t('governmentSchemes.schemeDetails')}>
              <p className="text-base leading-8 text-slate-700">{localized.description}</p>
            </Section>
          )}

          <Section title={t('governmentSchemes.benefits')}>
            <CheckList items={localized.benefits} emptyText={t('governmentSchemes.noBenefits')} />
          </Section>

          <Section title={t('governmentSchemes.eligibility')}>
            <CheckList items={localized.eligibility} emptyText={t('governmentSchemes.noEligibility')} />
          </Section>

          <Section title={t('governmentSchemes.requiredDocuments')}>
            <TagList items={localized.requiredDocuments} emptyText={t('governmentSchemes.noDocuments')} />
          </Section>

          <Section title={t('governmentSchemes.howToApply')}>
            {localized.applicationSteps.length > 0 ? (
              <ol className="space-y-3">
                {localized.applicationSteps.map((step, index) => (
                  <li key={`${step}-${index}`} className="flex gap-4">
                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-emerald-100 text-sm font-black text-emerald-700">{index + 1}</span>
                    <span className="pt-1 text-sm leading-6 text-slate-700">{step}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-slate-500">{t('governmentSchemes.noSteps')}</p>
            )}
          </Section>
        </div>

        <aside className="space-y-5">
          <div className="sticky top-24 rounded-[1.8rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="text-lg font-black text-slate-900">{t('governmentSchemes.applyForScheme')}</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <InfoRow label={t('governmentSchemes.deadline')} value={scheme.deadline || t('governmentSchemes.openDeadline')} />
              <InfoRow label={t('governmentSchemes.state')} value={scheme.state || t('governmentSchemes.allIndia')} />
              <InfoRow label={t('governmentSchemes.views')} value={scheme.views || 0} />
            </div>
            {scheme.official_url ? (
              <a
                href={scheme.official_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 block rounded-2xl bg-[#b66f0d] px-5 py-4 text-center font-black text-white shadow-lg shadow-amber-900/10 hover:bg-[#9f5f09]"
              >
                {t('governmentSchemes.openOfficialWebsite')}
              </a>
            ) : (
              <div className="mt-5 rounded-2xl bg-slate-100 px-5 py-4 text-center text-sm font-bold text-slate-500">
                {t('governmentSchemes.noOfficialLink')}
              </div>
            )}
            {scheme.contact_info && (
              <p className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">{scheme.contact_info}</p>
            )}
          </div>

          {relatedSchemes.length > 0 && (
            <div className="rounded-[1.8rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
              <h2 className="text-lg font-black text-slate-900">{t('governmentSchemes.relatedSchemes')}</h2>
              <div className="mt-4 space-y-3">
                {relatedSchemes.map((related) => (
                  <Link key={related.id} to={`/government-schemes/${related.slug}`} className="block rounded-2xl bg-[#f8f2e7] p-4 transition hover:bg-amber-100">
                    <p className="text-sm font-black leading-5 text-slate-900">{getLocalizedValue(related, 'title', language)}</p>
                    <p className="mt-1 text-xs capitalize text-slate-500">{related.category}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
};

const Section = ({ title, children }) => (
  <section className="rounded-[1.8rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
    <h2 className="mb-4 text-xl font-black text-slate-900">{title}</h2>
    {children}
  </section>
);

const CheckList = ({ items, emptyText }) => {
  if (!items.length) return <p className="text-sm text-slate-500">{emptyText}</p>;

  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex gap-3">
          <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <span className="text-sm leading-6 text-slate-700">{item}</span>
        </li>
      ))}
    </ul>
  );
};

const TagList = ({ items, emptyText }) => {
  if (!items.length) return <p className="text-sm text-slate-500">{emptyText}</p>;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => (
        <span key={`${item}-${index}`} className="rounded-full bg-[#f8f2e7] px-4 py-2 text-sm font-bold text-slate-700 ring-1 ring-black/5">{item}</span>
      ))}
    </div>
  );
};

const StatCard = ({ label, value }) => (
  <div className="rounded-[1.4rem] bg-white p-5 text-center shadow-sm ring-1 ring-black/5">
    <p className="text-2xl font-black text-[#126b4f]">{value}</p>
    <p className="mt-1 text-sm text-slate-500">{label}</p>
  </div>
);

const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0">
    <span>{label}</span>
    <span className="font-bold text-slate-900">{value}</span>
  </div>
);

const Badge = ({ children }) => (
  <span className="rounded-full bg-white/18 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-white backdrop-blur">
    {children}
  </span>
);

const SchemeIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 21h18M5 21V9l7-4 7 4v12M9 21v-6h6v6M9 11h.01M12 11h.01M15 11h.01" />
  </svg>
);

export default GovernmentSchemeDetail;
