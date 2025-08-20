import React, { useEffect, useState } from 'react';
import './PaymentSuccess.css';

export default function PaymentSuccess({ orderId, onClose }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`https://svadba2.onrender.com/api/orders/${orderId}`);
      if (response.ok) {
        const orderData = await response.json();
        setOrder(orderData);
      }
    } catch (error) {
      console.error('Ошибка получения данных заказа:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="payment-success-page">
        <div className="success-container">
          <div className="loading-spinner">⏳</div>
          <h2>Загружаем информацию о заказе...</h2>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="payment-success-page">
        <div className="success-container">
          <div className="error-icon">❌</div>
          <h2>Заказ не найден</h2>
          <p>К сожалению, не удалось найти информацию о заказе.</p>
          <a href="/" className="home-btn">Вернуться на главную</a>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-success-page">
      <div className="success-container">
        <div className="success-icon">✅</div>
        <h1>Оплата прошла успешно!</h1>
        
        <div className="order-details">
          <h2>Детали заказа</h2>
          <div className="detail-row">
            <span className="label">Номер заказа:</span>
            <span className="value">#{order.orderId}</span>
          </div>
          <div className="detail-row">
            <span className="label">Услуга:</span>
            <span className="value">{order.productTitle}</span>
          </div>
          <div className="detail-row">
            <span className="label">Вариант:</span>
            <span className="value">
              {order.variant === 'anim' ? 'С оживлением' : 'Без оживления'}
              {order.selection && ` - ${order.selection}`}
            </span>
          </div>
          <div className="detail-row">
            <span className="label">Общая стоимость:</span>
            <span className="value">{order.totalPrice.toLocaleString('ru-RU')} ₽</span>
          </div>
          <div className="detail-row">
            <span className="label">Оплачено:</span>
            <span className="value success">+{order.prepayAmount.toLocaleString('ru-RU')} ₽</span>
          </div>
          <div className="detail-row">
            <span className="label">Осталось оплатить:</span>
            <span className="value remaining">
              {(order.totalPrice - order.prepayAmount).toLocaleString('ru-RU')} ₽
            </span>
          </div>
        </div>

        <div className="customer-info">
          <h3>Информация о клиенте</h3>
          <div className="detail-row">
            <span className="label">Имя:</span>
            <span className="value">{order.customerInfo?.name || 'Не указано'}</span>
          </div>
          <div className="detail-row">
            <span className="label">Email:</span>
            <span className="value">{order.customerInfo?.email || 'Не указано'}</span>
          </div>
          <div className="detail-row">
            <span className="label">Телефон:</span>
            <span className="value">{order.customerInfo?.phone || 'Не указано'}</span>
          </div>
        </div>

        <div className="next-steps">
          <h3>Что дальше?</h3>
          <div className="steps-list">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Подтверждение заказа</h4>
                <p>Мы получили ваш заказ и свяжемся с вами в ближайшее время для уточнения деталей.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Работа над проектом</h4>
                <p>Наши специалисты начнут работу над вашим проектом согласно выбранным параметрам.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Финальная оплата</h4>
                <p>После согласования финального результата потребуется оплатить оставшиеся 70%.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="contact-info">
          <h3>Остались вопросы?</h3>
          <p>Свяжитесь с нами любым удобным способом:</p>
          <div className="contact-buttons">
            <a href="https://t.me/feyero_bot" className="contact-btn telegram">
              💬 Telegram
            </a>
            <a href="https://wa.me/79004512345" className="contact-btn whatsapp">
              📱 WhatsApp
            </a>
          </div>
        </div>

        <div className="actions">
          <a href="/" className="home-btn">Вернуться на главную</a>
          <button 
            onClick={() => window.print()} 
            className="print-btn"
          >
            🖨️ Распечатать
          </button>
        </div>
      </div>
    </div>
  );
}
