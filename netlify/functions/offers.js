const { getStore } = require('@netlify/blobs');
const { verifyAdminSession } = require('./lib/admin-session');

function offersStore() {
  return getStore('offers');
}

// Always merged into the saved list by id (see the GET handler below), so
// adding a new entry here still shows up for admins who already saved
// changes before it existed. Note: the merge only skips ids already present
// in the saved list, so hitting "حذف" (delete) on one of these just brings
// it back on the next load — use the active/inactive toggle to hide one of
// these for good instead of the delete button.
const DEFAULT_OFFERS = [
  {
    id: 'smm', active: true, icon: '📱', image: null,
    title: 'فالوور شبکه‌های اجتماعی', subtitle: 'Instagram · TikTok · YouTube · Telegram',
    link: 'https://afghanfollowers.online',
    benefits: 'با افزایش فالوور و لایک واقعی، صفحه‌ی شما سریع‌تر رشد می‌کنه و اعتبار بیشتری پیش مخاطب‌ها پیدا می‌کنه. مناسب برای کسب‌وکارها، اینفلوئنسرها و هر کسی که می‌خواد صفحه‌ش حرفه‌ای‌تر دیده بشه. تحویل سریع و قیمت مناسب.',
  },
  {
    id: 'virtual-account', active: true, icon: '🆔', image: null,
    title: 'ساخت اکونت مجازی تلگرام و واتساپ', subtitle: 'هماهنگی سریع از طریق تلگرام',
    link: '', // handled specially in the UI (opens the virtual-account info popup instead of a link)
    benefits: 'اگه به یک شماره‌ی مجازی برای ساخت اکانت تلگرام/واتساپ دوم نیاز داری (بدون سیم‌کارت واقعی)، این خدمت کمکت می‌کنه به‌صورت امن و سریع اکانت جدید بسازی — مناسب برای حفظ حریم خصوصی یا مدیریت چند اکانت.',
  },
  {
    id: 'mastercard', active: true, icon: '💳', image: null,
    title: 'مسترکارت رایگان با ۷۰ یورو بانوس', subtitle: 'با کد من فعال کن و بانوس بگیر (ساکنین اروپا)',
    link: 'https://refer.gebuhrenfrei.com/NRYtNf',
    benefits: 'این مسترکارت مجازی/فیزیکی کاملاً رایگانه و برای خریدهای آنلاین بین‌المللی عالیه. با ثبت‌نام از لینک من، هم خودت و هم من یک پاداش نقدی (تا ۷۰ یورو) می‌گیریم — بدون هزینه‌ی پنهان.',
  },
  {
    id: 'temu', active: true, icon: '🛍️', image: null,
    title: 'خرید از Temu با تخفیف ویژه', subtitle: 'با این لینک وارد شو و از تخفیف‌های Temu لذت ببر',
    link: 'https://temu.to/k/ejjr78foalq',
    benefits: 'Temu یکی از بزرگ‌ترین فروشگاه‌های آنلاین با قیمت‌های شگفت‌انگیزه. با ثبت‌نام از لینک من، کد تخفیف ویژه و کوپن‌های رایگان برای اولین خریدت می‌گیری.',
  },
  {
    id: 'send-credit', active: true, icon: '📲', image: null,
    title: 'ارسال کردیت به افغانستان', subtitle: 'شارژ سریع و مطمئن برای خانواده و دوستان',
    link: 'https://reb.tel/jYdPvX',
    benefits: 'می‌تونی از هر جای دنیا، در چند ثانیه، برای عزیزانت در افغانستان شارژ موبایل بفرستی — بدون نیاز به واسطه یا معطلی، با نرخ منصفانه و پشتیبانی مطمئن.',
  },
  {
    id: 'tiktok-coin', active: true, icon: '🎵', image: null,
    title: 'خرید ارزان کوین تیک‌تاک', subtitle: 'مستقیم از اپلیکیشن رسمی TikTok با تخفیف',
    link: 'https://www.tiktok.com/coin?rc=WEGQH5E3&rie=',
    benefits: 'با خرید مستقیم از اپ رسمی TikTok (از طریق این لینک)، می‌تونی کوین بخری و برای استریمرهای مورد علاقه‌ت گیفت بفرستی، با قیمت بهتر نسبت به روش‌های معمول.',
  },
  {
    id: 'revolut', active: true, icon: '💳', image: null,
    title: 'کارت اعتباری بین‌المللی Revolut', subtitle: 'افتتاح حساب رایگان + کارت مجازی برای خرید و پرداخت بین‌المللی',
    link: 'https://revolut.com/referral/?referral-code=m_afg!JUL1-26-VR-LT-SAME&geo-redirect',
    benefits: 'با لینک من ثبت‌نام کن و پاداش بگیر. بدون کارمزد پنهان، مناسب خرید و شارژ آنلاین بین‌المللی، تبدیل ارز آنی و کارت مجازی رایگان برای خریدهای امن‌تر.',
  },
  {
    id: 'c24', active: true, icon: '🏦', image: null,
    title: 'کارت بانکی رایگان C24', subtitle: 'افتتاح حساب آلمانی، کاملاً رایگان و آنلاین',
    link: 'https://s.c24.de/C3lEy7aQJu/',
    benefits: 'همین حالا با لینک من شروع کن. افتتاح حساب بانکی آلمانی بدون نیاز به حضور فیزیکی، کارمزد پایین، و کارت بانکی رایگان برای استفاده‌ی روزمره.',
  },
  {
    id: 'coinbase', active: true, icon: '🪙', image: null,
    title: 'صرافی معتبر Coinbase', subtitle: 'خرید و فروش امن ارز دیجیتال با یکی از بزرگ‌ترین صرافی‌های دنیا',
    link: 'https://coinbase.com/join/QR5TJ5Z?src=ios-link',
    benefits: 'با ثبت‌نام از لینک من پاداش خوش‌آمد بگیر. یکی از امن‌ترین و معتبرترین صرافی‌های دنیا برای خرید، فروش و نگهداری ارز دیجیتال.',
  },
  {
    id: 'crypto-com', active: true, icon: '💎', image: null,
    title: 'اپلیکیشن Crypto.com', subtitle: 'خرید، نگهداری و کارت اختصاصی ارز دیجیتال، همه در یک اپ',
    link: 'https://crypto.com/app/mxf7maq5je',
    benefits: 'با لینک من عضو شو و از مزایای ویژه بهره‌مند شو. کارت اختصاصی کریپتو، بازگشت وجه روی خریدها، و مدیریت آسان دارایی‌های دیجیتال در یک اپلیکیشن.',
  },
  {
    id: 'hesabpay', active: true, icon: '💜', image: null,
    title: 'به هرکسی، هرجا، هر زمان پول بفرست با HesabPay', subtitle: 'همین حالا نصب کن و به دنیای پرداخت بدون مرز بپیوند',
    link: 'https://app.hesab.com/#/referral?phone=499364035675',
    benefits: 'با اپلیکیشن HesabPay می‌تونی به هر کسی، هر جای دنیا، در هر زمان، به سادگی و سرعت پول بفرستی یا دریافت کنی — بدون کارمزدهای سنگین بانکی و بدون پیچیدگی. همین حالا از لینک من عضو شو و از مزایای ویژه‌ی دعوت بهره‌مند شو.',
  },
];

exports.handler = async function(event) {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  if (event.httpMethod === 'GET') {
    try {
      const list = await offersStore().get('list', { type: 'json' });
      // If the store already has data from before a default was added, merge
      // in whichever defaults are missing by id instead of only falling
      // back to DEFAULT_OFFERS on a completely empty store.
      const merged = list
        ? list.concat(DEFAULT_OFFERS.filter(d => !list.some(o => o.id === d.id)))
        : DEFAULT_OFFERS;
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, offers: merged }) };
    } catch(e) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error', details: e.message }) };
    }
  }

  if (event.httpMethod === 'POST') {
    let body;
    try { body = JSON.parse(event.body); }
    catch(e) { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

    const { token, offers } = body;
    if (!(await verifyAdminSession(token))) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    if (!Array.isArray(offers)) return { statusCode: 400, headers, body: JSON.stringify({ error: 'offers array required' }) };

    try {
      await offersStore().setJSON('list', offers);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    } catch(e) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error', details: e.message }) };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
};
