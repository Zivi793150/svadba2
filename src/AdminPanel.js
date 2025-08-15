import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const ADMIN_PASSWORD = 'Feyero2024!@#$Secure'; // надежный пароль для админ-панели
const API_URL = process.env.REACT_APP_API_URL || 'https://svadba2.onrender.com';
const socket = io(API_URL);

export default function AdminPanel() {
  const [password, setPassword] = useState('');
  const [isAuth, setIsAuth] = useState(false);
  const [activeTab, setActiveTab] = useState('chats'); // chats, analytics
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState({
    pageViews: [],
    devices: {},
    buttonClicks: {},
    userSessions: [],
    popularPages: {},
    timeOnSite: [],
    chatEngagement: {},
    conversions: {}
  });
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isAuth) {
      if (activeTab === 'chats') {
        fetch(`${API_URL}/api/chats`)
          .then(res => res.json())
          .then(data => setChats(data))
          .catch(() => setError('Ошибка загрузки чатов'));
      } else if (activeTab === 'analytics') {
        fetchAnalytics();
      }
    }
  }, [isAuth, activeTab]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/analytics`);
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      setError('Ошибка загрузки аналитики');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedChat) return;
    fetch(`${API_URL}/api/messages/${selectedChat}`)
      .then(res => res.json())
      .then(setMessages)
      .catch(() => setError('Ошибка загрузки сообщений'));
    // Пометить все сообщения пользователя как просмотренные
    fetch(`${API_URL}/api/messages/viewed/${selectedChat}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: 'admin' })
    });
    socket.emit('join', selectedChat);
    const onMsg = (msg) => {
      console.log('Получено сообщение через socket (admin):', msg);
      if (msg.chatId === selectedChat) {
        setMessages(prev => [...prev, msg]);
        // Мгновенно помечаем сообщения пользователя как прочитанные
        fetch(`${API_URL}/api/messages/viewed/${selectedChat}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sender: 'admin' })
        });
      }
    };
    const onViewed = (data) => {
      if (data.chatId === selectedChat) {
        setMessages(prev => prev.map(m => data.ids.includes(m._id) ? { ...m, viewed: true } : m));
      }
    };
    socket.on('message', onMsg);
    socket.on('viewed', onViewed);
    return () => {
      socket.off('message', onMsg);
      socket.off('viewed', onViewed);
    };
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuth(true);
      setError('');
    } else {
      setError('Неверный пароль');
    }
  };

  const sendMsg = async (e) => {
    e.preventDefault();
    if (!msg.trim() || !selectedChat) return;
    await fetch(`${API_URL}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId: selectedChat, sender: 'admin', text: msg })
    });
    setMsg('');
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ru-RU').format(num);
  };

  const getDeviceIcon = (device) => {
    switch (device) {
      case 'mobile': return '📱';
      case 'tablet': return '📱';
      case 'desktop': return '💻';
      default: return '🖥️';
    }
  };

  const renderAnalytics = () => (
    <div style={{padding: '32px', background: 'var(--bg-primary)', height: '100vh', overflowY: 'auto'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px'}}>
        <h1 style={{color: 'var(--accent-primary)', fontWeight: 900, fontSize: '28px', letterSpacing: 1}}>Аналитика сайта</h1>
        <button 
          onClick={fetchAnalytics}
          style={{
            background: 'linear-gradient(90deg, var(--accent-secondary) 0%, var(--accent-tertiary) 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 24px',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🔄 Обновить
        </button>
      </div>

      {loading ? (
        <div style={{textAlign: 'center', color: 'var(--text-secondary)', fontSize: '18px'}}>Загрузка аналитики...</div>
      ) : (
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px'}}>
          {/* Основные метрики */}
          <div style={{background: 'var(--bg-secondary)', borderRadius: '16px', padding: '24px', border: '2px solid var(--accent-primary)'}}>
            <h3 style={{color: 'var(--accent-primary)', marginBottom: '16px', fontSize: '18px', fontWeight: 700}}>📊 Основные метрики</h3>
            <div style={{display: 'grid', gap: '12px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)'}}>
                <span>Просмотры страниц:</span>
                <span style={{fontWeight: 700, color: 'var(--accent-secondary)'}}>{formatNumber(analytics.pageViews.length)}</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)'}}>
                <span>Уникальные сессии:</span>
                <span style={{fontWeight: 700, color: 'var(--accent-secondary)'}}>{formatNumber(analytics.userSessions.length)}</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)'}}>
                <span>Активные чаты:</span>
                <span style={{fontWeight: 700, color: 'var(--accent-secondary)'}}>{formatNumber(chats.length)}</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', padding: '8px 0'}}>
                <span>Среднее время на сайте:</span>
                <span style={{fontWeight: 700, color: 'var(--accent-secondary)'}}>
                  {analytics.timeOnSite.length > 0 
                    ? Math.round(analytics.timeOnSite.reduce((a, b) => a + b, 0) / analytics.timeOnSite.length / 1000 / 60) + ' мин'
                    : '0 мин'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Устройства */}
          <div style={{background: 'var(--bg-secondary)', borderRadius: '16px', padding: '24px', border: '2px solid var(--accent-primary)'}}>
            <h3 style={{color: 'var(--accent-primary)', marginBottom: '16px', fontSize: '18px', fontWeight: 700}}>📱 Устройства</h3>
            <div style={{display: 'grid', gap: '12px'}}>
              {Object.entries(analytics.devices).map(([device, count]) => (
                <div key={device} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-color)'}}>
                  <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    {getDeviceIcon(device)} {device}
                  </span>
                  <span style={{fontWeight: 700, color: 'var(--accent-secondary)'}}>{formatNumber(count)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Популярные страницы */}
          <div style={{background: 'var(--bg-secondary)', borderRadius: '16px', padding: '24px', border: '2px solid var(--accent-primary)'}}>
            <h3 style={{color: 'var(--accent-primary)', marginBottom: '16px', fontSize: '18px', fontWeight: 700}}>🌐 Популярные страницы</h3>
            <div style={{display: 'grid', gap: '12px'}}>
              {Object.entries(analytics.popularPages)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([page, count]) => (
                  <div key={page} style={{display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)'}}>
                    <span style={{fontSize: '14px'}}>{page}</span>
                    <span style={{fontWeight: 700, color: 'var(--accent-secondary)'}}>{formatNumber(count)}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Клики по кнопкам */}
          <div style={{background: 'var(--bg-secondary)', borderRadius: '16px', padding: '24px', border: '2px solid var(--accent-primary)'}}>
            <h3 style={{color: 'var(--accent-primary)', marginBottom: '16px', fontSize: '18px', fontWeight: 700}}>🖱️ Клики по кнопкам</h3>
            <div style={{display: 'grid', gap: '12px'}}>
              {Object.entries(analytics.buttonClicks)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([button, count]) => (
                  <div key={button} style={{display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)'}}>
                    <span style={{fontSize: '14px'}}>{button}</span>
                    <span style={{fontWeight: 700, color: 'var(--accent-secondary)'}}>{formatNumber(count)}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Конверсии */}
          <div style={{background: 'var(--bg-secondary)', borderRadius: '16px', padding: '24px', border: '2px solid var(--accent-primary)'}}>
            <h3 style={{color: 'var(--accent-primary)', marginBottom: '16px', fontSize: '18px', fontWeight: 700}}>🎯 Конверсии</h3>
            <div style={{display: 'grid', gap: '12px'}}>
              {Object.entries(analytics.conversions).map(([action, count]) => (
                <div key={action} style={{display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)'}}>
                  <span style={{fontSize: '14px'}}>{action}</span>
                  <span style={{fontWeight: 700, color: 'var(--accent-secondary)'}}>{formatNumber(count)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Вовлеченность в чат */}
          <div style={{background: 'var(--bg-secondary)', borderRadius: '16px', padding: '24px', border: '2px solid var(--accent-primary)'}}>
            <h3 style={{color: 'var(--accent-primary)', marginBottom: '16px', fontSize: '18px', fontWeight: 700}}>💬 Вовлеченность в чат</h3>
            <div style={{display: 'grid', gap: '12px'}}>
              {Object.entries(analytics.chatEngagement).map(([metric, value]) => (
                <div key={metric} style={{display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)'}}>
                  <span style={{fontSize: '14px'}}>{metric}</span>
                  <span style={{fontWeight: 700, color: 'var(--accent-secondary)'}}>{typeof value === 'number' ? formatNumber(value) : value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (!isAuth) {
    return (
      <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh',background:'var(--bg-primary)'}}>
        <form onSubmit={handleLogin} style={{background:'var(--bg-secondary)',padding:32,borderRadius:24,boxShadow:'0 8px 48px 0 var(--shadow-color), 0 2px 8px 0 var(--shadow-color)',minWidth:320, border:'2px solid var(--accent-primary)'}}>
          <h2 style={{marginBottom:24, color:'var(--accent-primary)', fontWeight:900, letterSpacing:1}}>Вход для администратора</h2>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Пароль" style={{width:'100%',padding:16,borderRadius:16,border:'1.5px solid var(--accent-secondary)',marginBottom:18, color:'#fff', background:'var(--bg-primary)', fontWeight:500, fontSize:18, boxShadow:'0 2px 8px var(--shadow-color)', outline:'none'}} autoFocus />
          <button type="submit" style={{width:'100%',padding:16,borderRadius:16,background:'linear-gradient(90deg, var(--accent-secondary) 0%, var(--accent-tertiary) 100%)',color:'#fff',fontWeight:800,border:'2px solid var(--accent-primary)',fontSize:18,boxShadow:'0 4px 24px var(--shadow-color)',cursor:'pointer',letterSpacing:1}}>Войти</button>
          {error && <div style={{color:'#ff3b3b',marginTop:12}}>{error}</div>}
        </form>
      </div>
    );
  }

  return (
    <div style={{display:'flex',height:'100vh',background:'var(--bg-primary)',color:'var(--text-primary)',fontFamily:'inherit'}}>
      {/* Левая панель — навигация */}
      <div style={{width:340,background:'var(--bg-secondary)',borderRight:'2px solid var(--accent-primary)',padding:0,overflowY:'auto',boxShadow:'2px 0 16px var(--shadow-color)'}}>
        <div style={{padding:'28px 22px',borderBottom:'2px solid var(--accent-primary)',fontWeight:900,fontSize:22,letterSpacing:1,color:'var(--accent-primary)',background:'var(--bg-secondary)'}}>Панель управления</div>
        
        {/* Вкладки */}
        <div style={{padding:'16px 0'}}>
          <div 
            onClick={() => setActiveTab('chats')}
            style={{
              padding:'16px 22px',
              cursor:'pointer',
              background:activeTab==='chats'?'var(--accent-primary)':'var(--bg-secondary)',
              color:activeTab==='chats'?'#fff':'var(--text-primary)',
              fontWeight:activeTab==='chats'?800:600,
              borderLeft:activeTab==='chats'?'4px solid var(--accent-tertiary)':'4px solid transparent',
              transition:'all 0.2s'
            }}
          >
            💬 Чаты ({chats.length})
          </div>
          <div 
            onClick={() => setActiveTab('analytics')}
            style={{
              padding:'16px 22px',
              cursor:'pointer',
              background:activeTab==='analytics'?'var(--accent-primary)':'var(--bg-secondary)',
              color:activeTab==='analytics'?'#fff':'var(--text-primary)',
              fontWeight:activeTab==='analytics'?800:600,
              borderLeft:activeTab==='analytics'?'4px solid var(--accent-tertiary)':'4px solid transparent',
              transition:'all 0.2s'
            }}
          >
            📊 Аналитика
          </div>
        </div>

        {/* Список чатов (только для вкладки чатов) */}
        {activeTab === 'chats' && (
          <div style={{padding:0}}>
            {chats.map(chat => (
              <div key={chat._id}
                   onClick={()=>setSelectedChat(chat._id)}
                   style={{padding:'18px 22px',borderBottom:'1.5px solid var(--border-color)',cursor:'pointer',background:selectedChat===chat._id?'var(--accent-primary)':'var(--bg-secondary)',transition:'background 0.2s',color:selectedChat===chat._id?'#fff':'var(--text-primary)',fontWeight:selectedChat===chat._id?800:600,borderLeft:selectedChat===chat._id?'4px solid var(--accent-tertiary)':'4px solid transparent'}}>
                <div style={{fontWeight:800,fontSize:16,letterSpacing:0.5}}>{chat._id}</div>
                <div style={{fontSize:14,color:selectedChat===chat._id?'#fff':'var(--accent-secondary)',margin:'4px 0 2px 0'}}>{chat.lastMessage?.text?.slice(0, 40) || '—'}</div>
                <div style={{fontSize:12,color:selectedChat===chat._id?'#fff':'var(--text-secondary)'}}>{chat.lastMessage?.createdAt ? new Date(chat.lastMessage.createdAt).toLocaleString() : '—'}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Правая панель — контент */}
      <div style={{flex:1,display:'flex',flexDirection:'column',height:'100vh',background:'var(--bg-primary)'}}>
        {activeTab === 'chats' ? (
          <>
            <div style={{padding:'28px 38px',borderBottom:'2px solid var(--accent-primary)',fontWeight:900,fontSize:22,letterSpacing:1,background:'var(--bg-secondary)',color:'var(--accent-primary)'}}>Сообщения</div>
            <div style={{flex:1,overflowY:'auto',padding:'38px 32px 0 32px',display:'flex',flexDirection:'column',gap:18}}>
              {selectedChat ? (
                messages.length > 0 ? (
                  messages.map((m,i) => (
                    <div key={i} style={{alignSelf:m.sender==='admin'?'flex-end':'flex-start',maxWidth:'70%'}}>
                      {m.fileUrl ? (
                        m.fileType && m.fileType.startsWith('image/') ? (
                          <img src={API_URL + m.fileUrl} alt="file" style={{maxWidth:180,maxHeight:180,borderRadius:12,marginBottom:6}} />
                        ) : (
                          <a href={API_URL + m.fileUrl} target="_blank" rel="noopener noreferrer" style={{color:'#7CA7CE',wordBreak:'break-all',display:'block',marginBottom:6}}>
                            📎 Скачать файл
                          </a>
                        )
                      ) : null}
                      <div style={{background:m.sender==='admin'?'linear-gradient(90deg,var(--accent-secondary) 0%,var(--accent-primary) 100%)':'var(--bg-secondary)',color:m.sender==='admin'?'#fff':'var(--text-primary)',borderRadius:m.sender==='admin'?'16px 16px 4px 16px':'16px 16px 16px 4px',padding:'12px 18px',fontSize:16,boxShadow:'0 2px 8px var(--shadow-color)',marginBottom:2,fontWeight:600,letterSpacing:0.2}}>
                        <span>{m.text}</span>
                      </div>
                      <div style={{fontSize:12,color:'var(--text-secondary)',marginTop:2,textAlign:m.sender==='admin'?'right':'left'}}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {m.sender==='admin'?'Админ':'Пользователь'}
                        {m.sender==='user' && m.viewed && <span style={{marginLeft:6,color:'var(--accent-tertiary)'}}>✓✓</span>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{color:'var(--text-secondary)',marginTop:40}}>Нет сообщений</div>
                )
              ) : (
                <div style={{color:'var(--text-secondary)',marginTop:40}}>Выберите чат слева</div>
              )}
              <div ref={messagesEndRef} />
            </div>
            {/* Форма отправки сообщения */}
            {selectedChat && (
              <form onSubmit={sendMsg} style={{display:'flex',borderTop:'2px solid var(--accent-primary)',padding:'22px 32px',background:'var(--bg-secondary)'}} autoComplete="off">
                <input
                  style={{flex:1,border:'1.5px solid var(--accent-secondary)',borderRadius:16,padding:'12px 18px',fontSize:16,marginRight:16,color:'#fff',background:'var(--bg-primary)',fontWeight:500,outline:'none',boxShadow:'0 2px 8px var(--shadow-color)'}}
                  value={msg}
                  onChange={e=>setMsg(e.target.value)}
                  placeholder="Введите сообщение..."
                  autoFocus
                />
                <button type="submit" style={{background:'linear-gradient(90deg,var(--accent-secondary) 0%,var(--accent-tertiary) 100%)',color:'#fff',border:'none',borderRadius:16,padding:'0 32px',fontWeight:800,fontSize:16,cursor:'pointer',boxShadow:'0 4px 24px var(--shadow-color)',letterSpacing:1}}>Отправить</button>
              </form>
            )}
          </>
        ) : (
          renderAnalytics()
        )}
      </div>
    </div>
  );
} 