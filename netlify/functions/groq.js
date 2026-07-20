const { getClientIp, checkRateLimit } = require('./lib/rate-limit');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'GROQ_API_KEY not configured' }) };
  }

  const ip = getClientIp(event);
  const allowed = await checkRateLimit(`groq:${ip}`, 20, 10 * 60 * 1000);
  if (!allowed) {
    return { statusCode: 429, headers, body: JSON.stringify({ error: 'تعداد درخواست‌ها زیاد است، چند دقیقه بعد دوباره امتحان کنید' }) };
  }

  try {
    const body = JSON.parse(event.body);
    const messages = body.messages || [];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + GROQ_API_KEY,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1000,
        messages: messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { statusCode: response.status, headers, body: JSON.stringify({ error: data }) };
    }

    // Clean up weird characters from response
    let reply = data.choices && data.choices[0] ? data.choices[0].message.content : '';
    reply = reply.replace(/[^\u0000-\u007E\u0600-\u06FF\u200C\u200D\n\r\t ]/g, '');
    reply = reply.trim();

    data.choices[0].message.content = reply;

    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
