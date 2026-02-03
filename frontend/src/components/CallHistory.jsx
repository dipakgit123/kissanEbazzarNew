import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../config/api';

const CallHistory = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('all'); // all, made, received
  const [calls, setCalls] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const API_URL = API_BASE_URL;
  const getCurrentUserId = () => {
    const saved = localStorage.getItem('userData');
    if (!saved) return null;
    try {
      const data = JSON.parse(saved);
      return data?.id || data?.userId || data?.user_id || null;
    } catch (e) {
      return null;
    }
  };
  const currentUserId = getCurrentUserId();
  const normalizedCurrentUserId = currentUserId != null ? Number(currentUserId) : null;

  useEffect(() => {
    fetchCallStats();
    fetchCalls();
  }, [activeTab, page]);

  const fetchCallStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_URL}/api/call-logs/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching call stats:', error);
    }
  };

  const fetchCalls = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      let endpoint = '/api/call-logs/history';
      if (activeTab === 'made') endpoint = '/api/call-logs/made';
      if (activeTab === 'received') endpoint = '/api/call-logs/received';

      const response = await axios.get(`${API_URL}${endpoint}?page=${page}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCalls(response.data.data);
      if (response.data.pagination) {
        setTotalPages(response.data.pagination.totalPages);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching calls:', error);
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getCallTypeLabel = (callType) => {
    const labels = {
      'animal_listing': 'Animal Listing',
      'veterinarian': 'Veterinarian',
      'direct': 'Direct Call'
    };
    return labels[callType] || callType;
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-xl shadow-lg">
            <div className="text-3xl font-bold">{stats.callsMade}</div>
            <div className="text-sm opacity-90">Calls Made</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-xl shadow-lg">
            <div className="text-3xl font-bold">{stats.callsReceived}</div>
            <div className="text-sm opacity-90">Calls Received</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-xl shadow-lg">
            <div className="text-3xl font-bold">{stats.totalCalls}</div>
            <div className="text-sm opacity-90">Total Calls</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md p-2 mb-6 flex gap-2">
        <button
          onClick={() => { setActiveTab('all'); setPage(1); }}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            activeTab === 'all' 
              ? 'bg-green-500 text-white' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          All Calls
        </button>
        <button
          onClick={() => { setActiveTab('made'); setPage(1); }}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            activeTab === 'made' 
              ? 'bg-blue-500 text-white' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Calls Made
        </button>
        <button
          onClick={() => { setActiveTab('received'); setPage(1); }}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            activeTab === 'received' 
              ? 'bg-green-500 text-white' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Calls Received
        </button>
      </div>

      {/* Call List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4">Loading calls...</p>
          </div>
        ) : calls.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <p>No calls found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {calls.map((call) => {
              const callerId = call.callerId || call.caller_id || call.caller?.id;
              const callerIdNumber = callerId != null ? Number(callerId) : null;
              const isOutgoing = activeTab === 'made' || (activeTab === 'all' && (normalizedCurrentUserId != null ? callerIdNumber === normalizedCurrentUserId : !!call.caller));
              const otherPerson = isOutgoing ? call.receiver : call.caller;
              const otherPhoneNumber = isOutgoing
                ? (call.receiverPhoneNumber || otherPerson?.phone_number)
                : (call.caller?.phone_number || otherPerson?.phone_number);
              
              return (
                <div key={call.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      isOutgoing ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      <svg 
                        className={`w-6 h-6 ${isOutgoing ? 'text-blue-600' : 'text-green-600'}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d={isOutgoing 
                            ? "M16 3l-4 4m0 0l4 4m-4-4h12M4 20h16" 
                            : "M8 7l4-4m0 0l4 4m-4-4v18"
                          } 
                        />
                      </svg>
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">
                        {otherPerson?.full_name || 'Unknown User'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {otherPerson?.phone_number}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                          {getCallTypeLabel(call.callType)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(call.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Call Again Button */}
                    <button
                      onClick={() => {
                        if (otherPhoneNumber) {
                          window.open(`tel:${otherPhoneNumber}`, '_self');
                        }
                      }}
                      disabled={!otherPhoneNumber}
                      className={`p-2 rounded-lg transition-colors ${
                        otherPhoneNumber
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-gray-300 cursor-not-allowed'
                      }`}
                      title="Call Again"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CallHistory;
