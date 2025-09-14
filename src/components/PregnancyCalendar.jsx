import React, { useState, useEffect } from 'react';

const PregnancyCalendar = () => {
  const [pregnantAnimals, setPregnantAnimals] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [newAnimal, setNewAnimal] = useState({
    name: '',
    type: 'Cow',
    breed: '',
    registrationDate: new Date().toISOString().split('T')[0],
    expectedDelivery: '',
    notes: ''
  });

  // Calculate expected delivery date (9 months from registration)
  const calculateExpectedDelivery = (registrationDate) => {
    const regDate = new Date(registrationDate);
    const expectedDate = new Date(regDate);
    expectedDate.setMonth(expectedDate.getMonth() + 9);
    return expectedDate;
  };

  // Calculate pregnancy progress percentage
  const calculateProgress = (registrationDate) => {
    const regDate = new Date(registrationDate);
    const now = new Date();
    const expectedDelivery = calculateExpectedDelivery(registrationDate);
    const totalDays = Math.ceil((expectedDelivery - regDate) / (1000 * 60 * 60 * 24));
    const daysPassed = Math.ceil((now - regDate) / (1000 * 60 * 60 * 24));
    return Math.min(Math.max((daysPassed / totalDays) * 100, 0), 100);
  };

  // Get days in month
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // Get first day of month
  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Get animal type emoji
  const getAnimalEmoji = (type) => {
    const emojis = {
      'Cow': '🐄',
      'Buffalo': '🐃',
      'Goat': '🐐',
      'Sheep': '🐑',
      'Horse': '🐴',
      'Pig': '🐷'
    };
    return emojis[type] || '🐄';
  };

  // Get pregnancy status color
  const getStatusColor = (progress) => {
    if (progress < 30) return 'bg-blue-100 text-blue-800';
    if (progress < 60) return 'bg-yellow-100 text-yellow-800';
    if (progress < 90) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    const expectedDelivery = calculateExpectedDelivery(newAnimal.registrationDate);
    const animal = {
      ...newAnimal,
      id: Date.now(),
      expectedDelivery: expectedDelivery.toISOString().split('T')[0],
      progress: calculateProgress(newAnimal.registrationDate)
    };
    
    setPregnantAnimals([...pregnantAnimals, animal]);
    setNewAnimal({
      name: '',
      type: 'Cow',
      breed: '',
      registrationDate: new Date().toISOString().split('T')[0],
      expectedDelivery: '',
      notes: ''
    });
    setShowAddForm(false);
  };

  // Get animals for specific date
  const getAnimalsForDate = (date) => {
    return pregnantAnimals.filter(animal => {
      const regDate = new Date(animal.registrationDate);
      const expDate = new Date(animal.expectedDelivery);
      return date >= regDate && date <= expDate;
    });
  };

  // Calendar navigation
  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-20"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const animalsForDate = getAnimalsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = selectedDate.toDateString() === date.toDateString();
      
      days.push(
        <div
          key={day}
          className={`h-20 p-2 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 group relative overflow-hidden ${
            isToday 
              ? 'bg-gradient-to-br from-[#15BB73] to-[#0FA568] text-white shadow-lg' 
              : isSelected
              ? 'bg-white/20 text-white border-2 border-[#15BB73]'
              : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white'
          }`}
          onClick={() => setSelectedDate(date)}
        >
          {/* Background glow effect */}
          {animalsForDate.length > 0 && (
            <div className="absolute inset-0 bg-gradient-to-r from-[#15BB73]/20 to-[#0FA568]/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          )}
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-1">
              <span className={`text-sm font-bold ${isToday ? 'text-white' : isSelected ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                {day}
              </span>
              {animalsForDate.length > 0 && (
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                  isToday 
                    ? 'bg-white/30 text-white' 
                    : 'bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white'
                }`}>
                  {animalsForDate.length}
                </span>
              )}
            </div>
            <div className="space-y-1">
              {animalsForDate.slice(0, 1).map((animal) => (
                <div
                  key={animal.id}
                  className={`text-xs px-2 py-1 rounded-lg truncate font-medium ${
                    isToday 
                      ? 'bg-white/20 text-white' 
                      : 'bg-gradient-to-r from-[#15BB73]/80 to-[#0FA568]/80 text-white'
                  }`}
                  title={`${animal.name} - ${animal.type}`}
                >
                  {getAnimalEmoji(animal.type)} {animal.name}
                </div>
              ))}
              {animalsForDate.length > 1 && (
                <div className={`text-xs px-2 py-1 rounded-lg ${
                  isToday 
                    ? 'bg-white/20 text-white' 
                    : 'bg-white/20 text-gray-300'
                }`}>
                  +{animalsForDate.length - 1} more
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return days;
  };

  // Get selected date animals
  const selectedDateAnimals = getAnimalsForDate(selectedDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155] py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#15BB73] to-[#0FA568] rounded-2xl flex items-center justify-center shadow-2xl animate-pulse-glow">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Pregnancy Calendar
            </h1>
          </div>
          <p className="text-gray-400 max-w-xl mx-auto text-sm">
            Track pregnant animals with precision • Monitor progress • Get delivery alerts
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar Section */}
          <div className="lg:col-span-3">
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/10">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-300 hover:scale-110 group"
                >
                  <svg className="w-5 h-5 text-white group-hover:text-[#15BB73] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white">
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h2>
                  <div className="w-16 h-1 bg-gradient-to-r from-[#15BB73] to-[#0FA568] rounded-full mx-auto mt-1"></div>
                </div>
                
                <button
                  onClick={() => navigateMonth(1)}
                  className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-300 hover:scale-110 group"
                >
                  <svg className="w-5 h-5 text-white group-hover:text-[#15BB73] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="p-3 text-center text-sm font-bold text-gray-300 bg-white/5 rounded-xl">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {generateCalendarDays()}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Add Animal Button */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-2xl p-4 border border-white/10">
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white py-3 px-4 rounded-xl font-bold hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:from-[#0FA568] hover:to-[#15BB73] group"
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Register Animal</span>
                </div>
              </button>
            </div>

            {/* Selected Date Info */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-2xl p-4 border border-white/10">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-2 h-2 bg-gradient-to-r from-[#15BB73] to-[#0FA568] rounded-full animate-pulse"></div>
                <h3 className="text-lg font-bold text-white">
                  {formatDate(selectedDate)}
                </h3>
              </div>
              
              {selectedDateAnimals.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedDateAnimals.map((animal) => {
                    const progress = calculateProgress(animal.registrationDate);
                    return (
                      <div key={animal.id} className="p-3 bg-gradient-to-r from-white/10 to-white/5 rounded-xl border border-white/10 hover:from-white/20 hover:to-white/10 transition-all duration-300 group">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg group-hover:scale-110 transition-transform duration-300">{getAnimalEmoji(animal.type)}</span>
                            <span className="font-semibold text-white text-sm">{animal.name}</span>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                            progress < 30 ? 'bg-blue-500/20 text-blue-300' :
                            progress < 60 ? 'bg-yellow-500/20 text-yellow-300' :
                            progress < 90 ? 'bg-orange-500/20 text-orange-300' :
                            'bg-red-500/20 text-red-300'
                          }`}>
                            {Math.round(progress)}%
                          </span>
                        </div>
                        <div className="text-xs text-gray-300 space-y-1">
                          <p>Breed: {animal.breed}</p>
                          <p>Expected: {formatDate(new Date(animal.expectedDelivery))}</p>
                        </div>
                        <div className="mt-2 w-full bg-white/10 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-[#15BB73] to-[#0FA568] h-2 rounded-full transition-all duration-500 group-hover:shadow-lg"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-sm">No pregnant animals for this date</p>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-2xl p-4 border border-white/10">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-2 h-2 bg-gradient-to-r from-[#15BB73] to-[#0FA568] rounded-full animate-pulse"></div>
                <h3 className="text-lg font-bold text-white">Quick Stats</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                  <span className="text-gray-300 text-sm">Total Animals</span>
                  <span className="font-bold text-[#15BB73] text-lg">{pregnantAnimals.length}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                  <span className="text-gray-300 text-sm">Due This Month</span>
                  <span className="font-bold text-orange-400 text-lg">
                    {pregnantAnimals.filter(animal => {
                      const expDate = new Date(animal.expectedDelivery);
                      const now = new Date();
                      return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
                    }).length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                  <span className="text-gray-300 text-sm">Near Delivery</span>
                  <span className="font-bold text-red-400 text-lg">
                    {pregnantAnimals.filter(animal => {
                      const progress = calculateProgress(animal.registrationDate);
                      return progress > 85;
                    }).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Animal Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-white/10">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#15BB73] to-[#0FA568] rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-white">Register Pregnant Animal</h3>
                  </div>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">Animal Name</label>
                    <input
                      type="text"
                      value={newAnimal.name}
                      onChange={(e) => setNewAnimal({...newAnimal, name: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-[#15BB73] focus:border-[#15BB73] transition-all duration-300 text-white placeholder-gray-400"
                      placeholder="Enter animal name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">Animal Type</label>
                    <select
                      value={newAnimal.type}
                      onChange={(e) => setNewAnimal({...newAnimal, type: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-[#15BB73] focus:border-[#15BB73] transition-all duration-300 text-white"
                    >
                      <option value="Cow" className="bg-[#0F172A] text-white">🐄 Cow</option>
                      <option value="Buffalo" className="bg-[#0F172A] text-white">🐃 Buffalo</option>
                      <option value="Goat" className="bg-[#0F172A] text-white">🐐 Goat</option>
                      <option value="Sheep" className="bg-[#0F172A] text-white">🐑 Sheep</option>
                      <option value="Horse" className="bg-[#0F172A] text-white">🐴 Horse</option>
                      <option value="Pig" className="bg-[#0F172A] text-white">🐷 Pig</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">Breed</label>
                    <input
                      type="text"
                      value={newAnimal.breed}
                      onChange={(e) => setNewAnimal({...newAnimal, breed: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-[#15BB73] focus:border-[#15BB73] transition-all duration-300 text-white placeholder-gray-400"
                      placeholder="Enter breed"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">Registration Date</label>
                    <input
                      type="date"
                      value={newAnimal.registrationDate}
                      onChange={(e) => setNewAnimal({...newAnimal, registrationDate: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-[#15BB73] focus:border-[#15BB73] transition-all duration-300 text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">Notes (Optional)</label>
                    <textarea
                      value={newAnimal.notes}
                      onChange={(e) => setNewAnimal({...newAnimal, notes: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-[#15BB73] focus:border-[#15BB73] transition-all duration-300 text-white placeholder-gray-400"
                      rows="3"
                      placeholder="Any additional notes..."
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 px-4 py-3 border border-white/20 text-gray-300 rounded-xl hover:bg-white/10 hover:text-white transition-all duration-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white px-4 py-3 rounded-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                    >
                      Register Animal
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PregnancyCalendar;
