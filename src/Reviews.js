import React, { useState, useEffect } from "react";
import "./Reviews.css";

const reviews = [
  {
    name: 'Анна и Дмитрий',
    text: 'Слайд-шоу получилось невероятно трогательным! Все гости были в восторге, а мы — в слезах счастья. Спасибо за эмоции и профессионализм!',
    avatar: 'https://randomuser.me/api/portraits/women/65.jpg'
  },
  {
    name: 'Екатерина',
    text: 'Очень красивое видео, всё учли, музыка идеально подошла. Получили быстро, сервис на высоте!',
    avatar: 'https://randomuser.me/api/portraits/women/43.jpg'
  },
  {
    name: 'Алексей и Мария',
    text: 'Спасибо за индивидуальный подход! Видео получилось лучше, чем мы мечтали. Будем советовать друзьям!',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  {
    name: 'Ирина',
    text: 'Всё очень красиво, быстро, удобно! Спасибо за эмоции и память на всю жизнь!',
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg'
  },
  {
    name: 'Сергей',
    text: 'Потрясающий сервис, индивидуальный подход, всё на высшем уровне!',
    avatar: 'https://randomuser.me/api/portraits/men/44.jpg'
  }
];

export default function Reviews() {
  const [idx, setIdx] = useState(0);
  const [visibleCount, setVisibleCount] = useState(window.innerWidth < 700 ? 1 : 2);

  useEffect(() => {
    const handleResize = () => setVisibleCount(window.innerWidth < 700 ? 1 : 2);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIdx((idx + 1) % reviews.length), 6000);
    return () => clearTimeout(timer);
  }, [idx]);

  const start = idx;
  const end = (idx + visibleCount) % reviews.length;
  const visible = end > start ? reviews.slice(start, end) : [...reviews.slice(start), ...reviews.slice(0, end)];

  return (
    <section className="reviews-modern">
      <div className="reviews-modern-bg-svg" aria-hidden="true">
        <svg width="100%" height="100%" viewBox="0 0 600 300" fill="none" style={{position:'absolute',left:0,top:0,width:'100%',height:'100%'}}>
          <circle cx="120" cy="80" r="60" fill="var(--shadow-color)" />
          <circle cx="500" cy="220" r="80" fill="var(--shadow-color)" />
          <ellipse cx="300" cy="150" rx="180" ry="60" fill="var(--shadow-color)" />
        </svg>
      </div>
      <div className="reviews-modern-inner">
        <div className="reviews-modern-left">
          <h2>Отзывы наших клиентов</h2>
          <div className="reviews-modern-subtitle">Нам доверяют самые важные моменты. Эмоции, качество, сервис — всё на высшем уровне.</div>
        </div>
        <div className="reviews-modern-slider">
          {visible.map((r, i) => (
            <div className="reviews-modern-card" key={r.name + i}>
              <div className="reviews-modern-avatar"><img src={r.avatar} alt={r.name} /></div>
              <div className="reviews-modern-text">“{r.text}”</div>
              <div className="reviews-modern-name">{r.name}</div>
            </div>
          ))}
          <div className="reviews-modern-dots">
            {reviews.map((_, i) => (
              <button
                key={i}
                className={i === idx ? 'active' : ''}
                onClick={() => setIdx(i)}
                aria-label={`Показать отзыв ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
} 