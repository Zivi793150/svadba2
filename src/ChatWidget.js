import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { FaPaperPlane } from 'react-icons/fa';
import { BsChatDotsFill } from 'react-icons/bs';
import { FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import { v4 as uuidv4 } from 'uuid';
import './ChatWidgetFix.css';
import { FaPaperclip } from 'react-icons/fa';
import { FaWhatsapp } from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL || 'https://svadba2.onrender.com';
const socket = io(API_URL);

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
        // Если есть pending сообщение с таким же текстом и sender, заменяем его на настоящее
        const idx = prev.findIndex(m => m.pending && m.text === msg.text && m.sender === msg.sender);
        if (idx !== -1) {
          const newArr = [...prev];
          newArr[idx] = msg;
          return newArr;
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
        setText('');
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
    await fetch(`${API_URL}/api/messages/file`, {
      method: 'POST',
      body: formData
    });
    fileInputRef.current.value = '';
  };

  const handleWhatsAppRedirect = () => {
    // Номер WhatsApp (замените на ваш)
    const phoneNumber = '79605110071'; // Замените на реальный номер
    
    // Информация о заказе (пока заглушка)
    const orderInfo = `Здравствуйте! Хочу заказать слайд-шоу.
    
Код чата: ${chatId}
Дата заказа: ${new Date().toLocaleDateString('ru-RU')}

Готов обсудить детали заказа.`;

    // Кодируем сообщение для URL
    const encodedMessage = encodeURIComponent(orderInfo);
    
    // Создаем WhatsApp Web URL
    const whatsappWebUrl = `https://web.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`;
    
    // Открываем WhatsApp Web
    window.open(whatsappWebUrl, '_blank');
  };

  const isMobile = window.innerWidth <= 700;

  return (
    <div style={fullscreen || isMobile ? styles.overlayFull : styles.overlay}>
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
        <div style={styles.codeBox}>
          <span style={styles.codeLabel}>Код чата:</span>
          <span style={styles.codeValue}>{chatId}</span>
        </div>
        {showCodeInput && (
          <form onSubmit={handleCodeSubmit} style={styles.codeInputForm}>
            <input
              style={styles.codeInput}
              value={codeInput}
              onChange={e => setCodeInput(e.target.value)}
              placeholder="Введите код чата..."
              autoFocus
            />
            <button type="submit" style={styles.codeInputBtn}>ОК</button>
          </form>
        )}
        <div style={styles.messages}>
          {hasMore && (
            <button style={styles.loadMoreBtn} onClick={loadMore}>Показать ещё</button>
          )}
          {messages.length === 0 && (
            <div style={styles.emptyMsg}>Задайте вопрос — мы ответим!</div>
          )}
          {messages.map((msg, i) => (
            <div key={msg._id || i} style={msg.sender === 'user' ? styles.userMsgWrap : styles.adminMsgWrap}>
              <div style={msg.sender === 'user' ? styles.userMsg : styles.adminMsg}>
                {msg.fileUrl ? (
                  msg.fileType && msg.fileType.startsWith('image/') ? (
                    <img src={msg.fileUrl} alt="file" style={{maxWidth:180,maxHeight:180,borderRadius:12,marginBottom:6}} />
                  ) : msg.fileType && msg.fileType.startsWith('video/') ? (
                    <video src={msg.fileUrl} controls style={{maxWidth:220,maxHeight:180,borderRadius:12,marginBottom:6,background:'#000'}} />
                  ) : (
                    <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" style={{color:'#7CA7CE',wordBreak:'break-all',display:'block',marginBottom:6}}>
                      📎 Скачать файл
                    </a>
                  )
                ) : null}
                <span>{msg.text}</span>
                <div style={styles.msgMeta}>
                  <span style={styles.msgTime}>{formatTime(msg.createdAt)}</span>
                  {msg.sender === 'user' && (
                    <span style={styles.msgStatus}>
                      {msg.pending ? '...' : (msg.viewed ? '✓✓' : (msg.delivered ? '✓' : '...'))}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
          
          {/* Кнопка WhatsApp */}
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
          </div>
        </div>
        <form onSubmit={sendMessage} style={styles.inputForm} autoComplete="off">
          <button type="button" onClick={() => fileInputRef.current.click()} style={{...styles.sendBtn, marginRight: 8, background: 'linear-gradient(135deg, #BFD7ED 0%, #7CA7CE 100%)'}} title="Прикрепить файл">
            <FaPaperclip size={isMobile ? 24 : 18} />
          </button>
          <input type="file" ref={fileInputRef} style={{display:'none'}} onChange={handleFileChange} />
          <input
            ref={inputRef}
            className="ChatWidget-input"
            style={{...styles.input, fontSize: isMobile ? 18 : 16, padding: isMobile ? '16px 18px' : '10px 14px', borderRadius: isMobile ? 18 : 12}}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Введите сообщение..."
            maxLength={1000}
            autoFocus
          />
          <button type="submit" style={{...styles.sendBtn, fontSize: isMobile ? 22 : 18, borderRadius: isMobile ? 18 : 12, padding: isMobile ? '0 24px' : '0 16px', minWidth: isMobile ? 56 : 40, minHeight: isMobile ? 56 : 40}} title="Отправить" disabled={!text.trim() || text.length > 1000 || sending}>
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
  },
  chatBox: {
    width: 370, background: '#23243a', borderRadius: 18, boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
    display: 'flex', flexDirection: 'column', maxHeight: 520, minHeight: 420, overflow: 'hidden',
    fontFamily: 'inherit',
  },
  chatBoxFull: {
    width: '95vw', height: '95vh', maxWidth: '95vw', maxHeight: '95vh', background: '#23243a', borderRadius: 22, boxShadow: '0 12px 48px rgba(0,0,0,0.35)',
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
}; 