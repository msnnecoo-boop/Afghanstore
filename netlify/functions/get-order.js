const { getStore } = require('@netlify/blobs');

function ordersStore() {
  return getStore('orders');
}

exports.handler = async function(event) {
  const orderId = event.queryStringParameters?.id;
  if (!orderId) return { statusCode: 400, body: JSON.stringify({ error: 'Order ID required' }) };

  try {
    const store = ordersStore();
    const order = await store.get(orderId, { type: 'json' });
    if (!order) return { statusCode: 404, body: JSON.stringify({ error: 'Order not found' }) };
    // Only expose status fields here; this endpoint is unauthenticated (used for
    // guest order-tracking), so avoid leaking customerEmail/playerId/price etc.
    const publicOrder = { id: order.id, status: order.status, completedAt: order.completedAt };
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(publicOrder) };
  } catch(e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
};
