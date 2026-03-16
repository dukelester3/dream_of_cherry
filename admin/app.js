// ===== Admin Panel App =====
// config.js 已宣告 ADMIN_PASSWORD，此處僅讀取
const ADMIN_PWD = (typeof ADMIN_PASSWORD !== 'undefined' ? ADMIN_PASSWORD : 'CHANGE_ME');
const STORAGE_KEY = 'yuyu_admin_data';
const AUTH_KEY = 'yuyu_admin_auth';
function escapeHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
const IMGBB_KEY_STORAGE = 'yuyu_imgbb_key';
const GEMINI_KEY_STORAGE = 'yuyu_gemini_key';

// ── State ──
let adminData = null;
let currentTab = 'girls';
let editingId = null;
let editingType = null;

// ── Auth ──（首頁登入後帶 ?_auth=token 跳轉，驗證後免二次輸入）
function checkAuth() {
  return localStorage.getItem(AUTH_KEY) === 'true';
}

function consumeAuthToken() {
  const params = new URLSearchParams(location.search);
  const token = params.get('_auth');
  if (token && localStorage.getItem('yuyu_auth_token') === token) {
    localStorage.removeItem('yuyu_auth_token');
    localStorage.setItem(AUTH_KEY, 'true');
    if (window.history.replaceState) {
      window.history.replaceState({}, '', location.pathname + location.hash);
    }
    return true;
  }
  return false;
}

function init() {
  if (consumeAuthToken() || checkAuth()) {
    showDashboard();
  }

  document.getElementById('login-btn').addEventListener('click', doLogin);
  document.getElementById('login-pwd').addEventListener('keypress', e => {
    if (e.key === 'Enter') doLogin();
  });
  document.getElementById('logout-btn').addEventListener('click', logout);
  document.getElementById('login-pwd-toggle')?.addEventListener('click', () => {
    const input = document.getElementById('login-pwd');
    const btn = document.getElementById('login-pwd-toggle');
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
}

function doLogin() {
  const pwd = document.getElementById('login-pwd').value;
  if (pwd === ADMIN_PWD) {
    localStorage.setItem(AUTH_KEY, 'true');
    document.getElementById('login-error').textContent = '';
    showDashboard();
  } else {
    document.getElementById('login-error').textContent = '密碼錯誤，請重試';
    document.getElementById('login-pwd').value = '';
  }
}

function logout() {
  localStorage.removeItem(AUTH_KEY);
  document.getElementById('dashboard').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
  document.body.className = 'login-page';
}

function showDashboard() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  document.body.className = '';
  loadData();
  setupTabs();
  setupModals();
  renderAll();
}

// ── Data ──
const DEFAULT_ABOUT = {
  photos: ['./picture/yuyu-1.jpg', './picture/yuyu-2.jpg', './picture/yuyu-3.jpg', './picture/yuyu-4.jpg'],
  p1Ja: 'はじめまして、ゆうゆうと申します。台湾出身です。',
  p1Zh: '大家好～我是悠悠，來自台灣！',
  p1En: "Hello! I'm Yuuyuu from Taiwan.",
  p2Ja: '友人の紹介でこのお仕事を始めました。',
  p2Zh: '目前通過朋友介紹從事這份工作。',
  p2En: "I started this work through a friend's introduction.",
  moreJa: 'もっと見る →', moreZh: '更多介紹 →', moreEn: 'Learn more →',
  linkUrl: 'https://t.me/ty556k'
};

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    adminData = JSON.parse(saved);
  } else if (typeof siteData !== 'undefined') {
    adminData = JSON.parse(JSON.stringify(siteData));
  } else {
    adminData = { girls: [], reviews: [], diary: [] };
  }
  if (!adminData.about) adminData.about = (siteData?.about ? { ...siteData.about } : { ...DEFAULT_ABOUT });
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(adminData));
}

// ── Tabs ──
function saveImgbbKey() {
  const key = document.getElementById('imgbb-key')?.value?.trim();
  if (key) {
    localStorage.setItem(IMGBB_KEY_STORAGE, key);
    alert('ImgBB API Key 已儲存');
  } else {
    localStorage.removeItem(IMGBB_KEY_STORAGE);
    alert('已清除 ImgBB API Key');
  }
}

function saveGeminiKey() {
  const key = document.getElementById('gemini-key')?.value?.trim();
  if (key) {
    localStorage.setItem(GEMINI_KEY_STORAGE, key);
    alert('Gemini API Key 已儲存');
  } else {
    localStorage.removeItem(GEMINI_KEY_STORAGE);
    alert('已清除 Gemini API Key');
  }
}

