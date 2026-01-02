import React, { useEffect, useState, useMemo } from 'react';
import cow from '../assets/images/cow.jpg';
import buffello from '../assets/images/buffello.jpg';
import bull from '../assets/images/bull.jpg';
import goat from '../assets/images/goat.jpg';
import horse from '../assets/images/horse.png';
import dog from '../assets/images/dog.jpg';
import cat from '../assets/cliparts/cat_clipart.png';

const images = [
  { src: cow, alt: 'Cow', color: '#22C55E', lightBg: '#DCFCE7' },
  { src: buffello, alt: 'Buffalo', color: '#6366F1', lightBg: '#E0E7FF' },
  { src: bull, alt: 'Bull', color: '#F59E0B', lightBg: '#FEF3C7' },
  { src: goat, alt: 'Goat', color: '#EC4899', lightBg: '#FCE7F3' },
  { src: horse, alt: 'Horse', color: '#8B5CF6', lightBg: '#EDE9FE' },
  { src: dog, alt: 'Dog', color: '#14B8A6', lightBg: '#CCFBF1' },
  { src: cat, alt: 'Cat', color: '#F97316', lightBg: '#FFEDD5' }
];

const ScrollingCircleBar = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const activeItem = useMemo(() => images[activeIndex], [activeIndex]);

  return (
    <div
      className="w-full rounded-2xl transition-all duration-500 relative overflow-hidden mt-4"
      style={{
        background: `linear-gradient(135deg, ${activeItem.lightBg} 0%, white 50%, ${activeItem.lightBg}40 100%)`
      }}
    >
      {/* Animated background blobs */}
      <div
        className="absolute -top-20 -left-20 w-40 h-40 rounded-full blur-3xl opacity-40 transition-all duration-700"
        style={{ backgroundColor: activeItem.color }}
      />
      <div
        className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-30 transition-all duration-700"
        style={{ backgroundColor: activeItem.color }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 rounded-full blur-3xl opacity-20 transition-all duration-700"
        style={{ backgroundColor: activeItem.color }}
      />

      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-4 left-10 w-8 h-8 border-2 border-gray-400 rounded-full" />
        <div className="absolute bottom-4 right-10 w-6 h-6 border-2 border-gray-400 rounded-full" />
        <div className="absolute top-6 right-1/4 w-4 h-4 bg-gray-400 rounded-full" />
        <div className="absolute bottom-6 left-1/4 w-3 h-3 bg-gray-400 rounded-full" />
      </div>

      <div className="relative z-10 pt-8 pb-6 px-4">
        <div className="flex justify-center items-center gap-3 sm:gap-5 md:gap-8 lg:gap-10 overflow-x-auto scrollbar-hide">
          {images.map((img, index) => {
            const isActive = activeIndex === index;
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={index}
                className="flex flex-col items-center cursor-pointer flex-shrink-0"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setActiveIndex(index)}
              >
                {/* Circle Container with proper spacing */}
                <div
                  className="relative transition-all duration-300 ease-out"
                  style={{
                    transform: isHovered || isActive ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  {/* Animated Glow Effect */}
                  <div
                    className="absolute -inset-3 rounded-full blur-xl transition-all duration-500"
                    style={{
                      background: `radial-gradient(circle, ${img.color}50 0%, transparent 70%)`,
                      opacity: isHovered || isActive ? 1 : 0,
                    }}
                  />

                  {/* Rotating Ring for Active */}
                  {isActive && (
                    <div
                      className="absolute -inset-2 rounded-full animate-spin"
                      style={{
                        background: `conic-gradient(from 0deg, ${img.color}, transparent, ${img.color})`,
                        animationDuration: '3s'
                      }}
                    />
                  )}

                  {/* Outer Ring */}
                  <div
                    className="absolute -inset-1.5 rounded-full transition-all duration-300"
                    style={{
                      background: isActive
                        ? `linear-gradient(135deg, ${img.color}, ${img.color}80)`
                        : isHovered
                          ? `linear-gradient(135deg, ${img.color}40, ${img.color}20)`
                          : 'transparent',
                    }}
                  />

                  {/* Main Circle */}
                  <div
                    className="relative rounded-full overflow-hidden w-[72px] h-[72px] sm:w-[88px] sm:h-[88px] md:w-[100px] md:h-[100px] transition-all duration-300 bg-white"
                    style={{
                      boxShadow: isHovered || isActive
                        ? `0 15px 50px -12px ${img.color}90, 0 8px 25px -8px ${img.color}50`
                        : '0 4px 20px -8px rgba(0,0,0,0.15)',
                      border: isActive
                        ? '3px solid white'
                        : isHovered
                          ? `3px solid ${img.color}`
                          : '3px solid #f3f4f6',
                    }}
                  >
                    <img
                      src={img.src}
                      alt={img.alt}
                      className="w-full h-full object-cover transition-transform duration-500"
                      style={{
                        transform: isHovered ? 'scale(1.2)' : 'scale(1)'
                      }}
                    />

                    {/* Gradient Overlay on Hover */}
                    <div
                      className="absolute inset-0 flex items-center justify-center transition-all duration-300"
                      style={{
                        background: `linear-gradient(to top, ${img.color}F0 0%, ${img.color}90 40%, transparent 100%)`,
                        opacity: isHovered ? 1 : 0
                      }}
                    >
                      <div className="text-white text-center transform translate-y-3">
                        <svg className="w-7 h-7 sm:w-8 sm:h-8 mx-auto mb-1 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span className="text-xs font-bold tracking-wide">View All</span>
                      </div>
                    </div>
                  </div>

                  {/* Active Indicator */}
                  {isActive && (
                    <div
                      className="absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-lg z-10 border-2 border-white"
                      style={{ backgroundColor: img.color }}
                    >
                      <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                    </div>
                  )}

                  {/* Hover Ring Pulse */}
                  {isHovered && !isActive && (
                    <div
                      className="absolute -inset-1 rounded-full animate-ping opacity-30"
                      style={{ backgroundColor: img.color }}
                    />
                  )}
                </div>

                {/* Label */}
                <div className="mt-4 text-center">
                  <span
                    className="text-sm sm:text-base font-bold transition-all duration-300 relative px-1"
                    style={{
                      color: isActive || isHovered ? img.color : '#4B5563'
                    }}
                  >
                    {img.alt}
                    {/* Animated underline */}
                    <span
                      className="absolute -bottom-1 left-0 h-[3px] rounded-full transition-all duration-300"
                      style={{
                        width: isActive || isHovered ? '100%' : '0%',
                        backgroundColor: img.color
                      }}
                    />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enhanced Navigation Dots */}
        <div className="flex justify-center mt-5 gap-2">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className="relative group"
            >
              <div
                className="rounded-full transition-all duration-300"
                style={{
                  width: idx === activeIndex ? '28px' : '10px',
                  height: '10px',
                  backgroundColor: idx === activeIndex ? img.color : '#D1D5DB',
                  boxShadow: idx === activeIndex ? `0 2px 10px -2px ${img.color}` : 'none'
                }}
              />
              {idx === activeIndex && (
                <div
                  className="absolute inset-0 rounded-full animate-ping opacity-40"
                  style={{ backgroundColor: img.color }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScrollingCircleBar;
