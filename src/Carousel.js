import React, { useRef } from 'react';
import { MdOutlineConstruction, MdOutlineAccessTime } from 'react-icons/md';
import './Carousel.css';

const Carousel = ({ items = [], onShowDetails }) => {
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
            const developmentVideo = item.title?.includes('Велком') ? '/video5193080489858068792.mp4' : '/compressed_Приглашение6В.mp4';
            
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
                <button className="carousel-order-btn" data-analytics-id="details_development" data-analytics-text={`Подробнее — ${item.title || item?.videoData?.title || 'В разработке'}`} onClick={() => {
                  console.log('Кнопка "Подробнее" нажата для карточки в разработке!');
                  if (onShowDetails) {
                    onShowDetails(item.videoData);
                  }
                }}>
                  <span className="order-text">Подробнее</span>
                </button>
              </div>
            );
          }

          // Обычная карточка
          const isVertical = item?.videoData?.isVertical;
          const useRibbon = !!(isVertical || item?.title === '' || item?.videoData?.title?.includes('Свадебная презентация'));
          return (
            <div className="carousel-card" key={idx} style={{ scrollSnapAlign: 'start' }}>
              {useRibbon ? (
                <div className="promo-ribbon" title="Цены снижены на период разработки сайта">
                  <span className="r-def">АКЦИЯ</span>
                  <span className="r-hov">СНИЖЕННЫЕ ЦЕНЫ</span>
                </div>
              ) : (
                <div className="promo-badge promo-bottom" title="Цены снижены на период разработки сайта">
                  <span className="b-def">Акция</span>
                  <span className="b-hov">Сниженные цены</span>
                </div>
              )}
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
              <button className="carousel-order-btn" data-analytics-id={item?.videoData?.isVertical ? 'details_invitation' : 'details_presentation'} data-analytics-text={`Подробнее — ${item?.videoData?.title || item.title || 'Карточка'}`} onClick={() => {
                console.log('Кнопка "Подробнее" нажата в карусели!');
                if (onShowDetails) {
                  onShowDetails(item.videoData);
                  // аналитика: просмотр карточки и клик "Подробнее"
                  if (window.trackProductView) {
                    const type = item?.videoData?.isVertical ? 'invitation' : 'presentation';
                    window.trackProductView(type, item?.videoData?.title || item.title || 'Карточка');
                  }
                  if (window.trackDetailsClick) {
                    window.trackDetailsClick(item?.videoData?.isVertical ? 'details_invitation' : 'details_presentation');
                  }
                }
              }}>
                <span className="order-text">Подробнее</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Carousel; 