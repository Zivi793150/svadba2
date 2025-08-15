import React, { useRef, useEffect } from 'react';
import { FaArrowLeft, FaWhatsapp } from 'react-icons/fa';
import { FaTelegramPlane } from 'react-icons/fa';
import './SlideshowDetails.css';

export default function SlideshowDetails({ onClose, onContactClick, videoData }) {
  const videoRef = useRef(null);
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
  const handleWhatsAppClick = () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const botPhone = '79004511777'; // Номер WhatsApp бота
    const message = encodeURIComponent('/start');

    if (isMobile) {
      window.location.href = `whatsapp://send?phone=${botPhone}&text=${message}`;
    } else {
      window.open(`https://web.whatsapp.com/send?phone=${botPhone}&text=${message}`, '_blank');
    }
  };

  const handleTelegramClick = () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const botUsername = 'svadba_presentation_bot'; // Username Telegram бота

    if (isMobile) {
      window.location.href = `tg://msg?to=@${botUsername}&text=${encodeURIComponent('/start')}`;
      // Fallback на веб-версию через 1 секунду
      setTimeout(() => {
        window.open(`https://t.me/${botUsername}?text=${encodeURIComponent('/start')}`, '_blank');
      }, 1000);
    } else {
      window.open(`https://t.me/${botUsername}?text=${encodeURIComponent('/start')}`, '_blank');
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
            {(videoData?.content || '').split(/\n\s*\n/).filter(Boolean).length > 0 ? (
              (videoData.content.split(/\n\s*\n/).filter(Boolean)).map((para, idx) => (
                <p key={idx}>{para}</p>
              ))
            ) : (
              <>
                <p>Мы создаём уникальные слайд‑шоу, которые станут прекрасным дополнением к вашему свадебному торжеству.</p>
                <p>Профессиональный монтаж, красивая музыка и ваши лучшие фотографии — всё это превратится в трогательную историю вашей любви.</p>
              </>
            )}

            {videoData?.title?.includes('Свадебная презентация') && (
              <>
                <h3>Общая информация:</h3>
                {generalInfoWedding.split(/\n\s*\n/).filter(Boolean).map((p, i) => (
                  <p key={`gi-${i}`}>{p}</p>
                ))}
              </>
            )}
          </div>

          {/* Кнопки действий */}
          <div className="action-buttons">
            <button className="btn question-btn" onClick={handleTelegramClick}>
              <FaTelegramPlane size={18} />
            <span>Задать вопрос</span>
          </button>
            <button className="btn order-btn" onClick={handleWhatsAppClick}>
            <FaWhatsapp size={18} />
              <span>Задать вопрос</span>
          </button>
        </div>
        </main>
      </div>
    </div>
  );
}
