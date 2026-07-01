exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=43200' // cache 12 hours at the edge/browser
  };

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await res.json();

    if (data.result !== 'success') {
      throw new Error('FX provider error');
    }

    // open.er-api.com gives IRR's OFFICIAL government rate, which is far below
    // the real free-market rate that people actually use. We apply a multiplier
    // to approximate the free-market rate. Update IRR_MARKET_MULTIPLIER
    // occasionally if it drifts (check alanchand.com or bonbast.com for reference).
    const IRR_MARKET_MULTIPLIER = 38;

    // Small margin added on top of the raw rate (1-2%), so displayed local-currency
    // prices run slightly higher than the raw official/market rate. Adjust as needed.
    const MARKUP = 1.015; // 1.5%

    const rates = {
      AFN: Math.round(data.rates.AFN * MARKUP),
      EUR: Number((data.rates.EUR * MARKUP).toFixed(4)),
      IRR: Math.round(data.rates.IRR * IRR_MARKET_MULTIPLIER * MARKUP),
      updatedAt: data.time_last_update_utc || new Date().toISOString()
    };

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, rates }) };
  } catch (e) {
    // Fallback static rates if the live provider is unreachable
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: false,
        rates: { AFN: 64, EUR: 0.88, IRR: 1600000, updatedAt: null },
        error: e.message
      })
    };
  }
};
