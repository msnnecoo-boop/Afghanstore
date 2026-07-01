const FAQ = {
  prices: {
    label: '💰 قیمت‌ها',
    text: '💰 قیمت‌ها بر اساس بازی و مقدار متفاوت هستن.\n\nمثلاً:\n🎮 PUBG UC از $0.89\n🔥 Free Fire از $1.49\n⚔️ Mobile Legends از $13.99\n\nبرای دیدن قیمت کامل همه‌ی بازی‌ها:\nhttps://afghancoins.online'
  },
  payment: {
    label: '💳 روش‌های پرداخت',
    text: '💳 روش‌های پرداخت ما:\n\n🅿️ PayPal\n💜 Hesab\n💳 کارت به کارت\n🟡 Binance Pay\n\nهمه‌ی این روش‌ها توی سایت موقع ثبت سفارش قابل انتخابن.'
  },
  delivery: {
    label: '⏱️ زمان تحویل',
    text: '⏱️ زمان تحویل سفارشات معمولاً بین ۱ دقیقه تا ۳۰ دقیقه طول می‌کشه، بسته به نوع بازی و شلوغی سیستم.\n\nبعد از ثبت سفارش می‌تونی وضعیتش رو توی سایت (تب سفارشات) دنبال کنی.'
  },
  games: {
    label: '🎮 لیست بازی‌ها',
    text: '🎮 بازی‌ها و اپلیکیشن‌های موجود:\n\n• PUBG Mobile (UC)\n• Free Fire (Diamonds)\n• Mobile Legends (Diamonds)\n• Genshin Impact\n• Honkai: Star Rail\n• Call of Duty Mobile\n• Clash of Clans\n• IMO (Diamond)\n• TikTok Coins\n\nلیست کامل با قیمت: https://afghancoins.online'
  }
};

const MAIN_KEYBOARD = {
  inline_keyboard: [
    [{ text: FAQ.prices.label, callback_data: 'faq_prices' }, { text: FAQ.payment.label, callback_data: 'faq_payment' }],
    [{ text: FAQ.delivery.label, callback_data: 'faq_delivery' }, { text: FAQ.games.label, callback_data: 'faq_games' }],
    [{ text: '🛒 ثبت سفارش', url: 'https://afghancoins.online' }, { text: '📞 پشتیبانی', callback_data: 'faq_support' }]
  ]
};

async function sendMessage(token, chatId, text, keyboard) {
  const body = { chat_id: chatId, text, parse_mode: 'Markdown' };
  if (keyboard) body.reply_markup = keyboard;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

async function answerCallback(token, callbackQueryId) {
  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId })
  });
}

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!TELEGRAM_TOKEN) {
    return { statusCode: 500, body: 'TELEGRAM_BOT_TOKEN not configured' };
  }

  let update;
  try { update = JSON.parse(event.body); }
  catch(e) { return { statusCode: 400, body: 'Invalid JSON' }; }

  // Handle button taps (inline keyboard)
  if (update.callback_query) {
    const cq = update.callback_query;
    const chatId = cq.message.chat.id;
    const data = cq.data;

    await answerCallback(TELEGRAM_TOKEN, cq.id);

    let reply;
    if (data === 'faq_prices') reply = FAQ.prices.text;
    else if (data === 'faq_payment') reply = FAQ.payment.text;
    else if (data === 'faq_delivery') reply = FAQ.delivery.text;
    else if (data === 'faq_games') reply = FAQ.games.text;
    else if (data === 'faq_support') reply = '📞 پشتیبانی AfghanCoins:\n\n💬 واتساپ: @AFG_Team\n📢 تلگرام: @AFGTeam_support\n\nهر سوالی داشتی در خدمتیم!';
    else reply = 'متوجه نشدم، لطفاً از دکمه‌ها استفاده کن.';

    await sendMessage(TELEGRAM_TOKEN, chatId, reply);
    return { statusCode: 200, body: 'OK' };
  }

  const message = update.message;
  if (!message || !message.text) {
    return { statusCode: 200, body: 'OK' }; // ignore non-text updates
  }

  const chatId = message.chat.id;
  const text = message.text.trim();
  const lower = text.toLowerCase();
  const firstName = message.from?.first_name || '';

  let reply = null;
  let keyboard = null;

  if (text === '/start') {
    reply = `👋 سلام ${firstName}!\n\nبه ربات رسمی *AfghanCoins* خوش آمدید 🎮\n\nما شارژ سریع UC، Diamonds و ارزهای بازی‌های محبوب رو با بهترین قیمت ارائه می‌دیم.\n\nیکی از گزینه‌های زیر رو انتخاب کن، یا سوالت رو مستقیم بنویس:`;
    keyboard = MAIN_KEYBOARD;
  } else if (text === '/help') {
    reply = `📖 راهنمای ربات AfghanCoins:\n\n/start - شروع مجدد و نمایش منو\n/order - لینک ثبت سفارش\n/support - تماس با پشتیبانی\n\nهمچنین می‌تونی مستقیم به سایت ما مراجعه کنی:\nhttps://afghancoins.online`;
  } else if (text === '/order') {
    reply = `🛒 برای ثبت سفارش به سایت ما مراجعه کن:\nhttps://afghancoins.online\n\nUC پابجی، دایموند فری‌فایر و بازی‌های دیگه با بهترین قیمت و تحویل سریع 🎮`;
  } else if (text === '/support') {
    reply = `📞 پشتیبانی AfghanCoins:\n\n💬 واتساپ: @AFG_Team\n📢 تلگرام: @AFGTeam_support\n\nهر سوالی داشتی در خدمتیم!`;
  } else if (/قیمت|چقدر|هزینه/.test(lower)) {
    reply = FAQ.prices.text;
  } else if (/پرداخت|پیپال|paypal|hesab|کارت/.test(lower)) {
    reply = FAQ.payment.text;
  } else if (/تحویل|زمان|چند دقیقه|طول می.کشه/.test(lower)) {
    reply = FAQ.delivery.text;
  } else if (/بازی|گیم|لیست|imo|تیک ?تاک|tiktok/.test(lower)) {
    reply = FAQ.games.text;
  } else {
    reply = `متوجه دستورت نشدم 🤔\n\nاز دکمه‌های زیر استفاده کن یا /help رو بزن:`;
    keyboard = MAIN_KEYBOARD;
  }

  try {
    await sendMessage(TELEGRAM_TOKEN, chatId, reply, keyboard);
  } catch(e) {
    console.error('Reply send error:', e);
  }

  return { statusCode: 200, body: 'OK' };
};
