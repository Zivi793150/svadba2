import React, { useRef } from 'react';
import './Carousel.css';

const Carousel = ({ items = [] }) => {
  const carouselRef = useRef(null);

  // Прокрутка влево/вправо
  const scroll = (direction) => {
    const node = carouselRef.current;
    if (!node) return;
    const cardWidth = node.firstChild ? node.firstChild.offsetWidth : 0;
    node.scrollBy({ left: direction * (cardWidth + 24), behavior: 'smooth' });
  };

  // Свайп для мобильных
  let startX = null;
  const onTouchStart = (e) => {
    startX = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (startX === null) return;
    const endX = e.changedTouches[0].clientX;
    const diff = endX - startX;
    if (Math.abs(diff) > 50) {
      scroll(diff < 0 ? 1 : -1);
    }
    startX = null;
  };

  return (
    <div className="carousel-outer">
      <button className="carousel-arrow left" onClick={() => scroll(-1)} aria-label="Назад">
        &#8592;
      </button>
      <div
        className="carousel-list"
        ref={carouselRef}
        style={{ touchAction: 'pan-x', overflowX: 'auto', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
      >
        {items.map((item, idx) => (
          <div className="carousel-card" key={idx} style={{ scrollSnapAlign: 'start' }}>
            <div className="card-video">
              <video
                src={item.video}
                autoPlay
                loop
                muted
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: '16px' }}
              />
            </div>
            <button className="carousel-order-btn">
              <span role="img" aria-label="Фейерверк">🎆</span> <span className="order-text">Заказать</span>
            </button>
          </div>
        ))}
      </div>
      <button className="carousel-arrow right" onClick={() => scroll(1)} aria-label="Вперёд">
        &#8594;
      </button>
    </div>
  );
};

export default Carousel; 