const mongoose = require('mongoose');

// Модель для отслеживания просмотров страниц
const pageViewSchema = new mongoose.Schema({
  page: { type: String, required: true },
  userAgent: String,
  ip: String,
  referrer: String,
  timestamp: { type: Date, default: Date.now },
  sessionId: String,
  deviceType: String, // mobile, tablet, desktop
  screenResolution: String,
  language: String
});

// Модель для отслеживания кликов по кнопкам
const buttonClickSchema = new mongoose.Schema({
  buttonId: { type: String, required: true },
  buttonText: String,
  page: String,
  timestamp: { type: Date, default: Date.now },
  sessionId: String,
  userAgent: String,
  ip: String
});

// Модель для отслеживания сессий пользователей
const userSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  startTime: { type: Date, default: Date.now },
  endTime: Date,
  duration: Number, // в миллисекундах
  pages: [String],
  userAgent: String,
  ip: String,
  deviceType: String,
  isActive: { type: Boolean, default: true }
});

// Модель для отслеживания конверсий
const conversionSchema = new mongoose.Schema({
  action: { type: String, required: true }, // 'chat_opened', 'order_started', 'telegram_clicked', etc.
  page: String,
  timestamp: { type: Date, default: Date.now },
  sessionId: String,
  userAgent: String,
  ip: String,
  metadata: mongoose.Schema.Types.Mixed // дополнительные данные
});

// Модель для отслеживания вовлеченности в чат
const chatEngagementSchema = new mongoose.Schema({
  sessionId: String,
  chatId: String,
  messagesSent: { type: Number, default: 0 },
  messagesReceived: { type: Number, default: 0 },
  filesSent: { type: Number, default: 0 },
  timeInChat: Number, // в миллисекундах
  timestamp: { type: Date, default: Date.now }
});

const PageView = mongoose.model('PageView', pageViewSchema);
const ButtonClick = mongoose.model('ButtonClick', buttonClickSchema);
const UserSession = mongoose.model('UserSession', userSessionSchema);
const Conversion = mongoose.model('Conversion', conversionSchema);
const ChatEngagement = mongoose.model('ChatEngagement', chatEngagementSchema);

module.exports = {
  PageView,
  ButtonClick,
  UserSession,
  Conversion,
  ChatEngagement
};
