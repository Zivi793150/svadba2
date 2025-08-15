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

// Подключение ботов
const telegramBot = require('./telegram-bot');
const whatsappBot = require('./whatsapp-bot');

const lastMessageTimestamps = {};

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