import React, { useState, useRef } from "react";
import { MdOutlinePhotoCamera, MdOutlineConstruction, MdOutlineAccessTime } from 'react-icons/md';
import Carousel from "./Carousel";
import "./Catalogs.css";

function Catalog({ title, badge, description, icon, info, video, poster, isInDevelopment, onShowDetails, videoData }) {
  const isMain = description === 'Презентация вашей пары-ваша ожившая история';
  const handleTimeUpdate = (e) => {
    if (e.target.currentTime > 30) {
      e.target.currentTime = 0;
      e.target.play();
    }
  };
  
  if (isInDevelopment) {
    // Выбираем видео в зависимости от секции
    const developmentVideo = title?.includes('Welcome') ? '/video5193080489858068792.mp4' : '/compressed_Приглашение6В.mp4';
    
    return (
      <div className="catalog-window wow-catalog development-card">
        <div className="development-overlay">
          <MdOutlineConstruction size={48} color="#BFD7ED" />
          <div className="development-text">В разработке</div>
          <div className="development-subtext">Скоро будет готово</div>
        </div>
        <div className="catalog-video-preview wow-preview development-preview">
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
              borderRadius: '18px', 
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

  return (
    <div className="catalog-window wow-catalog">
      <div className="catalog-title-row">
        {isMain && (
          <>
            <div className="catalog-title javanese-title">Презентация вашей пары<br/>— ваша ожившая история</div>
            <div className="catalog-under-title" style={{
              fontSize: '1.08rem', color: '#fff', textAlign: 'center', marginBottom: 18, lineHeight: 1.3, fontWeight: 400, opacity: 0.92
            }}>
              Главная часть вашей свадьбы.<br/>Расскажите свою историю!
            </div>
          </>
        )}

      </div>
      <div className="catalog-video-preview wow-preview">
        {video ? (
          video.includes('drive.google.com') || video.includes('youtube.com') ? (
            <iframe 
              src={video} 
              style={{
                width: '100%', 
                height: '100%', 
                border: 'none', 
                borderRadius: '18px', 
                border: '2.5px solid #BFD7ED', 
                boxShadow: '0 4px 24px #BFD7ED33'
              }}
              allowFullScreen
              allow="autoplay; encrypted-media"
            />
          ) : (
            <video autoPlay loop muted playsInline preload="metadata" poster={poster || "/logo192.png"} style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: '18px', border: '2.5px solid #BFD7ED', boxShadow: '0 4px 24px #BFD7ED33'}} onTimeUpdate={handleTimeUpdate}>
              <source src={video} type="video/mp4" />
              Ваш браузер не поддерживает видео.
            </video>
          )
        ) : null}
      </div>
      <button className="carousel-order-btn" onClick={() => {
        console.log('Кнопка "Подробнее" нажата!');
        if (onShowDetails) {
          onShowDetails(videoData);
        }
      }}><span className="order-text">Подробнее</span></button>
    </div>
  );
}

function CatalogCarousel({ title, items, onShowDetails }) {
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
        {items.map((cat, i) => <Catalog key={cat.title + i} {...cat} onShowDetails={onShowDetails} />)}
      </div>
    </div>
  );
}

