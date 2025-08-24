require('dotenv').config();

console.log('=== Тест основных функций бэкенда ===\n');

// Проверка переменных окружения
console.log('Переменные окружения:');
console.log('MONGO_URL:', process.env.MONGO_URL ? 'Установлен' : 'НЕ УСТАНОВЛЕН');
console.log('TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? 'Установлен' : 'НЕ УСТАНОВЛЕН');
console.log('ADMIN_TELEGRAM_ID:', process.env.ADMIN_TELEGRAM_ID ? 'Установлен' : 'НЕ УСТАНОВЛЕН');
console.log('PORT:', process.env.PORT || 5000);
console.log('');

// Тест функции parseAdminIds
function parseAdminIds() {
  const raw = String(process.env.ADMIN_TELEGRAM_IDS || process.env.ADMIN_TELEGRAM_ID || '').trim();
  if (!raw) return [];
  return raw
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((s) => Number(s))
    .filter((n) => !Number.isNaN(n));
}

console.log('Тест parseAdminIds:');
console.log('Результат:', parseAdminIds());
console.log('');

// Тест логики суточной аналитики
console.log('Тест логики суточной аналитики:');
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

console.log('Текущее время UTC:', now.toISOString());
console.log('Текущее время МСК:', now.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }));
console.log('Начало суток МСК:', startDate.toISOString());
console.log('Вчера МСК:', yesterday.toISOString());
console.log('');

// Тест импорта модулей
console.log('Тест импорта модулей:');
try {
  const mongoose = require('mongoose');
  console.log('✅ mongoose загружен');
  
  const express = require('express');
  console.log('✅ express загружен');
  
  const cors = require('cors');
  console.log('✅ cors загружен');
  
  console.log('Все основные модули загружены успешно');
} catch (error) {
  console.error('❌ Ошибка загрузки модулей:', error.message);
}

console.log('\n=== Тест завершен ===');
