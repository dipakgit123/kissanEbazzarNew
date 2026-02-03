import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const TermsPage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E9F0F8] to-[#F0F8FF] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[#000600]">
                {t('terms.title')}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                {t('terms.effectiveDate')}
              </p>
            </div>
            <Link
              to="/"
              className="text-sm font-semibold text-green-600 hover:text-green-700"
            >
              {t('terms.backToHome')}
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 sm:p-8 space-y-6">
          <section>
            <h2 className="text-lg font-bold text-gray-900">{t('terms.s1Title')}</h2>
            <p className="text-sm text-gray-600 mt-2">
              {t('terms.s1Body')}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">{t('terms.s2Title')}</h2>
            <p className="text-sm text-gray-600 mt-2">
              {t('terms.s2Body')}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">{t('terms.s3Title')}</h2>
            <p className="text-sm text-gray-600 mt-2">
              {t('terms.s3Body')}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">{t('terms.s4Title')}</h2>
            <p className="text-sm text-gray-600 mt-2">
              {t('terms.s4Body')}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">{t('terms.s5Title')}</h2>
            <ul className="text-sm text-gray-600 mt-2 list-disc pl-5 space-y-1">
              <li>{t('terms.s5Item1')}</li>
              <li>{t('terms.s5Item2')}</li>
              <li>{t('terms.s5Item3')}</li>
              <li>{t('terms.s5Item4')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">{t('terms.s6Title')}</h2>
            <p className="text-sm text-gray-600 mt-2">
              {t('terms.s6Body')}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">{t('terms.s7Title')}</h2>
            <p className="text-sm text-gray-600 mt-2">
              {t('terms.s7Body')}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">{t('terms.s8Title')}</h2>
            <p className="text-sm text-gray-600 mt-2">
              {t('terms.s8Body')}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">{t('terms.s9Title')}</h2>
            <p className="text-sm text-gray-600 mt-2">
              {t('terms.s9Body')}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">{t('terms.s10Title')}</h2>
            <p className="text-sm text-gray-600 mt-2">
              {t('terms.s10Body')}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">{t('terms.s11Title')}</h2>
            <p className="text-sm text-gray-600 mt-2">
              {t('terms.s11Body')}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">{t('terms.s12Title')}</h2>
            <p className="text-sm text-gray-600 mt-2">
              {t('terms.s12Body')}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
