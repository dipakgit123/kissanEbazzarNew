import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaArrowRight,
  FaChildReaching,
  FaCircleCheck,
  FaCookieBite,
  FaDatabase,
  FaEye,
  FaFileShield,
  FaGlobe,
  FaListUl,
  FaLock,
  FaMessage,
  FaRobot,
  FaScaleBalanced,
  FaShieldHalved,
  FaUserShield,
  FaWhatsapp,
} from 'react-icons/fa6';
import { getWhatsAppSupportUrl } from '../config/support';

const PrivacyPage = () => {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState('s1');
  const whatsappUrl = getWhatsAppSupportUrl();
  const getSectionTitle = (titleKey) => t(titleKey).replace(/^\d+\.\s*/, '');

  const sections = useMemo(() => ([
    {
      id: 's1',
      titleKey: 'privacy.s1Title',
      icon: FaDatabase,
      iconClass: 'text-emerald-300',
      surfaceClass: 'from-emerald-500/18 via-emerald-400/10 to-transparent',
      numberClass: 'bg-emerald-600 text-white',
      type: 'list',
      items: ['privacy.s1Item1', 'privacy.s1Item2', 'privacy.s1Item3', 'privacy.s1Item4'],
    },
    {
      id: 's2',
      titleKey: 'privacy.s2Title',
      icon: FaUserShield,
      iconClass: 'text-sky-300',
      surfaceClass: 'from-sky-500/18 via-sky-400/10 to-transparent',
      numberClass: 'bg-sky-600 text-white',
      type: 'list',
      items: ['privacy.s2Item1', 'privacy.s2Item2', 'privacy.s2Item3', 'privacy.s2Item4'],
    },
    {
      id: 's3',
      titleKey: 'privacy.s3Title',
      icon: FaCookieBite,
      iconClass: 'text-amber-200',
      surfaceClass: 'from-amber-400/20 via-amber-300/10 to-transparent',
      numberClass: 'bg-amber-500 text-white',
      type: 'paragraph',
      bodyKey: 'privacy.s3Body',
    },
    {
      id: 's4',
      titleKey: 'privacy.s4Title',
      icon: FaLock,
      iconClass: 'text-violet-200',
      surfaceClass: 'from-violet-500/18 via-violet-400/10 to-transparent',
      numberClass: 'bg-violet-500 text-white',
      type: 'paragraph',
      bodyKey: 'privacy.s4Body',
    },
    {
      id: 's5',
      titleKey: 'privacy.s5Title',
      icon: FaEye,
      iconClass: 'text-teal-200',
      surfaceClass: 'from-teal-500/18 via-teal-400/10 to-transparent',
      numberClass: 'bg-teal-500 text-white',
      type: 'paragraph',
      bodyKey: 'privacy.s5Body',
    },
    {
      id: 's6',
      titleKey: 'privacy.s6Title',
      icon: FaRobot,
      iconClass: 'text-rose-200',
      surfaceClass: 'from-rose-500/18 via-rose-400/10 to-transparent',
      numberClass: 'bg-rose-500 text-white',
      type: 'paragraph',
      bodyKey: 'privacy.s6Body',
    },
    {
      id: 's7',
      titleKey: 'privacy.s7Title',
      icon: FaScaleBalanced,
      iconClass: 'text-indigo-200',
      surfaceClass: 'from-indigo-500/18 via-indigo-400/10 to-transparent',
      numberClass: 'bg-indigo-500 text-white',
      type: 'list',
      items: ['privacy.s7Item1', 'privacy.s7Item2', 'privacy.s7Item3'],
    },
    {
      id: 's8',
      titleKey: 'privacy.s8Title',
      icon: FaChildReaching,
      iconClass: 'text-pink-200',
      surfaceClass: 'from-pink-500/18 via-pink-400/10 to-transparent',
      numberClass: 'bg-pink-500 text-white',
      type: 'paragraph',
      bodyKey: 'privacy.s8Body',
    },
    {
      id: 's9',
      titleKey: 'privacy.s9Title',
      icon: FaGlobe,
      iconClass: 'text-cyan-200',
      surfaceClass: 'from-cyan-500/18 via-cyan-400/10 to-transparent',
      numberClass: 'bg-cyan-500 text-white',
      type: 'paragraph',
      bodyKey: 'privacy.s9Body',
    },
    {
      id: 's10',
      titleKey: 'privacy.s10Title',
      icon: FaMessage,
      iconClass: 'text-emerald-200',
      surfaceClass: 'from-emerald-500/18 via-emerald-400/10 to-transparent',
      numberClass: 'bg-emerald-500 text-white',
      type: 'paragraph',
      bodyKey: 'privacy.s10Body',
    },
  ]), []);

  const summaryCards = [
    {
      title: t('privacy.summaryCollectTitle'),
      description: t('privacy.summaryCollectDesc'),
      icon: FaDatabase,
      iconClass: 'text-emerald-300',
      surfaceClass: 'from-emerald-500/18 via-emerald-400/10 to-transparent',
    },
    {
      title: t('privacy.summaryUseTitle'),
      description: t('privacy.summaryUseDesc'),
      icon: FaShieldHalved,
      iconClass: 'text-sky-300',
      surfaceClass: 'from-sky-500/18 via-sky-400/10 to-transparent',
    },
    {
      title: t('privacy.summaryControlTitle'),
      description: t('privacy.summaryControlDesc'),
      icon: FaFileShield,
      iconClass: 'text-amber-200',
      surfaceClass: 'from-amber-400/20 via-amber-300/10 to-transparent',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f6f8f5] text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <section className="relative overflow-hidden rounded-[34px] border border-[#15361f] bg-[#08140d] shadow-[0_30px_90px_rgba(8,20,13,0.28)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.22),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.18),_transparent_34%)]" />
          <div className="relative px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-12">
            <div className="max-w-4xl">
              <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
                {t('privacy.eyebrow')}
              </span>
              <h1 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                {t('privacy.title')}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-emerald-50/80 sm:text-base">
                {t('privacy.subtitle')}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm text-white/90 backdrop-blur">
                <FaCircleCheck className="text-emerald-300" />
                <span>{t('privacy.effectiveDate')}</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm text-white/90 backdrop-blur">
                <FaListUl className="text-emerald-300" />
                <span>{t('privacy.summaryPill')}</span>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {summaryCards.map(({ title, description, icon: SummaryIcon, iconClass, surfaceClass }) => (
                <div
                  key={title}
                  className="relative overflow-hidden rounded-[28px] border border-white/12 bg-white/[0.07] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.14)] backdrop-blur"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${surfaceClass}`} />
                  <div className="relative">
                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 ${iconClass}`}>
                      {React.createElement(SummaryIcon, { className: 'text-xl' })}
                    </div>
                    <h2 className="mt-4 text-lg font-bold text-white">{title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-100/90">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[0.8fr_1.2fr] xl:grid-cols-[0.72fr_1.28fr]">
          <aside className="space-y-5 self-start lg:sticky lg:top-8">
            <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0f2b17] text-emerald-300">
                  <FaListUl className="text-lg" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    {t('privacy.contentsLabel')}
                  </p>
                  <h2 className="mt-1 text-xl font-black text-slate-900">{t('privacy.contentsTitle')}</h2>
                </div>
              </div>

              <nav className="mt-5 space-y-2">
                {sections.map((section, index) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    onClick={(event) => {
                      event.preventDefault();
                      setActiveSection(section.id);
                      document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm transition ${
                      activeSection === section.id
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border-transparent bg-slate-50 text-slate-700 hover:border-slate-200 hover:bg-white'
                    }`}
                  >
                    <span className={`inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                      activeSection === section.id ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="truncate font-medium">{getSectionTitle(section.titleKey)}</span>
                  </a>
                ))}
              </nav>
            </div>

            <div className="rounded-[30px] border border-emerald-100 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500 text-white shadow-lg shadow-green-500/20">
                <FaWhatsapp className="text-xl" />
              </div>
              <h3 className="mt-4 text-xl font-black text-slate-900">{t('privacy.contactCardTitle')}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">{t('privacy.contactCardDesc')}</p>

              <a
                href={whatsappUrl || undefined}
                target={whatsappUrl ? '_blank' : undefined}
                rel={whatsappUrl ? 'noreferrer' : undefined}
                onClick={(event) => {
                  if (!whatsappUrl) {
                    event.preventDefault();
                  }
                }}
                className={`mt-5 inline-flex items-center justify-center gap-3 rounded-full px-5 py-3 text-sm font-semibold transition ${
                  whatsappUrl
                    ? 'bg-[#0f2b17] text-white shadow-lg shadow-emerald-950/15 hover:bg-[#12381e]'
                    : 'cursor-not-allowed bg-[#0f2b17] text-white/90 opacity-75'
                }`}
              >
                <FaWhatsapp className="text-lg" />
                <span>{t('privacy.contactButton')}</span>
                <FaArrowRight className="text-xs" />
              </a>
            </div>
          </aside>

          <main className="space-y-5">
            <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-6 lg:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                {t('privacy.overviewLabel')}
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
                {t('privacy.overviewTitle')}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                {t('privacy.overviewBody')}
              </p>
            </div>

            {sections.map((section, index) => {
              const { id, titleKey, icon: SectionIcon, iconClass, surfaceClass, numberClass, type, items, bodyKey } = section;

              return (
                <section
                  key={id}
                  id={id}
                  className="scroll-mt-8 rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-6 lg:p-7"
                >
                  <div className="relative overflow-hidden rounded-[24px] border border-slate-100 bg-slate-50/70 p-5">
                    <div className={`absolute inset-0 bg-gradient-to-br ${surfaceClass}`} />
                    <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">
                      <div className={`inline-flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-950 ${iconClass}`}>
                        {React.createElement(SectionIcon, { className: 'text-2xl' })}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-xs font-bold ${numberClass}`}>
                            {index + 1}
                          </span>
                          <h3 className="text-xl font-black text-slate-900">{getSectionTitle(titleKey)}</h3>
                        </div>

                        {type === 'list' ? (
                          <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-700 sm:text-base">
                            {items.map((itemKey) => (
                              <li key={itemKey} className="flex items-start gap-3">
                                <span className="mt-2 inline-flex h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" />
                                <span>{t(itemKey)}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-5 text-sm leading-7 text-slate-700 sm:text-base">
                            {t(bodyKey)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              );
            })}
          </main>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPage;
