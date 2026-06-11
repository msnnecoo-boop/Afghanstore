exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { playerName, uid, amount, price, orderId } = JSON.parse(event.body);
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  const message = `🎮 سفارش جدید!\n\n👤 بازیکن: ${playerName}\n🆔 UID: ${uid}\n💎 مقدار: ${amount}\n💰 قیمت: ${price}\n📋 شماره: ${orderId}`;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message })
  });

  return { statusCode: 200, body: "OK" };
};
