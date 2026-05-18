// ── Preview：後台儲存後用 ?preview=1 可即時看變更 ──
(function() {
  const params = new URLSearchParams(location.search);
  if (params.get('preview') === '1' && typeof siteData !== 'undefined') {
    const saved = localStorage.getItem('yuyu_admin_data');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        Object.assign(siteData, data);
        if (data.pricing == null) delete siteData.pricing;
        if (data.pricingTiers == null) delete siteData.pricingTiers;
        if (data.pricingTransport == null) delete siteData.pricingTransport;
      } catch (e) {}
    }
  }
})();

// ── 收費梯次（後台以數字／區間儲存，可增刪列）──
const SSS_TIER = 's'.repeat(3);
const DEFAULT_PRICING_TIERS = {
  osaka: [
    { min: 35000, max: null, above: false, preset: 's' },
    { min: 45000, max: 60000, above: false, preset: 'ss' },
    { min: 65000, max: 85000, above: false, preset: SSS_TIER },
    { min: 90000, max: null, above: true, preset: 'svip' }
  ],
  tokyo: [
    { min: 30000, max: null, above: false, preset: 's' },
    { min: 40000, max: 60000, above: false, preset: 'ss' },
    { min: 70000, max: 80000, above: false, preset: SSS_TIER },
    { min: 90000, max: null, above: true, preset: 'svip' }
  ]
};

const PRESET_TIER_I18N = {
  s: 'pricing.tier.s',
  ss: 'pricing.tier.ss',
  sss: 'pricing.tier.sss',
  svip: 'pricing.tier.svip'
};

const TIER_ROW_ICONS = ['🥉', '🥈', '🥇', '💎'];

function normalizePricingPreset(p) {
  if (!p || p === 'custom') return 'custom';
  if (PRESET_TIER_I18N[p]) return p;
  return 'custom';
}

function tierCssFromPreset(preset) {
  const p = normalizePricingPreset(preset);
  if (p === 's') return 'tier-s';
  if (p === 'ss') return 'tier-ss';
  if (p === 'sss') return 'tier-sss';
  if (p === 'svip') return 'tier-svip';
  return 'tier-custom';
}

function formatTierYenAmount(lang, min, max) {
  const loc = lang === 'en' ? 'en-US' : 'ja-JP';
  const fmt = (n) => Number(n).toLocaleString(loc);
  const lo = Number(min);
  const hi = max == null || max === '' ? null : Number(max);
  if (hi == null || !Number.isFinite(hi) || hi === lo) return fmt(lo);
  const sep = lang === 'en' ? '–' : '～';
  return `${fmt(lo)}${sep}${fmt(hi)}`;
}

function tierRowLabel(lang, row) {
  const preset = normalizePricingPreset(row.preset);
  if (preset !== 'custom' && PRESET_TIER_I18N[preset]) {
    const k = PRESET_TIER_I18N[preset];
    return (typeof tLang === 'function' ? tLang(lang, k) : translations[lang]?.[k]) || '';
  }
  const zh = row.titleZh || '';
  const ja = row.titleJa || '';
  const en = row.titleEn || '';
  if (lang === 'ja') return ja || zh || en || '—';
  if (lang === 'en') return en || zh || ja || '—';
  return zh || ja || en || '—';
}

function getEffectivePricingTiers(city) {
  const def = DEFAULT_PRICING_TIERS[city] || [];
  const raw = typeof siteData !== 'undefined' ? siteData.pricingTiers?.[city] : null;
  if (Array.isArray(raw) && raw.length > 0) return raw;
  return def;
}

function renderPricingTiers(lang) {
  if (typeof translations === 'undefined') return;
  ['osaka', 'tokyo'].forEach((city) => {
    const el = document.getElementById('pricing-tiers-' + city);
    if (!el) return;
    const list = getEffectivePricingTiers(city);
    const yen = tLang(lang, 'pricing.yen') || '';
    const aboveW = tLang(lang, 'pricing.above') || '';
    el.innerHTML = list
      .map((row, i) => {
        const amountText = formatTierYenAmount(lang, row.min, row.max);
        const aboveHtml = row.above
          ? ` <span class="pricing-tier-above">${aboveW.replace(/</g, '&lt;')}</span>`
          : '';
        const tierClass = tierCssFromPreset(row.preset);
        const icon = TIER_ROW_ICONS[i] || '◆';
        const name = String(tierRowLabel(lang, row)).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const yenEsc = String(yen).replace(/</g, '&lt;');
        return `<div class="pricing-tier ${tierClass}"><div class="tier-header"><span class="tier-icon">${icon}</span><span class="tier-name">${name}</span></div><div class="tier-price"><span class="pricing-tier-amount">${amountText}</span> <span data-i18n="pricing.yen">${yenEsc}</span>${aboveHtml}</div></div>`;
      })
      .join('');
    el.querySelectorAll('[data-i18n]').forEach((node) => {
      const key = node.getAttribute('data-i18n');
      const text = tLang(lang, key);
      if (text != null && text !== '') node.textContent = text;
    });
  });
}

