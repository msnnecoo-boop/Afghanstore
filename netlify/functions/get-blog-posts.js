const { getStore } = require('@netlify/blobs');
const { listAllBlobs } = require('./lib/list-all');

function blogStore() {
  return getStore({ name: 'blogposts', siteID: process.env.NETLIFY_SITE_ID, token: process.env.NETLIFY_BLOBS_TOKEN });
}

exports.handler = async function(event) {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  try {
    const store = blogStore();
    const blobs = await listAllBlobs(store);
    const posts = await Promise.all(blobs.map(b => store.get(b.key, { type: 'json' })));
    const sorted = posts.filter(Boolean).sort((a,b) => new Date(b.date) - new Date(a.date));
    return { statusCode: 200, headers, body: JSON.stringify({ success: true, posts: sorted.slice(0, 20) }) };
  } catch(e) {
    return { statusCode: 200, headers, body: JSON.stringify({ success: true, posts: [] }) };
  }
};
