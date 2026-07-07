const { getStore } = require('@netlify/blobs');

function sessionsStore() {
  return getStore({ name: 'sessions', siteID: process.env.NETLIFY_SITE_ID, token: process.env.NETLIFY_BLOBS_TOKEN });
}
function ordersStore() {
  return getStore({ name: 'orders', siteID: process.env.NETLIFY_SITE_ID, token: process.env.NETLIFY_BLOBS_TOKEN });
}

exports.handler = async function(event) {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  const token = event.queryStringParameters?.token;
  if (!token) return { statusCode: 400, headers, body: JSON.stringify({ error: 'token required' }) };

  try {
    const sessions = sessionsStore();
    const session = await sessions.get(token, { type: 'json' });
    if (!session || (session.expiresAt && Date.now() > session.expiresAt)) {
      if (session) await sessions.delete(token);
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'نشست منقضی شده، دوباره وارد شوید' }) };
    }

    const store = ordersStore();
    const { blobs } = await store.list();
    const allOrders = await Promise.all(blobs.map(b => store.get(b.key, { type: 'json' })));
    const myOrders = allOrders
      .filter(o => o && o.customerEmail === session.email)
      .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, email: session.email, orders: myOrders }) };
  } catch(e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error', details: e.message }) };
  }
};