function setupTabs() {
  document.querySelectorAll('.admin-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.add('hidden'));
      btn.classList.add('active');
      const tabEl = document.getElementById('tab-' + btn.dataset.tab);
      if (tabEl) {
        tabEl.classList.remove('hidden');
        tabEl.classList.add('active');
      }
    });
  });

  document.getElementById('add-girl-btn').addEventListener('click', () => openModal('girl', null));
  document.getElementById('add-review-btn').addEventListener('click', () => openModal('review', null));
  document.getElementById('add-diary-btn').addEventListener('click', () => openModal('diary', null));
  document.getElementById('edit-about-btn')?.addEventListener('click', () => openModal('about', 0));
  document.getElementById('export-btn').addEventListener('click', generateExport);
  document.getElementById('save-imgbb-btn')?.addEventListener('click', saveImgbbKey);
  document.getElementById('save-gemini-btn')?.addEventListener('click', saveGeminiKey);
  const imgbbInput = document.getElementById('imgbb-key');
  if (imgbbInput) imgbbInput.value = localStorage.getItem(IMGBB_KEY_STORAGE) || '';
  const geminiInput = document.getElementById('gemini-key');
  if (geminiInput) geminiInput.value = localStorage.getItem(GEMINI_KEY_STORAGE) || (typeof GEMINI_API_KEY !== 'undefined' ? GEMINI_API_KEY : '');
  document.getElementById('copy-export-btn').addEventListener('click', () => {
    const ta = document.getElementById('export-textarea');
    ta.select(); document.execCommand('copy');
    document.getElementById('copy-export-btn').textContent = '已複製 ✓';
    setTimeout(() => document.getElementById('copy-export-btn').textContent = '複製全部', 2000);
  });
}

// ── Render Tables ──
function renderAll() {
  renderGirlsTable();
  renderReviewsTable();
  renderDiaryTable();
}

function renderGirlsTable() {
  const tbody = document.getElementById('girls-tbody');
  tbody.innerHTML = [...adminData.girls].sort((a,b) => a.order - b.order).map(g => `
    <tr>
      <td>${g.order}</td>
      <td><img src="${g.image}" class="admin-thumb" onerror="this.style.display='none'"></td>
      <td><strong>${g.name}</strong><br><small style="color:#8a7a68">${g.nameZh} / ${g.nameEn}</small></td>
      <td>${g.height}cm</td>
      <td>${g.age}歲</td>
      <td>${g.cup}罩杯</td>
      <td>${g.weight}kg</td>
      <td><span class="status-badge status-active">${g.badge}</span></td>
      <td><span class="status-badge ${g.active ? 'status-active' : 'status-inactive'}">${g.active ? '顯示' : '隱藏'}</span></td>
      <td class="action-btns">
        <button class="btn-edit" onclick="openModal('girl', ${g.id})">編輯</button>
        <button class="btn-danger" onclick="deleteItem('girl', ${g.id})">刪除</button>
      </td>
    </tr>
  `).join('');
}

function renderReviewsTable() {
  const tbody = document.getElementById('reviews-tbody');
  tbody.innerHTML = [...adminData.reviews].sort((a,b) => b.date.localeCompare(a.date)).map(r => `
    <tr>
      <td>${r.image ? `<img src="${r.image}" class="admin-thumb-sm" onerror="this.style.display='none'">` : '-'}</td>
      <td>${r.titleZh}</td>
      <td>${r.girlName}</td>
      <td>${r.date}</td>
      <td>${r.featured ? '<span class="featured-badge">精選</span>' : '-'}</td>
      <td class="action-btns">
        <button class="btn-edit" onclick="openModal('review', ${r.id})">編輯</button>
        <button class="btn-danger" onclick="deleteItem('review', ${r.id})">刪除</button>
      </td>
    </tr>
  `).join('');
}

function renderDiaryTable() {
  const tbody = document.getElementById('diary-tbody');
  tbody.innerHTML = [...adminData.diary].sort((a,b) => b.date.localeCompare(a.date)).map(d => `
    <tr>
      <td>${d.thumbnail ? `<img src="${d.thumbnail}" class="admin-thumb-sm" onerror="this.style.display='none'">` : '-'}</td>
      <td><strong>${d.titleZh}</strong></td>
      <td>${d.category}</td>
      <td>${d.date}</td>
      <td><span class="status-badge ${d.published ? 'status-active' : 'status-inactive'}">${d.published ? '發布' : '草稿'}</span></td>
      <td class="action-btns">
        <button class="btn-edit" onclick="openModal('diary', ${d.id})">編輯</button>
        <button class="btn-danger" onclick="deleteItem('diary', ${d.id})">刪除</button>
      </td>
    </tr>
  `).join('');
}

