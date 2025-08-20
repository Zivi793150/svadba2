import React, { useRef, useEffect, useMemo, useState } from 'react';
import { FaArrowLeft, FaWhatsapp } from 'react-icons/fa';
import { FaTelegramPlane } from 'react-icons/fa';
import './SlideshowDetails.css';

export default function SlideshowDetails({ onClose, onContactClick, videoData, onOrder }) {
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [pollOrderAnswer, setPollOrderAnswer] = useState(null);
  const [pollWeddingAnswer, setPollWeddingAnswer] = useState(null);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const generalInfoWedding = `1. Сначала до заказа необходимо  определиться с экраном, который хотите использовать для демонстрации.
Для показа подойдут не все экраны, а только с пропорциями 16:9 и 16:10. Уточните пропорции у владельца экрана, а также его размер, и сообщите нам перед заказом.
Чтобы посмотреть как примерно будет выглядеть  ваше презентация на этом экране – можете скачать наш образец и попросить ее посмотреть на нём.

2. Длительность видео зависит от количества  фото и разворотов альбома.
В нашем видео-образце 16 фотографий и 4 разворота. Возможно добавить в  презентацию дополнительные развороты (каждый разворот – 4 фото).
Цена каждого дополнительного разворота  + 500- 1000 руб.
Также длительность видео зависит от объема текста в описании фото.
В шаблоне в описании к фото не больше 300 символов. Рекомендуем оставлять не делать  описание к одному фото больше. Это будет выглядеть затянуто и занудно.. Только главное.
Чтобы сделать описание (например биографию мамы) больше - лучше добавлять фото и развороты.. Будет выглядеть интересно!

3. В шаблоне презентации все фото «оживлены». Можно заказать презентацию и без оживления. Оживление стоит + 2000 (16 фотографий). И добавляет к сроку изготовления 1-2 дня.

4. Пока музыкальное оформление презентации тоже возможно только в одном варианте.
В дальнейшем будут добавлены и другие аудио-подложки на выбор.

5. После того как определитесь с экраном, для заказа через форму «заказать», нужно сделать предоплату в размере 30% (в случае отказа от заказа предоплата не возвращается). После чего вам будет выслана форма для заполнения фото и текста. Очень тщательно  подойдите к подбору фотографий. выберите ваши любимые фото из вашего детства, школьных лет, студенчества и конечно же ваши лучшие совместные фото.
после оформления заказа мы вышлем вам форму для заполнения фото и описания. заполните туда все фото и текст.
После получения материалов мы приступаем к производству.
После окончания мы предоставляем вам видео на согласование. Допускается только 1 правка в тексте. Так что фото подбирайте очень обдуманно. После правки и окончательного согласования вашей презентации вам нужно доплатить 70 % стоимости и мы  пришлем вам вашу свадебную презентацию на почту.`;

  // Блокируем скролл основной страницы при открытии модального окна
  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  // Фиксируем просмотр карточки при открытии деталей
  useEffect(() => {
    if (videoData && window.trackProductView) {
      const type = videoData.isVertical ? 'invitation' : 'presentation';
      const title = videoData.title || (videoData.isVertical ? 'Видео-приглашения' : 'Свадебная презентация');
      window.trackProductView(type, title);
    }
  }, [videoData]);

  // Показать опросник в конце скролла (1 раз за посещение)
  useEffect(() => {
    const node = overlayRef.current;
    if (!node) return;
    const onScroll = () => {
      const el = node.querySelector('.page-content');
      if (!el) return;
      const { scrollTop } = node;
      const maxScroll = el.scrollHeight - node.clientHeight - 40;
      const alreadyShown = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('surveyShownV1') === '1';
      if (scrollTop >= maxScroll && !showSurveyModal && !alreadyShown) {
        setShowSurveyModal(true);
        try { sessionStorage.setItem('surveyShownV1', '1'); } catch (_) {}
      }
    };
    node.addEventListener('scroll', onScroll, { passive: true });
    return () => node.removeEventListener('scroll', onScroll);
  }, [showSurveyModal]);

  const API_URL = 'https://svadba2.onrender.com';
  const trackConversion = async (action, metadata) => {
    try {
      if (window.trackConversion) {
        window.trackConversion(action, { page: '/details', metadata });
        return;
      }
      await fetch(`${API_URL}/api/analytics/conversion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, page: '/details', metadata, userAgent: navigator.userAgent })
      });
    } catch (_) {}
  };

  const { descriptionText, pricingText } = useMemo(() => {
    const raw = (videoData?.content || '').trim();
    if (!raw) return { descriptionText: '', pricingText: '' };
    const idx = raw.indexOf('Стоимость');
    if (idx === -1) return { descriptionText: raw, pricingText: '' };
    return { descriptionText: raw.slice(0, idx).trim(), pricingText: raw.slice(idx).trim() };
  }, [videoData?.content]);

  const condensedInfo = useMemo(() => ([
    'Экран: пропорции 16:9 или 16:10. Сообщите точный размер — мы адаптируем видео.',
    'Длительность зависит от количества фото и разворотов. Базово: 16 фото и 4 разворота; можно добавить.',
    'Описания к фото — до ~300 символов. Если нужно больше, лучше добавить фото/развороты, чтобы не перегружать.',
    'Оживление фото — опционально (+2000 ₽ за 16 фото) и +1–2 дня к сроку.',
    'Музыка пока в одном варианте; со временем добавим выбор.',
    'Процесс: предоплата 30% → получаете форму → заполняете фото и тексты → 1 правка по тексту → финал и доплата 70% → отправка готового видео.'
  ]), []);

  const handleSubmitRating = (value) => {
    setRatingValue(value);
    setRatingSubmitted(true);
    trackConversion('rating_submit', { value, product: videoData?.title || 'unknown' });
  };

  const handlePollOrder = (answer) => {
    setPollOrderAnswer(answer);
    trackConversion('poll_would_order', { answer, product: videoData?.title || 'unknown' });
  };

  const handlePollWedding = (answer) => {
    setPollWeddingAnswer(answer);
    trackConversion('poll_would_have', { answer, product: videoData?.title || 'unknown' });
  };

  const closeSurvey = () => {
    try { sessionStorage.setItem('surveyShownV1', '1'); } catch (_) {}
    setShowSurveyModal(false);
  };

  // Выбор экрана
  const screenOptions = useMemo(() => ([
    { label: '1920×1080', aspect: '16:9' },
    { label: '1280×720', aspect: '16:9' },
    { label: '1366×768', aspect: '16:9' },
    { label: '2560×1440', aspect: '16:9' },
    { label: '1920×1200', aspect: '16:10' },
    { label: '1280×800', aspect: '16:10' }
  ]), []);
  const [selectedScreen, setSelectedScreen] = useState(null);
  const [customScreen, setCustomScreen] = useState('');
  const normalizedCustom = useMemo(() => {
    const m = (customScreen || '').replace(/\s+/g, '').match(/^(\d{3,5})[x×](\d{3,5})$/i);
    if (!m) return null;
    const w = parseInt(m[1], 10);
    const h = parseInt(m[2], 10);
    if (!w || !h) return null;
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    const g = gcd(w, h);
    const arW = Math.round(w / g);
    const arH = Math.round(h / g);
    return { label: `${w}×${h}`, aspect: `${arW}:${arH}` };
  }, [customScreen]);

  const proceedWithScreen = () => {
    const sel = selectedScreen || normalizedCustom;
    if (!sel) return;
    try {
      localStorage.setItem('screenSelection', JSON.stringify(sel));
    } catch (_) {}
    trackConversion('screen_select', { resolution: sel.label, aspect: sel.aspect, product: videoData?.title || 'unknown' });
    if (onOrder) onOrder();
    if (window.trackOrderPage) window.trackOrderPage();
  };

  const handleWhatsAppClick = () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const botPhone = '79004511777'; // Номер WhatsApp бота
    const message = encodeURIComponent('/start');

    if (isMobile) {
      window.location.href = `whatsapp://send?phone=${botPhone}&text=${message}`;
    } else {
      window.open(`https://web.whatsapp.com/send?phone=${botPhone}&text=${message}`, '_blank');
    }
    
    // Отслеживаем клик по WhatsApp
    if (window.trackWhatsAppClick) {
      window.trackWhatsAppClick();
    }
  };

  const handleTelegramClick = () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const botUsername = 'feyero_bot'; // Username Telegram бота

    if (isMobile) {
      // Пробуем открыть приложение Telegram напрямую
      window.open(`tg://resolve?domain=${botUsername}&start=`, '_blank');
      // Если не сработало, через 100ms открываем веб-версию
      setTimeout(() => {
        window.open(`https://t.me/${botUsername}?start=`, '_blank');
      }, 100);
    } else {
      // На ПК открываем веб-версию бота
      window.open(`https://t.me/${botUsername}?start=`, '_blank');
    }
    
    // Отслеживаем клик по Telegram
    if (window.trackTelegramClick) {
      window.trackTelegramClick();
    }
  };

  const handleQuestionClick = () => {
    onContactClick();
  };

  return (
    <>
    <div className="slideshow-details-overlay" ref={overlayRef}>
      <div className="slideshow-details-page">
        {/* Заголовок с кнопкой назад */}
        <header className="page-header">
          <button className="back-btn" onClick={onClose}>
            <FaArrowLeft size={20} />
          </button>
          <h1 className="page-title">{videoData?.title || 'Слайд-шоу для вашей свадьбы'}</h1>
        </header>
        
        {/* Основной контент */}
        <main className="page-content">
          {/* Видео по центру */}
          <div className="video-wrapper video-elevated">
            <video 
              ref={videoRef}
              className={`main-video ${videoData?.isVertical ? 'vertical-video' : ''}`}
              controls
            >
              <source src={videoData?.video || './video5193080489858068792.mp4'} type="video/mp4" />
              Ваш браузер не поддерживает видео.
            </video>
          </div>

          {/* Текстовый контент, разбитый на секции */}
          <div className="text-content">
            <h2>{videoData?.description || 'Создайте незабываемое слайд-шоу для вашей свадьбы'}</h2>

            {/* 1. Описание */}
            <section className="info-section">
              <div className="info-card animate-in glow-silver">
                <h3>Описание</h3>
                {descriptionText
                  ? descriptionText.split(/\n\s*\n/).filter(Boolean).slice(0, 2).map((para, idx) => (
                      <p key={`desc-${idx}`}>{para}</p>
                    ))
                  : (
                    <>
                      <p>Мы создаём уникальные слайд‑шоу, которые станут прекрасным дополнением к вашему свадебному торжеству.</p>
                      <p>Профессиональный монтаж, красивая музыка и ваши лучшие фотографии — всё это превратится в трогательную историю вашей любви.</p>
                    </>
                  )}
                </div>
            </section>

            {/* 2. Общая информация (сокращённо) */}
            <section className="info-section">
              <div className="info-card animate-in glow-silver">
                <h3>Общая информация</h3>
                <ol className="gi-list">
                  {condensedInfo.map((p, i) => (
                    <li key={`gi-cond-${i}`}>{p}</li>
                  ))}
                </ol>
              </div>
            </section>

            {/* 3. Цены и сроки */}
            {pricingText && (
              <section className="info-section">
                <div className="pricing-card animate-in glow-silver">
                  <h3>Цены и сроки</h3>
                  {pricingText.split(/\n\s*\n/).filter(Boolean).map((para, idx) => (
                    <p key={`pr-${idx}`}>{para}</p>
                  ))}
                  <div className="cta-highlight">
                    <div className="cta-text">Цена кажется высокой? Давайте поговорим — возможно, у нас уже есть для вас сюрприз.</div>
                    <button className="btn question-btn" onClick={handleQuestionClick}>
                      <FaTelegramPlane size={18} />
                      <span>Обсудить условия</span>
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* 4. Выбрать экран перед заказом */}
            <section className="info-section">
              <div className="screen-card animate-in glow-silver">
                <h3>Выбрать экран</h3>
                <p style={{marginTop: 4}}>Для идеальной подачи нам важно знать, на каком экране вы будете показывать видео. Выберите популярное разрешение или укажите своё.</p>
                <div className="screen-grid">
                  {screenOptions.map((opt) => (
                    <button
                      key={opt.label}
                      className={`screen-chip${selectedScreen?.label === opt.label ? ' selected' : ''}`}
                      onClick={() => {
                        setSelectedScreen(opt);
                        trackConversion('screen_option_click', { resolution: opt.label, aspect: opt.aspect, product: videoData?.title || 'unknown' });
                      }}
                      title={`Пропорции ${opt.aspect}`}
                    >
                      {opt.label} <span className="chip-sub">{opt.aspect}</span>
                    </button>
                  ))}
                </div>
                <div className="screen-custom-row">
                  <input
                    className="screen-input"
                    type="text"
                    placeholder="Написать свой (например, 1920x1080)"
                    value={customScreen}
                    onChange={(e) => setCustomScreen(e.target.value)}
                  />
                  <button
                    className="btn order-btn"
                    onClick={proceedWithScreen}
                    disabled={!selectedScreen && !normalizedCustom}
                  >
                    Начать оформление
                  </button>
                </div>
                {(normalizedCustom && !selectedScreen) && (
                  <div className="screen-hint">Опознали пропорции: {normalizedCustom.aspect}</div>
                )}
              </div>
            </section>

            

            
          </div>

          {/* Кнопки действий */}
          <div className="action-buttons">
            <button className="btn question-btn" onClick={handleTelegramClick}>
              <FaTelegramPlane size={18} />
            <span>Задать вопрос</span>
          </button>
            <button className="btn whatsapp-btn" onClick={handleWhatsAppClick}>
            <FaWhatsapp size={18} />
              <span>Написать нам</span>
            </button>
          </div>

          {/* Кнопка заказа */}
          <div className="action-buttons" style={{marginTop: 16}}>
            <button className="btn order-btn" onClick={() => {
              if (onOrder) onOrder();
              // Отслеживаем переход на страницу заказа
              if (window.trackOrderPage) {
                window.trackOrderPage();
              }
            }}>
            <span>Заказать</span>
          </button>
        </div>
        </main>
      </div>
    </div>
    {showSurveyModal && (
      <div className="survey-modal-overlay" onClick={closeSurvey}>
        <div className="survey-modal" onClick={(e) => e.stopPropagation()}>
          <h3>Оцените предложение</h3>
          <div className="stars" role="radiogroup" aria-label="Оценка предложения (модал)">
            {[1,2,3,4,5].map((n) => (
              <button
                key={`star-modal-${n}`}
                className={`star${ratingValue >= n ? ' selected' : ''}`}
                aria-checked={ratingValue === n}
                role="radio"
                onClick={() => handleSubmitRating(n)}
                disabled={ratingSubmitted}
                title={`${n} из 5`}
              >
                ★
              </button>
            ))}
          </div>
          <div className="poll" style={{marginTop:12}}>
            <div className="poll-q">Понравилась презентация?</div>
            <div className="poll-buttons">
              <button className={`poll-btn${pollOrderAnswer==='yes' ? ' active' : ''}`} onClick={() => handlePollOrder('yes')}>Да</button>
              <button className={`poll-btn${pollOrderAnswer==='no' ? ' active' : ''}`} onClick={() => handlePollOrder('no')}>Скорее нет</button>
            </div>
          </div>
          <div className="poll">
            <div className="poll-q">Хотели бы вы, чтобы она была у вас на свадьбе?</div>
            <div className="poll-buttons">
              <button className={`poll-btn${pollWeddingAnswer==='yes' ? ' active' : ''}`} onClick={() => handlePollWedding('yes')}>Да</button>
              <button className={`poll-btn${pollWeddingAnswer==='no' ? ' active' : ''}`} onClick={() => handlePollWedding('no')}>Подумаю</button>
            </div>
          </div>
          <div className="action-buttons" style={{marginTop: 16}}>
            <button className="btn order-btn" onClick={closeSurvey}>Закрыть</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
