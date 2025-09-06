import React from "react";
import "./Hero.css";
import arrow_btn from "../../../assets/arrow.png";
import pause_btn from "../../../assets/pause.png";
import play_btn from "../../../assets/play.png";
import BlurText from "../Home/BlurText"; 

function Hero({
  heroData,
  setHeroCount,
  setPlayStatus,
  heroCount,
  playStatus,
}) {
  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    section.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="hero">
      <div className="hero-text">
        <BlurText
          text={heroData.text1}
          delay={150}
          animateBy="words"
          direction="top"
          className="hero-text-item"
        />
        <BlurText
          text={heroData.text2}
          delay={300} 
          animateBy="words"
          direction="top"
          className="hero-text-item"
        />
      </div>
      <div className="hero-explore">
        <p>Explore the features</p>
        <button
          className="transparent-button"
          onClick={() => scrollToSection("features-section")}
        >
          <img src={arrow_btn} alt="" />
        </button>
      </div>
      <div className="hero-dot-play">
        <ul className="hero-dots">
          <li
            id="flex-item"
            onClick={() => setHeroCount(0)}
            className={heroCount === 0 ? "hero-dot orange" : "hero-dot"}
          ></li>
          <li
            id="flex-item"
            onClick={() => setHeroCount(1)}
            className={heroCount === 1 ? "hero-dot orange" : "hero-dot"}
          ></li>
        </ul>
        <div className="hero-play">
          <img
            onClick={() => setPlayStatus(!playStatus)}
            src={playStatus ? pause_btn : play_btn}
            alt=""
          />
          <p className="white-text">See the video</p>
        </div>
      </div>
    </div>
  );
}

export default Hero;