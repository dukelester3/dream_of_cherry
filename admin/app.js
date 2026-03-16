// ===== Admin Panel App =====
// config.js 已宣告 ADMIN_PASSWORD，此處僅讀取
const ADMIN_PWD = (typeof ADMIN_PASSWORD !== 'undefined' ? ADMIN_PASSWORD : 'CHANGE_ME');
const STORAGE_KEY = 'yuyu_admin_data';
const AUTH_KEY = 'yuyu_admin_auth';
function escapeHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
const IMGBB_KEY_STORAGE = 'yuyu_imgbb_key';
const GEMINI_KEY_STORAGE = 'yuyu_gemini_key';
const GIRL_TYPE_OPTIONS = [
  { ja: '可愛系', zh: '可愛型', en: 'Cute' },
  { ja: '優雅系', zh: '優雅型', en: 'Elegant' },
  { ja: '若妻系', zh: '少婦型', en: 'Young Mature' },
  { ja: '人妻系', zh: '人妻型', en: 'Mature' },
  { ja: '学生系', zh: '學生型', en: 'Student' },
  { ja: '美脚系', zh: '美足型', en: 'Slim Legs' },
  { ja: '巨乳系', zh: '巨乳型', en: 'Busty' },
  { ja: '貧乳系', zh: '貧乳型', en: 'Petite' },
  { ja: '清楚系', zh: '清純型', en: 'Innocent' },
  { ja: '素人系', zh: '素人型', en: 'Amateur' },
  { ja: '高級系', zh: '高級型', en: 'Premium' },
  { ja: 'セクシー系', zh: '性感型', en: 'Sexy' },
  { ja: 'AV経験', zh: 'AV經驗', en: 'AV Exp.' }
];
const GITHUB_TOKEN_STORAGE = 'yuyu_github_token';
const GITHUB_REPO_STORAGE = 'yuyu_github_repo';

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
  photos: ['https://i.ibb.co/d0jHqV4k/yuyu-1.jpg', 'https://i.ibb.co/mFgWKSxj/S-28147831-0.jpg', 'https://i.ibb.co/Gv90mv5x/photo-2025-06-03-16-32-54.jpg', 'https://i.ibb.co/bTkVcn3/S-28147830-0.jpg'],
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

function saveGitHubSettings() {
  const token = document.getElementById('github-token')?.value?.trim();
  const repo = document.getElementById('github-repo')?.value?.trim() || 'dukelester3/dream_of_cherry';
  if (token) {
    localStorage.setItem(GITHUB_TOKEN_STORAGE, token);
    localStorage.setItem(GITHUB_REPO_STORAGE, repo);
    alert('GitHub 設定已儲存');
  } else {
    localStorage.removeItem(GITHUB_TOKEN_STORAGE);
    alert('已清除 GitHub Token');
  }
}

