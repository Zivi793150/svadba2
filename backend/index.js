const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop();
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + '.' + ext);
  }
});
const upload = multer({ storage: multer.memoryStorage() });
const cloudinary = require('cloudinary').v2;
require('dotenv').config();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'https://фейеро.рф',
  'https://xn--e1aalvju.xn--p1ai',
  /^https:\/\/.+\.vercel\.app$/
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(o => (typeof o === 'string' ? o === origin : o.test(origin)))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Подключение к MongoDB
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('MongoDB connected');
});

const Message = require('./message.model');
const { PageView, ButtonClick, UserSession, Conversion, ChatEngagement } = require('./analytics.model');
const Order = require('./order.model');
const yookassaService = require('./yookassa.service');

// Подключение ботов
const telegramBot = require('./telegram-bot');
const whatsappBot = require('./whatsapp-bot');

const lastMessageTimestamps = {};

// Функция для определения типа устройства
const getDeviceType = (userAgent) => {
  if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
    return /iPad/.test(userAgent) ? 'tablet' : 'mobile';
  }
  return 'desktop';
};

// Функция для генерации sessionId
const generateSessionId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// API для аналитики
app.post('/api/analytics/pageview', async (req, res) => {
  try {
    // Поддерживаем как JSON-тело, так и строку (например, из sendBeacon без заголовков)
    const rawBody = req.body;
    let body = {};
    if (typeof rawBody === 'string') {
      try { body = JSON.parse(rawBody); } catch (e) { body = {}; }
    } else if (Buffer.isBuffer(rawBody)) {
      try { body = JSON.parse(rawBody.toString('utf8')); } catch (e) { body = {}; }
    } else if (rawBody && typeof rawBody === 'object') {
      body = rawBody;
    }

    const page = body.page || req.query.page || '/';
    const userAgent = body.userAgent || req.headers['user-agent'] || '';
    const referrer = body.referrer || req.get('referer') || '';
    const ip = req.ip || req.connection.remoteAddress;
    const sessionId = req.headers['x-session-id'] || body.sessionId || generateSessionId();
    const deviceType = body.deviceType || getDeviceType(userAgent);

    // Если это сигнал об уходе со страницы — не создаём PageView, а обновляем длительность сессии
    if (body.action === 'page_leave') {
      let session = await UserSession.findOne({ sessionId });
      if (!session) {
        session = new UserSession({ sessionId, userAgent, ip, deviceType, pages: [page] });
      }
      const additional = Number(body.timeOnPage) || 0;
      session.duration = (session.duration || 0) + additional;
      session.endTime = new Date();
      session.isActive = false;
      // фиксируем последнюю страницу, если её нет в списке
      if (page && !session.pages.includes(page)) {
        session.pages.push(page);
      }
      await session.save();
      return res.json({ success: true, sessionId });
    }

    // Обычный просмотр страницы — сохраняем PageView и актуализируем сессию
    const pageView = new PageView({
      page,
      userAgent,
      ip,
      referrer,
      sessionId,
      deviceType,
      screenResolution: body.screenResolution,
      language: body.language
    });

    await pageView.save();

    let session = await UserSession.findOne({ sessionId });
    if (!session) {
      session = new UserSession({
        sessionId,
        userAgent,
        ip,
        deviceType,
        pages: [page]
      });
    } else {
      if (!session.pages.includes(page)) {
        session.pages.push(page);
      }
      session.isActive = true;
    }
    await session.save();

    res.json({ success: true, sessionId });
  } catch (err) {
    console.error('PageView error:', err);
    res.status(500).json({ error: 'Ошибка сохранения просмотра' });
  }
});

app.post('/api/analytics/button-click', async (req, res) => {
  try {
    const { buttonId, buttonText, page } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const sessionId = req.headers['x-session-id'];
    
    const buttonClick = new ButtonClick({
      buttonId,
      buttonText,
      page,
      sessionId,
      userAgent: req.body.userAgent,
      ip
    });
    
    await buttonClick.save();
    res.json({ success: true });
  } catch (err) {
    console.error('ButtonClick error:', err);
    res.status(500).json({ error: 'Ошибка сохранения клика' });
  }
});

app.post('/api/analytics/conversion', async (req, res) => {
  try {
    const { action, page, metadata } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const sessionId = req.headers['x-session-id'];
    
    const conversion = new Conversion({
      action,
      page,
      sessionId,
      userAgent: req.body.userAgent,
      ip,
      metadata
    });
    
    await conversion.save();
    res.json({ success: true });
  } catch (err) {
    console.error('Conversion error:', err);
    res.status(500).json({ error: 'Ошибка сохранения конверсии' });
  }
});

