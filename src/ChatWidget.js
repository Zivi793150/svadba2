import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { FaPaperPlane } from 'react-icons/fa';
import { BsChatDotsFill } from 'react-icons/bs';
import { FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import { v4 as uuidv4 } from 'uuid';
import './ChatWidgetFix.css';
import { FaPaperclip } from 'react-icons/fa';
import { FaWhatsapp, FaTelegramPlane } from 'react-icons/fa';
import { FaQuestion, FaMoneyBillWave, FaClock, FaCog, FaInfoCircle, FaEnvelope, FaHeart } from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL || 'https://svadba2.onrender.com';
  const socket = io(API_URL, { transports: ['websocket', 'polling'], withCredentials: false });

function getSessionId() {
  let id = localStorage.getItem('chatSessionId');
  if (!id) {
    id = uuidv4();
    localStorage.setItem('chatSessionId', id);
  }
  return id;
}

function isDesktop() {
  return window.innerWidth > 700;
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatWidget({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [fullscreen, setFullscreen] = useState(window.innerWidth <= 700);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [currentChatId, setCurrentChatId] = useState(getSessionId());
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showDirectAdminChat, setShowDirectAdminChat] = useState(false);
  const limit = 20;
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatId = currentChatId;
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.setProperty('color', '#23243a', 'important');
      inputRef.current.style.setProperty('background', '#f9f9f9', 'important');
      inputRef.current.style.setProperty('caretColor', '#23243a', 'important');
    }
  }, [text]);

  // Управление состоянием чата для мобильных устройств
  useEffect(() => {
    const isMobile = window.innerWidth <= 700;
    
    if (isMobile) {
      // Добавляем класс к body при открытии чата
      document.body.classList.add('chat-open');
      
      return () => {
        // Убираем класс при закрытии чата
        document.body.classList.remove('chat-open');
      };
    }
  }, []);

  // Получить общее количество сообщений
  async function fetchTotal() {
    const res = await fetch(`${API_URL}/api/messages/${chatId}?count=1`);
    const data = await res.json();
    return data.total || 0;
  }

  // При смене chatId — сбрасываем сообщения, skip, hasMore, переподключаем socket, делаем fetch
  useEffect(() => {
    console.log('Загрузка сообщений для chatId:', chatId);
    setMessages([]);
    setSkip(0);
    setHasMore(true);
    setSelectedCategory(null);
    (async () => {
      // Получаем общее количество сообщений
      const countRes = await fetch(`${API_URL}/api/messages/${chatId}/count`);
      const countData = await countRes.json();
      const totalCount = countData.total || 0;
      setTotal(totalCount);
      let initialSkip = 0;
      if (totalCount > limit) initialSkip = totalCount - limit;
      setSkip(initialSkip + limit);
      // Получаем только нужный диапазон сообщений
      const res = await fetch(`${API_URL}/api/messages/${chatId}?limit=${limit}&skip=${initialSkip}`);
      const data = await res.json();
      console.log('Загружено сообщений:', data);
      setMessages(data);
      setHasMore(initialSkip > 0);
    })();
    socket.emit('join', chatId);
    // Помечаем сообщения админа как прочитанные, если чат открыт пользователем
    fetch(`${API_URL}/api/messages/viewed/${chatId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: 'user' })
    });
    const onMsg = (msg) => {
      console.log('Получено сообщение через socket:', msg);
      setMessages((prev) => {
        // Если такое сообщение уже есть (по _id) — не дублируем
        if (msg._id && prev.some(m => m._id === msg._id)) {
          return prev;
        }
        // Заменяем pending по совпадению текста или имени файла
        const idx = prev.findIndex(m => m.pending && m.sender === msg.sender && (
          (m.text && msg.text && m.text === msg.text) ||
          (m.fileName && msg.fileName && m.fileName === msg.fileName)
        ));
        if (idx !== -1) {
          const copy = [...prev];
          copy[idx] = msg;
          return copy;
        }
        return [...prev, msg];
      });
      // Мгновенно помечаем сообщения админа как прочитанные
      fetch(`${API_URL}/api/messages/viewed/${chatId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: 'user' })
      });
    };
    const onViewed = (data) => {
      if (data.chatId === chatId) {
        setMessages(prev => prev.map(m => data.ids.includes(m._id) ? { ...m, viewed: true } : m));
      }
    };
    socket.on('message', onMsg);
    socket.on('viewed', onViewed);
    return () => {
      socket.off('message', onMsg);
      socket.off('viewed', onViewed);
    };
  }, [chatId]);

  // Подгрузка предыдущих сообщений
  const loadMore = async () => {
    const newSkip = Math.max(0, skip - limit);
    const res = await fetch(`${API_URL}/api/messages/${chatId}?limit=${limit}&skip=${newSkip}`);
    const data = await res.json();
    setMessages(prev => [...data, ...prev]);
    setSkip(newSkip);
    setHasMore(newSkip > 0);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages]);

  // Плавный подъезд поля ввода при появлении клавиатуры (mobile)
  useEffect(() => {
    const root = document.getElementById('chat-widget-root');
    if (!root) return;
    const updateViewportVars = () => {
      const vp = window.visualViewport;
      const viewportHeight = vp ? vp.height : window.innerHeight;
      const keyboardOffset = Math.max(0, window.innerHeight - viewportHeight);
      root.style.setProperty('--chat-vh', `${viewportHeight}px`);
      root.style.setProperty('--kb-offset', `${keyboardOffset}px`);
    };
    updateViewportVars();
    const vp = window.visualViewport;
    if (vp) {
      vp.addEventListener('resize', updateViewportVars);
      vp.addEventListener('scroll', updateViewportVars);
    }
    window.addEventListener('resize', updateViewportVars);
    return () => {
      if (vp) {
        vp.removeEventListener('resize', updateViewportVars);
        vp.removeEventListener('scroll', updateViewportVars);
      }
      window.removeEventListener('resize', updateViewportVars);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (!isDesktop() && !fullscreen) setFullscreen(true);
      if (isDesktop() && fullscreen) setFullscreen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fullscreen]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || text.length > 1000 || sending) return;
    setSending(true);
    setError('');
    const tempId = 'pending-' + uuidv4();
    const optimisticMsg = {
      _id: tempId,
      chatId,
      sender: 'user',
      text,
      createdAt: new Date().toISOString(),
      pending: true
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    try {
      const res = await fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, sender: 'user', text })
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Ошибка отправки');
        // Удаляем временное сообщение при ошибке
        setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
      } else {
        const saved = await res.json();
        setMessages((prev) => prev.map(m => m._id === tempId ? saved : m));
        setText('');
        // Отслеживаем отправку сообщения
        if (window.trackMessageSent) {
          window.trackMessageSent();
        }
      }
    } catch (err) {
      setError('Ошибка сети');
      setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
    }
    setSending(false);
  };

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    if (!codeInput.trim()) return;
    localStorage.setItem('chatSessionId', codeInput.trim());
    setCurrentChatId(codeInput.trim());
    setShowCodeInput(false);
    setCodeInput('');
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chatId', chatId);
    formData.append('sender', 'user');
    formData.append('text', '');
    // Оптимистичный превью для изображений
    if (file.type && file.type.startsWith('image/')) {
      const tempId = 'pending-file-' + uuidv4();
          const localUrl = URL.createObjectURL(file);
      const optimisticMsg = {
        _id: tempId,
        chatId,
        sender: 'user',
        text: '',
        fileUrl: localUrl,
        fileType: file.type,
        fileName: file.name,
        createdAt: new Date().toISOString(),
        pending: true
      };
      setMessages(prev => [...prev, optimisticMsg]);
    }
    const res = await fetch(`${API_URL}/api/messages/file`, {
      method: 'POST',
      body: formData
    });
    if (res.ok) {
      const saved = await res.json();
      setMessages(prev => {
        // Заменим временное превью по имени файла, если есть совпадение
        const idx = prev.findIndex(m => m.pending && m.fileName === file.name);
        if (idx !== -1) {
          const copy = [...prev];
          copy[idx] = saved;
          return copy;
        }
        return [...prev, saved];
      });
    }
    fileInputRef.current.value = '';
  };

  const handleWhatsAppRedirect = () => {
    const phoneNumber = '79004511777';
    const orderInfo = `Здравствуйте! Хочу заказать слайд-шоу.\n\nКод чата: ${chatId}\nДата: ${new Date().toLocaleDateString('ru-RU')}`;
    const encodedMessage = encodeURIComponent(orderInfo);
    const isMobileUa = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobileUa) {
      window.location.href = `whatsapp://send?phone=${phoneNumber}&text=${encodedMessage}`;
    } else {
      const whatsappWebUrl = `https://web.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`;
      window.open(whatsappWebUrl, '_blank');
    }
  };

  const handleTelegramRedirect = () => {
    const botUsername = 'feyero_bot';
    const isMobileUa = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobileUa) {
      // Пробуем открыть приложение Telegram напрямую
      window.open(`tg://resolve?domain=${botUsername}&start=`, '_blank');
      // Если не сработало, через 100ms открываем веб-версию
      setTimeout(() => {
        window.open(`https://t.me/${botUsername}?start=`, '_blank');
      }, 100);
    } else {
      // На ПК открываем веб-версию бота
      window.open(`https://t.me/${botUsername}?start=`, '_blank');
    }
  };

  const isMobile = window.innerWidth <= 700;

  // Быстрые вопросы и категории
  const quickQuestions = {
    'invitations': {
      title: '🎬 Видео-приглашения',
      icon: <FaEnvelope size={16} />,
      questions: [
        'Видео-приглашения — общая информация',
        'Видео-приглашения — цены и сроки',
        'Можно ли заказать индивидуальное приглашение?'
      ]
    },
    'presentations': {
      title: '💒 Свадебная презентация',
      icon: <FaHeart size={16} />,
      questions: [
        'Свадебная презентация — общая информация',
        'Свадебная презентация — цены и сроки',
        'Можно ли заказать индивидуальную презентацию?'
      ]
    }
  };



  // Автоответы на базовые вопросы
  const autoAnswers = {
    'Свадебная презентация — общая информация': `Общая информация: 

1. Сначала до заказа необходимо определиться с экраном, который хотитеиспользовать для демонстрации. Для показа подойдут не все экраны, а только с
пропорциями 16:9 и 16:10. Уточните пропорции у владельца экрана, а также егоразмер, и сообщите нам перед заказом. Чтобы посмотреть как примерно будет
выглядеть ваше презентация на этом экране – можете скачать наш образец ипопросить ее посмотреть на нём. 

2. Длительность видео зависит от количества фото и разворотов альбома. Внашем видео-образце 16 фотографий и 4 разворота. Возможно добавить в
презентацию дополнительные развороты (каждый разворот – 4 фото). Цена каждогодополнительного разворота + 500 - 1000 руб. Также длительность видео зависит от
объема текста в описании фото. В шаблоне в описании к фото не больше 300символов. Рекомендуем оставлять также, не делать описание к одному фото больше.
Это будет выглядеть затянуто и занудно.. Только главное. Чтобы сделать описание(например биографию мамы) больше - лучше добавлять фото и развороты.. Будет
выглядеть интересно! 
3. В шаблоне презентации все фото «оживлены». Можно заказать презентацию ибез оживления. Оживление стоит + 2000 (16 фотографий). И добавляет к сроку
изготовления 1-2 дня. 
4. Пока музыкальное оформление презентации тоже возможно только в одномварианте. В дальнейшем будут добавлены и другие аудио-подложки на выбор. 
5. После того как определитесь с экраном, для заказа через форму
«заказать», нужно сделать предоплату в размере 30% (в случае отказа от заказапредоплата не возвращается). После чего вам будет выслана форма для заполнения
фото и текста. Очень тщательно подойдите к подбору фотографий. выберите вашилюбимые фото из вашего детства, школьных лет, студенчества и конечно же ваши
лучшие совместные фото. после оформления заказа мы вышлем вам форму длязаполнения фото и описания. заполните туда все фото и текст. После получения
материалов мы приступаем к производству. После окончания мы предоставляем вамвидео на согласование. Допускается только 1 правка в тексте. Так что фото
подбирайте очень обдуманно. После правки и окончательного согласования вашейпрезентации вам нужно доплатить 70 % стоимости и мы пришлем вам вашу свадебную
презентацию на почту.`,
    'Свадебная презентация — цены и сроки': `Стоимость и сроки: 
Презентация без оживления фото (фото без движения) и  описанием к каждому фото на 300 символов (какв шаблоне):
4 разворота (16 фото, 6:23 мин) – 10000р / срок 3-4 дня
5 разворотов (20 фото, 8 мин) – 10500/срок 3-4  дня 
6 разворотов (24 фото, 10 мин) – 11000 / срок 4-5 дней 
7 разворотов (28 фото, 12 мин) – 11500 / срок 4-5 дней
Цены с оживлением фото и текстом в описании к каждому фото 300
символов (как шаблон):
 4 разворота (16 фото,6:23 мин) – 12000р /срок 4-5 дней
5 разворотов (20 фото, 8 мин) – 1300/срок 4-5  дней 
6 разворотов (24 фото, 10 мин) – 13500 / срок 5-6 дней 
7 разворотов (28 фото, 12 мин) – 14000 / срок 5-6 дней
За каждые 300+ символов к тексту для фото - 200р (рекомендация:
оставлять текст на 300 символов под каждое фото, иначе будет смотретьсязанудно. Если хочется больше описания — добавляйте лучше фотографии и развороты,
будет смотреться намного лучше)
Сроки могут варьироваться в зависимости от загруженности исложности работы. Увеличиваться  по
согласованию с заказчиком.`,
    'Видео-приглашения — общая информация': `Приглашение: 
Общая информация:  
Пригласите своих гостей феерично и создайте WOW-эффект еще в самом начале!

Наши персональные видео-приглашения удивят и произведут WOW
– эффект на ваших гостей. Они запомнят вашу свадьбу еще с приглашения и точнозахотят на нее прийти.

Возможно сделать просто приглашение, одинаковое для всех,без обращения, как в шаблоне. А можно сделать именное приглашение для каждого
гостя отдельно.`,
    'Видео-приглашения — цены и сроки': `Стоимость и сроки: 
Неименное приглашение: 
Замена информации о мероприятии без имени – 3000 р./ срок –1 день
 Именное приглашение:  
С обращением и указанием каждого имени вначале: 
до 25 имен – 4000 р, 
до 50 имен – 5000 р, 
 51-100 имен – 7000 р 
Срок исполнения 2-4 дня, возможно быстрее по загруженности.`,
    'Можно ли заказать индивидуальное приглашение?': 'Опишите как видите и мы скажем возможно ли это.',
    'Можно ли заказать индивидуальную презентацию?': 'В принципе можно. Опишите как вы ее видите. И мы скажем сможем ли мы это.',
    'Сколько стоит слайд-шоу?': 'Стоимость слайд-шоу начинается от 5 000 ₽. Точная цена зависит от сложности, количества фото и ваших пожеланий. Хотите, чтобы я рассчитал стоимость для вас?',
    'Есть ли скидки?': 'Да, у нас есть скидки для молодоженов! При заказе за месяц до свадьбы - скидка 15%, при заказе двух услуг - скидка 20%. Подробности расскажу в личном сообщении.',
    'Что входит в стоимость?': 'В стоимость входит: профессиональный монтаж, подбор музыки, цветокоррекция, спецэффекты, готовое видео в HD качестве. Длительность 3-5 минут.',
    'Можно ли рассчитать индивидуально?': 'Конечно! Пришлите мне примеры ваших фото и расскажите о пожеланиях. Я рассчитаю точную стоимость для вашего проекта.',
    'За сколько дней делаете?': 'Обычно слайд-шоу готово за 2-3 дня. При срочном заказе можем сделать за 1 день (доплата 30%).',
    'Можно ли ускорить?': 'Да, можем ускорить! За срочность доплата 30%. Минимальный срок - 1 день.',
    'Как происходит работа?': '1) Вы присылаете фото и пожелания\n2) Мы делаем черновик\n3) Вы вносите правки\n4) Готовое видео!',
    'Когда можно получить результат?': 'Результат готов через 2-3 дня. Присылаем ссылку для скачивания и дублируем в WhatsApp.',
    'Как оформить заказ?': 'Просто напишите мне "Хочу заказать" и пришлите фото. Я помогу оформить заказ и рассчитать стоимость.',
    'Какие фото нужны?': 'Нужны фото в хорошем качестве (минимум 20-30 штук). Форматы: JPG, PNG. Желательно без водяных знаков.',
    'Можно ли внести правки?': 'Да, конечно! Включаем 2 бесплатные правки. Дополнительные правки - 500 ₽ за каждую.',
    'Как оплачивать?': 'Оплата после одобрения черновика. Принимаем: карты, СБП, наличные при встрече.',
    'Какие форматы видео?': 'Готовое видео в форматах: MP4 (HD), MOV. Также можем сделать версию для Instagram Stories.',
    'Можно ли с музыкой?': 'Да! Подбираем музыку под настроение или используем вашу. Учитываем авторские права.',
    'Есть ли примеры работ?': 'Конечно! У нас есть портфолио. Могу показать примеры в личном сообщении.',
    'Работаете ли с видео?': 'Да, работаем! Можем добавить видеофрагменты в слайд-шоу или создать отдельный клип.'
  };

  const handleQuickQuestion = (question) => {
    setText(question);
    setShowQuickQuestions(false);
    // Убираем автофокус - пользователь сам решит, когда начать печатать
    
    // Автоматически отправляем автоответ
    setTimeout(() => {
      if (autoAnswers[question]) {
        const autoMessage = {
          _id: `auto-${Date.now()}`,
          chatId: chatId,
          sender: 'admin',
          text: autoAnswers[question],
          createdAt: new Date(),
          delivered: true,
          viewed: false,
          isAutoReply: true
        };
        setMessages(prev => [...prev, autoMessage]);
      }
    }, 1000);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
  };

  const handleDirectAdminChat = () => {
    setShowDirectAdminChat(true);
    setShowQuickQuestions(false);
    setSelectedCategory(null);
    // Отправляем системное сообщение о начале прямого чата
    const systemMessage = {
      _id: `system-${Date.now()}`,
      chatId: chatId,
      sender: 'admin',
      text: '👋 Здравствуйте! Я готов помочь вам с любыми вопросами. Что вас интересует?',
      createdAt: new Date(),
      delivered: true,
      viewed: false,
      isSystemMessage: true
    };
    setMessages(prev => [...prev, systemMessage]);
  };



  return (
    <div id="chat-widget-root" style={fullscreen || isMobile ? styles.overlayFull : styles.overlay}>
      <div style={fullscreen || isMobile ? styles.chatBoxFull : styles.chatBox}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.iconCircle}><BsChatDotsFill size={22} color="#fff" /></div>
            <span style={styles.title}>Чат поддержки</span>
          </div>
          {isDesktop() && (
            <button
              onClick={() => setFullscreen(f => !f)}
              style={styles.fullBtn}
              title={fullscreen ? 'Свернуть' : 'Во весь экран'}
            >
              {fullscreen ? <FiMinimize2 size={22} /> : <FiMaximize2 size={22} />}
            </button>
          )}
          


          <button onClick={() => setShowCodeInput(s => !s)} style={styles.codeBtn} title="Ввести код чата">🔑</button>
          <button onClick={onClose} style={styles.closeBtn} title="Закрыть">×</button>
        </div>
        {showCodeInput && (
          <>
            <div style={styles.codeBox}>
              <span style={styles.codeLabel}>Код чата:</span>
              <span style={styles.codeValue}>{chatId}</span>
            </div>
            <form onSubmit={handleCodeSubmit} style={styles.codeInputForm}>
              <input
                style={styles.codeInput}
                value={codeInput}
                onChange={e => setCodeInput(e.target.value)}
                placeholder="Введите код чата..."
              />
              <button type="submit" style={styles.codeInputBtn}>ОК</button>
            </form>
          </>
        )}
        <div style={styles.messages}>
          {/* Умная воронка вопросов */}
          {showQuickQuestions && !selectedCategory && (
            <div style={styles.quickQuestionsContainer}>
              <div style={styles.quickQuestionsHeader}>
                <FaQuestion size={20} color="#7CA7CE" />
                <span style={styles.quickQuestionsTitle}>Выберите категорию вопроса:</span>
              </div>
              <div style={styles.categoriesGrid}>
                {Object.entries(quickQuestions).map(([key, category]) => (
                  <button
                    key={key}
                    onClick={() => handleCategorySelect(key)}
                    style={styles.categoryButton}
                    className="category-button"
                  >
                    <div style={styles.categoryIcon}>{category.icon}</div>
                    <span style={styles.categoryTitle}>{category.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Вопросы выбранной категории */}
          {selectedCategory && (
            <div style={styles.questionsContainer}>
              <div style={styles.questionsHeader}>
                <button onClick={handleBackToCategories} style={styles.backButton} className="back-button">
                  ← Назад к категориям
                </button>
                <span style={styles.questionsTitle}>{quickQuestions[selectedCategory].title}</span>
              </div>
              <div style={styles.questionsList}>
                {quickQuestions[selectedCategory].questions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickQuestion(question)}
                    style={styles.questionButton}
                    className="question-button"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}



          {hasMore && (
            <button style={styles.loadMoreBtn} onClick={loadMore}>Показать ещё</button>
          )}
          {messages.length === 0 && !selectedCategory && (
            <div style={styles.emptyMsg}>Задайте вопрос — мы ответим!</div>
          )}
          {messages.map((msg, i) => (
            <div key={msg._id || i} style={msg.sender === 'user' ? styles.userMsgWrap : styles.adminMsgWrap}>
              <div style={msg.sender === 'user' ? styles.userMsg : msg.isAutoReply ? styles.autoReplyMsg : styles.adminMsg}>
                {(msg.fileUrl && msg.fileType && (msg.fileType === 'image' || msg.fileType.startsWith?.('image/'))) && (
                  <img src={msg.fileUrl} alt={msg.fileName || 'image'} style={{maxWidth:180,maxHeight:180,borderRadius:12,marginBottom:6}} />
                )}
                {(msg.fileUrl && msg.fileType && (msg.fileType === 'video' || msg.fileType.startsWith?.('video/'))) && (
                  <video src={msg.fileUrl} controls style={{maxWidth:220,maxHeight:180,borderRadius:12,marginBottom:6,background:'#000'}} />
                )}
                {msg.fileUrl && msg.fileType && !(msg.fileType === 'image' || msg.fileType.startsWith?.('image/')) && !(msg.fileType === 'video' || msg.fileType.startsWith?.('video/')) && (
                  <a href={msg.fileUrl}
                     download={msg.fileName || undefined}
                     target="_blank"
                     rel="noopener noreferrer"
                     style={{color:'#7CA7CE',wordBreak:'break-all',display:'block',marginBottom:6}}>
                    📎 Скачать {msg.fileName || 'файл'}
                  </a>
                )}
                <span style={{whiteSpace:'pre-wrap'}}>{msg.text}</span>
                <div style={styles.msgMeta}>
                  <span style={styles.msgTime}>{formatTime(msg.createdAt)}</span>
                  {msg.sender === 'user' && (
                    <span style={styles.msgStatus}>
                      {msg.pending ? '...' : (msg.viewed ? '✓✓' : (msg.delivered ? '✓' : '...'))}
                    </span>
                  )}
                  {msg.isAutoReply && (
                    <span style={styles.autoReplyLabel}>🤖 Автоответ</span>
                  )}
                </div>
                {/* Быстрые действия после автоответов */}
                {msg.isAutoReply && (
                  <div style={styles.quickActions}>
                    <button 
                      onClick={() => setText('Хочу заказать')}
                      style={styles.quickActionBtn}
                      className="quick-action-btn"
                    >
                      🛒 Заказать
                    </button>
                    <button 
                      onClick={handleDirectAdminChat}
                      style={styles.quickActionBtn}
                      className="quick-action-btn"
                    >
                      💬 Консультация
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
          
          {/* Переходы в мессенджеры */}
          <div style={styles.whatsappContainer}>
            <button 
              onClick={handleWhatsAppRedirect}
              style={styles.whatsappBtn}
              className="whatsapp-btn"
              title="Перейти в WhatsApp для заказа"
            >
              <FaWhatsapp size={isMobile ? 24 : 20} />
              <span style={styles.whatsappText}>Хотите перейти в WhatsApp?</span>
            </button>
            <button 
              onClick={handleTelegramRedirect}
              style={{...styles.whatsappBtn, background: 'linear-gradient(135deg, #7CA7CE 0%, #5B8FB9 100%)', boxShadow: '0 4px 16px #7CA7CE33', marginLeft: 12}}
              className="telegram-btn"
              title="Перейти в Telegram для заказа"
            >
              <FaTelegramPlane size={isMobile ? 24 : 20} />
              <span style={styles.whatsappText}>Или в Telegram</span>
            </button>
          </div>
        </div>
        <form onSubmit={sendMessage} className="chat-widget-input-container" style={styles.inputForm} autoComplete="off">
          <button type="button" onClick={() => fileInputRef.current.click()} style={{...styles.sendBtn, marginRight: 8, background: 'linear-gradient(135deg, #BFD7ED 0%, #7CA7CE 100%)'}} title="Прикрепить файл">
            <FaPaperclip size={isMobile ? 24 : 18} />
          </button>
          <input type="file" ref={fileInputRef} style={{display:'none'}} onChange={handleFileChange} accept="image/*,video/*,.png,.jpg,.jpeg,.gif,.mp4,.mov,.avi,.pdf,.doc,.docx" />
          <input
            ref={inputRef}
            className="ChatWidget-input"
            style={{...styles.input, fontSize: isMobile ? 18 : 16, padding: isMobile ? '16px 18px' : '10px 14px', borderRadius: isMobile ? 18 : 12}}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Введите сообщение..."
            maxLength={1000}
          />
          <button type="submit" className="chat-send-btn" style={{...styles.sendBtn, fontSize: isMobile ? 22 : 18, borderRadius: isMobile ? 18 : 12, padding: isMobile ? '0 24px' : '0 16px', minWidth: isMobile ? 56 : 40, minHeight: isMobile ? 56 : 40}} title="Отправить" disabled={!text.trim() || text.length > 1000 || sending}>
            <FaPaperPlane size={isMobile ? 26 : 20} />
          </button>
        </form>
        {error && <div style={styles.errorMsg}>{error}</div>}
        <style>{`
          .App input::placeholder {
            color: #b0b0b0 !important;
            opacity: 1;
          }
          .ChatWidget-admin-text {
            color: #23243a !important;
            -webkit-text-fill-color: #23243a !important;
          }
          .ChatWidget-admin-meta {
            color: #23243a !important;
            font-weight: 700 !important;
            -webkit-text-fill-color: #23243a !important;
          }
                  .whatsapp-btn:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 6px 20px #25D36644 !important;
        }
        
        /* Hover эффекты для воронки вопросов */
        .category-button:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 6px 20px rgba(124, 167, 206, 0.4) !important;
        }
        
        .question-button:hover {
          background: rgba(255,255,255,0.15) !important;
          border-color: rgba(255,255,255,0.3) !important;
          transform: translateY(-1px) !important;
        }
        
        .back-button:hover {
          background: rgba(124, 167, 206, 0.1) !important;
          color: #BFD7ED !important;
        }
        
        .quick-questions-btn:hover {
          opacity: 1 !important;
          background: rgba(255,255,255,0.1) !important;
        }
        
        .quick-action-btn:hover {
          background: rgba(255,255,255,0.25) !important;
          border-color: rgba(255,255,255,0.5) !important;
          transform: translateY(-1px) !important;
        }
        
        .analytics-btn:hover {
          opacity: 1 !important;
          background: rgba(255,255,255,0.1) !important;
        }
        `}</style>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', right: 24, bottom: 24, zIndex: 4000,
    display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', pointerEvents: 'auto',
  },
  overlayFull: {
    position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, zIndex: 5000,
    display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,10,19,0.92)',
    width: '100vw', height: '100vh',
    height: 'calc(var(--chat-vh, 100vh))',
  },
  chatBox: {
    width: 370, background: '#23243a', borderRadius: 18, boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
    display: 'flex', flexDirection: 'column', maxHeight: 520, minHeight: 420, overflow: 'hidden',
    fontFamily: 'inherit',
  },
  chatBoxFull: {
    width: '100vw', height: 'calc(var(--chat-vh, 100vh))', maxWidth: '100vw', maxHeight: 'calc(var(--chat-vh, 100vh))', background: '#23243a', borderRadius: 0, boxShadow: 'none',
    display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'inherit',
  },
  header: {
    background: 'linear-gradient(90deg, #7CA7CE 0%, #BFD7ED 100%)',
    padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    borderBottom: '1.5px solid #e6e6f6',
  },
  headerLeft: {
    display: 'flex', alignItems: 'center', gap: 10,
  },
  iconCircle: {
    background: 'linear-gradient(135deg, #7CA7CE 0%, #BFD7ED 100%)',
    borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 2px 8px #7CA7CE44',
  },
  title: {
    color: '#fff', fontWeight: 800, fontSize: 18, letterSpacing: 0.5,
    textShadow: '0 2px 8px #7CA7CE',
  },
  fullBtn: {
    background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', marginRight: 8, opacity: 0.7, transition: 'opacity 0.2s',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  closeBtn: {
    background: 'none', border: 'none', fontSize: 28, cursor: 'pointer', color: '#fff', fontWeight: 700, opacity: 0.7, transition: 'opacity 0.2s',
  },
  messages: {
    flex: 1, overflowY: 'auto', padding: '18px 14px 8px 14px', display: 'flex', flexDirection: 'column', gap: 10,
    background: 'linear-gradient(120deg, #23243a 80%, #2e2f4a 100%)',
  },
  emptyMsg: {
    color: '#aaa', textAlign: 'center', marginTop: 40, fontSize: 16,
  },
  userMsgWrap: {
    display: 'flex', justifyContent: 'flex-end',
  },
  adminMsgWrap: {
    display: 'flex', justifyContent: 'flex-start',
  },
  userMsg: {
    background: 'linear-gradient(90deg, #7CA7CE 0%, #BFD7ED 100%)', color: '#fff',
    borderRadius: '16px 16px 4px 16px', padding: '10px 16px', fontSize: 15, maxWidth: '75%',
    boxShadow: '0 2px 8px #7CA7CE33', alignSelf: 'flex-end',
  },
  adminMsg: {
    background: 'var(--accent-primary)', color: '#fff', borderRadius: '16px 16px 16px 4px', padding: '10px 16px', fontSize: 15, maxWidth: '75%',
    boxShadow: '0 2px 8px #BFD7ED33', alignSelf: 'flex-start',
  },
  autoReplyMsg: {
    background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: '#fff', borderRadius: '16px 16px 16px 4px', padding: '10px 16px', fontSize: 15, maxWidth: '75%',
    boxShadow: '0 2px 8px #4CAF5033', alignSelf: 'flex-start', border: '2px solid #66BB6A',
  },
  inputForm: {
    display: 'flex', borderTop: '1.5px solid #e6e6f6', padding: '10px 12px', background: '#23243a',
  },
  input: {
    flex: 1, border: 'none', outline: 'none', padding: '10px 14px', fontSize: 16, borderRadius: 12, background: '#f9f9f9', marginRight: 8,
    color: '#23243a !important', fontWeight: 500, boxShadow: '0 2px 8px #BFD7ED33',
  },
  sendBtn: {
    background: 'linear-gradient(90deg, #7CA7CE 0%, #BFD7ED 100%)', color: '#fff !important', border: 'none', borderRadius: 12, padding: '0 16px', fontWeight: 'bold', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px #7CA7CE33', transition: 'background 0.2s',
  },
  codeBox: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', background: 'rgba(255,255,255,0.07)',
    fontSize: 14, fontWeight: 500, color: '#b0b0b0', borderBottom: '1px solid #e6e6f6',
  },
  codeLabel: {
    color: '#b0b0b0', fontWeight: 500,
  },
  codeValue: {
    color: '#fff', fontWeight: 700, fontFamily: 'monospace', background: '#23243a', padding: '2px 8px', borderRadius: 6, fontSize: 15,
  },
  codeBtn: {
    background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', marginRight: 8, opacity: 0.7, transition: 'opacity 0.2s',
  },
  codeInputForm: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', background: 'rgba(255,255,255,0.07)',
    borderBottom: '1px solid #e6e6f6',
  },
  codeInput: {
    border: '1px solid #b0b0b0', borderRadius: 6, padding: '6px 10px', fontSize: 15, outline: 'none',
  },
  codeInputBtn: {
    background: 'linear-gradient(90deg, #7CA7CE 0%, #BFD7ED 100%)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', fontWeight: 'bold', cursor: 'pointer', fontSize: 15,
  },
  msgMeta: {
    display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, fontSize: 11, color: '#b0b0b0', justifyContent: 'flex-end',
  },
  msgTime: {
    fontSize: 11, color: '#b0b0b0',
  },
  msgStatus: {
    fontSize: 13, color: '#7CA7CE', marginLeft: 2,
  },
  loadMoreBtn: {
    background: 'none', border: 'none', color: '#7CA7CE', fontWeight: 700, fontSize: 14, cursor: 'pointer', margin: '0 auto 8px auto', display: 'block',
  },
  errorMsg: {
    color: '#ff3b3b', fontSize: 13, margin: '6px 0 0 0', textAlign: 'right',
  },
  whatsappContainer: {
    display: 'flex', justifyContent: 'center', marginTop: 16, marginBottom: 8,
  },
  whatsappBtn: {
    background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: 20,
    padding: '12px 20px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    boxShadow: '0 4px 16px #25D36633',
    transition: 'all 0.2s ease',
    textDecoration: 'none',
    ...(window.innerWidth <= 700 && {
      padding: '14px 24px',
      fontSize: 16,
      borderRadius: 24,
    }),
  },
  whatsappText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
  },
  // Стили для умной воронки вопросов

  quickQuestionsContainer: {
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: '20px',
    marginBottom: '20px',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  quickQuestionsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: '20px',
    justifyContent: 'center',
  },
  quickQuestionsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    textAlign: 'center',
  },
  categoriesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '12px',
  },
  categoryButton: {
    background: 'linear-gradient(135deg, #7CA7CE 0%, #BFD7ED 100%)',
    border: 'none',
    borderRadius: 12,
    padding: '16px 12px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(124, 167, 206, 0.3)',
  },
  categoryIcon: {
    color: '#fff',
    fontSize: 20,
  },
  categoryTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 600,
    textAlign: 'center',
    lineHeight: 1.2,
  },
  questionsContainer: {
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: '20px',
    marginBottom: '20px',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  questionsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: '20px',
    justifyContent: 'space-between',
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: '#7CA7CE',
    fontSize: 14,
    cursor: 'pointer',
    padding: '8px 12px',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  questionsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    textAlign: 'center',
    flex: 1,
  },
  questionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  questionButton: {
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '10px',
    padding: '14px 16px',
    cursor: 'pointer',
    color: '#fff',
    fontSize: 14,
    textAlign: 'left',
    transition: 'all 0.2s ease',
    lineHeight: 1.4,
  },
  autoReplyLabel: {
    fontSize: 11,
    color: '#66BB6A',
    fontWeight: 600,
    marginLeft: 8,
  },
  quickActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
    flexWrap: 'wrap',
  },
  quickActionBtn: {
    background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '8px',
    padding: '8px 12px',
    cursor: 'pointer',
    color: '#fff',
    fontSize: 12,
    fontWeight: 500,
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
  },
  // Стили для аналитики


}; 