// ── 交通費：大阪／東京皆為 [{ fee, areas: [areaId…] }]；可選 id 見 transport-areas.js（PRICING_TRANSPORT_AREA_IDS）──
const PRICING_TRANSPORT_AREA_IDS =
  typeof window !== 'undefined' && window.PRICING_TRANSPORT_AREA_IDS
    ? window.PRICING_TRANSPORT_AREA_IDS
    : { osaka: [], tokyo: [] };

/** 與 transport-areas.js 內 TRANSPORT_TOKYO_DEFAULT_PRICED_AREA_IDS 一致（未載入設定檔時回退） */
const TOKYO_DEFAULT_PRICED_FALLBACK = [
  'shinjuku', 'nakano', 'chiyoda', 'chuo', 'koto', 'shibuya', 'minato', 'meguro',
  'shinagawa', 'toshima', 'bunkyo', 'taito', 'sumida', 'arakawa', 'kita'
];

function tokyoDefaultPricedAreas() {
  if (typeof window !== 'undefined' && window.TRANSPORT_TOKYO_DEFAULT_PRICED_AREA_IDS && window.TRANSPORT_TOKYO_DEFAULT_PRICED_AREA_IDS.length) {
    return [...window.TRANSPORT_TOKYO_DEFAULT_PRICED_AREA_IDS];
  }
  return [...TOKYO_DEFAULT_PRICED_FALLBACK];
}

const DEFAULT_PRICING_TRANSPORT = {
  osaka: [
    {
      fee: 4000,
      areas: [
        'konohana', 'minato', 'taisho', 'nishi', 'abeno', 'fukushima', 'naniwa', 'tennoji', 'ikuno', 'kita', 'chuo',
        'higashinari', 'miyakojima', 'joto'
      ]
    },
    {
      fee: 6000,
      areas: [
        'nishiyodogawa', 'yodogawa', 'higashiyodogawa', 'asahi', 'tsurumi', 'suminoe', 'sumiyoshi', 'higashisumiyoshi',
        'hirano', 'higashiosaka'
      ]
    }
  ],
  tokyo: [
    {
      fee: 3000,
      areas: tokyoDefaultPricedAreas()
    }
  ]
};

function normalizeTransportTiersCity(city, rawValue) {
  const allowed = new Set(PRICING_TRANSPORT_AREA_IDS[city]);
  const def = DEFAULT_PRICING_TRANSPORT[city];
  let rows = rawValue;
  if (city === 'tokyo' && rows && typeof rows === 'object' && !Array.isArray(rows) && rows.fee != null) {
    const legacyAreas = tokyoDefaultPricedAreas();
    rows = [{ fee: rows.fee, areas: legacyAreas }];
  }
  if (!Array.isArray(rows) || !rows.length) return JSON.parse(JSON.stringify(def));
  const out = [];
  for (const row of rows) {
    let areas = [];
    if (Array.isArray(row.areas)) {
      areas = [...new Set(row.areas.filter((a) => allowed.has(a)))];
    } else if (row.areasZh != null || row.areasJa != null) {
      const match = def.find((t) => Number(t.fee) === Number(row.fee));
      areas = match ? [...match.areas] : [];
    }
    const fee = parseInt(row.fee, 10);
    out.push({ fee: Number.isFinite(fee) ? fee : 0, areas });
  }
  if (city === 'tokyo' && out.length === 1 && out[0].fee > 0 && (!out[0].areas || !out[0].areas.length)) {
    out[0].areas = tokyoDefaultPricedAreas();
  }
  return out.length ? out : JSON.parse(JSON.stringify(def));
}

