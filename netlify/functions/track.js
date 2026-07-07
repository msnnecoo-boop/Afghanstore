exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' };

  try {
    const body = JSON.parse(event.body);
    const { page, device, referrer } = body;

    // Get visitor IP and location
    const ip = event.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
               event.headers['client-ip'] || 'Unknown';

    // Get location from IP
    let country = 'Unknown', city = 'Unknown', flag = '🌍';
    try {
      const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
      const geo = await geoRes.json();
      country = geo.country_name || 'Unknown';
      city = geo.city || 'Unknown';
      flag = geo.country_code ? 
        String.fromCodePoint(...[...geo.country_code].map(c => 0x1F1E0 + c.charCodeAt(0) - 65)) : '🌍';
    } catch(e) {}

    // Get user agent info
    const ua = event.headers['user-agent'] || '';
    let deviceType = '💻 کامپیوتر';
    if (/Mobile|Android|iPhone|iPad/i.test(ua)) deviceType = '📱 موبایل';
    else if (/Tablet|iPad/i.test(ua)) deviceType = '📟 تبلت';

    let browser = 'Other';
    if (/Chrome/i.test(ua)) browser = 'Chrome';
    else if (/Firefox/i.test(ua)) browser = 'Firefox';
    else if (/Safari/i.test(ua)) browser = 'Safari';
    else if (/Edge/i.test(ua)) browser = 'Edge';

    const now = new Date();
    const time = now.toLocaleString('fa-IR', { timeZone: 'Asia/Kabul' });

    // Page names in Farsi
    const pageNames = {
      'home': '🏠 خانه',
      'games': '🎮 بازی‌ها',
      'blog': '📝 بلاگ',
      'orders': '📦 سفارشات',
      'affiliate': '🎁 پیشنهادها',
    };
    const pageName = pageNames[page] || page || 'نامشخص';

    // Send to Telegram
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error('track.js: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set in this deploy context');
    } else {
      const message = `👁️ بازدیدکننده جدید!\n\n` +
        `📄 صفحه: ${pageName}\n` +
        `${flag} کشور: ${country}\n` +
        `🏙️ شهر: ${city}\n` +
        `${deviceType}\n` +
        `🌐 مرورگر: ${browser}\n` +
        `⏰ زمان: ${time}\n` +
        `🔗 IP: ${ip}`;

      try {
        const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'HTML'
          })
        });
        const tgData = await tgRes.json();
        if (!tgData.ok) console.error('track.js: Telegram API rejected message:', tgData);
      } catch(e) {
        console.error('track.js: Telegram request failed:', e.message);
      }
    }

    // Save visitor data (using Netlify Blobs or return data)
    const visitorData = {
      ip, country, city, flag,
      device: deviceType, browser,
      page: pageName, time,
      referrer: referrer || 'مستقیم',
      timestamp: now.toISOString()
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, visitor: visitorData })
    };
  } catch(err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
