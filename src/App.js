import React, { useState } from "react";
import "./App.css";
import { MdFavorite, MdStar, MdOutlinePhotoCamera, MdOutlineChatBubble, MdOutlineThumbUp } from 'react-icons/md';
import { FiGift, FiSmile, FiInstagram, FiSend, FiCheckCircle } from 'react-icons/fi';
import { FaVk, FaTelegramPlane } from 'react-icons/fa';
import { RiHeart2Line, RiSparkling2Line } from 'react-icons/ri';
import ChatFabButton from './ChatFab';

function Navbar({ mobile, open, onOpen, onClose }) {
  return (
    <>
      {!mobile && (
        <nav className="nav">
          <a href="#catalogs">Каталоги</a>
          <a href="#constructor">Собрать слайд-шоу</a>
          <a href="#contact">Написать нам</a>
        </nav>
      )}
      {mobile && (
        <>
          <button className="burger" onClick={onOpen} aria-label="Открыть меню">
            <span />
            <span />
            <span />
          </button>
          {open && (
            <div className="mobile-menu">
              <button className="mobile-menu-close" onClick={onClose} aria-label="Закрыть меню">×</button>
              <a href="#catalogs" onClick={onClose}>Каталоги</a>
              <a href="#constructor" onClick={onClose}>Собрать слайд-шоу</a>
              <a href="#contact" onClick={onClose}>Написать нам</a>
            </div>
          )}
        </>
      )}
    </>
  );
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 700;
  React.useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 700 && menuOpen) setMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [menuOpen]);
  return (
    <header className="header">
      <div className="logo">Фейеро</div>
      <Navbar mobile={isMobile} open={menuOpen} onOpen={() => setMenuOpen(true)} onClose={() => setMenuOpen(false)} />
    </header>
  );
}

function Hero() {
  return (
    <section className="hero">
      <div className="hero-bg-parallax">
        <video 
          className="hero-bg-video" 
          autoPlay 
          loop 
          muted 
          playsInline 
          poster="/logo192.png"
        >
          <source src="/stock-footage-fireworks-celebration-k-video-clip-alpha-channel-ready-isolated-transparent-background.mp4" type="video/mp4" />
          Ваш браузер не поддерживает видео.
        </video>
      </div>
      <div className="hero-content hero-content-minimal">
        <h1>Фейеро</h1>
        <div className="hero-subtitle">видео-шоу для фейерверка эмоций</div>
      </div>
    </section>
  );
}

function Catalog({ title, badge, description, icon, info }) {
  return (
    <div className="catalog-window wow-catalog">
      <div className="catalog-title-row">
        {/* Иконка-эмодзи удалена */}
        {/* Название и плашка убраны */}
        {description === 'Новобрачная презентация' && (
          <div className="catalog-main-title" style={{
            fontSize: '1.35rem', fontWeight: 900, color: '#a18fff', textAlign: 'center', marginBottom: 8, marginTop: 2, letterSpacing: '1px', fontFamily: 'Bounded, Arial, sans-serif'
          }}>Новобрачная презентация</div>
        )}
      </div>
      {/* Мини-описание удалено */}
      <div className="catalog-video-preview wow-preview">
        <video autoPlay loop muted playsInline poster="/logo192.png" style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: '18px', border: '2.5px solid #BFD7ED', boxShadow: '0 4px 24px #BFD7ED33'}}>
          <source src="/stock-footage-fireworks-celebration-k-video-clip-alpha-channel-ready-isolated-transparent-background.mp4" type="video/mp4" />
          Ваш браузер не поддерживает видео.
        </video>
      </div>
      <div className="catalog-info-line">{info}</div>
      <button className="catalog-order-btn"><span className="firework-emoji">🎆</span> Заказать</button>
    </div>
  );
}

function CatalogCarousel({ title, items }) {
  const scrollRef = React.useRef();
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
        <div className="catalog-carousel-title">{title}</div>
        <div className="catalog-carousel-arrows">
          <button className="carousel-arrow" onClick={scrollLeft} disabled={!canScrollLeft} aria-label="Влево">&#8592;</button>
          <button className="carousel-arrow" onClick={scrollRight} disabled={!canScrollRight} aria-label="Вправо">&#8594;</button>
        </div>
      </div>
      <div className="catalog-carousel-list" ref={scrollRef} tabIndex={0}>
        {items.map((cat, i) => <Catalog key={cat.title + i} {...cat} />)}
      </div>
    </div>
  );
}

