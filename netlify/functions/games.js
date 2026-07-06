const { getStore } = require('@netlify/blobs');
const { verifyAdminSession } = require('./lib/admin-session');

function gamesStore() {
  return getStore({ name: 'games', siteID: process.env.NETLIFY_SITE_ID, token: process.env.NETLIFY_BLOBS_TOKEN });
}

exports.handler = async function(event) {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  if (event.httpMethod === 'GET') {
    try {
      const list = await gamesStore().get('list', { type: 'json' });
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, games: list || [] }) };
    } catch(e) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error', details: e.message }) };
    }
  }

  if (event.httpMethod === 'POST') {
    let body;
    try { body = JSON.parse(event.body); }
    catch(e) { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

    const { token, games } = body;
    if (!(await verifyAdminSession(token))) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    if (!Array.isArray(games)) return { statusCode: 400, headers, body: JSON.stringify({ error: 'games array required' }) };

    try {
      await gamesStore().setJSON('list', games);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    } catch(e) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error', details: e.message }) };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
};
