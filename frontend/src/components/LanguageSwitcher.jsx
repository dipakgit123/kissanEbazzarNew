import React, { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const optionsRef = useRef(null);
  const optionsId = useId();

  useEffect(() => {
    if (isOpen) optionsRef.current?.querySelector('[aria-pressed="true"]')?.focus();
  }, [isOpen]);

  const handleKeyDown = event => {
    if (!isOpen) return;
    if (event.key === 'Escape') {
      event.preventDefault(); event.stopPropagation(); setIsOpen(false); triggerRef.current?.focus();
    }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      const options = [...optionsRef.current.querySelectorAll('button')];
      const index = options.indexOf(document.activeElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
      event.preventDefault(); options[next]?.focus();
    }
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: '\u0939\u093f\u0902\u0926\u0940' },
    { code: 'mr', name: '\u092e\u0930\u093e\u0920\u0940' }
  ];

  const currentLanguage = languages.find((lang) => lang.code === (i18n.resolvedLanguage || i18n.language)?.split('-')[0]) || languages[0];

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('language', langCode);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div className="relative inline-block text-left z-50" onKeyDown={handleKeyDown} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false); }}>
      <button
        type="button"
        ref={triggerRef}
        aria-expanded={isOpen}
        aria-controls={optionsId}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors group"
        aria-label={t('common.selectLanguage')}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
        <span className="font-medium text-sm">{currentLanguage.name}</span>
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div id={optionsId} ref={optionsRef} className="absolute left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0 mt-2 w-36 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
            <div className="py-0.5">
              {languages.map((lang, index) => (
                <button
                  type="button"
                  aria-pressed={currentLanguage.code === lang.code}
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`w-full flex items-center gap-2 px-3 py-2 transition-all duration-150 ${
                    currentLanguage.code === lang.code
                      ? 'bg-green-50 text-green-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  } ${index !== languages.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  <span className="text-xs flex-1 text-left">{lang.name}</span>
                  {currentLanguage.code === lang.code && (
                    <svg
                      className="w-3.5 h-3.5 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSwitcher;
