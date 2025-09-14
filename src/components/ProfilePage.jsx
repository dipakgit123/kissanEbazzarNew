import React, { useState } from 'react';
import EditProfileForm from './EditProfileForm';

/*
  Simple profile dashboard page inspired by the provided screenshot.  
  Props
  -----
  onBack : optional callback to navigate back to the previous page
*/
const ProfilePage = ({ onBack }) => {
  const [editing, setEditing] = useState(false);
  // Dummy user info – in a real app these would come from an API / context
  const user = {
    name: 'dipak',
    location: 'Nagpur, Maharashtra',
    phone: '9022589579',
    completion: 57,
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
        <h1 className="text-lg font-semibold">Profile</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Top user info */}
        <section className="bg-white rounded-xl shadow p-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-xl font-bold text-gray-600">
            {user.name[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-800">{user.name}</h2>
            <p className="text-sm text-gray-600 leading-4">{user.location} | {user.phone}</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${user.completion}%` }} />
            </div>
            <p className="text-xs text-gray-500 mt-1">{user.completion}% profile complete</p>
          </div>
          <button onClick={()=>setEditing(true)} className="text-sm text-green-600 hover:text-green-800 font-medium whitespace-nowrap">Edit</button>
        </section>

        {/* Journey statistics */}
        <section className="flex gap-3">
          <StatCard label="Animals Listed" value="0" />
          <StatCard label="Calls Made" value="0" />
          <StatCard label="Calls Received" value="0" />
        </section>

        {/* Selling related */}
        <section className="bg-white rounded-xl shadow divide-y">
          <h3 className="px-4 py-3 font-semibold text-gray-800">Selling Related</h3>
          <RowButton text="My Plan" />
          <RowButton text="Animals" />
          <RowButton text="Calls Received" />
        </section>

        {/* Buying related */}
        <section className="bg-white rounded-xl shadow divide-y">
          <h3 className="px-4 py-3 font-semibold text-gray-800">Buying Related</h3>
          <RowButton text="Calls Made" />
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
          <div className="max-w-xl w-full">
            <EditProfileForm onCancel={() => setEditing(false)} onSave={(data)=>{console.log('save',data);setEditing(false);}} initialData={user} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
