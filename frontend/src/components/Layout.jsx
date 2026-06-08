import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logo from '../assets/images/animal_logog.jpeg';
import AIAssistant from './AIAssistant';
import LanguageSwitcher from './LanguageSwitcher';
import Footer from './Footer';
import { useWishlist } from '../contexts/useWishlist';

const Layout = ({ showHeaderFooter = true }) => {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const { wishlist } = useWishlist();
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // ✅ FIXED: Handle null/undefined wishlist safely
  const wishlistCount = wishlist?.length || 0;

  const isBlogActive = pathname.startsWith('/blogs') || pathname.startsWith('/blog/');
  const isMoreActive =
    pathname.startsWith('/veterinarian') ||
    pathname.startsWith('/ai-health-check') ||
    isBlogActive;

  useEffect(() => {
    setDesktopMenuOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinkClass = (active) => `text-[13px] xl:text-[14px] font-semibold transition-all duration-200 relative group whitespace-nowrap ${
    active ? 'text-[#15BB73]' : 'text-gray-600 hover:text-[#15BB73]'
  }`;

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* Header - conditionally rendered */}
      {showHeaderFooter && (
        <header className="bg-white/90 backdrop-blur-md shadow-xl border-b border-white/20 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4 h-16 sm:h-20">
              {/* Enhanced Logo Section */}
              <div className="flex shrink-0 items-center space-x-2">
                <Link to="/" className="group flex items-center space-x-2">
                  <div className="relative">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#15BB73] to-[#0FA568] rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-all duration-300 p-1 sm:p-1.5">
                      <img
                        src={logo}
                        alt="Animal E Bazar"
                        className="h-6 w-6 sm:h-8 sm:w-8 object-contain rounded-lg"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-[#15BB73] to-[#0FA568] rounded-xl blur-lg opacity-30 -z-10 group-hover:opacity-50 transition-opacity duration-300"></div>
                  </div>

                  <div className="hidden xl:block">
                    <h1 className="text-base xl:text-lg font-bold text-[#000600] bg-gradient-to-r from-[#000600] to-[#15BB73] bg-clip-text text-transparent group-hover:from-[#15BB73] group-hover:to-[#0FA568] transition-all duration-300 whitespace-nowrap">
                      Animal E Bazar
                    </h1>
                    <p className="hidden 2xl:block text-xs text-gray-600 font-medium whitespace-nowrap">Farmers Marketplace</p>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen((current) => !current)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:border-green-200 hover:text-[#15BB73] lg:hidden"
                  aria-label="Toggle navigation menu"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="h-5 w-5">
                    {mobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    )}
                  </svg>
                </button>
              </div>

              {/* Desktop navigation */}
              <div className="hidden lg:flex flex-1 items-center justify-center gap-4 xl:gap-5 px-3 min-w-0 2xl:hidden">
                <Link to="/" className={navLinkClass(pathname === '/')}>
                  {t('header.home')}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#15BB73] transition-all duration-300 ${pathname === '/' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </Link>
                <Link to="/buy-animals" className={navLinkClass(pathname.startsWith('/buy-animals'))}>
                  {t('home.buyAnimals')}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#15BB73] transition-all duration-300 ${pathname.startsWith('/buy-animals') ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </Link>
                <Link to="/sell-animal" className={navLinkClass(pathname.startsWith('/sell-animal'))}>
                  {t('header.sellAnimal')}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#15BB73] transition-all duration-300 ${pathname.startsWith('/sell-animal') ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </Link>
                <Link to="/pregnancy-calendar" className={navLinkClass(pathname.startsWith('/pregnancy-calendar'))}>
                  {t('header.pregnancy')}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#15BB73] transition-all duration-300 ${pathname.startsWith('/pregnancy-calendar') ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </Link>
                <Link to="/milk-reports" className={navLinkClass(pathname.startsWith('/milk-reports'))}>
                  {t('header.milkReports')}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#15BB73] transition-all duration-300 ${pathname.startsWith('/milk-reports') ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </Link>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setDesktopMenuOpen((current) => !current)}
                    className={`${navLinkClass(isMoreActive)} flex items-center gap-1.5`}
                  >
                    <span>{t('header.more')}</span>
                    <svg
                      className={`h-4 w-4 transition-transform duration-200 ${desktopMenuOpen ? 'rotate-180' : ''}`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
                    <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#15BB73] transition-all duration-300 ${isMoreActive ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                  </button>

                  {desktopMenuOpen ? (
                    <div className="absolute right-0 top-full z-50 mt-3 w-56 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
                      <Link
                        to="/veterinarian"
                        className={`block px-4 py-3 text-sm font-medium transition ${pathname.startsWith('/veterinarian') ? 'bg-green-50 text-[#15BB73]' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        {t('header.veterinarian')}
                      </Link>
                      <Link
                        to="/ai-health-check"
                        className={`block px-4 py-3 text-sm font-medium transition ${pathname.startsWith('/ai-health-check') ? 'bg-green-50 text-[#15BB73]' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        {t('header.healthCheck')}
                      </Link>
                      <Link
                        to="/blogs"
                        className={`block px-4 py-3 text-sm font-medium transition ${isBlogActive ? 'bg-green-50 text-[#15BB73]' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        {t('header.blogs')}
                      </Link>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="hidden 2xl:flex flex-1 items-center justify-center gap-5 px-4 min-w-0">
                <Link to="/" className={navLinkClass(pathname === '/')}>
                  {t('header.home')}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#15BB73] transition-all duration-300 ${pathname === '/' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </Link>
                <Link to="/buy-animals" className={navLinkClass(pathname.startsWith('/buy-animals'))}>
                  {t('home.buyAnimals')}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#15BB73] transition-all duration-300 ${pathname.startsWith('/buy-animals') ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </Link>
                <Link to="/sell-animal" className={navLinkClass(pathname.startsWith('/sell-animal'))}>
                  {t('header.sellAnimal')}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#15BB73] transition-all duration-300 ${pathname.startsWith('/sell-animal') ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </Link>
                <Link to="/pregnancy-calendar" className={navLinkClass(pathname.startsWith('/pregnancy-calendar'))}>
                  {t('header.pregnancy')}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#15BB73] transition-all duration-300 ${pathname.startsWith('/pregnancy-calendar') ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </Link>
                <Link to="/milk-reports" className={navLinkClass(pathname.startsWith('/milk-reports'))}>
                  {t('header.milkReports')}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#15BB73] transition-all duration-300 ${pathname.startsWith('/milk-reports') ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </Link>
                <Link to="/veterinarian" className={navLinkClass(pathname.startsWith('/veterinarian'))}>
                  {t('header.veterinarian')}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#15BB73] transition-all duration-300 ${pathname.startsWith('/veterinarian') ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </Link>
                <Link to="/ai-health-check" className={navLinkClass(pathname.startsWith('/ai-health-check'))}>
                  {t('header.healthCheck')}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#15BB73] transition-all duration-300 ${pathname.startsWith('/ai-health-check') ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </Link>
                <Link to="/blogs" className={navLinkClass(isBlogActive)}>
                  {t('header.blogs')}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#15BB73] transition-all duration-300 ${isBlogActive ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </Link>
              </div>

              {/* Action Buttons */}
              <div className="flex shrink-0 items-center space-x-2">
                {/* Language Switcher */}
                <LanguageSwitcher />
                
                {/* Wishlist Button - Responsive sizing */}
                <div className="relative group">
                  <Link
                    to="/wishlist"
                    className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 shadow-md ${
                      pathname.startsWith('/wishlist') 
                        ? 'bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white' 
                        : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 hover:from-[#15BB73] hover:to-[#0FA568] hover:text-white'
                    }`}
                    aria-label="Wishlist"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="w-4 h-4 sm:w-5 sm:h-5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                    </svg>
                    {wishlistCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                        {wishlistCount}
                      </span>
                    )}
                    {pathname.startsWith('/wishlist') && (
                      <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-white border-2 border-[#15BB73] animate-pulse"></span>
                    )}
                  </Link>
                </div>
                
                {/* Profile Button - Responsive sizing */}
                <Link
                  to="/profile"
                  className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 transform hover:scale-110 shadow-md outline-none focus:outline-none active:outline-none ${
                    pathname.startsWith('/profile') 
                      ? 'bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white' 
                      : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 hover:from-[#15BB73] hover:to-[#0FA568] hover:text-white'
                  }`}
                  aria-label="User profile"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-4 h-4 sm:w-5 sm:h-5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 20.25a7.5 7.5 0 0115 0v.75H4.5v-.75z" />
                  </svg>
                </Link>
              </div>
            </div>

          </div>
        </header>
      )}

      {showHeaderFooter ? (
        <div className={`fixed inset-0 z-40 lg:hidden ${mobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          <div
            className={`absolute inset-0 bg-black/35 transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside
            className={`absolute left-0 top-0 h-full w-[86%] max-w-[320px] border-r border-gray-200 bg-white shadow-2xl transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-5">
              <div>
                <p className="text-lg font-bold text-gray-900">Animal E Bazar</p>
                <p className="mt-1 text-xs text-gray-500">Farmers Marketplace</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition hover:border-green-200 hover:text-[#15BB73]"
                aria-label="Close navigation menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-2 px-4 py-4">
              <Link to="/" className={`block rounded-xl px-4 py-3 text-sm font-semibold transition ${pathname === '/' ? 'bg-green-50 text-[#15BB73]' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
                {t('header.home')}
              </Link>
              <Link to="/buy-animals" className={`block rounded-xl px-4 py-3 text-sm font-semibold transition ${pathname.startsWith('/buy-animals') ? 'bg-green-50 text-[#15BB73]' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
                {t('home.buyAnimals')}
              </Link>
              <Link to="/sell-animal" className={`block rounded-xl px-4 py-3 text-sm font-semibold transition ${pathname.startsWith('/sell-animal') ? 'bg-green-50 text-[#15BB73]' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
                {t('header.sellAnimal')}
              </Link>
              <Link to="/pregnancy-calendar" className={`block rounded-xl px-4 py-3 text-sm font-semibold transition ${pathname.startsWith('/pregnancy-calendar') ? 'bg-green-50 text-[#15BB73]' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
                {t('header.pregnancy')}
              </Link>
              <Link to="/milk-reports" className={`block rounded-xl px-4 py-3 text-sm font-semibold transition ${pathname.startsWith('/milk-reports') ? 'bg-green-50 text-[#15BB73]' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
                {t('header.milkReports')}
              </Link>
              <Link to="/veterinarian" className={`block rounded-xl px-4 py-3 text-sm font-semibold transition ${pathname.startsWith('/veterinarian') ? 'bg-green-50 text-[#15BB73]' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
                {t('header.veterinarian')}
              </Link>
              <Link to="/ai-health-check" className={`block rounded-xl px-4 py-3 text-sm font-semibold transition ${pathname.startsWith('/ai-health-check') ? 'bg-green-50 text-[#15BB73]' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
                {t('header.healthCheck')}
              </Link>
              <Link to="/blogs" className={`block rounded-xl px-4 py-3 text-sm font-semibold transition ${isBlogActive ? 'bg-green-50 text-[#15BB73]' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
                {t('header.blogs')}
              </Link>
            </div>
          </aside>
        </div>
      ) : null}

      {/* dynamic page content */}
      <main className={`flex-1 ${showHeaderFooter ? 'p-4 pb-6 sm:pb-8' : 'p-0'}`}>
        <Outlet />
      </main>
      {showHeaderFooter && <Footer />}

      {/* AI Assistant - Show only after login */}
      {showHeaderFooter && <AIAssistant />}
    </div>
  );
};

export default Layout;
