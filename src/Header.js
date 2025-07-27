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

function MobileMenu({ open, onClose }) {
  return (
    <div className={`mobile-menu-new${open ? ' open' : ''}`}> 
      <button className="mobile-menu-close-new" onClick={onClose} aria-label="Закрыть меню">×</button>
      <nav className="mobile-menu-list">
        <a href="#catalogs" onClick={onClose}>Каталоги</a>
        <a href="#constructor" onClick={onClose}>Собрать слайд-шоу</a>
        <a href="#contact" onClick={onClose}>Написать нам</a>
      </nav>
    </div>
  );
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 700;
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 700 && menuOpen) setMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [menuOpen]);
  return (
    <header className="header">
      <div className="logo">Фейеро</div>
      {!isMobile && (
        <nav className="nav">
          <a href="#catalogs">Каталоги</a>
          <a href="#constructor">Собрать слайд-шоу</a>
          <a href="#contact">Написать нам</a>
        </nav>
      )}
      {isMobile && (
        <>
          <BurgerIcon open={menuOpen} onClick={() => setMenuOpen(!menuOpen)} />
          <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
        </>
      )}
    </header>
  );
} 