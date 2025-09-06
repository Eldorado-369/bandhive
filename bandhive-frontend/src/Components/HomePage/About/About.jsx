import React, { useEffect, useRef } from 'react';
import './About.css';

const About = () => {
  const textRefs = useRef([]);
  const servicesRef = useRef([]);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.2,
      rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in-view');
        }
      });
    }, observerOptions);

    // Observe text elements
    textRefs.current.forEach(ref => {
      if (ref) observer.observe(ref);
    });

    // Observe service items
    servicesRef.current.forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section id="about-section" className="about-section">
      <div className="about-container">
        <h2 ref={el => textRefs.current[0] = el} className="slide-up">About Us</h2>
        <div className="about-content">
          <div className="about-text">
            <p ref={el => textRefs.current[1] = el} className="slide-up">
              Welcome to our musical journey! At Band Booker, we believe in creating unforgettable experiences through the power of live music. Our platform connects talented bands with event organizers, making it easier than ever to find the perfect musical match for your special occasion.
            </p>
            
            <h3 ref={el => textRefs.current[2] = el} className="slide-up">Our Mission</h3>
            <p ref={el => textRefs.current[3] = el} className="slide-up">
              We strive to revolutionize the way people book live music, creating seamless connections between talented artists and event planners. Our goal is to make live music accessible, reliable, and extraordinary for every event.
            </p>
            
            <h3 ref={el => textRefs.current[4] = el} className="slide-up">What We Offer</h3>
            <div className="services">
              <div ref={el => servicesRef.current[0] = el} className="service-item scale-up">
                <h4>Verified Bands</h4>
                <p>All bands on our platform are thoroughly vetted to ensure professional quality and reliability.</p>
              </div>
              <div ref={el => servicesRef.current[1] = el} className="service-item scale-up">
                <h4>Easy Booking</h4>
                <p>Our streamlined booking process makes it simple to find and book the perfect band for your event.</p>
              </div>
              <div ref={el => servicesRef.current[2] = el} className="service-item scale-up">
                <h4>Secure Payments</h4>
                <p>Enjoy peace of mind with our secure payment system and clear booking terms.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;