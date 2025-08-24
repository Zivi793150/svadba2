require('dotenv').config();
const mongoose = require('mongoose');

async function testMongoConnection() {
  console.log('=== Тест подключения к MongoDB ===\n');
  
  try {
    console.log('Подключение к MongoDB...');
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB подключена успешно');
    
    // Проверяем модели
    console.log('\nПроверка моделей:');
    
    try {
      const { PageView, ButtonClick, UserSession, Conversion, ChatEngagement } = require('./analytics.model');
      console.log('✅ Модели аналитики загружены');
      
      // Проверяем количество документов в каждой коллекции
      const pageViewCount = await PageView.countDocuments();
      const buttonClickCount = await ButtonClick.countDocuments();
      const userSessionCount = await UserSession.countDocuments();
      const conversionCount = await Conversion.countDocuments();
      const chatEngagementCount = await ChatEngagement.countDocuments();
      
      console.log('📊 Статистика коллекций:');
      console.log(`  PageView: ${pageViewCount} документов`);
      console.log(`  ButtonClick: ${buttonClickCount} документов`);
      console.log(`  UserSession: ${userSessionCount} документов`);
      console.log(`  Conversion: ${conversionCount} документов`);
      console.log(`  ChatEngagement: ${chatEngagementCount} документов`);
      
    } catch (error) {
      console.error('❌ Ошибка загрузки моделей:', error.message);
    }
    
    // Проверяем другие модели
    try {
      const Message = require('./message.model');
      const Order = require('./order.model');
      const Lead = require('./lead.model');
      
      const messageCount = await Message.countDocuments();
      const orderCount = await Order.countDocuments();
      const leadCount = await Lead.countDocuments();
      
      console.log('\n📊 Статистика других коллекций:');
      console.log(`  Message: ${messageCount} документов`);
      console.log(`  Order: ${orderCount} документов`);
      console.log(`  Lead: ${leadCount} документов`);
      
    } catch (error) {
      console.error('❌ Ошибка загрузки других моделей:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Ошибка подключения к MongoDB:', error.message);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\n🔌 Соединение с MongoDB закрыто');
    }
  }
  
  console.log('\n=== Тест завершен ===');
}

testMongoConnection().catch(console.error);
