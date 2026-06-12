import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  FaCalendarCheck,
  FaLocationDot,
  FaPhone,
  FaRegClock,
  FaStar,
  FaUserDoctor,
  FaWhatsapp,
} from 'react-icons/fa6';
import { MdClose } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import { veterinarianService, vetReviewService } from '../services/api';
import { resolveUserLocation } from '../utils/userLocation';
import { InlineLoader } from './AppLoader';

const API_URL = API_BASE_URL;
const SPECIALIZATION_OPTIONS = ['general', 'large_animal', 'small_animal', 'livestock', 'surgery', 'emergency', 'reproduction'];
const NEARBY_RADIUS_KM = 50;

const VeterinarianPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [veterinarians, setVeterinarians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [specializationFilter, setSpecializationFilter] = useState('');
  const [selectedVet, setSelectedVet] = useState(null);
  const [viewMode, setViewMode] = useState('nearby');
  const [selectedVetReviews, setSelectedVetReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    reviewText: '',
  });
  const hasUserToken = Boolean(localStorage.getItem('token'));

  const getSpecializationLabel = (key) => {
    const labels = {
      general: t('veterinarian.specializationGeneral'),
      large_animal: t('veterinarian.specializationLargeAnimal'),
      small_animal: t('veterinarian.specializationSmallAnimal'),
      livestock: t('veterinarian.specializationLivestock'),
      surgery: t('veterinarian.specializationSurgery'),
      emergency: t('veterinarian.specializationEmergency'),
      reproduction: t('veterinarian.specializationReproduction'),
    };
    return labels[key] || key;
  };

  const getVetServices = (vet) => {
    if (Array.isArray(vet?.services)) {
      return vet.services;
    }

    if (typeof vet?.services === 'string') {
      try {
        const parsed = JSON.parse(vet.services);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        // Ignore parse error and fall back to comma-separated parsing.
      }

      return vet.services.split(',').map((item) => item.trim()).filter(Boolean);
    }

    return [];
  };

  const formatDistance = (distance) => {
    if (distance == null || Number.isNaN(Number(distance))) {
      return null;
    }

    return `${parseFloat(distance).toFixed(1)} km`;
  };

  useEffect(() => {
    let isMounted = true;

    const loadUserLocation = async () => {
      const resolvedLocation = await resolveUserLocation();

      if (!isMounted) {
        return;
      }

      if (resolvedLocation) {
        setUserLocation(resolvedLocation);
        return;
      }

      setUserLocation(null);
      setViewMode('all');
    };

    loadUserLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const fetchVeterinarians = async () => {
      setLoading(true);
      setError(null);

      try {
        const fetchAllVerifiedVeterinarians = async () => {
          const allParams = new URLSearchParams({
            limit: '50',
          });

          if (specializationFilter) {
            allParams.append('specialization', specializationFilter);
          }

          const allResponse = await fetch(`${API_URL}/api/veterinarians?${allParams.toString()}`);
          const allData = await allResponse.json();

          if (!allData.success) {
            return [];
          }

          return allData.data?.veterinarians || [];
        };

        const fetchNearbyVeterinarians = async () => {
          if (!userLocation?.latitude || !userLocation?.longitude) {
            return [];
          }

          const params = new URLSearchParams({
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            radius: NEARBY_RADIUS_KM,
          });

          if (specializationFilter) {
            params.append('specialization', specializationFilter);
          }

          const response = await fetch(`${API_URL}/api/veterinarians/nearby?${params.toString()}`);
          const data = await response.json();

          if (!data.success) {
            return [];
          }

          return Array.isArray(data.data) ? data.data : [];
        };

        if (viewMode === 'all') {
          const allVeterinarians = await fetchAllVerifiedVeterinarians();
          setVeterinarians(allVeterinarians);
        } else {
          const nearbyVeterinarians = await fetchNearbyVeterinarians();
          setVeterinarians(nearbyVeterinarians);
        }
      } catch (err) {
        console.error('Error fetching veterinarians:', err);
        setError(t('veterinarian.error'));
      } finally {
        setLoading(false);
      }
    };

    fetchVeterinarians();
  }, [specializationFilter, t, userLocation, viewMode]);

  const filteredVets = veterinarians.filter((vet) =>
    vet.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vet.specialization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vet.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const trackVetInteraction = async (vetId, leadType, sourcePage) => {
    try {
      await veterinarianService.trackInteraction(vetId, { leadType, sourcePage });
    } catch (error) {
      console.error('Failed to track veterinarian interaction:', error);
    }
  };

  const openVetProfile = (vet, sourcePage = 'veterinarian-list') => {
    setSelectedVet(vet);
    void trackVetInteraction(vet.id, 'profile_view', sourcePage);
  };

  const handleCall = (vet, sourcePage = 'veterinarian-card') => {
    void trackVetInteraction(vet.id, 'call_click', sourcePage);
    window.location.href = `tel:${vet.phone_number}`;
  };

  const handleWhatsApp = (vet, sourcePage = 'veterinarian-card') => {
    void trackVetInteraction(vet.id, 'whatsapp_click', sourcePage);
    const cleanPhone = vet.phone_number.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Hello Dr. ${vet.full_name}, I found your profile on Animal E Bazar and would like to inquire about veterinary services for my animal. Can we discuss further?`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const loadSelectedVetReviewData = async (vetId) => {
    setReviewsLoading(true);

    try {
      const requests = [
        veterinarianService.getById(vetId),
        vetReviewService.getVetReviews(vetId, { limit: 5, sort: 'newest' }),
      ];

      if (hasUserToken) {
        requests.push(vetReviewService.getUserReview(vetId));
      }

      const [vetResponse, reviewsResponse, myReviewResponse] = await Promise.all(requests);
      const refreshedVet = vetResponse.data || null;
      const reviewItems = reviewsResponse.data?.reviews || [];
      const ownReview = myReviewResponse?.data || null;

      if (refreshedVet) {
        setSelectedVet((current) => (
          current?.id === vetId
            ? { ...current, ...refreshedVet }
            : current
        ));

        setVeterinarians((current) => current.map((item) => (
          item.id === vetId
            ? { ...item, ...refreshedVet, distance: item.distance ?? refreshedVet.distance }
            : item
        )));
      }

      setSelectedVetReviews(reviewItems);
      setUserReview(ownReview);
      setReviewForm({
        rating: ownReview?.rating || 5,
        reviewText: ownReview?.review_text || '',
      });
    } catch (error) {
      console.error('Failed to load veterinarian reviews:', error);
      toast.error(t('veterinarian.reviewLoadFailed', 'Failed to load reviews'));
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedVet?.id) {
      setSelectedVetReviews([]);
      setUserReview(null);
      setReviewForm({ rating: 5, reviewText: '' });
      return;
    }

    loadSelectedVetReviewData(selectedVet.id);
  }, [selectedVet?.id, hasUserToken]);

  const handleReviewSubmit = async () => {
    if (!selectedVet?.id) {
      return;
    }

    if (!hasUserToken) {
      toast.error(t('veterinarian.loginToReview', 'Please login to submit a review'));
      navigate('/login');
      return;
    }

    setReviewSubmitting(true);

    try {
      const payload = {
        veterinarian_id: selectedVet.id,
        rating: reviewForm.rating,
        review_text: reviewForm.reviewText.trim(),
      };

      if (userReview?.id) {
        await vetReviewService.updateReview(userReview.id, payload);
        toast.success(t('veterinarian.reviewUpdated', 'Review updated successfully'));
      } else {
        await vetReviewService.createReview(payload);
        toast.success(t('veterinarian.reviewSubmitted', 'Review submitted successfully'));
      }

      await loadSelectedVetReviewData(selectedVet.id);
    } catch (error) {
      console.error('Failed to submit veterinarian review:', error);
      toast.error(error.message || t('veterinarian.reviewSubmitFailed', 'Failed to submit review'));
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleReviewDelete = async () => {
    if (!userReview?.id) {
      return;
    }

    setReviewSubmitting(true);

    try {
      await vetReviewService.deleteReview(userReview.id);
      toast.success(t('veterinarian.reviewDeleted', 'Review deleted successfully'));
      await loadSelectedVetReviewData(selectedVet.id);
    } catch (error) {
      console.error('Failed to delete veterinarian review:', error);
      toast.error(error.message || t('veterinarian.reviewDeleteFailed', 'Failed to delete review'));
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#edf6ef_0%,#f7faf8_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="mb-12">
          <div className="mb-8 rounded-[28px] border border-emerald-100 bg-white/90 p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#000600] sm:text-3xl">
                  {viewMode === 'nearby' ? t('veterinarian.nearbyVets') : t('veterinarian.allVerifiedVets')}
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  {viewMode === 'nearby'
                    ? t('veterinarian.farmerLocationHint', { radius: NEARBY_RADIUS_KM })
                    : t('veterinarian.allVerifiedHint')}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-sm text-slate-500">
                  {viewMode === 'nearby' ? t('veterinarian.showNearby') : t('veterinarian.showAllVets')}
                </p>
                <p className="text-base font-semibold text-slate-900">{filteredVets.length} {t('veterinarian.profilesFound')}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="relative">
                <input
                  type="text"
                  placeholder={t('veterinarian.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pl-11 text-sm text-slate-700 outline-none transition focus:border-[#15BB73] focus:ring-4 focus:ring-[#15BB73]/10"
                />
                <svg className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <div className="inline-flex w-full rounded-2xl bg-slate-100 p-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => setViewMode('nearby')}
                  className={`flex-1 rounded-[14px] px-4 py-3 text-sm font-semibold transition ${
                    viewMode === 'nearby'
                      ? 'bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t('veterinarian.showNearby')}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('all')}
                  className={`flex-1 rounded-[14px] px-4 py-3 text-sm font-semibold transition ${
                    viewMode === 'all'
                      ? 'bg-gradient-to-r from-[#15BB73] to-[#0FA568] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t('veterinarian.showAllVets')}
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-14">
              <InlineLoader message={t('common.loading')} size="medium" />
            </div>
          ) : error ? (
            <div className="rounded-[28px] bg-white p-10 text-center shadow-sm">
              <p className="text-red-500">{error}</p>
            </div>
          ) : filteredVets.length === 0 ? (
            <div className="rounded-[28px] bg-white p-12 text-center shadow-sm">
              <FaUserDoctor className="mx-auto mb-4 text-5xl text-slate-300" />
              <h3 className="text-xl font-semibold text-slate-700">{t('veterinarian.noVetsFound')}</h3>
              <p className="mt-2 text-slate-500">{t('veterinarian.noVetsMessage')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredVets.map((vet) => {
                const servicesOffered = getVetServices(vet);
                const distance = formatDistance(vet.distance);

                return (
                  <div
                    key={vet.id}
                    onClick={() => openVetProfile(vet)}
                    className="group cursor-pointer rounded-[30px] border border-white/20 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_90px_rgba(15,23,42,0.12)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-4">
                        {vet.profile_photo ? (
                          <img
                            src={vet.profile_photo}
                            alt={vet.full_name}
                            className="h-16 w-16 rounded-[20px] border border-[#15BB73]/15 object-cover"
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#15BB73]/10 text-2xl font-black text-[#15BB73]">
                            {vet.full_name?.charAt(0) || 'D'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="truncate text-xl font-black text-[#000600]">{vet.full_name}</h3>
                          <p className="truncate text-sm text-slate-600">{getSpecializationLabel(vet.specialization) || vet.specialization}</p>
                        </div>
                      </div>

                      <span className="rounded-full bg-[#15BB73]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#15BB73]">
                        {t('veterinarian.viewProfile')}
                      </span>
                    </div>

                    <div className="mt-5 rounded-[24px] bg-[#15BB73]/8 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15BB73]">{t('veterinarian.profileSummary')}</p>
                      <p className="mt-1 text-sm text-slate-600">{t('veterinarian.tapForDetails')}</p>
                    </div>

                    <div className="mt-5 space-y-3">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <FaStar className="text-yellow-500" />
                        <span>{vet.rating || '0'} ({vet.total_reviews || 0} {t('veterinarian.reviews')})</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <FaLocationDot className="text-slate-400" />
                        <span>{[vet.city, vet.state].filter(Boolean).join(', ')}{distance ? ` (${distance})` : ''}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <FaRegClock className="text-slate-400" />
                        <span>{vet.experience_years || 0}+ {t('veterinarian.yearsExperience')}</span>
                      </div>
                      {vet.consultation_fee && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <FaCalendarCheck className="text-slate-400" />
                          <span>₹{vet.consultation_fee} {t('veterinarian.consultation')}</span>
                        </div>
                      )}
                      {vet.clinic_name && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <FaUserDoctor className="text-slate-400" />
                          <span className="truncate">{vet.clinic_name}</span>
                        </div>
                      )}
                    </div>

                    {servicesOffered.length > 0 && (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {servicesOffered.slice(0, 3).map((service, index) => (
                          <span key={`${service}-${index}`} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                            {service}
                          </span>
                        ))}
                        {servicesOffered.length > 3 && (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                            +{servicesOffered.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-5 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-sm font-semibold ${
                        vet.emergency_available ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {vet.emergency_available ? t('veterinarian.emergencyAvailable') : t('veterinarian.available')}
                      </span>
                    </div>

                    <div className="mt-5 flex gap-2">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          handleCall(vet, 'veterinarian-card');
                        }}
                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#15BB73] to-[#0FA568] px-4 py-3 font-semibold text-white transition hover:shadow-lg"
                      >
                        <FaPhone className="text-sm" />
                        {t('veterinarian.call')}
                      </button>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          handleWhatsApp(vet, 'veterinarian-card');
                        }}
                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-green-500 px-4 py-3 font-semibold text-white transition hover:bg-green-600"
                      >
                        <FaWhatsapp />
                        {t('veterinarian.consult')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

       
      </div>

      {selectedVet && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 p-4 backdrop-blur-sm sm:p-6" onClick={() => setSelectedVet(null)}>
          <div
            className="mx-auto max-h-[92vh] max-w-5xl overflow-y-auto rounded-[30px] bg-white shadow-[0_30px_120px_rgba(15,23,42,0.28)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#15BB73]">{t('veterinarian.detailedProfile')}</p>
                <h3 className="mt-1 text-2xl font-black text-slate-900">{selectedVet.full_name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVet(null)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              >
                <MdClose className="text-xl" />
              </button>
            </div>

            <div className="p-5 sm:p-6">
              <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
                <div className="space-y-6">
                  <div className="rounded-[28px] bg-gradient-to-br from-[#eafaf2] via-white to-[#edf9f1] p-5">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                      {selectedVet.profile_photo ? (
                        <img
                          src={selectedVet.profile_photo}
                          alt={selectedVet.full_name}
                          className="h-28 w-28 rounded-[24px] border border-[#15BB73]/15 object-cover shadow-sm"
                        />
                      ) : (
                        <div className="flex h-28 w-28 items-center justify-center rounded-[24px] bg-[#15BB73]/12 text-4xl font-black text-[#15BB73]">
                          {selectedVet.full_name?.charAt(0) || 'D'}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h4 className="text-2xl font-black text-slate-900">{selectedVet.full_name}</h4>
                          <span className="rounded-full bg-[#15BB73]/12 px-3 py-1 text-sm font-semibold text-[#15BB73]">
                            {getSpecializationLabel(selectedVet.specialization) || selectedVet.specialization}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl bg-white p-3 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{t('veterinarian.experience')}</p>
                            <p className="mt-1 text-lg font-bold text-slate-900">{selectedVet.experience_years || 0}+ {t('veterinarian.yearsExperience')}</p>
                          </div>
                          <div className="rounded-2xl bg-white p-3 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{t('veterinarian.rating')}</p>
                            <p className="mt-1 text-lg font-bold text-slate-900">
                              {selectedVet.rating || '0.0'} <span className="text-sm font-medium text-slate-500">({selectedVet.total_reviews || 0} {t('veterinarian.reviews')})</span>
                            </p>
                          </div>
                          <div className="rounded-2xl bg-white p-3 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{t('vetRegistration.consultationFee')}</p>
                            <p className="mt-1 text-lg font-bold text-slate-900">
                              {selectedVet.consultation_fee ? `₹${selectedVet.consultation_fee}` : t('veterinarian.available')}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-white p-3 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{t('home.distance')}</p>
                            <p className="mt-1 text-lg font-bold text-slate-900">
                              {formatDistance(selectedVet.distance) || [selectedVet.city, selectedVet.state].filter(Boolean).join(', ') || '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5">
                    <h5 className="text-lg font-black text-slate-900">{t('veterinarian.professionalDetails')}</h5>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-500">{t('veterinarian.specialization')}</p>
                        <p className="mt-1 text-base text-slate-900">{getSpecializationLabel(selectedVet.specialization) || selectedVet.specialization}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-500">{t('vetRegistration.qualification')}</p>
                        <p className="mt-1 text-base text-slate-900">{selectedVet.qualification || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-500">{t('veterinarian.contactNumber')}</p>
                        <p className="mt-1 text-base text-slate-900">{selectedVet.phone_number}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-500">{t('veterinarian.availability')}</p>
                        <p className="mt-1 text-base text-slate-900">
                          {selectedVet.emergency_available ? t('veterinarian.emergencyAvailable') : t('veterinarian.available')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                    <h5 className="text-lg font-black text-slate-900">{t('veterinarian.clinicDetails')}</h5>
                    <div className="mt-4 space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-500">{t('vetRegistration.clinicName')}</p>
                        <p className="mt-1 text-base text-slate-900">{selectedVet.clinic_name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-500">{t('veterinarian.clinicAddress')}</p>
                        <p className="mt-1 text-base text-slate-900">{selectedVet.clinic_address || selectedVet.address || t('veterinarian.noClinicAddress')}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-500">{t('home.location')}</p>
                        <p className="mt-1 text-base text-slate-900">{[selectedVet.city, selectedVet.state, selectedVet.country].filter(Boolean).join(', ') || '-'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                    <h5 className="text-lg font-black text-slate-900">{t('vetRegistration.servicesOffered')}</h5>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {getVetServices(selectedVet).length > 0 ? (
                        getVetServices(selectedVet).map((service, index) => (
                          <span key={`${service}-${index}`} className="rounded-full bg-[#15BB73]/10 px-3 py-2 text-sm font-medium text-[#0f8d56]">
                            {service}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">{t('veterinarian.noServicesListed')}</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h5 className="text-lg font-black text-slate-900">{t('veterinarian.latestReviews', 'Latest Reviews')}</h5>
                        <p className="mt-1 text-sm text-slate-500">
                          {t('veterinarian.rating')}: {selectedVet.rating || '0.0'} ({selectedVet.total_reviews || 0} {t('veterinarian.reviews')})
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1 text-yellow-500">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FaStar key={star} className={star <= Math.round(Number(selectedVet.rating || 0)) ? 'opacity-100' : 'opacity-20'} />
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h6 className="text-sm font-semibold text-slate-900">
                          {userReview ? t('veterinarian.updateReview', 'Update Your Review') : t('veterinarian.writeReview', 'Write a Review')}
                        </h6>
                        {!hasUserToken && (
                          <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="text-sm font-semibold text-[#15BB73] hover:text-[#0FA568]"
                          >
                            {t('common.login', 'Login')}
                          </button>
                        )}
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewForm((current) => ({ ...current, rating: star }))}
                            className="rounded-full p-1 transition hover:scale-110"
                            disabled={reviewSubmitting || !hasUserToken}
                          >
                            <FaStar className={`text-xl ${star <= reviewForm.rating ? 'text-yellow-500' : 'text-slate-300'}`} />
                          </button>
                        ))}
                      </div>

                      <textarea
                        value={reviewForm.reviewText}
                        onChange={(event) => setReviewForm((current) => ({ ...current, reviewText: event.target.value }))}
                        placeholder={t('veterinarian.reviewPlaceholder', 'Share your experience with this veterinarian')}
                        rows={4}
                        disabled={reviewSubmitting || !hasUserToken}
                        className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#15BB73] focus:ring-4 focus:ring-[#15BB73]/15 disabled:cursor-not-allowed disabled:bg-slate-100"
                      />

                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={handleReviewSubmit}
                          disabled={reviewSubmitting || !hasUserToken}
                          className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#15BB73] to-[#0FA568] px-5 py-3 text-sm font-semibold text-white transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {reviewSubmitting
                            ? t('common.loading', 'Loading...')
                            : userReview
                              ? t('veterinarian.updateReview', 'Update Your Review')
                              : t('veterinarian.submitReview', 'Submit Review')}
                        </button>

                        {userReview && (
                          <button
                            type="button"
                            onClick={handleReviewDelete}
                            disabled={reviewSubmitting}
                            className="inline-flex items-center justify-center rounded-2xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {t('veterinarian.deleteReview', 'Delete Review')}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      {reviewsLoading ? (
                        <p className="text-sm text-slate-500">{t('common.loading', 'Loading...')}</p>
                      ) : selectedVetReviews.length > 0 ? (
                        selectedVetReviews.map((review) => (
                          <div key={review.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="font-semibold text-slate-900">{review.user?.full_name || t('veterinarian.farmer', 'Farmer')}</p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {review.createdAt
                                    ? new Intl.DateTimeFormat(
                                      { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' }[i18n.language] || 'en-IN',
                                      { day: 'numeric', month: 'short', year: 'numeric' }
                                    ).format(new Date(review.createdAt))
                                    : ''}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 text-yellow-500">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <FaStar key={star} className={star <= review.rating ? 'opacity-100' : 'opacity-20'} />
                                ))}
                              </div>
                            </div>

                            {review.review_text && (
                              <p className="mt-3 text-sm leading-6 text-slate-600">{review.review_text}</p>
                            )}

                            {review.vet_response && (
                              <div className="mt-3 rounded-2xl bg-white px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{t('veterinarian.vetResponse', 'Veterinarian Response')}</p>
                                <p className="mt-2 text-sm text-slate-700">{review.vet_response}</p>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">{t('veterinarian.noReviewsYet', 'No reviews yet')}</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[28px] bg-[#0f2b17] p-5 text-white shadow-[0_25px_80px_rgba(15,43,23,0.24)]">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">{t('veterinarian.contactVet')}</p>
                    <h5 className="mt-2 text-2xl font-black">{selectedVet.full_name}</h5>
                    <p className="mt-2 text-sm leading-7 text-emerald-50/80">{t('veterinarian.tapForDetails')}</p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <button
                        onClick={() => handleCall(selectedVet, 'veterinarian-modal')}
                        className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#0f2b17] transition hover:bg-slate-100"
                      >
                        {t('veterinarian.call')}
                      </button>
                      <button
                        onClick={() => handleWhatsApp(selectedVet, 'veterinarian-modal')}
                        className="inline-flex items-center justify-center rounded-2xl bg-green-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-600"
                      >
                        {t('veterinarian.consult')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VeterinarianPage;
