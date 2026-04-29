/**
 * 瀏覽人次（優先順序）
 * 1) config VISITOR_COUNT_STATS_URL（自架 JSON，须 CORS）
 * 2) config VISITOR_COUNTER_WORKER_BASE（Cloudflare Worker，见 worker/）
 * 3) 同網域 visitor-count.json（僅顯示，須手動改檔或發布）
 * 4) CountAPI + 公開代理（常失效，僅作保留）
 */
(function () {
  var CACHE_KEY = 'yuyu_visitor_count_cache';
  window._lastVisitorCountSource = null;

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

  function workerBase() {
    if (typeof VISITOR_COUNTER_WORKER_BASE === 'undefined' || !VISITOR_COUNTER_WORKER_BASE)
      return '';
    return String(VISITOR_COUNTER_WORKER_BASE).replace(/\/+$/, '');
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

  /** 後台頁面根目錄的 visitor-count.json（與 admin 同站時必載入成功） */
  function sameOriginStaticCountUrl() {
    try {
      return new URL('../visitor-count.json', location.href).href;
    } catch (e) {
      return null;
    }
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
    var base = workerBase();
    if (base) {
      fetch(base + '/hit', { method: 'GET', cache: 'no-store', mode: 'cors' }).catch(
        function () {}
      );
      return;
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
    window._lastVisitorCountSource = null;

    var custom = typeof VISITOR_COUNT_STATS_URL !== 'undefined' && VISITOR_COUNT_STATS_URL;
    if (custom) {
      var txt0 = await fetchJsonText(String(custom).trim());
      window._lastVisitorCountSource = 'custom';
      return parseCountJson(JSON.parse(txt0));
    }

    var wb = workerBase();
    if (wb) {
      var txtW = await fetchJsonText(wb + '/get');
      window._lastVisitorCountSource = 'worker';
      return parseCountJson(JSON.parse(txtW));
    }

    var staticU = sameOriginStaticCountUrl();
    if (staticU) {
      try {
        var txtS = await fetchJsonText(staticU);
        window._lastVisitorCountSource = 'static';
        return parseCountJson(JSON.parse(txtS));
      } catch (e) {
        /* fall through */
      }
    }

    var p = visitorCountParts();
    var getUrl = countApiGetUrl(p);
    var candidates = [getUrl, proxyAllOrigins(getUrl), proxyCorsIo(getUrl)];
    var lastErr;
    for (var i = 0; i < candidates.length; i++) {
      try {
        var t = await fetchJsonText(candidates[i]);
        window._lastVisitorCountSource = 'countapi';
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
      var src = window._lastVisitorCountSource;
      if (hint && src === 'static') {
        hint.textContent =
          '此數字來自網站根目錄 visitor-count.json（可手動編輯後發布）。自動累計請部署 worker/ 並在 config.js 設定 VISITOR_COUNTER_WORKER_BASE。';
      }
    } catch (e) {
      var cached = null;
      try {
        cached = localStorage.getItem(CACHE_KEY);
      } catch (err) {}
      if (cached != null && cached !== '' && Number.isFinite(Number(cached))) {
        el.textContent = Number(cached).toLocaleString('zh-TW');
        if (hint) {
          hint.textContent =
            '無法連線讀取最新數字，顯示上次快取。請確認已部署 visitor-count.json，或設定 VISITOR_COUNTER_WORKER_BASE。';
        }
        return;
      }
      el.textContent = '無法載入';
      if (hint) {
        hint.textContent =
          '請確認同網域已有 visitor-count.json，並已隨網站一併部署。自動計次請設定 VISITOR_COUNTER_WORKER_BASE（見專案 worker/）或 VISITOR_COUNT_STATS_URL。';
      }
    }
  };
})();
