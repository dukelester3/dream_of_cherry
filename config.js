// 後台密碼（部署前請修改，勿提交真實密碼至 Git）
var ADMIN_PASSWORD = '@fan123456F';

// Gemini API（用於後台一鍵翻譯，至 https://aistudio.google.com/ 取得 API Key）
var GEMINI_API_KEY = 'gen-lang-client-0879457781';

// ── 瀏覽人次（CountAPI，免註冊）：首頁載入時計一次，後台側欄顯示累計
// namespace / key 請改成與他人不重複的英數與底線（勿空格）
var VISITOR_COUNT_NAMESPACE = 'yuyu_dream_of_cherry';
var VISITOR_COUNT_KEY = 'front_page_pv_v1';
// 後台預覽 ?preview=1 是否也算一次（通常 false，避免自己測試灌流量）
var VISITOR_COUNT_INCLUDE_PREVIEW = false;
// true = 同一分頁工作階段只計一次（較接近「造訪」而非每次重新整理）
var VISITOR_COUNT_ONCE_PER_SESSION = false;
// 若 CountAPI 無法讀取，可改為自架統計網址（GET 回 JSON，須 CORS，例如 {"value":12345}）
// var VISITOR_COUNT_STATS_URL = 'https://你的網域/stats.json';
