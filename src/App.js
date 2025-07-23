import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import Header from "./Header";
import Hero from "./Hero";
import Catalogs from "./Catalogs";
import Reviews from "./Reviews";
import Footer from "./Footer";
// import ContactForm from "./ContactForm";
import ChatFabButton from "./ChatFabButton";
import ChatWidget from './ChatWidget';

// Временная реализация, если нет отдельных файлов:
function HowItWorks() {
  const steps = [
    { title: 'Загрузите фото и пожелания', desc: 'Отправьте нам ваши фотографии и пожелания к видео.' },
    { title: 'Выберите стиль и музыку', desc: 'Подберите шаблон, музыку и стиль оформления.' },
    { title: 'Получите готовое видео', desc: 'Мы создаём слайд-шоу и отправляем вам ссылку.' }
  ];
  return (
    <section className="how-it-works creative-hiw">
      <h2>Как это работает?</h2>
      <div className="hiw-steps hiw-steps-animated hiw-steps-animated-active">
        {steps.map((step, i) => (
          <div className="hiw-step creative-step hiw-step-colored hiw-step-animated hiw-step-animated-active" key={i} style={{'--hiw-idx': i}}>
            <div className="hiw-step-number creative-step-number hiw-step-gradient">
              <span>{i + 1}</span>
              <span className="hiw-step-bg-circle" />
            </div>
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
    { title: 'Премиум-качество', desc: 'Профессиональный монтаж, музыка, анимация и цветокор.' },
    { title: 'Индивидуальный подход', desc: 'Каждое видео — уникально, под ваши пожелания.' },
    { title: 'Сервис 24/7', desc: 'Быстрая поддержка и обратная связь.' },
    { title: 'Подарки и бонусы', desc: 'Сюрпризы для молодожёнов и гостей.' },
    { title: 'WOW-эффект', desc: 'Восторг гостей и незабываемые эмоции.' },
    { title: 'Гарантия результата', desc: 'Довольны все клиенты — или возврат.' }
  ];
  const conveyorRef = useRef();
  const [scrollIdx, setScrollIdx] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      if (!conveyorRef.current) return;
      const item = conveyorRef.current.querySelector('.conveyor-item');
      if (!item) return;
      const itemWidth = item.offsetWidth + 32; // gap
      const maxScroll = conveyorRef.current.scrollWidth - conveyorRef.current.clientWidth;
      let nextScroll = conveyorRef.current.scrollLeft + itemWidth;
      if (nextScroll > maxScroll) nextScroll = 0;
      conveyorRef.current.scrollTo({ left: nextScroll, behavior: 'smooth' });
      setScrollIdx(idx => (nextScroll === 0 ? 0 : idx + 1));
    }, 2200);
    return () => clearInterval(interval);
  }, []);
  return (
    <section className="advantages conveyor-advantages">
      <div className="advantages-title">Преимущества</div>
      <div className="adv-conveyor" ref={conveyorRef}>
        {items.map((item, i) => (
          <div className="conveyor-item" key={i}>
            <div className="adv-title">{item.title}</div>
            <div className="adv-desc">{item.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function App() {
  const [chatOpen, setChatOpen] = useState(false);
  
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);
  
  return (
    <div className="App">
      <Header />
      <div className="hero-wave-overlap">
        <Hero />
      </div>
      <Catalogs />
      <HowItWorks />
      <Advantages />
      <Reviews />
      {/* {chatOpen && <ContactForm onClose={() => setChatOpen(false)} />} */}
      {!chatOpen && <ChatFabButton onClick={() => setChatOpen(true)} />}
      {chatOpen && <ChatWidget onClose={() => setChatOpen(false)} />}
      <Footer />
    </div>
  );
}
