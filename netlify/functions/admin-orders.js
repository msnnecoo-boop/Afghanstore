const { getStore } = require('@netlify/blobs');

exports.handler = async function(event) {
  const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'afghan2025';
  const password = event.queryStringParameters?.password;
  if (password !== ADMIN_PASS) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };

  try {
    const store = getStore('orders');
    const { blobs } = await store.list();
    const orders = await Promise.all(blobs.map(b => store.get(b.key, { type: 'json' })));
    const sorted = orders.filter(Boolean).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sorted) };
  } catch(e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error', details: e.message }) };
  }
};

