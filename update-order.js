const { getStore } = require('@netlify/blobs');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'afghan2025';

  let body;
  try { body = JSON.parse(event.body); }
  catch(e) { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { password, orderId, status } = body;
  if (password !== ADMIN_PASS) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  if (!orderId || !status) return { statusCode: 400, body: JSON.stringify({ error: 'orderId and status required' }) };

  try {
    const store = getStore('orders');
    const order = await store.get(orderId, { type: 'json' });
    if (!order) return { statusCode: 404, body: JSON.stringify({ error: 'Order not found' }) };

    order.status = status;
    if (status === 'completed') order.completedAt = new Date().toISOString();
    await store.setJSON(orderId, order);

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, order }) };
  } catch(e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error', details: e.message }) };
  }
};
