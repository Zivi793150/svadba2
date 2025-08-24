require('dotenv').config();

console.log('=== Тест периодов аналитики (исправленная версия) ===\n');

// Тестируем логику периодов
function testPeriods() {
  const now = new Date();
  console.log('Текущее время UTC:', now.toISOString());
  console.log('Текущее время МСК:', now.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }));
  console.log('');

  // Тест периода 'day'
  console.log('📅 Период "day" (Последние сутки):');
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
  
  const dayStart = new Date(`${mskDateParts.year}-${mskDateParts.month}-${mskDateParts.day}T00:00:00+03:00`);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  const dayPrevious = new Date(dayStart.getTime() - 24 * 60 * 60 * 1000);
  
  console.log(`  Начало: ${dayStart.toISOString()} (${dayStart.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })})`);
  console.log(`  Конец: ${dayEnd.toISOString()} (${dayEnd.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })})`);
  console.log(`  Предыдущий день: ${dayPrevious.toISOString()} (${dayPrevious.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })})`);
  console.log('');

  // Тест периода 'week' (исправленная версия)
  console.log('📅 Период "week" (Последняя неделя):');
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
  const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekPrevious = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  console.log(`  Начало: ${weekStart.toISOString()} (${weekStart.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })})`);
  console.log(`  Конец: ${weekEnd.toISOString()} (${weekEnd.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })})`);
  console.log(`  Предыдущая неделя: ${weekPrevious.toISOString()} (${weekPrevious.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })})`);
  console.log('');

  // Тест периода 'month' (исправленная версия)
  console.log('📅 Период "month" (Последний месяц):');
  const monthWeekEnd = new Date(`${yesterdayMskParts.year}-${yesterdayMskParts.month}-${yesterdayMskParts.day}T00:00:00+03:00`);
  const monthWeekStart = new Date(monthWeekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const monthEnd = new Date(monthWeekStart.getTime());
  const monthStart = new Date(monthEnd.getTime() - 30 * 24 * 60 * 60 * 1000);
  const monthPrevious = new Date(monthStart.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  console.log(`  Начало: ${monthStart.toISOString()} (${monthStart.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })})`);
  console.log(`  Конец: ${monthEnd.toISOString()} (${monthEnd.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })})`);
  console.log(`  Предыдущий месяц: ${monthPrevious.toISOString()} (${monthPrevious.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })})`);
  console.log('');

  // Проверяем пересечения
  console.log('🔍 Проверка пересечений:');
  
  // День и неделя
  const dayWeekOverlap = dayStart < weekEnd && dayEnd > weekStart;
  console.log(`  День и неделя пересекаются: ${dayWeekOverlap ? '❌ ДА' : '✅ НЕТ'}`);
  
  if (dayWeekOverlap) {
    console.log(`    Пересечение: ${dayStart.toISOString()} - ${weekEnd.toISOString()}`);
  }
  
  // День и месяц
  const dayMonthOverlap = dayStart < monthEnd && dayEnd > monthStart;
  console.log(`  День и месяц пересекаются: ${dayMonthOverlap ? '❌ ДА' : '✅ НЕТ'}`);
  
  // Неделя и месяц
  const weekMonthOverlap = weekStart < monthEnd && weekEnd > monthStart;
  console.log(`  Неделя и месяц пересекаются: ${weekMonthOverlap ? '❌ ДА' : '✅ НЕТ'}`);
  
  if (weekMonthOverlap) {
    console.log(`    Пересечение: ${weekStart.toISOString()} - ${monthEnd.toISOString()}`);
  }

  console.log('');
  console.log('📊 Рекомендации:');
  if (!dayWeekOverlap && !dayMonthOverlap && !weekMonthOverlap) {
    console.log('✅ Все периоды корректно разделены');
  } else {
    console.log('❌ Есть пересечения периодов - нужно исправить логику');
  }

  console.log('');
  console.log('📋 Описание периодов:');
  console.log('  • "Последние сутки": с 00:00 МСК сегодня до 00:00 МСК завтра');
  console.log('  • "Последняя неделя": с 00:00 МСК 7 дней назад до 00:00 МСК вчера');
  console.log('  • "Последний месяц": с 00:00 МСК 30 дней назад до 00:00 МСК начала недели');
  console.log('  • "Последний год": с 00:00 МСК 365 дней назад до 00:00 МСК начала месяца');
}

testPeriods();
console.log('=== Тест завершен ===');
