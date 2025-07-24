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
const upload = multer({ storage });

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Подключение к MongoDB
mongoose.connect('mongodb+srv://Zivi:oaeJMDcv8uFtOPJT@tanker.gej6glt.mongodb.net/svadba?retryWrites=true&w=majority&appName=Tanker', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('MongoDB connected');
});

const Message = require('./message.model');

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

// Загрузка файла и создание сообщения с файлом
app.post('/api/messages/file', upload.single('file'), async (req, res) => {
  try {
    console.log('POST /api/messages/file', req.body, req.file);
    const { chatId, sender, text } = req.body;
    const file = req.file;
    if (!file) {
      console.log('Файл не загружен');
      return res.status(400).json({ error: 'Файл не загружен' });
    }
    const fileUrl = `/uploads/${file.filename}`;
    const fileType = file.mimetype;
    const message = new Message({ chatId, sender, text, fileUrl, fileType, delivered: true });
    await message.save();
    console.log('Message saved:', message);
    io.to(chatId).emit('message', message);
    res.status(201).json(message);
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