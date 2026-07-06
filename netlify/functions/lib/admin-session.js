const { getStore } = require('@netlify/blobs');

const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function adminSessionsStore() {
  return getStore({ name: 'admin-sessions', siteID: process.env.NETLIFY_SITE_ID, token: process.env.NETLIFY_BLOBS_TOKEN });
}

async function verifyAdminSession(token) {
  if (!token) return false;
  const sessions = adminSessionsStore();
  const session = await sessions.get(token, { type: 'json' });
  if (!session || (session.expiresAt && Date.now() > session.expiresAt)) {
    if (session) await sessions.delete(token);
    return false;
  }
  return true;
}

module.exports = { adminSessionsStore, verifyAdminSession, SESSION_TTL_MS };
