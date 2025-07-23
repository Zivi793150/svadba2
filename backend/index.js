const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Подключение к MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/svadba', {
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
    const message = new Message({ chatId, sender, text });
    await message.save();
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка отправки сообщения' });
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

app.get('/', (req, res) => {
  res.send('Backend работает!');
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  // Получаем chatId при подключении
  socket.on('join', (chatId) => {
    socket.join(chatId);
  });

  // Получаем новое сообщение и рассылаем всем в чате
  socket.on('message', async (data) => {
    const { chatId, sender, text } = data;
    const message = new Message({ chatId, sender, text });
    await message.save();
    io.to(chatId).emit('message', message); // отправляем всем в комнате
  });
});

server.listen(PORT, () => {
  console.log(`Server + WebSocket started on http://localhost:${PORT}`);
}); 