import React from "react";
import "../App.css";
import hero from "../assets/hero.png";

const About = () => {
  return (
    <div>
      <div>about</div>
      <img src="../favicon.svg" alt="About" />
      <img src={hero} alt="About" />
    </div>
  )
}

export default About;
