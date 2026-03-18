// ── Preview：後台儲存後用 ?preview=1 可即時看變更 ──
(function() {
  const params = new URLSearchParams(location.search);
  if (params.get('preview') === '1' && typeof siteData !== 'undefined') {
    const saved = localStorage.getItem('yuyu_admin_data');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        Object.assign(siteData, data);
      } catch (e) {}
    }
  }
})();

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
    if (translations[lang]?.[key]) el.textContent = translations[lang][key];
  });

  document.querySelectorAll('.area-tag[data-area]').forEach(el => {
    const key = 'area.' + el.getAttribute('data-area');
    if (translations[lang]?.[key]) el.textContent = translations[lang][key];
  });

  localStorage.setItem('yuyu-lang', lang);

  // 僅在用戶點擊切換語言時重新渲染（init 時不呼叫，避免 currentDiaryCat 未定義）
  if (rerender && typeof renderGallery === 'function') {
    renderGallery(lang);
    renderReviews(lang);
    renderDiary(lang);
    renderAbout(lang);
    if (currentOpenDiaryId) openDiaryModal(currentOpenDiaryId, lang);
  }
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
    return `<div class="gallery-card">
      <div class="card-img-wrap">
        <img src="${resolveImgUrl(g.image)}" alt="${name}" loading="lazy">
        <span class="card-badge">${badge}</span>
      </div>
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

function renderDiary(lang, cat, page) {
  const grid = document.getElementById('diary-grid');
  const paginationEl = document.getElementById('diary-pagination');
  if (!grid || typeof siteData === 'undefined') return;
  currentDiaryCat = cat || currentDiaryCat;
  currentDiaryPage = (page !== undefined && page !== null) ? page : currentDiaryPage;
  function diarySortKey(d) { return d.createdAt || (d.date ? d.date + ' 00:00:00' : ''); }
  const allPosts = siteData.diary
    .filter(d => d.published && (currentDiaryCat === 'all' || d.category === currentDiaryCat))
    .sort((a,b) => diarySortKey(b).localeCompare(diarySortKey(a)));
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
      let html = '';
      if (currentDiaryPage > 1) {
        html += `<button type="button" class="diary-page-btn diary-page-prev" data-page="${currentDiaryPage - 1}" aria-label="${prevLabel}">${prevLabel}</button>`;
      }
      html += '<span class="diary-page-numbers">';
      for (let i = 1; i <= totalPages; i++) {
        const active = i === currentDiaryPage ? ' active' : '';
        html += `<button type="button" class="diary-page-btn diary-page-num${active}" data-page="${i}">${i}</button>`;
      }
      html += '</span>';
      if (currentDiaryPage < totalPages) {
        html += `<button type="button" class="diary-page-btn diary-page-next" data-page="${currentDiaryPage + 1}" aria-label="${nextLabel}">${nextLabel}</button>`;
      }
      paginationEl.innerHTML = html;
      paginationEl.querySelectorAll('.diary-page-btn[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
          renderDiary(lang, currentDiaryCat, parseInt(btn.dataset.page));
          document.getElementById('diary')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    }
  }

  // attach click events
  grid.querySelectorAll('.diary-readmore').forEach(btn => {
    btn.addEventListener('click', () => openDiaryModal(parseInt(btn.dataset.id), lang));
  });
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
  const modalImgHtml = modalImgs.length
    ? modalImgs.map((url, i) => `<img src="${resolveImgUrl(url)}" class="diary-modal-img" alt="${title}" loading="${i === 0 ? 'eager' : 'lazy'}">`).join('')
    : '';
  document.getElementById('diary-modal-body').innerHTML = `
    ${modalImgHtml ? `<div class="diary-modal-imgs">${modalImgHtml}</div>` : ''}
    <div class="diary-modal-header">
      <div class="diary-meta"><span class="diary-date">${post.createdAt || post.date}</span><span class="diary-cat">${getDiaryCatLabel(post.category, lang)}</span></div>
      <h2>${title}</h2>
      ${statsHtml}
    </div>
    <div class="diary-modal-text">${content.replace(/\n/g, '<br>')}</div>
  `;
  document.getElementById('diary-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
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
