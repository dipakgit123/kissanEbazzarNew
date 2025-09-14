import React, { useEffect, useState } from 'react';
import cow from '../assets/images/cow.jpg';
import buffello from '../assets/images/buffello.jpg';
import bull from '../assets/images/bull.jpg';
import goat from '../assets/images/goat.jpg';
import horse from '../assets/images/horse.png';

const images = [
  { src: cow, alt: 'गाय' },
  { src: buffello, alt: 'भैंस' },
  { src: bull, alt: 'बैल' },
  { src: goat, alt: 'बकरा' },
  { src: horse, alt: 'घोड़ा' },
];

const ITEM_SIZE = 120; // adjust as needed (px)
const GAP = 10;        // adjust as needed (px)

const ScrollingCircleBar = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 3000); // 3-second step for smoother experience
    return () => clearInterval(id);
  }, []);

  const translate = -(ITEM_SIZE + GAP) * index;

  return (
    <div className="w-full overflow-hidden bg-gradient-to-r from-[#15BB73]/5 to-[#0FA568]/5 rounded-2xl py-6 mt-5 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-2 left-8 w-16 h-16 bg-[#15BB73]/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-2 right-12 w-12 h-12 bg-[#0FA568]/30 rounded-full blur-lg"></div>
      </div>
      
      {/* Scroll Container */}
      <div className="relative">
        <div
          className="flex items-center transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(${translate}px)` }}
        >
          {images.map((img, idx) => (
            <div 
              key={idx} 
              className="flex flex-col items-center mx-4 sm:mx-6 group cursor-pointer"
            >
              {/* Enhanced Circle Container */}
              <div className="relative">
                {/* Glow Effect */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#15BB73] to-[#0FA568] opacity-0 group-hover:opacity-40 blur-lg transition-opacity duration-300 scale-110"></div>
                
                {/* Main Circle */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-3 border-[#15BB73] shadow-xl group-hover:border-[#0FA568] group-hover:shadow-2xl transition-all duration-300">
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#15BB73]/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="text-white text-center">
                      <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <p className="text-xs font-medium">Browse</p>
                    </div>
                  </div>
                </div>
                
                {/* Pulse Ring */}
                <div className="absolute inset-0 rounded-full border-2 border-[#15BB73] opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
              </div>
              
              {/* Enhanced Label */}
              <span className="text-xs sm:text-sm font-medium text-gray-700 mt-3 group-hover:text-[#15BB73] transition-colors duration-300 whitespace-nowrap">
                {img.alt}
              </span>
              
              {/* Count Badge */}
              <div className="mt-1 px-2 py-1 bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {Math.floor(Math.random() * 30) + 5}+
              </div>
            </div>
          ))}
        </div>
        
        {/* Navigation Dots */}
        <div className="flex justify-center mt-4 space-x-2">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                idx === index 
                  ? 'bg-[#15BB73] w-6' 
                  : 'bg-gray-300 hover:bg-[#15BB73]/50'
              }`}
            />
          ))}
        </div>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute top-3 left-6 w-1.5 h-1.5 bg-[#15BB73] rounded-full animate-pulse"></div>
      <div className="absolute bottom-3 right-8 w-1 h-1 bg-[#0FA568] rounded-full animate-pulse" style={{animationDelay: '0.7s'}}></div>
    </div>
  );
};

export default ScrollingCircleBar;
