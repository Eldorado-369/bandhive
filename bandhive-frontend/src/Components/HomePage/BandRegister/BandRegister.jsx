import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './BandRegister.css';
import { User, Lock, Mail, Music, MapPin, Phone, Tag, FileText, File } from 'lucide-react';
import { Link } from 'react-router-dom';

const BandRegister = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    genre: '',
    description: '',
    location: '',
    phone_number: '',
    base_price: '',
    verification_image: null,
    document_type: '',
    terms_accepted: false,
  });
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [modalMessage, setModalMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (formData.password && formData.confirmPassword) {
      setPasswordMatch(formData.password === formData.confirmPassword);
    }
  }, [formData.password, formData.confirmPassword]);

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const checkUsername = async (username) => {
    if (!username) {
      setUsernameStatus('');
      return;
    }
    try {
      const BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
      const response = await axios.get(
        `${BASE_URL}/api/check-username/?username=${encodeURIComponent(username)}`
      );
      setUsernameStatus(response.data.available ? 'Username available' : 'This username is already taken');
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameStatus('Unable to check username availability');
    }
  };

  const debouncedCheckUsername = debounce(checkUsername, 500);

  const handleChange = (e) => {
    const { name, value, type, files, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'file' ? files[0] : type === 'checkbox' ? checked : value,
    }));
    if (name === 'username') {
      debouncedCheckUsername(value);
    }
    if (name === 'terms_accepted' && checked) {
      setErrors((prev) => ({ ...prev, terms_accepted: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsModalOpen(false);
    setModalMessage('');
    setErrors({});
  
    if (!passwordMatch) {
      setModalMessage('Passwords do not match!');
      setIsModalOpen(true);
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }
  
    if (!formData.terms_accepted) {
      setModalMessage('You must accept the terms and conditions to register!');
      setIsModalOpen(true);
      setErrors({ terms_accepted: 'Please accept the terms and conditions.' });
      return;
    }
  
    if (!formData.verification_image) {
      setModalMessage('Please upload a verification image.');
      setIsModalOpen(true);
      setErrors({ verification_image: 'Verification image is required.' });
      return;
    }
  
    const formDataToSend = new FormData();
    // Send flat fields as expected by BandSerializer
    formDataToSend.append('username', formData.username);
    formDataToSend.append('email', formData.email);
    formDataToSend.append('password', formData.password);
    formDataToSend.append('phone_number', formData.phone_number);
    formDataToSend.append('terms_accepted', formData.terms_accepted);
    formDataToSend.append('name', formData.name);
    formDataToSend.append('genre', formData.genre);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('location', formData.location);
    formDataToSend.append('base_price', formData.base_price);
    formDataToSend.append('document_type', formData.document_type);
    if (formData.verification_image) {
      formDataToSend.append('verification_image', formData.verification_image);
    }
  
    try {
      const BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
      console.log('Sending FormData:', Object.fromEntries(formDataToSend));
      const response = await axios.post(`${BASE_URL}/api/band-register/`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
  
      localStorage.setItem('accessToken', response.data.token);
      localStorage.setItem('refreshToken', response.data.refresh);
      localStorage.setItem('userId', response.data.user.id);
  
      setModalMessage('Band registered successfully! Redirecting to login...');
      setIsModalOpen(true);
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (error) {
      console.error('Submission error:', error);
      console.error('Full error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      let errorMessage = 'Registration failed. Please try again.';
      if (error.response?.data) {
        const errors = error.response.data;
        console.error('Validation errors:', errors);
        errorMessage =
          errors.terms_accepted?.[0] ||
          errors.email?.[0] ||
          errors.username?.[0] ||
          errors.phone_number?.[0] ||
          errors.name?.[0] ||
          errors.genre?.[0] ||
          errors.description?.[0] ||
          errors.location?.[0] ||
          errors.base_price?.[0] ||
          errors.document_type?.[0] ||
          errors.verification_image?.[0] ||
          errors.error ||
          JSON.stringify(errors) ||
          'Registration failed. Please check your details.';
        setErrors({
          username: errors.username?.[0],
          email: errors.email?.[0],
          password: errors.password?.[0],
          phone_number: errors.phone_number?.[0],
          terms_accepted: errors.terms_accepted?.[0],
          name: errors.name?.[0],
          genre: errors.genre?.[0],
          description: errors.description?.[0],
          location: errors.location?.[0],
          base_price: errors.base_price?.[0],
          document_type: errors.document_type?.[0],
          verification_image: errors.verification_image?.[0],
        });
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Unable to connect to the server. Please check if the server is running.';
      }
      setModalMessage(errorMessage);
      setIsModalOpen(true);
    }
  };
  
  const handleReset = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      genre: '',
      description: '',
      location: '',
      phone_number: '',
      base_price: '',
      verification_image: null,
      document_type: '',
      terms_accepted: false,
    });
    setUsernameStatus('');
    setErrors({});
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalMessage('');
  };

  const closeTermsModal = () => {
    setIsTermsModalOpen(false);
  };

  const handleMouseMove = (e) => {
    const page = document.querySelector('.band-register-page');
    const rect = page.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    page.style.setProperty('--bg-x', `${x}%`);
    page.style.setProperty('--bg-y', `${y}%`);
  };

  return (
    <div className="band-register-page" onMouseMove={handleMouseMove}>
      <div className="register-box">
        <div className="header">
          <h1 className="title">Band Registration</h1>
          <p className="subtitle">Join the Stage Now!</p>
          <div className="underline"></div>
        </div>
        <form onSubmit={handleSubmit} className="form" encType="multipart/form-data">
          <div className="input-group">
            <div className="column">
              <div className="input-field">
                <Music size={20} className="icon" />
                <input
                  type="text"
                  placeholder="Band Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className={errors.name ? 'error-input' : ''}
                />
                {errors.name && <div className="error-message">{errors.name}</div>}
              </div>
              <div className="input-field">
                <Tag size={20} className="icon" />
                <input
                  type="text"
                  placeholder="Genre"
                  name="genre"
                  value={formData.genre}
                  onChange={handleChange}
                  required
                  className={errors.genre ? 'error-input' : ''}
                />
                {errors.genre && <div className="error-message">{errors.genre}</div>}
              </div>
              <div className="input-field">
                <MapPin size={20} className="icon" />
                <input
                  type="text"
                  placeholder="Location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  className={errors.location ? 'error-input' : ''}
                />
                {errors.location && <div className="error-message">{errors.location}</div>}
              </div>
              <div className="input-field">
                <Phone size={20} className="icon" />
                <input
                  type="tel"
                  placeholder="Contact Number"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  maxLength={10}
                  required
                  pattern="[0-9]{10}"
                  className={errors.phone_number ? 'error-input' : ''}
                />
                {errors.phone_number && (
                  <div className="error-message">{errors.phone_number}</div>
                )}
              </div>
              <div className="input-field">
                <Tag size={20} className="icon" />
                <input
                  type="number"
                  placeholder="Base Price"
                  name="base_price"
                  value={formData.base_price}
                  onChange={handleChange}
                  required
                  className={errors.base_price ? 'error-input' : ''}
                />
                {errors.base_price && (
                  <div className="error-message">{errors.base_price}</div>
                )}
              </div>
            </div>
            <div className="column">
              <div className="input-field">
                <User size={20} className="icon" />
                <input
                  type="text"
                  placeholder="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className={errors.username ? 'error-input' : ''}
                />
                {errors.username && (
                  <div className="error-message">{errors.username}</div>
                )}
              </div>
              <div
                className="username-status"
                style={{
                  color: usernameStatus.includes('taken') ? 'red' : 'green',
                  fontSize: '12px',
                  marginTop: '-10px',
                }}
              >
                {usernameStatus}
              </div>
              <div className="input-field">
                <Mail size={20} className="icon" />
                <input
                  type="email"
                  placeholder="Email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={errors.email ? 'error-input' : ''}
                />
                {errors.email && <div className="error-message">{errors.email}</div>}
              </div>
              <div className="input-field">
                <Lock size={20} className="icon" />
                <input
                  type="password"
                  placeholder="Password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  maxLength={15}
                  required
                  className={errors.password ? 'error-input' : ''}
                />
                {errors.password && (
                  <div className="error-message">{errors.password}</div>
                )}
              </div>
              <div className="input-field">
                <Lock size={20} className="icon" />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  maxLength={15}
                  required
                  className={errors.confirmPassword ? 'error-input' : ''}
                />
                {errors.confirmPassword && (
                  <div className="error-message">{errors.confirmPassword}</div>
                )}
              </div>
              {!passwordMatch && (
                <div className="error-message">Passwords do not match!</div>
              )}
              <div className="input-field">
                <FileText size={20} className="icon" />
                <select
                  name="document_type"
                  value={formData.document_type}
                  onChange={handleChange}
                  required
                  className={errors.document_type ? 'error-input' : ''}
                >
                  <option value="">Select ID</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Aadhar">Aadhar</option>
                  <option value="PAN">PAN</option>
                </select>
                {errors.document_type && (
                  <div className="error-message">{errors.document_type}</div>
                )}
                <input
                  type="file"
                  name="verification_image"
                  onChange={handleChange}
                  accept=".pdf,.jpg,.png"
                  required
                  className={errors.verification_image ? 'error-input' : ''}
                />
                {errors.verification_image && (
                  <div className="error-message">{errors.verification_image}</div>
                )}
              </div>
            </div>
          </div>
          <div className="input-field full-width">
            <File size={20} className="icon" />
            <textarea
              placeholder="Description (Please add your program's social media content link - For verification purpose)"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              maxLength={300}
              className={errors.description ? 'error-input' : ''}
            />
            {errors.description && (
              <div className="error-message">{errors.description}</div>
            )}
          </div>
          <div className="terms-group">
            <input
              type="checkbox"
              name="terms_accepted"
              checked={formData.terms_accepted}
              onChange={handleChange}
              id="terms-checkbox"
              className={errors.terms_accepted ? 'error-input' : ''}
            />
            <label htmlFor="terms-checkbox">
              I agree to the{' '}
              <span
                className="terms-link"
                onClick={() => setIsTermsModalOpen(true)}
                style={{ color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Terms and Conditions
              </span>
            </label>
            {errors.terms_accepted && (
              <div className="error-message">{errors.terms_accepted}</div>
            )}
          </div>
          <div className="button-group">
            <button
              type="submit"
              className="btn-submit"
              disabled={!formData.terms_accepted || !passwordMatch}
            >
              Register
            </button>
            <button type="button" className="btn-reset" onClick={handleReset}>
              Reset
            </button>
          </div>
          <div className="login-link" style={{ textAlign: 'center', marginTop: '15px' }}>
            <p>
              If you already have an account,{' '}
              <Link to="/login" style={{ color: '#007bff', textDecoration: 'underline' }}>
                click here to login
              </Link>
            </p>
          </div>
        </form>
      </div>

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={closeModal}>
              ×
            </span>
            <p>{modalMessage}</p>
          </div>
        </div>
      )}

      {isTermsModalOpen && (
        <div className="modal">
          <div
            className="modal-content"
            style={{ maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}
          >
            <span className="close" onClick={closeTermsModal}>
              ×
            </span>
            <h2>Terms and Conditions</h2>
            <p>
              Welcome to BandHive! By registering, you agree to the following terms and
              conditions:
            </p>
            <ul>
              <li>You must provide accurate and complete information during registration.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>BandHive reserves the right to verify and approve band registrations.</li>
              <li>Payments for bookings must be made through the platform's payment gateway.</li>
              <li>Any disputes arising from bookings will be handled as per our dispute resolution policy.</li>
              <li>You agree not to use the platform for any unlawful or prohibited activities.</li>
              <li>BandHive may update these terms at any time, and continued use of the platform constitutes acceptance of the updated terms.</li>
            </ul>
            <p>
              For any questions, contact us at support@bandhive.com.
            </p>
            <button onClick={closeTermsModal} className="modal-close-btn">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BandRegister;