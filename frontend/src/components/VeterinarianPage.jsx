import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const VeterinarianPage = () => {
  const [selectedService, setSelectedService] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [veterinarians, setVeterinarians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [radius, setRadius] = useState(50);
  const [specializationFilter, setSpecializationFilter] = useState('');

  const services = [
    {
      id: 1,
      name: "Emergency Care",
      nameHindi: "आपातकालीन देखभाल",
      icon: "🚨",
      description: "24/7 emergency veterinary services for urgent animal health issues",
      descriptionHindi: "पशुओं की तत्काल स्वास्थ्य समस्याओं के लिए 24/7 आपातकालीन पशु चिकित्सा सेवाएं",
      price: "₹500-2000",
      duration: "Immediate",
      available: true
    },
    {
      id: 2,
      name: "General Checkup",
      nameHindi: "सामान्य जांच",
      icon: "🩺",
      description: "Comprehensive health examination and preventive care",
      descriptionHindi: "व्यापक स्वास्थ्य जांच और निवारक देखभाल",
      price: "₹300-800",
      duration: "30-45 mins",
      available: true
    },
    {
      id: 3,
      name: "Vaccination",
      nameHindi: "टीकाकरण",
      icon: "💉",
      description: "Complete vaccination schedule for all farm animals",
      descriptionHindi: "सभी खेत के पशुओं के लिए पूर्ण टीकाकरण कार्यक्रम",
      price: "₹200-500",
      duration: "15-30 mins",
      available: true
    },
    {
      id: 4,
      name: "Surgery",
      nameHindi: "सर्जरी",
      icon: "⚕️",
      description: "Minor and major surgical procedures for animals",
      descriptionHindi: "पशुओं के लिए छोटे और बड़े सर्जिकल प्रक्रियाएं",
      price: "₹2000-15000",
      duration: "1-4 hours",
      available: true
    },
    {
      id: 5,
      name: "Dental Care",
      nameHindi: "दंत चिकित्सा",
      icon: "🦷",
      description: "Oral health care and dental treatments for animals",
      descriptionHindi: "पशुओं के लिए मौखिक स्वास्थ्य देखभाल और दंत उपचार",
      price: "₹400-1200",
      duration: "45-60 mins",
      available: true
    },
    {
      id: 6,
      name: "Pregnancy Care",
      nameHindi: "गर्भावस्था देखभाल",
      icon: "🤰",
      description: "Prenatal and postnatal care for pregnant animals",
      descriptionHindi: "गर्भवती पशुओं के लिए प्रसव पूर्व और प्रसवोत्तर देखभाल",
      price: "₹600-1500",
      duration: "1-2 hours",
      available: true
    }
  ];

  const specializationLabels = {
    general: 'General Practice',
    large_animal: 'Large Animals',
    small_animal: 'Small Animals',
    livestock: 'Livestock',
    surgery: 'Surgery',
    emergency: 'Emergency',
    reproduction: 'Reproduction'
  };

  // Get user's location
  useEffect(() => {
    // Try to get location from localStorage first
    const savedLocation = localStorage.getItem('userData');
    if (savedLocation) {
      const userData = JSON.parse(savedLocation);
      if (userData.latitude && userData.longitude) {
        setUserLocation({
          latitude: userData.latitude,
          longitude: userData.longitude
        });
        return;
      }
    }

    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Location error:', error);
          // Use default location (Pune)
          setUserLocation({
            latitude: 18.5204,
            longitude: 73.8567
          });
        }
      );
    }
  }, []);

  // Fetch veterinarians
  useEffect(() => {
    const fetchVeterinarians = async () => {
      if (!userLocation) return;

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          radius: radius
        });

        if (specializationFilter) {
          params.append('specialization', specializationFilter);
        }

        const response = await fetch(`${API_URL}/api/veterinarians/nearby?${params}`);
        const data = await response.json();

        if (data.success) {
          setVeterinarians(data.data || []);
        } else {
          // If no nearby vets, try fetching all
          const allResponse = await fetch(`${API_URL}/api/veterinarians`);
          const allData = await allResponse.json();
          if (allData.success) {
            setVeterinarians(allData.data?.veterinarians || []);
          }
        }
      } catch (err) {
        console.error('Error fetching veterinarians:', err);
        setError('Failed to load veterinarians');
      } finally {
        setLoading(false);
      }
    };

    fetchVeterinarians();
  }, [userLocation, radius, specializationFilter]);

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.nameHindi.includes(searchQuery) ||
    service.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVets = veterinarians.filter(vet =>
    vet.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vet.specialization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vet.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCall = (phone) => {
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = (phone) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E9F0F8] to-[#F0F8FF]">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-[#15BB73]/10 to-[#0FA568]/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-[#000600] mb-4">
            पशु डॉक्टर / Veterinarian Services
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
            Professional veterinary care for your farm animals. Connect with experienced veterinarians for health checkups, emergency care, and specialized treatments.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for services, doctors, or specializations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 pl-12 pr-32 rounded-2xl border-2 border-gray-200 focus:border-[#15BB73] focus:outline-none focus:ring-4 focus:ring-[#15BB73]/20 text-lg shadow-lg"
              />
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white px-6 py-2 rounded-xl font-medium hover:shadow-lg transition-all duration-300">
                Search
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <select
              value={specializationFilter}
              onChange={(e) => setSpecializationFilter(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200 focus:border-[#15BB73] focus:outline-none"
            >
              <option value="">All Specializations</option>
              {Object.entries(specializationLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            <select
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value))}
              className="px-4 py-2 rounded-xl border border-gray-200 focus:border-[#15BB73] focus:outline-none"
            >
              <option value="10">Within 10 km</option>
              <option value="25">Within 25 km</option>
              <option value="50">Within 50 km</option>
              <option value="100">Within 100 km</option>
            </select>
          </div>

          {/* Register as Vet Button */}
          <Link
            to="/veterinarian/register"
            className="inline-flex items-center px-6 py-3 bg-white text-[#15BB73] border-2 border-[#15BB73] rounded-xl font-semibold hover:bg-[#15BB73] hover:text-white transition-all duration-300"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Register as Veterinarian / पशु चिकित्सक के रूप में पंजीकरण करें
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Services Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-[#000600] mb-8 text-center">Available Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className={`bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${
                  selectedService === service.id ? 'ring-4 ring-[#15BB73]/30 border-[#15BB73]' : ''
                }`}
                onClick={() => setSelectedService(selectedService === service.id ? null : service.id)}
              >
                <div className="text-center">
                  <div className="text-5xl mb-4">{service.icon}</div>
                  <h3 className="text-xl font-bold text-[#000600] mb-2">{service.name}</h3>
                  <h4 className="text-lg font-semibold text-gray-600 mb-3">{service.nameHindi}</h4>
                  <p className="text-gray-600 mb-4 text-sm">{service.description}</p>
                  <p className="text-gray-500 text-sm mb-4">{service.descriptionHindi}</p>

                  <div className="flex justify-between items-center mb-4">
                    <span className="text-2xl font-bold text-[#15BB73]">{service.price}</span>
                    <span className="text-sm text-gray-500">{service.duration}</span>
                  </div>

                  <div className="flex items-center justify-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      service.available
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {service.available ? 'Available' : 'Not Available'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Veterinarians Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-[#000600] mb-8 text-center">
            Nearby Veterinarians / आस-पास के पशु चिकित्सक
          </h2>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#15BB73]"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
            </div>
          ) : filteredVets.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No veterinarians found nearby</h3>
              <p className="text-gray-500 mb-4">Try increasing the search radius or check back later</p>
              <p className="text-gray-500">आस-पास कोई पशु चिकित्सक नहीं मिला</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVets.map((vet) => (
                <div key={vet.id} className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-center mb-4">
                    {vet.profile_photo ? (
                      <img
                        src={vet.profile_photo}
                        alt={vet.full_name}
                        className="w-16 h-16 rounded-full object-cover mr-4 border-2 border-[#15BB73]/20"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-[#15BB73]/10 flex items-center justify-center mr-4">
                        <span className="text-2xl font-bold text-[#15BB73]">
                          {vet.full_name?.charAt(0) || 'D'}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-bold text-[#000600]">{vet.full_name}</h3>
                      <p className="text-gray-600">{specializationLabels[vet.specialization] || vet.specialization}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-sm text-gray-600">
                        {vet.rating || '0'} ({vet.total_reviews || 0} reviews)
                      </span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <span className="text-sm text-gray-600">
                        {vet.city}, {vet.state}
                        {vet.distance && ` (${parseFloat(vet.distance).toFixed(1)} km)`}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-gray-600">{vet.experience_years}+ years experience</span>
                    </div>
                    {vet.consultation_fee && (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-gray-600">₹{vet.consultation_fee} consultation</span>
                      </div>
                    )}
                  </div>

                  {/* Services Tags */}
                  {vet.services && vet.services.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {vet.services.slice(0, 3).map((service, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          {service}
                        </span>
                      ))}
                      {vet.services.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{vet.services.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mb-4">
                    {vet.emergency_available ? (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        24/7 Emergency Available
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        Available
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCall(vet.phone_number)}
                      className="flex-1 bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white px-4 py-2 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Call
                    </button>
                    <button
                      onClick={() => handleWhatsApp(vet.phone_number)}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      WhatsApp
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Emergency Contact Section */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-8 rounded-2xl shadow-xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Emergency Veterinary Care</h2>
            <p className="text-xl mb-2">24/7 Emergency Services Available</p>
            <p className="mb-6">आपातकालीन पशु चिकित्सा सेवाएं 24/7 उपलब्ध</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => handleCall('+919876500000')}
                className="bg-white text-red-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
              >
                Call Emergency: +91 98765 00000
              </button>
              <button
                onClick={() => handleWhatsApp('+919876500000')}
                className="bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-105"
              >
                WhatsApp Emergency
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VeterinarianPage;
