const axios = require('axios');
require('dotenv').config();

// Конфигурация WhatsApp Business API
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const WHATSAPP_API_URL = `https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_ID}/messages`;

// Состояния пользователей
const userStates = new Map();

// Структура вопросов (аналогично чату на сайте)
const quickQuestions = {
  'Видео-приглашения — общая информация': {
    answer: `*Приглашение:* 
*Общая информация:*  
Пригласите своих гостей феерично и создайте WOW-эффект еще в самом начале!

Наши персональные видео-приглашения удивят и произведут WOW
– эффект на ваших гостей. Они запомнят вашу свадьбу еще с приглашения и точнозахотят на нее прийти.

Возможно сделать просто приглашение, одинаковое для всех,без обращения, как в шаблоне. А можно сделать именное приглашение для каждого
гостя отдельно.`,
    quickActions: ['Заказать', 'Консультация']
  },
  'Видео-приглашения — цены и сроки': {
    answer: `*Стоимость и сроки:* 
*Неименное приглашение:* 
Замена информации о мероприятии без имени – 2000 р./ срок –1 день
 *Именное приглашение:*  
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
    answer: `*Свадебная презентация*
*Описание:* Ваша история любви — должна стать сердцем вашего торжества.

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
    answer: `*Стоимость и сроки:* 
*Презентация без оживления фото* (фото без движения) и описанием до 300 символов к каждому фото:

4 разворота (16 фото, 6:23 мин) – 8000р / срок 3–4 дня
5 разворотов (20 фото, 8 мин) – 8500р / срок 3–4 дня
6 разворотов (24 фото, 10 мин) – 9000р / срок 4–5 дней
7 разворотов (28 фото, 12 мин) – 9500р / срок 4–5 дней

*Цены с оживлением фото* и описанием до 300 символов:

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

// Функция для отправки текстового сообщения
async function sendTextMessage(to, text) {
  try {
    const response = await axios.post(WHATSAPP_API_URL, {
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: { body: text }
    }, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error.response?.data || error.message);
    throw error;
  }
}

// Функция для отправки интерактивных кнопок
async function sendInteractiveMessage(to, body, buttons) {
  try {
    const response = await axios.post(WHATSAPP_API_URL, {
      messaging_product: 'whatsapp',
      to: to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: body },
        action: {
          buttons: buttons.map((button, index) => ({
            type: 'reply',
            reply: {
              id: `btn_${index}`,
              title: button
            }
          }))
        }
      }
    }, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error sending interactive message:', error.response?.data || error.message);
    throw error;
  }
}

// Функция для отправки списка опций
async function sendListMessage(to, body, sections) {
  try {
    const response = await axios.post(WHATSAPP_API_URL, {
      messaging_product: 'whatsapp',
      to: to,
      type: 'interactive',
      interactive: {
        type: 'list',
        body: { text: body },
        action: {
          button: 'Выбрать вопрос',
          sections: sections
        }
      }
    }, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error sending list message:', error.response?.data || error.message);
    throw error;
  }
}

// Обработка входящих сообщений
async function handleIncomingMessage(message) {
  const from = message.from;
  const messageType = message.type;
  
  if (messageType === 'text_message') {
    const text = message.text.body.toLowerCase();
    
    // Проверяем состояние пользователя
    const userState = userStates.get(from) || { state: 'main' };
    
    if (text === '/start' || text === 'начать' || text === 'меню') {
      userStates.set(from, { state: 'main' });
      await sendWelcomeMessage(from);
    } else if (userState.state === 'main') {
      await handleMainMenu(from, text);
    } else if (userState.state === 'question') {
      await handleQuestionResponse(from, text, userState.question);
    }
  } else if (messageType === 'interactive') {
    const interactive = message.interactive;
    
    if (interactive.type === 'button_reply') {
      await handleButtonClick(from, interactive.button_reply.id);
    } else if (interactive.type === 'list_reply') {
      await handleListSelection(from, interactive.list_reply.id);
    }
  }
}

// Отправка приветственного сообщения
async function sendWelcomeMessage(to) {
  const welcomeText = `👋 Добро пожаловать в бот свадебных презентаций! 🎉

Здесь вы можете получить ответы на популярные вопросы или связаться с нашим менеджером для консультации.

Выберите интересующий вас вопрос:`;
  
  const sections = [
    {
      title: '🎬 Видео-приглашения',
      rows: [
        { id: 'question_invitations_info', title: '📋 Общая информация' },
        { id: 'question_invitations_price', title: '💰 Цены и сроки' },
        { id: 'question_invitations_custom', title: '❓ Индивидуальный заказ' }
      ]
    },
    {
      title: '💒 Свадебная презентация',
      rows: [
        { id: 'question_presentations_info', title: '📋 Общая информация' },
        { id: 'question_presentations_price', title: '💰 Цены и сроки' },
        { id: 'question_presentations_custom', title: '❓ Индивидуальный заказ' }
      ]
    },
    {
      title: 'Связаться с менеджером',
      rows: [
        { id: 'consultation', title: '💬 Консультация с менеджером' }
      ]
    }
  ];
  
  await sendListMessage(to, welcomeText, sections);
}

// Обработка главного меню
async function handleMainMenu(to, text) {
  const questionMap = {
    'приглашения': 'question_invitations_info',
    'видео приглашения': 'question_invitations_info',
    'презентация': 'question_presentations_info',
    'свадебная': 'question_presentations_info',
    'консультация': 'consultation',
    'менеджер': 'consultation'
  };
  
  for (const [key, value] of Object.entries(questionMap)) {
    if (text.includes(key)) {
      await handleSelection(to, value);
      return;
    }
  }
  
  // Если не распознали, отправляем подсказку
  await sendTextMessage(to, 'Пожалуйста, выберите вопрос из меню или напишите "меню" для возврата к списку вопросов.');
}

// Обработка выбора из списка
async function handleSelection(to, selection) {
  if (selection.startsWith('question_')) {
    const questionKey = selection.replace('question_', '');
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
      userStates.set(to, { state: 'question', question: question });
      
      await sendTextMessage(to, questionData.answer);
      
      const buttons = [...questionData.quickActions, 'Назад к вопросам'];
      await sendInteractiveMessage(to, 'Что вас интересует дальше?', buttons);
    }
  } else if (selection === 'consultation') {
    await sendConsultationMessage(to);
  }
}

// Обработка кнопок
async function handleButtonClick(to, buttonId) {
  if (buttonId === 'btn_0') {
    // Первая кнопка (Заказать или Консультация)
    const userState = userStates.get(to);
    if (userState && userState.state === 'question') {
      await sendOrderMessage(to);
    } else {
      await sendConsultationMessage(to);
    }
  } else if (buttonId === 'btn_1') {
    // Вторая кнопка (Консультация)
    await sendConsultationMessage(to);
  } else if (buttonId === 'btn_2') {
    // Кнопка "Назад"
    userStates.set(to, { state: 'main' });
    await sendWelcomeMessage(to);
  }
}

// Обработка выбора из списка
async function handleListSelection(to, selectionId) {
  await handleSelection(to, selectionId);
}

// Обработка ответа на вопрос
async function handleQuestionResponse(to, text, question) {
  if (text.includes('заказать') || text.includes('заказ')) {
    await sendOrderMessage(to);
  } else if (text.includes('консультация') || text.includes('менеджер')) {
    await sendConsultationMessage(to);
  } else if (text.includes('назад') || text.includes('меню')) {
    userStates.set(to, { state: 'main' });
    await sendWelcomeMessage(to);
  } else {
    await sendTextMessage(to, 'Пожалуйста, выберите действие с помощью кнопок или напишите "назад" для возврата к вопросам.');
  }
}

// Отправка сообщения о консультации
async function sendConsultationMessage(to) {
  const consultationText = `💬 Для связи с менеджером:

📱 *WhatsApp:* +7 900 451-17-77
📱 *Telegram:* @svadba_manager
📧 *Email:* info@svadba-presentation.ru

⏰ *Время работы:* Пн-Пт 9:00-18:00

Менеджер ответит вам в течение 30 минут в рабочее время.`;
  
  await sendTextMessage(to, consultationText);
  
  const buttons = ['Назад к вопросам'];
  await sendInteractiveMessage(to, 'Хотите вернуться к вопросам?', buttons);
}

// Отправка сообщения о заказе
async function sendOrderMessage(to) {
  const orderText = `🛒 Для оформления заказа:

1️⃣ *Свяжитесь с менеджером:*
   📱 WhatsApp: +7 900 451-17-77
   📱 Telegram: @svadba_manager

2️⃣ *Укажите:*
   - Тип услуги (презентация/приглашения)
   - Количество фото/разворотов
   - Нужно ли оживление фото
   - Желаемые сроки

3️⃣ *Предоплата:* 30% от стоимости

Менеджер подготовит для вас индивидуальное предложение!`;
  
  await sendTextMessage(to, orderText);
  
  const buttons = ['Назад к вопросам'];
  await sendInteractiveMessage(to, 'Хотите вернуться к вопросам?', buttons);
}

// Webhook для получения сообщений
async function handleWebhook(req, res) {
  try {
    const body = req.body;
    
    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry[0];
      const changes = entry.changes[0];
      const value = changes.value;
      
      if (value.messages && value.messages.length > 0) {
        const message = value.messages[0];
        await handleIncomingMessage(message);
      }
      
      res.status(200).send('OK');
    } else {
      res.status(404).send('Not Found');
    }
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
}

// Верификация webhook
function verifyWebhook(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  
  if (mode && token) {
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('Webhook verified');
      res.status(200).send(challenge);
    } else {
      res.status(403).send('Forbidden');
    }
  }
}

module.exports = {
  handleWebhook,
  verifyWebhook,
  sendTextMessage,
  sendInteractiveMessage,
  sendListMessage
};
