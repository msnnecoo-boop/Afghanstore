const { getStore } = require('@netlify/blobs');
const crypto = require('crypto');

function usersStore() {
  return getStore({ name: 'users', siteID: process.env.NETLIFY_SITE_ID, token: process.env.NETLIFY_BLOBS_TOKEN });
}
function sessionsStore() {
  return getStore({ name: 'sessions', siteID: process.env.NETLIFY_SITE_ID, token: process.env.NETLIFY_BLOBS_TOKEN });
}
function hashPassword(password, salt) {
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

exports.handler = async function(event) {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };

  let body;
  try { body = JSON.parse(event.body); }
  catch(e) { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';

  try {
    const users = usersStore();
    const user = await users.get(email, { type: 'json' });
    if (!user) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'ایمیل یا رمز اشتباه است' }) };
    }
    const hash = hashPassword(password, user.salt);
    if (hash !== user.passwordHash) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'ایمیل یا رمز اشتباه است' }) };
    }

    const token = crypto.randomBytes(24).toString('hex');
    const sessions = sessionsStore();
    await sessions.setJSON(token, { email, createdAt: new Date().toISOString() });

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, token, email }) };
  } catch(e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error', details: e.message }) };
  }
};
