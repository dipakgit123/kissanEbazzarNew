import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  FaArrowRight,
  FaChartLine,
  FaHeartPulse,
  FaShieldHalved,
  FaStore,
  FaUsers,
} from 'react-icons/fa6';

const AboutPage = () => {
  const { t } = useTranslation();

  const pillars = [
    {
      title: t('aboutPage.pillar1Title'),
      description: t('aboutPage.pillar1Desc'),
      icon: FaStore,
      iconClass: 'text-emerald-300',
      accent: 'from-emerald-500/18 via-emerald-400/10 to-transparent',
      borderClass: 'border-emerald-400/20',
    },
    {
      title: t('aboutPage.pillar2Title'),
      description: t('aboutPage.pillar2Desc'),
      icon: FaHeartPulse,
      iconClass: 'text-sky-300',
      accent: 'from-sky-500/18 via-sky-400/10 to-transparent',
      borderClass: 'border-sky-400/20',
    },
    {
      title: t('aboutPage.pillar3Title'),
      description: t('aboutPage.pillar3Desc'),
      icon: FaShieldHalved,
      iconClass: 'text-amber-200',
      accent: 'from-amber-400/18 via-amber-300/10 to-transparent',
      borderClass: 'border-amber-300/20',
    },
  ];

  const highlights = [
    { label: t('aboutPage.highlightFarmers'), icon: FaUsers },
    { label: t('aboutPage.highlightTrust'), icon: FaShieldHalved },
    { label: t('aboutPage.highlightGrowth'), icon: FaChartLine },
  ];

  const audience = [
    t('aboutPage.audience1'),
    t('aboutPage.audience2'),
    t('aboutPage.audience3'),
    t('aboutPage.audience4'),
  ];

  const values = [
    t('aboutPage.value1'),
    t('aboutPage.value2'),
    t('aboutPage.value3'),
    t('aboutPage.value4'),
  ];

  return (
    <div className="min-h-screen bg-[#f4f8f4] text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <section className="relative overflow-hidden rounded-[32px] border border-[#15361f] bg-[#07150b] shadow-[0_28px_80px_rgba(7,21,11,0.28)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.24),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.18),_transparent_34%)]" />
          <div className="relative px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-12">
            <div className="space-y-6">
              <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
                {t('aboutPage.eyebrow')}
              </span>

              <div className="max-w-3xl">
                <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                  {t('aboutPage.title')}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-50/80 sm:text-base">
                  {t('aboutPage.subtitle')}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {highlights.map(({ label, icon: Icon }) => (
                  <div
                    key={label}
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white shadow-[0_12px_30px_rgba(0,0,0,0.12)] backdrop-blur"
                  >
                    {React.createElement(Icon, { className: 'shrink-0 text-base text-emerald-300' })}
                    <span>{label}</span>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {pillars.map(({ title, description, icon: Icon, iconClass, accent, borderClass }) => (
                  <div
                    key={title}
                    className={`relative overflow-hidden rounded-3xl border bg-white/8 p-5 backdrop-blur ${borderClass}`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${accent}`} />
                    <div className="relative">
                      <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 ${iconClass}`}>
                        {React.createElement(Icon, { className: 'text-xl' })}
                      </div>
                      <h2 className="mt-4 text-lg font-bold text-white">{title}</h2>
                      <p className="mt-2 text-sm leading-6 text-white/75">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-6 lg:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              {t('aboutPage.missionLabel')}
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
              {t('aboutPage.missionTitle')}
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              {t('aboutPage.missionBody1')}
            </p>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              {t('aboutPage.missionBody2')}
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-emerald-100 bg-[linear-gradient(135deg,#f1fff6_0%,#ffffff_60%,#eefaf2_100%)] p-5">
                <h3 className="text-lg font-bold text-slate-900">{t('aboutPage.whoWeServeTitle')}</h3>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                  {audience.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-emerald-500"></span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[24px] border border-sky-100 bg-[linear-gradient(135deg,#f3fbff_0%,#ffffff_60%,#eef7ff_100%)] p-5">
                <h3 className="text-lg font-bold text-slate-900">{t('aboutPage.ourValuesTitle')}</h3>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                  {values.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-sky-500"></span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
                {t('aboutPage.whatYouCanDoLabel')}
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">
                {t('aboutPage.whatYouCanDoTitle')}
              </h2>
              <div className="mt-5 space-y-4">
                <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-base font-bold text-slate-900">{t('aboutPage.action1Title')}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{t('aboutPage.action1Desc')}</p>
                </div>
                <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-base font-bold text-slate-900">{t('aboutPage.action2Title')}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{t('aboutPage.action2Desc')}</p>
                </div>
                <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-base font-bold text-slate-900">{t('aboutPage.action3Title')}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{t('aboutPage.action3Desc')}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-emerald-100 bg-[linear-gradient(135deg,#f2fff6_0%,#ffffff_62%,#eefbf4_100%)] p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
                {t('aboutPage.nextStepLabel')}
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">
                {t('aboutPage.nextStepTitle')}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {t('aboutPage.nextStepDesc')}
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/buy-animals"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0f2b17] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-950/15 transition hover:bg-[#12381e]"
                >
                  <span>{t('aboutPage.buyAnimalsCta')}</span>
                  <FaArrowRight className="text-sm" />
                </Link>
                <Link
                  to="/sell-animal"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 transition hover:border-emerald-200 hover:text-emerald-700"
                >
                  <span>{t('aboutPage.sellAnimalCta')}</span>
                  <FaArrowRight className="text-sm" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
