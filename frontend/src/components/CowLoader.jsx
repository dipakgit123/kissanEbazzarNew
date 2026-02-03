import React from 'react';
import cowLogo from '../assets/images/cow1.png';

const CowLoader = ({ message = 'Loading...', size = 'medium' }) => {
  const sizes = {
    small: {
      container: 'w-24 h-24',
      logoWrap: 'w-14 h-14',
      logo: 'w-10 h-10',
      text: 'text-xs',
      dotSize: 'w-1.5 h-1.5'
    },
    medium: {
      container: 'w-36 h-36',
      logoWrap: 'w-20 h-20',
      logo: 'w-16 h-16',
      text: 'text-sm',
      dotSize: 'w-2 h-2'
    },
    large: {
      container: 'w-52 h-52',
      logoWrap: 'w-28 h-28',
      logo: 'w-24 h-24',
      text: 'text-base',
      dotSize: 'w-2.5 h-2.5'
    }
  };

  const currentSize = sizes[size] || sizes.medium;

  return (
    <div className="flex flex-col items-center justify-center py-8">
      {/* Loader Container */}
      <div className={`relative ${currentSize.container} flex items-center justify-center`}>
        {/* Soft Background Ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#15BB73]/10 via-white to-[#0FA568]/10 shadow-inner"></div>
        <div className="absolute inset-0 rounded-full border-2 border-[#15BB73]/20"></div>

        {/* Animated Accent Ring */}
        <div
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#15BB73] border-r-[#0FA568] animate-spin"
          style={{ animationDuration: '1.4s' }}
        ></div>
        <div
          className="absolute inset-2 rounded-full bg-white/70 backdrop-blur border border-white shadow-xl animate-pulse-glow"
        ></div>

        {/* Logo Container */}
        <div className={`relative ${currentSize.logoWrap} rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center`}>
          <img
            src={cowLogo}
            alt="Loading"
            className={`${currentSize.logo} object-contain animate-float`}
          />
        </div>

        {/* Orbiting Dots */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 ${currentSize.dotSize} bg-[#15BB73] rounded-full shadow-md`}></div>
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s', animationDelay: '1s' }}>
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 ${currentSize.dotSize} bg-[#0FA568] rounded-full shadow-md`}></div>
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s', animationDelay: '2s' }}>
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 ${currentSize.dotSize} bg-[#22C55E] rounded-full shadow-md`}></div>
        </div>

        {/* Ground Shadow */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-2 bg-gray-200 rounded-full blur-sm opacity-60"></div>
      </div>

      {/* Loading Text */}
      <div className="mt-4 flex flex-col items-center">
        <p className={`${currentSize.text} font-semibold text-gray-700`}>{message}</p>

        {/* Animated Dots */}
        <div className="flex space-x-1 mt-2">
          <div
            className="w-2 h-2 bg-[#15BB73] rounded-full animate-bounce"
            style={{ animationDelay: '0ms' }}
          ></div>
          <div
            className="w-2 h-2 bg-[#0FA568] rounded-full animate-bounce"
            style={{ animationDelay: '150ms' }}
          ></div>
          <div
            className="w-2 h-2 bg-[#22C55E] rounded-full animate-bounce"
            style={{ animationDelay: '300ms' }}
          ></div>
        </div>
      </div>

      {/* Spacer for balance */}
      <div className="mt-1 h-2"></div>
    </div>
  );
};

// Full Page Loader variant
export const FullPageCowLoader = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#E9F0F8] to-[#F0F8FF]">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-20 h-20 border-2 border-gray-400 rounded-full"></div>
        <div className="absolute bottom-20 right-20 w-16 h-16 border-2 border-gray-400 rounded-full"></div>
        <div className="absolute top-1/4 right-1/4 w-8 h-8 bg-gray-400 rounded-full"></div>
        <div className="absolute bottom-1/3 left-1/3 w-6 h-6 bg-gray-400 rounded-full"></div>
      </div>

      <div className="flex flex-col items-center">
        {/* Logo */}
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg border border-gray-100">
            <img src={cowLogo} alt="Kissan E-Bazzar" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#000600]">Kissan E-Bazzar</h1>
            <p className="text-xs text-gray-600">Farmers Marketplace</p>
          </div>
        </div>

        <CowLoader message={message} size="large" />
      </div>
    </div>
  );
};

// Inline Loader for cards/sections
export const InlineCowLoader = ({ message = 'Loading...' }) => {
  return (
    <div className="flex items-center justify-center p-8">
      <CowLoader message={message} size="small" />
    </div>
  );
};

export default CowLoader;
