const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chatId: { type: String, required: true }, // id чата (sessionId или id пользователя)
  sender: { type: String, required: true }, // 'user' или 'admin'
  text: { type: String, required: false },
  viewed: { type: Boolean, default: false },
  delivered: { type: Boolean, default: false },
  fileUrl: { type: String },
  fileType: { type: String },
  createdAt: { type: Date, default: Date.now },
});

messageSchema.index({ chatId: 1 });
messageSchema.index({ createdAt: 1 });
messageSchema.index({ chatId: 1, createdAt: 1 });
messageSchema.index({ sender: 1 });

module.exports = mongoose.model('Message', messageSchema); 