const { getStore } = require('@netlify/blobs');
const { verifyAdminSession } = require('./lib/admin-session');

function ordersStore() {
  return getStore('orders');
}

exports.handler = async function(event) {
  const token = event.queryStringParameters?.token;
  if (!(await verifyAdminSession(token))) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };

  try {
    const store = ordersStore();
    const { blobs } = await store.list();
    const orders = await Promise.all(blobs.map(b => store.get(b.key, { type: 'json' })));
    const sorted = orders.filter(Boolean).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sorted) };
  } catch(e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error', details: e.message }) };
  }
};
