const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const { getLead, deleteLead } = require('./leadStore');
const Lead = require('./lead.model');
const axios = require('axios');

// Функция для отправки аналитики
const trackAnalytics = async (action, metadata = {}) => {
  try {
    const API_URL = process.env.API_URL || 'https://svadba2.onrender.com';
    await axios.post(`${API_URL}/api/analytics/conversion`, {
      action, 
      page: '/telegram_bot', 
      metadata,
      userAgent: 'TelegramBot',
      source: 'telegram_bot'
    });
  } catch (e) {
    console.error('Analytics send failed:', e);
  }
};

// Токен бота из переменных окружения
const token = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_IDS = String(process.env.ADMIN_TELEGRAM_IDS || process.env.ADMIN_TELEGRAM_ID || '')
  .split(/[\s,]+/)
  .filter(Boolean)
  .map(s => Number(s))
  .filter(n => !Number.isNaN(n));

// Проверяем наличие токена
if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN не найден в переменных окружения!');
  console.error('Добавьте TELEGRAM_BOT_TOKEN в .env файл или переменные окружения Render');
  process.exit(1);
}

console.log('✅ TELEGRAM_BOT_TOKEN найден');
console.log('ℹ️ ADMIN_TELEGRAM_IDS:', ADMIN_IDS);
const bot = new TelegramBot(token, { polling: false }); // В проде работаем через webhook

// Состояния пользователей
const userStates = new Map();

// Структура вопросов (аналогично чату на сайте)
const quickQuestions = {
  'Видео-приглашения — общая информация': {
    answer: `**Приглашение:** 
**Общая информация:**  
Пригласите своих гостей феерично и создайте WOW-эффект еще в самом начале!

Наши персональные видео-приглашения удивят и произведут WOW
– эффект на ваших гостей. Они запомнят вашу свадьбу еще с приглашения и точнозахотят на нее прийти.

Возможно сделать просто приглашение, одинаковое для всех,без обращения, как в шаблоне. А можно сделать именное приглашение для каждого
гостя отдельно.`,
    quickActions: ['Заказать', 'Консультация']
  },
  'Видео-приглашения — цены и сроки': {
    answer: `**Стоимость и сроки:** 
**Неименное приглашение:** 
Замена информации о мероприятии без имени – 2000 р./ срок –1 день
 **Именное приглашение:**  
С обращением и указанием каждого имени вначале: 
до 25 имен – 3000 р, 
до 50 имен – 4000 р, 
 51-100 имен – 5000 р 
Срок исполнения 2-5 дней, возможно быстрее по загруженности.`,
    quickActions: ['Заказать', 'Консультация']
  },
  'Можно ли заказать индивидуальное приглашение?': {
    answer: `Опишите как видите и мы скажем возможно ли это.`,
    quickActions: ['Заказать', 'Консультация']
  },
  'Свадебная презентация — общая информация': {
    answer: `**Свадебная презентация**
**Описание:** Ваша история любви — должна стать сердцем вашего торжества.

Большинство гостей не знают о молодожёнах порой даже самых главных фактов.
Расскажите о себе и своих близких так чтобы они запомнили этот момент навсегда. Мы превратим ваши любимые фотографии в кинематографичное видео‑шоу — с чёткой драматургией, красивыми переходами и музыкой — чтобы это тронуло до слез каждого.

1. Экран: Для данного видео необходим экран с пропорциями 16:9 или 16:10. Для экрана других пропорций его придется изменять. Если у вас экран с другими пропорциями- сообщите нам его размеры (ширину и длину) — мы скажем возможно ли адаптировать видео под него.
Под вертикальный экран его адаптировать нельзя.

2. Если вам нужно найти и подобрать экран - сообщите нам дату мероприятия и мы поможем вам организовать свое свадебное видео-шоу.

3. Длительность презентации зависит от количества фото и разворотов. В шаблоне: 4 разворота (16 фото). Можно добавить развороты.

4. Описания к фото — до~300 символов. Если нужно большее описание, лучше добавить фото и развороты, чтобы не перегружать текстом.

5. Оживление фото (как в шаблоне). Можно заказать презентацию и без оживления.

6. Музыкальная подбложка пока в одном варианте;

7. Процесс: предоплата 30% → получаете форму → заполняете фото и тексты → 1 правка по тексту → финал и доплата 70% → отправка готового видео.`,
    quickActions: ['Заказать', 'Консультация']
  },
  'Свадебная презентация — цены и сроки': {
    answer: `**Стоимость и сроки:** 
**Презентация без оживления фото** (фото без движения) и описанием до 300 символов к каждому фото:

4 разворота (16 фото, 6:23 мин) – 8000р / срок 3–4 дня
5 разворотов (20 фото, 8 мин) – 8500р / срок 3–4 дня
6 разворотов (24 фото, 10 мин) – 9000р / срок 4–5 дней
7 разворотов (28 фото, 12 мин) – 9500р / срок 4–5 дней

**Цены с оживлением фото** и описанием до 300 символов:

4 разворота (16 фото, 6:23 мин) – 10000р / срок 4–5 дней
5 разворотов (20 фото, 8 мин) – 11000р / срок 4–5 дней
6 разворотов (24 фото, 10 мин) – 11500р / срок 5–6 дней
7 разворотов (28 фото, 12 мин) – 12000р / срок 5–6 дней

За каждые 300+ символов сверх +200р (рекомендация: лучше добавляйте фото и развороты — так презентация будет смотреться интереснее).

Сроки могут варьироваться от сложности и загруженности — все по согласованию.`,
    quickActions: ['Заказать', 'Консультация']
  },
  'Можно ли заказать индивидуальную презентацию?': {
    answer: `В принципе можно. Опишите как вы ее видите. И мы скажем сможем ли мы это.`,
    quickActions: ['Заказать', 'Консультация']
  }
};

