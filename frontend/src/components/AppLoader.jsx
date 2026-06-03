import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const LOADER_SRC = 'https://lottie.host/06f480b9-2289-4e35-ad5d-20eb8bc39b8f/afS103suEj.lottie';
const LOADER_SPEED = 1.7;

const SIZE_MAP = {
  small: {
    frame: 'h-24 w-24 sm:h-28 sm:w-28',
    copy: 'text-xs sm:text-sm',
    spacing: 'mt-3',
  },
  medium: {
    frame: 'h-36 w-36 sm:h-40 sm:w-40',
    copy: 'text-sm sm:text-base',
    spacing: 'mt-4',
  },
  large: {
    frame: 'h-52 w-52 sm:h-56 sm:w-56',
    copy: 'text-base sm:text-lg',
    spacing: 'mt-5',
  },
};

const AppLoader = ({
  message = 'Loading...',
  size = 'medium',
  fullScreen = false,
  dark = false,
  className = '',
}) => {
  const currentSize = SIZE_MAP[size] || SIZE_MAP.medium;
  const wrapperClass = fullScreen
    ? dark
      ? 'min-h-screen bg-[#030f08]'
      : 'min-h-screen bg-gradient-to-br from-[#edf6ef] via-[#f7faf8] to-[#edf7ff]'
    : '';
  const textClass = dark ? 'text-white' : 'text-slate-700';
  const subTextClass = dark ? 'text-white/70' : 'text-slate-500';
  const frameClass = dark
    ? 'border-white/10 bg-white/5 shadow-[0_24px_80px_rgba(0,0,0,0.32)]'
    : 'border-white/70 bg-white/88 shadow-[0_24px_80px_rgba(15,23,42,0.12)]';
  const glowClass = dark
    ? 'bg-emerald-400/20'
    : 'bg-emerald-100/90';

  return (
    <div className={`${wrapperClass} flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center justify-center px-4 py-6 text-center">
        <div
          className={`relative overflow-hidden rounded-[30px] border p-3 backdrop-blur ${currentSize.frame} ${frameClass}`}
        >
          <div className={`absolute inset-x-6 top-5 h-14 rounded-full blur-2xl ${glowClass}`} />
          <div className="relative h-full w-full overflow-hidden rounded-[24px] bg-gradient-to-br from-white via-[#f7fff9] to-[#edf7f0]">
            <DotLottieReact
              src={LOADER_SRC}
              loop
              autoplay
              speed={LOADER_SPEED}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>

        {message ? (
          <div className={currentSize.spacing}>
            <p className={`font-semibold ${currentSize.copy} ${textClass}`}>{message}</p>
            <p className={`mt-1 text-xs sm:text-sm ${subTextClass}`}>Please wait a moment</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export const FullPageLoader = ({ message = 'Loading...', dark = false, className = '' }) => (
  <AppLoader message={message} size="large" fullScreen dark={dark} className={className} />
);

export const InlineLoader = ({ message = 'Loading...', size = 'small', dark = false, className = '' }) => (
  <AppLoader message={message} size={size} dark={dark} className={className} />
);

export default AppLoader;
