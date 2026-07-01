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

  const message = update.message;
  if (!message || !message.text) {
    return { statusCode: 200, body: 'OK' }; // ignore non-text updates
  }

  const chatId = message.chat.id;
  const text = message.text.trim();
  const firstName = message.from?.first_name || '';

  let reply = null;

  if (text === '/start') {
    reply = `👋 سلام ${firstName}!\n\nبه ربات رسمی *AfghanCoins* خوش آمدید 🎮\n\nما شارژ سریع UC، Diamonds و ارزهای بازی‌های محبوب رو با بهترین قیمت ارائه می‌دیم.\n\n🛒 سفارش: https://afghancoins.online\n\nبرای راهنمایی بیشتر از دستورات زیر استفاده کنید:\n/help - راهنما\n/order - ثبت سفارش\n/support - پشتیبانی`;
  } else if (text === '/help') {
    reply = `📖 راهنمای ربات AfghanCoins:\n\n/start - شروع مجدد\n/order - لینک ثبت سفارش\n/support - تماس با پشتیبانی\n\nهمچنین می‌تونی مستقیم به سایت ما مراجعه کنی:\nhttps://afghancoins.online`;
  } else if (text === '/order') {
    reply = `🛒 برای ثبت سفارش به سایت ما مراجعه کن:\nhttps://afghancoins.online\n\nUC پابجی، دایموند فری‌فایر و بازی‌های دیگه با بهترین قیمت و تحویل سریع 🎮`;
  } else if (text === '/support') {
    reply = `📞 پشتیبانی AfghanCoins:\n\n💬 واتساپ: https://wa.me/4915210984525\n📢 تلگرام: @afghanfollowers\n\nهر سوالی داشتی در خدمتیم!`;
  } else {
    reply = `متوجه دستورت نشدم 🤔\n\nاز /help برای دیدن دستورات موجود استفاده کن.`;
  }

  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: reply, parse_mode: 'Markdown' })
    });
  } catch(e) {
    console.error('Reply send error:', e);
  }

  return { statusCode: 200, body: 'OK' };
};
