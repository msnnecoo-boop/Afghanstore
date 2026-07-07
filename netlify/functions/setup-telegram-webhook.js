// One-off setup helper: registers the Telegram webhook using the
// TELEGRAM_BOT_TOKEN already configured in Netlify, so there's no risk of a
// typo/autocorrect mangling the token when pasting it into a browser URL
// bar by hand. Visit this URL once after deploying; safe to call again any
// time to re-point the webhook at this site.
exports.handler = async function(event) {
  const headers = { 'Content-Type': 'application/json' };
  const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!TELEGRAM_TOKEN) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'TELEGRAM_BOT_TOKEN not configured' }) };
  }

  const siteUrl = process.env.URL || 'https://afghancoins.online';
  const webhookUrl = `${siteUrl}/.netlify/functions/telegram-webhook`;

  try {
    const meRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getMe`).then(r => r.json());
    const setRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}`).then(r => r.json());
    const webhookInfo = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getWebhookInfo`).then(r => r.json());

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ bot: meRes, setWebhookResult: setRes, webhookInfo, requestedUrl: webhookUrl }, null, 2)
    };
  } catch(e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error', details: e.message }) };
  }
};
