import React from 'react';
import { FaArrowLeft, FaWhatsapp, FaPaperPlane } from 'react-icons/fa';
import './SlideshowDetails.css';

export default function SlideshowDetails({ onClose, onContactClick }) {
  const handleWhatsAppClick = () => {
    const message = encodeURIComponent('Здравствуйте! Хочу заказать слайд-шоу для свадьбы. Подскажите подробности и стоимость.');
    window.open(`https://wa.me/79000000000?text=${message}`, '_blank');
  };

  const handleQuestionClick = () => {
    onContactClick();
  };

  return (
    <div className="slideshow-details-overlay">
      <div className="slideshow-details-container">
        <div className="slideshow-details-header">
          <button className="back-btn" onClick={onClose}>
            <FaArrowLeft size={20} />
          </button>
          <h1 className="slideshow-details-title">Слайд-шоу для вашей свадьбы</h1>
        </div>
        
        <div className="slideshow-details-content">
          <div className="slideshow-details-section">
            <h2>Что включено в слайд-шоу?</h2>
            <ul>
              <li>🎬 Профессиональный монтаж с плавными переходами</li>
              <li>🎵 Подбор и наложение красивой музыки</li>
              <li>✨ Специальные эффекты и анимации</li>
              <li>🎨 Цветокоррекция и улучшение качества фото</li>
              <li>⏱️ Длительность 3-5 минут</li>
              <li>📱 Адаптация для показа на любых устройствах</li>
            </ul>
          </div>

          <div className="slideshow-details-section">
            <h2>Как мы работаем?</h2>
            <div className="workflow-steps">
              <div className="workflow-step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>Вы присылаете фото</h3>
                  <p>Отправляете нам лучшие фотографии вашей пары</p>
                </div>
              </div>
              <div className="workflow-step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Мы создаем концепцию</h3>
                  <p>Разрабатываем уникальный стиль и подбираем музыку</p>
                </div>
              </div>
              <div className="workflow-step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>Монтируем видео</h3>
                  <p>Создаем красивое слайд-шоу с эффектами</p>
                </div>
              </div>
              <div className="workflow-step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h3>Вы получаете результат</h3>
                  <p>Готовое видео в высоком качестве</p>
                </div>
              </div>
            </div>
          </div>

          <div className="slideshow-details-section">
            <h2>Почему выбирают нас?</h2>
            <div className="benefits-grid">
              <div className="benefit-item">
                <div className="benefit-icon">💝</div>
                <h3>Индивидуальный подход</h3>
                <p>Каждое слайд-шоу уникально и создается специально для вас</p>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">⚡</div>
                <h3>Быстрое исполнение</h3>
                <p>Готовое видео через 2-3 дня после получения материалов</p>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">🎯</div>
                <h3>Гарантия качества</h3>
                <p>Исправляем любые недочеты бесплатно</p>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">💰</div>
                <h3>Доступные цены</h3>
                <p>Качественное видео по разумной стоимости</p>
              </div>
            </div>
          </div>

          <div className="slideshow-details-section">
            <h2>Стоимость</h2>
            <div className="pricing-card">
              <div className="price">от 5 000 ₽</div>
              <div className="price-description">
                <p>• Слайд-шоу 3-5 минут</p>
                <p>• Профессиональный монтаж</p>
                <p>• Музыкальное сопровождение</p>
                <p>• Специальные эффекты</p>
                <p>• Файл в высоком качестве</p>
                <p>• Бесплатные правки</p>
              </div>
            </div>
          </div>
        </div>

        <div className="slideshow-details-actions">
          <button className="action-btn question-btn" onClick={handleQuestionClick}>
            <FaPaperPlane size={18} />
            <span>Задать вопрос</span>
          </button>
          <button className="action-btn order-btn" onClick={handleWhatsAppClick}>
            <FaWhatsapp size={18} />
            <span>Заказать</span>
          </button>
        </div>
      </div>
    </div>
  );
}
