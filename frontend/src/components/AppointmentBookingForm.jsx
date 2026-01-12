import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

const AppointmentBookingForm = () => {
  const { t } = useTranslation();
  const { vetId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const veterinarian = location.state?.veterinarian;

  const [formData, setFormData] = useState({
    animal_type: 'cow',
    animal_name: '',
    animal_age: '',
    animal_breed: '',
    appointment_date: '',
    appointment_time: '',
    appointment_type: 'consultation',
    symptoms: '',
    contact_preference: 'both',
    farmer_name: '',
    farmer_phone: '',
    farmer_address: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const animalTypes = [
    { value: 'cow', label: '🐄 Cow' },
    { value: 'buffalo', label: '🐃 Buffalo' },
    { value: 'goat', label: '🐐 Goat' },
    { value: 'horse', label: '🐎 Horse' },
    { value: 'dog', label: '🐕 Dog' },
    { value: 'cat', label: '🐈 Cat' },
    { value: 'other', label: 'Other' }
  ];

  const appointmentTypes = [
    { value: 'consultation', label: 'General Consultation' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'vaccination', label: 'Vaccination' },
    { value: 'surgery', label: 'Surgery' },
    { value: 'checkup', label: 'Regular Checkup' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    // Get user info from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setFormData(prev => ({
        ...prev,
        farmer_name: user.full_name || '',
        farmer_phone: user.phone_number || ''
      }));
    }

    // Get user location
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      const loc = JSON.parse(savedLocation);
      setUserLocation(loc);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.farmer_name || !formData.farmer_phone || !formData.appointment_date || !formData.appointment_time) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate phone number
    if (!/^[+]?[0-9]{10,15}$/.test(formData.farmer_phone.replace(/\s/g, ''))) {
      toast.error('Please enter a valid phone number');
      return;
    }

    // Check if date is in the future
    const appointmentDateTime = new Date(`${formData.appointment_date}T${formData.appointment_time}`);
    if (appointmentDateTime < new Date()) {
      toast.error('Please select a future date and time');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Please login to book an appointment');
        navigate('/login');
        return;
      }

      const payload = {
        ...formData,
        veterinarian_id: parseInt(vetId),
        farmer_latitude: userLocation?.latitude,
        farmer_longitude: userLocation?.longitude
      };

      const response = await fetch(`${API_BASE_URL}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Appointment booked successfully! The veterinarian will be notified.');
        setTimeout(() => {
          navigate('/my-appointments');
        }, 2000);
      } else {
        toast.error(data.message || 'Failed to book appointment');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error('Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get minimum time if today is selected
  const getMinTime = () => {
    if (formData.appointment_date === getMinDate()) {
      const now = new Date();
      return now.toTimeString().slice(0, 5);
    }
    return '00:00';
  };

  if (!veterinarian) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Veterinarian information not available</p>
          <button
            onClick={() => navigate('/veterinarians')}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Find Veterinarians
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Toaster position="top-right" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Book Appointment</h1>
        </div>

        {/* Vet Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {veterinarian.profile_photo ? (
                <img
                  src={veterinarian.profile_photo}
                  alt={veterinarian.full_name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-green-600">
                    {veterinarian.full_name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div className="ml-6">
              <h2 className="text-2xl font-bold text-gray-900">Dr. {veterinarian.full_name}</h2>
              <p className="text-green-600 font-medium">{veterinarian.specialization}</p>
              <p className="text-gray-600">{veterinarian.clinic_name}</p>
              <p className="text-lg font-semibold text-green-600 mt-1">
                Consultation Fee: ₹{veterinarian.consultation_fee || '500'}
              </p>
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-6">
            {/* Animal Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Animal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Animal Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="animal_type"
                    value={formData.animal_type}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {animalTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Animal Name
                  </label>
                  <input
                    type="text"
                    name="animal_name"
                    value={formData.animal_name}
                    onChange={handleChange}
                    placeholder="e.g., Ganga"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age
                  </label>
                  <input
                    type="text"
                    name="animal_age"
                    value={formData.animal_age}
                    onChange={handleChange}
                    placeholder="e.g., 3 years"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Breed
                  </label>
                  <input
                    type="text"
                    name="animal_breed"
                    value={formData.animal_breed}
                    onChange={handleChange}
                    placeholder="e.g., Holstein Friesian"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Appointment Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Appointment Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="appointment_type"
                    value={formData.appointment_type}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {appointmentTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Preference <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="contact_preference"
                    value={formData.contact_preference}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="both">Call & Visit</option>
                    <option value="call">Call Only</option>
                    <option value="visit">Visit Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="appointment_date"
                    value={formData.appointment_date}
                    onChange={handleChange}
                    min={getMinDate()}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    name="appointment_time"
                    value={formData.appointment_time}
                    onChange={handleChange}
                    min={getMinTime()}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Symptoms / Reason for Visit
                </label>
                <textarea
                  name="symptoms"
                  value={formData.symptoms}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Describe the symptoms or reason for the appointment..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                ></textarea>
              </div>
            </div>

            {/* Farmer Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="farmer_name"
                    value={formData.farmer_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="farmer_phone"
                    value={formData.farmer_phone}
                    onChange={handleChange}
                    required
                    placeholder="+91 XXXXXXXXXX"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    name="farmer_address"
                    value={formData.farmer_address}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Your complete address..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  ></textarea>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Any additional information..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Booking...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Book Appointment
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentBookingForm;
