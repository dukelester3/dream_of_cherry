// 後台密碼（部署前請修改，勿提交真實密碼至 Git）
var ADMIN_PASSWORD = '@fan123456F';

// true（預設）= 已設 GitHub Token 時，每次登入後台會自動從遠端拉最新 data.js（以 GitHub 為準）。改 false 則只用本機快取／目前載入的 data.js
var ADMIN_AUTO_SYNC_GITHUB_ON_LOGIN = true;

// Gemini API（用於後台一鍵翻譯，至 https://aistudio.google.com/ 取得 API Key）
var GEMINI_API_KEY = 'gen-lang-client-0879457781';

// ── 瀏覽人次（自動累計，擇一設定）──────────────────────────
//
// 【推薦 A】Supabase 免費專案：在 SQL Editor 執行 scripts/supabase-page-views.sql 一次，
// 再取消下面註解並貼上專案網址與 anon public key（Settings → API）：
// var SUPABASE_URL = 'https://xxxx.supabase.co';
// var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
//
// 【推薦 B】Cloudflare Workers + KV：部署專案內 worker/ 後填：
// var VISITOR_COUNTER_WORKER_BASE = 'https://你的程式.workers.dev';
//
// 或自架 HTTPS 統計網址（GET 回 JSON、允許 CORS）：{"value":12345}
// var VISITOR_COUNT_STATS_URL = 'https://...';
//
// 舊 CountAPI 若有累計，不一定能讀回；可在本機執行：node scripts/fetch-legacy-countapi.mjs
//
var VISITOR_COUNT_NAMESPACE = 'yuyu_dream_of_cherry';
var VISITOR_COUNT_KEY = 'front_page_pv_v1';
// 後台預覽 ?preview=1 是否也算一次（通常 false，避免自己測試灌流量）
var VISITOR_COUNT_INCLUDE_PREVIEW = false;
// true = 同一分頁工作階段只計一次（較接近「造訪」而非每次重新整理）
var VISITOR_COUNT_ONCE_PER_SESSION = false;
