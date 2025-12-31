import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { listingsService } from '../services/api';

const AnimalDetailPage = () => {
  const { animalType, id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await listingsService.getListingById(animalType, id);
        if (response.success) {
          setListing(response.data);
        } else {
          setError('Listing not found');
        }
      } catch (err) {
        console.error('Error fetching listing:', err);
        setError(err.message || 'Failed to load listing');
      } finally {
        setLoading(false);
      }
    };

    if (animalType && id) {
      fetchListing();
    }
  }, [animalType, id]);

  // Get all available images
  const getImages = () => {
    if (!listing) return [];
    const images = [];
    if (listing.front_photo) images.push({ url: listing.front_photo, label: 'Front View' });
    if (listing.side_photo) images.push({ url: listing.side_photo, label: 'Side View' });
    if (listing.milk_scene_photo) images.push({ url: listing.milk_scene_photo, label: 'Milk Scene' });
    if (listing.full_body_photo) images.push({ url: listing.full_body_photo, label: 'Full Body' });
    if (listing.photo_1) images.push({ url: listing.photo_1, label: 'Photo 1' });
    if (listing.photo_2) images.push({ url: listing.photo_2, label: 'Photo 2' });
    if (listing.photo_3) images.push({ url: listing.photo_3, label: 'Photo 3' });
    if (listing.photo_4) images.push({ url: listing.photo_4, label: 'Photo 4' });
    if (listing.photo_5) images.push({ url: listing.photo_5, label: 'Photo 5' });
    return images.length > 0 ? images : [{ url: 'https://via.placeholder.com/600x400?text=No+Image', label: 'No Image' }];
  };

  const handleCall = () => {
    if (listing?.seller?.phone) {
      window.location.href = `tel:${listing.seller.phone}`;
    }
  };

  const handleWhatsApp = () => {
    if (listing?.seller?.phone) {
      const message = `Hi! I'm interested in your ${animalType} listing: "${listing.breed_name}" - ₹${Number(listing.expected_price).toLocaleString('en-IN')}`;
      const whatsappUrl = `https://wa.me/${listing.seller.phone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const formatPrice = (price) => {
    return Number(price).toLocaleString('en-IN');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getAnimalTypeLabel = (type) => {
    const labels = {
      cow: 'Cow',
      buffalo: 'Buffalo',
      horse: 'Horse',
      goat: 'Goat',
      cat: 'Cat',
      dog: 'Dog'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E9F0F8] to-[#F0F8FF] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#15BB73] mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading listing...</p>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E9F0F8] to-[#F0F8FF] flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Listing Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The listing you are looking for does not exist or has been removed.'}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const images = getImages();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E9F0F8] to-[#F0F8FF] pb-24">
      {/* Header */}
      <div className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-[#15BB73] transition-colors"
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back</span>
            </button>
            <div className="flex items-center space-x-2">
              <span className="bg-[#15BB73]/10 text-[#15BB73] px-3 py-1 rounded-full text-sm font-medium">
                {getAnimalTypeLabel(animalType)}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                listing.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {listing.status === 'active' ? 'Available' : listing.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
              <img
                src={images[activeImage]?.url}
                alt={images[activeImage]?.label}
                className="w-full h-[400px] md:h-[500px] object-cover"
              />
              <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                {images[activeImage]?.label}
              </div>
              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImage(prev => prev === 0 ? images.length - 1 : prev - 1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                  >
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setActiveImage(prev => prev === images.length - 1 ? 0 : prev + 1)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                  >
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex space-x-3 overflow-x-auto pb-2">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      activeImage === index
                        ? 'border-[#15BB73] shadow-lg'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Video */}
            {listing.video && (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-[#15BB73]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Video
                </h3>
                <video
                  src={listing.video}
                  controls
                  className="w-full rounded-xl"
                  poster={images[0]?.url}
                />
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            {/* Title and Price */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                {listing.breed_name || 'Unknown Breed'}
              </h1>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="text-3xl font-bold text-[#15BB73]">
                  ₹{formatPrice(listing.expected_price)}
                  {listing.is_negotiable && (
                    <span className="text-sm font-normal text-gray-500 ml-2">(Negotiable)</span>
                  )}
                </div>
                <div className="flex items-center text-gray-500">
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Posted on {formatDate(listing.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-[#15BB73]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Location
              </h3>
              <p className="text-gray-600">
                {[listing.city, listing.state, listing.pincode].filter(Boolean).join(', ') || 'Location not specified'}
              </p>
            </div>

            {/* Animal Details */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-[#15BB73]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Animal Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {listing.breed_name && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Breed</p>
                    <p className="font-semibold text-gray-800">{listing.breed_name}</p>
                  </div>
                )}
                {listing.age && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Age</p>
                    <p className="font-semibold text-gray-800">{listing.age} {animalType === 'cow' || animalType === 'buffalo' ? 'years' : ''}</p>
                  </div>
                )}
                {listing.milk_capacity && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Milk Capacity</p>
                    <p className="font-semibold text-gray-800">{listing.milk_capacity} L/day</p>
                  </div>
                )}
                {listing.pregnancy_status && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Pregnancy Status</p>
                    <p className="font-semibold text-gray-800 capitalize">{listing.pregnancy_status.replace('_', ' ')}</p>
                  </div>
                )}
                {listing.health_condition && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Health Condition</p>
                    <p className="font-semibold text-gray-800 capitalize">{listing.health_condition}</p>
                  </div>
                )}
                {listing.gender && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Gender</p>
                    <p className="font-semibold text-gray-800 capitalize">{listing.gender}</p>
                  </div>
                )}
                {listing.weight && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Weight</p>
                    <p className="font-semibold text-gray-800">{listing.weight} kg</p>
                  </div>
                )}
                {listing.color && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Color</p>
                    <p className="font-semibold text-gray-800 capitalize">{listing.color}</p>
                  </div>
                )}
                {listing.purpose && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Purpose</p>
                    <p className="font-semibold text-gray-800 capitalize">{listing.purpose}</p>
                  </div>
                )}
                {listing.has_horns !== undefined && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Horns</p>
                    <p className="font-semibold text-gray-800">{listing.has_horns ? 'Yes' : 'No'}</p>
                  </div>
                )}
                {listing.delivery_available !== undefined && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Delivery</p>
                    <p className="font-semibold text-gray-800">{listing.delivery_available ? 'Available' : 'Not Available'}</p>
                  </div>
                )}
                {listing.vaccination_status && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Vaccinated</p>
                    <p className="font-semibold text-gray-800 capitalize">{listing.vaccination_status}</p>
                  </div>
                )}
                {listing.trained && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Trained</p>
                    <p className="font-semibold text-gray-800 capitalize">{listing.trained}</p>
                  </div>
                )}
                {listing.behavior && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Behavior</p>
                    <p className="font-semibold text-gray-800 capitalize">{listing.behavior}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Notes */}
            {(listing.additional_notes || listing.vaccination_details || listing.description) && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-[#15BB73]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Additional Information
                </h3>
                {listing.description && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-1">Description</p>
                    <p className="text-gray-700">{listing.description}</p>
                  </div>
                )}
                {listing.vaccination_details && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-1">Vaccination Details</p>
                    <p className="text-gray-700">{listing.vaccination_details}</p>
                  </div>
                )}
                {listing.additional_notes && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Notes</p>
                    <p className="text-gray-700">{listing.additional_notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Seller Info */}
            {listing.seller && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-[#15BB73]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Seller Information
                </h3>
                <div className="flex items-center space-x-4">
                  {listing.seller.profile_photo ? (
                    <img
                      src={listing.seller.profile_photo}
                      alt={listing.seller.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#15BB73]"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#15BB73] to-[#0FA568] flex items-center justify-center text-white text-2xl font-bold">
                      {listing.seller.name?.charAt(0) || 'S'}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-800 text-lg">{listing.seller.name || 'Unknown Seller'}</p>
                    {listing.seller.city && (
                      <p className="text-gray-500 text-sm flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        {listing.seller.city}{listing.seller.state ? `, ${listing.seller.state}` : ''}
                      </p>
                    )}
                    <p className="text-[#15BB73] text-sm font-medium mt-1">Verified Seller</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Contact Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="hidden md:block">
              <p className="text-sm text-gray-500">Listed Price</p>
              <p className="text-2xl font-bold text-[#15BB73]">₹{formatPrice(listing.expected_price)}</p>
            </div>
            <div className="flex flex-1 md:flex-none gap-3">
              <button
                onClick={handleCall}
                className="flex-1 md:flex-none bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>Call Now</span>
              </button>
              <button
                onClick={handleWhatsApp}
                className="flex-1 md:flex-none bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimalDetailPage;
