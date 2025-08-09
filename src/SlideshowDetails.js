import React, { useRef, useEffect } from 'react';
import { FaArrowLeft, FaWhatsapp, FaPaperPlane } from 'react-icons/fa';
import './SlideshowDetails.css';

export default function SlideshowDetails({ onClose, onContactClick, videoData }) {
  const videoRef = useRef(null);

  // Блокируем скролл основной страницы при открытии модального окна
  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);
  const handleWhatsAppClick = () => {
    const message = encodeURIComponent('Здравствуйте! Хочу заказать слайд-шоу для свадьбы. Подскажите подробности и стоимость.');
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Для мобильных - открываем приложение WhatsApp
      window.location.href = `whatsapp://send?phone=79000000000&text=${message}`;
    } else {
      // Для ПК - открываем WhatsApp Web
      window.open(`https://web.whatsapp.com/send?phone=79000000000&text=${message}`, '_blank');
    }
  };

  const handleQuestionClick = () => {
    onContactClick();
  };



  return (
    <div className="slideshow-details-overlay">
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
          <div className="video-wrapper">
            <video 
              ref={videoRef}
              className={`main-video ${videoData?.isVertical ? 'vertical-video' : ''}`}
              controls
            >
              <source src={videoData?.video || './video5193080489858068792.mp4'} type="video/mp4" />
              Ваш браузер не поддерживает видео.
            </video>
            

          </div>
          
          {/* Текстовый контент */}
          <div className="text-content">
            <h2>{videoData?.description || 'Создайте незабываемое слайд-шоу для вашей свадьбы'}</h2>
            <p>
              {videoData?.content || 'Мы создаем уникальные слайд-шоу, которые станут прекрасным дополнением к вашему свадебному торжеству. Профессиональный монтаж, красивая музыка и ваши лучшие фотографии - все это превратится в трогательную историю вашей любви.'}
            </p>
            
            <h3>Что входит в услугу:</h3>
            <ul>
              {videoData?.features ? videoData.features.map((feature, index) => (
                <li key={index}>{feature}</li>
              )) : (
                <>
                  <li>Профессиональный монтаж с плавными переходами</li>
                  <li>Подбор и наложение красивой музыки</li>
                  <li>Специальные эффекты и анимации</li>
                  <li>Цветокоррекция и улучшение качества фото</li>
                  <li>Длительность 3-5 минут</li>
                  <li>Готовое видео в высоком качестве</li>
                </>
              )}
            </ul>
            
            <h3>Стоимость: {videoData?.price || 'от 5 000 ₽'}</h3>
            <p>
              {videoData?.timeline || 'Создание слайд-шоу займет 2-3 дня после получения ваших фотографий. Мы обязательно учтем все ваши пожелания и внесем правки при необходимости.'}
            </p>
          </div>
          
          {/* Кнопки действий */}
          <div className="action-buttons">
            <button className="btn question-btn" onClick={handleQuestionClick}>
              <FaPaperPlane size={18} />
              <span>Задать вопрос</span>
            </button>
            <button className="btn order-btn" onClick={handleWhatsAppClick}>
              <FaWhatsapp size={18} />
              <span>Заказать</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
