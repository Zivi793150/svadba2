const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// Токен бота из переменных окружения
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true }); // Включаем polling обратно

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

// Обработка команды /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name;
  
  userStates.set(chatId, { state: 'main' });
  
  const welcomeMessage = `👋 Привет, ${userName}!

Добро пожаловать в бот свадебных презентаций! 🎉

Здесь вы можете получить ответы на популярные вопросы или связаться с нашим менеджером для консультации.

Выберите интересующий вас вопрос:`;
  
  bot.sendMessage(chatId, welcomeMessage, mainMenu);
});

// Обработка callback запросов
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  
  // Отвечаем на callback
  await bot.answerCallbackQuery(query.id);
  
  if (data.startsWith('category_')) {
    const category = data.replace('category_', '');
    
    if (category === 'invitations') {
      const invitationsMenu = {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📋 Общая информация', callback_data: 'question_invitations_info' }],
            [{ text: '💰 Цены и сроки', callback_data: 'question_invitations_price' }],
            [{ text: '❓ Индивидуальный заказ', callback_data: 'question_invitations_custom' }],
            [{ text: '⬅️ Назад в главное меню', callback_data: 'back_to_main' }]
          ]
        }
      };
      bot.sendMessage(chatId, 'Выберите интересующий вас вопрос о видео-приглашениях:', invitationsMenu);
    } else if (category === 'presentations') {
      const presentationsMenu = {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📋 Общая информация', callback_data: 'question_presentations_info' }],
            [{ text: '💰 Цены и сроки', callback_data: 'question_presentations_price' }],
            [{ text: '❓ Индивидуальный заказ', callback_data: 'question_presentations_custom' }],
            [{ text: '⬅️ Назад в главное меню', callback_data: 'back_to_main' }]
          ]
        }
      };
      bot.sendMessage(chatId, 'Выберите интересующий вас вопрос о свадебной презентации:', presentationsMenu);
    }
  } else if (data.startsWith('question_')) {
    const questionKey = data.replace('question_', '');
    const questionMap = {
      'invitations_info': 'Видео-приглашения — общая информация',
      'invitations_price': 'Видео-приглашения — цены и сроки',
      'invitations_custom': 'Можно ли заказать индивидуальное приглашение?',
      'presentations_info': 'Свадебная презентация — общая информация',
      'presentations_price': 'Свадебная презентация — цены и сроки',
      'presentations_custom': 'Можно ли заказать индивидуальную презентацию?'
    };
    
    const question = questionMap[questionKey];
    const questionData = quickQuestions[question];
    
    if (questionData) {
      const quickActionsKeyboard = {
        reply_markup: {
          inline_keyboard: [
            questionData.quickActions.map(action => [{
              text: action === 'Заказать' ? '🛒 Заказать' : '💬 Консультация',
              callback_data: action === 'Заказать' ? 'order' : 'consultation'
            }]),
            [{ text: '⬅️ Назад к категориям', callback_data: 'back_to_main' }]
          ]
        }
      };
      
      bot.sendMessage(chatId, questionData.answer, quickActionsKeyboard);
    }
  } else if (data === 'consultation') {
    const consultationMessage = `💬 Для связи с менеджером:

📱 **WhatsApp:** +7 900 451-17-77
📱 **Telegram:** @svadba_manager
📧 **Email:** info@svadba-presentation.ru

⏰ **Время работы:** Пн-Пт 9:00-18:00

Менеджер ответит вам в течение 30 минут в рабочее время.`;
    
    const backKeyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '⬅️ Назад к вопросам', callback_data: 'back_to_main' }]
        ]
      }
    };
    
    bot.sendMessage(chatId, consultationMessage, backKeyboard);
  } else if (data === 'order') {
    const orderMessage = `🛒 Для оформления заказа:

1️⃣ **Свяжитесь с менеджером:**
   📱 WhatsApp: +7 900 451-17-77
   📱 Telegram: @svadba_manager

2️⃣ **Укажите:**
   - Тип услуги (презентация/приглашения)
   - Количество фото/разворотов
   - Нужно ли оживление фото
   - Желаемые сроки

3️⃣ **Предоплата:** 30% от стоимости

Менеджер подготовит для вас индивидуальное предложение!`;
    
    const backKeyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '⬅️ Назад к вопросам', callback_data: 'back_to_main' }]
        ]
      }
    };
    
    bot.sendMessage(chatId, orderMessage, backKeyboard);
  } else if (data === 'back_to_main') {
    bot.sendMessage(chatId, 'Выберите интересующий вас вопрос:', mainMenu);
  }
});

// Обработка обычных сообщений
bot.on('message', (msg) => {
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
    
    bot.sendMessage(chatId, helpMessage, helpKeyboard);
  }
});

// Обработка ошибок
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
  
  // Если ошибка 409 (конфликт), пробуем перезапустить polling через 5 секунд
  if (error.code === 'ETELEGRAM' && error.response && error.response.statusCode === 409) {
    console.log('Bot conflict detected, restarting polling in 5 seconds...');
    setTimeout(() => {
      bot.stopPolling().then(() => {
        setTimeout(() => {
          bot.startPolling();
          console.log('Bot polling restarted');
        }, 1000);
      });
    }, 5000);
  }
});

bot.on('error', (error) => {
  console.error('Bot error:', error);
});

console.log('Telegram bot started...');

module.exports = bot;
