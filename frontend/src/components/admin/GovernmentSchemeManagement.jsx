import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';

const DEFAULT_FORM = {
  title: '',
  department: '',
  government_level: 'central',
  state: '',
  category: 'general',
  animal_category: 'both',
  animal_types: '',
  short_description: '',
  description: '',
  amount_label: '',
  interest_rate: '',
  deadline: '',
  official_url: '',
  contact_info: '',
  benefits: '',
  eligibility: '',
  required_documents: '',
  application_steps: '',
  status: 'draft',
  is_featured: false,
  hi_title: '',
  hi_short_description: '',
  hi_description: '',
  mr_title: '',
  mr_short_description: '',
  mr_description: ''
};

const STATUSES = ['all', 'draft', 'published', 'archived'];
const CATEGORIES = ['general', 'loan', 'subsidy', 'insurance', 'training', 'health'];
const ANIMAL_CATEGORIES = ['both', 'farm', 'pet'];
const GOVERNMENT_LEVELS = ['central', 'state', 'district', 'other'];

const toLines = (value) => Array.isArray(value) ? value.join('\n') : '';
const linesToArray = (value) => String(value || '').split('\n').map((item) => item.trim()).filter(Boolean);

const buildTranslations = (form) => ({
  en: {
    title: form.title,
    short_description: form.short_description,
    description: form.description,
    benefits: linesToArray(form.benefits),
    eligibility: linesToArray(form.eligibility),
    required_documents: linesToArray(form.required_documents),
    application_steps: linesToArray(form.application_steps)
  },
  hi: {
    title: form.hi_title,
    short_description: form.hi_short_description,
    description: form.hi_description
  },
  mr: {
    title: form.mr_title,
    short_description: form.mr_short_description,
    description: form.mr_description
  }
});

