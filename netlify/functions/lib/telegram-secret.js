const crypto = require('crypto');

// Derives a Telegram webhook secret_token from the bot token itself, so
// there's no separate secret to configure/rotate — anyone who has the bot
// token can already impersonate the bot anyway. Telegram requires
// secret_token to only contain [A-Za-z0-9_-], which a hex digest satisfies.
function webhookSecret(botToken) {
  return crypto.createHash('sha256').update(botToken).digest('hex');
}

module.exports = { webhookSecret };
