import React, { useState } from 'react';

const VeterinarianPage = () => {
  const [selectedService, setSelectedService] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const veterinarians = [
    {
      id: 1,
      name: "Dr. Rajesh Kumar",
      specialization: "Large Animal Medicine",
      experience: "15+ years",
      rating: 4.8,
      patients: 2500,
      location: "Pune, Maharashtra",
      phone: "+91 98765 43210",
      whatsapp: "+91 98765 43210",
      image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face",
      available: true,
      nextAvailable: "Today 2:00 PM"
    },
    {
      id: 2,
      name: "Dr. Priya Sharma",
      specialization: "Small Animal Surgery",
      experience: "12+ years",
      rating: 4.9,
      patients: 1800,
      location: "Nashik, Maharashtra",
      phone: "+91 98765 43211",
      whatsapp: "+91 98765 43211",
      image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face",
      available: true,
      nextAvailable: "Today 4:30 PM"
    },
    {
      id: 3,
      name: "Dr. Vikram Singh",
      specialization: "Livestock Health",
      experience: "20+ years",
      rating: 4.7,
      patients: 3200,
      location: "Aurangabad, Maharashtra",
      phone: "+91 98765 43212",
      whatsapp: "+91 98765 43212",
      image: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&h=150&fit=crop&crop=face",
      available: false,
      nextAvailable: "Tomorrow 10:00 AM"
    }
  ];

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.nameHindi.includes(searchQuery) ||
    service.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVets = veterinarians.filter(vet =>
    vet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vet.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vet.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <div className="max-w-2xl mx-auto">
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
          <h2 className="text-3xl font-bold text-[#000600] mb-8 text-center">Our Veterinarians</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVets.map((vet) => (
              <div key={vet.id} className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center mb-4">
                  <img
                    src={vet.image}
                    alt={vet.name}
                    className="w-16 h-16 rounded-full object-cover mr-4 border-2 border-[#15BB73]/20"
                  />
                  <div>
                    <h3 className="text-xl font-bold text-[#000600]">{vet.name}</h3>
                    <p className="text-gray-600">{vet.specialization}</p>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm text-gray-600">{vet.rating} • {vet.patients} patients</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <span className="text-sm text-gray-600">{vet.location}</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-gray-600">{vet.experience}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    vet.available 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {vet.available ? 'Available Now' : `Next: ${vet.nextAvailable}`}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white px-4 py-2 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                    Call
                  </button>
                  <button className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                    WhatsApp
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Contact Section */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-8 rounded-2xl shadow-xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Emergency Veterinary Care</h2>
            <p className="text-xl mb-6">24/7 Emergency Services Available</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-red-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105">
                Call Emergency: +91 98765 00000
              </button>
              <button className="bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-105">
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
