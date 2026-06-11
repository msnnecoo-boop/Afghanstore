const { getStore } = require('@netlify/blobs');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'afghan2025';
  const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7634398182:AAH_VVcSUmvDTqtQyjer7G_YsAAAydg4zWs';

  let body;
  try { body = JSON.parse(event.body); } catch(e) { return { statusCode: 400, body: 'Invalid JSON' }; }

  const { orderId, status, password } = body;
  if (password !== ADMIN_PASS) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };

  try {
    const store = getStore('orders');
    const order = await store.get(orderId, { type: 'json' });
    if (!order) return { statusCode: 404, body: JSON.stringify({ error: 'Order not found' }) };

    order.status = status;
    if (status === 'completed') order.completedAt = new Date().toISOString();
    await store.setJSON(orderId, order);

    if (status === 'completed') {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID || '221207676',
          text: `✅ سفارش ${orderId} تکمیل شد!`
        })
      });
    }

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, order }) };
  } catch(e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
};