const GovernmentSchemeManagement = () => {
  const [schemes, setSchemes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingScheme, setEditingScheme] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);

  const adminToken = localStorage.getItem('adminToken');

  const authHeaders = useMemo(() => ({
    Authorization: `Bearer ${adminToken}`
  }), [adminToken]);

  const fetchSchemes = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        status: statusFilter,
        limit: '100',
        sortBy: 'updated_at',
        order: 'DESC'
      });
      if (search.trim()) query.set('search', search.trim());

      const response = await fetch(`${API_BASE_URL}/api/admin/government-schemes?${query.toString()}`, {
        headers: authHeaders
      });
      const data = await response.json();

      if (data.success) {
        setSchemes(data.data.schemes || []);
      } else {
        toast.error(data.message || 'Failed to load schemes');
      }
    } catch (error) {
      console.error('Failed to fetch schemes:', error);
      toast.error('Failed to load schemes');
    } finally {
      setLoading(false);
    }
  }, [authHeaders, search, statusFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/government-schemes/stats`, {
        headers: authHeaders
      });
      const data = await response.json();
      if (data.success) setStats(data.data);
    } catch (error) {
      console.error('Failed to fetch scheme stats:', error);
    }
  }, [authHeaders]);

  useEffect(() => {
    fetchSchemes();
    fetchStats();
  }, [fetchSchemes, fetchStats]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm(DEFAULT_FORM);
    setEditingScheme(null);
    setImageFile(null);
    setShowForm(false);
  };

  const startEdit = (scheme) => {
    const translations = scheme.translations || {};
    setEditingScheme(scheme);
    setImageFile(null);
    setForm({
      title: scheme.title || '',
      department: scheme.department || '',
      government_level: scheme.government_level || 'central',
      state: scheme.state || '',
      category: scheme.category || 'general',
      animal_category: scheme.animal_category || 'both',
      animal_types: Array.isArray(scheme.animal_types) ? scheme.animal_types.join(', ') : '',
      short_description: scheme.short_description || '',
      description: scheme.description || '',
      amount_label: scheme.amount_label || '',
      interest_rate: scheme.interest_rate || '',
      deadline: scheme.deadline || '',
      official_url: scheme.official_url || '',
      contact_info: scheme.contact_info || '',
      benefits: toLines(scheme.benefits),
      eligibility: toLines(scheme.eligibility),
      required_documents: toLines(scheme.required_documents),
      application_steps: toLines(scheme.application_steps),
      status: scheme.status || 'draft',
      is_featured: Boolean(scheme.is_featured),
      hi_title: translations.hi?.title || '',
      hi_short_description: translations.hi?.short_description || '',
      hi_description: translations.hi?.description || '',
      mr_title: translations.mr?.title || '',
      mr_short_description: translations.mr?.short_description || '',
      mr_description: translations.mr?.description || ''
    });
    setShowForm(true);
  };

  const buildFormData = () => {
    const payload = new FormData();
    const animalTypes = form.animal_types.split(',').map((item) => item.trim()).filter(Boolean);

    Object.entries({
      title: form.title,
      department: form.department,
      government_level: form.government_level,
      state: form.state,
      category: form.category,
      animal_category: form.animal_category,
      animal_types: JSON.stringify(animalTypes),
      short_description: form.short_description,
      description: form.description,
      amount_label: form.amount_label,
      interest_rate: form.interest_rate,
      deadline: form.deadline,
      official_url: form.official_url,
      contact_info: form.contact_info,
      benefits: JSON.stringify(linesToArray(form.benefits)),
      eligibility: JSON.stringify(linesToArray(form.eligibility)),
      required_documents: JSON.stringify(linesToArray(form.required_documents)),
      application_steps: JSON.stringify(linesToArray(form.application_steps)),
      translations: JSON.stringify(buildTranslations(form)),
      status: form.status,
      is_featured: String(form.is_featured)
    }).forEach(([key, value]) => {
      payload.append(key, value ?? '');
    });

    if (imageFile) {
      payload.append('image', imageFile);
    }

    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      toast.error('Scheme title is required');
      return;
    }

    setSaving(true);
    try {
      const url = editingScheme
        ? `${API_BASE_URL}/api/admin/government-schemes/${editingScheme.id}`
        : `${API_BASE_URL}/api/admin/government-schemes`;

      const response = await fetch(url, {
        method: editingScheme ? 'PUT' : 'POST',
        headers: authHeaders,
        body: buildFormData()
      });
      const data = await response.json();

      if (data.success) {
        toast.success(editingScheme ? 'Scheme updated' : 'Scheme created');
        resetForm();
        fetchSchemes();
        fetchStats();
      } else {
        toast.error(data.message || 'Failed to save scheme');
      }
    } catch (error) {
      console.error('Failed to save scheme:', error);
      toast.error('Failed to save scheme');
    } finally {
      setSaving(false);
    }
  };

  const deleteScheme = async (scheme) => {
    if (!window.confirm(`Delete "${scheme.title}"?`)) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/government-schemes/${scheme.id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Scheme deleted');
        fetchSchemes();
        fetchStats();
      } else {
        toast.error(data.message || 'Failed to delete scheme');
      }
    } catch (error) {
      console.error('Failed to delete scheme:', error);
      toast.error('Failed to delete scheme');
    }
  };

  const updateStatus = async (scheme, status) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/government-schemes/${scheme.id}/status`, {
        method: 'PATCH',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Status updated');
        fetchSchemes();
        fetchStats();
      } else {
        toast.error(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    }
  };

  const statCards = [
    ['Total', stats?.total || 0, 'from-sky-500 to-cyan-500'],
    ['Published', stats?.published || 0, 'from-emerald-500 to-teal-500'],
    ['Drafts', stats?.draft || 0, 'from-amber-500 to-orange-500'],
    ['Featured', stats?.featured || 0, 'from-fuchsia-500 to-rose-500']
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-emerald-300">Government Schemes</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Manage scheme content</h2>
          <p className="mt-1 text-sm text-slate-400">Create official loan, subsidy, insurance, and training schemes for users.</p>
        </div>
        <button
          onClick={() => {
            setShowForm((value) => !value);
            if (showForm) resetForm();
          }}
          className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-400"
        >
          {showForm ? 'Close Form' : '+ Add Scheme'}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(([label, value, gradient]) => (
          <div key={label} className="rounded-2xl border border-slate-700/60 bg-slate-800/70 p-5">
            <div className={`mb-4 h-2 w-14 rounded-full bg-gradient-to-r ${gradient}`} />
            <p className="text-sm text-slate-400">{label}</p>
            <p className="mt-2 text-3xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-700/70 bg-slate-800/80 p-5 shadow-2xl shadow-black/20">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h3 className="text-xl font-bold text-white">{editingScheme ? 'Edit Scheme' : 'Create Scheme'}</h3>
            <button type="button" onClick={resetForm} className="text-sm font-medium text-slate-400 hover:text-white">Cancel</button>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Input label="Title" value={form.title} onChange={(value) => updateField('title', value)} required />
            <Input label="Department" value={form.department} onChange={(value) => updateField('department', value)} />
            <Select label="Government Level" value={form.government_level} options={GOVERNMENT_LEVELS} onChange={(value) => updateField('government_level', value)} />
            <Input label="State" value={form.state} onChange={(value) => updateField('state', value)} placeholder="Optional for central schemes" />
            <Select label="Category" value={form.category} options={CATEGORIES} onChange={(value) => updateField('category', value)} />
            <Select label="Animal Category" value={form.animal_category} options={ANIMAL_CATEGORIES} onChange={(value) => updateField('animal_category', value)} />
            <Input label="Animal Types" value={form.animal_types} onChange={(value) => updateField('animal_types', value)} placeholder="cow, buffalo, goat" />
            <Input label="Amount Label" value={form.amount_label} onChange={(value) => updateField('amount_label', value)} placeholder="INR 1.6L" />
            <Input label="Interest Rate" value={form.interest_rate} onChange={(value) => updateField('interest_rate', value)} placeholder="4%" />
            <Input label="Deadline" type="date" value={form.deadline} onChange={(value) => updateField('deadline', value)} />
            <Input label="Official Apply URL" value={form.official_url} onChange={(value) => updateField('official_url', value)} />
            <Input label="Contact Info" value={form.contact_info} onChange={(value) => updateField('contact_info', value)} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Textarea label="Short Description" value={form.short_description} onChange={(value) => updateField('short_description', value)} />
            <Textarea label="Full Description" value={form.description} onChange={(value) => updateField('description', value)} />
            <Textarea label="Benefits (one per line)" value={form.benefits} onChange={(value) => updateField('benefits', value)} />
            <Textarea label="Eligibility (one per line)" value={form.eligibility} onChange={(value) => updateField('eligibility', value)} />
            <Textarea label="Required Documents (one per line)" value={form.required_documents} onChange={(value) => updateField('required_documents', value)} />
            <Textarea label="Application Steps (one per line)" value={form.application_steps} onChange={(value) => updateField('application_steps', value)} />
          </div>

          <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900/45 p-4">
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">Hindi and Marathi Content</h4>
            <div className="grid gap-4 lg:grid-cols-2">
              <Input label="Hindi Title" value={form.hi_title} onChange={(value) => updateField('hi_title', value)} />
              <Input label="Marathi Title" value={form.mr_title} onChange={(value) => updateField('mr_title', value)} />
              <Textarea label="Hindi Short Description" value={form.hi_short_description} onChange={(value) => updateField('hi_short_description', value)} />
              <Textarea label="Marathi Short Description" value={form.mr_short_description} onChange={(value) => updateField('mr_short_description', value)} />
              <Textarea label="Hindi Full Description" value={form.hi_description} onChange={(value) => updateField('hi_description', value)} />
              <Textarea label="Marathi Full Description" value={form.mr_description} onChange={(value) => updateField('mr_description', value)} />
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
            <Select label="Status" value={form.status} options={STATUSES.filter((status) => status !== 'all')} onChange={(value) => updateField('status', value)} />
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Scheme Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setImageFile(event.target.files?.[0] || null)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-500 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
            </label>
            <label className="mt-8 flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(event) => updateField('is_featured', event.target.checked)}
                className="h-4 w-4 accent-emerald-500"
              />
              Featured scheme
            </label>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 disabled:opacity-60"
            >
              {saving ? 'Saving...' : editingScheme ? 'Save Changes' : 'Create Scheme'}
            </button>
          </div>
        </form>
      )}

      <div className="rounded-3xl border border-slate-700/70 bg-slate-800/70 p-5">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-full px-4 py-2 text-sm font-medium capitalize ${
                  statusFilter === status ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search schemes..."
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500 lg:w-80"
          />
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400">Loading schemes...</div>
        ) : schemes.length === 0 ? (
          <div className="py-16 text-center text-slate-400">No government schemes found</div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {schemes.map((scheme) => (
              <article key={scheme.id} className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/70">
                <div className="grid gap-0 sm:grid-cols-[10rem_1fr]">
                  <div className="h-44 bg-gradient-to-br from-emerald-900/60 to-amber-900/40 sm:h-full">
                    {scheme.image_url ? (
                      <img src={scheme.image_url} alt={scheme.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <SchemeAdminIcon className="h-14 w-14 text-emerald-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="mb-3 flex flex-wrap gap-2">
                      <Badge>{scheme.status}</Badge>
                      <Badge>{scheme.category}</Badge>
                      <Badge>{scheme.animal_category}</Badge>
                      {scheme.is_featured && <Badge tone="amber">featured</Badge>}
                    </div>
                    <h3 className="text-lg font-bold text-white">{scheme.title}</h3>
                    <p className="mt-1 text-sm text-slate-400">{scheme.department || 'Department not added'}</p>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-300">{scheme.short_description || scheme.description || 'No description added.'}</p>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                      <Metric label="Amount" value={scheme.amount_label || '-'} />
                      <Metric label="Rate" value={scheme.interest_rate || '-'} />
                      <Metric label="Views" value={scheme.views || 0} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button onClick={() => startEdit(scheme)} className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-white hover:bg-slate-600">Edit</button>
                      <button onClick={() => updateStatus(scheme, scheme.status === 'published' ? 'draft' : 'published')} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500">
                        {scheme.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                      <button onClick={() => deleteScheme(scheme)} className="rounded-lg bg-red-500/15 px-3 py-2 text-sm font-medium text-red-300 hover:bg-red-500/25">Delete</button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Input = ({ label, value, onChange, type = 'text', required = false, placeholder = '' }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
    <input
      type={type}
      required={required}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-500"
    />
  </label>
);

const Select = ({ label, value, options, onChange }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm capitalize text-white outline-none transition focus:border-emerald-500"
    >
      {options.map((option) => (
        <option key={option} value={option}>{option.replace(/_/g, ' ')}</option>
      ))}
    </select>
  </label>
);

const Textarea = ({ label, value, onChange }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
    <textarea
      rows={4}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-500"
    />
  </label>
);

const Badge = ({ children, tone = 'slate' }) => {
  const tones = {
    slate: 'bg-slate-700 text-slate-200',
    amber: 'bg-amber-500/20 text-amber-200'
  };

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${tones[tone] || tones.slate}`}>
      {children}
    </span>
  );
};

const Metric = ({ label, value }) => (
  <div className="rounded-xl bg-slate-800 px-2 py-3">
    <p className="font-bold text-white">{value}</p>
    <p className="mt-1 text-slate-500">{label}</p>
  </div>
);

const SchemeAdminIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 21h18M5 21V9l7-4 7 4v12M9 21v-6h6v6M9 11h.01M12 11h.01M15 11h.01" />
  </svg>
);

export default GovernmentSchemeManagement;
