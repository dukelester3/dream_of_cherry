#!/usr/bin/env node
/**
 * 嘗試從舊 CountAPI 讀取最後一次數字（若服務仍活著），可用來當新计数器的種子。
 * 用法：node scripts/fetch-legacy-countapi.mjs
 * 若成功，可到 Supabase SQL：update public.page_views set visits = 數字 where id = 'main';
 * 或 Cloudflare：npx wrangler kv key put n --binding=VISITOR_KV "數字"
 */
const ns = 'yuyu_dream_of_cherry';
const key = 'front_page_pv_v1';
const getUrl = `https://api.countapi.xyz/get/${encodeURIComponent(ns)}/${encodeURIComponent(key)}`;

async function main() {
  for (const [label, url] of [
    ['直連', getUrl],
    ['allorigins 代理', 'https://api.allorigins.win/raw?url=' + encodeURIComponent(getUrl)],
  ]) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(String(res.status));
      const txt = await res.text();
      const j = JSON.parse(txt);
      const v = j.value ?? j.count;
      if (v != null && Number.isFinite(Number(v))) {
        console.log(label + ' 成功：累計 =', v);
        console.log('\n種子寫入 Supabase（若已建表）：');
        console.log(`  update public.page_views set visits = ${v} where id = 'main';`);
        console.log('\n或 Cloudflare KV（鍵名 n）：');
        console.log(`  npx wrangler kv key put n --binding=VISITOR_KV "${v}"`);
        return;
      }
    } catch (e) {
      console.error(label + ' 失敗：', e.message || e);
    }
  }
  console.error('無法從 CountAPI 取得數字，舊紀錄可能已遺失；新方案將從 0 開始或可手動種子。');
  process.exit(1);
}

main();
