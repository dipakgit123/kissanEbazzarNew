import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  FaArrowRight,
  FaChevronDown,
  FaCircleCheck,
  FaComments,
  FaHeadset,
  FaListCheck,
  FaShieldHeart,
  FaUserGear,
  FaWhatsapp,
} from 'react-icons/fa6';
import { getWhatsAppSupportUrl } from '../config/support';

const HelpCenter = () => {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState(0);
  const whatsappUrl = getWhatsAppSupportUrl();

  const faqs = useMemo(() => ([
    { q: t('helpCenter.q1'), a: t('helpCenter.a1') },
    { q: t('helpCenter.q2'), a: t('helpCenter.a2') },
    { q: t('helpCenter.q3'), a: t('helpCenter.a3') },
    { q: t('helpCenter.q4'), a: t('helpCenter.a4') },
    { q: t('helpCenter.q5'), a: t('helpCenter.a5') },
    { q: t('helpCenter.q6'), a: t('helpCenter.a6') },
  ]), [t]);

  const quickActions = [
    {
      title: t('helpCenter.actionSellTitle'),
      description: t('helpCenter.actionSellDesc'),
      cta: t('helpCenter.actionSellCta'),
      to: '/sell-animal',
      Icon: FaListCheck,
      accent: 'from-emerald-500/20 via-emerald-400/10 to-transparent',
      iconClass: 'text-emerald-300',
      borderClass: 'border-emerald-400/20',
    },
    {
      title: t('helpCenter.actionProfileTitle'),
      description: t('helpCenter.actionProfileDesc'),
      cta: t('helpCenter.actionProfileCta'),
      to: '/profile',
      Icon: FaUserGear,
      accent: 'from-sky-500/20 via-sky-400/10 to-transparent',
      iconClass: 'text-sky-300',
      borderClass: 'border-sky-400/20',
    },
    {
      title: t('helpCenter.actionSupportTitle'),
      description: t('helpCenter.actionSupportDesc'),
      cta: t('helpCenter.actionSupportCta'),
      href: whatsappUrl,
      Icon: FaWhatsapp,
      accent: 'from-green-500/20 via-green-400/10 to-transparent',
      iconClass: 'text-green-300',
      borderClass: 'border-green-400/20',
      disabled: !whatsappUrl,
    },
  ];

  const supportHighlights = [
    {
      label: t('helpCenter.highlightFaq'),
      Icon: FaCircleCheck,
    },
    {
      label: t('helpCenter.highlightSupport'),
      Icon: FaHeadset,
    },
    {
      label: t('helpCenter.highlightTrusted'),
      Icon: FaShieldHeart,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f4f8f4] text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <section className="relative overflow-hidden rounded-[32px] border border-[#15361f] bg-[#07150b] shadow-[0_28px_80px_rgba(7,21,11,0.28)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.24),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.18),_transparent_34%)]" />
          <div className="relative px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-12">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
                  {t('helpCenter.eyebrow')}
                </span>
              </div>

              <div className="max-w-3xl">
                <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                  {t('helpCenter.title')}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-50/80 sm:text-base">
                  {t('helpCenter.subtitle')}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {supportHighlights.map(({ label, Icon }) => (
                  <div
                    key={label}
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white shadow-[0_12px_30px_rgba(0,0,0,0.12)] backdrop-blur"
                  >
                    <Icon className="shrink-0 text-base text-emerald-300" />
                    <span className="text-white">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-3xl border border-emerald-400/20 bg-white/8 p-5 backdrop-blur">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/16 text-emerald-300">
                  <FaComments className="text-xl" />
                </div>
                <p className="text-sm font-semibold text-white">{t('helpCenter.card1Title')}</p>
                <p className="mt-2 text-sm leading-6 text-white/70">{t('helpCenter.card1Desc')}</p>
              </div>
              <div className="rounded-3xl border border-sky-400/20 bg-white/8 p-5 backdrop-blur">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-400/16 text-sky-300">
                  <FaHeadset className="text-xl" />
                </div>
                <p className="text-sm font-semibold text-white">{t('helpCenter.card2Title')}</p>
                <p className="mt-2 text-sm leading-6 text-white/70">{t('helpCenter.card2Desc')}</p>
              </div>
              <div className="rounded-3xl border border-amber-300/20 bg-white/8 p-5 backdrop-blur">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300/16 text-amber-200">
                  <FaShieldHeart className="text-xl" />
                </div>
                <p className="text-sm font-semibold text-white">{t('helpCenter.card3Title')}</p>
                <p className="mt-2 text-sm leading-6 text-white/70">{t('helpCenter.card3Desc')}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
                  {t('helpCenter.quickActionsLabel')}
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
                  {t('helpCenter.quickActionsTitle')}
                </h2>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {quickActions.map(({ title, description, cta, to, href, Icon, accent, iconClass, borderClass, disabled }) => {
                const cardClasses = `group relative overflow-hidden rounded-[28px] border bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_65px_rgba(15,23,42,0.14)] ${borderClass}`;

                const content = (
                  <>
                    <div className={`absolute inset-0 bg-gradient-to-br ${accent}`} />
                    <div className="relative flex h-full flex-col">
                      <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 ${iconClass}`}>
                        <Icon className="text-2xl" />
                      </div>
                      <div className="mt-5">
                        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                      </div>
                      <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                        <span>{cta}</span>
                        <FaArrowRight className="transition-transform duration-200 group-hover:translate-x-1" />
                      </div>
                    </div>
                  </>
                );

                if (to) {
                  return (
                    <Link key={title} to={to} className={cardClasses}>
                      {content}
                    </Link>
                  );
                }

                return (
                  <a
                    key={title}
                    href={disabled ? undefined : href}
                    target={disabled ? undefined : '_blank'}
                    rel={disabled ? undefined : 'noreferrer'}
                    onClick={(event) => {
                      if (disabled) {
                        event.preventDefault();
                      }
                    }}
                    className={`${cardClasses} ${disabled ? 'cursor-not-allowed opacity-70' : ''}`}
                  >
                    {content}
                  </a>
                );
              })}
            </div>
          </div>

          <div className="rounded-[30px] border border-emerald-100 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-6">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0f2b17] text-emerald-300">
                <FaHeadset className="text-xl" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  {t('helpCenter.stillNeedHelp')}
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-900">
                  {t('helpCenter.contactTitle')}
                </h2>
              </div>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-600">
              {t('helpCenter.stillNeedHelpDesc')}
            </p>

            <div className="mt-6 rounded-[26px] border border-emerald-200 bg-[linear-gradient(135deg,#f2fff6_0%,#ffffff_62%,#eefbf4_100%)] p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500 text-white shadow-lg shadow-green-500/25">
                    <FaWhatsapp className="text-2xl" />
                  </div>
                  <p className="mt-4 text-lg font-bold text-slate-900">{t('helpCenter.contactSupport')}</p>
                  <p className="mt-1 text-sm text-slate-600">{t('helpCenter.whatsappCtaDesc')}</p>
                </div>

                <a
                  href={whatsappUrl || undefined}
                  target={whatsappUrl ? '_blank' : undefined}
                  rel={whatsappUrl ? 'noreferrer' : undefined}
                  onClick={(event) => {
                    if (!whatsappUrl) {
                      event.preventDefault();
                    }
                  }}
                  className={`inline-flex items-center justify-center gap-3 rounded-full px-6 py-3.5 text-base font-semibold transition ${
                    whatsappUrl
                      ? 'bg-[#0f2b17] text-white shadow-lg shadow-emerald-950/15 hover:bg-[#12381e]'
                      : 'cursor-not-allowed bg-[#0f2b17] text-white/90 opacity-75'
                  }`}
                >
                  <FaWhatsapp className="text-xl" />
                  <span>{t('helpCenter.actionSupportCta')}</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-6 lg:p-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
                {t('helpCenter.faqLabel')}
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
                {t('helpCenter.faqTitle')}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                {t('helpCenter.faqSubtitle')}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {faqs.map((item, index) => {
              const isOpen = openIndex === index;

              return (
                <div
                  key={item.q}
                  className={`overflow-hidden rounded-[24px] border transition-all duration-200 ${
                    isOpen
                      ? 'border-emerald-200 bg-emerald-50/50 shadow-[0_12px_30px_rgba(16,185,129,0.08)]'
                      : 'border-slate-200 bg-slate-50/70 hover:border-slate-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                    className="flex w-full items-start justify-between gap-4 px-5 py-5 text-left sm:px-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold ${
                        isOpen ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-700'
                      }`}>
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <div>
                        <p className="text-base font-bold text-slate-900 sm:text-lg">{item.q}</p>
                        {isOpen && (
                          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                            {item.a}
                          </p>
                        )}
                      </div>
                    </div>

                    <span className={`mt-1 inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border transition ${
                      isOpen
                        ? 'rotate-180 border-emerald-200 bg-white text-emerald-700'
                        : 'border-slate-200 bg-white text-slate-500'
                    }`}>
                      <FaChevronDown />
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default HelpCenter;
