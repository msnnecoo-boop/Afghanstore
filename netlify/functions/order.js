const { getStore } = require('@netlify/blobs');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7634398182:AAH_VVcSUmvDTqtQyjer7G_YsAAAydg4zWs';
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '221207676';
  const FOXRELOAD_KEY = process.env.FOXRELOAD_API_KEY;

  let body;
  try { body = JSON.parse(event.body); }
  catch(e) { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { orderId, productId, playerId, game, pkg, price, payment } = body;

  try {
    const store = getStore('orders');
    await store.setJSON(orderId, {
      id: orderId, game, pkg, playerId, payment,
      price, productId, status: 'pending',
      createdAt: new Date().toISOString(), completedAt: null
    });
  } catch(e) { console.error('Blob error:', e); }

  const msg = `🛒 *سفارش جدید!*\n\n🆔 \`${orderId}\`\n🎮 ${game}\n💎 ${pkg}\n👤 \`${playerId}\`\n💰 $${price}\n💳 ${payment}`;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: msg, parse_mode: 'Markdown' })
    });
  } catch(e) { console.error('Telegram error:', e); }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true, orderId })
  };
};

