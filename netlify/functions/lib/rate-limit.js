const { getStore } = require('@netlify/blobs');

function rateLimitStore() {
  return getStore('rate-limits');
}

function getClientIp(event) {
  return (event.headers['x-forwarded-for'] || '').split(',')[0].trim() || event.headers['client-ip'] || 'unknown';
}

// Returns true if the caller is still within `limit` attempts inside the last
// `windowMs` milliseconds for this key, false if the limit has been exceeded.
async function checkRateLimit(key, limit, windowMs) {
  const store = rateLimitStore();
  const now = Date.now();
  const rec = await store.get(key, { type: 'json' });
  if (!rec || now - rec.windowStart > windowMs) {
    await store.setJSON(key, { count: 1, windowStart: now });
    return true;
  }
  if (rec.count >= limit) return false;
  rec.count += 1;
  await store.setJSON(key, rec);
  return true;
}

module.exports = { getClientIp, checkRateLimit };