// ── Modal ──
function setupModals() {
  document.getElementById('admin-modal-close').addEventListener('click', closeModal);
  document.getElementById('admin-modal-overlay').addEventListener('click', closeModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-save').addEventListener('click', saveModal);
  document.getElementById('admin-modal-body').addEventListener('change', async (e) => {
    const fileInput = e.target;
    if (!fileInput.matches('.img-file-input') || !fileInput.files[0]) return;
    const box = fileInput.closest('.img-upload-box');
    const targetId = box?.dataset.target;
    const urlInput = document.getElementById(targetId);
    const previewEl = document.getElementById(targetId + '-preview');
    const area = box?.querySelector('.img-upload-area');
    if (!urlInput || !box) return;
    const file = fileInput.files[0];
    const key = localStorage.getItem(IMGBB_KEY_STORAGE);
    if (!key) {
      alert('請先至「設定」分頁填入 ImgBB API Key');
      return;
    }
    if (area) area.style.display = 'none';
    if (previewEl) previewEl.innerHTML = '<div class="img-uploading">上傳中...</div>';
    try {
      const fd = new FormData();
      fd.append('key', key);
      fd.append('image', file);
      const res = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (json.data?.url) {
        urlInput.value = json.data.url;
        if (previewEl) {
          previewEl.innerHTML = `<img src="${json.data.url}" alt="預覽"><button type="button" class="img-change-btn">更換圖片</button>`;
          previewEl.querySelector('.img-change-btn').onclick = () => {
            urlInput.value = '';
            previewEl.innerHTML = '';
            if (area) area.style.display = '';
            fileInput.value = '';
          };
        }
        fileInput.value = '';
      } else {
        if (area) area.style.display = '';
        if (previewEl) previewEl.innerHTML = '';
        alert('上傳失敗：' + (json.error?.message || json.status || '未知錯誤'));
      }
    } catch (err) {
      if (area) area.style.display = '';
      if (previewEl) previewEl.innerHTML = '';
      alert('上傳失敗：' + err.message);
    }
  });
  document.getElementById('admin-modal-body').addEventListener('dragover', (e) => {
    if (e.target.closest('.img-upload-area')) e.preventDefault();
  });
  document.getElementById('admin-modal-body').addEventListener('drop', (e) => {
    const area = e.target.closest('.img-upload-area');
    if (!area) return;
    e.preventDefault();
    const file = e.dataTransfer?.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const fileInput = document.getElementById(area.getAttribute('for'));
    if (fileInput) {
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInput.files = dt.files;
      fileInput.dispatchEvent(new Event('change'));
    }
  });
}

function openModal(type, id) {
  editingType = type;
  editingId = id;
  const modal = document.getElementById('admin-modal');
  const body = document.getElementById('admin-modal-body');
  const title = document.getElementById('modal-title');

  let item = null;
  if (id !== null) {
    if (type === 'girl') item = adminData.girls.find(g => g.id === id);
    if (type === 'review') item = adminData.reviews.find(r => r.id === id);
    if (type === 'diary') item = adminData.diary.find(d => d.id === id);
  }

  if (type === 'girl') {
    title.textContent = id ? '編輯女孩' : '新增女孩';
    body.innerHTML = `
      <div class="form-row">
        <div class="form-group"><label>日文名</label><input id="f-name" value="${item?.name||''}"></div>
        <div class="form-group"><label>中文名</label><input id="f-nameZh" value="${item?.nameZh||''}"></div>
      </div>
      <div class="form-group"><label>英文名</label><input id="f-nameEn" value="${item?.nameEn||''}"></div>
      <div class="form-row">
        <div class="form-group"><label>身高(cm)</label><input id="f-height" type="number" value="${item?.height||160}"></div>
        <div class="form-group"><label>年齡</label><input id="f-age" type="number" value="${item?.age||22}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>罩杯</label><input id="f-cup" value="${item?.cup||'C'}"></div>
        <div class="form-group"><label>體重(kg)</label><input id="f-weight" type="number" value="${item?.weight||45}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>徽章(日)</label><input id="f-badge" value="${item?.badge||'NEW'}"></div>
        <div class="form-group"><label>徽章(中)</label><input id="f-badgeZh" value="${item?.badgeZh||'新人'}"></div>
      </div>
      <div class="form-group"><label>類型標籤(日，逗號分隔)</label><input id="f-types" value="${item?.types?.join(',')||''}"></div>
      <div class="form-group"><label>類型標籤(中，逗號分隔)</label><input id="f-typesZh" value="${item?.typesZh?.join(',')||''}"></div>
      <div class="form-group">
        <label>照片</label>
        <div class="img-upload-box" data-target="f-image">
          <label class="img-upload-area" for="f-image-file">
            <span class="img-upload-icon">📷</span>
            <span class="img-upload-text">點擊選擇圖片或拖曳到這裡</span>
            <span class="img-upload-hint">支援 JPG、PNG</span>
          </label>
          <input type="file" id="f-image-file" accept="image/*" class="img-file-input">
          <div class="img-upload-preview" id="f-image-preview"></div>
          <input id="f-image" value="${item?.image||''}" class="img-url-input" placeholder="上傳後自動填入網址，或手動貼上">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>顯示順序</label><input id="f-order" type="number" value="${item?.order||99}"></div>
        <div class="form-group"><label>狀態</label><select id="f-active"><option value="true" ${item?.active!==false?'selected':''}>顯示</option><option value="false" ${item?.active===false?'selected':''}>隱藏</option></select></div>
      </div>
    `;
  }

  if (type === 'review') {
    title.textContent = id ? '編輯客評' : '新增客評';
    body.innerHTML = `
      <div class="form-group"><label>標題(日)</label><input id="f-titleJa" value="${item?.titleJa||''}"></div>
      <div class="form-group"><label>標題(中)</label><div class="input-row"><input id="f-titleZh" value="${item?.titleZh||''}"><button type="button" class="btn-translate" data-from="ja" data-to="zh" data-source="f-titleJa" data-target="f-titleZh">Gemini</button></div></div>
      <div class="form-group"><label>標題(英)</label><div class="input-row"><input id="f-titleEn" value="${item?.titleEn||''}"><button type="button" class="btn-translate" data-from="ja" data-to="en" data-source="f-titleJa" data-target="f-titleEn">Gemini</button></div></div>
      <div class="form-group"><label>內容(日)</label><textarea id="f-contentJa">${item?.contentJa||''}</textarea></div>
      <div class="form-group"><label>內容(中)</label><div class="input-row"><textarea id="f-contentZh">${item?.contentZh||''}</textarea><button type="button" class="btn-translate" data-from="ja" data-to="zh" data-source="f-contentJa" data-target="f-contentZh">Gemini</button></div></div>
      <div class="form-group"><label>內容(英)</label><div class="input-row"><textarea id="f-contentEn">${item?.contentEn||''}</textarea><button type="button" class="btn-translate" data-from="ja" data-to="en" data-source="f-contentJa" data-target="f-contentEn">Gemini</button></div></div>
      <div class="form-group">
        <label>照片（選填）</label>
        <div class="img-upload-box" data-target="f-review-image">
          <label class="img-upload-area" for="f-review-image-file">
            <span class="img-upload-icon">📷</span>
            <span class="img-upload-text">點擊選擇圖片或拖曳到這裡</span>
          </label>
          <input type="file" id="f-review-image-file" accept="image/*" class="img-file-input">
          <div class="img-upload-preview" id="f-review-image-preview"></div>
          <input id="f-review-image" value="${item?.image||''}" class="img-url-input" placeholder="上傳後自動填入">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>女孩姓名</label><input id="f-girlName" value="${item?.girlName||''}"></div>
        <div class="form-group"><label>日期(YYYY.MM.DD)</label><input id="f-date" value="${item?.date||''}"></div>
      </div>
      <div class="form-group"><label>精選顯示</label><select id="f-featured"><option value="true" ${item?.featured?'selected':''}>是</option><option value="false" ${!item?.featured?'selected':''}>否</option></select></div>
    `;
  }

  if (type === 'about') {
    title.textContent = '編輯個人簡介';
    const a = adminData.about || DEFAULT_ABOUT;
    const photos = a.photos || [...DEFAULT_ABOUT.photos];
    const ph = (i) => (photos[i] || '').replace(/"/g, '&quot;');
    body.innerHTML = `
      <div class="form-group"><label>照片 1（左上小圖）</label>
        <div class="img-upload-box" data-target="f-about-photo-0">
          <label class="img-upload-area" for="f-about-photo-0-file"><span class="img-upload-icon">📷</span><span class="img-upload-text">上傳或拖曳</span></label>
          <input type="file" id="f-about-photo-0-file" accept="image/*" class="img-file-input">
          <div class="img-upload-preview" id="f-about-photo-0-preview"></div>
          <input id="f-about-photo-0" value="${ph(0)}" class="img-url-input" placeholder="網址">
        </div>
      </div>
      <div class="form-group"><label>照片 2（右大圖）</label>
        <div class="img-upload-box" data-target="f-about-photo-1">
          <label class="img-upload-area" for="f-about-photo-1-file"><span class="img-upload-icon">📷</span><span class="img-upload-text">上傳或拖曳</span></label>
          <input type="file" id="f-about-photo-1-file" accept="image/*" class="img-file-input">
          <div class="img-upload-preview" id="f-about-photo-1-preview"></div>
          <input id="f-about-photo-1" value="${ph(1)}" class="img-url-input" placeholder="網址">
        </div>
      </div>
      <div class="form-group"><label>照片 3（左長圖）</label>
        <div class="img-upload-box" data-target="f-about-photo-2">
          <label class="img-upload-area" for="f-about-photo-2-file"><span class="img-upload-icon">📷</span><span class="img-upload-text">上傳或拖曳</span></label>
          <input type="file" id="f-about-photo-2-file" accept="image/*" class="img-file-input">
          <div class="img-upload-preview" id="f-about-photo-2-preview"></div>
          <input id="f-about-photo-2" value="${ph(2)}" class="img-url-input" placeholder="網址">
        </div>
      </div>
      <div class="form-group"><label>照片 4（右下小圖）</label>
        <div class="img-upload-box" data-target="f-about-photo-3">
          <label class="img-upload-area" for="f-about-photo-3-file"><span class="img-upload-icon">📷</span><span class="img-upload-text">上傳或拖曳</span></label>
          <input type="file" id="f-about-photo-3-file" accept="image/*" class="img-file-input">
          <div class="img-upload-preview" id="f-about-photo-3-preview"></div>
          <input id="f-about-photo-3" value="${ph(3)}" class="img-url-input" placeholder="網址">
        </div>
      </div>
      <div class="form-group"><label>第一段(日)</label><textarea id="f-about-p1Ja" style="min-height:60px">${escapeHtml(a.p1Ja||'')}</textarea></div>
      <div class="form-group"><label>第一段(中)</label><div class="input-row"><textarea id="f-about-p1Zh" style="min-height:60px">${escapeHtml(a.p1Zh||'')}</textarea><button type="button" class="btn-translate" data-from="ja" data-to="zh" data-source="f-about-p1Ja" data-target="f-about-p1Zh">Gemini</button></div></div>
      <div class="form-group"><label>第一段(英)</label><div class="input-row"><textarea id="f-about-p1En" style="min-height:60px">${escapeHtml(a.p1En||'')}</textarea><button type="button" class="btn-translate" data-from="ja" data-to="en" data-source="f-about-p1Ja" data-target="f-about-p1En">Gemini</button></div></div>
      <div class="form-group"><label>第二段(日)</label><textarea id="f-about-p2Ja" style="min-height:60px">${escapeHtml(a.p2Ja||'')}</textarea></div>
      <div class="form-group"><label>第二段(中)</label><div class="input-row"><textarea id="f-about-p2Zh" style="min-height:60px">${escapeHtml(a.p2Zh||'')}</textarea><button type="button" class="btn-translate" data-from="ja" data-to="zh" data-source="f-about-p2Ja" data-target="f-about-p2Zh">Gemini</button></div></div>
      <div class="form-group"><label>第二段(英)</label><div class="input-row"><textarea id="f-about-p2En" style="min-height:60px">${escapeHtml(a.p2En||'')}</textarea><button type="button" class="btn-translate" data-from="ja" data-to="en" data-source="f-about-p2Ja" data-target="f-about-p2En">Gemini</button></div></div>
      <div class="form-row">
        <div class="form-group"><label>連結文字(日)</label><input id="f-about-moreJa" value="${(a.moreJa||'').replace(/"/g,'&quot;')}"></div>
        <div class="form-group"><label>連結文字(中)</label><input id="f-about-moreZh" value="${(a.moreZh||'').replace(/"/g,'&quot;')}"></div>
      </div>
      <div class="form-group"><label>連結文字(英)</label><input id="f-about-moreEn" value="${(a.moreEn||'').replace(/"/g,'&quot;')}"></div>
      <div class="form-group"><label>連結網址</label><input id="f-about-linkUrl" value="${(a.linkUrl||'').replace(/"/g,'&quot;')}" placeholder="https://t.me/..."></div>
    `;
  }

  if (type === 'diary') {
    title.textContent = id ? '編輯日記' : '新增日記';
    const stats = item?.stats || {};
    body.innerHTML = `
      <div class="form-group"><label>標題(日)</label><input id="f-titleJa" value="${item?.titleJa||''}"></div>
      <div class="form-group"><label>標題(中)</label><div class="input-row"><input id="f-titleZh" value="${item?.titleZh||''}"><button type="button" class="btn-translate" data-from="ja" data-to="zh" data-source="f-titleJa" data-target="f-titleZh">Gemini</button></div></div>
      <div class="form-group"><label>標題(英)</label><div class="input-row"><input id="f-titleEn" value="${item?.titleEn||''}"><button type="button" class="btn-translate" data-from="ja" data-to="en" data-source="f-titleJa" data-target="f-titleEn">Gemini</button></div></div>
      <div class="form-group"><label>摘要(日)</label><input id="f-excerpt" value="${item?.excerpt||''}"></div>
      <div class="form-group"><label>摘要(中)</label><div class="input-row"><input id="f-excerptZh" value="${item?.excerptZh||''}"><button type="button" class="btn-translate" data-from="ja" data-to="zh" data-source="f-excerpt" data-target="f-excerptZh">Gemini</button></div></div>
      <div class="form-group"><label>內容(日)</label><textarea id="f-contentJa" style="min-height:100px">${item?.contentJa||''}</textarea></div>
      <div class="form-group"><label>內容(中)</label><div class="input-row"><textarea id="f-contentZh" style="min-height:100px">${item?.contentZh||''}</textarea><button type="button" class="btn-translate" data-from="ja" data-to="zh" data-source="f-contentJa" data-target="f-contentZh">Gemini</button></div></div>
      <div class="form-group"><label>內容(英)</label><div class="input-row"><textarea id="f-contentEn" style="min-height:100px">${item?.contentEn||''}</textarea><button type="button" class="btn-translate" data-from="ja" data-to="en" data-source="f-contentJa" data-target="f-contentEn">Gemini</button></div></div>
      <div class="form-row">
        <div class="form-group"><label>分類</label><select id="f-category"><option ${item?.category==='出勤情報'?'selected':''}>出勤情報</option><option ${item?.category==='客戶反饋'?'selected':''}>客戶反饋</option><option ${item?.category==='日記'?'selected':''}>日記</option><option ${item?.category==='お知らせ'?'selected':''}>お知らせ</option></select></div>
        <div class="form-group"><label>日期(YYYY.MM.DD)</label><input id="f-date" value="${item?.date||''}"></div>
      </div>
      <div class="form-group">
        <label>縮圖（列表卡片用）</label>
        <div class="img-upload-box" data-target="f-thumbnail">
          <label class="img-upload-area" for="f-thumbnail-file">
            <span class="img-upload-icon">📷</span>
            <span class="img-upload-text">點擊選擇圖片或拖曳到這裡</span>
          </label>
          <input type="file" id="f-thumbnail-file" accept="image/*" class="img-file-input">
          <div class="img-upload-preview" id="f-thumbnail-preview"></div>
          <input id="f-thumbnail" value="${item?.thumbnail||''}" class="img-url-input" placeholder="上傳後自動填入">
        </div>
      </div>
      <div class="form-group">
        <label>內容圖片（選填，彈窗大圖用）</label>
        <div class="img-upload-box" data-target="f-diary-image">
          <label class="img-upload-area" for="f-diary-image-file">
            <span class="img-upload-icon">📷</span>
            <span class="img-upload-text">點擊選擇圖片或拖曳到這裡</span>
          </label>
          <input type="file" id="f-diary-image-file" accept="image/*" class="img-file-input">
          <div class="img-upload-preview" id="f-diary-image-preview"></div>
          <input id="f-diary-image" value="${item?.image||''}" class="img-url-input" placeholder="上傳後自動填入">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>身高(選填)</label><input id="f-sh" type="number" value="${stats.height||''}"></div>
        <div class="form-group"><label>罩杯(選填)</label><input id="f-sc" value="${stats.cup||''}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>年齡(選填)</label><input id="f-sa" type="number" value="${stats.age||''}"></div>
        <div class="form-group"><label>體重(選填)</label><input id="f-sw" type="number" value="${stats.weight||''}"></div>
      </div>
      <div class="form-group"><label>狀態</label><select id="f-published"><option value="true" ${item?.published!==false?'selected':''}>發布</option><option value="false" ${item?.published===false?'selected':''}>草稿</option></select></div>
    `;
  }

  modal.classList.remove('hidden');
  setupTranslateButtons();
  document.querySelectorAll('.img-upload-box').forEach(box => {
    const targetId = box.dataset.target;
    const urlInput = document.getElementById(targetId);
    const previewEl = document.getElementById(targetId + '-preview');
    const area = box.querySelector('.img-upload-area');
    if (urlInput?.value && previewEl && area) {
      area.style.display = 'none';
      const img = document.createElement('img');
      img.src = urlInput.value;
      img.alt = '預覽';
      img.onerror = () => { previewEl.innerHTML = ''; area.style.display = ''; };
      const changeBtn = document.createElement('button');
      changeBtn.type = 'button';
      changeBtn.className = 'img-change-btn';
      changeBtn.textContent = '更換圖片';
      changeBtn.onclick = () => {
        urlInput.value = '';
        previewEl.innerHTML = '';
        area.style.display = '';
      };
      previewEl.innerHTML = '';
      previewEl.appendChild(img);
      previewEl.appendChild(changeBtn);
    }
  });
}

function setupTranslateButtons() {
  document.querySelectorAll('.btn-translate').forEach(btn => {
    btn.onclick = async function() {
      const sourceId = this.dataset.source;
      const targetId = this.dataset.target;
      const from = this.dataset.from;
      const to = this.dataset.to;
      const sourceEl = document.getElementById(sourceId);
      const targetEl = document.getElementById(targetId);
      if (!sourceEl || !targetEl || typeof translateWithGemini !== 'function') return;
      const text = sourceEl.value?.trim();
      if (!text) { alert('請先填寫來源欄位'); return; }
      btn.disabled = true;
      btn.textContent = '翻譯中...';
      try {
        targetEl.value = await translateWithGemini(text, from, to);
      } catch (e) {
        alert('翻譯失敗：' + (e.message || e));
      }
      btn.disabled = false;
      btn.textContent = 'Gemini';
    };
  });
}

function closeModal() {
  document.getElementById('admin-modal').classList.add('hidden');
  editingId = null; editingType = null;
}

function saveModal() {
  if (editingType === 'girl') saveGirl();
  if (editingType === 'review') saveReview();
  if (editingType === 'diary') saveDiary();
  if (editingType === 'about') saveAbout();
  saveData();
  renderAll();
  closeModal();
}

function saveGirl() {
  const types = document.getElementById('f-types').value.split(',').map(s=>s.trim()).filter(Boolean);
  const typesZh = document.getElementById('f-typesZh').value.split(',').map(s=>s.trim()).filter(Boolean);
  const data = {
    name: document.getElementById('f-name').value,
    nameZh: document.getElementById('f-nameZh').value,
    nameEn: document.getElementById('f-nameEn').value,
    height: parseInt(document.getElementById('f-height').value),
    age: parseInt(document.getElementById('f-age').value),
    cup: document.getElementById('f-cup').value,
    weight: parseInt(document.getElementById('f-weight').value),
    badge: document.getElementById('f-badge').value,
    badgeZh: document.getElementById('f-badgeZh').value,
    badgeEn: document.getElementById('f-badge').value,
    types, typesZh,
    typesEn: types,
    image: document.getElementById('f-image').value,
    order: parseInt(document.getElementById('f-order').value),
    active: document.getElementById('f-active').value === 'true'
  };
  if (editingId) {
    const idx = adminData.girls.findIndex(g => g.id === editingId);
    adminData.girls[idx] = { ...adminData.girls[idx], ...data };
  } else {
    const maxId = adminData.girls.reduce((m,g) => Math.max(m, g.id), 0);
    adminData.girls.push({ id: maxId + 1, ...data });
  }
}

function saveReview() {
  const imgEl = document.getElementById('f-review-image');
  const data = {
    titleJa: document.getElementById('f-titleJa').value,
    titleZh: document.getElementById('f-titleZh').value,
    titleEn: document.getElementById('f-titleEn').value,
    contentJa: document.getElementById('f-contentJa').value,
    contentZh: document.getElementById('f-contentZh').value,
    contentEn: document.getElementById('f-contentEn').value,
    girlName: document.getElementById('f-girlName').value,
    date: document.getElementById('f-date').value,
    featured: document.getElementById('f-featured').value === 'true',
    rating: 5
  };
  if (imgEl?.value) data.image = imgEl.value;
  if (editingId) {
    const idx = adminData.reviews.findIndex(r => r.id === editingId);
    adminData.reviews[idx] = { ...adminData.reviews[idx], ...data };
  } else {
    const maxId = adminData.reviews.reduce((m,r) => Math.max(m, r.id), 0);
    adminData.reviews.push({ id: maxId + 1, ...data });
  }
}

function saveDiary() {
  const sh = document.getElementById('f-sh').value;
  const sc = document.getElementById('f-sc').value;
  const sa = document.getElementById('f-sa').value;
  const sw = document.getElementById('f-sw').value;
  const stats = (sh||sc||sa||sw) ? {
    height: sh ? parseInt(sh) : undefined,
    cup: sc || undefined,
    age: sa ? parseInt(sa) : undefined,
    weight: sw ? parseInt(sw) : undefined
  } : null;
  const data = {
    titleJa: document.getElementById('f-titleJa').value,
    titleZh: document.getElementById('f-titleZh').value,
    titleEn: document.getElementById('f-titleEn').value,
    excerpt: document.getElementById('f-excerpt').value,
    excerptZh: document.getElementById('f-excerptZh').value,
    contentJa: document.getElementById('f-contentJa').value,
    contentZh: document.getElementById('f-contentZh').value,
    contentEn: document.getElementById('f-contentEn').value,
    category: document.getElementById('f-category').value,
    date: document.getElementById('f-date').value,
    thumbnail: document.getElementById('f-thumbnail').value,
    image: document.getElementById('f-diary-image')?.value || undefined,
    stats,
    published: document.getElementById('f-published').value === 'true'
  };
  if (editingId) {
    const idx = adminData.diary.findIndex(d => d.id === editingId);
    adminData.diary[idx] = { ...adminData.diary[idx], ...data };
  } else {
    const maxId = adminData.diary.reduce((m,d) => Math.max(m, d.id), 0);
    adminData.diary.push({ id: maxId + 1, ...data });
  }
}

function saveAbout() {
  adminData.about = {
    photos: [
      document.getElementById('f-about-photo-0')?.value?.trim() || '',
      document.getElementById('f-about-photo-1')?.value?.trim() || '',
      document.getElementById('f-about-photo-2')?.value?.trim() || '',
      document.getElementById('f-about-photo-3')?.value?.trim() || ''
    ],
    p1Ja: document.getElementById('f-about-p1Ja')?.value?.trim() || '',
    p1Zh: document.getElementById('f-about-p1Zh')?.value?.trim() || '',
    p1En: document.getElementById('f-about-p1En')?.value?.trim() || '',
    p2Ja: document.getElementById('f-about-p2Ja')?.value?.trim() || '',
    p2Zh: document.getElementById('f-about-p2Zh')?.value?.trim() || '',
    p2En: document.getElementById('f-about-p2En')?.value?.trim() || '',
    moreJa: document.getElementById('f-about-moreJa')?.value?.trim() || 'もっと見る →',
    moreZh: document.getElementById('f-about-moreZh')?.value?.trim() || '更多介紹 →',
    moreEn: document.getElementById('f-about-moreEn')?.value?.trim() || 'Learn more →',
    linkUrl: document.getElementById('f-about-linkUrl')?.value?.trim() || 'https://t.me/ty556k'
  };
}

function deleteItem(type, id) {
  if (!confirm('確定要刪除？')) return;
  if (type === 'girl') adminData.girls = adminData.girls.filter(g => g.id !== id);
  if (type === 'review') adminData.reviews = adminData.reviews.filter(r => r.id !== id);
  if (type === 'diary') adminData.diary = adminData.diary.filter(d => d.id !== id);
  saveData();
  renderAll();
}

// ── Export ──
function generateExport() {
  const output = `// ===== 夜桜の夢 — Site Content Database =====
// Generated: ${new Date().toLocaleString()}

const siteData = ${JSON.stringify(adminData, null, 2)};

if (typeof module !== 'undefined') module.exports = siteData;`;

  document.getElementById('export-textarea').value = output;
  document.getElementById('export-output').classList.remove('hidden');
}

// ── Start ──
init();
