const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  productTitle: {
    type: String,
    required: true
  },
  variant: {
    type: String,
    required: true,
    enum: ['noAnim', 'anim']
  },
  selection: {
    type: String,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  prepayAmount: {
    type: Number,
    required: true
  },
  prepayPercent: {
    type: Number,
    default: 30
  },
  customerInfo: {
    name: String,
    email: String,
    phone: String
  },
  screen: {
    label: String, // например, "1920×1080"
    aspect: String // например, "16:9"
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'cancelled', 'failed'],
    default: 'pending'
  },
  yookassaPaymentId: String,
  yookassaConfirmationUrl: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Обновляем updatedAt при каждом изменении
orderSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Order', orderSchema);
