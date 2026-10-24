import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './GovernmentSchemesBanner.css';

const GovernmentSchemesBanner = ({ featuredScheme }) => {
  const { t, i18n } = useTranslation();
  const amount = featuredScheme?.amount_label;
  const amountText = amount == null ? '' : String(amount).trim();
  const locale = i18n.resolvedLanguage === 'mr' ? 'mr-IN' : i18n.resolvedLanguage === 'hi' ? 'hi-IN' : 'en-IN';
  // Keep benefit descriptions and units intact; group plain numbers for readability.
  const benefit = /^\d+(\.\d+)?$/.test(amountText) && Number.isSafeInteger(Number(amountText))
    ? new Intl.NumberFormat(locale).format(Number(amountText))
    : amountText;

  return (
    <section className="scheme-banner" aria-labelledby="scheme-banner-heading">
      <div className="scheme-banner-content">
        <p className="scheme-banner-eyebrow">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m3 9 9-6 9 6M4 10h16M5 10v10m5-10v10m4-10v10m5-10v10M3 21h18" /></svg>
          {t('home.governmentSchemesKicker')}
        </p>
        <h2 id="scheme-banner-heading">{t('home.governmentSchemesBannerTitle')}</h2>
        <p className="scheme-banner-description">{t('home.governmentSchemesBannerDesc')}</p>
        <ul className="scheme-banner-topics">
          {['governmentSchemesTagLoan', 'governmentSchemesTagSubsidy', 'governmentSchemesTagDocs'].map((key) => (
            <li key={key}><span aria-hidden="true">✓</span>{t(`home.${key}`)}</li>
          ))}
        </ul>
      </div>
      <div className="scheme-banner-benefit">
        <div className="scheme-banner-benefit-heading">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M8 8h8m-8 4h8m-8 4h5M6 3h12a1 1 0 0 1 1 1v17l-4-2-3 2-3-2-4 2V4a1 1 0 0 1 1-1Z" /></svg>
          <p>{t('home.governmentSchemesCardLabel')}</p>
        </div>
        <p className={`scheme-banner-value${benefit ? '' : ' scheme-banner-value-fallback'}`}>{benefit || t('home.governmentSchemesCardValue')}</p>
        <Link to="/government-schemes" className="scheme-banner-link">
          {t('home.governmentSchemesOpen')}
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 12h15m-6-6 6 6-6 6" /></svg>
        </Link>
      </div>
    </section>
  );
};

export default GovernmentSchemesBanner;
