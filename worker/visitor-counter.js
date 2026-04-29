/**
 * Cloudflare Worker：瀏覽人次累計（需綁定 KV）
 *
 * 1) npm i -g wrangler && wrangler login
 * 2) wrangler kv:namespace create VISITOR_KV
 * 3) 複製 wrangler.toml.example 為 wrangler.toml，填入 kv id
 * 4) wrangler deploy
 * 5) config.js 設定 VISITOR_COUNTER_WORKER_BASE = 'https://你的子網域.workers.dev'
 */
export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    const path = new URL(request.url).pathname;
    if (path === '/get') {
      const raw = await env.VISITOR_KV.get('n');
      const n = parseInt(raw, 10) || 0;
      return new Response(JSON.stringify({ value: n }), {
        headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' },
      });
    }
    if (path === '/hit') {
      let n = parseInt(await env.VISITOR_KV.get('n'), 10) || 0;
      n += 1;
      await env.VISITOR_KV.put('n', String(n));
      return new Response(JSON.stringify({ value: n }), {
        headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' },
      });
    }
    return new Response(JSON.stringify({ ok: true, paths: ['/hit', '/get'] }), {
      headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' },
    });
  },
};
