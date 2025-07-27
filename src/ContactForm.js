import React, { useState } from "react";
import { FaPaperPlane } from 'react-icons/fa';
import "./ContactForm.css";

export default function ContactForm({ onClose }) {
  const [sent, setSent] = useState(false);
  function onSubmit(e) {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 2000);
  }
  return (
    <aside className="contact-form-new" id="contact">
      <button className="contact-close-new" onClick={onClose} aria-label="Закрыть">×</button>
      <h3>Написать нам</h3>
      <form onSubmit={onSubmit} autoComplete="off">
        <input type="text" placeholder="Ваше имя" required />
        <input type="email" placeholder="Email" required />
        <textarea placeholder="Ваш вопрос или пожелание" rows={4} required />
        <button type="submit" className="contact-send-btn-new" disabled={sent}>
          <FaPaperPlane size={20} style={{marginRight: 6}} />
          {sent ? 'Отправлено!' : ''}
        </button>
      </form>
    </aside>
  );
} 