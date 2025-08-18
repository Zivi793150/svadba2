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
        content: `Расскажите вашим гостям вашу историю.

Главная часть вашей свадьбы — это рассказать вашим гостям о вас, ваших близких и вашей истории любви.

По статистике далеко не все гости знают даже главные факты из жизни молодожёнов, на чью свадьбу они приглашены.

Мы создадим из ваших фото уникальное слайд-видео-шоу, которое не только расскажет вашим друзьям много нового о вас и вашей семье, но и останется ярким эмоциональным впечатлением о вашем празднике, тем что они запомнят навсегда!

А профессиональный монтаж, трогательная музыка и красивые эффекты сделают этот момент незабываемым.

Для заказа презентации необходимо через форму "заказать" сделать предоплату в размере 30% (в случае отказа от заказа предоплата не возвращается), далее вам будет прислана форма для заполнения ваших фото и текста. После получения материалов мы приступаем к изготовлению. Сроки и цены смотрите ниже.

- Длительность видео зависит от количества фото и разворотов альбома. В нашем видео-образце 16 фотографий и 4 разворота. Возможно добавить в презентацию еще 4 фото и сделать дополнительный разворот альбома. Это увеличит его стоимость.

Также длительность видео зависит от объема текста в описании фото. Рекомендуем не делать описания слишком большим. Только главное. На цену это не влияет.

- В образце презентации все фото «оживлены». Можно заказать презентацию и без оживления. Это сократит время создания видео и снизит его стоимость.

- Пока музыкальное оформление презентации тоже только в одном варианте. В дальнейшем будут добавлены и другие аудио-подложки.

После завершения мы присылаем вам видео на согласование. Допускается 1 правка по тексту.

Стоимость и сроки:

Презентация без оживления фото (фото без движения) и описанием к каждому фото на 300 символов (как
в шаблоне):

4 разворота (16 фото, 6:23 мин) – 10000р / срок 3-4 дня
5 разворотов (20 фото, 8 мин) – 10500 / срок 3-4  дня 
6 разворотов (24 фото, 10 мин) – 11000 / срок 4-5 дней 
7 разворотов (28 фото, 12 мин) – 11500 / срок 4-5 дней

Цены с оживлением фото и текстом в описании к каждому фото 300 символов (как шаблон):
4 разворота (16 фото,
6:23 мин) – 12000р / срок 4-5 дней
5 разворотов (20 фото, 8 мин) – 1300 / срок 4-5  дней 
6 разворотов (24 фото, 10 мин) – 13500 / срок 5-6 дней 
7 разворотов (28 фото, 12 мин) – 14000 / срок 5-6 дней

За каждые 300+ символов к тексту для фото - 200р (рекомендация:
оставлять текст на 300 символов под каждое фото, иначе будет смотреться занудно. Если хочется больше описания — добавляйте лучше фотографии и развороты,
будет смотреться намного лучше)

Сроки могут варьироваться в зависимости от загруженности и сложности работы. Увеличиваться  по
согласованию с заказчиком. 
Все остальные вопросы вы можете задать в чате.`,
        features: [
          '16 фотографий и 4 разворота в базовом варианте',
          'Возможность добавить еще 4 фото и дополнительный разворот',
          'Оживление фотографий (опционально)',
          'Профессиональный монтаж с плавными переходами',
          'Трогательная музыка (в дальнейшем будут добавлены варианты)',
          'Красивые эффекты и анимации',
          'Длительность зависит от количества фото и разворотов',
          'Описание фото (рекомендуется краткое)'
        ]
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
        content: `Пригласите своих гостей феерично и создайте WOW-эффект еще в самом начале!

Наши персональные видео-приглашения удивят и произведут WOW– эффект на ваших гостей. Они запомнят вашу свадьбу еще с приглашения и точно
захотят на нее прийти.
Возможно сделать просто приглашение, одинаковое для всех, без обращения к гостю. без имени вначале.  А можно сделать именное приглашение для каждого, как в шаблоне. 
гостя отдельно. 
Стоимость и сроки: 
Неименное приглашение: 
замена информации о мероприятии без имени – 3000 р./ срок – 1 день
 Именное приглашение:  
С обращением и указанием каждого имени вначале: 
до 25 имен – 4000 р, 
до 50 имен – 5000 р, 
 51-100 имен – 7000 р 
Срок исполнения 3-5 дней, возможно быстрее по загруженности.`,
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