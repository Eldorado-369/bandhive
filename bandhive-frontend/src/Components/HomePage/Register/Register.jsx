import React, { useEffect, useRef } from "react";
import "./Register.css";
import { useNavigate, useLocation } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();
  const sectionRefs = useRef([]);
  const location = useLocation();

  useEffect(() => {
    const observerOptions = {
      threshold: 0.3,
      rootMargin: "0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("fade-in-view");
        }
      });
    }, observerOptions);

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section id="register-section" className="register-section">
      <div className="register-wrapper">
        <h2 className="section-title">Join Us Today</h2>
        <div className="register-content">
          <div
            ref={(el) => (sectionRefs.current[0] = el)}
            className="band-registration-card" 
          >
            <div className="card-header">
              <h3>Band Registration</h3>
              <span className="card-subtitle">For Musicians & Bands</span>
            </div>
            <p>
              Join our platform and showcase your band to a larger audience. Get
              exclusive event bookings and grow your fan base.
            </p>
            <ul className="benefits-list">
              <li>Get listed in our premium band directory</li>
              <li>Receive notifications for upcoming gigs</li>
              <li>Connect with event organizers directly</li>
            </ul>
            {location.pathname !== "/register-band" && (
              <button
                className="register-btn"
                onClick={() => navigate("/register-band")}
              >
                Register Your Band
              </button>
            )}
          </div>

          <div
            ref={(el) => (sectionRefs.current[1] = el)}
            className="customer-registration-card" 
          >
            <div className="card-header">
              <h3>Customer Registration</h3>
              <span className="card-subtitle">For Event Organizers</span>
            </div>
            <p>
              Find and book the best bands for your events with ease. Enjoy a
              seamless event planning experience.
            </p>
            <ul className="benefits-list">
              <li>Access a variety of music genres</li>
              <li>Directly contact bands for bookings</li>
              <li>Get notified about exclusive live events</li>
            </ul>
            {location.pathname !== "/register-customer" && (
              <button
                className="register-btn"
                onClick={() => navigate("/register-customer")}
              >
                Register as Customer
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Register;