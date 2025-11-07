import React, { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const BuffaloListingForm = () => {
  const [formData, setFormData] = useState({
    breedName: '',
    age: '',
    milkCapacity: '',
    pregnancyStatus: 'unknown',
    hasHorns: true,
    healthCondition: 'good',
    expectedPrice: '',
    isNegotiable: true,
    vaccinationDetails: '',
    deliveryAvailable: false,
    additionalNotes: '',
    city: '',
    state: '',
    pincode: ''
  });

  const [files, setFiles] = useState({
    frontPhoto: null,
    sidePhoto: null,
    milkScenePhoto: null,
    video: null
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles[0]) {
      setFiles(prev => ({
        ...prev,
        [name]: selectedFiles[0]
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Create FormData object to send files
      const formDataToSend = new FormData();

      // Append all form fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Append files
      Object.keys(files).forEach(key => {
        if (files[key]) {
          formDataToSend.append(key, files[key]);
        }
      });

      // Get token from localStorage
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('Please login to create a listing');
      }

      // Send POST request
      const response = await axios.post(
        `${API_URL}/api/buffalos/listings`,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setSuccess(true);
        // Reset form
        setFormData({
          breedName: '',
          age: '',
          milkCapacity: '',
          pregnancyStatus: 'unknown',
          hasHorns: true,
          healthCondition: 'good',
          expectedPrice: '',
          isNegotiable: true,
          vaccinationDetails: '',
          deliveryAvailable: false,
          additionalNotes: '',
          city: '',
          state: '',
          pincode: ''
        });
        setFiles({
          frontPhoto: null,
          sidePhoto: null,
          milkScenePhoto: null,
          video: null
        });

        // Show success message
        alert('Buffalo listing created successfully!');
      }
    } catch (err) {
      console.error('Error creating listing:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create listing');
      alert(`Error: ${err.response?.data?.message || err.message || 'Failed to create listing'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="listing-form" onSubmit={handleSubmit}>
      <h2 className="form-title">Buffalo Listing Form / म्हशीची यादी</h2>

      {/* Success Message */}
      {success && (
        <div className="alert alert-success">
          Buffalo listing created successfully!
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Section 1: Buffalo Details */}
      <div className="form-section">
        <h3 className="section-title">
          <span className="section-number">1</span>
          Buffalo Details / म्हशीची माहिती
        </h3>

        <div className="form-row">
          <div className="form-group">
            <label>
              Breed Name <span className="required">*</span>
              <span className="marathi">जातीचे नाव</span>
            </label>
            <input
              type="text"
              name="breedName"
              value={formData.breedName}
              onChange={handleChange}
              placeholder="e.g., Murrah, Mehsana, Jaffarabadi"
              required
            />
          </div>

          <div className="form-group">
            <label>
              Age <span className="required">*</span>
              <span className="marathi">वय (महिन्यात किंवा वर्षांमध्ये)</span>
            </label>
            <input
              type="text"
              name="age"
              value={formData.age}
              onChange={handleChange}
              placeholder="e.g., 3 years or 36 months"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>
              Milk Capacity (liters/day) <span className="required">*</span>
              <span className="marathi">दूध क्षमता (लीटर/दिवस)</span>
            </label>
            <input
              type="number"
              name="milkCapacity"
              value={formData.milkCapacity}
              onChange={handleChange}
              placeholder="e.g., 12"
              step="0.01"
              min="0"
              max="100"
              required
            />
          </div>

          <div className="form-group">
            <label>
              Pregnancy Status <span className="required">*</span>
              <span className="marathi">गर्भधारणा स्थिती</span>
            </label>
            <select
              name="pregnancyStatus"
              value={formData.pregnancyStatus}
              onChange={handleChange}
              required
            >
              <option value="pregnant">Pregnant / गर्भवती</option>
              <option value="not_pregnant">Not Pregnant / गर्भवती नाही</option>
              <option value="recently_delivered">Recently Delivered / नुकतेच प्रसूत</option>
              <option value="unknown">Unknown / माहीत नाही</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 2: Physical Details */}
      <div className="form-section">
        <h3 className="section-title">
          <span className="section-number">2</span>
          Physical Details / शारीरिक माहिती
        </h3>

        <div className="form-row">
          <div className="form-group">
            <label>Has Horns? <span className="marathi">शिंगे आहेत का?</span></label>
            <div className="radio-group">
              <div className="radio-option">
                <input
                  type="radio"
                  id="buffalo-horns-yes"
                  name="hasHorns"
                  checked={formData.hasHorns === true}
                  onChange={() => setFormData(prev => ({ ...prev, hasHorns: true }))}
                />
                <label htmlFor="buffalo-horns-yes">Yes / होय</label>
              </div>
              <div className="radio-option">
                <input
                  type="radio"
                  id="buffalo-horns-no"
                  name="hasHorns"
                  checked={formData.hasHorns === false}
                  onChange={() => setFormData(prev => ({ ...prev, hasHorns: false }))}
                />
                <label htmlFor="buffalo-horns-no">No / नाही</label>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>
              Health Condition <span className="required">*</span>
              <span className="marathi">आरोग्य स्थिती</span>
            </label>
            <select
              name="healthCondition"
              value={formData.healthCondition}
              onChange={handleChange}
              required
            >
              <option value="excellent">Excellent / उत्कृष्ट</option>
              <option value="good">Good / चांगली</option>
              <option value="average">Average / सरासरी</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 3: Photos & Videos */}
      <div className="form-section">
        <h3 className="section-title">
          <span className="section-number">3</span>
          Photos & Videos / छायाचित्रे आणि व्हिडिओ
        </h3>

        <div className="form-row">
          <div className="form-group">
            <label>Front Photo <span className="marathi">समोरचा फोटो</span></label>
            <div className="file-input-wrapper">
              <input
                type="file"
                id="buffalo-frontPhoto"
                name="frontPhoto"
                accept="image/*"
                onChange={handleFileChange}
              />
              <label htmlFor="buffalo-frontPhoto" className="file-input-label">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {files.frontPhoto ? files.frontPhoto.name : 'Choose Front Photo'}
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Side Photo <span className="marathi">बाजूचा फोटो</span></label>
            <div className="file-input-wrapper">
              <input
                type="file"
                id="buffalo-sidePhoto"
                name="sidePhoto"
                accept="image/*"
                onChange={handleFileChange}
              />
              <label htmlFor="buffalo-sidePhoto" className="file-input-label">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {files.sidePhoto ? files.sidePhoto.name : 'Choose Side Photo'}
              </label>
            </div>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Milk Scene Photo <span className="marathi">दूध दृश्य फोटो</span></label>
            <div className="file-input-wrapper">
              <input
                type="file"
                id="buffalo-milkScenePhoto"
                name="milkScenePhoto"
                accept="image/*"
                onChange={handleFileChange}
              />
              <label htmlFor="buffalo-milkScenePhoto" className="file-input-label">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {files.milkScenePhoto ? files.milkScenePhoto.name : 'Choose Milk Scene Photo'}
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Video <span className="marathi">व्हिडिओ</span></label>
            <div className="file-input-wrapper">
              <input
                type="file"
                id="buffalo-video"
                name="video"
                accept="video/*"
                onChange={handleFileChange}
              />
              <label htmlFor="buffalo-video" className="file-input-label">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {files.video ? files.video.name : 'Choose Video'}
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Price & Negotiation */}
      <div className="form-section">
        <h3 className="section-title">
          <span className="section-number">4</span>
          Price & Negotiation / किंमत आणि चर्चा
        </h3>

        <div className="form-row">
          <div className="form-group">
            <label>
              Expected Price (₹) <span className="required">*</span>
              <span className="marathi">अपेक्षित किंमत</span>
            </label>
            <input
              type="number"
              name="expectedPrice"
              value={formData.expectedPrice}
              onChange={handleChange}
              placeholder="e.g., 80000"
              min="0"
              step="100"
              required
            />
          </div>

          <div className="form-group">
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="buffalo-isNegotiable"
                name="isNegotiable"
                checked={formData.isNegotiable}
                onChange={handleChange}
              />
              <label htmlFor="buffalo-isNegotiable">
                Price is Negotiable / किंमत चर्चेच्या अधीन आहे
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Section 5: Additional Information */}
      <div className="form-section">
        <h3 className="section-title">
          <span className="section-number">5</span>
          Additional Information / अतिरिक्त माहिती
        </h3>

        <div className="form-group">
          <label>
            Vaccination Details
            <span className="marathi">लसीकरण तपशील</span>
          </label>
          <textarea
            name="vaccinationDetails"
            value={formData.vaccinationDetails}
            onChange={handleChange}
            placeholder="Enter vaccination history..."
            rows="3"
          />
        </div>

        <div className="form-group">
          <label>
            Additional Notes
            <span className="marathi">अतिरिक्त टिप्पण्या</span>
          </label>
          <textarea
            name="additionalNotes"
            value={formData.additionalNotes}
            onChange={handleChange}
            placeholder="Any other important information..."
            rows="3"
          />
        </div>

        <div className="form-group">
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="buffalo-deliveryAvailable"
              name="deliveryAvailable"
              checked={formData.deliveryAvailable}
              onChange={handleChange}
            />
            <label htmlFor="buffalo-deliveryAvailable">
              Delivery Available / वितरण उपलब्ध
            </label>
          </div>
        </div>
      </div>

      {/* Section 6: Location */}
      <div className="form-section">
        <h3 className="section-title">
          <span className="section-number">6</span>
          Location / स्थान
        </h3>

        <div className="form-row">
          <div className="form-group">
            <label>City <span className="marathi">शहर</span></label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Enter city"
            />
          </div>

          <div className="form-group">
            <label>State <span className="marathi">राज्य</span></label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              placeholder="Enter state"
            />
          </div>

          <div className="form-group">
            <label>Pincode <span className="marathi">पिनकोड</span></label>
            <input
              type="text"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              placeholder="Enter pincode"
              pattern="[0-9]{6}"
            />
          </div>
        </div>
      </div>

      <button type="submit" className="submit-button" disabled={loading}>
        {loading ? 'Submitting... / सबमिट करत आहे...' : 'Submit Buffalo Listing / म्हशी यादी सबमिट करा'}
      </button>
    </form>
  );
};

export default BuffaloListingForm;
