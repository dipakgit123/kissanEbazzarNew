import React, { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const DogListingForm = () => {
  const [formData, setFormData] = useState({
    dogType: 'male',
    breedName: '',
    age: '',
    color: '',
    weight: '',
    height: '',
    vaccinationStatus: 'yes',
    healthCondition: 'healthy',
    trained: 'yes',
    behavior: 'friendly',
    purpose: 'pet',
    description: '',
    expectedPrice: '',
    isNegotiable: true,
    detailsConfirmed: false,
    termsAccepted: false,
    city: '',
    state: '',
    pincode: ''
  });

  const [files, setFiles] = useState({
    photo1: null,
    photo2: null,
    photo3: null,
    photo4: null,
    photo5: null,
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
        `${API_URL}/api/dogs/listings`,
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
          dogType: 'male',
          breedName: '',
          age: '',
          color: '',
          weight: '',
          height: '',
          vaccinationStatus: 'yes',
          healthCondition: 'healthy',
          trained: 'yes',
          behavior: 'friendly',
          purpose: 'pet',
          description: '',
          expectedPrice: '',
          isNegotiable: true,
          detailsConfirmed: false,
          termsAccepted: false,
          city: '',
          state: '',
          pincode: ''
        });
        setFiles({
          photo1: null,
          photo2: null,
          photo3: null,
          photo4: null,
          photo5: null,
          video: null
        });

        // Show success message
        alert('Dog listing created successfully!');
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
      <h2 className="form-title">Dog Listing Form / कुत्रा यादी</h2>

      {/* Success Message */}
      {success && (
        <div className="alert alert-success">
          Dog listing created successfully!
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Section 1: Dog Details */}
      <div className="form-section">
        <h3 className="section-title">
          <span className="section-number">1</span>
          Dog Details / कुत्र्याची माहिती
        </h3>

        <div className="form-row">
          <div className="form-group">
            <label>
              Dog Type <span className="required">*</span>
              <span className="marathi">कुत्र्याचा प्रकार (नर / मादी)</span>
            </label>
            <select name="dogType" value={formData.dogType} onChange={handleChange} required>
              <option value="male">Male / नर</option>
              <option value="female">Female / मादी</option>
            </select>
          </div>

          <div className="form-group">
            <label>
              Breed Name <span className="required">*</span>
              <span className="marathi">जात (उदा. लॅब्राडोर, जर्मन शेफर्ड, इंडियन, पग)</span>
            </label>
            <input
              type="text"
              name="breedName"
              value={formData.breedName}
              onChange={handleChange}
              placeholder="e.g., Labrador, German Shepherd, Indian, Pug"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>
              Age <span className="required">*</span>
              <span className="marathi">वय (महिन्यांमध्ये किंवा वर्षांमध्ये)</span>
            </label>
            <input
              type="text"
              name="age"
              value={formData.age}
              onChange={handleChange}
              placeholder="e.g., 6 months or 2 years"
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
              placeholder="e.g., Golden, Black, Brown"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>
              Weight (kg) <span className="required">*</span>
              <span className="marathi">वजन (किलो)</span>
            </label>
            <input
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              placeholder="e.g., 30"
              step="0.01"
              min="0"
              max="150"
              required
            />
          </div>

          <div className="form-group">
            <label>
              Height (cm) <span className="required">*</span>
              <span className="marathi">उंची (से.मी.)</span>
            </label>
            <input
              type="number"
              name="height"
              value={formData.height}
              onChange={handleChange}
              placeholder="e.g., 60"
              step="0.01"
              min="0"
              max="200"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>
              Vaccination Status <span className="required">*</span>
              <span className="marathi">लसीकरण स्थिती</span>
            </label>
            <select name="vaccinationStatus" value={formData.vaccinationStatus} onChange={handleChange} required>
              <option value="yes">Yes / होय</option>
              <option value="no">No / नाही</option>
            </select>
          </div>

          <div className="form-group">
            <label>
              Health Condition <span className="required">*</span>
              <span className="marathi">आरोग्य स्थिती</span>
            </label>
            <select name="healthCondition" value={formData.healthCondition} onChange={handleChange} required>
              <option value="healthy">Healthy / निरोगी</option>
              <option value="under_treatment">Under Treatment / उपचाराधीन</option>
            </select>
          </div>
        </div>

        <div className="form-row">
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

          <div className="form-group">
            <label>
              Behavior <span className="required">*</span>
              <span className="marathi">स्वभाव</span>
            </label>
            <select name="behavior" value={formData.behavior} onChange={handleChange} required>
              <option value="friendly">Friendly / मैत्रीपूर्ण</option>
              <option value="aggressive">Aggressive / आक्रमक</option>
              <option value="calm">Calm / शांत</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>
              Purpose <span className="required">*</span>
              <span className="marathi">उद्देश (सुरक्षा / पाळीव / प्रजनन / प्रदर्शन)</span>
            </label>
            <select name="purpose" value={formData.purpose} onChange={handleChange} required>
              <option value="guard">Guard / सुरक्षा</option>
              <option value="pet">Pet / पाळीव</option>
              <option value="breeding">Breeding / प्रजनन</option>
              <option value="show">Show / प्रदर्शन</option>
            </select>
          </div>

          <div className="form-group">
            <label>
              Description
              <span className="marathi">अतिरिक्त माहिती (उदा. खेळकर, निष्ठावान, लसीकरण केलेले)</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="e.g., playful, loyal, vaccinated..."
              rows="3"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Images */}
      <div className="form-section">
        <h3 className="section-title">
          <span className="section-number">2</span>
          Images / छायाचित्रे (min 1, max 5 photos + 1 video)
        </h3>

        <div className="form-row">
          {[1, 2, 3, 4, 5].map((num) => (
            <div className="form-group" key={num}>
              <label>
                Photo {num} {num === 1 && <span className="required">*</span>}
                <span className="marathi">फोटो {num}</span>
              </label>
              <div className="file-input-wrapper">
                <input
                  type="file"
                  id={`dog-photo${num}`}
                  name={`photo${num}`}
                  accept="image/*"
                  onChange={handleFileChange}
                  required={num === 1}
                />
                <label htmlFor={`dog-photo${num}`} className="file-input-label">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {files[`photo${num}`] ? files[`photo${num}`].name : `Choose Photo ${num}`}
                </label>
              </div>
            </div>
          ))}

          <div className="form-group">
            <label>Video (max 1) <span className="marathi">व्हिडिओ</span></label>
            <div className="file-input-wrapper">
              <input
                type="file"
                id="dog-video"
                name="video"
                accept="video/*"
                onChange={handleFileChange}
              />
              <label htmlFor="dog-video" className="file-input-label">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {files.video ? files.video.name : 'Choose Video'}
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Pricing */}
      <div className="form-section">
        <h3 className="section-title">
          <span className="section-number">3</span>
          Pricing / किंमत
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
              placeholder="e.g., 25000"
              min="0"
              step="100"
              required
            />
          </div>

          <div className="form-group">
            <label>Negotiable? <span className="marathi">किंमत चर्चनीय आहे का?</span></label>
            <div className="radio-group">
              <div className="radio-option">
                <input
                  type="radio"
                  id="dog-negotiable-yes"
                  checked={formData.isNegotiable === true}
                  onChange={() => setFormData(prev => ({ ...prev, isNegotiable: true }))}
                />
                <label htmlFor="dog-negotiable-yes">Yes / होय</label>
              </div>
              <div className="radio-option">
                <input
                  type="radio"
                  id="dog-negotiable-no"
                  checked={formData.isNegotiable === false}
                  onChange={() => setFormData(prev => ({ ...prev, isNegotiable: false }))}
                />
                <label htmlFor="dog-negotiable-no">No / नाही</label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Terms & Confirmation */}
      <div className="form-section">
        <h3 className="section-title">
          <span className="section-number">4</span>
          Terms & Confirmation
        </h3>

        <div className="form-group">
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="dog-detailsConfirmed"
              name="detailsConfirmed"
              checked={formData.detailsConfirmed}
              onChange={handleChange}
              required
            />
            <label htmlFor="dog-detailsConfirmed">
              <strong>I confirm all the above details are true.</strong>
            </label>
          </div>
        </div>

        <div className="form-group">
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="dog-termsAccepted"
              name="termsAccepted"
              checked={formData.termsAccepted}
              onChange={handleChange}
              required
            />
            <label htmlFor="dog-termsAccepted">
              <strong>I agree to Animal E-Bazzar's listing terms.</strong>
              <span className="marathi">मी एनिमल ई-बझारच्या नियमांना सहमती देतो.</span>
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
        {loading ? 'Submitting... / सबमिट करत आहे...' : 'Submit Dog Listing / कुत्रा यादी सबमिट करा'}
      </button>
    </form>
  );
};

export default DogListingForm;
