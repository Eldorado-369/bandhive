import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CustomerRegister.css';
import { Mail, Phone, MapPin, Music } from 'lucide-react';
import { Link } from 'react-router-dom';
import customerregister from '../../../assets/customreg.jpg';
import user_img from '../../../assets/person.png';
import pass_img from '../../../assets/password.png';

function CustomerRegister() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    location: '',
    preferred_genres: '',
    verified: 1,
    terms_accepted: false,
  });
  const [errors, setErrors] = useState({});
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  useEffect(() => {
    if (formData.password && formData.confirmPassword) {
      setPasswordMatch(formData.password === formData.confirmPassword);
    }
  }, [formData.password, formData.confirmPassword]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    if (name === 'terms_accepted' && checked) {
      setErrors((prev) => ({ ...prev, terms_accepted: '' }));
    }
    console.log('Form data updated:', { ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowPopup(false);
    setPopupMessage('');
    setErrors({});

    if (!formData.phone) {
      setPopupMessage('Phone number is required');
      setShowPopup(true);
      setErrors((prev) => ({ ...prev, phone: 'Phone number is required' }));
      return;
    }

    if (!passwordMatch) {
      setPopupMessage('Passwords do not match!');
      setShowPopup(true);
      setErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      return;
    }

    if (!formData.terms_accepted) {
      setPopupMessage('You must accept the terms and conditions to register!');
      setShowPopup(true);
      setErrors((prev) => ({
        ...prev,
        terms_accepted: 'Please accept the terms and conditions.',
      }));
      return;
    }

    try {
      const submitData = {
        user: {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          phone_number: formData.phone,
          is_verified: formData.verified,
          terms_accepted: formData.terms_accepted,
        },
        name: formData.name,
        phone: formData.phone,
        location: formData.location,
        address: formData.address,
        preferred_genres: formData.preferred_genres,
      };
      const BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
      const response = await axios.post(
        `${BASE_URL}/api/customer-register/`,
        submitData,
        {
          headers: { 'Content-Type': 'application/json' },
          proxy: false,
        }
      );

      if (response.status === 201) {
        localStorage.setItem('accessToken', response.data.token);
        localStorage.setItem('refreshToken', response.data.refresh);
        localStorage.setItem('userId', response.data.user.id);
        setPopupMessage('Registration successful! Redirecting...');
        setShowPopup(true);
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      let errorMessage = 'Registration failed. Please try again.';
      if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Unable to connect to the server. Please check if the server is running and try again.';
      } else if (error.response?.data) {
        const errors = error.response.data;
        errorMessage =
          errors.user?.terms_accepted?.[0] ||
          errors.user?.email?.[0] ||
          errors.user?.username?.[0] ||
          errors.error ||
          'Registration failed. Please check your input.';
      }
      setPopupMessage(errorMessage);
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 5000); // Auto-close after 5 seconds
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    setPopupMessage('');
  };

  const closeTermsModal = () => {
    setIsTermsModalOpen(false);
  };

  const handleMouseMove = (e) => {
    const page = document.querySelector('.customer-register-page');
    const rectPage = page.getBoundingClientRect();
    const x = ((e.clientX - rectPage.left) / rectPage.width) * 100;
    const y = ((e.clientY - rectPage.top) / rectPage.height) * 100;
    page.style.setProperty('--mouse-x', `${x}%`);
    page.style.setProperty('--mouse-y', `${y}%`);
  };

  return (
    <div
      className="customer-register-page"
      onMouseMove={handleMouseMove}
      style={{ backgroundImage: `url(${customerregister})` }}
    >
      <div className="register-box">
        <div className="register-header">
          <h1>Customer Registration</h1>
          <p>Join the Music Experience!</p>
        </div>

        {showPopup && (
          <div className="popup">
            <div className="popup-content">
              <p>{popupMessage}</p>
              <button onClick={closePopup} className="close-button">
                Close
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <div className="input-field">
              <img src={user_img} alt="Name" />
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                required
                className={errors.name ? 'error-input' : ''}
              />
              {errors.name && (
                <div className="error-message">{errors.name}</div>
              )}
            </div>
            <div className="input-field">
              <img src={user_img} alt="Username" />
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                required
                className={errors.username ? 'error-input' : ''}
              />
              {errors.username && (
                <div className="error-message">{errors.username}</div>
              )}
            </div>
            <div className="input-field">
              <Mail size={20} className="icon" />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                required
                className={errors.email ? 'error-input' : ''}
              />
              {errors.email && (
                <div className="error-message">{errors.email}</div>
              )}
            </div>
            <div className="input-field">
              <img src={pass_img} alt="Password" />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
                className={errors.password ? 'error-input' : ''}
              />
              {errors.password && (
                <div className="error-message">{errors.password}</div>
              )}
            </div>
            <div className="input-field">
              <Phone size={20} className="icon" />
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                required
                pattern="[0-9]{10}"
                className={errors.phone ? 'error-input' : ''}
              />
              {errors.phone && (
                <div className="error-message">{errors.phone}</div>
              )}
            </div>
            <div className="input-field">
              <img src={pass_img} alt="Confirm Password" />
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={8}
                className={errors.confirmPassword ? 'error-input' : ''}
              />
              {errors.confirmPassword && (
                <div className="error-message">{errors.confirmPassword}</div>
              )}
            </div>
            <div className="input-field">
              <MapPin size={20} className="icon" />
              <input
                type="text"
                name="address"
                placeholder="Address"
                value={formData.address}
                onChange={handleChange}
                required
                className={errors.address ? 'error-input' : ''}
              />
              {errors.address && (
                <div className="error-message">{errors.address}</div>
              )}
            </div>
            {!passwordMatch && (
              <div className="error-message">Passwords do not match!</div>
            )}
            <div className="input-field">
              <MapPin size={20} className="icon" />
              <input
                type="text"
                name="location"
                placeholder="Location"
                value={formData.location}
                onChange={handleChange}
                required
                className={errors.location ? 'error-input' : ''}
              />
              {errors.location && (
                <div className="error-message">{errors.location}</div>
              )}
            </div>
            <div className="input-field">
              <Music size={20} className="icon" />
              <input
                type="text"
                name="preferred_genres"
                placeholder="Preferred Genres"
                value={formData.preferred_genres}
                onChange={handleChange}
                className={errors.preferred_genres ? 'error-input' : ''}
              />
              {errors.preferred_genres && (
                <div className="error-message">{errors.preferred_genres}</div>
              )}
            </div>
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
          <button
            type="submit"
            className="register-button"
            disabled={!formData.terms_accepted}
          >
            Register
          </button>
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
}

export default CustomerRegister;