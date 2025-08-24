const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Тестовый эндпоинт
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
    env: {
      MONGO_URL: process.env.MONGO_URL ? 'Set' : 'Not set',
      TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN ? 'Set' : 'Not set',
      ADMIN_TELEGRAM_ID: process.env.ADMIN_TEGRAM_ID ? 'Set' : 'Not set'
    }
  });
});

// Тестовый эндпоинт для проверки аналитики
app.get('/test-analytics', (req, res) => {
  const { period = 'day' } = req.query;
  
  // Тестовая логика для суточной аналитики
  const now = new Date();
  let startDate;
  
  if (period === 'day') {
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
  } else {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  
  res.json({
    period,
    startDate: startDate.toISOString(),
    mskTime: new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }),
    testData: {
      pageViews: 150,
      visitors: 45,
      conversions: 12,
      period: period === 'day' ? 'Последние сутки (с 00:00 МСК)' : 'Последняя неделя'
    }
  });
});

app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET /test - Basic backend test');
  console.log('  GET /test-analytics?period=day - Test daily analytics');
});
