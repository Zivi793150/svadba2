const { YooKassa } = require('@appigram/yookassa-node');
const Order = require('./order.model');

class YooKassaService {
  constructor() {
    this.client = new YooKassa({
      shopId: process.env.YOOKASSA_SHOP_ID,
      secretKey: process.env.YOOKASSA_SECRET_KEY
    });
  }

  async createPayment(orderData) {
    try {
      // Создаем заказ в базе данных
      const order = new Order({
        orderId: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        productTitle: orderData.productTitle,
        variant: orderData.variant,
        selection: orderData.selection,
        totalPrice: orderData.totalPrice,
        prepayAmount: orderData.prepayAmount,
        customerInfo: orderData.customerInfo
      });

      await order.save();

      // Создаем платеж в ЮKassa
      const payment = await this.client.createPayment({
        amount: {
          value: orderData.prepayAmount.toString(),
          currency: 'RUB'
        },
        confirmation: {
          type: 'redirect',
          return_url: `${process.env.FRONTEND_URL || 'https://svadba2.onrender.com'}/payment-success?orderId=${order.orderId}`
        },
        capture: true,
        description: `Предоплата за ${orderData.productTitle} - ${orderData.variant === 'anim' ? 'с оживлением' : 'без оживления'}, ${orderData.selection}`,
        metadata: {
          orderId: order.orderId,
          productTitle: orderData.productTitle,
          variant: orderData.variant,
          selection: orderData.selection
        },
        idempotenceKey: order.orderId
      });

      // Обновляем заказ с информацией о платеже
      order.yookassaPaymentId = payment.id;
      order.yookassaConfirmationUrl = payment.confirmation.confirmation_url;
      await order.save();

      return {
        orderId: order.orderId,
        paymentId: payment.id,
        confirmationUrl: payment.confirmation.confirmation_url,
        amount: orderData.prepayAmount
      };
    } catch (error) {
      console.error('Ошибка создания платежа:', error);
      throw new Error('Не удалось создать платеж');
    }
  }

  async checkPaymentStatus(paymentId) {
    try {
      const payment = await this.client.getPayment(paymentId);
      return payment.status;
    } catch (error) {
      console.error('Ошибка проверки статуса платежа:', error);
      throw new Error('Не удалось проверить статус платежа');
    }
  }

  async processWebhook(webhookData) {
    try {
      const { object } = webhookData;
      
      if (object.status === 'succeeded') {
        // Платеж успешен, обновляем статус заказа
        const order = await Order.findOne({ yookassaPaymentId: object.id });
        if (order) {
          order.paymentStatus = 'paid';
          await order.save();
        }
      } else if (object.status === 'canceled') {
        // Платеж отменен
        const order = await Order.findOne({ yookassaPaymentId: object.id });
        if (order) {
          order.paymentStatus = 'cancelled';
          await order.save();
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Ошибка обработки webhook:', error);
      throw new Error('Не удалось обработать webhook');
    }
  }
}

module.exports = new YooKassaService();
