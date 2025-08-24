require('dotenv').config();
const mongoose = require('mongoose');

async function testFinalAnalytics() {
  console.log('=== Финальный тест API аналитики ===\n');
  
  try {
    console.log('Подключение к MongoDB...');
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ MongoDB подключена');
    
    // Импортируем модели
    const { PageView, ButtonClick, UserSession, Conversion, ChatEngagement } = require('./analytics.model');
    
    console.log('\n🧪 Тест всех периодов аналитики...');
    
    const periods = ['day', 'week', 'month', 'year'];
    
    for (const period of periods) {
      console.log(`\n📅 Тестируем период: ${period}`);
      
      // Тестируем логику для каждого периода
      const now = new Date();
      let startDate;
      let previousStartDate;
      
      switch (period) {
        case 'day':
          // С 00:00 по МСК (Europe/Moscow)
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
          
          startDate = new Date(`${mskDateParts.year}-${mskDateParts.month}-${mskDateParts.day}T00:00:00+03:00`);
          const yesterday = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
          previousStartDate = new Date(yesterday.getTime());
          break;
          
        case 'week':
          // Последние 7 дней, НЕ включая текущие сутки
          const yesterdayMsk = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          const yesterdayMskParts = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Europe/Moscow',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).formatToParts(yesterdayMsk).reduce((acc, p) => {
            if (p.type === 'year') acc.year = p.value;
            if (p.type === 'month') acc.month = p.value;
            if (p.type === 'day') acc.day = p.value;
            return acc;
          }, {});
          
          const weekEnd = new Date(`${yesterdayMskParts.year}-${yesterdayMskParts.month}-${yesterdayMskParts.day}T00:00:00+03:00`);
          startDate = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
          previousStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
          
        case 'month':
          // Последние 30 дней, НЕ включая текущие сутки
          const monthYesterdayMsk = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          const monthYesterdayMskParts = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Europe/Moscow',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).formatToParts(monthYesterdayMsk).reduce((acc, p) => {
            if (p.type === 'year') acc.year = p.value;
            if (p.type === 'month') acc.month = p.value;
            if (p.type === 'day') acc.day = p.value;
            return acc;
          }, {});
          
          const monthWeekEnd = new Date(`${monthYesterdayMskParts.year}-${monthYesterdayMskParts.month}-${monthYesterdayMskParts.day}T00:00:00+03:00`);
          const monthWeekStart = new Date(monthWeekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
          
          startDate = new Date(monthWeekStart.getTime() - 23 * 24 * 60 * 60 * 1000);
          previousStartDate = new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
          
        case 'year':
          // Последние 365 дней, НЕ включая текущие сутки
          const yearYesterdayMsk = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          const yearYesterdayMskParts = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Europe/Moscow',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).formatToParts(yearYesterdayMsk).reduce((acc, p) => {
            if (p.type === 'year') acc.year = p.value;
            if (p.type === 'month') acc.month = p.value;
            if (p.type === 'day') acc.day = p.value;
            return acc;
          }, {});
          
          const yearMonthEnd = new Date(`${yearYesterdayMskParts.year}-${yearYesterdayMskParts.month}-${yearYesterdayMskParts.day}T00:00:00+03:00`);
          const yearMonthStart = new Date(yearMonthEnd.getTime() - 30 * 24 * 60 * 60 * 1000);
          
          startDate = new Date(yearMonthStart.getTime() - 335 * 24 * 60 * 60 * 1000);
          previousStartDate = new Date(startDate.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
      }
      
      console.log(`  Период: ${startDate.toISOString()} - ${period === 'day' ? 'сейчас' : 'вчера'}`);
      console.log(`  Предыдущий: ${previousStartDate.toISOString()} - ${startDate.toISOString()}`);
      
      // Получаем данные за текущий период
      const pageViews = await PageView.find({ 
        timestamp: { $gte: startDate },
        page: { $ne: '/admin' }
      });
      
      const conversions = await Conversion.find({ 
        timestamp: { $gte: startDate },
        page: { $ne: '/admin' }
      });
      
      const userSessions = await UserSession.find({ 
        startTime: { $gte: startDate },
        pages: { $not: /^\/admin/ }
      });
      
      // Получаем данные за предыдущий период
      const previousPageViews = await PageView.find({ 
        timestamp: { $gte: previousStartDate, $lt: startDate },
        page: { $ne: '/admin' }
      });
      
      const previousConversions = await Conversion.find({ 
        timestamp: { $gte: previousStartDate, $lt: startDate },
        page: { $ne: '/admin' }
      });
      
      const previousSessions = await UserSession.find({ 
        startTime: { $gte: previousStartDate, $lt: startDate },
        pages: { $not: /^\/admin/ }
      });
      
      // Вычисляем метрики
      const uniqueSessionIds = new Set(userSessions.map(session => session.sessionId)).size;
      const previousUniqueSessionIds = new Set(previousSessions.map(session => session.sessionId)).size;
      
      const growth = previousUniqueSessionIds > 0 
        ? ((uniqueSessionIds - previousUniqueSessionIds) / previousUniqueSessionIds * 100).toFixed(1)
        : 0;
      
      console.log(`  📊 Результаты:`);
      console.log(`    Посетители: ${uniqueSessionIds} (${growth >= 0 ? '+' : ''}${growth}%)`);
      console.log(`    Просмотры: ${pageViews.length} (${previousPageViews.length > 0 ? ((pageViews.length - previousPageViews.length) / previousPageViews.length * 100).toFixed(1) : 0}%)`);
      console.log(`    Конверсии: ${conversions.length} (${previousConversions.length > 0 ? ((conversions.length - previousConversions.length) / previousConversions.length * 100).toFixed(1) : 0}%)`);
    }
    
    console.log('\n✅ Финальный тест завершен успешно');
    
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

testFinalAnalytics().catch(console.error);
