import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { getCatBreedOptions } from '../constants/catBreeds';
import { getDogBreedOptions } from '../constants/dogBreeds';
import { petMatingService } from '../services/api';

const emptyForm = {
  pet_type: 'dog',
  pet_name: '',
  breed: '',
  gender: 'male',
  age_months: '',
  fee_type: 'negotiable',
  fee_amount: '',
  owner_phone: '',
  city: '',
  state: '',
  description: '',
};

const getLanguage = (i18n) => (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0];
const getBreedOptions = (type, language, label) => (
  type === 'cat' ? getCatBreedOptions(language, label) : getDogBreedOptions(language, label)
);
const getPhoto = (profile) => profile?.photos?.[0] || null;
const getLocation = (profile) => [profile.city, profile.state].filter(Boolean).join(', ');

const formatFee = (profile, t) => {
  if (profile.fee_type === 'free') return t('petMating.free', { defaultValue: 'Free' });
  if (profile.fee_type === 'paid') {
    return profile.fee_amount ? `Rs. ${Number(profile.fee_amount).toLocaleString('en-IN')}` : t('petMating.paid', { defaultValue: 'Paid' });
  }
  return t('petMating.negotiable', { defaultValue: 'Negotiable' });
};

const PetMatingPage = () => {
  const { t, i18n } = useTranslation();
  const language = getLanguage(i18n);
  const [profiles, setProfiles] = useState([]);
  const [myProfiles, setMyProfiles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ petType: 'all', gender: 'all', search: '' });
  const [form, setForm] = useState(emptyForm);
  const [photos, setPhotos] = useState([]);
  const [video, setVideo] = useState(null);

  const breedOptions = useMemo(
    () => getBreedOptions(form.pet_type, language, t('petMating.selectBreed', { defaultValue: 'Select breed' })),
    [form.pet_type, language, t]
  );

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 40 };
      if (filters.petType !== 'all') params.petType = filters.petType;
      if (filters.gender !== 'all') params.gender = filters.gender;
      if (filters.search.trim()) params.search = filters.search.trim();

      const [publicResponse, myResponse] = await Promise.all([
        petMatingService.getProfiles(params),
        petMatingService.getMyProfiles().catch(() => ({ data: { profiles: [] } })),
      ]);
      setProfiles(publicResponse?.data?.profiles || []);
      setMyProfiles(myResponse?.data?.profiles || []);
    } catch (error) {
      toast.error(error?.message || t('petMating.loadFailed', { defaultValue: 'Failed to load pet mating profiles' }));
    } finally {
      setLoading(false);
    }
  }, [filters, t]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'pet_type' ? { breed: '' } : {}),
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setPhotos([]);
    setVideo(null);
  };

  const buildFormData = () => {
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        formData.append(key, value);
      }
    });
    photos.forEach((file) => formData.append('photos', file));
    if (video) formData.append('video', video);
    return formData;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (photos.length === 0) {
      toast.error(t('petMating.photoRequired', { defaultValue: 'Please add at least one pet photo' }));
      return;
    }

    setSubmitting(true);
    try {
      await petMatingService.createProfile(buildFormData());
      toast.success(t('petMating.created', { defaultValue: 'Pet mating profile created' }));
      resetForm();
      setShowForm(false);
      await loadProfiles();
    } catch (error) {
      toast.error(error?.message || t('petMating.createFailed', { defaultValue: 'Failed to create profile' }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleContact = async (profile) => {
    try {
      const response = await petMatingService.trackContact(profile.id);
      const phone = response?.data?.owner_phone || profile.owner_phone || profile.owner?.phone_number;
      if (phone) {
        window.location.href = `tel:${phone}`;
      } else {
        toast.error(t('petMating.noPhone', { defaultValue: 'Owner phone number is not available' }));
      }
    } catch (error) {
      toast.error(error?.message || t('petMating.contactFailed', { defaultValue: 'Unable to contact owner' }));
    }
  };

  const handleReport = async (profile) => {
    const description = window.prompt(t('petMating.reportPrompt', { defaultValue: 'Tell us what is wrong with this profile' }));
    if (!description) return;

    try {
      await petMatingService.reportProfile(profile.id, { reason: 'other', description });
      toast.success(t('petMating.reported', { defaultValue: 'Profile reported for review' }));
    } catch (error) {
      toast.error(error?.message || t('petMating.reportFailed', { defaultValue: 'Failed to report profile' }));
    }
  };

  const handleMatched = async (profile) => {
    try {
      await petMatingService.markMatched(profile.id);
      toast.success(t('petMating.markedMatched', { defaultValue: 'Profile marked as matched' }));
      await loadProfiles();
    } catch (error) {
      toast.error(error?.message || t('petMating.updateFailed', { defaultValue: 'Failed to update profile' }));
    }
  };

  const handleDelete = async (profile) => {
    const confirmed = window.confirm(t('petMating.deleteConfirm', { defaultValue: 'Delete this pet mating profile?' }));
    if (!confirmed) return;

    try {
      await petMatingService.deleteProfile(profile.id);
      toast.success(t('petMating.deleted', { defaultValue: 'Profile deleted' }));
      await loadProfiles();
    } catch (error) {
      toast.error(error?.message || t('petMating.deleteFailed', { defaultValue: 'Failed to delete profile' }));
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F5EE] text-[#243129]">
      <section className="border-b border-[#E1DACD] bg-[#F7F5EE]">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="rounded-[1.5rem] bg-[#0F6E56] p-4 text-white shadow-lg shadow-[#0F6E56]/10 sm:p-5">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#C9F4DF]">{t('petMating.kicker', { defaultValue: 'Pet mating' })}</p>
                <h1 className="mt-2 max-w-4xl text-2xl font-black leading-tight sm:text-3xl lg:text-4xl">
                  {t('petMating.heroTitle', { defaultValue: 'Find trusted mates for dogs and cats.' })}
                </h1>
                <div className="mt-3 flex flex-wrap gap-2 text-[0.7rem] font-black text-[#D9F7EA]">
                  <span className="rounded-full bg-white/12 px-3 py-1.5">{t('petMating.trustPhotoTitle', { defaultValue: 'Clear photo first' })}</span>
                  <span className="rounded-full bg-white/12 px-3 py-1.5">{t('petMating.trustContactTitle', { defaultValue: 'Verified contact' })}</span>
                  <span className="rounded-full bg-white/12 px-3 py-1.5">{t('petMating.trustReportTitle', { defaultValue: 'Report unsafe profiles' })}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                <MiniStat value={profiles.length} label={t('petMating.profilesCount', { defaultValue: 'profiles' })} />
                <button type="button" onClick={() => setShowForm(true)} className="rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-[#0F6E56] shadow-lg transition hover:-translate-y-0.5">
                  {t('petMating.createProfile', { defaultValue: 'Create mating profile' })}
                </button>
              </div>
            </div>
          </div>

          <div id="pet-mating-list" className="mt-3 rounded-[1.5rem] border border-[#E1DACD] bg-white p-3 shadow-sm">
            <div className="grid gap-2 lg:grid-cols-[1fr_11rem_11rem_auto] lg:items-end">
              <FilterInput label={t('petMating.searchLabel', { defaultValue: 'Search profiles' })} value={filters.search} onChange={(value) => setFilters((current) => ({ ...current, search: value }))} placeholder={t('petMating.searchPlaceholder', { defaultValue: 'Search breed, city, pet name' })} />
              <FilterSelect label={t('petMating.petType', { defaultValue: 'Pet type' })} value={filters.petType} onChange={(value) => setFilters((current) => ({ ...current, petType: value }))}>
                <option value="all">{t('petMating.allPets', { defaultValue: 'All pets' })}</option>
                <option value="dog">{t('animalTypes.dog', { defaultValue: 'Dog' })}</option>
                <option value="cat">{t('animalTypes.cat', { defaultValue: 'Cat' })}</option>
              </FilterSelect>
              <FilterSelect label={t('petMating.gender', { defaultValue: 'Gender' })} value={filters.gender} onChange={(value) => setFilters((current) => ({ ...current, gender: value }))}>
                <option value="all">{t('petMating.allGenders', { defaultValue: 'All genders' })}</option>
                <option value="male">{t('petMating.male', { defaultValue: 'Male' })}</option>
                <option value="female">{t('petMating.female', { defaultValue: 'Female' })}</option>
              </FilterSelect>
              <button type="button" onClick={() => setShowForm(true)} className="rounded-2xl bg-[#0F6E56] px-4 py-2.5 text-sm font-black text-white shadow-md shadow-[#0F6E56]/10 transition hover:bg-[#0B5C49]">
                {t('petMating.createProfile', { defaultValue: 'Create mating profile' })}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        {myProfiles.length > 0 && (
          <section className="mb-8 rounded-[2rem] border border-[#E4E0D5] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0F6E56]">{t('petMating.ownerDashboard', { defaultValue: 'Owner dashboard' })}</p>
                <h2 className="mt-1 text-2xl font-black text-[#243129]">{t('petMating.myProfiles', { defaultValue: 'My pet mating profiles' })}</h2>
              </div>
              <p className="text-sm font-bold text-[#6C716A]">{t('petMating.manageProfilesHint', { defaultValue: 'Manage visibility after your pet finds a match.' })}</p>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {myProfiles.map((profile) => (
                <OwnerProfileRow key={profile.id} profile={profile} t={t} onMatched={() => handleMatched(profile)} onDelete={() => handleDelete(profile)} />
              ))}
            </div>
          </section>
        )}

        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0F6E56]">{t('petMating.browseProfiles', { defaultValue: 'Browse profiles' })}</p>
            <h2 className="mt-1 text-3xl font-black text-[#243129]">{t('petMating.availableProfiles', { defaultValue: 'Available pet profiles' })}</h2>
          </div>
          <span className="rounded-full bg-[#E1F5EE] px-4 py-2 text-sm font-black text-[#0F6E56]">
            {profiles.length} {t('petMating.profilesCount', { defaultValue: 'profiles' })}
          </span>
        </div>

        {loading ? (
          <div className="rounded-[2rem] bg-white p-10 text-center font-bold text-[#6C716A] shadow-sm">{t('common.loading', { defaultValue: 'Loading...' })}</div>
        ) : profiles.length === 0 ? (
          <EmptyState t={t} onCreate={() => setShowForm(true)} />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {profiles.map((profile) => (
              <ProfileCard key={profile.id} profile={profile} t={t} onSelect={() => setSelected(profile)} />
            ))}
          </div>
        )}
      </section>

      {showForm && (
        <PetMatingFormModal
          t={t}
          form={form}
          photos={photos}
          video={video}
          breedOptions={breedOptions}
          submitting={submitting}
          updateForm={updateForm}
          setPhotos={setPhotos}
          setVideo={setVideo}
          onSubmit={handleSubmit}
          onClose={() => !submitting && setShowForm(false)}
        />
      )}

      {selected && (
        <ProfileDetailModal
          profile={selected}
          t={t}
          onClose={() => setSelected(null)}
          onContact={() => handleContact(selected)}
          onReport={() => handleReport(selected)}
        />
      )}
    </main>
  );
};

const MiniStat = ({ value, label }) => (
  <div className="rounded-2xl bg-white/12 px-4 py-2 text-center">
    <p className="text-xl font-black text-white">{value}</p>
    <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-[#C9F4DF]">{label}</p>
  </div>
);

const FilterInput = ({ label, value, onChange, placeholder }) => (
  <label>
    <span className="mb-1 block text-[0.65rem] font-black uppercase tracking-[0.16em] text-[#6C716A]">{label}</span>
    <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-[#E4E0D5] bg-[#FCFBF7] px-3 py-2.5 text-sm font-bold outline-none transition focus:border-[#0F6E56] focus:ring-4 focus:ring-[#0F6E56]/10" />
  </label>
);

const FilterSelect = ({ label, value, onChange, children }) => (
  <label>
    <span className="mb-1 block text-[0.65rem] font-black uppercase tracking-[0.16em] text-[#6C716A]">{label}</span>
    <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-[#E4E0D5] bg-[#FCFBF7] px-3 py-2.5 text-sm font-bold outline-none transition focus:border-[#0F6E56] focus:ring-4 focus:ring-[#0F6E56]/10">
      {children}
    </select>
  </label>
);

const OwnerProfileRow = ({ profile, t, onMatched, onDelete }) => (
  <div className="flex flex-col gap-4 rounded-3xl border border-[#E9E5DB] bg-[#FCFBF7] p-4 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex min-w-0 items-center gap-3">
      <div className="h-14 w-14 overflow-hidden rounded-2xl bg-[#E1F5EE]">
        {getPhoto(profile) ? <img src={getPhoto(profile)} alt={profile.pet_name} className="h-full w-full object-cover" /> : null}
      </div>
      <div className="min-w-0">
        <p className="truncate font-black text-[#243129]">{profile.pet_name} - {profile.breed}</p>
        <p className="mt-1 text-sm font-bold capitalize text-[#6C716A]">{profile.status}</p>
      </div>
    </div>
    <div className="flex flex-wrap gap-2">
      {profile.status === 'active' && (
        <button type="button" onClick={onMatched} className="rounded-xl bg-[#1D9E75] px-4 py-2 text-sm font-black text-white">
          {t('petMating.markMatched', { defaultValue: 'Mark matched' })}
        </button>
      )}
      <button type="button" onClick={onDelete} className="rounded-xl border border-[#E03131] bg-white px-4 py-2 text-sm font-black text-[#E03131]">
        {t('petMating.deleteProfile', { defaultValue: 'Delete' })}
      </button>
    </div>
  </div>
);

const ProfileCard = ({ profile, t, onSelect }) => (
  <article className="group overflow-hidden rounded-[1.7rem] border border-[#E4E0D5] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
    <button type="button" onClick={onSelect} className="block w-full text-left">
      <div className="relative h-56 bg-[#E1F5EE]">
        {getPhoto(profile) ? (
          <img src={getPhoto(profile)} alt={profile.pet_name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-xl font-black uppercase tracking-[0.18em] text-[#0F6E56]">Pet</div>
        )}
        <div className="absolute left-4 top-4 flex gap-2">
          <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-black uppercase text-[#0F6E56] shadow">{profile.pet_type}</span>
          <span className="rounded-full bg-[#243129]/85 px-3 py-1 text-xs font-black capitalize text-white shadow">{profile.status}</span>
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-2xl font-black text-[#243129]">{profile.pet_name}</h3>
            <p className="mt-1 font-bold text-[#6C716A]">{profile.breed} - {t(`petMating.${profile.gender}`, { defaultValue: profile.gender })}</p>
          </div>
          <span className="shrink-0 rounded-full bg-[#FAECE7] px-3 py-1 text-xs font-black text-[#D85A30]">{formatFee(profile, t)}</span>
        </div>
        <p className="mt-4 line-clamp-2 min-h-[3rem] text-sm font-semibold leading-6 text-[#6C716A]">{profile.description || t('petMating.noDescription', { defaultValue: 'No description added.' })}</p>
        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="truncate text-sm font-black text-[#0F6E56]">{getLocation(profile) || t('profile.locationNotSet', { defaultValue: 'Location not set' })}</p>
          <span className="rounded-full bg-[#F7F5EE] px-3 py-2 text-xs font-black text-[#243129]">{t('petMating.viewDetails', { defaultValue: 'View details' })}</span>
        </div>
      </div>
    </button>
  </article>
);

const PetMatingFormModal = ({
  t,
  form,
  photos,
  video,
  breedOptions,
  submitting,
  updateForm,
  setPhotos,
  setVideo,
  onSubmit,
  onClose,
}) => (
  <div className="fixed inset-0 z-50 overflow-y-auto bg-[#111815]/70 p-4 backdrop-blur-sm">
    <div className="mx-auto my-6 max-w-3xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
      <div className="border-b border-[#E4E0D5] bg-[#FCFBF7] px-5 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0F6E56]">{t('petMating.simpleProfile', { defaultValue: 'Simple profile' })}</p>
            <h2 className="mt-1 text-2xl font-black text-[#243129]">{t('petMating.formTitle', { defaultValue: 'Add pet mating profile' })}</h2>
            <p className="mt-1 text-sm font-semibold text-[#6C716A]">{t('petMating.simpleFormHint', { defaultValue: 'Only the important details. You can keep optional fields blank.' })}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-2xl bg-white px-4 py-2 text-lg font-black text-[#243129]" aria-label={t('common.close', { defaultValue: 'Close' })}>x</button>
        </div>
      </div>

      <form onSubmit={onSubmit} className="max-h-[calc(100vh-8rem)] overflow-y-auto p-5 sm:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FileField
            className="md:col-span-2"
            label={t('petMating.addPhotos', { defaultValue: 'Add photos' })}
            helper={t('petMating.photoHelp', { defaultValue: 'At least one clear photo is required. Maximum 5 photos.' })}
            value={photos.length > 0 ? `${photos.length} ${t('petMating.photosSelected', { defaultValue: 'photos selected' })}` : t('petMating.choosePhotos', { defaultValue: 'Choose photos' })}
            accept="image/*"
            multiple
            onChange={(files) => setPhotos(Array.from(files || []).slice(0, 5))}
          />
          <SelectField label={t('petMating.petType', { defaultValue: 'Pet type' })} value={form.pet_type} onChange={(value) => updateForm('pet_type', value)}>
            <option value="dog">{t('animalTypes.dog', { defaultValue: 'Dog' })}</option>
            <option value="cat">{t('animalTypes.cat', { defaultValue: 'Cat' })}</option>
          </SelectField>
          <SelectField required label={t('petMating.selectBreed', { defaultValue: 'Select breed' })} value={form.breed} onChange={(value) => updateForm('breed', value)}>
            {breedOptions.map((option) => <option key={option.value || 'empty'} value={option.value}>{option.label}</option>)}
          </SelectField>
          <TextField required label={t('petMating.petName', { defaultValue: 'Pet name' })} value={form.pet_name} onChange={(value) => updateForm('pet_name', value)} />
          <SelectField label={t('petMating.gender', { defaultValue: 'Gender' })} value={form.gender} onChange={(value) => updateForm('gender', value)}>
            <option value="male">{t('petMating.male', { defaultValue: 'Male' })}</option>
            <option value="female">{t('petMating.female', { defaultValue: 'Female' })}</option>
          </SelectField>
          <TextField min="0" type="number" label={t('petMating.ageMonths', { defaultValue: 'Age in months' })} value={form.age_months} onChange={(value) => updateForm('age_months', value)} />
          <TextField
            min="0"
            type="number"
            label={t('petMating.feePrice', { defaultValue: 'Fees / Price' })}
            value={form.fee_amount}
            onChange={(value) => {
              updateForm('fee_amount', value);
              updateForm('fee_type', value ? 'paid' : 'negotiable');
            }}
          />
          <TextField required label={t('petMating.ownerPhone', { defaultValue: 'Owner phone' })} value={form.owner_phone} onChange={(value) => updateForm('owner_phone', value)} />
          <TextField label={t('petMating.city', { defaultValue: 'City' })} value={form.city} onChange={(value) => updateForm('city', value)} />
          <TextField label={t('petMating.state', { defaultValue: 'State' })} value={form.state} onChange={(value) => updateForm('state', value)} />
          <FileField
            label={t('petMating.addVideoOptional', { defaultValue: 'Add video optional' })}
            helper={t('petMating.videoHelp', { defaultValue: 'Short optional video helps buyers understand the pet better.' })}
            value={video ? video.name : t('petMating.chooseVideo', { defaultValue: 'Choose video' })}
            accept="video/*"
            onChange={(files) => setVideo(files?.[0] || null)}
          />
          <TextArea className="md:col-span-2" label={t('petMating.description', { defaultValue: 'Description, health notes, mating preference' })} value={form.description} onChange={(value) => updateForm('description', value)} />
        </div>

        <div className="sticky bottom-0 -mx-5 mt-6 border-t border-[#E4E0D5] bg-white/95 px-5 py-4 backdrop-blur sm:-mx-6 sm:px-6">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} disabled={submitting} className="rounded-2xl border border-[#E4E0D5] px-6 py-3 font-black text-[#243129] disabled:opacity-60">
              {t('common.cancel', { defaultValue: 'Cancel' })}
            </button>
            <button disabled={submitting} className="rounded-2xl bg-[#0F6E56] px-6 py-3 font-black text-white shadow-lg shadow-[#0F6E56]/15 disabled:bg-[#B4B2A9]">
              {submitting ? t('common.loading', { defaultValue: 'Loading...' }) : t('petMating.submitProfile', { defaultValue: 'Submit profile' })}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
);

const TextField = ({ label, value, onChange, className = '', ...props }) => (
  <label className={`block ${className}`}>
    <span className="mb-2 block text-sm font-black text-[#243129]">{label}</span>
    <input {...props} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-[#E4E0D5] bg-white px-4 py-3 font-bold text-[#243129] outline-none transition placeholder:text-[#9A9D96] focus:border-[#0F6E56] focus:ring-4 focus:ring-[#0F6E56]/10" />
  </label>
);

const SelectField = ({ label, value, onChange, children, className = '', ...props }) => (
  <label className={`block ${className}`}>
    <span className="mb-2 block text-sm font-black text-[#243129]">{label}</span>
    <select {...props} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-[#E4E0D5] bg-white px-4 py-3 font-bold text-[#243129] outline-none transition focus:border-[#0F6E56] focus:ring-4 focus:ring-[#0F6E56]/10">
      {children}
    </select>
  </label>
);

const TextArea = ({ label, value, onChange, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="mb-2 block text-sm font-black text-[#243129]">{label}</span>
    <textarea value={value} onChange={(event) => onChange(event.target.value)} className="min-h-[6rem] w-full rounded-2xl border border-[#E4E0D5] bg-white px-4 py-3 font-bold text-[#243129] outline-none transition placeholder:text-[#9A9D96] focus:border-[#0F6E56] focus:ring-4 focus:ring-[#0F6E56]/10" />
  </label>
);

const FileField = ({ label, helper, value, accept, multiple, onChange, className = '' }) => (
  <label className={`block rounded-3xl border border-dashed border-[#B9B5A9] bg-[#FCFBF7] p-4 transition hover:border-[#0F6E56] ${className}`}>
    <span className="block text-sm font-black text-[#243129]">{label}</span>
    <span className="mt-1 block text-xs font-semibold leading-5 text-[#6C716A]">{helper}</span>
    <span className="mt-3 inline-flex rounded-2xl bg-[#E1F5EE] px-4 py-2 text-sm font-black text-[#0F6E56]">{value}</span>
    <input type="file" accept={accept} multiple={multiple} onChange={(event) => onChange(event.target.files)} className="hidden" />
  </label>
);

const EmptyState = ({ t, onCreate }) => (
  <div className="rounded-[2rem] border border-[#E4E0D5] bg-white p-10 text-center shadow-sm">
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#E1F5EE] text-sm font-black uppercase tracking-[0.16em] text-[#0F6E56]">Pet</div>
    <h2 className="mt-4 text-2xl font-black text-[#243129]">{t('petMating.emptyTitle', { defaultValue: 'No pet mating profiles yet' })}</h2>
    <p className="mt-2 font-semibold text-[#6C716A]">{t('petMating.emptySubtitle', { defaultValue: 'Create the first trusted profile for your area.' })}</p>
    <button type="button" onClick={onCreate} className="mt-5 rounded-2xl bg-[#0F6E56] px-6 py-3 font-black text-white">
      {t('petMating.createProfile', { defaultValue: 'Create mating profile' })}
    </button>
  </div>
);

const ProfileDetailModal = ({ profile, t, onClose, onContact, onReport }) => (
  <div className="fixed inset-0 z-50 overflow-y-auto bg-[#111815]/70 p-4 backdrop-blur-sm">
    <div className="mx-auto my-8 max-w-4xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
      <div className="grid lg:grid-cols-[1fr_1.1fr]">
        <div className="bg-[#E1F5EE]">
          {getPhoto(profile) ? (
            <img src={getPhoto(profile)} alt={profile.pet_name} className="h-full min-h-[24rem] w-full object-cover" />
          ) : (
            <div className="flex min-h-[24rem] items-center justify-center text-xl font-black uppercase tracking-[0.18em] text-[#0F6E56]">Pet</div>
          )}
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#0F6E56]">{profile.pet_type}</p>
              <h2 className="mt-2 text-4xl font-black text-[#243129]">{profile.pet_name}</h2>
              <p className="mt-2 font-bold text-[#6C716A]">{profile.breed} - {t(`petMating.${profile.gender}`, { defaultValue: profile.gender })}</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-full bg-[#F7F5EE] px-4 py-2 text-xl font-black text-[#243129]" aria-label={t('common.close', { defaultValue: 'Close' })}>x</button>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Info label={t('petMating.fee', { defaultValue: 'Fee' })} value={formatFee(profile, t)} />
            <Info label={t('petMating.ageMonths', { defaultValue: 'Age in months' })} value={profile.age_months} />
            <Info label={t('petMating.city', { defaultValue: 'City' })} value={getLocation(profile)} />
            <Info label={t('petMating.experience', { defaultValue: 'Experience' })} value={profile.mating_experience} />
          </div>
          <p className="mt-6 whitespace-pre-line text-sm font-semibold leading-7 text-[#6C716A]">{profile.description || t('petMating.noDescription', { defaultValue: 'No description added.' })}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={onContact} className="rounded-2xl bg-[#0F6E56] px-5 py-3 font-black text-white">
              {t('petMating.callOwner', { defaultValue: 'Call owner' })}
            </button>
            <button type="button" onClick={onReport} className="rounded-2xl border border-[#E03131] px-5 py-3 font-black text-[#E03131]">
              {t('petMating.reportProfile', { defaultValue: 'Report profile' })}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const Info = ({ label, value }) => (
  <div className="rounded-2xl bg-[#F7F5EE] p-4">
    <p className="text-xs font-black uppercase tracking-[0.12em] text-[#6C716A]">{label}</p>
    <p className="mt-1 font-black text-[#243129]">{value || '-'}</p>
  </div>
);

export default PetMatingPage;
