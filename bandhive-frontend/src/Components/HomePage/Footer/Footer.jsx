// Components/Footer/Footer.jsx
import React from 'react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>Band Booking</h3>
          <p className="company-description">
            Connecting talented musicians with amazing events. 
            Making live music booking simple and secure.
          </p>
          <div className="social-links">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon">
              <i className="fab fa-facebook-f"></i>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-icon">
              <i className="fab fa-instagram"></i>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-icon">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-icon">
              <i className="fab fa-linkedin-in"></i>
            </a>
          </div>
        </div>

        {/* Quick Links Section */}
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul className="footer-links">
            <li><a href="/">Home</a></li>
            <li><a href="/#about-section">About Us</a></li>
            <li><a href="/#features-section">Features</a></li>
            <li><a href="/#services">Services</a></li>
            <li><a href="/#contact">Contact</a></li>
          </ul>
        </div>

        {/* Services Section */}
        <div className="footer-section">
          <h4>Services</h4>
          <ul className="footer-links">
            <li><a href="/#bands">Find Bands</a></li>
            <li><a href="/#booking">Book Events</a></li>
            <li><a href="/#register">Band Registration</a></li>
            <li><a href="/#pricing">Pricing</a></li>
            <li><a href="/#support">Support</a></li>
          </ul>
        </div>

        {/* Contact Info Section */}
        <div className="footer-section">
          <h4>Contact Us</h4>
          <div className="contact-info">
            <p><i className="fas fa-phone"></i> +1 234 567 8900</p>
            <p><i className="fas fa-envelope"></i> info@bandbooking.com</p>
            <p><i className="fas fa-location-dot"></i> 123 Music Street, City, Country</p>
          </div>
        </div>
      </div>

      {/* Newsletter Subscription */}
      <div className="newsletter-section">
        <h4>Subscribe to Our Newsletter</h4>
        <div className="newsletter-form">
          <input type="email" placeholder="Enter your email" />
          <button type="submit">Subscribe</button>
        </div>
      </div>

      {/* Copyright Section */}
      <div className="footer-bottom">
        <p>&copy; {currentYear} Band Booking. All rights reserved.</p>
        <div className="footer-bottom-links">
          <a href="/privacy-policy">Privacy Policy</a>
          <a href="/terms-of-service">Terms of Service</a>
          <a href="/cookie-policy">Cookie Policy</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;