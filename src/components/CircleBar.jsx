import React from 'react';
import cow from '../assets/images/cow.jpg';
import buffello from '../assets/images/buffello.jpg';
import bull from '../assets/images/bull.jpg';
import goat from '../assets/images/goat.jpg';
import horse from '../assets/images/horse.png';
import dog from '../assets/images/dog.jpg';

const images = [
  { src: cow, alt: 'गाय' },
  { src: buffello, alt: 'भैंस' },
  { src: bull, alt: 'बैल' },
  { src: goat, alt: 'बकरा' },
  { src: horse, alt: 'घोड़ा' },
  {src:dog, alt:"कुत्रा"}
];

const CircleBar = () => (
  <div className="w-full bg-white/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
    <div className="flex justify-center flex-wrap gap-6 lg:gap-8">
      {images.map((img, index) => (
        <div 
          key={img.alt} 
          className="flex flex-col items-center group cursor-pointer transform hover:scale-110 transition-all duration-300"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          {/* Circle Container with Enhanced Styling */}
          <div className="relative">
            {/* Outer Glow Effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#15BB73] to-[#0FA568] opacity-0 group-hover:opacity-30 blur-lg transition-opacity duration-300 scale-110"></div>
            
            {/* Main Circle */}
            <div className="relative rounded-full overflow-hidden border-3 border-[#15BB73] shadow-xl w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 group-hover:border-[#0FA568] group-hover:shadow-2xl transition-all duration-300">
              <img 
                src={img.src} 
                alt={img.alt} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
              />
              
              {/* Overlay on Hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#15BB73]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="text-white text-center">
                  <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <p className="text-xs font-medium">View</p>
                </div>
              </div>
            </div>
            
            {/* Pulse Animation Ring */}
            <div className="absolute inset-0 rounded-full border-2 border-[#15BB73] opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
          </div>
          
          {/* Label with Enhanced Styling */}
          <span className="text-xs sm:text-sm font-medium text-gray-700 mt-3 group-hover:text-[#15BB73] transition-colors duration-300 whitespace-nowrap">
            {img.alt}
          </span>
          
          {/* Count Badge (Optional) */}
          <div className="mt-1 px-2 py-1 bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {Math.floor(Math.random() * 50) + 10}+
          </div>
        </div>
      ))}
    </div>
    
    {/* Decorative Elements */}
    <div className="absolute top-4 left-4 w-2 h-2 bg-[#15BB73] rounded-full animate-pulse"></div>
    <div className="absolute top-6 right-6 w-1 h-1 bg-[#0FA568] rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
    <div className="absolute bottom-4 left-8 w-1.5 h-1.5 bg-[#15BB73] rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
  </div>
);

export default CircleBar;
