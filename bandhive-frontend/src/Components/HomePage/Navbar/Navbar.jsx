import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";

const Navbar = (props) => {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToSection = (sectionId) => {
    if (location.pathname === "/login") {
      navigate("/");
    }

    const delay = location.pathname === "/login" ? 100 : 0;

    setTimeout(() => {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    }, delay);
  };

  return (
    <section id="home-section" className="home-section">
      <nav className="nav">
        <div className="nav-logo"> BandHive </div>
        <ul className="nav-menu">
          <li>
            <button className="transparent-button" onClick={() => scrollToSection("home-section")}>
              Home
            </button>
          </li>
          <li>
            <button className="transparent-button" onClick={() => scrollToSection("about-section")}>
              About
            </button>
          </li>
          <li>
            <button className="transparent-button" onClick={() => scrollToSection("features-section")}>
              Feature
            </button>
          </li>
          <li>
            <button className="transparent-button" onClick={() => scrollToSection("register-section")}>
              Register
            </button>
          </li>
          {location.pathname !== "/login-signup" && (
            <li>
              <button className="transparent-button" onClick={() => navigate("/login")}>
                Login
              </button>
            </li>
          )}
        </ul>
      </nav>
    </section>
  );
};

export default Navbar;
