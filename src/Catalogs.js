import React, { useState, useRef } from "react";
import { MdOutlinePhotoCamera } from 'react-icons/md';
import Carousel from "./Carousel";
import "./Catalogs.css";

function Catalog({ title, badge, description, icon, info }) {
  const isMain = description === 'Новобрачная презентация';
  return (
    <div className="catalog-window wow-catalog">
      <div className="catalog-title-row">
        {isMain && (
          <>
            <div className="catalog-title">Новобрачная презентация</div>
            <div style={{
              fontSize: '1.08rem', color: '#fff', textAlign: 'center', marginBottom: 18, lineHeight: 1.3, fontWeight: 400, opacity: 0.92
            }}>
              Главная часть вашего праздника.<br/>Расскажите свою историю!
            </div>
          </>
        )}
      </div>
      <div className="catalog-video-preview wow-preview">
        <video autoPlay loop muted playsInline poster="/logo192.png" style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: '18px', border: '2.5px solid #BFD7ED', boxShadow: '0 4px 24px #BFD7ED33'}}>
          <source src="/stock-footage-fireworks-celebration-k-video-clip-alpha-channel-ready-isolated-transparent-background.mp4" type="video/mp4" />
          Ваш браузер не поддерживает видео.
        </video>
      </div>
      <button className="catalog-order-btn"><span className="firework-emoji">🎆</span> <span className="order-text">Заказать</span></button>
    </div>
  );
}

function CatalogCarousel({ title, items }) {
  const scrollRef = useRef();
  const [scroll, setScroll] = useState(0);
  const cardWidth = 340 + 32; // ширина карточки + gap
  const visibleCount = 3;
  const canScrollLeft = scroll > 0;
  const canScrollRight = scroll < items.length - visibleCount;

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -cardWidth, behavior: 'smooth' });
      setScroll(s => Math.max(0, s - 1));
    }
  };
  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' });
      setScroll(s => Math.min(items.length - visibleCount, s + 1));
    }
  };

  return (
    <div className="catalog-carousel">
      <div className="catalog-carousel-header">
        {items.length > 1 && (
          <div className="catalog-carousel-arrows">
            <button className="carousel-arrow" onClick={scrollLeft} disabled={!canScrollLeft} aria-label="Влево">&#8592;</button>
            <button className="carousel-arrow" onClick={scrollRight} disabled={!canScrollRight} aria-label="Вправо">&#8594;</button>
          </div>
        )}
      </div>
      <div className="catalog-carousel-list" ref={scrollRef} tabIndex={0}>
        {items.map((cat, i) => <Catalog key={cat.title + i} {...cat} />)}
      </div>
    </div>
  );
}

export default function Catalogs() {
  const presentations = [
    { title: '', badge: '', description: 'Новобрачная презентация', icon: <MdOutlinePhotoCamera size={28} color="#a18fff" />, info: '5 минут' },
  ];
  const welcomeItems = [
    { video: '/ФейероТест3В.mp4', poster: '/svadbabg.jpeg' },
    { video: '/stock-footage-fireworks-celebration-k-video-clip-alpha-channel-ready-isolated-transparent-background.mp4', poster: '/svadbabg.jpeg' },
    { video: '/ФейероТест3В.mp4', poster: '/svadbabg.jpeg' },
    { video: '/stock-footage-fireworks-celebration-k-video-clip-alpha-channel-ready-isolated-transparent-background.mp4', poster: '/svadbabg.jpeg' },
  ];
  const inviteItems = [
    { video: '/stock-footage-fireworks-celebration-k-video-clip-alpha-channel-ready-isolated-transparent-background.mp4', poster: '/svadbabg.jpeg' },
    { video: '/ФейероТест3В.mp4', poster: '/svadbabg.jpeg' },
    { video: '/stock-footage-fireworks-celebration-k-video-clip-alpha-channel-ready-isolated-transparent-background.mp4', poster: '/svadbabg.jpeg' },
    { video: '/ФейероТест3В.mp4', poster: '/svadbabg.jpeg' },
  ];
  return (
    <section className="catalogs-multi" id="catalogs">
      <CatalogCarousel title="" items={presentations} />
      <section className="catalog-section">
        <h2 className="catalog-main-title" style={{textAlign:'center', marginTop:40, marginBottom:8}}>Welcome-видео</h2>
        <div className="catalog-mini-desc" style={{textAlign:'center', marginBottom:24}}>Видеофон из ваших фото</div>
        <Carousel items={welcomeItems} />
      </section>
      <section className="catalog-section">
        <h2 className="catalog-main-title" style={{textAlign:'center', marginTop:40, marginBottom:8}}>Видео-приглашения</h2>
        <div className="catalog-mini-desc" style={{textAlign:'center', marginBottom:24}}>Праздник начинается с приглашения</div>
        <Carousel items={inviteItems} />
      </section>
    </section>
  );
} 