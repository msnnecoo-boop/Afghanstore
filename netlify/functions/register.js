const { getStore } = require('@netlify/blobs');
const crypto = require('crypto');
const { getClientIp, checkRateLimit } = require('./lib/rate-limit');

const PBKDF2_ITERATIONS = 100000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function usersStore() {
  return getStore({ name: 'users', siteID: process.env.NETLIFY_SITE_ID, token: process.env.NETLIFY_BLOBS_TOKEN });
}
function sessionsStore() {
  return getStore({ name: 'sessions', siteID: process.env.NETLIFY_SITE_ID, token: process.env.NETLIFY_BLOBS_TOKEN });
}
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 32, 'sha256').toString('hex');
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
  const phone = (body.phone || '').trim();

  if (!email || !password || password.length < 4) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'ایمیل و رمز (حداقل ۴ کاراکتر) لازم است' }) };
  }

  const ip = getClientIp(event);
  const allowed = await checkRateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
  if (!allowed) {
    return { statusCode: 429, headers, body: JSON.stringify({ error: 'تلاش‌های زیاد، یک ساعت بعد دوباره امتحان کنید' }) };
  }

  try {
    const users = usersStore();
    const existing = await users.get(email, { type: 'json' });
    if (existing) {
      return { statusCode: 409, headers, body: JSON.stringify({ error: 'این ایمیل قبلاً ثبت شده است' }) };
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);
    await users.setJSON(email, { email, phone, salt, passwordHash, algo: 'pbkdf2', createdAt: new Date().toISOString() });

    const token = crypto.randomBytes(24).toString('hex');
    const sessions = sessionsStore();
    await sessions.setJSON(token, { email, createdAt: new Date().toISOString(), expiresAt: Date.now() + SESSION_TTL_MS });

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, token, email }) };
  } catch(e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error', details: e.message }) };
  }
};
