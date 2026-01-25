import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logo from '../assets/images/animal_bazar_logo.jpeg';
import AIAssistant from './AIAssistant';
import LanguageSwitcher from './LanguageSwitcher';

const Layout = ({ showHeaderFooter = true, wishlistCount = 0 }) => {
  const { pathname } = useLocation();
  const { t } = useTranslation();

  // utility to check active tab for bottom nav
  const isActive = (path) => pathname === path;

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* Header - conditionally rendered */}
      {showHeaderFooter && (
        <header className="bg-white/90 backdrop-blur-md shadow-xl border-b border-white/20 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16 sm:h-20">
              {/* Enhanced Logo Section */}
              <div className="flex items-center space-x-2 group cursor-pointer">
                {/* Logo Container with Enhanced Styling */}
                <div className="relative">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#15BB73] to-[#0FA568] rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-all duration-300 p-1 sm:p-1.5">
                    <img
                      src={logo}
                      alt="Kissan E-Bazzar"
                      className="h-6 w-6 sm:h-8 sm:w-8 object-contain rounded-lg"
                    />
                  </div>
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#15BB73] to-[#0FA568] rounded-xl blur-lg opacity-30 -z-10 group-hover:opacity-50 transition-opacity duration-300"></div>
                </div>
                
                {/* Brand Text - Hidden on mobile and tablet, shown on xl+ */}
                <div className="hidden xl:block">
                  <h1 className="text-lg font-bold text-[#000600] bg-gradient-to-r from-[#000600] to-[#15BB73] bg-clip-text text-transparent group-hover:from-[#15BB73] group-hover:to-[#0FA568] transition-all duration-300 whitespace-nowrap">
                    Kissan E-Bazzar
                  </h1>
                  <p className="text-xs text-gray-600 font-medium whitespace-nowrap">Farmers Marketplace</p>
                </div>
              </div>

              {/* Navigation Links - Hidden on mobile, shown on lg+ */}
              <div className="hidden lg:flex items-center space-x-3 xl:space-x-5">
                <Link 
                  to="/" 
                  className={`text-sm xl:text-base font-semibold transition-all duration-200 relative group whitespace-nowrap ${
                    pathname === '/' 
                      ? 'text-[#15BB73]' 
                      : 'text-gray-600 hover:text-[#15BB73]'
                  }`}
                >
                  {t('header.home')}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#15BB73] transition-all duration-300 ${
                    pathname === '/' ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}></span>
                </Link>
                <Link 
                  to="/buy-animals" 
                  className={`text-sm xl:text-base font-semibold transition-all duration-200 relative group whitespace-nowrap ${
                    pathname.startsWith('/buy-animals') 
                      ? 'text-[#15BB73]' 
                      : 'text-gray-600 hover:text-[#15BB73]'
                  }`}
                >
                  {t('home.buyAnimals')}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#15BB73] transition-all duration-300 ${
                    pathname.startsWith('/buy-animals') ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}></span>
                </Link>
                <Link
                  to="/sell-animal"
                  className={`text-sm xl:text-base font-semibold transition-all duration-200 relative group whitespace-nowrap ${
                    pathname.startsWith('/sell-animal')
                      ? 'text-[#15BB73]'
                      : 'text-gray-600 hover:text-[#15BB73]'
                  }`}
                >
                  {t('header.sellAnimal') || 'Sell Animal'}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#15BB73] transition-all duration-300 ${
                    pathname.startsWith('/sell-animal') ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}></span>
                </Link>
                <Link
                  to="/pregnancy-calendar"
                  className={`text-sm xl:text-base font-semibold transition-all duration-200 relative group whitespace-nowrap ${
                    pathname.startsWith('/pregnancy-calendar')
                      ? 'text-[#15BB73]'
                      : 'text-gray-600 hover:text-[#15BB73]'
                  }`}
                >
                  {t('header.pregnancy')}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#15BB73] transition-all duration-300 ${
                    pathname.startsWith('/pregnancy-calendar') ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}></span>
                </Link>
                <Link
                  to="/veterinarian"
                  className={`text-sm xl:text-base font-semibold transition-all duration-200 relative group whitespace-nowrap ${
                    pathname.startsWith('/veterinarian')
                      ? 'text-[#15BB73]'
                      : 'text-gray-600 hover:text-[#15BB73]'
                  }`}
                >
                  {t('header.veterinarian')}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#15BB73] transition-all duration-300 ${
                    pathname.startsWith('/veterinarian') ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}></span>
                </Link>
                <Link
                  to="/health-check"
                  className={`text-sm xl:text-base font-semibold transition-all duration-200 relative group whitespace-nowrap ${
                    pathname.startsWith('/health-check')
                      ? 'text-[#15BB73]'
                      : 'text-gray-600 hover:text-[#15BB73]'
                  }`}
                >
                  {t('header.healthCheck')}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#15BB73] transition-all duration-300 ${
                    pathname.startsWith('/health-check') ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}></span>
                </Link>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
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
                  className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 shadow-md ${
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
                  {pathname.startsWith('/profile') && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-white border-2 border-[#15BB73] animate-pulse"></span>
                  )}
                </Link>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* dynamic page content */}
      <main className={`flex-1 ${showHeaderFooter ? 'p-4 pb-20' : 'p-0'}`}>
        <Outlet />
      </main>

      {/* Bottom Navigation - conditionally rendered */}
      {showHeaderFooter && (
        <footer className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-100 p-1 sm:p-2 flex justify-around items-center z-10">
          <Link
            to="/"
            className={`flex flex-col items-center p-1 sm:p-2 rounded-lg transition ${isActive('/') ? 'text-green-600' : 'text-gray-700 hover:bg-green-50'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs mt-1">{t('header.home')}</span>
          </Link>

          <Link
            to="/buy-animals"
            className={`flex flex-col items-center p-1 sm:p-2 rounded-lg transition ${isActive('/buy-animals') ? 'text-green-600' : 'text-gray-700 hover:bg-green-50'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="text-xs mt-1">{t('home.buyAnimals')}</span>
          </Link>

          <Link
            to="/sell-animal"
            className={`flex flex-col items-center p-1 sm:p-2 rounded-lg transition relative ${
              pathname.startsWith('/sell-animal') ? 'text-green-600' : 'text-gray-700 hover:bg-green-50'
            }`}
          >
            {/* Prominent sell icon with badge effect */}
            <div className={`relative ${pathname.startsWith('/sell-animal') ? 'transform scale-110' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {pathname.startsWith('/sell-animal') && (
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
              )}
            </div>
            <span className="text-xs mt-1 font-medium">{t('header.sell') || 'Sell'}</span>
          </Link>

          <Link
            to="/veterinarian"
            className={`flex flex-col items-center p-1 sm:p-2 rounded-lg transition ${isActive('/veterinarian') ? 'text-green-600' : 'text-gray-700 hover:bg-green-50'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="text-xs mt-1">{t('header.vet')}</span>
          </Link>

          <Link
            to="/health-check"
            className={`flex flex-col items-center p-1 sm:p-2 rounded-lg transition ${isActive('/health-check') ? 'text-green-600' : 'text-gray-700 hover:bg-green-50'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-xs mt-1">{t('header.health')}</span>
          </Link>
        </footer>
      )}

      {/* AI Assistant - Show only after login */}
      {showHeaderFooter && <AIAssistant />}
    </div>
  );
};

export default Layout;