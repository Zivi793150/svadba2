import React, { useEffect } from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import './AboutPage.css';

export default function AboutPage({ onClose }) {
  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);

  return (
    <div className="about-overlay">
      <div className="about-page">
        <header className="about-header">
          <button className="about-back-btn" onClick={onClose} aria-label="Закрыть">
            <FaArrowLeft size={20} />
          </button>
          <h1 className="about-title">О нас и реквизиты</h1>
        </header>

        <main className="about-content">
          
          <section className="about-section">
            <h2>Компания</h2>
            <div className="about-grid">
              <div className="about-item"><span>Наименование</span><b>ООО «АЛЕКСАНДРА1984»</b></div>
              <div className="about-item"><span>Полное наименование</span><b>Общество с ограниченной ответственностью «Александра1984»</b></div>
              <div className="about-item"><span>ИНН</span><b>2130225961</b></div>
              <div className="about-item"><span>ОГРН</span><b>1212100004467</b></div>
              <div className="about-item"><span>ОКПО</span><b>48190949</b></div>
              <div className="about-item"><span>Юридический адрес</span><b>428000 ЧР, г. Чебоксары, ул. Университетская 19-132</b></div>
              <div className="about-item"><span>Фактический адрес</span><b>428000 ЧР, г. Чебоксары, ул. Университетская 19-132</b></div>
              <div className="about-item"><span>Электронная почта</span><b>bog.e.u@internet.ru</b></div>
              <div className="about-item"><span>Телефон</span><b>+7-900-451-17-77</b></div>
            </div>
          </section>

          <section className="about-section">
            <h2>Оплата и безопасность</h2>
            <p>Оплата принимается банковскими картами, СБП и другими способами через ЮKassa. Передача данных защищена, обработка соответствует стандарту PCI DSS. Чек отправляется на e‑mail покупателя.</p>
          </section>

          <section className="about-section">
            <h2>Доставка и возврат</h2>
            <ul className="about-list">
              <li>Мы предоставляем цифровой продукт: готовое видео и файлы доступны по ссылке, отправленной в мессенджер и на e‑mail.</li>
              <li>Срок предоставления: в течение 1–5 рабочих дней после согласования материалов.</li>
              <li>Возврат до начала работ — 100%. После начала работ — пропорционально объёму выполненного, по соглашению сторон.</li>
            </ul>
          </section>

          <section className="about-section">
            <h2>Публичная оферта</h2>
            <p>Размещая заказ на сайте, вы соглашаетесь с условиями публичной оферты и политикой конфиденциальности.</p>
            <div className="about-documents">
              <a 
                href="/Пользовательское_соглашение_сайта_http.docx" 
                download 
                className="document-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                📄 Скачать пользовательское соглашение
              </a>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}


