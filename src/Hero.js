import React from "react";
import "./Hero.css";

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-bg-parallax">
        <video 
          className="hero-bg-video" 
          autoPlay 
          loop 
          muted 
          playsInline 
          poster="/logo192.png"
        >
          <source src="/Фейеро7В.mp4" type="video/mp4" />
          Ваш браузер не поддерживает видео.
        </video>
      </div>
    </section>
  );
} 