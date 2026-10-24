import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaEnvelope, FaPaperPlane, FaWhatsapp } from 'react-icons/fa6';
import { contactService } from '../services/api';
import { getWhatsAppSupportUrl } from '../config/support';
import { supportText } from '../utils/supportUi';
import SupportPageLayout from './SupportPageLayout';

const emptyForm = { name: '', email: '', phone: '', subject: '', message: '' };
const fields = [
  { name: 'name', autoComplete: 'name', required: true },
  { name: 'email', type: 'email', autoComplete: 'email', required: true },
  { name: 'phone', type: 'tel', autoComplete: 'tel' },
  { name: 'subject', required: true },
  { name: 'message', required: true, wide: true },
];

export default function ContactPage() {
  const { t, i18n } = useTranslation();
  const ui = supportText(i18n.language);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const pending = useRef(false);
  const feedbackRef = useRef(null);
  const whatsappUrl = getWhatsAppSupportUrl();

  useEffect(() => {
    if (feedback) feedbackRef.current?.focus();
  }, [feedback]);

  const handleSubmit = async event => {
    event.preventDefault();
    if (pending.current) return;
    const payload = Object.fromEntries(Object.entries(formData).map(([key, value]) => [key, value.trim()]));
    const showFeedback = (key, error = true) => {
      setFeedback({ key, error });
    };
    if (fields.some(field => field.required && !payload[field.name])) {
      showFeedback('validationRequired');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      showFeedback('validationEmail');
      return;
    }
    pending.current = true;
    setSubmitting(true);
    setFeedback(null);
    try {
      const response = await contactService.submitInquiry(payload);
      if (response?.success) {
        setFormData(emptyForm);
        showFeedback('submitSuccess', false);
      } else {
        showFeedback('submitError');
      }
    } catch {
      showFeedback('submitError');
    } finally {
      pending.current = false;
      setSubmitting(false);
    }
  };

  return <SupportPageLayout title={t('contactPage.title')} description={ui('contactIntro')} icon={<FaEnvelope />}>
    <div className="support-columns">
      <section className="support-panel" aria-labelledby="contact-form-title">
        <h2 id="contact-form-title">{t('contactPage.formTitle')}</h2>
        <p id="contact-form-hint" className="support-muted mb-5">{ui('contactHint')} {ui('requiredHint')}</p>
        {feedback && <div ref={feedbackRef} tabIndex={-1} role={feedback.error ? 'alert' : 'status'} className={`support-feedback${feedback.error ? ' support-feedback-error' : ''}`}>{t(`contactPage.${feedback.key}`)}</div>}
        <form onSubmit={handleSubmit} aria-labelledby="contact-form-title" aria-describedby="contact-form-hint" aria-busy={submitting}>
          <fieldset disabled={submitting}>
            <div className="support-fields">
              {fields.map(({ name, type = 'text', autoComplete, required, wide }) => {
                const controlProps = { id: `contact-${name}`, name, required, value: formData[name], onChange: event => setFormData(previous => ({ ...previous, [name]: event.target.value })), placeholder: t(`contactPage.${name}Placeholder`) };
                return <div key={name} className={`support-field${wide ? ' support-field-wide' : ''}`}>
                  <label htmlFor={`contact-${name}`}>{t(`contactPage.${name}Label`)}{required && <span aria-hidden="true"> *</span>}</label>
                  {name === 'message' ? <textarea {...controlProps} rows={5} /> : <input {...controlProps} type={type} autoComplete={autoComplete} />}
                </div>;
              })}
            </div>
            <div className="support-form-footer">
              <p className="support-muted">{ui('privacyHint')} <Link className="support-link" to="/privacy">{t('footer.privacyPolicy')}</Link></p>
              <button type="submit" className="support-action" disabled={submitting}><FaPaperPlane aria-hidden="true" />{t(`contactPage.${submitting ? 'submitting' : 'submit'}`)}</button>
            </div>
          </fieldset>
        </form>
      </section>
      <aside className="support-stack">
        <section className="support-panel support-stack">
          <h2>{t('footer.helpCenter')}</h2>
          <p className="support-muted">{ui('helpIntro')}</p>
          <Link className="support-action support-action-secondary" to="/help">{t('footer.helpCenter')}<FaArrowRight aria-hidden="true" /></Link>
        </section>
        {whatsappUrl && <section className="support-panel support-stack">
          <h2>{t('contactPage.whatsAppTitle')}</h2>
          <p className="support-muted">{ui('whatsappHint')}</p>
          <a className="support-action support-action-secondary" href={whatsappUrl} target="_blank" rel="noopener noreferrer"><FaWhatsapp aria-hidden="true" />{t('contactPage.whatsAppCta')}</a>
        </section>}
      </aside>
    </div>
  </SupportPageLayout>;
}