function Catalogs() {
  // В первом каталоге только один шаблон
  const presentations = [
    { title: '', badge: '', description: 'Новобрачная презентация', icon: <MdOutlinePhotoCamera size={28} color="#a18fff" />, info: '5 минут' },
  ];
  const invites = [
    { title: 'Love Invite', badge: 'Хит', description: 'Романтическое приглашение с кольцами.', icon: <RiHeart2Line size={28} color="#a18fff" />, info: '1 минута' },
    { title: 'Classic Invite', badge: '', description: 'Классика с голубями.', icon: <MdFavorite size={28} color="#a18fff" />, info: '1 минута' },
    { title: 'Elegant Invite', badge: '', description: 'Элегантное приглашение с лепестками.', icon: <FiGift size={28} color="#a18fff" />, info: '1 минута' },
    { title: 'Fun Invite', badge: '', description: 'Весёлое приглашение для гостей.', icon: <FiSmile size={28} color="#a18fff" />, info: '1 минута' },
  ];
  const welcomes = [
    { title: 'Welcome Party', badge: 'Топ', description: 'Яркое welcome-видео для гостей.', icon: <RiSparkling2Line size={28} color="#a18fff" />, info: '1.5 минуты' },
    { title: 'Fun Welcome', badge: '', description: 'Весёлое приветствие.', icon: <FiSmile size={28} color="#a18fff" />, info: '1.5 минуты' },
    { title: 'Elegant Welcome', badge: '', description: 'Элегантное приветствие.', icon: <FiGift size={28} color="#a18fff" />, info: '1.5 минуты' },
    { title: 'Classic Welcome', badge: '', description: 'Классика для встречи гостей.', icon: <MdFavorite size={28} color="#a18fff" />, info: '1.5 минуты' },
  ];
  return (
    <section className="catalogs-multi" id="catalogs">
      <CatalogCarousel title="Презентации" items={presentations} />
      <div style={{textAlign: 'center', margin: '38px 0 8px 0', fontSize: '2.2rem', fontWeight: 900, color: '#7CA7CE', letterSpacing: '1px', textShadow: '0 4px 32px #a18fff99, 0 1px 0 #fff', fontFamily: 'Bounded, Arial, sans-serif'}}>Welcome video</div>
      <CatalogCarousel title="" items={welcomes} />
      <div style={{textAlign: 'center', margin: '38px 0 8px 0', fontSize: '2.2rem', fontWeight: 900, color: '#7CA7CE', letterSpacing: '1px', textShadow: '0 4px 32px #a18fff99, 0 1px 0 #fff', fontFamily: 'Bounded, Arial, sans-serif'}}>Приглашения</div>
      <CatalogCarousel title="" items={invites} />
      {/* Кнопка "Собрать своё слайд-шоу" удалена */}
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: <MdOutlinePhotoCamera size={36} color="#BFD7ED" />, // загрузка фото
      title: 'Загрузите фото и пожелания',
      desc: 'Отправьте нам ваши фотографии и пожелания к видео.'
    },
    {
      icon: <MdStar size={36} color="#BFD7ED" />, // выбор стиля
      title: 'Выберите стиль и музыку',
      desc: 'Подберите шаблон, музыку и стиль оформления.'
    },
    {
      icon: <FiSend size={36} color="#BFD7ED" />, // получение видео
      title: 'Получите готовое видео',
      desc: 'Мы создаём слайд-шоу и отправляем вам ссылку.'
    }
  ];
  // Скролл-анимация разъезда этапов
  const [scrolled, setScrolled] = React.useState(false);
  const sectionRef = React.useRef();
  React.useEffect(() => {
    const onScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.7) setScrolled(true);
    };
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <section className="how-it-works creative-hiw" ref={sectionRef}>
      <h2>Как это работает?</h2>
      <div className={`hiw-steps hiw-steps-animated${scrolled ? ' hiw-steps-animated-active' : ''}`}>
        {steps.map((step, i) => (
          <div
            className={`hiw-step creative-step hiw-step-colored hiw-step-animated${scrolled ? ' hiw-step-animated-active' : ''}`}
            key={i}
            style={{
              '--hiw-idx': i,
            }}
          >
            <div className="hiw-step-number creative-step-number hiw-step-gradient">
              <span>{i + 1}</span>
              <span className="hiw-step-bg-circle" />
            </div>
            <div className="hiw-step-icon">{step.icon}</div>
            <div className="hiw-step-title">{step.title}</div>
            <div className="hiw-step-desc">{step.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Advantages() {
  const items = [
    {
      icon: <MdStar size={28} color="#BFD7ED" />, title: 'Премиум-качество', desc: 'Профессиональный монтаж, музыка, анимация и цветокор.'
    },
    {
      icon: <FiSmile size={28} color="#BFD7ED" />, title: 'Индивидуальный подход', desc: 'Каждое видео — уникально, под ваши пожелания.'
    },
    {
      icon: <MdOutlineThumbUp size={28} color="#BFD7ED" />, title: 'Сервис 24/7', desc: 'Быстрая поддержка и обратная связь.'
    },
    {
      icon: <FiGift size={28} color="#BFD7ED" />, title: 'Подарки и бонусы', desc: 'Сюрпризы для молодожёнов и гостей.'
    },
    {
      icon: <RiSparkling2Line size={28} color="#BFD7ED" />, title: 'WOW-эффект', desc: 'Восторг гостей и незабываемые эмоции.'
    },
    {
      icon: <FiCheckCircle size={28} color="#BFD7ED" />, title: 'Гарантия результата', desc: 'Довольны все клиенты — или возврат.'
    }
  ];
  // Автоматическая прокрутка ленты
  const scrollRef = React.useRef();
  React.useEffect(() => {
    let animId;
    let el = scrollRef.current;
    let step = 0.5;
    function animate() {
      if (el) {
        el.scrollLeft += step;
        if (el.scrollLeft + el.offsetWidth >= el.scrollWidth) el.scrollLeft = 0;
      }
      animId = requestAnimationFrame(animate);
    }
    animate();
    return () => cancelAnimationFrame(animId);
  }, []);
  return (
    <section className="advantages conveyor-advantages">
      <div className="advantages-title">Преимущества</div>
      <div className="adv-conveyor" ref={scrollRef} tabIndex={0} aria-label="Преимущества">
        {items.concat(items).map((item, i) => (
          <div className="conveyor-item" key={i}>
            <div className="adv-icon">{item.icon}</div>
            <div className="adv-title">{item.title}</div>
            <div className="adv-desc">{item.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Reviews() {
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
  const [idx, setIdx] = React.useState(0);
  const visibleCount = window.innerWidth < 700 ? 1 : 2;
  React.useEffect(() => {
    const timer = setTimeout(() => setIdx((idx + 1) % reviews.length), 6000);
    return () => clearTimeout(timer);
  }, [idx, reviews.length]);
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

function ChatFab({ onClick }) {
  return (
    <button className="chat-fab" onClick={onClick} aria-label="Открыть чат">
      <MdOutlineChatBubble size={32} color="var(--accent-primary)" style={{position:'absolute',left:0,top:0}}/>
    </button>
  );
}

function ContactForm({ onClose }) {
  const [sent, setSent] = React.useState(false);
  function onSubmit(e) {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 2000);
  }
  return (
    <aside className="contact-form contact-form-animated" id="contact">
      <button className="contact-close" onClick={onClose} aria-label="Закрыть">×</button>
      <h3>Написать нам</h3>
      <form onSubmit={onSubmit} autoComplete="off">
        <input type="text" placeholder="Ваше имя" required />
        <input type="email" placeholder="Email" required />
        <textarea placeholder="Ваш вопрос или пожелание" rows={4} required />
        <button type="submit" className="contact-send-btn" disabled={sent}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 11L19 3L11 19L10 12L3 11Z" fill="var(--accent-primary)"/><path d="M3 11L19 3L11 19L10 12L3 11Z" stroke="var(--accent-primary)" strokeWidth="1.5"/></svg>
          <span>{sent ? 'Отправлено!' : 'Отправить'}</span>
        </button>
      </form>
    </aside>
  );
}

function SectionDecor({ type }) {
  if (type === 'rings') {
    return (
      <div className="section-decor" aria-hidden="true">
              <svg width="220" height="60" viewBox="0 0 220 60" fill="none" style={{display:'block',margin:'0 auto'}}>
        <ellipse cx="60" cy="30" rx="44" ry="18" stroke="var(--accent-primary)" strokeWidth="3" />
        <ellipse cx="160" cy="30" rx="44" ry="18" stroke="var(--accent-secondary)" strokeWidth="3" />
        <ellipse cx="110" cy="30" rx="60" ry="22" stroke="var(--accent-tertiary)" strokeWidth="1.5" />
      </svg>
      </div>
    );
  }
  if (type === 'petals') {
    return (
      <div className="section-decor" aria-hidden="true">
              <svg width="180" height="40" viewBox="0 0 180 40" fill="none" style={{display:'block',margin:'0 auto'}}>
        <path d="M20 20 Q40 0 60 20 T100 20" stroke="var(--accent-secondary)" strokeWidth="2" fill="none"/>
        <path d="M80 20 Q100 40 120 20 T160 20" stroke="var(--accent-secondary)" strokeWidth="2" fill="none"/>
        <circle cx="90" cy="20" r="6" fill="var(--accent-tertiary)" />
      </svg>
      </div>
    );
  }
  if (type === 'wave') {
    return (
      <div className="section-decor" aria-hidden="true" style={{margin:'-32px 0 0 0'}}>
        <svg viewBox="0 0 1440 60" width="100%" height="60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0,40 Q360,60 720,40 T1440,40 V60 H0 Z" fill="var(--bg-primary)" fillOpacity="0.8" />
          <path d="M0,50 Q360,55 720,50 T1440,50 V60 H0 Z" fill="var(--accent-secondary)" fillOpacity="0.13" />
        </svg>
      </div>
    );
  }
  return null;
}

function Footer() {
  return (
    <footer className="footer">
      <div>© {new Date().getFullYear()} Фейеро — свадебные слайд-шоу с фейерверком эмоций</div>
      <div className="footer-links">
        <a href="#"><FaVk size={20} style={{verticalAlign:'middle',marginRight:4}}/>VK</a> |
        <a href="#"><FaTelegramPlane size={20} style={{verticalAlign:'middle',marginRight:4}}/>Telegram</a> |
        <a href="#"><FiInstagram size={20} style={{verticalAlign:'middle',marginRight:4}}/>Instagram</a>
      </div>
    </footer>
  );
}

function App() {
  const [chatOpen, setChatOpen] = useState(false);
  
  // Применение темной темы к документу
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);
  
  return (
    <div className="App">
      <Header />
      <div className="hero-wave-overlap">
        <Hero />
        <div className="section-wave" aria-hidden="true">
          <svg viewBox="0 0 1440 120" width="100%" height="120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path>
              <animate attributeName="d" dur="7s" repeatCount="indefinite"
                values="M0,80 Q360,140 720,80 T1440,80 V120 H0 Z;
                        M0,90 Q360,120 720,100 T1440,90 V120 H0 Z;
                        M0,80 Q360,140 720,80 T1440,80 V120 H0 Z" />
            </path>
            <path>
              <animate attributeName="d" dur="9s" repeatCount="indefinite"
                values="M0,90 Q360,110 720,100 T1440,90 V120 H0 Z;
                        M0,100 Q360,130 720,110 T1440,100 V120 H0 Z;
                        M0,90 Q360,110 720,100 T1440,90 V120 H0 Z" />
            </path>
            <path>
              <animate attributeName="d" dur="11s" repeatCount="indefinite"
                values="M0,100 Q360,120 720,110 T1440,100 V120 H0 Z;
                        M0,110 Q360,140 720,120 T1440,110 V120 H0 Z;
                        M0,100 Q360,120 720,110 T1440,100 V120 H0 Z" />
            </path>
            <defs>
              <filter id="glow1" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="12" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <filter id="glow2" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
          </svg>
        </div>
      </div>
      <Catalogs />
      <SectionDecor type="rings" />
      <HowItWorks />
      <SectionDecor type="petals" />
      <Advantages />
      <SectionDecor type="wave" />
      <Reviews />
      {chatOpen && <ContactForm onClose={() => setChatOpen(false)} />}
      {!chatOpen && <ChatFabButton onClick={() => setChatOpen(true)} />}
      <Footer />
    </div>
  );
}

export default App;
