class AnalyticsTracker {
  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.startTime = Date.now();
    this.pageStartTime = Date.now();
    this.currentPage = window.location.pathname;
    this.API_URL = process.env.REACT_APP_API_URL || 'https://svadba2.onrender.com';
    
    this.init();
  }

  getOrCreateSessionId() {
    let sessionId = localStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      localStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  init() {
    // Отслеживаем просмотры страниц
    this.trackPageView();
    
    // Отслеживаем клики по кнопкам
    this.trackButtonClicks();
    
    // Отслеживаем конверсии
    this.trackConversions();
    
    // Отслеживаем уход со страницы
    this.trackPageLeave();
    
    // Отслеживаем изменения страниц (для SPA)
    this.trackSPANavigation();
  }

  async trackPageView() {
    try {
      // Определяем тип устройства
      const getDeviceType = () => {
        const userAgent = navigator.userAgent.toLowerCase();
        if (/mobile|android|iphone|ipad|phone/.test(userAgent)) {
          return 'mobile';
        } else if (/tablet|ipad/.test(userAgent)) {
          return 'tablet';
        } else {
          return 'desktop';
        }
      };

      const data = {
        page: this.currentPage,
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language,
        deviceType: getDeviceType()
      };

      await fetch(`${this.API_URL}/api/analytics/pageview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': this.sessionId
        },
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error('Analytics pageview error:', error);
    }
  }

  trackButtonClicks() {
    document.addEventListener('click', (e) => {
      const button = e.target.closest('button, a, [role="button"]');
      if (button) {
        const buttonText = button.textContent?.trim() || button.getAttribute('aria-label') || 'Unknown Button';
        const buttonId = button.id || button.className || 'no-id';
        
        this.trackButtonClick(buttonId, buttonText);
      }
    });
  }

  async trackButtonClick(buttonId, buttonText) {
    try {
      const data = {
        buttonId,
        buttonText,
        page: this.currentPage,
        userAgent: navigator.userAgent
      };

      await fetch(`${this.API_URL}/api/analytics/button-click`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': this.sessionId
        },
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error('Analytics button click error:', error);
    }
  }

  trackConversions() {
    // Отслеживаем открытие чата
    const trackChatOpen = () => {
      this.trackConversion('chat_opened', {
        trigger: 'chat_button',
        page: this.currentPage
      });
    };

    // Отслеживаем отправку сообщений в чате
    const trackMessageSent = () => {
      this.trackConversion('message_sent', {
        trigger: 'chat_input',
        page: this.currentPage
      });
    };

    // Отслеживаем клики по Telegram
    const trackTelegramClick = () => {
      this.trackConversion('telegram_clicked', {
        trigger: 'telegram_button',
        page: this.currentPage
      });
    };

    // Отслеживаем клики по WhatsApp
    const trackWhatsAppClick = () => {
      this.trackConversion('whatsapp_clicked', {
        trigger: 'whatsapp_button',
        page: this.currentPage
      });
    };

    // Отслеживаем переходы на страницу заказа
    const trackOrderPage = () => {
      this.trackConversion('order_page_visited', {
        trigger: 'order_button',
        page: this.currentPage
      });
    };

    // Добавляем глобальные обработчики
    window.trackChatOpen = trackChatOpen;
    window.trackMessageSent = trackMessageSent;
    window.trackTelegramClick = trackTelegramClick;
    window.trackWhatsAppClick = trackWhatsAppClick;
    window.trackOrderPage = trackOrderPage;
  }

  async trackConversion(action, metadata = {}) {
    try {
      const data = {
        action,
        page: this.currentPage,
        userAgent: navigator.userAgent,
        metadata
      };

      await fetch(`${this.API_URL}/api/analytics/conversion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': this.sessionId
        },
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error('Analytics conversion error:', error);
    }
  }

  trackPageLeave() {
    window.addEventListener('beforeunload', () => {
      const timeOnPage = Date.now() - this.pageStartTime;

      // Отправляем данные о времени на странице (как JSON Blob, т.к. sendBeacon не позволяет задать заголовки)
      const payload = {
        page: this.currentPage,
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language,
        timeOnPage,
        action: 'page_leave',
        sessionId: this.sessionId
      };
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(`${this.API_URL}/api/analytics/pageview`, blob);
    });
  }

  trackSPANavigation() {
    // Для React Router или других SPA навигаций
    let currentPath = window.location.pathname;
    
    const checkPathChange = () => {
      if (window.location.pathname !== currentPath) {
        // Закрываем прошлую страницу — фиксируем время
        const timeOnPage = Date.now() - this.pageStartTime;
        const leavePayload = {
          page: this.currentPage,
          userAgent: navigator.userAgent,
          referrer: document.referrer,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          language: navigator.language,
          timeOnPage,
          action: 'page_leave',
          sessionId: this.sessionId
        };
        const blob = new Blob([JSON.stringify(leavePayload)], { type: 'application/json' });
        navigator.sendBeacon(`${this.API_URL}/api/analytics/pageview`, blob);

        // Открываем новую страницу
        currentPath = window.location.pathname;
        this.currentPage = currentPath;
        this.pageStartTime = Date.now();
        this.trackPageView();
      }
    };

    // Проверяем изменения каждые 100мс
    setInterval(checkPathChange, 100);
  }

  // Метод для отслеживания вовлеченности в чат
  async trackChatEngagement(chatId, messagesSent, messagesReceived, filesSent, timeInChat) {
    try {
      const data = {
        chatId,
        messagesSent,
        messagesReceived,
        filesSent,
        timeInChat
      };

      await fetch(`${this.API_URL}/api/analytics/chat-engagement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': this.sessionId
        },
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error('Analytics chat engagement error:', error);
    }
  }

  // Метод для завершения сессии
  endSession() {
    const totalTime = Date.now() - this.startTime;
    localStorage.setItem('analytics_session_duration', totalTime.toString());
    
    // Очищаем sessionId при завершении
    localStorage.removeItem('analytics_session_id');
  }
}

// Создаем глобальный экземпляр
const analyticsTracker = new AnalyticsTracker();

export default analyticsTracker;
