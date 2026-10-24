import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaChevronDown, FaChevronUp, FaHeadset, FaWhatsapp } from 'react-icons/fa6';
import { getWhatsAppSupportUrl } from '../config/support';
import { supportText } from '../utils/supportUi';
import SupportPageLayout from './SupportPageLayout';

export default function HelpCenter() {
  const { t, i18n } = useTranslation();
  const ui = supportText(i18n.language);
  const [openIndex, setOpenIndex] = useState(0);
  const whatsappUrl = getWhatsAppSupportUrl();

  return <SupportPageLayout title={t('helpCenter.title')} description={ui('helpIntro')} icon={<FaHeadset />}>
    <div className="support-columns">
      <section className="support-panel" aria-labelledby="faq-title">
        <h2 id="faq-title">{t('helpCenter.faqTitle')}</h2>
        {Array.from({ length: 6 }, (_, index) => {
          const open = index === openIndex;
          return <div className="support-faq" key={index}>
            <h3>
              <button id={`help-question-${index}`} type="button" aria-expanded={open} aria-controls={`help-answer-${index}`} onClick={() => setOpenIndex(open ? null : index)}>
                <span>{t(`helpCenter.q${index + 1}`)}</span>
                {open ? <FaChevronUp aria-hidden="true" /> : <FaChevronDown aria-hidden="true" />}
              </button>
            </h3>
            <div id={`help-answer-${index}`} className="support-faq-answer" role="region" aria-labelledby={`help-question-${index}`} hidden={!open}>
              <p>{t(`helpCenter.a${index + 1}`)}</p>
            </div>
          </div>;
        })}
      </section>
      <aside className="support-stack">
        <section className="support-panel">
          <h2>{t('helpCenter.quickActionsTitle')}</h2>
          {[['/sell-animal', 'helpCenter.actionSellTitle'], ['/profile', 'helpCenter.actionProfileTitle'], ['/contact', 'footer.contactUs']].map(([to, label]) =>
            <Link key={to} to={to} className="support-quick-link">{t(label)}<FaArrowRight aria-hidden="true" /></Link>
          )}
        </section>
        <section className="support-panel support-stack">
          <h2>{t('helpCenter.contactTitle')}</h2>
          <p className="support-muted">{ui('supportHint')}</p>
          <Link to="/contact" className="support-action">{t('footer.contactUs')}<FaArrowRight aria-hidden="true" /></Link>
          {whatsappUrl && <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="support-action support-action-secondary"><FaWhatsapp aria-hidden="true" />{t('contactPage.whatsAppCta')}</a>}
        </section>
      </aside>
    </div>
  </SupportPageLayout>;
}
