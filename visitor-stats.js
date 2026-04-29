/**
 * 瀏覽人次（自動累計，不需手動改檔）
 *
 * 優先順序（讀取）：
 * 1) VISITOR_COUNT_STATS_URL
 * 2) Supabase（config：SUPABASE_URL + SUPABASE_ANON_KEY，執行 scripts/supabase-page-views.sql）
 * 3) Cloudflare Worker（VISITOR_COUNTER_WORKER_BASE）
 * 4) CountAPI + 代理（常失效）
 * 5) visitor-count.json（僅備援）
 *
 * 計次（首頁載入）：Supabase RPC → Worker /hit → CountAPI（同上順位，略過 STATS_URL）
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

  function supabaseConfig() {
    var url =
      typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL
        ? String(SUPABASE_URL).trim().replace(/\/+$/, '')
        : '';
    var key =
      typeof SUPABASE_ANON_KEY !== 'undefined' && SUPABASE_ANON_KEY
        ? String(SUPABASE_ANON_KEY).trim()
        : '';
    if (!url || !key) return null;
    return { url: url, key: key };
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

  function sameOriginStaticCountUrl() {
    try {
      return new URL('../visitor-count.json', location.href).href;
    } catch (e) {
      return null;
    }
  }

  async function supabaseGetCount(cfg) {
    var res = await fetch(
      cfg.url + '/rest/v1/page_views?select=visits&id=eq.main',
      {
        headers: {
          apikey: cfg.key,
          Authorization: 'Bearer ' + cfg.key,
        },
        cache: 'no-store',
      }
    );
    if (!res.ok) throw new Error('supabase get');
    var rows = await res.json();
    if (!Array.isArray(rows) || !rows.length) throw new Error('no row');
    var n = Number(rows[0].visits);
    if (!Number.isFinite(n)) throw new Error('bad visits');
    return n;
  }

  function supabaseIncrementVisit(cfg) {
    fetch(cfg.url + '/rest/v1/rpc/increment_page_views', {
      method: 'POST',
      headers: {
        apikey: cfg.key,
        Authorization: 'Bearer ' + cfg.key,
        'Content-Type': 'application/json',
      },
      body: '{}',
      cache: 'no-store',
    }).catch(function () {});
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

    var sb = supabaseConfig();
    if (sb) {
      supabaseIncrementVisit(sb);
      return;
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

    var sb = supabaseConfig();
    if (sb) {
      window._lastVisitorCountSource = 'supabase';
      return supabaseGetCount(sb);
    }

    var wb = workerBase();
    if (wb) {
      var txtW = await fetchJsonText(wb + '/get');
      window._lastVisitorCountSource = 'worker';
      return parseCountJson(JSON.parse(txtW));
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

    var staticU = sameOriginStaticCountUrl();
    if (staticU) {
      try {
        var txtS = await fetchJsonText(staticU);
        window._lastVisitorCountSource = 'static';
        return parseCountJson(JSON.parse(txtS));
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
      if (hint) {
        if (src === 'static') {
          hint.textContent =
            '此為備援靜態檔，不會自動增加。請在 config.js 設定 Supabase（見 scripts/supabase-page-views.sql）或 VISITOR_COUNTER_WORKER_BASE。';
        } else if (src === 'countapi') {
          hint.textContent = '來源：舊版 CountAPI（建議改為 Supabase 或 Worker 較穩定）。';
        }
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
            '無法連線讀取最新數字（顯示快取）。請在 config.js 設定 SUPABASE_URL + SUPABASE_ANON_KEY，或 VISITOR_COUNTER_WORKER_BASE。';
        }
        return;
      }
      el.textContent = '無法載入';
      if (hint) {
        hint.textContent =
          '請在 config.js 設定 Supabase（執行 scripts/supabase-page-views.sql 後填 URL 與 Anon Key）或 Cloudflare Worker。舊 CountAPI 紀錄可執行：node scripts/fetch-legacy-countapi.mjs 嘗試匯出種子。';
      }
    }
  };
})();
