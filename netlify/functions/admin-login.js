const { getStore } = require('@netlify/blobs');
const crypto = require('crypto');

function adminSessionsStore() {
  return getStore({ name: 'admin-sessions', siteID: process.env.NETLIFY_SITE_ID, token: process.env.NETLIFY_BLOBS_TOKEN });
}

exports.handler = async function(event) {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };

  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  if (!ADMIN_PASSWORD) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'ADMIN_PASSWORD not configured' }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch(e) { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const password = body.password || '';
  if (password !== ADMIN_PASSWORD) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'رمز عبور اشتباه است' }) };
  }

  try {
    const token = crypto.randomBytes(24).toString('hex');
    const sessions = adminSessionsStore();
    await sessions.setJSON(token, { createdAt: new Date().toISOString() });

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, token }) };
  } catch(e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error', details: e.message }) };
  }
};
