import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import logo from '../assets/images/animal_logog.jpeg';
import AIAssistant from './AIAssistant';

const Layout = ({ showHeaderFooter = true, wishlistCount = 0 }) => {
  const { pathname } = useLocation();

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
              <div className="flex items-center space-x-2 sm:space-x-4 group cursor-pointer">
                {/* Logo Container with Enhanced Styling */}
                <div className="relative">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[#15BB73] to-[#0FA568] rounded-2xl flex items-center justify-center shadow-2xl transform group-hover:scale-105 transition-all duration-300 p-1 sm:p-2">
                    <img
                      src={logo}
                      alt="Kissan E-Bazzar"
                      className="h-8 w-8 sm:h-10 sm:w-10 object-contain rounded-lg"
                    />
                  </div>
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#15BB73] to-[#0FA568] rounded-2xl blur-lg opacity-30 -z-10 group-hover:opacity-50 transition-opacity duration-300"></div>
                </div>
                
                {/* Brand Text - Hidden on mobile, shown on sm+ */}
                <div className="hidden sm:block">
                  <h1 className="text-lg sm:text-2xl font-bold text-[#000600] bg-gradient-to-r from-[#000600] to-[#15BB73] bg-clip-text text-transparent group-hover:from-[#15BB73] group-hover:to-[#0FA568] transition-all duration-300">
                    Kissan E-Bazzar
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">Farmers Marketplace</p>
                </div>
              </div>

              {/* Navigation Links - Hidden on mobile, shown on lg+ */}
              <div className="hidden lg:flex items-center space-x-8">
                <Link 
                  to="/" 
                  className={`font-semibold transition-all duration-200 relative group ${
                    pathname === '/' 
                      ? 'text-[#15BB73]' 
                      : 'text-gray-600 hover:text-[#15BB73]'
                  }`}
                >
                  Home
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#15BB73] transition-all duration-300 ${
                    pathname === '/' ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}></span>
                </Link>
                <Link 
                  to="/sell-animal" 
                  className={`font-semibold transition-all duration-200 relative group ${
                    pathname.startsWith('/sell') 
                      ? 'text-[#15BB73]' 
                      : 'text-gray-600 hover:text-[#15BB73]'
                  }`}
                >
                  Sell Animal
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#15BB73] transition-all duration-300 ${
                    pathname.startsWith('/sell') ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}></span>
                </Link>
                <Link 
                  to="/map" 
                  className={`font-semibold transition-all duration-200 relative group ${
                    pathname.startsWith('/map') 
                      ? 'text-[#15BB73]' 
                      : 'text-gray-600 hover:text-[#15BB73]'
                  }`}
                >
                  Map
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#15BB73] transition-all duration-300 ${
                    pathname.startsWith('/map') ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}></span>
                </Link>
                <Link 
                  to="/profile" 
                  className={`font-semibold transition-all duration-200 relative group ${
                    pathname.startsWith('/profile') 
                      ? 'text-[#15BB73]' 
                      : 'text-gray-600 hover:text-[#15BB73]'
                  }`}
                >
                  Profile
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#15BB73] transition-all duration-300 ${
                    pathname.startsWith('/profile') ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}></span>
                </Link>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 sm:space-x-4">
                {/* Sell Now Button - Responsive sizing */}
                <Link
                  to="/sell-animal"
                  className="bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white px-3 py-2 sm:px-6 sm:py-3 rounded-xl font-semibold hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center space-x-1 sm:space-x-2">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="text-xs sm:text-base">Sell Now</span>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0FA568] to-[#15BB73] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
                
                {/* Wishlist Button - Responsive sizing */}
                <div className="relative group">
                  <Link
                    to="/wishlist"
                    className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 shadow-lg ${
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
                      className="w-5 h-5 sm:w-6 sm:h-6"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                    </svg>
                    {wishlistCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                        {wishlistCount}
                      </span>
                    )}
                    {pathname.startsWith('/wishlist') && (
                      <span className="absolute -top-1 -right-1 h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-white border-2 border-[#15BB73] animate-pulse"></span>
                    )}
                  </Link>
                  
                  {/* Tooltip - Hidden on mobile */}
                  <div className="hidden sm:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-50">
                    {wishlistCount === 0 ? 'No items in wishlist' : `${wishlistCount} item${wishlistCount === 1 ? '' : 's'} in wishlist`}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
                
                {/* Profile Button - Responsive sizing */}
                <Link
                  to="/profile"
                  className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 shadow-lg ${
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
                    className="w-5 h-5 sm:w-6 sm:h-6"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 20.25a7.5 7.5 0 0115 0v.75H4.5v-.75z" />
                  </svg>
                  {pathname.startsWith('/profile') && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-white border-2 border-[#15BB73] animate-pulse"></span>
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
            <span className="text-xs mt-1">Animall</span>
          </Link>

          <button className="flex flex-col items-center text-gray-400 p-1 sm:p-2 rounded-lg cursor-not-allowed">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="text-xs mt-1">पशु खरीदें</span>
          </button>

          <Link
            to="/sell-animal"
            className={`flex flex-col items-center p-1 sm:p-2 rounded-lg transition ${isActive('/sell-animal') ? 'text-green-600' : 'text-gray-700 hover:bg-green-50'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs mt-1">पशु बेचें</span>
          </Link>

          <Link
            to="/map"
            className={`flex flex-col items-center p-1 sm:p-2 rounded-lg transition ${isActive('/map') ? 'text-green-600' : 'text-gray-700 hover:bg-green-50'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs mt-1">Map</span>
          </Link>

          <Link
            to="/pregnancy-calendar"
            className={`flex flex-col items-center p-1 sm:p-2 rounded-lg transition ${isActive('/pregnancy-calendar') ? 'text-green-600' : 'text-gray-700 hover:bg-green-50'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs mt-1">Pregnancy</span>
          </Link>

          <Link
            to="/veterinarian"
            className={`flex flex-col items-center p-1 sm:p-2 rounded-lg transition ${isActive('/veterinarian') ? 'text-green-600' : 'text-gray-700 hover:bg-green-50'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="text-xs mt-1">पशु डॉक्टर</span>
          </Link>
        </footer>
      )}

      {/* AI Assistant - Show only after login */}
      {showHeaderFooter && <AIAssistant />}
    </div>
  );
};

export default Layout;