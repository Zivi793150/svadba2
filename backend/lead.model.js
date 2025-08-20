const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  leadId: { type: String, index: true, unique: true },
  name: String,
  term: String,
  budget: String,
  screen: String,
  product: String,
  source: String,
  channel: String,
  // Telegram связывание
  tgUserId: { type: String },
  tgUsername: { type: String },
  tgLinkedAt: { type: Date },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

module.exports = mongoose.models.Lead || mongoose.model('Lead', LeadSchema);


