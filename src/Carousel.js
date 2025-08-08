import React, { useRef } from 'react';
import { MdOutlineConstruction, MdOutlineAccessTime } from 'react-icons/md';
import './Carousel.css';

const Carousel = ({ items = [] }) => {
  const carouselRef = useRef(null);
  const handleTimeUpdate = (e) => {
    if (e.target.currentTime > 30) {
      e.target.currentTime = 0;
      e.target.play();
    }
  };

  // Прокрутка влево/вправо
  const scroll = (direction) => {
    const node = carouselRef.current;
    if (!node) return;
    const cardWidth = node.firstChild ? node.firstChild.offsetWidth : 0;
    node.scrollBy({ left: direction * (cardWidth + 24), behavior: 'smooth' });
  };

  // Свайп для мобильных
  let startX = null;
  let startY = null;
  const onTouchStart = (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  };
  const onTouchEnd = (e) => {
    if (startX === null || startY === null) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = endX - startX;
    const diffY = endY - startY;
    
    // Проверяем, что свайп больше горизонтальный, чем вертикальный
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 30) {
      scroll(diffX < 0 ? 1 : -1);
    }
    startX = null;
    startY = null;
  };

  return (
    <div className="carousel-outer">
      <div
        className="carousel-list"
        ref={carouselRef}
        style={{ touchAction: 'pan-x', overflowX: 'auto', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {items.map((item, idx) => {
          // Если карточка в разработке
          if (item.isInDevelopment) {
            const developmentVideo = item.title?.includes('Welcome') ? '/video5193080489858068792.mp4' : '/compressed_Приглашение6В.mp4';
            
            return (
              <div className="carousel-card development-card" key={idx} style={{ scrollSnapAlign: 'start' }}>
                <div className="development-overlay">
                  <MdOutlineConstruction size={48} color="#BFD7ED" />
                  <div className="development-text">В разработке</div>
                  <div className="development-subtext">Скоро будет готово</div>
                </div>
                <div className="card-video development-preview">
                  <video 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    preload="metadata" 
                    poster="/logo192.png"
                    style={{
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover', 
                      display: 'block', 
                      borderRadius: '16px', 
                      filter: 'blur(8px) brightness(0.3)',
                      opacity: 0.6
                    }}
                  >
                    <source src={developmentVideo} type="video/mp4" />
                  </video>
                  <div className="development-placeholder">
                    <MdOutlineAccessTime size={32} color="#7CA7CE" />
                    <div className="placeholder-text">Подготовка контента</div>
                  </div>
                </div>
              </div>
            );
          }

          // Обычная карточка
          return (
            <div className="carousel-card" key={idx} style={{ scrollSnapAlign: 'start' }}>
              <div className="card-video">
                {item.video ? (
                  <video
                    src={item.video}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    poster={item.poster || "/logo192.png"}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: '16px' }}
                    onTimeUpdate={handleTimeUpdate}
                  />
                ) : null}
              </div>
              <button className="carousel-order-btn">
                <span className="order-text">Заказать</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Carousel; 