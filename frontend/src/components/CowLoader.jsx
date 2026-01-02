import React from 'react';

const CowLoader = ({ message = 'Loading...', size = 'medium' }) => {
  const sizes = {
    small: {
      container: 'w-24 h-24',
      video: 'w-20 h-20',
      text: 'text-xs',
      dotSize: 'w-1.5 h-1.5'
    },
    medium: {
      container: 'w-40 h-40',
      video: 'w-32 h-32',
      text: 'text-sm',
      dotSize: 'w-2 h-2'
    },
    large: {
      container: 'w-56 h-56',
      video: 'w-48 h-48',
      text: 'text-base',
      dotSize: 'w-2.5 h-2.5'
    }
  };

  const currentSize = sizes[size] || sizes.medium;

  return (
    <div className="flex flex-col items-center justify-center py-8">
      {/* Loader Container */}
      <div className={`relative ${currentSize.container} flex items-center justify-center`}>
        {/* Animated Ring */}
        <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
        <div
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#15BB73] border-r-[#15BB73] animate-spin"
          style={{ animationDuration: '1.5s' }}
        ></div>

        {/* Glowing Background */}
        <div
          className="absolute inset-2 rounded-full bg-gradient-to-br from-[#15BB73]/10 to-[#0FA568]/10 animate-pulse"
        ></div>

        {/* Video Container */}
        <div className={`relative ${currentSize.video} rounded-full overflow-hidden bg-white shadow-lg border-4 border-white`}>
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover scale-125"
          >
            <source src="/cow_should_be_black_and_white_and_not_flying_just_running_on_ground_seed1457887727.mp4" type="video/mp4" />
          </video>
        </div>

        {/* Animated Dots around the circle */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 ${currentSize.dotSize} bg-[#15BB73] rounded-full shadow-lg`}></div>
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s', animationDelay: '1s' }}>
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 ${currentSize.dotSize} bg-[#0FA568] rounded-full shadow-lg`}></div>
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s', animationDelay: '2s' }}>
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 ${currentSize.dotSize} bg-[#22C55E] rounded-full shadow-lg`}></div>
        </div>
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

      {/* Ground/Shadow Effect */}
      <div className="mt-2 w-20 h-2 bg-gray-200 rounded-full blur-sm opacity-50"></div>
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
          <div className="w-12 h-12 bg-gradient-to-br from-[#15BB73] to-[#0FA568] rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
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
