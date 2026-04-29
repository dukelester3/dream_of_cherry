/**
 * 網站瀏覽人次：CountAPI 的 get 常遭瀏覽器 CORS 擋下，故讀取時會先直連、再經公開代理。
 * 計次亦經代理，由代理伺服器對 CountAPI 發請求。可自訂 VISITOR_COUNT_STATS_URL（須 CORS + JSON）。
 */
(function () {
  var CACHE_KEY = 'yuyu_visitor_count_cache';

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

  function countApiHitUrl(p) {
    return (
      'https://api.countapi.xyz/hit/' + encodeURIComponent(p.ns) + '/' + encodeURIComponent(p.key)
    );
  }
  function countApiGetUrl(p) {
    return (
      'https://api.countapi.xyz/get/' + encodeURIComponent(p.ns) + '/' + encodeURIComponent(p.key)
    );
  }

  /** 公開 CORS 代理（依序嘗試） */
  function proxyAllOrigins(targetUrl) {
    return 'https://api.allorigins.win/raw?url=' + encodeURIComponent(targetUrl);
  }
  function proxyCorsIo(targetUrl) {
    return 'https://corsproxy.io/?' + encodeURIComponent(targetUrl);
  }

  function parseCountJson(j) {
    var v = j.value != null ? j.value : j.count;
    if (v == null) throw new Error('no value');
    var n = Number(v);
    if (!Number.isFinite(n)) throw new Error('nan');
    return n;
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
    var hit = countApiHitUrl(p);
    var proxied = proxyAllOrigins(hit) + (hit.indexOf('?') >= 0 ? '&' : '?') + '_t=' + Date.now();
    var img = new Image();
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer-when-downgrade';
    img.src = proxied;
  };

  async function fetchJsonText(url) {
    var res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('http');
    return res.text();
  }

  window.fetchYuyuVisitorCount = async function fetchYuyuVisitorCount() {
    var custom = typeof VISITOR_COUNT_STATS_URL !== 'undefined' && VISITOR_COUNT_STATS_URL;
    if (custom) {
      var txt = await fetchJsonText(String(custom).trim());
      return parseCountJson(JSON.parse(txt));
    }
    var p = visitorCountParts();
    var getUrl = countApiGetUrl(p);
    var candidates = [getUrl, proxyAllOrigins(getUrl), proxyCorsIo(getUrl)];
    var lastErr;
    for (var i = 0; i < candidates.length; i++) {
      try {
        var t = await fetchJsonText(candidates[i]);
        return parseCountJson(JSON.parse(t));
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error('fetch');
  };

  window.refreshAdminVisitorStatsDisplay = async function refreshAdminVisitorStatsDisplay() {
    var el = document.getElementById('admin-visitor-stats-value');
    var hint = document.getElementById('admin-visitor-stats-hint');
    if (!el) return;
    el.textContent = '載入中…';
    if (hint) hint.textContent = '';
    try {
      var n = await window.fetchYuyuVisitorCount();
      try {
        localStorage.setItem(CACHE_KEY, String(n));
      } catch (e) {}
      el.textContent = n.toLocaleString('zh-TW');
    } catch (e) {
      var cached = null;
      try {
        cached = localStorage.getItem(CACHE_KEY);
      } catch (err) {}
      if (cached != null && cached !== '' && Number.isFinite(Number(cached))) {
        el.textContent = Number(cached).toLocaleString('zh-TW');
        if (hint) {
          hint.textContent =
            '目前無法連線統計服務，顯示上次成功讀取的數字。可稍後按 ↻ 重試；若長期失敗請在 config.js 設定 VISITOR_COUNT_STATS_URL。';
        }
        return;
      }
      el.textContent = '無法載入';
      if (hint) {
        hint.textContent =
          '請檢查網路或稍後按 ↻。程式已改經代理讀取 CountAPI；若仍失敗，請在 config.js 設定 VISITOR_COUNT_STATS_URL（須回傳 JSON 並允許 CORS，例如 {"value":123}）。';
      }
    }
  };
})();
