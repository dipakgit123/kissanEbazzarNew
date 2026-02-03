import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const HelpCenter = () => {
  const { t } = useTranslation();

  const faqs = [
    { q: t('helpCenter.q1'), a: t('helpCenter.a1') },
    { q: t('helpCenter.q2'), a: t('helpCenter.a2') },
    { q: t('helpCenter.q3'), a: t('helpCenter.a3') },
    { q: t('helpCenter.q4'), a: t('helpCenter.a4') },
    { q: t('helpCenter.q5'), a: t('helpCenter.a5') },
    { q: t('helpCenter.q6'), a: t('helpCenter.a6') }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E9F0F8] to-[#F0F8FF] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[#000600]">
                {t('helpCenter.title')}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                {t('helpCenter.subtitle')}
              </p>
            </div>
            <Link
              to="/profile"
              className="text-sm font-semibold text-green-600 hover:text-green-700"
            >
              {t('helpCenter.backToProfile')}
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {faqs.map((item, index) => (
              <details key={index} className="group p-4 sm:p-5">
                <summary className="list-none cursor-pointer flex items-center justify-between gap-3">
                  <span className="font-semibold text-gray-900">{item.q}</span>
                  <span className="text-green-600 group-open:rotate-45 transition-transform duration-200">
                    +
                  </span>
                </summary>
                <p className="text-sm text-gray-600 mt-3">{item.a}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="mt-6 bg-white rounded-2xl shadow-md border border-gray-100 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">{t('helpCenter.stillNeedHelp')}</p>
              <p className="text-xs text-gray-600 mt-1">{t('helpCenter.stillNeedHelpDesc')}</p>
            </div>
            <Link
              to="/profile"
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
            >
              {t('helpCenter.contactSupport')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
