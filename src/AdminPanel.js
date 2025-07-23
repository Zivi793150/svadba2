import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const ADMIN_PASSWORD = 'admin123'; // Замените на свой пароль
const socket = io('http://localhost:5000');

export default function AdminPanel() {
  const [auth, setAuth] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState('');
  const messagesEndRef = useRef(null);

  // Авторизация
  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuth(true);
      setError('');
    } else {
      setError('Неверный пароль');
    }
  };

  // Получение списка чатов
  useEffect(() => {
    if (!auth) return;
    fetch('http://localhost:5000/api/chats')
      .then(res => res.json())
      .then(setChats);
  }, [auth]);

  // Получение сообщений выбранного чата
  useEffect(() => {
    if (!selectedChat) return;
    fetch(`http://localhost:5000/api/messages/${selectedChat}`)
      .then(res => res.json())
      .then(setMessages);
    // Пометить все сообщения пользователя как просмотренные и затем обновить сообщения
    fetch(`http://localhost:5000/api/messages/viewed/${selectedChat}`, { method: 'POST' })
      .then(() => {
        fetch(`http://localhost:5000/api/messages/${selectedChat}`)
          .then(res => res.json())
          .then(setMessages);
      });
    socket.emit('join', selectedChat);
    const onMsg = (msg) => {
      if (msg.chatId === selectedChat) setMessages(prev => [...prev, msg]);
    };
    socket.on('message', onMsg);
    return () => socket.off('message', onMsg);
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMsg = (e) => {
    e.preventDefault();
    if (!msg.trim()) return;
    socket.emit('message', { chatId: selectedChat, sender: 'admin', text: msg });
    setMsg('');
  };

  if (!auth) {
    return (
      <div style={styles.centered}>
        <form onSubmit={handleLogin} style={styles.loginForm}>
          <h2>Вход для администратора</h2>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Пароль"
            style={styles.input}
          />
          <button type="submit" style={styles.loginBtn}>Войти</button>
          {error && <div style={styles.error}>{error}</div>}
        </form>
      </div>
    );
  }

  return (
    <div style={styles.adminWrap}>
      <div style={styles.sidebar}>
        <h3>Чаты</h3>
        <div style={styles.chatList}>
          {chats.map(c => (
            <div
              key={c._id}
              style={selectedChat === c._id ? styles.chatItemActive : styles.chatItem}
              onClick={() => setSelectedChat(c._id)}
            >
              <div><b>{c._id}</b></div>
              <div style={{fontSize: 12, color: '#aaa'}}>{c.lastMessage?.text?.slice(0, 30)}</div>
              <div style={{fontSize: 11, color: '#bbb'}}>{c.lastMessage?.createdAt && new Date(c.lastMessage.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={styles.chatArea}>
        {selectedChat ? (
          <>
            <div style={styles.messages}>
              {messages.map((m, i) => (
                <div key={i} style={m.sender === 'admin' ? styles.adminMsgWrap : styles.userMsgWrap}>
                  <div style={m.sender === 'admin' ? styles.adminMsg : styles.userMsg}>
                    <span className={m.sender === 'admin' ? 'AdminPanel-msg-text-admin' : 'AdminPanel-msg-text'}>{m.text}</span>
                    <div style={styles.msgMeta}>
                      <span className={m.sender === 'user' ? 'AdminPanel-user-meta' : 'AdminPanel-msg-text-admin'} style={styles.msgTime}>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className={m.sender === 'user' ? 'AdminPanel-user-meta' : 'AdminPanel-msg-text-admin'} style={{marginLeft: 6, fontWeight: 700}}>{m.sender === 'admin' ? 'Админ' : 'Пользователь'}</span>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMsg} style={styles.inputForm} autoComplete="off">
              <input
                style={styles.inputMsg}
                value={msg}
                onChange={e => setMsg(e.target.value)}
                placeholder="Введите сообщение..."
                className="AdminPanel-input"
                autoFocus
              />
              <button type="submit" style={styles.sendBtn}>Отправить</button>
            </form>
            <style>{`
              .AdminPanel-input {
                color: #23243a !important;
                background: #f9f9f9 !important;
                font-weight: 500;
                box-shadow: 0 2px 8px #BFD7ED33;
                border: none;
                border-radius: 12px;
                padding: 10px 14px;
                font-size: 16px;
                outline: none;
                caret-color: #23243a !important;
                -webkit-text-fill-color: #23243a !important;
              }
              .AdminPanel-input::placeholder {
                color: #b0b0b0 !important;
                opacity: 1;
              }
              .AdminPanel-msg-text {
                color: #23243a !important;
                -webkit-text-fill-color: #23243a !important;
              }
              .AdminPanel-msg-text-admin {
                color: #fff !important;
                -webkit-text-fill-color: #fff !important;
              }
              .AdminPanel-user-meta {
                color: #23243a !important;
                font-weight: 700 !important;
                -webkit-text-fill-color: #23243a !important;
              }
            `}</style>
          </>
        ) : (
          <div style={{color: '#aaa', padding: 32}}>Выберите чат слева</div>
        )}
      </div>
    </div>
  );
}

const styles = {
  centered: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#18182a' },
  loginForm: { background: '#23243a', padding: 32, borderRadius: 12, boxShadow: '0 4px 24px #0008', display: 'flex', flexDirection: 'column', gap: 16, minWidth: 320 },
  input: { padding: 10, borderRadius: 6, border: '1px solid #aaa', fontSize: 16, marginBottom: 8 },
  loginBtn: { background: 'linear-gradient(90deg, #7CA7CE 0%, #BFD7ED 100%)', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 0', fontWeight: 'bold', fontSize: 16, cursor: 'pointer' },
  error: { color: '#ff3b3b', fontSize: 14, marginTop: 6 },
  adminWrap: { display: 'flex', height: '100vh', background: '#18182a', color: '#fff', fontFamily: 'inherit' },
  sidebar: { width: 260, background: '#23243a', padding: 18, borderRight: '1.5px solid #7CA7CE', overflowY: 'auto' },
  chatList: { marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 },
  chatItem: { background: '#23243a', borderRadius: 8, padding: 10, cursor: 'pointer', border: '1px solid #23243a', transition: 'border 0.2s' },
  chatItemActive: { background: '#23243a', borderRadius: 8, padding: 10, cursor: 'pointer', border: '1.5px solid #7CA7CE', transition: 'border 0.2s' },
  chatArea: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 0, minWidth: 0 },
  messages: { flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 10, background: 'linear-gradient(120deg, #23243a 80%, #2e2f4a 100%)', borderRadius: 18, margin: 18 },
  userMsgWrap: { display: 'flex', justifyContent: 'flex-start' },
  adminMsgWrap: { display: 'flex', justifyContent: 'flex-end' },
  userMsg: { alignSelf: 'flex-start', background: '#fff', color: '#23243a', borderRadius: '16px 16px 16px 4px', padding: '10px 16px', maxWidth: '70%', fontSize: 15, boxShadow: '0 2px 8px #BFD7ED33',
    WebkitTextFillColor: '#23243a', color: '#23243a !important',
  },
  adminMsg: { alignSelf: 'flex-end', background: 'linear-gradient(90deg, #7CA7CE 0%, #BFD7ED 100%)', color: '#fff', borderRadius: '16px 16px 4px 16px', padding: '10px 16px', maxWidth: '70%', fontSize: 15, boxShadow: '0 2px 8px #7CA7CE33', WebkitTextFillColor: '#fff', color: '#fff !important' },
  msgMeta: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, fontSize: 11, color: '#b0b0b0', justifyContent: 'flex-end' },
  msgTime: { fontSize: 11, color: '#b0b0b0' },
  msgSender: { fontSize: 11, color: '#7CA7CE', marginLeft: 4 },
  inputForm: { display: 'flex', borderTop: '1.5px solid #e6e6f6', padding: 12, background: '#23243a', borderRadius: '0 0 18px 18px' },
  inputMsg: { flex: 1, marginRight: 8 },
  sendBtn: { background: 'linear-gradient(90deg, #7CA7CE 0%, #BFD7ED 100%)', color: '#fff', border: 'none', borderRadius: 8, padding: '0 18px', fontWeight: 'bold', cursor: 'pointer', fontSize: 16, marginLeft: 8 },
}; 