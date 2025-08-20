import React, { useRef, useEffect } from "react";
import "./Hero.css";

export default function Hero() {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Обработка ошибок загрузки видео
    const handleError = () => {
      console.warn('Ошибка загрузки видео, используется fallback');
    };

    // Обработка успешной загрузки
    const handleLoadedData = () => {
      video.play().catch(error => {
        console.warn('Автовоспроизведение заблокировано:', error);
      });
    };

    // Обработка видимости страницы для оптимизации производительности
    const handleVisibilityChange = () => {
      if (document.hidden) {
        video.pause();
      } else {
        video.play().catch(() => {});
      }
    };

    video.addEventListener('error', handleError);
    video.addEventListener('loadeddata', handleLoadedData);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadeddata', handleLoadedData);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <section className="hero">
      <div className="hero-bg-parallax">
        <video 
          ref={videoRef}
          className="hero-bg-video" 
          autoPlay 
          loop 
          muted 
          playsInline
          preload="metadata"
          poster="/logo192.png"
          disablePictureInPicture
          disableRemotePlayback
        >
          <source src="/Фейеро8В.mp4" type="video/mp4" />
          Ваш браузер не поддерживает видео.
        </video>
      </div>
    </section>
  );
} 