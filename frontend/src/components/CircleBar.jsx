import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import cow from '../assets/images/cow.jpg';
import buffello from '../assets/images/buffello.jpg';
import bull from '../assets/images/bull.jpg';
import goat from '../assets/images/goat.jpg';
import horse from '../assets/images/horse.png';
import dog from '../assets/images/dog.jpg';
import cat from '../assets/cliparts/cat_clipart.png';

const images = [
  { src: cow, alt: 'Cow', category: 'cow', apiEndpoint: 'animals', color: '#22C55E', lightBg: '#DCFCE7' },
  { src: buffello, alt: 'Buffalo', category: 'buffalo', apiEndpoint: 'buffalos', color: '#6366F1', lightBg: '#E0E7FF' },
  { src: bull, alt: 'Bull', category: 'bull', apiEndpoint: 'animals', color: '#F59E0B', lightBg: '#FEF3C7' },
  { src: goat, alt: 'Goat', category: 'goat', apiEndpoint: 'goats', color: '#EC4899', lightBg: '#FCE7F3' },
  { src: horse, alt: 'Horse', category: 'horse', apiEndpoint: 'horses', color: '#8B5CF6', lightBg: '#EDE9FE' },
  { src: dog, alt: 'Dog', category: 'dog', apiEndpoint: 'dogs', color: '#14B8A6', lightBg: '#CCFBF1' },
  { src: cat, alt: 'Cat', category: 'cat', apiEndpoint: 'cats', color: '#F97316', lightBg: '#FFEDD5' }
];

const CircleBar = ({ onCategoryClick, selectedCategory }) => {
  const { t } = useTranslation();
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const activeItem = useMemo(() => {
    if (selectedCategory) {
      return images.find(img => img.category === selectedCategory);
    }
    return null;
  }, [selectedCategory]);

  return (
    <div
      className="w-full rounded-2xl transition-all duration-500 relative"
      style={{
        background: activeItem
          ? `linear-gradient(135deg, ${activeItem.lightBg} 0%, white 50%, ${activeItem.lightBg}40 100%)`
          : 'linear-gradient(135deg, #f8fafc 0%, white 50%, #f1f5f9 100%)'
      }}
    >
      {/* Animated background blobs */}
      {activeItem && (
        <>
          <div
            className="absolute -top-20 -left-20 w-40 h-40 rounded-full blur-3xl opacity-40 transition-all duration-700"
            style={{ backgroundColor: activeItem.color }}
          />
          <div
            className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-30 transition-all duration-700"
            style={{ backgroundColor: activeItem.color }}
          />
        </>
      )}

      <div className="relative z-10 py-6 px-4">
        <div className="flex justify-center items-center flex-wrap gap-4 sm:gap-6 md:gap-8 lg:gap-10">
          {images.map((img, index) => {
            const isSelected = selectedCategory === img.category;
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={img.alt}
                className="flex flex-col items-center cursor-pointer"
                onClick={() => onCategoryClick && onCategoryClick(img.category, img.apiEndpoint)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Circle Container */}
                <div className="relative p-2">
                  {/* Glow Effect */}
                  <div
                    className="absolute inset-0 rounded-full blur-xl transition-all duration-300"
                    style={{
                      background: img.color,
                      opacity: isHovered || isSelected ? 0.3 : 0,
                      transform: isHovered || isSelected ? 'scale(1.3)' : 'scale(1)'
                    }}
                  />

                  {/* Outer Ring */}
                  {(isSelected || isHovered) && (
                    <div
                      className="absolute inset-0 rounded-full transition-all duration-300"
                      style={{
                        background: `linear-gradient(135deg, ${img.color}, ${img.color}60)`,
                        padding: '3px'
                      }}
                    />
                  )}

                  {/* Main Circle */}
                  <div
                    className="relative rounded-full overflow-hidden w-[80px] h-[80px] sm:w-[95px] sm:h-[95px] md:w-[110px] md:h-[110px] transition-all duration-300 bg-white"
                    style={{
                      boxShadow: isHovered || isSelected
                        ? `0 12px 35px -8px ${img.color}80`
                        : '0 4px 15px -5px rgba(0,0,0,0.1)',
                      border: isSelected
                        ? `4px solid ${img.color}`
                        : isHovered
                          ? `3px solid ${img.color}`
                          : '3px solid #e5e7eb',
                      transform: isHovered ? 'scale(1.08)' : 'scale(1)'
                    }}
                  >
                    <img
                      src={img.src}
                      alt={img.alt}
                      className="w-full h-full object-cover transition-transform duration-400"
                      style={{
                        transform: isHovered ? 'scale(1.15)' : 'scale(1)'
                      }}
                    />

                    {/* Hover Overlay */}
                    <div
                      className="absolute inset-0 flex items-center justify-center transition-all duration-300"
                      style={{
                        background: `linear-gradient(to top, ${img.color}EE 0%, ${img.color}AA 50%, transparent 100%)`,
                        opacity: isHovered ? 1 : 0
                      }}
                    >
                      <div className="text-white text-center mt-4">
                        <svg className="w-7 h-7 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span className="text-xs font-bold">{t('home.viewAll')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Checkmark Badge */}
                  {isSelected && (
                    <div
                      className="absolute top-0 right-0 w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2 border-white"
                      style={{ backgroundColor: img.color }}
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Label */}
                <span
                  className="mt-2 text-sm sm:text-base font-semibold transition-all duration-300"
                  style={{
                    color: isSelected || isHovered ? img.color : '#4B5563'
                  }}
                >
                  {img.alt}
                </span>

                {/* Underline */}
                <div
                  className="h-[3px] rounded-full transition-all duration-300 mt-1"
                  style={{
                    width: isSelected || isHovered ? '100%' : '0%',
                    backgroundColor: img.color
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CircleBar;
