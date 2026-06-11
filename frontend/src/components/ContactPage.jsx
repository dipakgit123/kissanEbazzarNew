import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  FaEnvelope,
  FaHeadset,
  FaPaperPlane,
  FaPhone,
  FaRegClock,
  FaWhatsapp,
} from 'react-icons/fa6';
import { contactService } from '../services/api';
import { getWhatsAppSupportUrl } from '../config/support';

const ContactPage = () => {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const whatsappUrl = getWhatsAppSupportUrl();

  const contactCards = useMemo(() => ([
    {
      key: 'email',
      title: t('contactPage.emailTitle'),
      description: t('contactPage.emailDesc'),
      value: t('contactPage.emailValue'),
      icon: FaEnvelope,
      accent: 'border-emerald-100 bg-emerald-50/70 text-emerald-700',
    },
    {
      key: 'whatsapp',
      title: t('contactPage.whatsAppTitle'),
      description: t('contactPage.whatsAppDesc'),
      value: t('contactPage.whatsAppCta'),
      href: whatsappUrl || undefined,
      icon: FaWhatsapp,
      accent: 'border-sky-100 bg-sky-50/70 text-sky-700',
    },
    {
      key: 'hours',
      title: t('contactPage.hoursTitle'),
      description: t('contactPage.hoursDesc'),
      value: t('contactPage.hoursValue'),
      icon: FaRegClock,
      accent: 'border-amber-100 bg-amber-50/70 text-amber-700',
    },
  ]), [t, whatsappUrl]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      toast.error(t('contactPage.validationRequired'));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      toast.error(t('contactPage.validationEmail'));
      return;
    }

    setSubmitting(true);

    try {
      const response = await contactService.submitInquiry(formData);
      if (response?.success) {
        toast.success(t('contactPage.submitSuccess'));
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
        });
      } else {
        toast.error(t('contactPage.submitError'));
      }
    } catch (error) {
      toast.error(t('contactPage.submitError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f8f4] text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <section className="rounded-[32px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="grid gap-0 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="border-b border-slate-200 bg-[linear-gradient(180deg,#f6fff9_0%,#ffffff_100%)] p-6 sm:p-8 lg:border-b-0 lg:border-r">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0f2b17] text-emerald-300">
                <FaHeadset className="text-2xl" />
              </div>

              <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
                {t('contactPage.eyebrow')}
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                {t('contactPage.title')}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                {t('contactPage.subtitle')}
              </p>

              <div className="mt-8 space-y-4">
                {contactCards.map(({ key, title, description, value, href, icon: Icon, accent }) => {
                  const content = (
                    <div className={`rounded-[24px] border p-4 ${accent}`}>
                      <div className="flex items-start gap-4">
                        <div className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
                          <Icon className="text-lg" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900">{title}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
                        </div>
                      </div>
                    </div>
                  );

                  if (!href) {
                    return <div key={key}>{content}</div>;
                  }

                  return (
                    <a
                      key={key}
                      href={href}
                      target={href.startsWith('http') ? '_blank' : undefined}
                      rel={href.startsWith('http') ? 'noreferrer' : undefined}
                      className="block transition-transform hover:-translate-y-0.5"
                    >
                      {content}
                    </a>
                  );
                })}
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
                  {t('contactPage.formLabel')}
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
                  {t('contactPage.formTitle')}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {t('contactPage.formSubtitle')}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      {t('contactPage.nameLabel')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder={t('contactPage.namePlaceholder')}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      {t('contactPage.emailLabel')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={t('contactPage.emailPlaceholder')}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      {t('contactPage.phoneLabel')}
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder={t('contactPage.phonePlaceholder')}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      {t('contactPage.subjectLabel')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder={t('contactPage.subjectPlaceholder')}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {t('contactPage.messageLabel')} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder={t('contactPage.messagePlaceholder')}
                    rows="7"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="inline-flex items-center gap-2 text-sm text-slate-500">
                    <FaPhone className="text-emerald-600" />
                    <span>{t('contactPage.responseNote')}</span>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0f2b17] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-950/15 transition hover:bg-[#12381e] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span>{t('contactPage.submitting')}</span>
                      </>
                    ) : (
                      <>
                        <FaPaperPlane className="text-sm" />
                        <span>{t('contactPage.submit')}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ContactPage;
