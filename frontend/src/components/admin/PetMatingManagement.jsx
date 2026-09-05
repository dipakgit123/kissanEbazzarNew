import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';

const STATUSES = ['all', 'active', 'pending', 'paused', 'matched', 'rejected', 'removed'];

const PetMatingManagement = () => {
  const [profiles, setProfiles] = useState([]);
  const [reports, setReports] = useState([]);
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ limit: '100' });
      if (status !== 'all') query.set('status', status);

      const [profilesResponse, reportsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/pet-mating?${query.toString()}`, { headers: getHeaders() }),
        fetch(`${API_BASE_URL}/api/admin/pet-mating/reports`, { headers: getHeaders() }),
      ]);
      const profilesData = await profilesResponse.json();
      const reportsData = await reportsResponse.json();
      setProfiles(profilesData?.data?.profiles || []);
      setReports(reportsData?.data?.reports || []);
    } catch {
      toast.error('Failed to load pet mating moderation');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateProfile = async (id, payload) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/pet-mating/${id}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      toast.success('Pet mating profile updated');
      loadData();
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-700/50 bg-[#1e293b] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Pet Mating Moderation</h2>
            <p className="mt-1 text-sm text-slate-400">Review dog/cat mating profiles, reports, and visibility.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((item) => (
              <button
                key={item}
                onClick={() => setStatus(item)}
                className={`rounded-xl px-4 py-2 text-sm font-bold capitalize ${
                  status === item ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Profiles" value={profiles.length} />
        <Stat label="Open Reports" value={reports.filter((report) => report.status === 'open').length} />
        <Stat label="Featured" value={profiles.filter((profile) => profile.is_featured).length} />
      </div>

      {loading ? (
        <div className="rounded-2xl bg-[#1e293b] p-10 text-center text-slate-300">Loading...</div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {profiles.map((profile) => (
            <div key={profile.id} className="overflow-hidden rounded-2xl border border-slate-700/50 bg-[#1e293b]">
              <div className="flex gap-4 p-4">
                <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-slate-800">
                  {profile.photos?.[0] ? <img src={profile.photos[0]} alt={profile.pet_name} className="h-full w-full object-cover" /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold uppercase text-emerald-300">{profile.pet_type}</span>
                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold uppercase text-slate-300">{profile.status}</span>
                    {profile.report_count > 0 && <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold text-red-300">{profile.report_count} reports</span>}
                  </div>
                  <h3 className="mt-3 truncate text-xl font-black text-white">{profile.pet_name} · {profile.breed}</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-400">{profile.owner_name || profile.owner?.full_name || 'Owner'} · {profile.city || '-'}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {['active', 'paused', 'matched', 'rejected', 'removed'].map((nextStatus) => (
                      <button
                        key={nextStatus}
                        onClick={() => updateProfile(profile.id, { status: nextStatus })}
                        className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-bold capitalize text-slate-200 hover:bg-slate-700"
                      >
                        {nextStatus}
                      </button>
                    ))}
                    <button
                      onClick={() => updateProfile(profile.id, { is_featured: !profile.is_featured })}
                      className="rounded-lg bg-amber-500/15 px-3 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/25"
                    >
                      {profile.is_featured ? 'Unfeature' : 'Feature'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Stat = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-700/50 bg-[#1e293b] p-5">
    <p className="text-sm font-bold text-slate-400">{label}</p>
    <p className="mt-2 text-3xl font-black text-white">{value}</p>
  </div>
);

export default PetMatingManagement;
