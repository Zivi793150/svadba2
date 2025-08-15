import React, { useState, useEffect } from "react";
import "./Header.css";

function BurgerIcon({ open, onClick }) {
  return (
    <button className="burger-new" onClick={onClick} aria-label={open ? 'Закрыть меню' : 'Открыть меню'}>
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <rect y="8" width="36" height="4" rx="2" fill="#7CA7CE" style={{transition: 'all 0.3s', transform: open ? 'rotate(45deg) translate(6px, 6px)' : 'none'}} />
        <rect y="16" width="36" height="4" rx="2" fill="#7CA7CE" style={{opacity: open ? 0 : 1, transition: 'all 0.3s'}} />
        <rect y="24" width="36" height="4" rx="2" fill="#7CA7CE" style={{transition: 'all 0.3s', transform: open ? 'rotate(-45deg) translate(7px, -7px)' : 'none'}} />
      </svg>
    </button>
  );
}

function MobileMenu({ open, onClose, onContactClick, onReviewsClick, onAboutClick }) {
  const handleReviewsClick = (e) => {
    e.preventDefault();
    onClose();
    onReviewsClick(e);
  };

  const handleContactClick = (e) => {
    e.preventDefault();
    onClose();
    onContactClick(e);
  };

  return (
    <div className={`mobile-menu-new${open ? ' open' : ''}`}> 
      <button className="mobile-menu-close-new" onClick={onClose} aria-label="Закрыть меню">×</button>
      <nav className="mobile-menu-list">
        <a href="#catalogs" onClick={onClose}>Каталоги</a>
        <a href="#reviews" onClick={handleReviewsClick}>Отзывы</a>
        <a href="#about" onClick={(e) => { e.preventDefault(); onClose(); onAboutClick && onAboutClick(); }}>О нас</a>
        <a href="#contact" onClick={handleContactClick}>Написать нам</a>
      </nav>
    </div>
  );
}

export default function Header({ onContactClick, onAboutClick }) {
  const [menuOpen, setMenuOpen] = useState(false);
  
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 700 && menuOpen) setMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [menuOpen]);

  const handleContactClick = (e) => {
    e.preventDefault();
    if (onContactClick) {
      onContactClick();
    }
  };

  const handleReviewsClick = (e) => {
    e.preventDefault();
    const reviewsSection = document.querySelector('.reviews-modern');
    if (reviewsSection) {
      reviewsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="header">
      <div className="logo-wrap">
        <div className="logo">Фейеро</div>
        <div className="dev-subtitle" aria-hidden="true">Сайт в разработке</div>
      </div>
      <div className="wow-slogan" aria-hidden="true">Мы подарим вашему празднику WOW эффект!</div>
      <nav className="nav">
        <a href="#catalogs">Каталоги</a>
        <a href="#reviews" onClick={handleReviewsClick}>Отзывы</a>
        <a href="#about" onClick={(e) => { e.preventDefault(); onAboutClick && onAboutClick(); }}>О нас</a>
        <a href="#contact" onClick={handleContactClick}>Написать нам</a>
      </nav>
      <BurgerIcon open={menuOpen} onClick={() => setMenuOpen(!menuOpen)} />
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} onContactClick={onContactClick} onReviewsClick={handleReviewsClick} onAboutClick={onAboutClick} />
    </header>
  );
} 