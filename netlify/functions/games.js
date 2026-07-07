const { getStore } = require('@netlify/blobs');
const { verifyAdminSession } = require('./lib/admin-session');

function gamesStore() {
  return getStore({ name: 'games', siteID: process.env.NETLIFY_SITE_ID, token: process.env.NETLIFY_BLOBS_TOKEN });
}

// Always merged into the saved list by id (see the GET handler below), so
// adding a new entry here still shows up for admins who already saved
// changes before it existed. Note: the merge only skips ids already present
// in the saved list, so hitting "حذف" (delete) on one of these just brings
// it back on the next load — use the active/inactive toggle to hide one of
// these for good instead of the delete button.
const DEFAULT_GAMES = [
  { id:'pubg', name:'PUBG Mobile', icon:'🪖', image:null, currency:'UC', idLabel:'PUBG Player ID', active:true, packages:[] },
  { id:'freefire', name:'Free Fire', icon:'🔥', image:null, currency:'Diamonds', idLabel:'Free Fire Player ID', active:true, packages:[] },
  { id:'mlbb', name:'Mobile Legends', icon:'⚔️', image:null, currency:'Diamonds', idLabel:'MLBB User ID', active:true, packages:[] },
  {
    id:'roblox', name:'Roblox', icon:'🎮', image:null, currency:'Robux', idLabel:'یوزرنیم یا Roblox User ID', active:true,
    // Base cost = Roblox's own official in-app Robux prices, +10% margin on top.
    packages:[
      { amount:400, price:5.49, productId:null },
      { amount:800, price:10.99, productId:null },
      { amount:1700, price:21.99, popular:true, productId:null },
      { amount:4500, price:54.99, productId:null },
      { amount:10000, price:109.99, productId:null },
    ],
  },
];

exports.handler = async function(event) {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  if (event.httpMethod === 'GET') {
    try {
      const list = await gamesStore().get('list', { type: 'json' });
      // If the store already has data from before a default was added (e.g.
      // Roblox), merge in whichever defaults are missing by id instead of
      // only falling back to DEFAULT_GAMES on a completely empty store.
      const merged = list
        ? list.concat(DEFAULT_GAMES.filter(d => !list.some(g => g.id === d.id)))
        : DEFAULT_GAMES;
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, games: merged }) };
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
