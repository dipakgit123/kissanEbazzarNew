import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import EditProfileForm from './EditProfileForm';
import CallHistory from './CallHistory';
import { userService } from '../services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/*
  Simple profile dashboard page inspired by the provided screenshot.
  Props
  -----
  onBack : optional callback to navigate back to the previous page
*/
const ProfilePage = ({ onBack }) => {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [user, setUser] = useState({
    name: '',
    location: '',
    phone: '',
    address: '',
    postal_code: '',
    city: '',
    state: '',
    completion: 0,
  });

  const [animalListings, setAnimalListings] = useState([]);
  const [buffaloListings, setBuffaloListings] = useState([]);
  const [catListings, setCatListings] = useState([]);
  const [dogListings, setDogListings] = useState([]);
  const [goatListings, setGoatListings] = useState([]);
  const [horseListings, setHorseListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMyAnimals, setShowMyAnimals] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showCallHistory, setShowCallHistory] = useState(false);

  useEffect(() => {
    // Fetch profile immediately
    fetchUserProfile();
    // Delay listings fetch to speed up initial render
    setTimeout(() => {
      fetchAllListings();
    }, 100);
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await userService.getProfile();
      if (response.success && response.user) {
        const userData = response.user;

        // Calculate profile completion
        let completion = 0;
        if (userData.full_name) completion += 20;
        if (userData.phone_number) completion += 20;
        if (userData.address) completion += 20;
        if (userData.postal_code) completion += 20;
        if (userData.profile_photo) completion += 20;

        // Format location string
        const locationParts = [];
        if (userData.city) locationParts.push(userData.city);
        if (userData.state) locationParts.push(userData.state);
        const location = locationParts.length > 0 ? locationParts.join(', ') : 'Location not set';

        setUser({
          name: userData.full_name || 'User',
          full_name: userData.full_name || '',
          location: location,
          phone: userData.phone_number || '',
          phone_number: userData.phone_number || '',
          address: userData.address || '',
          postal_code: userData.postal_code || '',
          city: userData.city || '',
          state: userData.state || '',
          country: userData.country || '',
          profile_photo: userData.profile_photo || null,
          completion: completion,
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchAllListings = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // Fetch all animal types in parallel
      const [animals, buffalos, cats, dogs, goats, horses] = await Promise.all([
        axios.get(`${API_URL}/api/animals/my-listings`, config).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_URL}/api/buffalos/my-listings`, config).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_URL}/api/cats/my-listings`, config).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_URL}/api/dogs/my-listings`, config).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_URL}/api/goats/my-listings`, config).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_URL}/api/horses/my-listings`, config).catch(() => ({ data: { data: [] } }))
      ]);

      console.log('API Responses:', { animals: animals.data, buffalos: buffalos.data });

      // Handle different response structures
      const getListings = (response) => {
        if (Array.isArray(response?.data?.data)) return response.data.data;
        if (Array.isArray(response?.data)) return response.data;
        return [];
      };

      setAnimalListings(getListings(animals));
      setBuffaloListings(getListings(buffalos));
      setCatListings(getListings(cats));
      setDogListings(getListings(dogs));
      setGoatListings(getListings(goats));
      setHorseListings(getListings(horses));
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalListings = () => {
    const total = (animalListings?.length || 0) +
                  (buffaloListings?.length || 0) +
                  (catListings?.length || 0) +
                  (dogListings?.length || 0) +
                  (goatListings?.length || 0) +
                  (horseListings?.length || 0);
    return total;
  };

  const handleDelete = async (id, type) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const endpoints = {
        animal: `/api/animals/listings/${id}`,
        buffalo: `/api/buffalos/listings/${id}`,
        cat: `/api/cats/listings/${id}`,
        dog: `/api/dogs/listings/${id}`,
        goat: `/api/goats/listings/${id}`,
        horse: `/api/horses/listings/${id}`
      };

      await axios.delete(`${API_URL}${endpoints[type]}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Refresh listings
      await fetchAllListings();
      setShowDeleteConfirm(null);
      alert('Listing deleted successfully!');
    } catch (error) {
      console.error('Error deleting listing:', error);
      alert('Failed to delete listing');
    }
  };

  const handleMarkAsSold = async (id, type) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const endpoints = {
        animal: `/api/animals/listings/${id}/sold`,
        buffalo: `/api/buffalos/listings/${id}/sold`,
        cat: `/api/cats/listings/${id}/sold`,
        dog: `/api/dogs/listings/${id}/sold`,
        goat: `/api/goats/listings/${id}/sold`,
        horse: `/api/horses/listings/${id}/sold`
      };

      await axios.patch(`${API_URL}${endpoints[type]}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Refresh listings
      await fetchAllListings();
      alert('Listing marked as sold!');
    } catch (error) {
      console.error('Error marking as sold:', error);
      alert('Failed to mark as sold');
    }
  };

  const handleSaveProfile = async (profileData) => {
    setSavingProfile(true);
    try {
      const response = await userService.updateProfile(profileData);
      if (response.success) {
        // Update local state with new data
        const userData = response.user;

        // Calculate profile completion (keep current photo status)
        let completion = 0;
        if (userData.full_name) completion += 20;
        if (userData.phone_number) completion += 20;
        if (userData.address) completion += 20;
        if (userData.postal_code) completion += 20;
        if (user.profile_photo) completion += 20;

        // Format location string
        const locationParts = [];
        if (userData.city) locationParts.push(userData.city);
        if (userData.state) locationParts.push(userData.state);
        const location = locationParts.length > 0 ? locationParts.join(', ') : 'Location not set';

        setUser(prev => ({
          ...prev,
          name: userData.full_name || 'User',
          full_name: userData.full_name || '',
          location: location,
          phone: userData.phone_number || '',
          phone_number: userData.phone_number || '',
          address: userData.address || '',
          postal_code: userData.postal_code || '',
          city: userData.city || '',
          state: userData.state || '',
          country: userData.country || '',
          completion: completion,
        }));

        setEditing(false);
        alert('Profile updated successfully!');
      } else {
        alert(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(error.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePhotoUpdate = (newPhotoUrl) => {
    setUser(prev => {
      const hasPhoto = !!newPhotoUrl;
      // Recalculate completion
      let completion = 0;
      if (prev.full_name) completion += 20;
      if (prev.phone_number || prev.phone) completion += 20;
      if (prev.address) completion += 20;
      if (prev.postal_code) completion += 20;
      if (hasPhoto) completion += 20;

      return {
        ...prev,
        profile_photo: newPhotoUrl,
        completion: completion,
      };
    });
  };

  // Helper component for small stat cards
  const StatCard = ({ label, value }) => (
    <div className="bg-violet-50 text-center rounded-lg p-4 flex-1 min-w-[6rem]">
      <p className="text-2xl font-bold text-violet-900 mb-1">{value}</p>
      <p className="text-sm text-gray-600 whitespace-nowrap">{label}</p>
    </div>
  );

  // Helper component for list rows
  const RowButton = ({ text }) => (
    <button className="w-full flex justify-between items-center py-3 px-4 border-b text-gray-700 hover:bg-gray-50">
      <span>{text}</span>
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10 p-4 flex items-center gap-4">
        {onBack && (
          <button onClick={onBack} className="text-gray-700 hover:text-green-600 p-1 rounded-full hover:bg-green-50 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <h1 className="text-lg font-semibold flex-1">{t('profile.myProfile')}</h1>
        
        {/* Logout Button */}
        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to logout?')) {
              localStorage.removeItem('token');
              localStorage.removeItem('userData');
              localStorage.removeItem('currentPage');
              window.location.href = '/login';
            }
          }}
          className="flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden sm:inline">Logout</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Top user info */}
        <section className="bg-white rounded-xl shadow p-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-xl font-bold text-gray-600 overflow-hidden">
            {user.profile_photo ? (
              <img src={user.profile_photo} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user.name ? user.name[0].toUpperCase() : '?'
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-800">{user.name}</h2>
            <p className="text-sm text-gray-600 leading-4">{user.location} | {user.phone}</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${user.completion}%` }} />
            </div>
            <p className="text-xs text-gray-500 mt-1">{user.completion}% profile complete</p>
          </div>
          <button onClick={()=>setEditing(true)} className="text-sm text-green-600 hover:text-green-800 font-medium whitespace-nowrap">{t('common.edit')}</button>
        </section>

        {/* Journey statistics */}
        <section className="flex gap-3">
          <StatCard label="Animals Listed" value={loading ? '...' : getTotalListings()} />
          <StatCard label="Calls Made" value="0" />
          <StatCard label="Calls Received" value="0" />
        </section>

        {/* Selling related */}
        <section className="bg-white rounded-xl shadow divide-y">
          <h3 className="px-4 py-3 font-semibold text-gray-800">{t('profile.myListings')}</h3>
          <RowButton text="My Plan" />
          <button
            onClick={() => setShowMyAnimals(true)}
            className="w-full flex justify-between items-center py-3 px-4 border-b text-gray-700 hover:bg-gray-50"
          >
            <span>Animals ({getTotalListings()})</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={() => setShowCallHistory(true)}
            className="w-full flex justify-between items-center py-3 px-4 border-b text-gray-700 hover:bg-gray-50"
          >
            <span>Calls Received</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </section>

        {/* Buying related */}
        <section className="bg-white rounded-xl shadow divide-y">
          <h3 className="px-4 py-3 font-semibold text-gray-800">{t('profile.savedAnimals')}</h3>
          <button
            onClick={() => setShowCallHistory(true)}
            className="w-full flex justify-between items-center py-3 px-4 border-b text-gray-700 hover:bg-gray-50"
          >
            <span>Calls Made</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <RowButton text="Liked Animals" />
        </section>

        {/* Other */}
        <section className="bg-white rounded-xl shadow divide-y">
          <h3 className="px-4 py-3 font-semibold text-gray-800">Other</h3>
          <RowButton text="Coins" />
          <RowButton text="Pashu Charcha Posts" />
        </section>

        {/* Get Help */}
        <section className="bg-white rounded-xl shadow divide-y">
          <h3 className="px-4 py-3 font-semibold text-gray-800">Get Help</h3>
          <RowButton text="Message Us" />
        </section>
      </main>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full">
            <EditProfileForm
              onCancel={() => setEditing(false)}
              onSave={handleSaveProfile}
              initialData={user}
              loading={savingProfile}
              onPhotoUpdate={handlePhotoUpdate}
            />
          </div>
        </div>
      )}

      {/* Call History Modal */}
      {showCallHistory && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-5xl w-full bg-white rounded-xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center bg-green-50">
              <h2 className="text-xl font-bold text-gray-800">📞 Call History</h2>
              <button
                onClick={() => setShowCallHistory(false)}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-4">
              <CallHistory />
            </div>
          </div>
        </div>
      )}

      {/* My Animals Modal */}
      {showMyAnimals && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl w-full bg-white rounded-xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center bg-violet-50">
              <h2 className="text-xl font-bold text-gray-800">My Animals ({getTotalListings()})</h2>
              <button
                onClick={() => setShowMyAnimals(false)}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="text-center py-8 text-gray-500">{t('common.loading')}</div>
              ) : getTotalListings() === 0 ? (
                <div className="text-center py-8 text-gray-500">{t('home.noAnimalsFound')}</div>
              ) : (
                <>
                  {/* Animals/Cows */}
                  {animalListings.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Animals/Cows ({animalListings.length})</h3>
                      <div className="space-y-2">
                        {animalListings.map(animal => (
                          <AnimalCard key={animal.id} animal={animal} type="animal" onDelete={handleDelete} onMarkSold={handleMarkAsSold} setShowDeleteConfirm={setShowDeleteConfirm} showDeleteConfirm={showDeleteConfirm} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Buffalos */}
                  {buffaloListings.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Buffalos ({buffaloListings.length})</h3>
                      <div className="space-y-2">
                        {buffaloListings.map(animal => (
                          <AnimalCard key={animal.id} animal={animal} type="buffalo" onDelete={handleDelete} onMarkSold={handleMarkAsSold} setShowDeleteConfirm={setShowDeleteConfirm} showDeleteConfirm={showDeleteConfirm} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cats */}
                  {catListings.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Cats ({catListings.length})</h3>
                      <div className="space-y-2">
                        {catListings.map(animal => (
                          <AnimalCard key={animal.id} animal={animal} type="cat" onDelete={handleDelete} onMarkSold={handleMarkAsSold} setShowDeleteConfirm={setShowDeleteConfirm} showDeleteConfirm={showDeleteConfirm} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dogs */}
                  {dogListings.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Dogs ({dogListings.length})</h3>
                      <div className="space-y-2">
                        {dogListings.map(animal => (
                          <AnimalCard key={animal.id} animal={animal} type="dog" onDelete={handleDelete} onMarkSold={handleMarkAsSold} setShowDeleteConfirm={setShowDeleteConfirm} showDeleteConfirm={showDeleteConfirm} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Goats */}
                  {goatListings.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Goats ({goatListings.length})</h3>
                      <div className="space-y-2">
                        {goatListings.map(animal => (
                          <AnimalCard key={animal.id} animal={animal} type="goat" onDelete={handleDelete} onMarkSold={handleMarkAsSold} setShowDeleteConfirm={setShowDeleteConfirm} showDeleteConfirm={showDeleteConfirm} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Horses */}
                  {horseListings.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Horses ({horseListings.length})</h3>
                      <div className="space-y-2">
                        {horseListings.map(animal => (
                          <AnimalCard key={animal.id} animal={animal} type="horse" onDelete={handleDelete} onMarkSold={handleMarkAsSold} setShowDeleteConfirm={setShowDeleteConfirm} showDeleteConfirm={showDeleteConfirm} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-2">{t('common.delete')} {t('animalListing.title')}?</h3>
            <p className="text-gray-600 mb-6">{t('admin.delete')} - This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm.id, showDeleteConfirm.type)}
                className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Animal Card Component
const AnimalCard = ({ animal, type, onDelete, onMarkSold, setShowDeleteConfirm, showDeleteConfirm }) => {
  const { t } = useTranslation();
  const getDisplayName = () => {
    if (animal.breedName) return animal.breedName;
    if (animal.breed_name) return animal.breed_name;
    return 'Unknown Breed';
  };

  const getPrice = () => {
    if (animal.expectedPrice) return animal.expectedPrice;
    if (animal.expected_price) return animal.expected_price;
    return '0';
  };

  const getStatus = () => {
    return animal.status || 'active';
  };

  const getAge = () => {
    return animal.age || 'N/A';
  };

  const statusColors = {
    active: 'bg-green-100 text-green-700',
    sold: 'bg-blue-100 text-blue-700',
    expired: 'bg-gray-100 text-gray-700',
    deleted: 'bg-red-100 text-red-700'
  };

  return (
    <div className="bg-white border rounded-lg p-4 hover:shadow-md transition">
      <div className="flex gap-4">
        {/* Image */}
        <div className="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
          {(animal.frontPhoto || animal.front_photo || animal.photo_1 || animal.photo1) ? (
            <img
              src={animal.frontPhoto || animal.front_photo || animal.photo_1 || animal.photo1}
              alt={getDisplayName()}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="font-semibold text-gray-800">{getDisplayName()}</h4>
              <p className="text-sm text-gray-600">Age: {getAge()}</p>
              <p className="text-sm font-semibold text-green-600">₹{Number(getPrice()).toLocaleString()}</p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[getStatus()]}`}>
              {getStatus().toUpperCase()}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            {getStatus() === 'active' && (
              <button
                onClick={() => onMarkSold(animal.id, type)}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {t('common.save')}
              </button>
            )}
            <button
              onClick={() => setShowDeleteConfirm({ id: animal.id, type })}
              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
            >
              {t('common.delete')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