app.post('/api/analytics/chat-engagement', async (req, res) => {
  try {
    const { chatId, messagesSent, messagesReceived, filesSent, timeInChat } = req.body;
    const sessionId = req.headers['x-session-id'];
    
    const engagement = new ChatEngagement({
      sessionId,
      chatId,
      messagesSent,
      messagesReceived,
      filesSent,
      timeInChat
    });
    
    await engagement.save();
    res.json({ success: true });
  } catch (err) {
    console.error('ChatEngagement error:', err);
    res.status(500).json({ error: 'Ошибка сохранения вовлеченности' });
  }
});

// Аналитика
app.get('/api/analytics', async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    // Определяем дату начала периода
    const now = new Date();
    let startDate;
    let previousStartDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(startDate.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        startDate = new Date(0);
        previousStartDate = new Date(0);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Получаем данные за текущий период
    const pageViews = await PageView.find({ timestamp: { $gte: startDate } });
    const buttonClicks = await ButtonClick.find({ timestamp: { $gte: startDate } });
    const conversions = await Conversion.find({ timestamp: { $gte: startDate } });
    const chatEngagement = await ChatEngagement.find({ timestamp: { $gte: startDate } });
    const userSessions = await UserSession.find({ startTime: { $gte: startDate } });

    // Получаем данные за предыдущий период для сравнения
    const previousPageViews = await PageView.find({ 
      timestamp: { $gte: previousStartDate, $lt: startDate } 
    });
    const previousButtonClicks = await ButtonClick.find({ 
      timestamp: { $gte: previousStartDate, $lt: startDate } 
    });
    const previousConversions = await Conversion.find({ 
      timestamp: { $gte: previousStartDate, $lt: startDate } 
    });
    const previousChatEngagement = await ChatEngagement.find({ 
      timestamp: { $gte: previousStartDate, $lt: startDate } 
    });
    const previousSessions = await UserSession.find({ 
      startTime: { $gte: previousStartDate, $lt: startDate } 
    });

    // Анализ устройств
    const deviceStats = {};
    pageViews.forEach(view => {
      const deviceType = view.deviceType || 'desktop';
      deviceStats[deviceType] = (deviceStats[deviceType] || 0) + 1;
    });

    const devices = Object.entries(deviceStats)
      .map(([type, count]) => ({
        type,
        count,
        percentage: Math.round((count / pageViews.length) * 100)
      }))
      .sort((a, b) => b.count - a.count);

    // Популярные страницы
    const pageStats = {};
    pageViews.forEach(view => {
      const page = view.page || '/';
      pageStats[page] = (pageStats[page] || 0) + 1;
    });

    const popularPages = Object.entries(pageStats)
      .map(([path, views]) => ({
        path,
        name: path === '/' ? 'Главная' : path.split('/').pop() || path,
        views,
        percentage: Math.round((views / pageViews.length) * 100)
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Популярные кнопки
    const buttonStats = {};
    buttonClicks.forEach(click => {
      const key = `${click.buttonId}:${click.buttonText}`;
      buttonStats[key] = buttonStats[key] || { id: click.buttonId, text: click.buttonText, clicks: 0 };
      buttonStats[key].clicks++;
    });

    const topButtons = Object.values(buttonStats)
      .map(button => ({
        ...button,
        percentage: Math.round((button.clicks / buttonClicks.length) * 100)
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    // Конверсии
    const conversionStats = {};
    conversions.forEach(conversion => {
      const key = conversion.action;
      conversionStats[key] = conversionStats[key] || { action: conversion.action, count: 0, pages: new Set() };
      conversionStats[key].count++;
      conversionStats[key].pages.add(conversion.page);
    });

    const topConversions = Object.values(conversionStats)
      .map(conv => ({
        action: conv.action,
        count: conv.count,
        rate: Math.round((conv.count / pageViews.length) * 100 * 100) / 100,
        page: Array.from(conv.pages)[0] || '/'
      }))
      .sort((a, b) => b.count - a.count);

    // Вовлеченность в чат
    const totalMessagesSent = chatEngagement.reduce((sum, engagement) => sum + engagement.messagesSent, 0);
    const totalFilesSent = chatEngagement.reduce((sum, engagement) => sum + engagement.filesSent, 0);
    const avgTimeInChat = chatEngagement.length > 0 
      ? chatEngagement.reduce((sum, engagement) => sum + (engagement.timeInChat || 0), 0) / chatEngagement.length 
      : 0;
    const activeChats = chatEngagement.length;

    // Уникальные посетители — универсальные метрики
    const uniqueIps = new Set(userSessions.map(session => session.ip)).size;
    const uniqueSessionIds = new Set(userSessions.map(session => session.sessionId)).size;
    // Гибрид: если есть sessionId — используем его; если нет — fallback к ip+userAgent
    const hybridKey = (ip, ua, sid) => sid || `${ip}||${ua || ''}`;
    const currentHybridKeys = new Set(pageViews.map(v => hybridKey(v.ip, v.userAgent, v.sessionId)));
    const previousHybridKeys = new Set(previousPageViews.map(v => hybridKey(v.ip, v.userAgent, v.sessionId)));
    const uniqueHybrid = currentHybridKeys.size;

    const uniqueVisitors = uniqueIps; // для обратной совместимости старых полей (by IP)
    const totalSessions = userSessions.length;
    const avgSessionDuration = userSessions.length > 0
      ? userSessions.reduce((sum, session) => sum + (session.duration || 0), 0) / userSessions.length
      : 0;

    // Новые/возвратные по разным методам
    const previousIPs = new Set(previousSessions.map(s => s.ip));
    const newVisitorsByIp = [...new Set(userSessions.map(s => s.ip))].filter(ip => !previousIPs.has(ip)).length;
    const returningVisitorsByIp = uniqueIps - newVisitorsByIp;

    const previousSessionIds = new Set(previousSessions.map(s => s.sessionId));
    const currentSessionIds = new Set(userSessions.map(s => s.sessionId));
    const newVisitorsBySession = [...currentSessionIds].filter(id => !previousSessionIds.has(id)).length;
    const returningVisitorsBySession = uniqueSessionIds - newVisitorsBySession;

    const newVisitorsHybrid = [...currentHybridKeys].filter(k => !previousHybridKeys.has(k)).length;
    const returningVisitorsHybrid = uniqueHybrid - newVisitorsHybrid;

    // Тренды (упрощенная версия)
    const trends = [
      {
        metric: 'Просмотры',
        change: pageViews.length > 0 && previousPageViews.length > 0 
          ? Math.round(((pageViews.length - previousPageViews.length) / previousPageViews.length) * 100)
          : 0,
        data: [60, 70, 80, 65, 90, 85, 95]
      },
      {
        metric: 'Конверсии',
        change: conversions.length > 0 && previousConversions.length > 0
          ? Math.round(((conversions.length - previousConversions.length) / previousConversions.length) * 100)
          : 0,
        data: [40, 50, 45, 60, 55, 70, 65]
      }
    ];

    // Источники трафика (упрощенная версия)
    const referrerStats = {};
    pageViews.forEach(view => {
      const referrer = view.referrer || 'direct';
      referrerStats[referrer] = (referrerStats[referrer] || 0) + 1;
    });

    const topReferrers = Object.entries(referrerStats)
      .map(([source, visits]) => ({
        source: source === 'direct' ? 'Прямые переходы' : source,
        url: source === 'direct' ? '-' : source,
        visits,
        percentage: Math.round((visits / pageViews.length) * 100)
      }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 5);

    // Браузеры и ОС (упрощенная версия)
    const browserStats = [
      { name: 'Chrome', percentage: 65 },
      { name: 'Safari', percentage: 20 },
      { name: 'Firefox', percentage: 10 },
      { name: 'Edge', percentage: 5 }
    ];

    const osStats = [
      { name: 'Windows', percentage: 45 },
      { name: 'iOS', percentage: 30 },
      { name: 'Android', percentage: 20 },
      { name: 'macOS', percentage: 5 }
    ];

    // Почасовая активность
    const hourlyActivity = [];
    for (let i = 0; i < 24; i++) {
      const hourViews = pageViews.filter(view => {
        const hour = new Date(view.timestamp).getHours();
        return hour === i;
      }).length;
      
      hourlyActivity.push({
        hour: i,
        count: hourViews,
        percentage: pageViews.length > 0 ? Math.round((hourViews / pageViews.length) * 100) : 0
      });
    }

    // Недельная активность
    const weeklyActivity = [];
    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    for (let i = 0; i < 7; i++) {
      const dayViews = pageViews.filter(view => {
        const day = new Date(view.timestamp).getDay();
        return day === (i + 1) % 7; // Понедельник = 1, воскресенье = 0
      }).length;
      
      weeklyActivity.push({
        day: days[i],
        count: dayViews,
        percentage: pageViews.length > 0 ? Math.round((dayViews / pageViews.length) * 100) : 0
      });
    }

    // Обзор
    const overview = {
      totalVisitors: uniqueVisitors, // by IP (legacy)
      previousVisitors: [...new Set(previousSessions.map(s => s.ip))].length,
      totalPageViews: pageViews.length,
      previousPageViews: previousPageViews.length,
      totalChats: activeChats,
      previousChats: previousChatEngagement.length,
      totalConversions: conversions.length,
      previousConversions: previousConversions.length,
      avgSessionDuration,
      mobilePercentage: devices.find(d => d.type === 'mobile')?.percentage || 0,
      bounceRate: 35, // Упрощенная версия
      pagesPerSession: pageViews.length > 0 && uniqueVisitors > 0 
        ? Math.round((pageViews.length / uniqueVisitors) * 10) / 10 
        : 0,
      visitorsBreakdown: {
        byIp: uniqueIps,
        bySession: uniqueSessionIds,
        hybrid: uniqueHybrid
      }
    };

    res.json({
      overview,
      pageViews,
      devices,
      popularPages,
      buttonClicks: topButtons,
      conversions: topConversions,
      chatEngagement: {
        messagesSent: totalMessagesSent,
        filesSent: totalFilesSent,
        avgTimeInChat,
        activeChats
      },
      userSessions: {
        total: uniqueVisitors, // by IP (legacy)
        totalSessions: totalSessions,
        avgDuration: avgSessionDuration,
        newVisitors: newVisitorsByIp,
        returningVisitors: returningVisitorsByIp
      },
      visitors: {
        byIp: {
          total: uniqueIps,
          new: newVisitorsByIp,
          returning: returningVisitorsByIp
        },
        bySession: {
          total: uniqueSessionIds,
          new: newVisitorsBySession,
          returning: returningVisitorsBySession
        },
        hybrid: {
          total: uniqueHybrid,
          new: newVisitorsHybrid,
          returning: returningVisitorsHybrid
        }
      },
      trends,
      topReferrers,
      browserStats,
      osStats,
      hourlyActivity,
      weeklyActivity
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получить все сообщения по chatId с поддержкой пагинации
app.get('/api/messages/:chatId', async (req, res) => {
  try {
    const { limit = 20, skip = 0 } = req.query;
    const messages = await Message.find({ chatId: req.params.chatId })
      .sort({ createdAt: 1 })
      .skip(Number(skip))
      .limit(Number(limit));
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения сообщений' });
  }
});

// Отправить сообщение
app.post('/api/messages', async (req, res) => {
  try {
    const { chatId, sender, text } = req.body;
    if (!text || text.length > 1000) {
      return res.status(400).json({ error: 'Сообщение слишком длинное (макс. 1000 символов)' });
    }
    const now = Date.now();
    if (lastMessageTimestamps[chatId] && now - lastMessageTimestamps[chatId] < 2000) {
      return res.status(429).json({ error: 'Слишком часто! Подождите пару секунд.' });
    }
    lastMessageTimestamps[chatId] = now;
    const message = new Message({ chatId, sender, text, delivered: true });
    await message.save();
    io.to(chatId).emit('message', message); // Эмитим новое сообщение всем в комнате
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка отправки сообщения' });
  }
});

// Загрузка файла и создание сообщения с файлом (Cloudinary, memoryStorage)
app.post('/api/messages/file', upload.single('file'), async (req, res) => {
  try {
    const { chatId, sender, text } = req.body;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }
    // Загружаем файл в Cloudinary из памяти
    const originalName = file.originalname || 'file';
    // Пытаемся сохранять расширение, но избегая коллизий
    const stamp = Date.now();
    const safeBase = originalName.replace(/[^a-zA-Z0-9._-]+/g, '_');
    const publicIdBase = `${chatId}_${stamp}_${safeBase}`;

    const stream = cloudinary.uploader.upload_stream(
      { folder: 'svadba_chat', resource_type: 'auto', public_id: publicIdBase, use_filename: true, unique_filename: true, filename_override: originalName },
      async (error, result) => {
        if (error) {
          console.error('Ошибка загрузки файла в Cloudinary:', error);
          return res.status(500).json({ error: 'Ошибка загрузки файла' });
        }
        // Принудительно меняем delivery URL для изображений на raw с сохранением имени (для корректного скачивания)
        const fileUrl = result.secure_url;
        const fileType = result.resource_type;
        const fileName = originalName;
        const message = new Message({ chatId, sender, text, fileUrl, fileType, fileName, delivered: true });
        await message.save();
        io.to(chatId).emit('message', message);
        res.status(201).json(message);
      }
    );
    stream.end(file.buffer);
  } catch (err) {
    console.error('Ошибка загрузки файла:', err);
    res.status(500).json({ error: 'Ошибка загрузки файла' });
  }
});

// Получить количество сообщений по chatId
app.get('/api/messages/:chatId/count', async (req, res) => {
  try {
    const total = await Message.countDocuments({ chatId: req.params.chatId });
    res.json({ total });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка подсчёта сообщений' });
  }
});

// Получить список чатов (уникальные chatId) для админа
app.get('/api/chats', async (req, res) => {
  try {
    const chats = await Message.aggregate([
      { $sort: { createdAt: 1 } },
      { $group: { _id: '$chatId', lastMessage: { $last: '$$ROOT' }, count: { $sum: 1 } } },
      { $sort: { 'lastMessage.createdAt': -1 } }
    ]);
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения чатов' });
  }
});

app.post('/api/messages/viewed/:chatId', async (req, res) => {
  try {
    const { sender } = req.body; // 'user' или 'admin'
    const filter = { chatId: req.params.chatId, sender: sender === 'user' ? 'admin' : 'user', viewed: false };
    await Message.updateMany(filter, { $set: { viewed: true } });
    // Получаем id обновлённых сообщений
    const updatedMessages = await Message.find({ chatId: req.params.chatId, sender: sender === 'user' ? 'admin' : 'user', viewed: true });
    io.to(req.params.chatId).emit('viewed', { chatId: req.params.chatId, sender, ids: updatedMessages.map(m => m._id) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка пометки как прочитанные' });
  }
});

app.get('/', (req, res) => {
  res.send('Backend работает!');
});

// Webhook для WhatsApp бота
app.post('/webhook/whatsapp', whatsappBot.handleWebhook);
app.get('/webhook/whatsapp', whatsappBot.verifyWebhook);

// Webhook для Telegram бота
app.post('/webhook/telegram', (req, res) => {
  try {
    telegramBot.processUpdate(req.body);
    res.sendStatus(200);
  } catch (e) {
    console.error('Telegram webhook error:', e);
    res.sendStatus(500);
  }
});

// Диагностика Telegram webhook
app.get('/webhook/telegram/info', async (req, res) => {
  try {
    const info = await telegramBot.getWebHookInfo();
    res.json(info);
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.get('/webhook/telegram/setup', async (req, res) => {
  try {
    const base = (process.env.TELEGRAM_WEBHOOK_BASE || process.env.RENDER_EXTERNAL_URL || process.env.FRONTEND_URL || 'https://svadba2.onrender.com').replace(/\/$/, '');
    const url = `${base}/webhook/telegram`;
    await telegramBot.setWebHook(url);
    res.json({ ok: true, url });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.get('/webhook/telegram/delete', async (req, res) => {
  try {
    await telegramBot.deleteWebHook({ drop_pending_updates: true });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

// API для заказов и оплаты
app.post('/api/orders', async (req, res) => {
  try {
    const { productTitle, variant, selection, totalPrice, prepayAmount, customerInfo } = req.body;
    
    const paymentData = await yookassaService.createPayment({
      productTitle,
      variant,
      selection,
      totalPrice,
      prepayAmount,
      customerInfo
    });
    
    res.json(paymentData);
  } catch (error) {
    console.error('Ошибка создания заказа:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/orders/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }
    res.json(order);
  } catch (error) {
    console.error('Ошибка получения заказа:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders/:orderId/customer-info', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const order = await Order.findOne({ orderId: req.params.orderId });
    
    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }
    
    order.customerInfo = { name, email, phone };
    await order.save();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка обновления информации о клиенте:', error);
    res.status(500).json({ error: error.message });
  }
});

// Получить все заказы
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Ошибка получения заказов:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook для ЮKassa
app.post('/webhook/yookassa', async (req, res) => {
  try {
    await yookassaService.processWebhook(req.body);
    res.sendStatus(200);
  } catch (error) {
    console.error('Ошибка обработки webhook ЮKassa:', error);
    res.sendStatus(500);
  }
});

// Раздача файлов из папки uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  socket.on('join', (chatId) => {
    socket.join(chatId);
  });
});

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at:', p, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

server.listen(PORT, () => {
  console.log(`Server + WebSocket started on http://localhost:${PORT}`);
}); 