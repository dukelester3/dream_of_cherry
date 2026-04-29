/**
 * 網站瀏覽人次：首頁以 Image 請求 CountAPI hit（不受讀取端 CORS 限制），
 * 後台以 fetch 讀取 get。可自行在 config.js 改 namespace/key 或改 VISITOR_COUNT_STATS_URL。
 */
(function () {
  function visitorCountParts() {
    var ns =
      typeof VISITOR_COUNT_NAMESPACE !== 'undefined' && VISITOR_COUNT_NAMESPACE
        ? String(VISITOR_COUNT_NAMESPACE).trim()
        : 'yuyu_dream_of_cherry';
    var key =
      typeof VISITOR_COUNT_KEY !== 'undefined' && VISITOR_COUNT_KEY
        ? String(VISITOR_COUNT_KEY).trim()
        : 'front_page_pv_v1';
    return { ns: ns, key: key };
  }

  window.recordYuyuPageVisit = function recordYuyuPageVisit() {
    if (location.protocol === 'file:') return;
    var includePreview =
      typeof VISITOR_COUNT_INCLUDE_PREVIEW !== 'undefined' && VISITOR_COUNT_INCLUDE_PREVIEW;
    if (!includePreview && new URLSearchParams(location.search).get('preview') === '1') return;
    var once =
      typeof VISITOR_COUNT_ONCE_PER_SESSION !== 'undefined' && VISITOR_COUNT_ONCE_PER_SESSION;
    if (once) {
      try {
        if (sessionStorage.getItem('yuyu_pv_recorded') === '1') return;
        sessionStorage.setItem('yuyu_pv_recorded', '1');
      } catch (e) {}
    }
    var p = visitorCountParts();
    var url =
      'https://api.countapi.xyz/hit/' + encodeURIComponent(p.ns) + '/' + encodeURIComponent(p.key);
    var img = new Image();
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer-when-downgrade';
    img.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + '_=' + Date.now();
  };

  window.fetchYuyuVisitorCount = async function fetchYuyuVisitorCount() {
    var custom = typeof VISITOR_COUNT_STATS_URL !== 'undefined' && VISITOR_COUNT_STATS_URL;
    if (custom) {
      var res = await fetch(String(custom).trim(), { cache: 'no-store' });
      if (!res.ok) throw new Error('stats url');
      var j = await res.json();
      var v = j.value != null ? j.value : j.count;
      if (v == null) throw new Error('no value');
      return Number(v);
    }
    var p = visitorCountParts();
    var res2 = await fetch(
      'https://api.countapi.xyz/get/' + encodeURIComponent(p.ns) + '/' + encodeURIComponent(p.key),
      { cache: 'no-store' }
    );
    if (!res2.ok) throw new Error('countapi');
    var j2 = await res2.json();
    if (j2.value == null) throw new Error('noval');
    return Number(j2.value);
  };

  window.refreshAdminVisitorStatsDisplay = async function refreshAdminVisitorStatsDisplay() {
    var el = document.getElementById('admin-visitor-stats-value');
    var hint = document.getElementById('admin-visitor-stats-hint');
    if (!el) return;
    el.textContent = '載入中…';
    if (hint) hint.textContent = '';
    try {
      var n = await window.fetchYuyuVisitorCount();
      el.textContent = Number.isFinite(n) ? n.toLocaleString('zh-TW') : '—';
    } catch (e) {
      el.textContent = '無法載入';
      if (hint) {
        hint.textContent =
          '請檢查網路後按 ↻。若服務無法連線，可在 config.js 設定 VISITOR_COUNT_STATS_URL（須回傳 JSON 並允許 CORS，例如 {"value":123}）。';
      }
    }
  };
})();
