require('dotenv').config();
const mongoose = require('mongoose');

async function testAnalyticsAPI() {
  console.log('=== Тест API аналитики ===\n');
  
  try {
    console.log('Подключение к MongoDB...');
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ MongoDB подключена');
    
    // Импортируем модели
    const { PageView, ButtonClick, UserSession, Conversion, ChatEngagement } = require('./analytics.model');
    
    console.log('\n🧪 Тест логики суточной аналитики...');
    
    // Тестируем логику для периода 'day'
    const now = new Date();
    const mskDateParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Moscow',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(now).reduce((acc, p) => {
      if (p.type === 'year') acc.year = p.value;
      if (p.type === 'month') acc.month = p.value;
      if (p.type === 'day') acc.day = p.value;
      return acc;
    }, {});
    
    const startDate = new Date(`${mskDateParts.year}-${mskDateParts.month}-${mskDateParts.day}T00:00:00+03:00`);
    const yesterday = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
    
    console.log('📅 Период аналитики:');
    console.log(`  Начало суток МСК: ${startDate.toISOString()}`);
    console.log(`  Вчера МСК: ${yesterday.toISOString()}`);
    
    // Получаем данные за текущий период
    const pageViews = await PageView.find({ 
      timestamp: { $gte: startDate },
      page: { $ne: '/admin' }
    });
    
    const buttonClicks = await ButtonClick.find({ 
      timestamp: { $gte: startDate },
      page: { $ne: '/admin' }
    });
    
    const conversions = await Conversion.find({ 
      timestamp: { $gte: startDate },
      page: { $ne: '/admin' }
    });
    
    const chatEngagement = await ChatEngagement.find({ timestamp: { $gte: startDate } });
    const userSessions = await UserSession.find({ 
      startTime: { $gte: startDate },
      pages: { $not: /^\/admin/ }
    });
    
    // Получаем данные за предыдущий период
    const previousPageViews = await PageView.find({ 
      timestamp: { $gte: yesterday, $lt: startDate },
      page: { $ne: '/admin' }
    });
    
    const previousConversions = await Conversion.find({ 
      timestamp: { $gte: yesterday, $lt: startDate },
      page: { $ne: '/admin' }
    });
    
    const previousSessions = await UserSession.find({ 
      startTime: { $gte: yesterday, $lt: startDate },
      pages: { $not: /^\/admin/ }
    });
    
    console.log('\n📊 Данные за текущие сутки:');
    console.log(`  PageView: ${pageViews.length}`);
    console.log(`  ButtonClick: ${buttonClicks.length}`);
    console.log(`  Conversion: ${conversions.length}`);
    console.log(`  ChatEngagement: ${chatEngagement.length}`);
    console.log(`  UserSession: ${userSessions.length}`);
    
    console.log('\n📊 Данные за вчера:');
    console.log(`  PageView: ${previousPageViews.length}`);
    console.log(`  Conversion: ${previousConversions.length}`);
    console.log(`  UserSession: ${previousSessions.length}`);
    
    // Тестируем вычисление метрик
    const uniqueIps = new Set(userSessions.map(session => session.ip)).size;
    const uniqueSessionIds = new Set(userSessions.map(session => session.sessionId)).size;
    
    console.log('\n👥 Уникальные посетители:');
    console.log(`  По IP: ${uniqueIps}`);
    console.log(`  По SessionId: ${uniqueSessionIds}`);
    
    // Тестируем overview
    const overview = {
      totalVisitors: uniqueSessionIds,
      previousVisitors: [...new Set(previousSessions.map(s => s.sessionId))].length,
      totalPageViews: pageViews.length,
      previousPageViews: previousPageViews.length,
      totalConversions: conversions.length,
      previousConversions: previousConversions.length
    };
    
    console.log('\n📈 Overview:');
    console.log(`  Текущие посетители: ${overview.totalVisitors}`);
    console.log(`  Предыдущие посетители: ${overview.previousVisitors}`);
    console.log(`  Текущие просмотры: ${overview.totalPageViews}`);
    console.log(`  Предыдущие просмотры: ${overview.previousPageViews}`);
    console.log(`  Текущие конверсии: ${overview.totalConversions}`);
    console.log(`  Предыдущие конверсии: ${overview.previousConversions}`);
    
    // Тестируем рост
    const growthVisitors = overview.previousVisitors > 0 
      ? ((overview.totalVisitors - overview.previousVisitors) / overview.previousVisitors * 100).toFixed(1)
      : 0;
    
    const growthPageViews = overview.previousPageViews > 0
      ? ((overview.totalPageViews - overview.previousPageViews) / overview.previousPageViews * 100).toFixed(1)
      : 0;
    
    console.log('\n📊 Рост (%):');
    console.log(`  Посетители: ${growthVisitors}%`);
    console.log(`  Просмотры: ${growthPageViews}%`);
    
    console.log('\n✅ Тест API аналитики завершен успешно');
    
  } catch (error) {
    console.error('❌ Ошибка теста:', error.message);
    console.error(error.stack);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\n🔌 Соединение с MongoDB закрыто');
    }
  }
}

testAnalyticsAPI().catch(console.error);
