import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';
import { FormAlert } from './common';
import { localizeApiMessage } from '../utils/localizeApiMessage';
import './AnimalListingPage.css';

const API_URL = API_BASE_URL;

const buildPregnancyNote = (isPregnant, months, t) => {
  if (!isPregnant) return '';
  return `${t('animal.pregnant', 'Pregnant')}: ${t('common.yes', 'Yes')}; ${t('pregnancy.months', 'Months')}: ${months}`;
};

const SimpleAnimalListingForm = ({
  endpoint,
  breedOptions,
  photoField = 'photo1',
  genderField,
  showGender = false,
  pregnancyMode = 'none',
  defaults = {}
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    breedName: '',
    expectedPrice: '',
    gender: 'female',
    pregnancyStatus: 'not_pregnant',
    pregnancyMonths: ''
  });
  const [files, setFiles] = useState({ photo: null, video: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const canShowBreed = Boolean(files.photo);
  const canShowPrice = canShowBreed && Boolean(formData.breedName);
  const canShowExtra = canShowPrice && Boolean(formData.expectedPrice);
  const shouldAskPregnancy = pregnancyMode === 'always' || (pregnancyMode === 'femaleOnly' && formData.gender === 'female');
  const isPregnant = formData.pregnancyStatus === 'pregnant';

  const genderOptions = useMemo(() => [
    { value: 'male', label: t('animal.male', 'Male') },
    { value: 'female', label: t('animal.female', 'Female') }
  ], [t]);

  const pregnancyOptions = useMemo(() => [
    { value: 'pregnant', label: t('common.yes', 'Yes') },
    { value: 'not_pregnant', label: t('common.no', 'No') }
  ], [t]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'gender' && value === 'male' ? { pregnancyStatus: 'not_pregnant', pregnancyMonths: '' } : {}),
      ...(name === 'pregnancyStatus' && value !== 'pregnant' ? { pregnancyMonths: '' } : {})
    }));
  };

  const handleFileChange = (name, event) => {
    const selectedFile = event.target.files?.[0] || null;
    setFiles((prev) => ({ ...prev, [name]: selectedFile }));
  };

  const validateForm = () => {
    if (!files.photo) return t('listing.photoRequired', 'Please upload at least one photo');
    if (!formData.breedName) return t('animal.breedNameRequired', 'Breed name is required');
    if (!formData.expectedPrice) return t('animal.priceRequired', 'Expected price is required');
    if (shouldAskPregnancy && isPregnant && !formData.pregnancyMonths) {
      return t('pregnancy.monthsRequired', 'Please enter pregnancy months');
    }
    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationMessage = validateForm();
    if (validationMessage) {
      setError(validationMessage);
      toast.error(validationMessage);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error(t('auth.loginToContinue', 'Please login to continue'));
      }

      const payload = new FormData();
      const pregnancyNote = buildPregnancyNote(isPregnant, formData.pregnancyMonths, t);
      const mergedFields = {
        ...defaults,
        breedName: formData.breedName,
        expectedPrice: formData.expectedPrice,
        ...(genderField ? { [genderField]: formData.gender } : {}),
        ...(pregnancyMode !== 'none' ? { pregnancyStatus: formData.pregnancyStatus } : {}),
        ...(pregnancyNote && (defaults.additionalNotes !== undefined)
          ? { additionalNotes: pregnancyNote }
          : {}),
        ...(pregnancyNote && (defaults.description !== undefined)
          ? { description: pregnancyNote }
          : {})
      };

      Object.entries(mergedFields).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          payload.append(key, value);
        }
      });
      payload.append(photoField, files.photo);
      if (files.video) payload.append('video', files.video);

      const response = await axios.post(`${API_URL}${endpoint}`, payload, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setSuccess(true);
        toast.success(t('listing.createSuccess', 'Listing created successfully'));
        navigate('/buy-animals');
      }
    } catch (err) {
      const nextMessage = localizeApiMessage(
        i18n,
        t,
        err.response?.data?.message || err.message,
        'listing.createError',
        'Failed to create listing'
      );
      setError(nextMessage);
      toast.error(nextMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="simple-listing-form" onSubmit={handleSubmit}>
      <FormAlert type="success" message={success ? t('listing.createSuccess', 'Listing created successfully') : null} />
      <FormAlert type="error" message={error} />

      <CompactSection number="1" title={t('listing.media', 'Photos & Video')} helper={t('listing.photoFirstHint', 'Photo is compulsory. Video is optional.')}>
        <div className="simple-media-grid">
          <CompactFileInput
            id="animalPhoto"
            label={t('listing.photoRequiredLabel', 'Animal photo')}
            accept="image/*"
            file={files.photo}
            onChange={(event) => handleFileChange('photo', event)}
            required
            emptyText={t('formLabels.chooseFile', 'Choose file')}
          />
          <CompactFileInput
            id="animalVideo"
            label={t('listing.videoOptionalLabel', 'Video optional')}
            accept="video/*"
            file={files.video}
            onChange={(event) => handleFileChange('video', event)}
            icon="video"
            emptyText={t('formLabels.chooseFile', 'Choose file')}
          />
        </div>
      </CompactSection>

      {canShowBreed && (
        <CompactSection number="2" title={t('sellAnimal.breed', 'Breed')}>
          <CompactSelect
            label={t('sellAnimal.breed', 'Breed')}
            name="breedName"
            value={formData.breedName}
            onChange={handleChange}
            options={breedOptions}
            required
          />
        </CompactSection>
      )}

      {canShowPrice && (
        <CompactSection number="3" title={t('sellAnimal.price', 'Price')}>
          <CompactInput
            label={t('sellAnimal.price', 'Price')}
            name="expectedPrice"
            type="number"
            value={formData.expectedPrice}
            onChange={handleChange}
            placeholder={t('sellAnimal.price', 'Price')}
            min="0"
            required
          />
        </CompactSection>
      )}

      {canShowExtra && (showGender || pregnancyMode !== 'none') && (
        <CompactSection number="4" title={t('listing.quickDetails', 'Quick details')}>
          {showGender && (
            <CompactRadioGroup
              label={t('animal.gender', 'Gender')}
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              options={genderOptions}
            />
          )}

          {shouldAskPregnancy && (
            <>
              <CompactRadioGroup
                label={t('animal.pregnancyStatus', 'Pregnant?')}
                name="pregnancyStatus"
                value={formData.pregnancyStatus}
                onChange={handleChange}
                options={pregnancyOptions}
              />
              {isPregnant && (
                <CompactInput
                  label={t('pregnancy.months', 'How many months?')}
                  name="pregnancyMonths"
                  type="number"
                  value={formData.pregnancyMonths}
                  onChange={handleChange}
                  min="1"
                  max="12"
                  required
                />
              )}
            </>
          )}
        </CompactSection>
      )}

      {canShowExtra && (
        <button type="submit" className="simple-submit-button" disabled={loading}>
          {loading ? t('common.submitting', 'Submitting...') : t('listing.createListing', 'Create Listing')}
        </button>
      )}
    </form>
  );
};