// Главное меню
const mainMenu = {
  reply_markup: {
    inline_keyboard: [
      [{ text: '🎬 Видео-приглашения', callback_data: 'category_invitations' }],
      [{ text: '💒 Свадебная презентация', callback_data: 'category_presentations' }],
      [{ text: '💬 Консультация с менеджером', callback_data: 'consultation' }]
    ]
  }
};

// Вспомогательные функции для редактирования одного сообщения
async function showMainMenu(chatId, messageId) {
  const text = 'Выберите интересующий вас вопрос:';
  try {
    await bot.editMessageText(text, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: mainMenu.reply_markup,
      parse_mode: 'Markdown'
    });
  } catch (err) {
    // Если сообщение нельзя отредактировать (например, первое после /start), отправим новое
    await bot.sendMessage(chatId, text, { reply_markup: mainMenu.reply_markup });
  }
}

function buildCategoryMenu(category) {
  if (category === 'invitations') {
    return {
      text: 'Выберите интересующий вас вопрос о видео-приглашениях:',
      markup: {
        inline_keyboard: [
          [{ text: '📋 Общая информация', callback_data: 'question_invitations_info' }],
          [{ text: '💰 Цены и сроки', callback_data: 'question_invitations_price' }],
          [{ text: '❓ Индивидуальный заказ', callback_data: 'question_invitations_custom' }],
          [{ text: '⬅️ Назад в главное меню', callback_data: 'back_to_main' }]
        ]
      }
    };
  }
  return {
    text: 'Выберите интересующий вас вопрос о свадебной презентации:',
    markup: {
      inline_keyboard: [
        [{ text: '📋 Общая информация', callback_data: 'question_presentations_info' }],
        [{ text: '💰 Цены и сроки', callback_data: 'question_presentations_price' }],
        [{ text: '❓ Индивидуальный заказ', callback_data: 'question_presentations_custom' }],
        [{ text: '⬅️ Назад в главное меню', callback_data: 'back_to_main' }]
      ]
    }
  };
}

async function showCategoryMenu(chatId, messageId, category) {
  const { text, markup } = buildCategoryMenu(category);
  try {
    await bot.editMessageText(text, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: markup,
      parse_mode: 'Markdown'
    });
  } catch (err) {
    await bot.sendMessage(chatId, text, { reply_markup: markup });
  }
}

const questionKeyToTitle = {
  'invitations_info': 'Видео-приглашения — общая информация',
  'invitations_price': 'Видео-приглашения — цены и сроки',
  'invitations_custom': 'Можно ли заказать индивидуальное приглашение?',
  'presentations_info': 'Свадебная презентация — общая информация',
  'presentations_price': 'Свадебная презентация — цены и сроки',
  'presentations_custom': 'Можно ли заказать индивидуальную презентацию?'
};

async function showQuestion(chatId, messageId, category, questionKey) {
  const title = questionKeyToTitle[`${category}_${questionKey}`];
  const questionData = quickQuestions[title];
  if (!questionData) return;

  const quickActionsRow = [
    { text: '🛒 Заказать', callback_data: 'order' },
    { text: '💬 Консультация', callback_data: 'consultation' }
  ];

  const keyboard = {
    inline_keyboard: [
      quickActionsRow,
      [{ text: '⬅️ Назад к вопросам', callback_data: `back_to_category_${category}` }],
      [{ text: '🏠 Главное меню', callback_data: 'back_to_main' }]
    ]
  };

  try {
    await bot.editMessageText(questionData.answer, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: keyboard,
      parse_mode: 'Markdown'
    });
  } catch (err) {
    await bot.sendMessage(chatId, questionData.answer, { reply_markup: keyboard, parse_mode: 'Markdown' });
  }
}

// Обработка команды /start
bot.onText(/\/start(?:\s+(.*))?/, async (msg, match) => {
  console.log('🎯 Получена команда /start от:', msg.from.first_name, 'ID:', msg.chat.id);
  
  const chatId = msg.chat.id;
  const userName = msg.from.first_name;
  const usernameHandle = msg.from.username ? '@' + msg.from.username : '(без username)';
  const startPayload = (match && match[1]) ? String(match[1]) : '';
  
  userStates.set(chatId, { state: 'main' });
  
  // Если пришли по ссылке lead_<id> — уведомляем администратора с username
  try {
    if (startPayload && startPayload.startsWith('lead_')) {
      const leadId = startPayload.replace('lead_', '');
      const lead = getLead(leadId) || await Lead.findOne({ leadId }).lean().exec();
      if (lead) {
        // Уведомляем пользователя, что заявка получена
        const userNotification = `✅ Ваша заявка #${leadId} успешно получена!\n\nМы свяжемся с вами в ближайшее время для уточнения деталей.\n\nА пока можете изучить наши услуги или задать вопросы через меню ниже.`;
        
        // Уведомляем всех администраторов
        for (const adminId of ADMIN_IDS) {
          try {
            const lines = [
              `�� Клиент открыл бота по заявке #${leadId}`,
              `Профиль: ${usernameHandle} (id ${msg.from.id})`,
              `Имя: ${lead.name}`,
              `Срок/дата: ${lead.term}`,
              `Бюджет: ${lead.budget}`,
              `Экран: ${lead.screen}`,
              `Контакт: ${lead.contact || '-'}`,
              `Продукт: ${lead.product}`,
              `Источник: ${lead.source}`
            ];
            await bot.sendMessage(adminId, lines.join('\n'));
          } catch (e) {
            console.error('Telegram send lead notification to admin failed:', adminId, e?.response?.body || e?.message || e);
          }
        }
        
        try { await Lead.updateOne({ leadId }, { tgUserId: String(msg.from.id), tgUsername: msg.from.username || null, tgLinkedAt: new Date() }); } catch (e) {}
        deleteLead(leadId);
        
        // Отправляем уведомление пользователю
        await bot.sendMessage(chatId, userNotification);
        
        // Отслеживаем успешную обработку заявки
        trackAnalytics('lead_processed', { 
          leadId,
          product: lead.product,
          source: lead.source,
          channel: lead.channel
        });
      }
    }
  } catch (e) {
    console.error('Ошибка уведомления админа о lead старт:', e);
  }

  const welcomeMessage = `👋 Привет, ${userName}!

Добро пожаловать в бот свадебных презентаций! 🎉

Здесь вы можете получить ответы на популярные вопросы или связаться с нашим менеджером для консультации.

Выберите интересующий вас вопрос:`;
  
  bot.sendMessage(chatId, welcomeMessage, mainMenu)
    .then(() => {
      console.log('✅ Приветственное сообщение отправлено');
      // Отслеживаем начало работы с ботом
      trackAnalytics('bot_start', { 
        hasLeadPayload: !!startPayload,
        leadId: startPayload ? startPayload.replace('lead_', '') : null 
      });
    })
    .catch(err => console.error('❌ Ошибка отправки приветственного сообщения:', err));
});

// Команда для администратора: показать все заявки
bot.onText(/\/leads(?:\s+(.*))?/, async (msg, match) => {
  if (!ADMIN_IDS.includes(msg.chat.id)) {
    return bot.sendMessage(msg.chat.id, 'Команда доступна только администратору.');
  }
  
  // Отслеживаем запрос списка заявок
  trackAnalytics('admin_leads_request', { 
    adminId: msg.chat.id,
    adminUsername: msg.from.username || null
  });
  
  const filter = {};
  const textQuery = (match && match[1]) ? String(match[1]).trim() : '';
  try {
    const leads = await Lead.find(filter).sort({ createdAt: -1 }).limit(50).lean().exec();
    if (!leads.length) return bot.sendMessage(msg.chat.id, 'Заявок пока нет.');
    const chunks = [];
    let current = [];
    for (const l of leads) {
      const line = [
        `#${l.leadId} • ${new Date(l.createdAt).toLocaleString('ru-RU')}`,
        `Имя: ${l.name || '-'}`,
        `Срок: ${l.term || '-'}`,
        `Бюджет: ${l.budget || '-'}`,
        `Экран: ${l.screen || '-'}`,
        `Контакт: ${l.contact || '-'}`,
        `Продукт: ${l.product || '-'}`,
        `Источник: ${l.source || '-'}`,
        `Канал: ${l.channel || '-'}`,
        `Клиент: ${l.tgUsername ? '@' + l.tgUsername : '(не в боте)'}${l.tgUserId ? ' • id ' + l.tgUserId : ''}`
      ].join('\n');
      current.push(line);
      if (current.join('\n\n').length > 3500) {
        chunks.push(current.join('\n\n'));
        current = [];
      }
    }
    if (current.length) chunks.push(current.join('\n\n'));
    for (const chunk of chunks) {
      await bot.sendMessage(msg.chat.id, chunk);
    }
  } catch (e) {
    console.error('Leads list error:', e);
    bot.sendMessage(msg.chat.id, 'Ошибка при получении заявок.');
  }
});

// Обработка callback запросов
bot.on('callback_query', async (query) => {
  console.log('🔘 Получен callback от:', query.from.first_name, 'Данные:', query.data);
  
  const chatId = query.message.chat.id;
  const data = query.data;
  const messageId = query.message.message_id;
  const state = userStates.get(chatId) || {};
  const currentCategory = state.category;
  
  // Отслеживаем взаимодействие пользователя с ботом
  trackAnalytics('bot_interaction', { 
    action: data,
    category: currentCategory,
    userId: query.from.id,
    username: query.from.username
  });
  
  // Отвечаем на callback
  await bot.answerCallbackQuery(query.id);
  
  if (data.startsWith('category_')) {
    const category = data.replace('category_', '');
    userStates.set(chatId, { state: 'category', category });
    await showCategoryMenu(chatId, messageId, category);
  } else if (data.startsWith('question_')) {
    const parts = data.split('_'); // ['question', '<category>', '<key>']
    const category = parts[1];
    const key = parts[2];
    await showQuestion(chatId, messageId, category, key);
  } else if (data === 'consultation') {
    const text = `💬 Для связи с менеджером:\n\nНапишите нам в мессенджер — ответим максимально быстро.`;
    const backCb = currentCategory ? `back_to_category_${currentCategory}` : 'back_to_main';
    const keyboard = {
      inline_keyboard: [
        [
          { text: '📲 Открыть Telegram', url: 'https://t.me/feiero' },
          { text: '📲 Открыть WhatsApp', url: 'https://wa.me/79004511777' }
        ],
        [{ text: '⬅️ Назад', callback_data: backCb }]
      ]
    };
    try {
      await bot.editMessageText(text, { chat_id: chatId, message_id: messageId, reply_markup: keyboard });
    } catch (e) {
      await bot.sendMessage(chatId, text, { reply_markup: keyboard });
    }
  } else if (data === 'order') {
    const text = `🛒 Для оформления заказа перейдите на сайт и оставьте заявку:`;
    const backCb = currentCategory ? `back_to_category_${currentCategory}` : 'back_to_main';
    const keyboard = {
      inline_keyboard: [
        [ { text: '🌐 Оформить заказ на сайте', url: 'https://xn--e1aalvju.xn--p1ai' } ],
        [{ text: '⬅️ Назад', callback_data: backCb }]
      ]
    };
    try {
      await bot.editMessageText(text, { chat_id: chatId, message_id: messageId, reply_markup: keyboard });
    } catch (e) {
      await bot.sendMessage(chatId, text, { reply_markup: keyboard });
    }
  } else if (data.startsWith('back_to_category_')) {
    const category = data.replace('back_to_category_', '');
    userStates.set(chatId, { state: 'category', category });
    await showCategoryMenu(chatId, messageId, category);
  } else if (data === 'back_to_main') {
    userStates.set(chatId, { state: 'main' });
    await showMainMenu(chatId, messageId);
  }
});

// Обработка обычных сообщений
bot.on('message', (msg) => {
  console.log('📨 Получено сообщение от:', msg.from.first_name, 'Текст:', msg.text);
  
  const chatId = msg.chat.id;
  
  // Отслеживаем текстовые сообщения пользователей
  if (!msg.text.startsWith('/')) {
    trackAnalytics('bot_text_message', { 
      userId: msg.from.id,
      username: msg.from.username,
      messageLength: msg.text.length
    });
  }
  
  // Если это не команда /start, предлагаем вернуться к меню
  if (!msg.text.startsWith('/')) {
    const helpMessage = `Для навигации используйте кнопки меню или отправьте /start для возврата к главному меню.`;
    
    const helpKeyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🏠 Главное меню', callback_data: 'back_to_main' }]
        ]
      }
    };
    
    bot.sendMessage(chatId, helpMessage, helpKeyboard)
      .then(() => console.log('✅ Помощь отправлена'))
      .catch(err => console.error('❌ Ошибка отправки помощи:', err));
  }
});



console.log('Telegram bot started...');

function resolveWebhookBaseUrl() {
  const base = (process.env.TELEGRAM_WEBHOOK_BASE
    || process.env.RENDER_EXTERNAL_URL
    || process.env.FRONTEND_URL
    || 'https://svadba2.onrender.com').trim();
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

// Включаем webhook-режим, предварительно удалив старый webhook
(async () => {
  try {
    await bot.deleteWebHook({ drop_pending_updates: true });
    console.log('Webhook удалён (если был).');
  } catch (e) {
    console.warn('Не удалось удалить webhook:', e.message);
  }

  try {
    const base = resolveWebhookBaseUrl();
    const webhookUrl = `${base}/webhook/telegram`;
    await bot.setWebHook(webhookUrl); // у node-telegram-bot-api метод setWebHook
    console.log('Webhook установлен на:', webhookUrl);
  } catch (e) {
    console.error('Ошибка установки webhook:', e);
  }
  try {
    const me = await bot.getMe();
    console.log('Бот авторизован как @' + me.username + ' (id ' + me.id + ')');
  } catch (e) {
    console.error('Не удалось получить данные бота getMe:', e.message);
  }
  try {
    const info = await bot.getWebHookInfo();
    console.log('Webhook Info:', {
      url: info.url,
      has_custom_certificate: info.has_custom_certificate,
      pending_update_count: info.pending_update_count,
      last_error_message: info.last_error_message,
      last_error_date: info.last_error_date
    });
  } catch (e) {
    console.error('Не удалось получить getWebHookInfo:', e.message);
  }
})();

module.exports = bot;
