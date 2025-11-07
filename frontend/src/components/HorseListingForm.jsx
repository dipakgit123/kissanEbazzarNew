import React, { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const HorseListingForm = () => {
  const [formData, setFormData] = useState({
    gender: 'male',
    breedName: '',
    age: '',
    color: '',
    height: '',
    weight: '',
    healthCondition: 'good',
    trained: 'yes',
    purpose: 'riding',
    vaccinationDetails: '',
    description: '',
    expectedPrice: '',
    isNegotiable: true,
    deliveryAvailable: false,
    city: '',
    state: '',
    pincode: ''
  });

  const [files, setFiles] = useState({
    frontPhoto: null,
    sidePhoto: null,
    fullBodyPhoto: null,
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
        `${API_URL}/api/horses/listings`,
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
          gender: 'male',
          breedName: '',
          age: '',
          color: '',
          height: '',
          weight: '',
          healthCondition: 'good',
          trained: 'yes',
          purpose: 'riding',
          vaccinationDetails: '',
          description: '',
          expectedPrice: '',
          isNegotiable: true,
          deliveryAvailable: false,
          city: '',
          state: '',
          pincode: ''
        });
        setFiles({
          frontPhoto: null,
          sidePhoto: null,
          fullBodyPhoto: null,
          video: null
        });

        // Show success message
        alert('Horse listing created successfully!');
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
      <h2 className="form-title">Horse Listing Form / घोडा यादी</h2>

      {/* Success Message */}
      {success && (
        <div className="alert alert-success">
          Horse listing created successfully!
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Section 1: Horse Details */}
      <div className="form-section">
        <h3 className="section-title">
          <span className="section-number">1</span>
          Horse Details / घोड्याची माहिती
        </h3>

        <div className="form-row">
          <div className="form-group">
            <label>
              Gender <span className="required">*</span>
              <span className="marathi">लिंग (नर / मादी)</span>
            </label>
            <select name="gender" value={formData.gender} onChange={handleChange} required>
              <option value="male">Male / नर</option>
              <option value="female">Female / मादी</option>
            </select>
          </div>

          <div className="form-group">
            <label>
              Breed Name <span className="required">*</span>
              <span className="marathi">जात</span>
            </label>
            <input
              type="text"
              name="breedName"
              value={formData.breedName}
              onChange={handleChange}
              placeholder="e.g., Marwari, Kathiawari, Arabian"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>
              Age <span className="required">*</span>
              <span className="marathi">वय</span>
            </label>
            <input
              type="text"
              name="age"
              value={formData.age}
              onChange={handleChange}
              placeholder="e.g., 5 years"
              required
            />
          </div>

          <div className="form-group">
            <label>
              Color <span className="required">*</span>
              <span className="marathi">रंग</span>
            </label>
            <input
              type="text"
              name="color"
              value={formData.color}
              onChange={handleChange}
              placeholder="e.g., Brown, Black, White"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>
              Height (hands) <span className="required">*</span>
              <span className="marathi">उंची (हात)</span>
            </label>
            <input
              type="number"
              name="height"
              value={formData.height}
              onChange={handleChange}
              placeholder="e.g., 15.2"
              step="0.1"
              min="0"
              required
            />
            <p className="info-text">1 hand = 4 inches = 10.16 cm</p>
          </div>

          <div className="form-group">
            <label>
              Weight (kg) <span className="required">*</span>
              <span className="marathi">वजन</span>
            </label>
            <input
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              placeholder="e.g., 450"
              step="0.01"
              min="0"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>
              Health Condition <span className="required">*</span>
              <span className="marathi">आरोग्य स्थिती</span>
            </label>
            <select name="healthCondition" value={formData.healthCondition} onChange={handleChange} required>
              <option value="excellent">Excellent / उत्कृष्ट</option>
              <option value="good">Good / चांगली</option>
              <option value="average">Average / सरासरी</option>
            </select>
          </div>

          <div className="form-group">
            <label>
              Trained <span className="required">*</span>
              <span className="marathi">प्रशिक्षित</span>
            </label>
            <select name="trained" value={formData.trained} onChange={handleChange} required>
              <option value="yes">Yes / होय</option>
              <option value="no">No / नाही</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>
              Purpose <span className="required">*</span>
              <span className="marathi">उद्देश</span>
            </label>
            <select name="purpose" value={formData.purpose} onChange={handleChange} required>
              <option value="riding">Riding / सवारी</option>
              <option value="racing">Racing / शर्यत</option>
              <option value="breeding">Breeding / प्रजनन</option>
            </select>
          </div>

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
              rows="2"
            />
          </div>
        </div>

        <div className="form-group">
          <label>
            Description
            <span className="marathi">अतिरिक्त माहिती</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Any additional information..."
            rows="3"
          />
        </div>
      </div>

      {/* Section 2: Photos & Videos */}
      <div className="form-section">
        <h3 className="section-title">
          <span className="section-number">2</span>
          Photos & Videos / छायाचित्रे आणि व्हिडिओ
        </h3>

        <div className="form-row">
          <div className="form-group">
            <label>Front Photo <span className="marathi">समोरचा फोटो</span></label>
            <div className="file-input-wrapper">
              <input
                type="file"
                id="horse-frontPhoto"
                name="frontPhoto"
                accept="image/*"
                onChange={handleFileChange}
              />
              <label htmlFor="horse-frontPhoto" className="file-input-label">
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
                id="horse-sidePhoto"
                name="sidePhoto"
                accept="image/*"
                onChange={handleFileChange}
              />
              <label htmlFor="horse-sidePhoto" className="file-input-label">
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
            <label>Full Body Photo <span className="marathi">संपूर्ण शरीर फोटो</span></label>
            <div className="file-input-wrapper">
              <input
                type="file"
                id="horse-fullBodyPhoto"
                name="fullBodyPhoto"
                accept="image/*"
                onChange={handleFileChange}
              />
              <label htmlFor="horse-fullBodyPhoto" className="file-input-label">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {files.fullBodyPhoto ? files.fullBodyPhoto.name : 'Choose Full Body Photo'}
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Video <span className="marathi">व्हिडिओ</span></label>
            <div className="file-input-wrapper">
              <input
                type="file"
                id="horse-video"
                name="video"
                accept="video/*"
                onChange={handleFileChange}
              />
              <label htmlFor="horse-video" className="file-input-label">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {files.video ? files.video.name : 'Choose Video'}
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Price & Negotiation */}
      <div className="form-section">
        <h3 className="section-title">
          <span className="section-number">3</span>
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
              placeholder="e.g., 150000"
              min="0"
              step="1000"
              required
            />
          </div>

          <div className="form-group">
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="horse-isNegotiable"
                name="isNegotiable"
                checked={formData.isNegotiable}
                onChange={handleChange}
              />
              <label htmlFor="horse-isNegotiable">
                Price is Negotiable / किंमत चर्चेच्या अधीन आहे
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Additional Information */}
      <div className="form-section">
        <h3 className="section-title">
          <span className="section-number">4</span>
          Additional Information / अतिरिक्त माहिती
        </h3>

        <div className="form-group">
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="horse-deliveryAvailable"
              name="deliveryAvailable"
              checked={formData.deliveryAvailable}
              onChange={handleChange}
            />
            <label htmlFor="horse-deliveryAvailable">
              Delivery Available / वितरण उपलब्ध
            </label>
          </div>
        </div>
      </div>

      {/* Section 5: Location */}
      <div className="form-section">
        <h3 className="section-title">
          <span className="section-number">5</span>
          Location / स्थान (Optional)
        </h3>

        <div className="form-row">
          <div className="form-group">
            <label>City <span className="marathi">शहर</span></label>
            <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Enter city" />
          </div>

          <div className="form-group">
            <label>State <span className="marathi">राज्य</span></label>
            <input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="Enter state" />
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
        {loading ? 'Submitting... / सबमिट करत आहे...' : 'Submit Horse Listing / घोडा यादी सबमिट करा'}
      </button>
    </form>
  );
};

export default HorseListingForm;
