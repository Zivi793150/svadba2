const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chatId: { type: String, required: true }, // id чата (sessionId или id пользователя)
  sender: { type: String, required: true }, // 'user' или 'admin'
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Message', messageSchema); 