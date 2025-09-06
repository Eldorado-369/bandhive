import React, { useEffect, useRef } from 'react';
import './Features.css';

const Features = () => {
  const featureRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('show');
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: '0px'
      }
    );

    featureRefs.current.forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: "🎸",
      title: "Band Registration",
      description: "Easy registration process for bands to showcase their talent. Upload profiles, music samples, and set your availability.",
      list: [
        "Create detailed band profiles",
        "Upload performance videos",
        "Set pricing and availability"
      ]
    },
    {
      icon: "📅",
      title: "Smart Booking",
      description: "Streamlined booking process for both bands and customers. Real-time availability checking and instant confirmation.",
      list: [
        "Real-time calendar management",
        "Instant booking confirmation",
        "Automated reminders"
      ]
    },
    {
      icon: "💬",
      title: "Direct Messaging",
      description: "Built-in messaging system for seamless communication between bands and event organizers.",
      list: [
        "Real-time chat",
        "File sharing capability",
        "Event requirement discussion"
      ]
    },
    {
      icon: "✅",
      title: "Verified Profiles",
      description: "All bands go through our verification process to ensure quality and reliability.",
      list: [
        "Background checks",
        "Performance history verification",
        "Customer reviews"
      ]
    },
    {
      icon: "💳",
      title: "Secure Payments",
      description: "Safe and secure payment processing for all bookings with transparent pricing.",
      list: [
        "Multiple payment options",
        "Secure transaction processing",
        "Clear pricing structure"
      ]
    },
    {
      icon: "⭐",
      title: "Reviews & Ratings",
      description: "Comprehensive review system to help make informed decisions.",
      list: [
        "Verified customer reviews",
        "Performance ratings",
        "Photo and video sharing"
      ]
    }
  ];

  return (
    <section id="features-section" className="features-section">
      <div className="features-container">
        <h2 ref={el => featureRefs.current[0] = el} className="title-animation">
          Our Features
        </h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div
              key={index}
              ref={el => featureRefs.current[index + 1] = el}
              className="feature-card"
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <ul className="feature-list">
                {feature.list.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;