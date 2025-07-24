import React, { useState, useEffect, useRef } from 'react';

const ADMIN_PASSWORD = 'admin123'; // временно, потом вынести на сервер

export default function AdminPanel() {
  const [password, setPassword] = useState('');
  const [isAuth, setIsAuth] = useState(false);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isAuth) {
      fetch('http://localhost:5000/api/chats')
        .then(res => res.json())
        .then(data => setChats(data))
        .catch(() => setError('Ошибка загрузки чатов'));
    }
  }, [isAuth]);

  useEffect(() => {
    if (!selectedChat) return;
    fetch(`http://localhost:5000/api/messages/${selectedChat}`)
      .then(res => res.json())
      .then(setMessages)
      .catch(() => setError('Ошибка загрузки сообщений'));
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
    await fetch('http://localhost:5000/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId: selectedChat, sender: 'admin', text: msg })
    });
    setMsg('');
    fetch(`http://localhost:5000/api/messages/${selectedChat}`)
      .then(res => res.json())
      .then(setMessages);
  };

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
      {/* Левая панель — список чатов */}
      <div style={{width:340,background:'var(--bg-secondary)',borderRight:'2px solid var(--accent-primary)',padding:0,overflowY:'auto',boxShadow:'2px 0 16px var(--shadow-color)'}}>
        <div style={{padding:'28px 22px',borderBottom:'2px solid var(--accent-primary)',fontWeight:900,fontSize:22,letterSpacing:1,color:'var(--accent-primary)',background:'var(--bg-secondary)'}}>Чаты</div>
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
      </div>
      {/* Правая панель — сообщения */}
      <div style={{flex:1,display:'flex',flexDirection:'column',height:'100vh',background:'var(--bg-primary)'}}>
        <div style={{padding:'28px 38px',borderBottom:'2px solid var(--accent-primary)',fontWeight:900,fontSize:22,letterSpacing:1,background:'var(--bg-secondary)',color:'var(--accent-primary)'}}>Сообщения</div>
        <div style={{flex:1,overflowY:'auto',padding:'38px 32px 0 32px',display:'flex',flexDirection:'column',gap:18}}>
          {selectedChat ? (
            messages.length > 0 ? (
              messages.map((m,i) => (
                <div key={i} style={{alignSelf:m.sender==='admin'?'flex-end':'flex-start',maxWidth:'70%'}}>
                  <div style={{background:m.sender==='admin'?'linear-gradient(90deg,var(--accent-secondary) 0%,var(--accent-primary) 100%)':'var(--bg-secondary)',color:m.sender==='admin'?'#fff':'var(--text-primary)',borderRadius:m.sender==='admin'?'16px 16px 4px 16px':'16px 16px 16px 4px',padding:'12px 18px',fontSize:16,boxShadow:'0 2px 8px var(--shadow-color)',marginBottom:2,fontWeight:600,letterSpacing:0.2}}>
                    <span>{m.text}</span>
                  </div>
                  <div style={{fontSize:12,color:'var(--text-secondary)',marginTop:2,textAlign:m.sender==='admin'?'right':'left'}}>
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {m.sender==='admin'?'Админ':'Пользователь'}
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
      </div>
    </div>
  );
} 