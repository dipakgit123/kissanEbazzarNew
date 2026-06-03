import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useWishlist } from '../contexts/useWishlist';
import { formatDate } from '../utils/dateUtils';

const WishlistPage = () => {
  const { t } = useTranslation();
  const { wishlist, removeFromWishlist } = useWishlist();

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              {t('wishlist.title') || 'My Wishlist'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('wishlist.savedAnimals')}</p>
                <p className="text-2xl font-bold text-gray-900">{wishlist.length}</p>
              </div>
            </div>
            <div className="h-12 w-px bg-gray-300"></div>
            <p className="text-sm text-gray-600">
              {t('wishlist.subtitle') || 'Your favorite animals in one place'}
            </p>
          </div>
        </div>

        {wishlist.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {t('wishlist.empty') || 'Your wishlist is empty'}
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {t('wishlist.emptySubtitle') || 'Start adding animals you love to keep track of them here'}
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>{t('home.browseAnimals') || 'Browse Animals'}</span>
            </Link>
          </div>
        ) : (
          /* Wishlist Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.map((animal) => (
              <div
                key={animal.id}
                className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 hover:shadow-md transition-all duration-200 group"
              >
                {/* Animal Image */}
                <div className="relative mb-4">
                  <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    <img
                      src={animal.imageSrc}
                      alt={animal.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromWishlist(animal.id)}
                    className="absolute top-2 right-2 w-9 h-9 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                    title="Remove from wishlist"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>

                  {/* Added Date Badge */}
                  <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-gray-600 shadow-sm">
                    {formatDate(animal.addedAt)}
                  </div>
                </div>

                {/* Animal Details */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-green-600 transition-colors truncate">
                      {animal.title}
                    </h3>
                    <p className="text-gray-600 text-sm truncate">{animal.breed} • {animal.animalType}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1 min-w-0 flex-1">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm text-gray-600 truncate">{animal.location}</span>
                    </div>
                    <span className="text-xl font-bold text-green-600 flex-shrink-0 ml-2">₹{animal.price}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 py-2 bg-gray-50 rounded-lg px-3">
                    <span className="truncate">{animal.sellerName}</span>
                    <span className="flex-shrink-0 ml-2 font-semibold">{animal.milkProduction}L/day</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.open(`tel:${animal.phoneNumber}`, '_self')}
                      className="flex-1 bg-green-600 text-white py-2.5 px-3 rounded-lg font-semibold hover:bg-green-700 transition-colors text-sm shadow-sm"
                    >
                      {t('animalDetail.callNow') || 'Call Now'}
                    </button>
                    <button
                      onClick={() => window.open(`https://wa.me/${animal.phoneNumber}?text=${encodeURIComponent(`Hi! I'm interested in your ${animal.title} (₹${animal.price}). Is it still available?`)}`, '_blank')}
                      className="flex-1 bg-green-500 text-white py-2.5 px-3 rounded-lg font-semibold hover:bg-green-600 transition-colors text-sm shadow-sm"
                    >
                      WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
