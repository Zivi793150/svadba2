import React, { useState, useRef, useEffect } from "react";
import { MdOutlinePhotoCamera, MdOutlineConstruction, MdOutlineAccessTime } from 'react-icons/md';
import Carousel from "./Carousel";
import "./Catalogs.css";

function Catalog({ title, badge, description, icon, info, video, poster, isInDevelopment, onShowDetails, videoData }) {
  const isMain = description === 'Презентация вашей пары-ваша ожившая история';
  const [isAltPromo, setIsAltPromo] = useState(false);

  useEffect(() => {
    const isMobileDevice = (() => {
      if (typeof window !== 'undefined' && window.matchMedia) {
        try {
          if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) return true;
        } catch (_) {}
      }
      if (typeof navigator !== 'undefined') {
        return /Mobi|Android|iPhone|iPad|iPod|Windows Phone|Mobile/i.test(navigator.userAgent);
      }
      return false;
    })();
    const intervalMs = isMobileDevice ? 15000 : 30000;
    const id = setInterval(() => setIsAltPromo(prev => !prev), intervalMs);
    return () => clearInterval(id);
  }, []);
  const handleTimeUpdate = (e) => {
    if (e.target.currentTime > 30) {
      e.target.currentTime = 0;
      e.target.play();
    }
  };
  
  if (isInDevelopment) {
    // Выбираем видео в зависимости от секции
    const developmentVideo = title?.includes('Велком') ? '/video5193080489858068792.mp4' : '/compressed_Приглашение6В.mp4';
    
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

  const isVertical = videoData?.isVertical;
  const useRibbon = isVertical || isMain;
  return (
    <div className="catalog-window wow-catalog">
      {useRibbon ? (
        <div className={`promo-ribbon${isAltPromo ? ' is-alt' : ''}`} title="Цены снижены на период разработки сайта">
          <span className="r-def">АКЦИЯ</span>
          <span className="r-hov">СНИЖЕННЫЕ ЦЕНЫ</span>
        </div>
      ) : (
        <div className={`promo-badge promo-bottom${isAltPromo ? ' is-alt' : ''}`} title="Цены снижены на период разработки сайта">
          <span className="b-def">Акция</span>
          <span className="b-hov">Сниженные цены</span>
        </div>
      )}
      <div className="catalog-title-row">
        {isMain && (
          <>
            <div className="catalog-title javanese-title">Свадебная презентация вашей пары<br/>— ваша ожившая история</div>
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
      <button className="carousel-order-btn" data-analytics-id="details_presentation" data-analytics-text="Подробнее — Свадебная презентация" onClick={() => {
        console.log('Кнопка "Подробнее" нажата!');
        if (onShowDetails) {
          onShowDetails(videoData);
          // аналитика: просмотр карточки и клик "Подробнее"
          if (window.trackProductView) {
            window.trackProductView('presentation', videoData?.title || 'Свадебная презентация');
          }
          if (window.trackDetailsClick) {
            window.trackDetailsClick('details_presentation');
          }
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
        title: 'Свадебная презентация вашей пары',
        video: '/video5193080489858068792.mp4',
        description: 'Ваша ожившая история',
        isVertical: false,
        content: `Ваша история любви — должна стать сердцем вашего торжества.

Большинство гостей не знают о молодожёнах порой даже самых главных фактов.

Расскажите о себе и своих близких так чтобы они запомнили этот момент навсегда. Мы превратим ваши любимые фотографии в кинематографичное видео‑шоу — с чёткой драматургией, красивыми переходами и музыкой — чтобы это тронуло до слез каждого.

Общая информация

1. Экран: Для данного видео необходим экран с пропорциями 16:9 или 16:10. Для экрана других пропорций его придется изменять. Если у вас экран с другими пропорциями- сообщите нам его размеры (ширину и длину) — мы скажем возможно ли адаптировать видео под него.

Под вертикальный экран его адаптировать нельзя.

2. Если вам нужно найти и подобрать экран - сообщите нам дату мероприятия и мы поможем вам организовать свое свадебное видео-шоу.

3. Длительность презентации зависит от количества фото и разворотов. В шаблоне: 4 разворота (16 фото). Можно добавить развороты.

4. Описания к фото — до~300 символов. Если нужно большее описание, лучше добавить фото и развороты, чтобы не перегружать текстом.

5. Оживление фото (как в шаблоне). Можно заказать презентацию и без оживления.

6. Музыкальная подбложка пока в одном варианте;

7. Процесс: предоплата 30% → получаете форму → заполняете фото и тексты → 1 правка по тексту → финал и доплата 70% → отправка готового видео.

Стоимость и сроки:

Презентация без оживления фото (фото без движения) и описанием до 300 символов к каждому фото:

4 разворота (16 фото, 6:23 мин) – 8000р / срок 3–4 дня
5 разворотов (20 фото, 8 мин) – 8500р /срок 3–4 дня
6 разворотов (24 фото, 10 мин) – 9000р / срок 4–5 дней
7 разворотов (28 фото, 12 мин) – 9500р / срок 4–5 дней

Цены с оживлением фото и описанием до 300 символов:

4 разворота (16 фото, 6:23 мин) – 10000р/ срок 4–5 дней
5 разворотов (20 фото, 8 мин) – 11000р / срок 4–5 дней
6 разворотов (24 фото, 10 мин) – 11500р / срок 5–6 дней
7 разворотов (28 фото, 12 мин) – 12000р / срок 5–6 дней

За каждые 300+ символов сверх +200р (рекомендация: лучше добавляйте фото и развороты — так презентация будет смотреться интереснее).

Сроки могут варьироваться от сложности и загруженности — все по согласованию. Все вопросы можно задать в чате.

Нет экрана? - Мы поможем все организовать`,
        features: []
      }
    },
  ];
  const welcomeItems = [
    { 
      title: 'Велком-видео',
      isInDevelopment: true,
      video: '/video5193080489858068792.mp4', 
      poster: '/svadbabg.jpeg',
      videoData: {
        title: 'Велком-видео',
        video: '/video5193080489858068792.mp4',
        description: 'Видео-фон из ваших ФОТО',
        isVertical: false,
        content: 'Велком-видео создает атмосферу праздника с самого начала. Это красивый видеофон из ваших лучших фотографий, который будет транслироваться на экранах во время встречи гостей. Создает настроение и подготавливает всех к торжеству.',
        features: [
          'Видеофон из ваших лучших фотографий',
          'Красивые переходы и эффекты',
          'Подходящая атмосферная музыка',
          'Длительность 10-15 минут (зацикленное)',
          'Адаптация для любых экранов и проекторов',
          'Готово для воспроизведения на празднике'
        ]
      }
    },
    { isInDevelopment: true, title: 'Велком-видео' },
    { isInDevelopment: true, title: 'Велком-видео' },
    { isInDevelopment: true, title: 'Велком-видео' },
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
        content: `Пригласите своих гостей так, чтобы они были удивлены и впечатлены еще до праздника, и обязательно пришли на вашу свадьбу.

Персональные именные видео‑приглашения производят "вау"-эффект с первых секунд. Гости почувствуют силу вашей любви уже с момента приглашения!

Стоимость и сроки:

• Неименное приглашение — замена информации о мероприятии без имён: 2000р / срок 1 день

• Именное приглашение (с именем каждого гостя):
до 25 имён — 3000р
до 50 имён — 4000р
51–100 имён — 5000р
Срок исполнения 2–5 дней (возможно быстрее при невысокой загруженности).`,
        features: [
          'Персональные видео-приглашения для каждого гостя',
          'Красивая анимация и переходы',
          'Торжественная музыка',
          'Длительность 1-2 минуты',
          'Удобный формат для отправки',
          'Высокое качество и профессиональный дизайн'
        ]
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
        <h2 className="catalog-main-title" style={{textAlign:'center', marginTop:40, marginBottom:8}}>Велком-видео</h2>
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