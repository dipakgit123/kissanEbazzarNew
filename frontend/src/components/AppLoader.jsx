import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import cowImage from '../assets/images/cow1.png';

const LOADER_SRC = 'https://lottie.host/06f480b9-2289-4e35-ad5d-20eb8bc39b8f/afS103suEj.lottie';
const SIZE_MAP = {
  small: { frame: 'h-12 w-12', copy: 'text-xs sm:text-sm', gap: 'gap-3' },
  medium: { frame: 'h-16 w-16 sm:h-20 sm:w-20', copy: 'text-sm', gap: 'gap-3 sm:gap-4' },
  large: { frame: 'h-20 w-20 sm:h-24 sm:w-24', copy: 'text-sm sm:text-base', gap: 'gap-4' },
};

const AppLoader = ({ message, size = 'medium', fullScreen = false, dark = false, className = '' }) => {
  const { t } = useTranslation();
  const currentSize = SIZE_MAP[size] || SIZE_MAP.medium;
  const [reducedMotion, setReducedMotion] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const [animationFailed, setAnimationFailed] = useState(false);
  const [player, setPlayer] = useState(null);

  useEffect(() => {
    const preference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!preference) return;
    const update = () => setReducedMotion(preference.matches);
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!player) return;
    const failed = () => setAnimationFailed(true);
    player.addEventListener('loadError', failed);
    return () => player.removeEventListener('loadError', failed);
  }, [player]);

  const shell = dark ? 'border-white/15 bg-[#10291f] text-white' : 'border-[#d5e3db] bg-white text-[#173f32]';

  return (
    <div className={`flex min-w-0 items-center justify-center ${fullScreen ? `min-h-[40vh] px-4 py-10 sm:py-14 ${dark ? 'bg-[#030f08]' : 'site-background'}` : ''} ${className}`}>
      <div role="status" aria-live="polite" aria-atomic="true" className={`flex max-w-full items-center ${currentSize.gap} ${fullScreen ? `w-full max-w-sm rounded-2xl border p-4 sm:p-5 ${shell}` : `p-2 ${dark ? 'text-white' : 'text-[#173f32]'}`}`}>
        <div aria-hidden="true" className={`shrink-0 overflow-hidden rounded-xl bg-white ${currentSize.frame}`}>
          {reducedMotion || animationFailed ? (
            <img src={cowImage} alt="" className="h-full w-full object-contain p-1" />
          ) : (
            <DotLottieReact src={LOADER_SRC} loop autoplay speed={1.2} dotLottieRefCallback={setPlayer} style={{ width: '100%', height: '100%' }} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`break-words font-semibold leading-relaxed ${currentSize.copy}`}>{message || t('common.loading')}</p>
          <div aria-hidden="true" className={`mt-3 flex items-center gap-1.5 ${dark ? 'text-emerald-300' : 'text-emerald-700'}`}>
            {[0, 1, 2].map(index => <span key={index} className="h-1.5 w-1.5 rounded-full bg-current motion-safe:animate-pulse" style={{ animationDelay: `${index * 180}ms` }} />)}
          </div>
        </div>
      </div>
    </div>
  );
};

export const FullPageLoader = ({ message, dark = false, className = '' }) => (
  <AppLoader message={message} size="large" fullScreen dark={dark} className={className} />
);

export const InlineLoader = ({ message, size = 'small', dark = false, className = '' }) => (
  <AppLoader message={message} size={size} dark={dark} className={className} />
);

export default AppLoader;
