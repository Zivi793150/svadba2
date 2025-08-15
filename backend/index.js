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
    const { page, userAgent, referrer } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const sessionId = req.headers['x-session-id'] || generateSessionId();
    const deviceType = getDeviceType(userAgent);
    
    const pageView = new PageView({
      page,
      userAgent,
      ip,
      referrer,
      sessionId,
      deviceType,
      screenResolution: req.body.screenResolution,
      language: req.body.language
    });
    
    await pageView.save();
    
    // Обновляем или создаем сессию
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

app.get('/api/analytics', async (req, res) => {
  try {
    // Получаем данные за последние 30 дней
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Просмотры страниц
    const pageViews = await PageView.find({ timestamp: { $gte: thirtyDaysAgo } });
    
    // Устройства
    const devices = await PageView.aggregate([
      { $match: { timestamp: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$deviceType', count: { $sum: 1 } } }
    ]);
    const devicesMap = {};
    devices.forEach(d => devicesMap[d._id] = d.count);
    
    // Клики по кнопкам
    const buttonClicks = await ButtonClick.aggregate([
      { $match: { timestamp: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$buttonText', count: { $sum: 1 } } }
    ]);
    const buttonClicksMap = {};
    buttonClicks.forEach(b => buttonClicksMap[b._id] = b.count);
    
    // Сессии пользователей
    const userSessions = await UserSession.find({ startTime: { $gte: thirtyDaysAgo } });
    
    // Популярные страницы
    const popularPages = await PageView.aggregate([
      { $match: { timestamp: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$page', count: { $sum: 1 } } }
    ]);
    const popularPagesMap = {};
    popularPages.forEach(p => popularPagesMap[p._id] = p.count);
    
    // Время на сайте
    const timeOnSite = userSessions
      .filter(s => s.duration)
      .map(s => s.duration);
    
    // Конверсии
    const conversions = await Conversion.aggregate([
      { $match: { timestamp: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$action', count: { $sum: 1 } } }
    ]);
    const conversionsMap = {};
    conversions.forEach(c => conversionsMap[c._id] = c.count);
    
    // Вовлеченность в чат
    const chatEngagement = await ChatEngagement.aggregate([
      { $match: { timestamp: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: null,
          totalMessagesSent: { $sum: '$messagesSent' },
          totalMessagesReceived: { $sum: '$messagesReceived' },
          totalFilesSent: { $sum: '$filesSent' },
          avgTimeInChat: { $avg: '$timeInChat' },
          totalSessions: { $sum: 1 }
        }
      }
    ]);
    
    const chatEngagementMap = chatEngagement[0] ? {
      'Всего сообщений отправлено': chatEngagement[0].totalMessagesSent,
      'Всего сообщений получено': chatEngagement[0].totalMessagesReceived,
      'Всего файлов отправлено': chatEngagement[0].totalFilesSent,
      'Среднее время в чате': Math.round(chatEngagement[0].avgTimeInChat / 1000 / 60) + ' мин',
      'Сессий с чатом': chatEngagement[0].totalSessions
    } : {};
    
    res.json({
      pageViews,
      devices: devicesMap,
      buttonClicks: buttonClicksMap,
      userSessions,
      popularPages: popularPagesMap,
      timeOnSite,
      conversions: conversionsMap,
      chatEngagement: chatEngagementMap
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Ошибка получения аналитики' });
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
      { $group: { _id: '$chatId', lastMessage: { $last: '$$ROOT' } } },
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