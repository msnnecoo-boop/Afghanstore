const { getStore } = require('@netlify/blobs');
const { verifyAdminSession } = require('./lib/admin-session');

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

  let body;
  try { body = JSON.parse(event.body); }
  catch(e) { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { token, orderId, status } = body;
  if (!(await verifyAdminSession(token))) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  if (!orderId || !status) return { statusCode: 400, body: JSON.stringify({ error: 'orderId and status required' }) };

  try {
    const store = ordersStore();
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