function clonePricingTransport(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function getTransportServingSet(city) {
  const raw = typeof siteData !== 'undefined' ? siteData.pricingTransport : null;
  if (!raw || typeof raw !== 'object') return null;
  const key = city === 'osaka' ? 'osakaServingAreas' : 'tokyoServingAreas';
  if (!Object.prototype.hasOwnProperty.call(raw, key)) return null;
  const arr = raw[key];
  if (!Array.isArray(arr)) return null;
  const all = typeof PRICING_TRANSPORT_AREA_IDS !== 'undefined' ? (PRICING_TRANSPORT_AREA_IDS[city] || []) : [];
  return new Set(arr.filter((id) => all.includes(id)));
}

/** 首頁服務地區：依 pricingTransport.*ServingAreas 標示尚未開通之行政區（與後台一致） */
function refreshHomepageAreaServiceState(lang) {
  const legend = document.querySelector('.area-service-legend');
  let anyPending = false;
  document.querySelectorAll('.area-tags[data-area-city]').forEach((wrap) => {
    const city = wrap.getAttribute('data-area-city');
    if (city !== 'osaka' && city !== 'tokyo') return;
    const servingSet = getTransportServingSet(city);
    wrap.querySelectorAll('.area-tag[data-area]').forEach((el) => {
      const id = el.getAttribute('data-area');
      if (!id) return;
      if (servingSet == null) {
        el.classList.remove('area-tag--pending-service');
        el.removeAttribute('title');
        return;
      }
      if (servingSet.has(id)) {
        el.classList.remove('area-tag--pending-service');
        el.removeAttribute('title');
      } else {
        el.classList.add('area-tag--pending-service');
        const tip = tLang(lang, 'services.area.pendingTooltip');
        if (tip != null && String(tip).trim() !== '') el.setAttribute('title', String(tip));
        else el.removeAttribute('title');
        anyPending = true;
      }
    });
  });
  if (legend) {
    const leg = tLang(lang, 'services.area.legend');
    legend.textContent = leg != null && String(leg).trim() !== '' ? String(leg) : '';
    if (anyPending && legend.textContent) legend.removeAttribute('hidden');
    else legend.setAttribute('hidden', '');
  }
}

function getEffectivePricingTransport() {
  const raw = typeof siteData !== 'undefined' ? siteData.pricingTransport : null;
  if (!raw || typeof raw !== 'object') {
    return {
      osaka: clonePricingTransport(DEFAULT_PRICING_TRANSPORT.osaka),
      tokyo: clonePricingTransport(DEFAULT_PRICING_TRANSPORT.tokyo)
    };
  }
  return {
    osaka: normalizeTransportTiersCity('osaka', raw.osaka),
    tokyo: normalizeTransportTiersCity('tokyo', raw.tokyo)
  };
}

function formatTransportYenAmount(lang, n) {
  const loc = lang === 'en' ? 'en-US' : lang === 'ja' ? 'ja-JP' : 'zh-TW';
  return Number(n).toLocaleString(loc);
}

function transportFeeLineFromTemplate(lang, templateKey, amountNum) {
  const amt = formatTransportYenAmount(lang, amountNum);
  const tpl = typeof tLang === 'function' ? tLang(lang, templateKey) : translations[lang]?.[templateKey];
  if (tpl != null && String(tpl).includes('{amount}')) return String(tpl).replace(/\{amount\}/g, amt);
  const yen = typeof tLang === 'function' ? tLang(lang, 'pricing.yen') : '';
  if (lang === 'en') return 'Transport ' + amt + (yen ? ' ' + yen : ' JPY');
  if (lang === 'ja') return '交通費 ' + amt + '円';
  return '交通費 ' + amt + ' 日圓';
}

function formatTransportAreaList(lang, areaIds) {
  if (!areaIds || !areaIds.length) return '—';
  const sep = lang === 'en' ? ', ' : lang === 'ja' ? '・' : '｜';
  return areaIds
    .map((id) => {
      const key = 'area.' + id;
      const t = typeof tLang === 'function' ? tLang(lang, key) : translations[lang]?.[key];
      return String(t || id).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    })
    .join(sep);
}

function renderPricingTransport(lang) {
  if (typeof translations === 'undefined') return;
  const data = getEffectivePricingTransport();
  ['osaka', 'tokyo'].forEach((city) => {
    const el = document.getElementById('pricing-transport-' + city);
    if (!el) return;
    const tiers = data[city] || [];
    const servingSet = getTransportServingSet(city);
    el.innerHTML = tiers
      .map((z) => {
        const feeText = transportFeeLineFromTemplate(lang, 'pricing.transport.zoneLine', z.fee);
        let areaIds = z.areas || [];
        if (servingSet) areaIds = areaIds.filter((a) => servingSet.has(a));
        const areas = formatTransportAreaList(lang, areaIds);
        const feeEsc = String(feeText).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<div class="pricing-zone"><span class="pricing-zone-fee">${feeEsc}</span><span class="pricing-areas-list">${areas}</span></div>`;
      })
      .join('');
  });
}

// ── Theme (Dark / Light) ──
const THEME_KEY = 'yuyu-theme';
let currentOpenDiaryId = null;

function setTheme(theme) {
  const next = theme || (document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(THEME_KEY, next);
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  document.documentElement.setAttribute('data-theme', saved === 'light' ? 'light' : 'dark');
}

initTheme();
document.getElementById('theme-toggle')?.addEventListener('click', () => setTheme());
document.getElementById('sidebar-theme-toggle')?.addEventListener('click', () => {
  setTheme();
  closeSidebar();
});

// ── Admin Login (點擊右上角 夜桜の夢 開啟) ──
// config.js 已宣告 ADMIN_PASSWORD，此處僅讀取
const ADMIN_PWD = (typeof ADMIN_PASSWORD !== 'undefined' ? ADMIN_PASSWORD : 'CHANGE_ME');
const ADMIN_AUTH_KEY = 'yuyu_admin_auth';

function openAdminLoginModal() {
  document.getElementById('admin-login-modal')?.classList.add('open');
  document.getElementById('admin-login-pwd')?.focus();
  document.body.style.overflow = 'hidden';
}
function closeAdminLoginModal() {
  document.getElementById('admin-login-modal')?.classList.remove('open');
  const pwdEl = document.getElementById('admin-login-pwd');
  const errEl = document.getElementById('admin-login-error');
  const toggleBtn = document.getElementById('admin-pwd-toggle');
  if (pwdEl) { pwdEl.value = ''; pwdEl.type = 'password'; }
  if (errEl) errEl.textContent = '';
  if (toggleBtn) { toggleBtn.textContent = '顯示'; toggleBtn.title = toggleBtn.ariaLabel = '顯示密碼'; }
  document.body.style.overflow = '';
}
function doAdminLogin() {
  const pwd = document.getElementById('admin-login-pwd')?.value;
  const errEl = document.getElementById('admin-login-error');
  if (pwd === ADMIN_PWD) {
    const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('yuyu_auth_token', token);
    closeAdminLoginModal();
    window.location.href = 'admin/?_auth=' + encodeURIComponent(token);
  } else {
    errEl.textContent = '密碼錯誤，請重試';
    document.getElementById('admin-login-pwd').value = '';
  }
}

document.getElementById('admin-login-trigger')?.addEventListener('click', (e) => { e.preventDefault(); openAdminLoginModal(); });
document.getElementById('sidebar-admin-login-trigger')?.addEventListener('click', (e) => {
  e.preventDefault();
  openAdminLoginModal();
  closeSidebar();
});
document.getElementById('admin-login-overlay')?.addEventListener('click', closeAdminLoginModal);
document.getElementById('admin-login-close')?.addEventListener('click', closeAdminLoginModal);
document.getElementById('admin-login-btn')?.addEventListener('click', doAdminLogin);
document.getElementById('admin-login-pwd')?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') doAdminLogin();
});
document.getElementById('admin-pwd-toggle')?.addEventListener('click', () => {
  const input = document.getElementById('admin-login-pwd');
  const btn = document.getElementById('admin-pwd-toggle');
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '隱藏';
    btn.title = btn.ariaLabel = '隱藏密碼';
  } else {
    input.type = 'password';
    btn.textContent = '顯示';
    btn.title = btn.ariaLabel = '顯示密碼';
  }
});

// ── Language Switch ──
const allLangButtons = document.querySelectorAll('[data-lang]');

function tLang(lang, key) {
  if (typeof translations === 'undefined') return undefined;
  const pack = (typeof siteData !== 'undefined' && siteData.pricing && siteData.pricing[lang]) ? siteData.pricing[lang] : null;
  if (pack && pack[key] != null && String(pack[key]).trim() !== '') return pack[key];
  return translations[lang]?.[key];
}

function setLanguage(lang, rerender) {
  if (typeof translations === 'undefined') return;
  document.documentElement.lang = lang === 'zh' ? 'zh-TW' : lang;
  document.body.classList.remove('lang-ja', 'lang-zh', 'lang-en');
  document.body.classList.add('lang-' + lang);

  allLangButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const text = tLang(lang, key);
    if (text != null && text !== '') el.textContent = text;
  });

  document.querySelectorAll('.area-tag[data-area]').forEach(el => {
    const key = 'area.' + el.getAttribute('data-area');
    if (translations[lang]?.[key]) el.textContent = translations[lang][key];
  });

  refreshHomepageAreaServiceState(lang);

  if (typeof renderPricingTiers === 'function') renderPricingTiers(lang);
  if (typeof renderPricingTransport === 'function') renderPricingTransport(lang);

  localStorage.setItem('yuyu-lang', lang);

  // 僅在用戶點擊切換語言時重新渲染（init 時不呼叫，避免 currentDiaryCat 未定義）
  const ageGateOpen = document.getElementById('age-gate-modal')?.classList.contains('open');
  if (rerender && typeof renderGallery === 'function' && !ageGateOpen) {
    renderGallery(lang);
    renderReviews(lang);
    renderDiary(lang);
    renderAbout(lang);
    if (currentOpenDiaryId) openDiaryModal(currentOpenDiaryId, lang);
  }
}

// ── Age gate (18+)：session 僅本次分頁；勾選「今日不再」則記到當日午夜前 ──
const AGE_GATE_DAY_KEY = 'yuyu_age_ok_date';
const AGE_GATE_SESSION_KEY = 'yuyu_age_ok_session';

function todayLocalYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function shouldShowAgeGate() {
  if (new URLSearchParams(location.search).get('skip_age_gate') === '1') return false;
  if (sessionStorage.getItem(AGE_GATE_SESSION_KEY) === '1') return false;
  if (localStorage.getItem(AGE_GATE_DAY_KEY) === todayLocalYmd()) return false;
  return true;
}

function openAgeGateModal() {
  const el = document.getElementById('age-gate-modal');
  if (!el) return;
  el.classList.add('open');
  el.setAttribute('aria-hidden', 'false');
  document.body.classList.add('age-gate-open');
  document.body.style.overflow = 'hidden';
}

function closeAgeGateModal() {
  const el = document.getElementById('age-gate-modal');
  if (!el) return;
  el.classList.remove('open');
  el.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('age-gate-open');
  document.body.style.overflow = '';
}

function initAgeGate() {
  if (!shouldShowAgeGate()) return;
  openAgeGateModal();
  document.getElementById('age-gate-exit')?.addEventListener('click', () => {
    window.location.href = 'https://www.google.com/';
  });
  document.getElementById('age-gate-enter')?.addEventListener('click', () => {
    const remember = document.getElementById('age-gate-remember')?.checked;
    if (remember) {
      localStorage.setItem(AGE_GATE_DAY_KEY, todayLocalYmd());
    } else {
      sessionStorage.setItem(AGE_GATE_SESSION_KEY, '1');
    }
    closeAgeGateModal();
    const lang = localStorage.getItem('yuyu-lang') || 'ja';
    setLanguage(lang, true);
  });
}

allLangButtons.forEach(btn => {
  btn.addEventListener('click', () => setLanguage(btn.dataset.lang, true));
});

// 語言優先順序：URL 參數 > 已儲存 > 瀏覽器語言 > 預設日文（永不預設英文）
function getInitialLang() {
  const urlLang = new URLSearchParams(location.search).get('lang');
  if (urlLang === 'ja' || urlLang === 'zh' || urlLang === 'en') return urlLang;
  const saved = localStorage.getItem('yuyu-lang');
  if (saved) return saved;
  const browser = (navigator.language || navigator.userLanguage || '').toLowerCase();
  if (browser.startsWith('zh')) return 'zh';
  if (browser.startsWith('ja')) return 'ja';
  return 'ja'; // 預設日文
}
const savedLang = getInitialLang();
setLanguage(savedLang, false);
initAgeGate();

// ── Sidebar ──
const hamburgerBtn = document.getElementById('nav-hamburger-btn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const sidebarClose = document.getElementById('sidebar-close');

function openSidebar() {
  sidebar.classList.add('open');
  sidebarOverlay.classList.add('open');
}
function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('open');
}

hamburgerBtn?.addEventListener('click', openSidebar);
sidebarClose?.addEventListener('click', closeSidebar);
sidebarOverlay?.addEventListener('click', closeSidebar);

sidebar?.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', closeSidebar);
});

// ── Video Float Character (桌面 hover 顯示；手機點擊切換) ──
document.getElementById('video-float-trigger')?.addEventListener('click', () => {
  document.getElementById('video-float')?.classList.toggle('expanded');
});

// ── Pricing Tab Switcher ──
document.querySelectorAll('.pricing-tab')?.forEach(tab => {
  tab.addEventListener('click', () => {
    const city = tab.getAttribute('data-city');
    document.querySelectorAll('.pricing-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.pricing-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('pricing-' + city)?.classList.add('active');
  });
});

// ── Gallery / News Tab Switcher ──
document.querySelectorAll('.section-tab')?.forEach(tab => {
  tab.addEventListener('click', () => {
    const targetId = tab.getAttribute('data-tab');

    document.querySelectorAll('.section-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

    tab.classList.add('active');
    document.getElementById(targetId)?.classList.add('active');
  });
});

// ── Scroll Spy ──
const spySections = ['services', 'pricing', 'booking', 'gallery', 'reviews'];
const navLinks = document.querySelectorAll('.nav-center-link');

const spyObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
      });
    }
  });
}, { rootMargin: '-40% 0px -50% 0px' });

spySections.forEach(id => {
  const el = document.getElementById(id);
  if (el) spyObserver.observe(el);
});

// ── Render About from siteData ──
function renderAbout(lang) {
  if (typeof siteData === 'undefined' || !siteData.about) return;
  const a = siteData.about;
  const photos = a.photos || [];
  const order = [0, 2, 1, 3];
  order.forEach((photoIdx, domIdx) => {
    const img = document.getElementById('about-img-' + domIdx);
    const url = photos[photoIdx];
    if (img && url) img.src = resolveImgUrl(url);
  });
  const p1 = lang === 'zh' ? a.p1Zh : lang === 'en' ? a.p1En : a.p1Ja;
  const p2 = lang === 'zh' ? a.p2Zh : lang === 'en' ? a.p2En : a.p2Ja;
  if (document.getElementById('about-p1') && p1) document.getElementById('about-p1').textContent = p1;
  if (document.getElementById('about-p2') && p2) document.getElementById('about-p2').textContent = p2;
}

// ── 圖片路徑解析（確保 GitHub Pages 正確載入）──
function resolveImgUrl(url) {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  const base = location.pathname.includes('dream_of_cherry')
    ? location.origin + '/dream_of_cherry/'
    : location.origin + '/';
  return base + (url.startsWith('./') ? url.slice(2) : url);
}

// ── 輪播：點擊切換下一張，自動播放保留 ──
const CAROUSEL_INTERVAL_MS = 6000;

function setupCarousel(carousel) {
  const imgs = carousel.querySelectorAll('.diary-thumb-img, .card-img, .diary-modal-carousel-img');
  if (imgs.length < 2) return;
  carousel.classList.add('carousel-js');
  let idx = 0;
  let timer = null;

  function show(i) {
    idx = ((i % imgs.length) + imgs.length) % imgs.length;
    imgs.forEach((img, j) => { img.style.opacity = j === idx ? '1' : '0'; });
  }

  function advance() {
    show(idx + 1);
    if (timer) clearInterval(timer);
    timer = setInterval(advance, CAROUSEL_INTERVAL_MS);
  }

  show(0);
  timer = setInterval(advance, CAROUSEL_INTERVAL_MS);
  carousel.addEventListener('click', (e) => {
    if (e.target.matches('.diary-thumb-img, .card-img, .diary-modal-carousel-img')) advance();
  });
}

// ── Render Gallery from siteData ──
function renderGallery(lang) {
  const grid = document.getElementById('gallery-grid-dynamic');
  if (!grid || typeof siteData === 'undefined') return;
  const girls = siteData.girls.filter(g => g.active).sort((a,b) => a.order - b.order);
  grid.innerHTML = girls.map(g => {
    const name = lang === 'zh' ? g.nameZh : lang === 'en' ? g.nameEn : g.name;
    const badge = lang === 'zh' ? g.badgeZh : lang === 'en' ? g.badgeEn : g.badge;
    const types = lang === 'zh' ? g.typesZh : lang === 'en' ? g.typesEn : g.types;
    const statHeight = lang === 'ja' ? '身長' : lang === 'zh' ? '身高' : 'Height';
    const statAge = lang === 'ja' ? '年齡' : lang === 'zh' ? '年齡' : 'Age';
    const statCup = lang === 'ja' ? 'カップ数' : lang === 'zh' ? '罩杯' : 'Cup';
    const statWeight = lang === 'ja' ? '体重' : lang === 'zh' ? '體重' : 'Weight';
    const ageUnit = lang === 'ja' ? '歳' : lang === 'zh' ? '歲' : 'yo';
    const imgs = g.images?.length ? g.images : (g.image ? [g.image] : []);
    const cardImgHtml = imgs.length >= 2
      ? `<div class="card-img-wrap card-img-carousel card-img-n${imgs.length}">
          ${imgs.map(url => `<img src="${resolveImgUrl(url)}" alt="${name}" class="card-img" loading="lazy">`).join('')}
          <span class="card-badge">${badge}</span>
        </div>`
      : imgs.length === 1
        ? `<div class="card-img-wrap">
            <img src="${resolveImgUrl(imgs[0])}" alt="${name}" loading="lazy">
            <span class="card-badge">${badge}</span>
          </div>`
        : `<div class="card-img-wrap">
            <span class="card-badge">${badge}</span>
          </div>`;
    return `<div class="gallery-card">
      ${cardImgHtml}
      <div class="card-info">
        <div class="card-name">${name}</div>
        <div class="card-stats card-stats-extracted">
          <div class="stat-line"><span class="stat-label">${statHeight}</span> ${g.height}cm</div>
          <div class="stat-line"><span class="stat-label">${statAge}</span> ${g.age}${ageUnit}</div>
          <div class="stat-line"><span class="stat-label">${statCup}</span> ${g.cup}${lang === 'ja' ? 'カップ' : lang === 'zh' ? '罩杯' : ' cup'}</div>
          <div class="stat-line"><span class="stat-label">${statWeight}</span> ${g.weight}kg</div>
        </div>
        <div class="card-tags">${types.map(t => `<span class="ctag">${t}</span>`).join('')}</div>
      </div>
    </div>`;
  }).join('');
  document.querySelectorAll('#gallery-grid-dynamic .card-img-carousel').forEach(setupCarousel);
}

// ── Render Reviews from siteData ──
function renderReviews(lang) {
  const grid = document.getElementById('reviews-grid-dynamic');
  if (!grid || typeof siteData === 'undefined') return;
  const reviews = siteData.reviews.filter(r => r.featured);
  grid.innerHTML = reviews.map(r => {
    const title = (lang === 'zh' ? r.titleZh : lang === 'en' ? r.titleEn : r.titleJa) || r.titleJa;
    const content = (lang === 'zh' ? r.contentZh : lang === 'en' ? r.contentEn : r.contentJa) || r.contentJa;
    const imgHtml = r.image ? `<div class="review-img-wrap"><img src="${resolveImgUrl(r.image)}" alt="${title}" loading="lazy"></div>` : '';
    return `<blockquote class="review-card">
      ${imgHtml}
      <div class="review-title">${title}</div>
      <p>${content}</p>
      <div class="review-meta"><span class="review-girl">${r.girlName}</span><span class="review-date">${r.date}</span></div>
    </blockquote>`;
  }).join('');
}

// ── Render Diary from siteData ──
const DIARY_PER_PAGE = 9;
let currentDiaryCat = 'all';
let currentDiaryPage = 1;

const CAT_TO_I18N = { '出勤情報': 'diary.cat.checkin', '客戶反饋': 'diary.cat.feedback', '日記': 'diary.cat.diary', 'お知らせ': 'diary.cat.news' };
function getDiaryCatLabel(cat, lang) {
  const key = CAT_TO_I18N[cat];
  return (key && typeof translations !== 'undefined' && translations[lang]?.[key]) ? translations[lang][key] : cat;
}

/** 桌面版省略多餘頁碼按鈕，避免 10+ 頁時一排過長 */
function getDiaryPaginationItems(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const set = new Set([1, total]);
  for (let i = current - 2; i <= current + 2; i++) {
    if (i >= 1 && i <= total) set.add(i);
  }
  const sorted = [...set].sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push('ellipsis');
    out.push(sorted[i]);
  }
  return out;
}

function renderDiary(lang, cat, page) {
  const grid = document.getElementById('diary-grid');
  const paginationEl = document.getElementById('diary-pagination');
  if (!grid || typeof siteData === 'undefined') return;
  currentDiaryCat = cat || currentDiaryCat;
  currentDiaryPage = (page !== undefined && page !== null) ? page : currentDiaryPage;
  const allPosts = siteData.diary
    .filter(d => d.published && (currentDiaryCat === 'all' || d.category === currentDiaryCat))
    .sort(compareDiaryDesc);
  const totalPages = Math.ceil(allPosts.length / DIARY_PER_PAGE);
  const start = (currentDiaryPage - 1) * DIARY_PER_PAGE;
  const posts = allPosts.slice(start, start + DIARY_PER_PAGE);

  const readmore = (translations[lang] && translations[lang]['diary.readmore']) || '続きを読む →';
  grid.innerHTML = posts.map(p => {
    const title = (lang === 'zh' ? p.titleZh : lang === 'en' ? p.titleEn : p.titleJa) || p.titleJa;
    const excerpt = (lang === 'zh' ? p.excerptZh : lang === 'en' ? (p.excerptEn || p.excerpt) : (p.excerptJa || p.excerpt)) || p.excerpt;
    const cupUnit = lang === 'ja' ? 'カップ' : lang === 'zh' ? '罩杯' : ' cup';
    const ageUnit = lang === 'ja' ? '歳' : lang === 'zh' ? '歲' : 'yo';
    const statsHtml = p.stats ? `<div class="diary-stats">
      ${p.stats.height ? `<span>${p.stats.height}cm</span>` : ''}
      ${p.stats.cup ? `<span>${p.stats.cup}${cupUnit}</span>` : ''}
      ${p.stats.age ? `<span>${p.stats.age}${ageUnit}</span>` : ''}
      ${p.stats.weight ? `<span>${p.stats.weight}kg</span>` : ''}
    </div>` : '';
    const imgs = p.images?.length ? p.images : [p.thumbnail, p.image].filter(Boolean);
    const thumbHtml = imgs.length >= 2
      ? `<div class="diary-thumb diary-thumb-carousel diary-thumb-n${imgs.length}">
          ${imgs.map(url => `<img src="${resolveImgUrl(url)}" alt="${title}" class="diary-thumb-img" loading="lazy">`).join('')}
        </div>`
      : imgs.length === 1
        ? `<div class="diary-thumb"><img src="${resolveImgUrl(imgs[0])}" alt="${title}" loading="lazy"></div>`
        : '';
    return `<article class="diary-card" data-id="${p.id}">
      ${thumbHtml}
      <div class="diary-body">
        <div class="diary-meta">
          <span class="diary-date">${p.createdAt || p.date}</span>
          <span class="diary-cat">${getDiaryCatLabel(p.category, lang)}</span>
        </div>
        <h3 class="diary-title">${title}</h3>
        ${statsHtml}
        <p class="diary-excerpt">${excerpt}</p>
        <button class="diary-readmore" data-id="${p.id}">${readmore}</button>
      </div>
    </article>`;
  }).join('');

  // Pagination（所有分類都顯示子分頁，含單頁時）
  if (paginationEl) {
    if (allPosts.length === 0) {
      paginationEl.innerHTML = '';
      paginationEl.classList.remove('visible');
    } else {
      paginationEl.classList.add('visible');
      const prevLabel = lang === 'zh' ? '上一頁' : lang === 'en' ? 'Prev' : '前へ';
      const nextLabel = lang === 'zh' ? '下一頁' : lang === 'en' ? 'Next' : '次へ';
      const selectAria = lang === 'zh' ? '選擇頁碼' : lang === 'en' ? 'Go to page' : 'ページを選択';
      const pageOfText = lang === 'ja'
        ? `${currentDiaryPage} / ${totalPages} ページ`
        : `${currentDiaryPage} / ${totalPages}`;

      let html = '';
      if (currentDiaryPage > 1) {
        html += `<button type="button" class="diary-page-btn diary-page-prev" data-page="${currentDiaryPage - 1}" aria-label="${prevLabel}">${prevLabel}</button>`;
      }
      const items = getDiaryPaginationItems(currentDiaryPage, totalPages);
      html += '<span class="diary-page-numbers" aria-hidden="false">';
      for (const item of items) {
        if (item === 'ellipsis') {
          html += '<span class="diary-page-ellipsis">…</span>';
        } else {
          const active = item === currentDiaryPage ? ' active' : '';
          html += `<button type="button" class="diary-page-btn diary-page-num${active}" data-page="${item}">${item}</button>`;
        }
      }
      html += '</span>';

      const selectOpts = Array.from({ length: totalPages }, (_, i) => {
        const n = i + 1;
        return `<option value="${n}"${n === currentDiaryPage ? ' selected' : ''}>${n}</option>`;
      }).join('');
      html += `<div class="diary-page-select-wrap">
        <span class="diary-page-of">${pageOfText}</span>
        <select class="diary-page-select" id="diary-page-select" aria-label="${selectAria}">${selectOpts}</select>
      </div>`;

      if (currentDiaryPage < totalPages) {
        html += `<button type="button" class="diary-page-btn diary-page-next" data-page="${currentDiaryPage + 1}" aria-label="${nextLabel}">${nextLabel}</button>`;
      }
      paginationEl.innerHTML = html;
      paginationEl.querySelectorAll('.diary-page-btn[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
          renderDiary(lang, currentDiaryCat, parseInt(btn.dataset.page, 10));
          document.getElementById('diary')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
      const sel = document.getElementById('diary-page-select');
      if (sel) {
        sel.addEventListener('change', () => {
          const p = parseInt(sel.value, 10);
          if (p >= 1 && p <= totalPages) {
            renderDiary(lang, currentDiaryCat, p);
            document.getElementById('diary')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      }
    }
  }

  // attach click events
  grid.querySelectorAll('.diary-readmore').forEach(btn => {
    btn.addEventListener('click', () => openDiaryModal(parseInt(btn.dataset.id), lang));
  });
  grid.querySelectorAll('.diary-thumb-carousel').forEach(setupCarousel);
}

function openDiaryModal(id, lang) {
  const post = siteData.diary.find(p => p.id === id);
  if (!post) return;
  currentOpenDiaryId = id;
  const title = (lang === 'zh' ? post.titleZh : lang === 'en' ? post.titleEn : post.titleJa) || post.titleJa;
  const content = (lang === 'zh' ? post.contentZh : lang === 'en' ? post.contentEn : post.contentJa) || post.contentJa;
  const modalCupUnit = lang === 'ja' ? 'カップ' : lang === 'zh' ? '罩杯' : ' cup';
  const modalAgeUnit = lang === 'ja' ? '歳' : lang === 'zh' ? '歲' : 'yo';
  const statsHtml = post.stats ? `<div class="diary-modal-stats">
    ${post.stats.height ? `<span>📏 ${post.stats.height}cm</span>` : ''}
    ${post.stats.cup ? `<span>💝 ${post.stats.cup}${modalCupUnit}</span>` : ''}
    ${post.stats.age ? `<span>🎂 ${post.stats.age}${modalAgeUnit}</span>` : ''}
    ${post.stats.weight ? `<span>⚖️ ${post.stats.weight}kg</span>` : ''}
  </div>` : '';

  const modalImgs = post.images?.length ? post.images : [post.image, post.thumbnail].filter(Boolean);
  const isModalCarousel = modalImgs.length >= 2;
  const modalImgHtml = modalImgs.length
    ? isModalCarousel
      ? `<div class="diary-modal-carousel carousel-js">
          ${modalImgs.map((url, i) => `<img src="${resolveImgUrl(url)}" class="diary-modal-img diary-modal-carousel-img" alt="${title}" loading="${i === 0 ? 'eager' : 'lazy'}">`).join('')}
        </div>`
      : `<div class="diary-modal-imgs"><img src="${resolveImgUrl(modalImgs[0])}" class="diary-modal-img" alt="${title}" loading="eager"></div>`
    : '';
  document.getElementById('diary-modal-body').innerHTML = `
    ${modalImgHtml}
    <div class="diary-modal-header">
      <div class="diary-meta"><span class="diary-date">${post.createdAt || post.date}</span><span class="diary-cat">${getDiaryCatLabel(post.category, lang)}</span></div>
      <h2>${title}</h2>
      ${statsHtml}
    </div>
    <div class="diary-modal-text">${content.replace(/\n/g, '<br>')}</div>
  `;
  document.getElementById('diary-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
  if (isModalCarousel) {
    const carousel = document.querySelector('.diary-modal-carousel');
    if (carousel) setupCarousel(carousel);
  }
}

document.getElementById('diary-modal-close')?.addEventListener('click', closeDiaryModal);
document.getElementById('diary-modal-overlay')?.addEventListener('click', closeDiaryModal);

function closeDiaryModal() {
  currentOpenDiaryId = null;
  document.getElementById('diary-modal')?.classList.remove('open');
  document.body.style.overflow = '';
}

document.querySelectorAll('.diary-filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.diary-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const lang = localStorage.getItem('yuyu-lang') || 'ja';
    renderDiary(lang, btn.dataset.cat, 1);
  });
});

// ── Initial Render ──
(function initDynamicContent() {
  try {
    const lang = localStorage.getItem('yuyu-lang') || 'ja';
    renderGallery(lang);
    renderReviews(lang);
    renderDiary(lang);
    renderAbout(lang);
  } catch (e) {
    console.error('initDynamicContent:', e);
  }
})();
