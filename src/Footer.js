import React from "react";
import { FaVk, FaTelegramPlane } from 'react-icons/fa';
import { FiInstagram } from 'react-icons/fi';
import "./Footer.css";

export default function Footer({ onAboutClick }) {
  return (
    <footer className="footer">
      <div>© {new Date().getFullYear()} Фейеро — свадебные слайд-шоу с фейерверком эмоций</div>
      <div className="footer-links">
        <a href="#about" onClick={(e) => { e.preventDefault(); onAboutClick && onAboutClick(); }}>О нас</a> |
        <a href="#"><FaVk size={20} style={{verticalAlign:'middle',marginRight:4}}/>VK</a> |
        <a href="https://t.me/feiero" target="_blank" rel="noopener noreferrer"><FaTelegramPlane size={20} style={{verticalAlign:'middle',marginRight:4}}/>Telegram</a> |
        <a href="#"><FiInstagram size={20} style={{verticalAlign:'middle',marginRight:4}}/>Instagram</a>
      </div>
    </footer>
  );
} 