async function publishToGitHub() {
  const token = localStorage.getItem(GITHUB_TOKEN_STORAGE);
  const repo = localStorage.getItem(GITHUB_REPO_STORAGE) || 'dukelester3/dream_of_cherry';
  if (!token) {
    alert('請先至「設定」分頁填入 GitHub Token');
    return;
  }
  const [owner, repoName] = repo.split('/').map(s => s.trim());
  if (!owner || !repoName) {
    alert('請設定正確的倉庫格式：owner/repo');
    return;
  }
  const content = `// ===== 夜桜の夢 — Site Content Database =====
// Generated: ${new Date().toLocaleString()}

const siteData = ${JSON.stringify(adminData, null, 2)};

if (typeof module !== 'undefined') module.exports = siteData;`;
  const contentBase64 = btoa(unescape(encodeURIComponent(content)));
  const btn = document.getElementById('publish-github-btn');
  const origText = btn?.textContent;
  if (btn) { btn.disabled = true; btn.textContent = '發布中...'; }
  try {
    const getRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/data.js`, {
      headers: { 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Authorization': `Bearer ${token}` }
    });
    let sha = null;
    if (getRes.ok) {
      const getJson = await getRes.json();
      sha = getJson.sha;
    } else if (getRes.status !== 404) {
      const err = await getRes.json();
      throw new Error(err.message || '取得檔案失敗');
    }
    const body = { message: 'Update data.js from admin', content: contentBase64 };
    if (sha) body.sha = sha;
    const putRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/data.js`, {
      method: 'PUT',
      headers: { 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!putRes.ok) {
      const err = await putRes.json();
      throw new Error(err.message || '發布失敗');
    }
    try {
      const ver = Date.now();
      const idxRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/index.html`, {
        headers: { 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Authorization': `Bearer ${token}` }
      });
      if (idxRes.ok) {
        const idxJson = await idxRes.json();
        let idxContent = decodeURIComponent(escape(atob(idxJson.content.replace(/\n/g, ''))));
        idxContent = idxContent.replace(/data\.js\?v=\d+/g, 'data.js?v=' + ver).replace(/src="data\.js"/g, 'src="data.js?v=' + ver + '"');
        const idxBody = { message: 'Bump data.js cache', content: btoa(unescape(encodeURIComponent(idxContent))), sha: idxJson.sha };
        await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/index.html`, {
          method: 'PUT', headers: { 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(idxBody)
        });
      }
    } catch (e) {
      console.warn('Index cache bump failed:', e);
    }
    alert('發布成功！約 1–2 分鐘後網站會更新。\n\n若無痕模式仍顯示舊內容，請強制重新整理（Ctrl+Shift+R）。');
  } catch (err) {
    alert('發布失敗：' + (err.message || err));
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = origText || '🚀 發布到 GitHub'; }
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
  document.getElementById('save-github-btn')?.addEventListener('click', saveGitHubSettings);
  document.getElementById('publish-github-btn')?.addEventListener('click', publishToGitHub);
  const imgbbInput = document.getElementById('imgbb-key');
  if (imgbbInput) imgbbInput.value = localStorage.getItem(IMGBB_KEY_STORAGE) || '';
  const geminiInput = document.getElementById('gemini-key');
  if (geminiInput) geminiInput.value = localStorage.getItem(GEMINI_KEY_STORAGE) || (typeof GEMINI_API_KEY !== 'undefined' ? GEMINI_API_KEY : '');
  const githubTokenInput = document.getElementById('github-token');
  if (githubTokenInput) githubTokenInput.value = localStorage.getItem(GITHUB_TOKEN_STORAGE) || '';
  const githubRepoInput = document.getElementById('github-repo');
  if (githubRepoInput) githubRepoInput.value = localStorage.getItem(GITHUB_REPO_STORAGE) || 'dukelester3/dream_of_cherry';
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

    function setPreviewAndUrl(url) {
      urlInput.value = url;
      if (previewEl) {
        previewEl.innerHTML = `<img src="${url}" alt="預覽"><button type="button" class="img-change-btn">更換圖片</button>`;
        previewEl.querySelector('.img-change-btn').onclick = () => {
          urlInput.value = '';
          previewEl.innerHTML = '';
          if (area) area.style.display = '';
          fileInput.value = '';
        };
      }
      fileInput.value = '';
    }

    if (!key) {
      const useBase64 = confirm('尚未設定 ImgBB API Key。\n\n可選：\n• 按「確定」→ 使用 Base64 嵌入（無需 API，但會讓 data.js 變大）\n• 按「取消」→ 請至「設定」分頁填入 ImgBB Key，或直接貼上圖片網址\n\n取得免費 Key：https://api.imgbb.com/');
      if (!useBase64) {
        if (area) area.style.display = '';
        return;
      }
      if (area) area.style.display = 'none';
      if (previewEl) previewEl.innerHTML = '<div class="img-uploading">處理中...</div>';
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        if (dataUrl.length > 800000) {
          if (previewEl) previewEl.innerHTML = '';
          if (area) area.style.display = '';
          alert('圖片過大，Base64 會讓 data.js 過大。建議：\n1. 壓縮圖片後再試\n2. 至「設定」填寫 ImgBB API Key 上傳');
          return;
        }
        setPreviewAndUrl(dataUrl);
      };
      reader.readAsDataURL(file);
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
        setPreviewAndUrl(json.data.url);
      } else {
        if (area) area.style.display = '';
        if (previewEl) previewEl.innerHTML = '';
        const errMsg = json.error?.message || json.status || '未知錯誤';
        let hint = '\n\n也可直接貼上圖片網址（從 imgur、imgbb 等複製）';
        if (errMsg.includes('Invalid API') || errMsg.includes('Invalid key')) {
          hint = '\n\n請至「設定」檢查 ImgBB Key：\n• 至 https://api.imgbb.com/ 免費申請\n• 確認 Key 完整複製、無多餘空格\n• 或清空 Key 後再上傳，改用 Base64 嵌入（無需 API）';
        }
        alert('上傳失敗：' + errMsg + hint);
      }
    } catch (err) {
      if (area) area.style.display = '';
      if (previewEl) previewEl.innerHTML = '';
      alert('上傳失敗：' + err.message + '\n\n若為 CORS 或網路問題，可改用 Base64：先刪除 ImgBB Key 後再上傳，或直接貼上圖片網址');
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
      <div class="form-group">
        <label>日文名（必填，填寫後點「翻譯」自動產生中英文）</label>
        <div class="input-row">
          <input id="f-name" value="${item?.name||''}" placeholder="例：アイちゃん">
          <button type="button" class="btn-translate-all" data-ja="f-name" data-zh="f-nameZh" data-en="f-nameEn" data-ja-only="true">翻譯到中英</button>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>中文名</label><input id="f-nameZh" value="${item?.nameZh||''}" placeholder="翻譯後自動填入"></div>
        <div class="form-group"><label>英文名</label><input id="f-nameEn" value="${item?.nameEn||''}" placeholder="翻譯後自動填入"></div>
      </div>
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
      <div class="form-group">
        <label>類型標籤（可多選）</label>
        <div class="type-checkbox-group">
          ${GIRL_TYPE_OPTIONS.map((opt, i) => {
            const checked = item?.types?.includes(opt.ja) || item?.typesZh?.includes(opt.zh);
            return `<label class="type-checkbox"><input type="checkbox" name="f-type" value="${i}" data-ja="${escapeHtml(opt.ja)}" data-zh="${escapeHtml(opt.zh)}" data-en="${escapeHtml(opt.en)}" ${checked?'checked':''}><span>${opt.zh}</span></label>`;
          }).join('')}
        </div>
      </div>
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
      <div class="form-group"><label>標題(中)（必填，填寫後點「翻譯」自動產生日英文）</label><div class="input-row"><input id="f-titleZh" value="${item?.titleZh||''}" style="flex:1" placeholder="例：服務很好"><button type="button" class="btn-translate-all" data-ja="f-titleJa" data-zh="f-titleZh" data-en="f-titleEn" data-zh-only="true">翻譯到日英</button></div></div>
      <div class="form-group"><label>標題(日)</label><input id="f-titleJa" value="${item?.titleJa||''}" placeholder="翻譯後自動填入"></div>
      <div class="form-group"><label>標題(英)</label><input id="f-titleEn" value="${item?.titleEn||''}" placeholder="翻譯後自動填入"></div>
      <div class="form-group"><label>內容(中)（必填，填寫後點「翻譯」自動產生日英文）</label><div class="input-row"><textarea id="f-contentZh" style="min-height:80px;flex:1" placeholder="輸入中文內容">${item?.contentZh||''}</textarea><button type="button" class="btn-translate-all" data-ja="f-contentJa" data-zh="f-contentZh" data-en="f-contentEn" data-zh-only="true">翻譯到日英</button></div></div>
      <div class="form-group"><label>內容(日)</label><textarea id="f-contentJa" style="min-height:80px" placeholder="翻譯後自動填入">${item?.contentJa||''}</textarea></div>
      <div class="form-group"><label>內容(英)</label><textarea id="f-contentEn" style="min-height:80px" placeholder="翻譯後自動填入">${item?.contentEn||''}</textarea></div>
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
      <div class="form-group"><label>第一段(日)</label><div class="input-row"><textarea id="f-about-p1Ja" style="min-height:60px;flex:1">${escapeHtml(a.p1Ja||'')}</textarea><button type="button" class="btn-translate-all" data-ja="f-about-p1Ja" data-zh="f-about-p1Zh" data-en="f-about-p1En">一鍵翻譯</button></div></div>
      <div class="form-group"><label>第一段(中)</label><textarea id="f-about-p1Zh" style="min-height:60px">${escapeHtml(a.p1Zh||'')}</textarea></div>
      <div class="form-group"><label>第一段(英)</label><textarea id="f-about-p1En" style="min-height:60px">${escapeHtml(a.p1En||'')}</textarea></div>
      <div class="form-group"><label>第二段(日)</label><div class="input-row"><textarea id="f-about-p2Ja" style="min-height:60px;flex:1">${escapeHtml(a.p2Ja||'')}</textarea><button type="button" class="btn-translate-all" data-ja="f-about-p2Ja" data-zh="f-about-p2Zh" data-en="f-about-p2En">一鍵翻譯</button></div></div>
      <div class="form-group"><label>第二段(中)</label><textarea id="f-about-p2Zh" style="min-height:60px">${escapeHtml(a.p2Zh||'')}</textarea></div>
      <div class="form-group"><label>第二段(英)</label><textarea id="f-about-p2En" style="min-height:60px">${escapeHtml(a.p2En||'')}</textarea></div>
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
      <div class="form-group"><label>標題(中)（必填，填寫後點「翻譯」自動產生日英文）</label><div class="input-row"><input id="f-titleZh" value="${item?.titleZh||''}" style="flex:1" placeholder="例：本日出勤"><button type="button" class="btn-translate-all" data-ja="f-titleJa" data-zh="f-titleZh" data-en="f-titleEn" data-zh-only="true">翻譯到日英</button></div></div>
      <div class="form-group"><label>標題(日)</label><input id="f-titleJa" value="${item?.titleJa||''}" placeholder="翻譯後自動填入"></div>
      <div class="form-group"><label>標題(英)</label><input id="f-titleEn" value="${item?.titleEn||''}" placeholder="翻譯後自動填入"></div>
      <div class="form-group"><label>摘要(中)</label><input id="f-excerptZh" value="${item?.excerptZh||''}" placeholder="選填"></div>
      <div class="form-group"><label>摘要(日)</label><input id="f-excerpt" value="${item?.excerpt||item?.excerptJa||''}" placeholder="選填"></div>
      <div class="form-group"><label>內容(中)（必填，填寫後點「翻譯」自動產生日英文）</label><div class="input-row"><textarea id="f-contentZh" style="min-height:100px;flex:1" placeholder="輸入中文內容">${item?.contentZh||''}</textarea><button type="button" class="btn-translate-all" data-ja="f-contentJa" data-zh="f-contentZh" data-en="f-contentEn" data-zh-only="true">翻譯到日英</button></div></div>
      <div class="form-group"><label>內容(日)</label><textarea id="f-contentJa" style="min-height:100px" placeholder="翻譯後自動填入">${item?.contentJa||''}</textarea></div>
      <div class="form-group"><label>內容(英)</label><textarea id="f-contentEn" style="min-height:100px" placeholder="翻譯後自動填入">${item?.contentEn||''}</textarea></div>
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
  document.querySelectorAll('.btn-translate-all').forEach(btn => {
    btn.onclick = async function() {
      const jaId = this.dataset.ja, zhId = this.dataset.zh, enId = this.dataset.en;
      const jaOnly = this.dataset.jaOnly === 'true';
      const zhOnly = this.dataset.zhOnly === 'true';
      const jaEl = document.getElementById(jaId), zhEl = document.getElementById(zhId), enEl = document.getElementById(enId);
      if (!jaEl || !zhEl || !enEl || typeof translateWithGemini !== 'function') return;
      const ja = jaEl.value?.trim(), zh = zhEl.value?.trim(), en = enEl.value?.trim();
      let sourceLang, sourceText;
      if (zhOnly && zh) { sourceLang = 'zh'; sourceText = zh; }
      else if (jaOnly && ja) { sourceLang = 'ja'; sourceText = ja; }
      else if (ja) { sourceLang = 'ja'; sourceText = ja; }
      else if (zh && !jaOnly) { sourceLang = 'zh'; sourceText = zh; }
      else if (en && !jaOnly) { sourceLang = 'en'; sourceText = en; }
      else { alert(zhOnly ? '請先填寫中文' : jaOnly ? '請先填寫日文名' : '請先填寫日、中、英其中一種'); return; }
      btn.disabled = true;
      btn.textContent = '翻譯中...';
      try {
        const targets = [];
        if (sourceLang !== 'ja') targets.push({ to: 'ja', el: jaEl });
        if (sourceLang !== 'zh') targets.push({ to: 'zh', el: zhEl });
        if (sourceLang !== 'en') targets.push({ to: 'en', el: enEl });
        const isName = jaOnly && jaId === 'f-name';
        await Promise.all(targets.map(t => translateWithGemini(sourceText, sourceLang, t.to, { isName }).then(r => { t.el.value = r; })));
      } catch (e) {
        alert('翻譯失敗：' + (e.message || e));
      }
      btn.disabled = false;
      btn.textContent = '一鍵翻譯';
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
  const types = [], typesZh = [], typesEn = [];
  document.querySelectorAll('input[name="f-type"]:checked').forEach(cb => {
    types.push(cb.dataset.ja);
    typesZh.push(cb.dataset.zh);
    typesEn.push(cb.dataset.en);
  });
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
    types, typesZh, typesEn,
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
