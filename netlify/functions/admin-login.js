const crypto = require('crypto');
const { getClientIp, checkRateLimit } = require('./lib/rate-limit');
const { adminSessionsStore, SESSION_TTL_MS } = require('./lib/admin-session');

function safeEqual(a, b) {
  const bufA = Buffer.from(a || '');
  const bufB = Buffer.from(b || '');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

exports.handler = async function(event) {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };

  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  if (!ADMIN_PASSWORD) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'ADMIN_PASSWORD not configured' }) };
  }

  const ip = getClientIp(event);
  const allowed = await checkRateLimit(`admin-login:${ip}`, 10, 15 * 60 * 1000);
  if (!allowed) {
    return { statusCode: 429, headers, body: JSON.stringify({ error: 'تلاش‌های زیاد، چند دقیقه بعد دوباره امتحان کنید' }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch(e) { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const password = body.password || '';
  if (!safeEqual(password, ADMIN_PASSWORD)) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'رمز عبور اشتباه است' }) };
  }

  try {
    const token = crypto.randomBytes(24).toString('hex');
    const sessions = adminSessionsStore();
    await sessions.setJSON(token, { createdAt: new Date().toISOString(), expiresAt: Date.now() + SESSION_TTL_MS });

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, token }) };
  } catch(e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error', details: e.message }) };
  }
};
