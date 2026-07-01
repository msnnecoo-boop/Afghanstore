const { getStore } = require('@netlify/blobs');

function ordersStore() {
  return getStore({
    name: 'orders',
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_BLOBS_TOKEN
  });
}

exports.handler = async function(event) {
  const orderId = event.queryStringParameters?.id;
  if (!orderId) return { statusCode: 400, body: JSON.stringify({ error: 'Order ID required' }) };

  try {
    const store = ordersStore();
    const order = await store.get(orderId, { type: 'json' });
    if (!order) return { statusCode: 404, body: JSON.stringify({ error: 'Order not found' }) };
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order) };
  } catch(e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
};
