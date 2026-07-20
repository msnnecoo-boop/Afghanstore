const { getStore } = require('@netlify/blobs');

function ordersStore() {
  return getStore({
    name: 'orders',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_BLOBS_TOKEN
  });
}

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

  const { orderId, productId, playerId, game, pkg, price, payment, customerEmail, receiptImage } = body;
  if (!orderId || !playerId || !game || !pkg || !payment || typeof price === 'undefined') {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required order fields' }) };
  }

  // Save order to Netlify Blobs. FoxReload fulfillment does NOT happen here —
  // it only fires once an admin manually marks the order 'completed' (see
  // update-order.js), so every order gets a human payment check first.
  const store = ordersStore();
  try {
    if (await store.get(orderId, { type: 'json' })) {
      return { statusCode: 409, body: JSON.stringify({ error: 'Order ID already exists' }) };
    }
    const orderData = {
      id: orderId,
      game, pkg, playerId, payment,
      price, productId,
      customerEmail: customerEmail || null,
      hasReceipt: !!receiptImage,
      status: 'pending',
      createdAt: new Date().toISOString(),
      completedAt: null
    };
    await store.setJSON(orderId, orderData);
  } catch(e) {
    console.error('Blob save error:', e);
  }

  const msg = `🛒 سفارش جدید!\n\n🆔 ${orderId}\n🎮 ${game}\n💎 ${pkg}\n👤 Player ID: ${playerId}\n💰 $${price}\n💳 ${payment}`;

  // Send Telegram notification
  if (TELEGRAM_TOKEN && CHAT_ID) {
    const telegramMsg = `🛒 سفارش جدید!\n\n🆔 ${orderId}\n🎮 ${game}\n💎 ${pkg}\n👤 Player ID: ${playerId}\n💰 $${price}\n💳 ${payment}`;
    try {
      const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text: telegramMsg })
      });
      const tgData = await tgRes.json();
      if (!tgData.ok) console.error('Telegram API rejected message:', tgData);
    } catch(e) { console.error('Telegram error:', e); }
  }

  // Send WhatsApp notification via CallMeBot
  if (CALLMEBOT_PHONE && CALLMEBOT_APIKEY) {
    try {
      const waUrl = `https://api.callmebot.com/whatsapp.php?phone=${CALLMEBOT_PHONE}&text=${encodeURIComponent(msg)}&apikey=${CALLMEBOT_APIKEY}`;
      await fetch(waUrl);
    } catch(e) { console.error('CallMeBot WhatsApp error:', e); }
  }

  // Send receipt image to Telegram, if provided (e.g. Hesab / Card-to-Card payments)
  if (TELEGRAM_TOKEN && CHAT_ID && receiptImage && typeof receiptImage === 'string' && receiptImage.startsWith('data:')) {
    try {
      const matches = receiptImage.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
        const mime = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        const form = new FormData();
        form.append('chat_id', CHAT_ID);
        form.append('caption', `🧾 فیش واریزی سفارش ${orderId}`);
        form.append('photo', new Blob([buffer], { type: mime }), 'receipt.jpg');
        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`, {
          method: 'POST',
          body: form
        });
      }
    } catch(e) { console.error('Receipt photo send error:', e); }
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true, orderId })
  };
};
