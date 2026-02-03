import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const PrivacyPage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E9F0F8] to-[#F0F8FF] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[#000600]">
                {t('privacy.title')}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                {t('privacy.effectiveDate')}
              </p>
            </div>
            <Link
              to="/"
              className="text-sm font-semibold text-green-600 hover:text-green-700"
            >
              {t('privacy.backToHome')}
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 sm:p-8 space-y-6">
          <section>
            <h2 className="text-lg font-bold text-gray-900">{t('privacy.s1Title')}</h2>
            <ul className="text-sm text-gray-600 mt-2 list-disc pl-5 space-y-1">
              <li>{t('privacy.s1Item1')}</li>
              <li>{t('privacy.s1Item2')}</li>
              <li>{t('privacy.s1Item3')}</li>
              <li>{t('privacy.s1Item4')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">{t('privacy.s2Title')}</h2>
            <ul className="text-sm text-gray-600 mt-2 list-disc pl-5 space-y-1">
              <li>{t('privacy.s2Item1')}</li>
              <li>{t('privacy.s2Item2')}</li>
              <li>{t('privacy.s2Item3')}</li>
              <li>{t('privacy.s2Item4')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">{t('privacy.s3Title')}</h2>
            <p className="text-sm text-gray-600 mt-2">
              {t('privacy.s3Body')}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">{t('privacy.s4Title')}</h2>
            <p className="text-sm text-gray-600 mt-2">
              {t('privacy.s4Body')}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">{t('privacy.s5Title')}</h2>
            <p className="text-sm text-gray-600 mt-2">
              {t('privacy.s5Body')}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">{t('privacy.s6Title')}</h2>
            <p className="text-sm text-gray-600 mt-2">
              {t('privacy.s6Body')}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">{t('privacy.s7Title')}</h2>
            <ul className="text-sm text-gray-600 mt-2 list-disc pl-5 space-y-1">
              <li>{t('privacy.s7Item1')}</li>
              <li>{t('privacy.s7Item2')}</li>
              <li>{t('privacy.s7Item3')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">{t('privacy.s8Title')}</h2>
            <p className="text-sm text-gray-600 mt-2">
              {t('privacy.s8Body')}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">{t('privacy.s9Title')}</h2>
            <p className="text-sm text-gray-600 mt-2">
              {t('privacy.s9Body')}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">{t('privacy.s10Title')}</h2>
            <p className="text-sm text-gray-600 mt-2">
              {t('privacy.s10Body')}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
