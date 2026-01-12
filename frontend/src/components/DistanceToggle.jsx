import React from 'react';
import { useTranslation } from 'react-i18next';

const DistanceToggle = ({ activeMode, onModeChange }) => {
  const { t } = useTranslation();
  const modes = [
    {
      id: 'all',
      label: t('distanceToggle.all'),
      sublabel: '500 km',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: '#6366F1',
      bgColor: '#EEF2FF'
    },
    {
      id: 'nearby',
      label: t('distanceToggle.nearby'),
      sublabel: '100 km',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: '#15BB73',
      bgColor: '#DCFCE7'
    }
  ];

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-1.5 flex gap-2">
        {modes.map((mode) => {
          const isActive = activeMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              className={`
                flex-1 flex items-center justify-center gap-3 py-3 px-4 rounded-xl
                transition-all duration-300 ease-out
                ${isActive
                  ? 'shadow-lg transform scale-[1.02]'
                  : 'hover:bg-gray-50'
                }
              `}
              style={{
                backgroundColor: isActive ? mode.bgColor : 'transparent',
              }}
            >
              {/* Icon */}
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  transition-all duration-300
                  ${isActive ? 'shadow-md' : ''}
                `}
                style={{
                  backgroundColor: isActive ? mode.color : '#E5E7EB',
                  color: isActive ? 'white' : '#6B7280'
                }}
              >
                {mode.icon}
              </div>

              {/* Text */}
              <div className="text-left">
                <p
                  className={`
                    font-semibold text-sm sm:text-base transition-colors duration-300
                  `}
                  style={{
                    color: isActive ? mode.color : '#374151'
                  }}
                >
                  {mode.label}
                </p>
                <p
                  className={`
                    text-xs transition-colors duration-300
                  `}
                  style={{
                    color: isActive ? mode.color : '#9CA3AF'
                  }}
                >
                  {mode.sublabel}
                </p>
              </div>

              {/* Active Indicator */}
              {isActive && (
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: mode.color }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DistanceToggle;
