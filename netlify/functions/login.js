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
function hashPasswordLegacy(password, salt) {
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}
function hashPasswordPBKDF2(password, salt) {
  return crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 32, 'sha256').toString('hex');
}
function safeEqual(a, b) {
  const bufA = Buffer.from(a || '', 'hex');
  const bufB = Buffer.from(b || '', 'hex');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
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

  const ip = getClientIp(event);
  const allowed = await checkRateLimit(`login:${ip}:${email}`, 10, 15 * 60 * 1000);
  if (!allowed) {
    return { statusCode: 429, headers, body: JSON.stringify({ error: 'تلاش‌های زیاد، چند دقیقه بعد دوباره امتحان کنید' }) };
  }

  try {
    const users = usersStore();
    const user = await users.get(email, { type: 'json' });
    if (!user) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'ایمیل یا رمز اشتباه است' }) };
    }

    let valid;
    if (user.algo === 'pbkdf2') {
      valid = safeEqual(hashPasswordPBKDF2(password, user.salt), user.passwordHash);
    } else {
      valid = safeEqual(hashPasswordLegacy(password, user.salt), user.passwordHash);
      if (valid) {
        // Transparently upgrade legacy single-round SHA-256 hashes to PBKDF2.
        const newSalt = crypto.randomBytes(16).toString('hex');
        user.salt = newSalt;
        user.passwordHash = hashPasswordPBKDF2(password, newSalt);
        user.algo = 'pbkdf2';
        await users.setJSON(email, user);
      }
    }
    if (!valid) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'ایمیل یا رمز اشتباه است' }) };
    }

    const token = crypto.randomBytes(24).toString('hex');
    const sessions = sessionsStore();
    await sessions.setJSON(token, { email, createdAt: new Date().toISOString(), expiresAt: Date.now() + SESSION_TTL_MS });

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, token, email }) };
  } catch(e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error', details: e.message }) };
  }
};
