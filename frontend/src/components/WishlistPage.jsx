import React from 'react';
import { Link } from 'react-router-dom';

const WishlistPage = ({ wishlist, removeFromWishlist, isInWishlist }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E9F0F8] to-[#F0F8FF] py-4 lg:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-6 lg:mb-8">
          <div className="inline-flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3 mb-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[#15BB73] to-[#0FA568] rounded-2xl flex items-center justify-center shadow-2xl animate-pulse-glow">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#000600]">My Wishlist</h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2">
                {wishlist.length} {wishlist.length === 1 ? 'animal' : 'animals'} saved
              </p>
            </div>
          </div>
        </div>

        {wishlist.length === 0 ? (
          /* Empty State */
          <div className="text-center py-8 lg:py-16">
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-600 mb-3 sm:mb-4">No animals in wishlist yet</h3>
            <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-8 max-w-md mx-auto px-4">
              Start exploring animals and add them to your wishlist by clicking the heart icon on any animal card.
            </p>
            <Link
              to="/"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Browse Animals</span>
            </Link>
          </div>
        ) : (
          /* Wishlist Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {wishlist.map((animal) => (
              <div
                key={animal.id}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-4 sm:p-6 border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group"
              >
                {/* Animal Image */}
                <div className="relative mb-3 sm:mb-4">
                  <div className="w-full h-36 sm:h-48 bg-gradient-to-br from-[#15BB73]/10 to-[#0FA568]/10 rounded-xl flex items-center justify-center overflow-hidden">
                    <img
                      src={animal.imageSrc}
                      alt={animal.title}
                      className="w-full h-full object-cover rounded-xl group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  
                  {/* Wishlist Button */}
                  <button
                    onClick={() => removeFromWishlist(animal.id)}
                    className="absolute top-2 right-2 sm:top-3 sm:right-3 w-8 h-8 sm:w-10 sm:h-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-all duration-300 transform hover:scale-110"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>

                  {/* Added Date Badge */}
                  <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-semibold text-gray-600">
                    Added {formatDate(animal.addedAt)}
                  </div>
                </div>

                {/* Animal Details */}
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-[#000600] mb-1 group-hover:text-[#15BB73] transition-colors duration-300 truncate">
                      {animal.title}
                    </h3>
                    <p className="text-gray-600 text-xs sm:text-sm truncate">{animal.breed} • {animal.animalType}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 flex-1">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-xs sm:text-sm text-gray-600 truncate">{animal.location}</span>
                    </div>
                    <span className="text-base sm:text-lg font-bold text-[#15BB73] flex-shrink-0 ml-2">₹{animal.price}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
                    <span className="truncate">Seller: {animal.sellerName}</span>
                    <span className="flex-shrink-0 ml-2">{animal.milkProduction}L/day</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-1 sm:pt-2">
                    <button
                      onClick={() => window.open(`tel:${animal.phoneNumber}`, '_self')}
                      className="flex-1 bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white py-2 px-2 sm:px-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 text-xs sm:text-sm"
                    >
                      Call
                    </button>
                    <button
                      onClick={() => window.open(`https://wa.me/${animal.phoneNumber}?text=${encodeURIComponent(`Hi! I'm interested in your ${animal.title} (₹${animal.price}). Is it still available?`)}`, '_blank')}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-2 sm:px-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 text-xs sm:text-sm"
                    >
                      WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back to Home Button */}
        {wishlist.length > 0 && (
          <div className="text-center mt-8 sm:mt-12">
            <Link
              to="/"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Home</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
