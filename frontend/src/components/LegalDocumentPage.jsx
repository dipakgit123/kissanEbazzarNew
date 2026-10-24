import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FaFileContract, FaShieldHalved } from 'react-icons/fa6';
import { supportText } from '../utils/supportUi';
import SupportPageLayout from './SupportPageLayout';

const documents = {
  privacy: { count: 10, lists: { 1: 4, 2: 4, 7: 3 } },
  terms: { count: 12, lists: { 5: 4 } },
};

export default function LegalDocumentPage({ documentType }) {
  const { t, i18n } = useTranslation();
  const ui = supportText(i18n.language);
  const { count, lists } = documents[documentType];
  const sections = Array.from({ length: count }, (_, i) => i + 1);
  const [activeSection, setActiveSection] = useState('s1');
  const article = useRef(null);
  const mobileContents = useRef(null);

  useEffect(() => {
    let frame;
    const updateSection = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const nodes = [...(article.current?.querySelectorAll('section') || [])];
        const current = nodes.filter(node => node.getBoundingClientRect().top <= 150).pop() || nodes[0];
        if (current) setActiveSection(current.id);
      });
    };
    updateSection();
    window.addEventListener('scroll', updateSection, { passive: true });
    window.addEventListener('resize', updateSection);
    // Lazy route loading can finish after the browser's initial fragment scroll.
    const target = window.location.hash.slice(1);
    if (/^s\d+$/.test(target)) article.current?.querySelector(`#${target}`)?.scrollIntoView();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', updateSection);
      window.removeEventListener('resize', updateSection);
    };
  }, [documentType]);

  const contents = () => <nav aria-label={t(`${documentType}.contentsTitle`)}>
    {sections.map(number => <a key={number} href={`#s${number}`} aria-current={activeSection === `s${number}` ? 'location' : undefined} onClick={() => { if (mobileContents.current) mobileContents.current.open = false; }}>{t(`${documentType}.s${number}Title`)}</a>)}
  </nav>;

  return <SupportPageLayout title={t(`${documentType}.title`)} description={t(`${documentType}.subtitle`)} metadata={t(`${documentType}.effectiveDate`)} icon={documentType === 'privacy' ? <FaShieldHalved /> : <FaFileContract />}>
    <details ref={mobileContents} className="support-panel support-mobile-contents">
      <summary>{t(`${documentType}.contentsTitle`)}</summary>
      {contents()}
    </details>
    <div className="support-legal">
      <aside className="support-panel support-contents">
        <h2>{t(`${documentType}.contentsTitle`)}</h2>
        {contents()}
      </aside>
      <article ref={article} className="support-panel support-document" aria-label={t(`${documentType}.title`)}>
        {sections.map(number => <section key={number} id={`s${number}`} aria-labelledby={`s${number}-title`}>
          <h2 id={`s${number}-title`}>{t(`${documentType}.s${number}Title`)}</h2>
          {lists[number] ? <ul>{Array.from({ length: lists[number] }, (_, i) => <li key={i}>{t(`${documentType}.s${number}Item${i + 1}`)}</li>)}</ul>
            : <p>{number === count ? ui(`${documentType}Contact`) : t(`${documentType}.s${number}Body`)}</p>}
          {number === count && <Link className="support-link inline-block mt-3" to="/contact">{t('footer.contactUs')}</Link>}
        </section>)}
      </article>
    </div>
  </SupportPageLayout>;
}
