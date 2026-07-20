const { getStore } = require('@netlify/blobs');

function blogStore() {
  return getStore({ name: 'blogposts', siteID: process.env.NETLIFY_SITE_ID, token: process.env.NETLIFY_BLOBS_TOKEN });
}

const GAMES_ROTATION = [
  { name: 'PUBG Mobile', tag: 'اخبار' },
  { name: 'Free Fire', tag: 'اخبار' },
  { name: 'Mobile Legends', tag: 'تیپس' },
  { name: 'Genshin Impact', tag: 'اخبار' },
  { name: 'Honkai: Star Rail', tag: 'تیپس' },
  { name: 'Clash of Clans', tag: 'راهنما' },
  { name: 'Call of Duty Mobile', tag: 'اخبار' },
];

exports.handler = async function(event) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'GROQ_API_KEY not configured' }) };
  }

  const dayIndex = new Date().getDate() % GAMES_ROTATION.length;
  const game = GAMES_ROTATION[dayIndex];
  const id = new Date().toISOString().slice(0,10) + '-' + game.name.replace(/\s+/g,'-').toLowerCase();

  const store = blogStore();
  // Deterministic per-day id means anyone hitting this URL directly (it has
  // no invocation check, only Netlify's own scheduler is meant to call it)
  // just gets back today's already-generated post instead of re-billing Groq.
  const existing = await store.get(id, { type: 'json' });
  if (existing) {
    return { statusCode: 200, headers: {'Content-Type':'application/json'}, body: JSON.stringify({ success: true, post: existing }) };
  }

  const prompt = `یک پست بلاگ کوتاه و اورجینال (حدود ۱۰۰ تا ۱۵۰ کلمه) فقط و فقط به زبان فارسی روان درباره‌ی «${game.name}» بنویس. موضوع می‌تواند نکات، ترفندها، یا معرفی ویژگی‌های بازی باشد (نه اخبار جعلی یا آپدیت خیالی که وجود ندارد). لحن دوستانه و مفید برای بازیکنان باشد. در پایان به‌طور طبیعی به فروشگاه شارژ بازی afghancoins.online اشاره کن.\n\nمهم: کل متن باید فقط فارسیِ استاندارد باشد؛ هیچ کلمه یا حرفی از زبان‌های دیگر (انگلیسی به‌جز نام بازی، روسی، چینی، ژاپنی و غیره) استفاده نکن. فقط متن پست را بنویس، بدون مقدمه یا توضیح اضافه.`;

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + GROQ_API_KEY },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 500,
        temperature: 0.4,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const groqData = await groqRes.json();
    let content = groqData.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('No content generated');

    const title = `${game.name}: نکات و ترفندهای امروز`;
    const excerpt = content.length > 140 ? content.slice(0, 140) + '...' : content;

    const post = {
      id,
      title,
      tag: game.tag,
      excerpt,
      content,
      game: game.name,
      date: new Date().toISOString(),
      readTime: Math.max(2, Math.round(content.split(' ').length / 40))
    };

    await store.setJSON(id, post);

    return { statusCode: 200, headers: {'Content-Type':'application/json'}, body: JSON.stringify({ success: true, post }) };
  } catch(e) {
    return { statusCode: 500, headers: {'Content-Type':'application/json'}, body: JSON.stringify({ error: e.message }) };
  }
};

// Runs once a day automatically (configured via netlify.toml schedule)
exports.config = { schedule: '@daily' };
