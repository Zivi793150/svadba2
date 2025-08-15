import React, { useMemo, useState } from 'react';
import './OrderPage.css';

export default function OrderPage({ onClose, product }) {
  const [variant, setVariant] = useState('noAnim');
  const [selection, setSelection] = useState(() => {
    if (product?.title?.includes('Видео-приглашения')) {
      return 'unnamed';
    }
    return '16';
  });

  const prices = useMemo(() => {
    if (product?.title?.includes('Видео-приглашения')) {
      return {
        noAnim: {
          'unnamed': { title: 'Неименное приглашение', price: 3000, term: '1 день' },
          '25': { title: 'Именное приглашение (до 25 имен)', price: 4000, term: '2-4 дня' },
          '50': { title: 'Именное приглашение (до 50 имен)', price: 5000, term: '2-4 дня' },
          '100': { title: 'Именное приглашение (51-100 имен)', price: 7000, term: '2-4 дня' }
        },
        anim: {
          'unnamed': { title: 'Неименное приглашение с оживлением', price: 5000, term: '2-3 дня' },
          '25': { title: 'Именное приглашение (до 25 имен) с оживлением', price: 6000, term: '3-5 дней' },
          '50': { title: 'Именное приглашение (до 50 имен) с оживлением', price: 7000, term: '3-5 дней' },
          '100': { title: 'Именное приглашение (51-100 имен) с оживлением', price: 9000, term: '4-6 дней' }
        }
      };
    } else {
      // Свадебная презентация
      return {
        noAnim: {
          '16': { title: '4 разворота (16 фото, 6:23 мин)', price: 10000, term: '3–4 дня' },
          '20': { title: '5 разворотов (20 фото, 8 мин)', price: 10500, term: '3–4 дня' },
          '24': { title: '6 разворотов (24 фото, 10 мин)', price: 11000, term: '4–5 дней' },
          '28': { title: '7 разворотов (28 фото, 12 мин)', price: 11500, term: '4–5 дней' }
        },
        anim: {
          '16': { title: '4 разворота (16 фото, 6:23 мин) с оживлением', price: 12000, term: '4–5 дней' },
          '20': { title: '5 разворотов (20 фото, 8 мин) с оживлением', price: 13000, term: '4–5 дней' },
          '24': { title: '6 разворотов (24 фото, 10 мин) с оживлением', price: 13500, term: '5–6 дней' },
          '28': { title: '7 разворотов (28 фото, 12 мин) с оживлением', price: 14000, term: '5–6 дней' }
        }
      };
    }
  }, [product]);

  const current = prices[variant][selection];
  const prepay = Math.round(current.price * 0.3);

  return (
    <div className="slideshow-details-overlay">
      <div className="slideshow-details-page">
        <header className="page-header">
          <button className="back-btn" onClick={onClose}>&larr;</button>
          <h1 className="page-title">{product?.title || 'Свадебная презентация'}</h1>
        </header>
        <main className="page-content">
          <div className="video-wrapper">
            <video className={`main-video ${product?.isVertical ? 'vertical-video' : ''}`} controls poster={product?.poster || '/logo192.png'} autoPlay muted playsInline>
              <source src={product?.video} type="video/mp4" />
            </video>
          </div>
          <div className="text-content">
            <h2>Выберите параметры</h2>
            <div className="order-controls">
              <div className="order-row">
                <label>Оживление фото:</label>
                <div className="order-switch">
                  <button className={variant==='noAnim'?'active':''} onClick={()=>setVariant('noAnim')}>Без оживления</button>
                  <button className={variant==='anim'?'active':''} onClick={()=>setVariant('anim')}>С оживлением</button>
                </div>
              </div>
              <div className="order-row">
                <label>{product?.title?.includes('Видео-приглашения') ? 'Тип приглашения:' : 'Количество фото/разворотов:'}</label>
                <select value={selection} onChange={e=>setSelection(e.target.value)}>
                  {product?.title?.includes('Видео-приглашения') ? (
                    <>
                      <option value="unnamed">Неименное приглашение</option>
                      <option value="25">До 25 имен</option>
                      <option value="50">До 50 имен</option>
                      <option value="100">51-100 имен</option>
                    </>
                  ) : (
                    <>
                      <option value="16">4 разворота (16 фото)</option>
                      <option value="20">5 разворотов (20 фото)</option>
                      <option value="24">6 разворотов (24 фото)</option>
                      <option value="28">7 разворотов (28 фото)</option>
                    </>
                  )}
                </select>
              </div>
            </div>
            <div className="order-summary">
              <div><strong>Вариант:</strong> {current.title}</div>
              <div><strong>Срок:</strong> {current.term}</div>
              <div><strong>Стоимость:</strong> {current.price.toLocaleString('ru-RU')} ₽</div>
            </div>
            
            {/* Блок "Итого" - крупно и заметно */}
            <div className="order-total">
              <h3>Итого к оплате сейчас</h3>
              <div className="total-amount">{prepay.toLocaleString('ru-RU')} ₽</div>
              <div className="total-description">Предоплата 30% от общей стоимости</div>
            </div>
            
            {/* Пометка про оплату - более заметно */}
            <div className="payment-notice">
              <h4>💳 Условия оплаты</h4>
              <p>Сейчас оплачиваете предоплату 30% ({prepay.toLocaleString('ru-RU')} ₽). Оставшиеся 70% ({Math.round(current.price * 0.7).toLocaleString('ru-RU')} ₽) — после согласования финального видео.</p>
            </div>
            
            <div className="action-buttons">
              <a className="pay-btn" href={`https://xn--e1aalvju.xn--p1ai?product=${encodeURIComponent(product?.title||'Свадебная презентация')}&variant=${variant}&photos=${selection}&price=${current.price}`} target="_blank" rel="noopener noreferrer">
                <span className="btn-text">Перейти к оплате</span>
                <div className="icon-container">
                  <svg viewBox="0 0 24 24" className="icon card-icon">
                    <path d="M20,8H4V6H20M20,18H4V12H20M20,4H4C2.89,4 2,4.89 2,6V18C2,19.11 2.89,20 4,20H20C21.11,20 22,19.11 22,18V6C22,4.89 21.11,4 20,4Z" fill="currentColor" />
                  </svg>
                  <svg viewBox="0 0 24 24" className="icon payment-icon">
                    <path d="M2,17H22V21H2V17M6.25,7H9V6H6V3H18V6H15V7H17.75L19,17H5L6.25,7M9,10H15V8H9V10M9,13H15V11H9V13Z" fill="currentColor" />
                  </svg>
                  <svg viewBox="0 0 24 24" className="icon dollar-icon">
                    <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" fill="currentColor" />
                  </svg>
                  <svg viewBox="0 0 24 24" className="icon wallet-icon default-icon">
                    <path d="M21,18V19A2,2 0 0,1 19,21H5C3.89,21 3,20.1 3,19V5A2,2 0 0,1 5,3H19A2,2 0 0,1 21,5V6H12C10.89,6 10,6.9 10,8V16A2,2 0 0,0 12,18M12,16H22V8H12M16,13.5A1.5,1.5 0 0,1 14.5,12A1.5,1.5 0 0,1 16,10.5A1.5,1.5 0 0,1 17.5,12A1.5,1.5 0 0,1 16,13.5Z" fill="currentColor" />
                  </svg>
                  <svg viewBox="0 0 24 24" className="icon check-icon">
                    <path d="M9,16.17L4.83,12L3.41,13.41L9,19L21,7L19.59,5.59L9,16.17Z" fill="currentColor" />
                  </svg>
                </div>
              </a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


