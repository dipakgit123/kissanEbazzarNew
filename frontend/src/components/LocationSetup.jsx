// LocationSetup.jsx - Fixed with proper API configuration
import { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';

// Use the same API_BASE_URL as your other services
const API_BASE_URL = 'http://localhost:5000'; // Your backend URL

// Icons
const LocationIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CurrentLocationIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

const ManualLocationIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// Location service with proper API URL
const locationService = {
  async checkStatus() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/location/status`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        // Location endpoint might not exist yet, treat as no location set
        return { hasLocation: false };
      }
      throw new Error('Failed to check location status');
    }
    
    return response.json();
  },

  async setCurrentLocation(latitude, longitude) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/location/set/current`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ latitude, longitude })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to set location');
    }
    
    return data;
  },

  async setManualLocation(addressData) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/location/set/manual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(addressData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to set location');
    }
    
    return data;
  }
};

const LocationSetup = ({ onLocationSet, skipAllowed = false }) => {
  const [step, setStep] = useState('choose'); // 'choose', 'current', 'manual'
  const [isLoading, setIsLoading] = useState(false);
  const [locationPermission, setLocationPermission] = useState('unknown');
  
  // Manual location state
  const [manualLocation, setManualLocation] = useState({
    address: '',
    city: '',
    state: '',
    country: 'India',
    postal_code: ''
  });

  // Check if user already has location
  useEffect(() => {
    checkLocationStatus();
  }, []);

  const checkLocationStatus = async () => {
    try {
      const data = await locationService.checkStatus();
      if (data.hasLocation) {
        // User already has location, redirect to main app
        if (onLocationSet) {
          onLocationSet();
        }
      }
    } catch (error) {
      console.error('Failed to check location status:', error);
      // Continue anyway - user can still set location
    }
  };

  const getCurrentLocation = () => {
    setIsLoading(true);
    setStep('current');
    
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      setIsLoading(false);
      setStep('choose');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await submitCurrentLocation(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        setIsLoading(false);
        setStep('choose');
        let errorMessage = 'Failed to get your location';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            setLocationPermission('denied');
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        
        toast.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const submitCurrentLocation = async (latitude, longitude) => {
    try {
      const data = await locationService.setCurrentLocation(latitude, longitude);
      
      if (data.success) {
        toast.success('Location set successfully!');
        if (onLocationSet) {
          setTimeout(() => onLocationSet(), 1500);
        }
      } else {
        if (data.hasLocation) {
          toast.error('Location already set. Redirecting...');
          setTimeout(() => onLocationSet(), 1500);
        } else {
          toast.error(data.message || 'Failed to set location');
          setStep('choose');
        }
      }
    } catch (error) {
      toast.error('Failed to set location. Please try again.');
      setStep('choose');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualLocation.city || !manualLocation.country) {
      toast.error('Please fill in at least city and country');
      return;
    }

    setIsLoading(true);
    
    try {
      const data = await locationService.setManualLocation(manualLocation);
      
      if (data.success) {
        toast.success('Location set successfully!');
        if (onLocationSet) {
          setTimeout(() => onLocationSet(), 1500);
        }
      } else {
        if (data.hasLocation) {
          toast.error('Location already set. Redirecting...');
          setTimeout(() => onLocationSet(), 1500);
        } else {
          toast.error(data.message || 'Failed to set location');
        }
      }
    } catch (error) {
      toast.error('Failed to set location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && step === 'manual') {
      handleManualSubmit();
    }
  };

  const handleSkip = () => {
    if (skipAllowed && onLocationSet) {
      onLocationSet();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E9F0F8] to-[#F0F8FF] p-4">
      <Toaster position="top-right" />
      
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#15BB73]/10 to-[#0FA568]/20 rounded-full mb-4">
            <LocationIcon />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Set Your Location</h2>
          <p className="text-gray-600 mt-2">Help us connect you with nearby farmers and customers</p>
        </div>

        {/* Choose Method */}
        {step === 'choose' && (
          <div className="space-y-4">
            <button
              onClick={getCurrentLocation}
              disabled={isLoading}
              className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-[#15BB73] hover:bg-[#15BB73]/5 transition-all group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#15BB73]/10 rounded-lg group-hover:bg-[#15BB73]/20 transition-colors">
                  <CurrentLocationIcon />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-800">Use Current Location</p>
                  <p className="text-sm text-gray-600">Automatically detect your location</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#15BB73]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => setStep('manual')}
              className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-[#15BB73] hover:bg-[#15BB73]/5 transition-all group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#15BB73]/10 rounded-lg group-hover:bg-[#15BB73]/20 transition-colors">
                  <ManualLocationIcon />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-800">Enter Manually</p>
                  <p className="text-sm text-gray-600">Type your address details</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#15BB73]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {skipAllowed && (
              <button
                onClick={handleSkip}
                className="w-full mt-6 text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                Skip for now
              </button>
            )}
          </div>
        )}

        {/* Current Location Loading */}
        {step === 'current' && isLoading && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#15BB73]/10 rounded-full mb-4">
              <svg className="animate-spin h-8 w-8 text-[#15BB73]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="text-gray-600 font-medium">Getting your location...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
          </div>
        )}

        {/* Manual Entry */}
        {step === 'manual' && (
          <div className="space-y-4" onKeyPress={handleKeyPress}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address (Optional)
              </label>
              <input
                type="text"
                value={manualLocation.address}
                onChange={(e) => setManualLocation({...manualLocation, address: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BB73]/20 focus:border-[#15BB73]"
                placeholder="Street address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={manualLocation.city}
                onChange={(e) => setManualLocation({...manualLocation, city: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BB73]/20 focus:border-[#15BB73]"
                placeholder="City name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State/Province
              </label>
              <input
                type="text"
                value={manualLocation.state}
                onChange={(e) => setManualLocation({...manualLocation, state: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BB73]/20 focus:border-[#15BB73]"
                placeholder="State or province"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={manualLocation.country}
                onChange={(e) => setManualLocation({...manualLocation, country: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BB73]/20 focus:border-[#15BB73]"
                placeholder="Country"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Postal Code
              </label>
              <input
                type="text"
                value={manualLocation.postal_code}
                onChange={(e) => setManualLocation({...manualLocation, postal_code: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15BB73]/20 focus:border-[#15BB73]"
                placeholder="ZIP/Postal code"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setStep('choose')}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleManualSubmit}
                disabled={isLoading || !manualLocation.city || !manualLocation.country}
                className={`flex-1 py-2 px-4 rounded-lg font-medium text-white transition-all ${
                  isLoading || !manualLocation.city || !manualLocation.country
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#15BB73] to-[#0FA568] hover:shadow-lg'
                }`}
              >
                {isLoading ? 'Setting...' : 'Set Location'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationSetup;