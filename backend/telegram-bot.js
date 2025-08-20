const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const { getLead, deleteLead } = require('./leadStore');

// Токен бота из переменных окружения
const token = process.env.TELEGRAM_BOT_TOKEN;

// Проверяем наличие токена
if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN не найден в переменных окружения!');
  console.error('Добавьте TELEGRAM_BOT_TOKEN в .env файл или переменные окружения Render');
  process.exit(1);
}

console.log('✅ TELEGRAM_BOT_TOKEN найден');
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
Замена информации о мероприятии без имени – 3000 р./ срок –1 день
 **Именное приглашение:**  
С обращением и указанием каждого имени вначале: 
до 25 имен – 4000 р, 
до 50 имен – 5000 р, 
 51-100 имен – 7000 р 
Срок исполнения 2-4 дня, возможно быстрее по загруженности.`,
    quickActions: ['Заказать', 'Консультация']
  },
  'Можно ли заказать индивидуальное приглашение?': {
    answer: `Опишите как видите и мы скажем возможно ли это.`,
    quickActions: ['Заказать', 'Консультация']
  },
  'Свадебная презентация — общая информация': {
    answer: `**Общая информация:** 

1. Сначала до заказа необходимо определиться с экраном, который хотитеиспользовать для демонстрации. Для показа подойдут не все экраны, а только с
пропорциями 16:9 и 16:10. Уточните пропорции у владельца экрана, а также егоразмер, и сообщите нам перед заказом. Чтобы посмотреть как примерно будет
выглядеть ваше презентация на этом экране – можете скачать наш образец ипопросить ее посмотреть на нём. 

2. Длительность видео зависит от количества фото и разворотов альбома. Внашем видео-образце 16 фотографий и 4 разворота. Возможно добавить в
презентацию дополнительные развороты (каждый разворот – 4 фото). Цена каждогодополнительного разворота + 500 - 1000 руб. Также длительность видео зависит от
объема текста в описании фото. В шаблоне в описании к фото не больше 300символов. Рекомендуем оставлять также, не делать описание к одному фото больше.
Это будет выглядеть затянуто и занудно.. Только главное. Чтобы сделать описание(например биографию мамы) больше - лучше добавлять фото и развороты.. Будет
выглядеть интересно! 
3. В шаблоне презентации все фото «оживлены». Можно заказать презентацию ибез оживления. Оживление стоит + 2000 (16 фотографий). И добавляет к сроку
изготовления 1-2 дня. 
4. Пока музыкальное оформление презентации тоже возможно только в одномварианте. В дальнейшем будут добавлены и другие аудио-подложки на выбор. 
5. После того как определитесь с экраном, для заказа через форму
«заказать», нужно сделать предоплату в размере 30% (в случае отказа от заказапредоплата не возвращается). После чего вам будет выслана форма для заполнения
фото и текста. Очень тщательно подойдите к подбору фотографий. выберите вашилюбимые фото из вашего детства, школьных лет, студенчества и конечно же ваши
лучшие совместные фото. после оформления заказа мы вышлем вам форму длязаполнения фото и описания. заполните туда все фото и текст. После получения
материалов мы приступаем к производству. После окончания мы предоставляем вамвидео на согласование. Допускается только 1 правка в тексте. Так что фото
подбирайте очень обдуманно. После правки и окончательного согласования вашейпрезентации вам нужно доплатить 70 % стоимости и мы пришлем вам вашу свадебную
презентацию на почту.`,
    quickActions: ['Заказать', 'Консультация']
  },
  'Свадебная презентация — цены и сроки': {
    answer: `**Стоимость и сроки:** 
**Презентация без оживления фото** (фото без движения) и  описанием к каждому фото на 300 символов (какв шаблоне):
4 разворота (16 фото, 6:23 мин) – 10000р / срок 3-4 дня
5 разворотов (20 фото, 8 мин) – 10500/срок 3-4  дня 
6 разворотов (24 фото, 10 мин) – 11000 / срок 4-5 дней 
7 разворотов (28 фото, 12 мин) – 11500 / срок 4-5 дней
**Цены с оживлением фото** и текстом в описании к каждому фото 300
символов (как шаблон):
 4 разворота (16 фото,6:23 мин) – 12000р /срок 4-5 дней
5 разворотов (20 фото, 8 мин) – 1300/срок 4-5  дней 
6 разворотов (24 фото, 10 мин) – 13500 / срок 5-6 дней 
7 разворотов (28 фото, 12 мин) – 14000 / срок 5-6 дней
За каждые 300+ символов к тексту для фото - 200р (рекомендация:
оставлять текст на 300 символов под каждое фото, иначе будет смотретьсязанудно. Если хочется больше описания — добавляйте лучше фотографии и развороты,
будет смотреться намного лучше)
Сроки могут варьироваться в зависимости от загруженности исложности работы. Увеличиваться  по
согласованию с заказчиком.`,
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
      const lead = getLead(leadId);
      if (lead) {
        const adminId = process.env.ADMIN_TELEGRAM_ID;
        if (adminId) {
          const lines = [
            `📩 Клиент открыл бота по заявке #${leadId}`,
            `Профиль: ${usernameHandle} (id ${msg.from.id})`,
            `Имя: ${lead.name}`,
            `Срок/дата: ${lead.term}`,
            `Бюджет: ${lead.budget}`,
            `Экран: ${lead.screen}`,
            `Продукт: ${lead.product}`,
            `Источник: ${lead.source}`
          ];
          await bot.sendMessage(adminId, lines.join('\n'));
        }
        deleteLead(leadId);
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
    .then(() => console.log('✅ Приветственное сообщение отправлено'))
    .catch(err => console.error('❌ Ошибка отправки приветственного сообщения:', err));
});

// Обработка callback запросов
bot.on('callback_query', async (query) => {
  console.log('🔘 Получен callback от:', query.from.first_name, 'Данные:', query.data);
  
  const chatId = query.message.chat.id;
  const data = query.data;
  const messageId = query.message.message_id;
  const state = userStates.get(chatId) || {};
  const currentCategory = state.category;
  
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