const CompactSection = ({ number, title, helper, children }) => (
  <section className="simple-form-section">
    <div className="simple-section-head">
      <span className="simple-step-badge">{number}</span>
      <div>
        <h3>{title}</h3>
        {helper ? <p>{helper}</p> : null}
      </div>
    </div>
    <div className="simple-section-body">{children}</div>
  </section>
);

const CompactFileInput = ({ id, label, accept, file, onChange, required, icon = 'image', emptyText = 'Choose file' }) => (
  <div className={`simple-file-tile ${file ? 'is-selected' : ''}`}>
    <input id={id} type="file" accept={accept} onChange={onChange} className="simple-file-input" />
    <label htmlFor={id}>
      <span className="simple-file-icon" aria-hidden="true">
        {file ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        ) : icon === 'video' ? (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M15 10.5V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-3.5l4 4v-11l-4 4z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
        )}
      </span>
      <span className="simple-file-label">
        {label} {required ? <strong>*</strong> : null}
      </span>
      <span className="simple-file-name">{file ? file.name : emptyText}</span>
    </label>
  </div>
);

const CompactSelect = ({ label, name, value, onChange, options, required }) => (
  <label className="simple-field">
    <span>{label} {required ? <strong>*</strong> : null}</span>
    <select name={name} value={value} onChange={onChange} required={required}>
      {options.map((option) => (
        <option key={`${name}-${option.value}`} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

const CompactInput = ({ label, name, value, onChange, required, ...props }) => (
  <label className="simple-field">
    <span>{label} {required ? <strong>*</strong> : null}</span>
    <input name={name} value={value} onChange={onChange} required={required} {...props} />
  </label>
);

const CompactRadioGroup = ({ label, name, value, onChange, options }) => (
  <div className="simple-field">
    <span>{label}</span>
    <div className="simple-pill-row">
      {options.map((option) => {
        const selected = String(value) === String(option.value);
        return (
          <label key={`${name}-${option.value}`} className={`simple-pill ${selected ? 'is-active' : ''}`}>
            <input type="radio" name={name} value={option.value} checked={selected} onChange={onChange} />
            {option.label}
          </label>
        );
      })}
    </div>
  </div>
);

export default SimpleAnimalListingForm;
