import React, { useState } from "react";
import "./App.css";

function Header() {
  return (
    <header className="header">
      <div className="logo">Wedding SlideShow</div>
      <nav className="nav">
        <a href="#catalogs">Каталоги</a>
        <a href="#constructor">Собрать слайд-шоу</a>
        <a href="#contact">Написать нам</a>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero">
      <video className="hero-bg-video" autoPlay loop muted playsInline poster="/logo192.png">
        <source src="/stock-footage-fireworks-celebration-k-video-clip-alpha-channel-ready-isolated-transparent-background.mp4" type="video/mp4" />
        Ваш браузер не поддерживает видео.
      </video>
      <div className="hero-svg-decor" aria-hidden="true">
        <svg width="120" height="60" viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{position:'absolute',left:'50%',top:'-30px',transform:'translateX(-50%)',opacity:0.18}}>
          <ellipse cx="40" cy="30" rx="36" ry="18" stroke="#7CA7CE" strokeWidth="4" />
          <ellipse cx="80" cy="30" rx="36" ry="18" stroke="#BFD7ED" strokeWidth="4" />
        </svg>
      </div>
      <div className="hero-content">
        <h1>Свадебные слайд-шоу премиум-класса</h1>
        <div className="hero-subtitle">Слайд-шоу, которые трогают до слёз. Ваша история — в самом красивом формате.</div>
        <p>Создайте незабываемую историю вашей любви в современном формате. Профессионально. Красиво. Эмоционально.</p>
      </div>
    </section>
  );
}

function Catalog({ title }) {
  return (
    <div className="catalog-window">
      <div className="catalog-title">{title}</div>
      <div className="catalog-video-preview">
        <video autoPlay loop muted playsInline poster="/logo192.png" style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: '12px'}}>
          <source src="/stock-footage-fireworks-celebration-k-video-clip-alpha-channel-ready-isolated-transparent-background.mp4" type="video/mp4" />
          Ваш браузер не поддерживает видео.
        </video>
      </div>
      <select className="catalog-select">
        <option>Шаблон 1</option>
        <option>Шаблон 2</option>
        <option>Шаблон 3</option>
      </select>
      <select className="catalog-duration">
        <option>2 минуты</option>
        <option>5 минут</option>
        <option>10 минут</option>
      </select>
    </div>
  );
}

function Catalogs() {
  return (
    <section className="catalogs" id="catalogs">
      <Catalog title="Каталог 1" />
      <Catalog title="Каталог 2" />
      <Catalog title="Каталог 3" />
    </section>
  );
}

function ChatFab({ onClick }) {
  return (
    <button className="chat-fab" onClick={onClick} aria-label="Открыть чат">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="16" fill="#7CA7CE" />
        <path d="M10 14h12v6a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2v-6zm12-2v-2a2 2 0 0 0-2-2H12a2 2 0 0 0-2 2v2h12z" fill="#fff" />
      </svg>
    </button>
  );
}

function ContactForm({ onClose }) {
  return (
    <aside className="contact-form" id="contact">
      <button className="contact-close" onClick={onClose} aria-label="Закрыть">×</button>
      <h3>Написать нам</h3>
      <form>
        <input type="text" placeholder="Ваше имя" />
        <input type="email" placeholder="Email" />
        <textarea placeholder="Ваш вопрос или пожелание" />
        <button type="submit">Отправить</button>
      </form>
    </aside>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div>© {new Date().getFullYear()} Wedding SlideShow</div>
      <div className="footer-links">
        <a href="#">VK</a> | <a href="#">Telegram</a> | <a href="#">Instagram</a>
      </div>
    </footer>
  );
}

function App() {
  const [chatOpen, setChatOpen] = useState(false);
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
      {chatOpen && <ContactForm onClose={() => setChatOpen(false)} />}
      {!chatOpen && <ChatFab onClick={() => setChatOpen(true)} />}
      <Footer />
    </div>
  );
}

export default App;
