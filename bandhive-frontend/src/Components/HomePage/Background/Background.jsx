import React from "react";
import "./Background.css";
import bvideo from "../../../assets/bandvideo.mp4";
import image1 from "../../../assets/homepage.jpeg";
import image2 from "../../../assets/image1.jpg";

function Background({ playStatus, heroCount }) {
  if (playStatus) {
    return (
      <div>
        <video className="background" autoPlay loop muted>
          <source src={bvideo} type="video/mp4" />
        </video>
      </div>
    );
  } else if (heroCount === 0) {
    return <img src={image1} className="background fade-in" alt="background1" />;
  } else {
    return <img src={image2} className="background fade-in" alt="background2" />;
  } 
}

export default Background;
