# Настройка ботов для свадебных презентаций

## Telegram Bot

### 1. Создание бота
1. Найдите @BotFather в Telegram
2. Отправьте команду `/newbot`
3. Следуйте инструкциям:
   - Введите имя бота (например: "Свадебные презентации")
   - Введите username бота (например: `svadba_presentation_bot`)
4. Сохраните полученный токен

### 2. Настройка бота
1. Отправьте @BotFather команду `/setcommands`
2. Выберите вашего бота
3. Отправьте список команд:
```
start - Начать работу с ботом
help - Помощь
```

### 3. Настройка переменных окружения
В файле `.env` добавьте:
```
TELEGRAM_BOT_TOKEN=ваш_токен_бота
```

## WhatsApp Business API

### 1. Создание Facebook App
1. Перейдите на [Facebook Developers](https://developers.facebook.com/)
2. Создайте новое приложение
3. Выберите тип "Business"
4. Добавьте продукт "WhatsApp"

### 2. Настройка WhatsApp Business API
1. В настройках WhatsApp:
   - Получите Phone Number ID
   - Получите Access Token
   - Создайте Verify Token (любая строка)

### 3. Настройка Webhook
1. В настройках webhook укажите:
   - URL: `https://ваш-домен.com/webhook/whatsapp`
   - Verify Token: ваш_verify_token
2. Подпишитесь на события: `messages`

### 4. Настройка переменных окружения
В файле `.env` добавьте:
```
WHATSAPP_TOKEN=ваш_access_token
WHATSAPP_PHONE_ID=ваш_phone_number_id
WHATSAPP_VERIFY_TOKEN=ваш_verify_token
```

## Установка зависимостей

```bash
cd backend
npm install
```

## Запуск

```bash
npm start
```

## Проверка работы

### Telegram Bot
1. Найдите вашего бота по username
2. Отправьте `/start`
3. Проверьте работу меню и ответов

### WhatsApp Bot
1. Отправьте сообщение на номер WhatsApp Business
2. Проверьте получение ответов от бота

## Структура ботов

Оба бота имеют одинаковую структуру вопросов:

- Как делается слайд-шоу
- Можно ли ставить свою музыку
- Сколько стоит
- Сколько по времени
- Какие форматы видео
- Консультация с менеджером

## Обновление контента

Для изменения вопросов и ответов отредактируйте файлы:
- `telegram-bot.js` - для Telegram бота
- `whatsapp-bot.js` - для WhatsApp бота

## Безопасность

- Никогда не публикуйте токены в открытом доступе
- Используйте HTTPS для webhook
- Регулярно обновляйте токены доступа