export default function Catalogs({ onShowDetails }) {
  const presentations = [
    { 
      title: '', 
      badge: '', 
      description: 'Презентация вашей пары-ваша ожившая история', 
      icon: <MdOutlinePhotoCamera size={28} color="#a18fff" />, 
      info: '5 минут', 
      video: '/video5193080489858068792.mp4', 
      poster: '/svadbabg.jpeg',
      isMain: true,
      videoData: {
        title: 'Презентация вашей пары',
        video: '/video5193080489858068792.mp4',
        description: 'Ваша ожившая история',
        isVertical: false,
        content: 'Главная часть вашего праздника — презентация молодоженов. Мы создаем уникальные слайд-шоу, которые рассказывают историю вашей любви через ваши лучшие фотографии. Профессиональный монтаж, трогательная музыка и красивые эффекты сделают этот момент незабываемым.',
        features: [
          'Профессиональный монтаж с плавными переходами',
          'Подбор и наложение трогательной музыки',
          'Специальные эффекты и анимации',
          'Цветокоррекция и улучшение качества фото',
          'Длительность 5-7 минут',
          'Готовое видео в высоком качестве'
        ],
        price: 'от 7 000 ₽',
        timeline: 'Создание презентации займет 3-5 дней после получения ваших фотографий. Мы создадим несколько вариантов и выберем лучший вместе с вами.'
      }
    },
  ];
  const welcomeItems = [
    { 
      video: '/video5193080489858068792.mp4', 
      poster: '/svadbabg.jpeg',
      videoData: {
        title: 'Велком-видео',
        video: '/video5193080489858068792.mp4',
        description: 'Видео-фон из ваших ФОТО',
        isVertical: false,
        content: 'Welcome-видео создает атмосферу праздника с самого начала. Это красивый видеофон из ваших лучших фотографий, который будет транслироваться на экранах во время встречи гостей. Создает настроение и подготавливает всех к торжеству.',
        features: [
          'Видеофон из ваших лучших фотографий',
          'Красивые переходы и эффекты',
          'Подходящая атмосферная музыка',
          'Длительность 10-15 минут (зацикленное)',
          'Адаптация для любых экранов и проекторов',
          'Готово для воспроизведения на празднике'
        ],
        price: 'от 4 000 ₽',
        timeline: 'Создание Welcome-видео займет 2-3 дня. Мы создадим атмосферный видеофон, который идеально подойдет для встречи гостей.'
      }
    },
    { isInDevelopment: true, title: 'Welcome-видео' },
    { isInDevelopment: true, title: 'Welcome-видео' },
    { isInDevelopment: true, title: 'Welcome-видео' },
  ];
  const inviteItems = [
    { 
      video: '/compressed_Приглашение6В.mp4', 
      poster: '/svadbabg.jpeg',
      videoData: {
        title: 'Видео-приглашения',
        video: '/compressed_Приглашение6В.mp4',
        description: 'Ваш праздник запомнят ещё с приглашения!',
        isVertical: true,
        content: 'Пригласите своих гостей красиво! Персональные видео-приглашения произведут неизгладимое впечатление на ваших близких. Мы создаем уникальные приглашения с вашими фотографиями, которые точно не останутся незамеченными.',
        features: [
          'Персональные видео-приглашения для каждого гостя',
          'Красивая анимация и переходы',
          'Торжественная музыка',
          'Длительность 1-2 минуты',
          'Удобный формат для отправки',
          'Высокое качество и профессиональный дизайн'
        ],
        price: 'от 3 000 ₽',
        timeline: 'Создание видео-приглашений займет 1-2 дня. Мы создадим шаблон, а затем адаптируем его для каждого гостя.'
      }
    },
    { isInDevelopment: true, title: 'Видео-приглашения' },
    { isInDevelopment: true, title: 'Видео-приглашения' },
    { isInDevelopment: true, title: 'Видео-приглашения' },
  ];
  return (
    <section className="catalogs-multi" id="catalogs">
      <CatalogCarousel title="" items={presentations} onShowDetails={onShowDetails} />
      <section className="catalog-section">
        <h2 className="catalog-main-title" style={{textAlign:'center', marginTop:40, marginBottom:8}}>Welcome-видео</h2>
        <div className="catalog-mini-desc" style={{textAlign:'center', marginBottom:24}}>Видео-фон из ваших ФОТО<br/>Покажите свои лучшие моменты</div>
        <Carousel items={welcomeItems} onShowDetails={onShowDetails} />
      </section>
      <section className="catalog-section">
        <h2 className="catalog-main-title" style={{textAlign:'center', marginTop:40, marginBottom:8}}>Видео-приглашения</h2>
        <div className="catalog-mini-desc" style={{textAlign:'center', marginBottom:24}}>Ваш праздник запомнят ещё с приглашения!</div>
        <Carousel items={inviteItems} onShowDetails={onShowDetails} />
      </section>
    </section>
  );
} 