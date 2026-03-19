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
const WATERMARK_LOGO = '../logo/logo-trimmed.png';

// ── 裁切 + 浮水印：先裁成 2:3（top center）再疊 logo，確保顯示時浮水印不被裁掉 ──
const CROP_ASPECT = 2 / 3; // 與 Gallery、日記顯示比例一致

async function addWatermark(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const imgRatio = img.width / img.height;
      let outW, outH, sx, sy, sw, sh;
      if (imgRatio > CROP_ASPECT) {
        // 橫圖：裁左右，保留上方置中
        outH = img.height;
        outW = Math.round(img.height * CROP_ASPECT);
        sx = Math.round((img.width - outW) / 2);
        sy = 0;
        sw = outW;
        sh = img.height;
      } else if (imgRatio < CROP_ASPECT) {
        // 直圖：裁下方，保留上方
        outW = img.width;
        outH = Math.round(img.width / CROP_ASPECT);
        sx = 0;
        sy = 0;
        sw = img.width;
        sh = outH;
      } else {
        outW = img.width;
        outH = img.height;
        sx = sy = 0;
        sw = img.width;
        sh = img.height;
      }
      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.onload = () => {
        const cellW = outW / 4;
        const cellH = outH / 4;
        let logoW, logoH;
        if (logoImg.width / logoImg.height >= cellW / cellH) {
          logoW = cellW;
          logoH = (logoImg.height / logoImg.width) * logoW;
        } else {
          logoH = cellH;
          logoW = (logoImg.width / logoImg.height) * logoH;
        }
        const pad = 4;
        const leftOffset = outW * 0.08;
        const x = outW - logoW - pad - leftOffset;
        const y = outH - logoH - pad;
        ctx.globalAlpha = 1;
        ctx.drawImage(logoImg, x, y, logoW, logoH);
        ctx.globalAlpha = 1;
        canvas.toBlob(blob => {
          URL.revokeObjectURL(objectUrl);
          if (blob) resolve(new File([blob], file.name, { type: file.type }));
          else resolve(file);
        }, file.type || 'image/jpeg', 0.92);
      };
      logoImg.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
      logoImg.src = WATERMARK_LOGO;
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
    img.src = objectUrl;
  });
}

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
  if (localStorage.getItem(GITHUB_TOKEN_STORAGE)) {
    loadFromGitHub({ silent: true });
  }
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

function getTodayDateStr() {
  const d = new Date();
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

function getNowStr() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function getDiarySortKey(d) {
  return d.createdAt || (d.date ? d.date + ' 00:00:00' : '');
}

function extractBangouFromTitle(title) {
  if (!title || typeof title !== 'string') return null;
  const m = title.match(/番[号號](\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

function getUsedBangouList(excludeDiaryId) {
  return (adminData.diary || [])
    .filter(d => d.category === '出勤情報' && d.id !== excludeDiaryId)
    .map(d => extractBangouFromTitle(d.titleZh) || extractBangouFromTitle(d.titleJa))
    .filter(n => n != null);
}

function getNextBangou(excludeDiaryId) {
  const used = getUsedBangouList(excludeDiaryId);
  const max = used.length ? Math.max(...used) : 7099;
  return max + 1;
}

function setupDiaryFormHelpers(editingId) {
  const catEl = document.getElementById('f-category');
  const titleZhEl = document.getElementById('f-titleZh');
  const titleJaEl = document.getElementById('f-titleJa');
  const titleEnEl = document.getElementById('f-titleEn');
  if (!catEl || !titleZhEl) return;

  function fillNextBangou() {
    const next = getNextBangou(editingId);
    titleZhEl.value = '番號' + next;
    titleJaEl.value = '番号' + next;
    if (titleEnEl) titleEnEl.value = 'No. ' + next;
  }

  if (catEl.value === '出勤情報' && !titleZhEl.value.trim()) fillNextBangou();

  catEl.addEventListener('change', () => {
    if (catEl.value === '出勤情報' && !titleZhEl.value.trim()) fillNextBangou();
  });

  function checkDuplicateBangou() {
    if (catEl.value !== '出勤情報') return;
    const num = extractBangouFromTitle(titleZhEl.value) || extractBangouFromTitle(titleJaEl.value);
    if (num == null) return;
    const used = getUsedBangouList(editingId);
    if (used.includes(num)) {
      alert('該番號已被使用過，請更換其他番號。');
    }
  }

  titleZhEl.addEventListener('blur', checkDuplicateBangou);
  titleJaEl.addEventListener('blur', checkDuplicateBangou);
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

// ── 合併本地與遠端資料，避免多人編輯互相覆蓋 ──
function mergeDataLocalWithRemote(local, remote) {
  if (!remote || typeof remote !== 'object') return local;
  return mergeTwoData(local, remote);
}

// ── 合併兩份完整資料（用於合併匯入）──
function mergeTwoData(dataA, dataB) {
  if (!dataA || !dataB) return dataA || dataB;
  const merged = { ...dataA };
  for (const key of ['girls', 'reviews', 'diary']) {
    const arrA = dataA[key];
    const arrB = dataB[key];
    if (!Array.isArray(arrA) && !Array.isArray(arrB)) continue;
    const map = new Map();
    (arrB || []).forEach(item => map.set(item.id, { ...item }));
    (arrA || []).forEach(item => map.set(item.id, { ...item }));
    let arr = Array.from(map.values());
    if (key === 'girls') arr.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    else if (key === 'diary') arr.sort((a, b) => getDiarySortKey(b).localeCompare(getDiarySortKey(a)));
    else if (key === 'reviews') arr.sort((a, b) => (b.id || 0) - (a.id || 0));
    merged[key] = arr;
  }
  if (dataB.about) {
    const photoSet = new Set([...(dataA.about?.photos || []), ...(dataB.about?.photos || [])]);
    merged.about = { ...dataA.about, ...dataB.about, photos: [...photoSet] };
  }
  return merged;
}

function parseDataJsContent(decoded) {
  try {
    const fn = new Function(decoded + '; return typeof siteData !== "undefined" ? siteData : null;');
    return fn();
  } catch {
    return null;
  }
}

async function loadFromGitHub(opts = {}) {
  const silent = opts.silent === true;
  const token = localStorage.getItem(GITHUB_TOKEN_STORAGE);
  const repo = localStorage.getItem(GITHUB_REPO_STORAGE) || 'dukelester3/dream_of_cherry';
  if (!token) {
    if (!silent) alert('請先至「設定」分頁填入 GitHub Token');
    return;
  }
  const [owner, repoName] = repo.split('/').map(s => s.trim());
  if (!owner || !repoName) {
    if (!silent) alert('請設定正確的倉庫格式：owner/repo');
    return;
  }
  const btn = document.getElementById('reload-from-github-btn');
  const origText = btn?.textContent;
  if (btn) { btn.disabled = true; btn.textContent = '載入中...'; }
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/data.js`, {
      headers: { 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('無法取得資料');
    const json = await res.json();
    const raw = decodeURIComponent(escape(atob((json.content || '').replace(/\n/g, ''))));
    const data = parseDataJsContent(raw);
    if (!data) throw new Error('解析失敗');
    adminData = JSON.parse(JSON.stringify(data));
    if (!adminData.about && typeof siteData !== 'undefined') adminData.about = { ...siteData.about };
    saveData();
    renderAll();
    if (!silent) alert('已從 GitHub 載入最新資料');
  } catch (err) {
    if (!silent) alert('載入失敗：' + (err.message || err));
    else console.warn('自動從 GitHub 載入失敗:', err.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = origText || '📥 從 GitHub 載入最新'; }
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
  const btn = document.getElementById('publish-github-btn');
  const origText = btn?.textContent;
  if (btn) { btn.disabled = true; btn.textContent = '發布中...'; }
  try {
    const getRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/data.js`, {
      headers: { 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Authorization': `Bearer ${token}` }
    });
    let sha = null;
    let dataToPublish = adminData;
    if (getRes.ok) {
      const getJson = await getRes.json();
      sha = getJson.sha;
      try {
        const raw = decodeURIComponent(escape(atob((getJson.content || '').replace(/\n/g, ''))));
        const remote = parseDataJsContent(raw);
        if (remote) {
          dataToPublish = mergeDataLocalWithRemote(adminData, remote);
          const mergedCount = (dataToPublish.diary?.length || 0);
          const localCount = (adminData.diary?.length || 0);
          if (mergedCount > localCount) {
            console.log(`已合併遠端 ${mergedCount - localCount} 則新資料`);
          }
        }
      } catch (e) {
        console.warn('合併遠端資料時發生錯誤，將以本地資料發布:', e);
      }
    }
    if (getRes.status !== 404 && !getRes.ok) {
      const err = await getRes.json();
      throw new Error(err.message || '取得檔案失敗');
    }
    const content = `// ===== 夜桜の夢 — Site Content Database =====
// Generated: ${new Date().toLocaleString()}

const siteData = ${JSON.stringify(dataToPublish, null, 2)};

if (typeof module !== 'undefined') module.exports = siteData;`;
    const contentBase64 = btoa(unescape(encodeURIComponent(content)));
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
        if (btn.dataset.tab === 'export') updateStorageUsage();
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
  document.getElementById('reload-from-github-btn')?.addEventListener('click', loadFromGitHub);
  document.getElementById('reload-from-data-btn')?.addEventListener('click', () => {
    if (confirm('將清除後台快取，從 data.js 重新載入最新資料。未儲存的編輯會遺失，確定嗎？')) {
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    }
  });
  document.getElementById('merge-import-btn')?.addEventListener('click', () => {
    const ta = document.getElementById('merge-input');
    const resultEl = document.getElementById('merge-result');
    const raw = ta?.value?.trim();
    if (!raw) {
      resultEl.textContent = '請先貼上 data.js 內容';
      return;
    }
    try {
      const other = parseDataJsContent(raw);
      if (!other || !other.diary) {
        resultEl.textContent = '無法解析，請確認貼上的是完整的 data.js';
        return;
      }
      const beforeDiary = (adminData.diary || []).length;
      const beforeIds = new Set((adminData.diary || []).map(d => d.id));
      adminData = mergeTwoData(adminData, other);
      saveData();
      renderAll();
      const afterDiary = (adminData.diary || []).length;
      const added = afterDiary - beforeDiary;
      const newIds = (adminData.diary || []).filter(d => !beforeIds.has(d.id)).map(d => d.id);
      resultEl.textContent = `合併完成！日記 ${beforeDiary} → ${afterDiary}（新增 ${added} 則，id: ${newIds.join(', ') || '-'}）`;
      ta.value = '';
    } catch (e) {
      resultEl.textContent = '合併失敗：' + (e.message || e);
    }
  });
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
  setupWatermarkTool();
}

// ── 浮水印工具：上傳 → 加水印 → 下載（最多 5 張）──
const WATERMARK_MAX_FILES = 5;

function setupWatermarkTool() {
  const zone = document.getElementById('watermark-upload-zone');
  const fileInput = document.getElementById('watermark-file-input');
  const resultEl = document.getElementById('watermark-result');
  const previewsGrid = document.getElementById('watermark-previews-grid');
  const resetBtn = document.getElementById('watermark-reset-btn');
  if (!zone || !fileInput || !resultEl || !previewsGrid) return;

  let watermarkedFiles = [];
  let objectUrls = [];

  function processFiles(files) {
    const allImages = [...files].filter(f => f && f.type.startsWith('image/'));
    const imageFiles = allImages.slice(0, WATERMARK_MAX_FILES);
    if (imageFiles.length === 0) return;
    if (allImages.length > WATERMARK_MAX_FILES) {
      alert(`已限制為前 ${WATERMARK_MAX_FILES} 張圖片。`);
    }
    zone.classList.add('processing');
    zone.querySelector('.img-upload-text').textContent = `處理中（加浮水印）${imageFiles.length} 張...`;
    Promise.all(imageFiles.map(f => addWatermark(f))).then((results) => {
      watermarkedFiles = results;
      objectUrls.forEach(u => URL.revokeObjectURL(u));
      objectUrls = results.map(f => URL.createObjectURL(f));
      previewsGrid.innerHTML = '';
      results.forEach((file, i) => {
        const item = document.createElement('div');
        item.className = 'watermark-preview-item';
        const img = document.createElement('img');
        img.src = objectUrls[i];
        img.alt = '浮水印預覽';
        img.title = '點擊放大';
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-admin-primary';
        btn.textContent = '⬇ 下載';
        btn.onclick = () => {
          const a = document.createElement('a');
          a.href = objectUrls[i];
          a.download = 'watermarked-' + file.name;
          a.click();
        };
        item.appendChild(img);
        item.appendChild(btn);
        previewsGrid.appendChild(item);
        img.addEventListener('click', (e) => {
          e.stopPropagation();
          const lb = document.getElementById('watermark-lightbox');
          const lbImg = document.getElementById('watermark-lightbox-img');
          if (lb && lbImg) { lbImg.src = objectUrls[i]; lb.classList.add('open'); }
        });
      });
      zone.classList.add('hidden');
      zone.classList.remove('processing');
      zone.querySelector('.img-upload-text').textContent = '點擊或拖曳圖片到此（最多 5 張）';
      resultEl.classList.remove('hidden');
    }).catch((err) => {
      zone.classList.remove('processing');
      zone.querySelector('.img-upload-text').textContent = '點擊或拖曳圖片到此（最多 5 張）';
      alert('浮水印處理失敗：' + (err.message || err));
    });
  }

  zone.addEventListener('click', () => fileInput.click());
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.style.borderColor = 'var(--admin-gold)'; });
  zone.addEventListener('dragleave', () => { zone.style.borderColor = ''; });
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.style.borderColor = '';
    const files = e.dataTransfer?.files;
    if (files?.length) processFiles(files);
  });
  fileInput.addEventListener('change', (e) => {
    const files = e.target.files;
    if (files?.length) processFiles(files);
    e.target.value = '';
  });

  resetBtn?.addEventListener('click', () => {
    objectUrls.forEach(u => URL.revokeObjectURL(u));
    objectUrls = [];
    watermarkedFiles = [];
    previewsGrid.innerHTML = '';
    resultEl.classList.add('hidden');
    zone.classList.remove('hidden');
    fileInput.value = '';
  });

  const lightbox = document.getElementById('watermark-lightbox');
  const lightboxImg = document.getElementById('watermark-lightbox-img');
  lightbox?.addEventListener('click', () => lightbox.classList.remove('open'));
  lightboxImg?.addEventListener('click', (e) => e.stopPropagation());
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') lightbox?.classList.remove('open');
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
  tbody.innerHTML = [...adminData.girls].sort((a,b) => a.order - b.order).map(g => {
    const thumb = g.images?.[0] ?? g.image;
    return `
    <tr>
      <td>${g.order}</td>
      <td>${thumb ? `<img src="${thumb}" class="admin-thumb" onerror="this.style.display='none'">` : '-'}</td>
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
  `;
  }).join('');
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
  tbody.innerHTML = [...adminData.diary].sort((a,b) => getDiarySortKey(b).localeCompare(getDiarySortKey(a))).map(d => {
    const thumb = d.images?.[0] ?? d.thumbnail;
    return `
    <tr>
      <td>${thumb ? `<img src="${thumb}" class="admin-thumb-sm" onerror="this.style.display='none'">` : '-'}</td>
      <td><strong>${d.titleZh}</strong></td>
      <td>${d.category}</td>
      <td>${d.createdAt || d.date}</td>
      <td><span class="status-badge ${d.published ? 'status-active' : 'status-inactive'}">${d.published ? '發布' : '草稿'}</span></td>
      <td class="action-btns">
        <button class="btn-edit" onclick="openModal('diary', ${d.id})">編輯</button>
        <button class="btn-danger" onclick="deleteItem('diary', ${d.id})">刪除</button>
      </td>
    </tr>
  `;
  }).join('');
}

// ── Modal ──
function setupModals() {
  document.getElementById('admin-modal-close').addEventListener('click', closeModal);
  document.getElementById('admin-modal-overlay').addEventListener('click', closeModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-save').addEventListener('click', saveModal);
  document.getElementById('admin-modal-body').addEventListener('change', async (e) => {
    const fileInput = e.target;
    if (!fileInput.matches('.img-file-input') || !fileInput.files?.length) return;
    const box = fileInput.closest('.img-upload-box');
    const targetId = box?.dataset.target;
    if (!targetId || !box) return;
    const isMultiSlot = /^(f-diary-images|f-girl-images)-(\d)$/.exec(targetId);
    const files = Array.from(fileInput.files);
    if (files.length === 0) return;
    const key = localStorage.getItem(IMGBB_KEY_STORAGE);
    const prefix = isMultiSlot ? isMultiSlot[1] : null;
    const baseIndex = isMultiSlot ? parseInt(isMultiSlot[2], 10) : 0;

    async function processOneFile(file, slotIndex) {
      const tid = prefix ? `${prefix}-${slotIndex}` : targetId;
      const urlInput = document.getElementById(tid);
      const previewEl = document.getElementById(tid + '-preview');
      const slotBox = prefix ? document.querySelector(`[data-target="${tid}"]`) : box;
      const area = slotBox?.querySelector('.img-upload-area');
      if (!urlInput) return;

      function setPreviewAndUrl(url, showWatermarkHint) {
        urlInput.value = url;
        if (previewEl) {
          const hint = showWatermarkHint ? '<p class="img-watermark-hint">✓ 已加浮水印</p>' : '';
          previewEl.innerHTML = `<img src="${url}" alt="預覽">${hint}<button type="button" class="img-change-btn">更換圖片</button>`;
          previewEl.querySelector('.img-change-btn').onclick = () => {
            urlInput.value = '';
            previewEl.innerHTML = '';
            if (area) area.style.display = 'flex';
            const fi = document.getElementById(tid + '-file');
            if (fi) fi.value = '';
          };
        }
      }

      if (!key) {
        if (area) area.style.display = 'none';
        if (previewEl) previewEl.innerHTML = '<div class="img-uploading">處理中（加浮水印）...</div>';
        try {
          const watermarked = await addWatermark(file);
          await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result;
              if (dataUrl.length > 800000) {
                if (previewEl) previewEl.innerHTML = '';
                if (area) area.style.display = 'flex';
                alert('圖片過大，Base64 會讓 data.js 變大。建議壓縮或使用 ImgBB 上傳');
                reject(new Error('too large'));
                return;
              }
              setPreviewAndUrl(dataUrl, true);
              if (area) area.style.display = 'flex';
              resolve();
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(watermarked);
          });
        } catch (err) {
          if (err?.message !== 'too large') {
            if (area) area.style.display = 'flex';
            if (previewEl) previewEl.innerHTML = '';
            alert('浮水印處理失敗：' + (err?.message || err));
          }
        }
        return;
      }

      if (area) area.style.display = 'none';
      if (previewEl) previewEl.innerHTML = '<div class="img-uploading">處理中（加浮水印）...</div>';
      try {
        const watermarked = await addWatermark(file);
        const previewUrl = URL.createObjectURL(watermarked);
        if (previewEl) previewEl.innerHTML = `<img src="${previewUrl}" alt="浮水印預覽"><p class="img-watermark-hint">浮水印預覽 · 上傳中...</p><button type="button" class="img-change-btn" disabled>上傳中</button>`;
        const fd = new FormData();
        fd.append('key', key);
        fd.append('image', watermarked);
        const res = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: fd });
        const json = await res.json();
        URL.revokeObjectURL(previewUrl);
        if (json.data?.url) {
          setPreviewAndUrl(json.data.url, true);
        } else {
          if (area) area.style.display = 'flex';
          if (previewEl) previewEl.innerHTML = '';
          alert('上傳失敗：' + (json.error?.message || json.status || '未知錯誤'));
        }
      } catch (err) {
        if (area) area.style.display = 'flex';
        if (previewEl) previewEl.innerHTML = '';
        alert('上傳失敗：' + err.message);
      }
    }

    if (!key) {
      const useBase64 = confirm('尚未設定 ImgBB API Key。\n\n可選：\n• 按「確定」→ 使用 Base64 嵌入（無需 API，但會讓 data.js 變大）\n• 按「取消」→ 請至「設定」分頁填入 ImgBB Key，或直接貼上圖片網址\n\n取得免費 Key：https://api.imgbb.com/');
      if (!useBase64) { fileInput.value = ''; return; }
    }

    if (isMultiSlot && files.length > 1) {
      for (let i = 0; i < files.length && (baseIndex + i) < 3; i++) {
        await processOneFile(files[i], baseIndex + i);
      }
    } else {
      await processOneFile(files[0], baseIndex);
    }
    fileInput.value = '';
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
        <label>照片（選填，最多 3 張，列表會動態切換顯示）</label>
        <div class="diary-images-row">
          <div class="img-upload-box" data-target="f-girl-images-0">
            <label class="img-upload-area" for="f-girl-images-0-file">
              <span class="img-upload-icon">📷</span>
              <span class="img-upload-text">圖片 1</span>
            </label>
            <input type="file" id="f-girl-images-0-file" accept="image/*" class="img-file-input" multiple>
            <div class="img-upload-preview" id="f-girl-images-0-preview"></div>
            <input id="f-girl-images-0" value="${(item?.images?.[0] ?? item?.image ?? '').replace(/"/g,'&quot;')}" class="img-url-input" placeholder="上傳後自動填入">
          </div>
          <div class="img-upload-box" data-target="f-girl-images-1">
            <label class="img-upload-area" for="f-girl-images-1-file">
              <span class="img-upload-icon">📷</span>
              <span class="img-upload-text">圖片 2</span>
            </label>
            <input type="file" id="f-girl-images-1-file" accept="image/*" class="img-file-input" multiple>
            <div class="img-upload-preview" id="f-girl-images-1-preview"></div>
            <input id="f-girl-images-1" value="${(item?.images?.[1] ?? '').replace(/"/g,'&quot;')}" class="img-url-input" placeholder="上傳後自動填入">
          </div>
          <div class="img-upload-box" data-target="f-girl-images-2">
            <label class="img-upload-area" for="f-girl-images-2-file">
              <span class="img-upload-icon">📷</span>
              <span class="img-upload-text">圖片 3</span>
            </label>
            <input type="file" id="f-girl-images-2-file" accept="image/*" class="img-file-input" multiple>
            <div class="img-upload-preview" id="f-girl-images-2-preview"></div>
            <input id="f-girl-images-2" value="${(item?.images?.[2] ?? '').replace(/"/g,'&quot;')}" class="img-url-input" placeholder="上傳後自動填入">
          </div>
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
      <div class="form-group"><label>摘要(中)（選填，填寫後點「翻譯」自動產生日英文）</label><div class="input-row"><input id="f-excerptZh" value="${item?.excerptZh||''}" style="flex:1" placeholder="選填"><button type="button" class="btn-translate-all" data-ja="f-excerpt" data-zh="f-excerptZh" data-en="f-excerptEn" data-zh-only="true">翻譯到日英</button></div></div>
      <div class="form-group"><label>摘要(日)</label><input id="f-excerpt" value="${item?.excerpt||item?.excerptJa||''}" placeholder="翻譯後自動填入"></div>
      <div class="form-group"><label>摘要(英)</label><input id="f-excerptEn" value="${item?.excerptEn||''}" placeholder="翻譯後自動填入"></div>
      <div class="form-group"><label>內容(中)（必填，填寫後點「翻譯」自動產生日英文）</label><div class="input-row"><textarea id="f-contentZh" style="min-height:100px;flex:1" placeholder="輸入中文內容">${item?.contentZh||''}</textarea><button type="button" class="btn-translate-all" data-ja="f-contentJa" data-zh="f-contentZh" data-en="f-contentEn" data-zh-only="true">翻譯到日英</button></div></div>
      <div class="form-group"><label>內容(日)</label><textarea id="f-contentJa" style="min-height:100px" placeholder="翻譯後自動填入">${item?.contentJa||''}</textarea></div>
      <div class="form-group"><label>內容(英)</label><textarea id="f-contentEn" style="min-height:100px" placeholder="翻譯後自動填入">${item?.contentEn||''}</textarea></div>
      <div class="form-row">
        <div class="form-group"><label>分類</label><select id="f-category"><option ${item?.category==='出勤情報'?'selected':''}>出勤情報</option><option ${item?.category==='客戶反饋'?'selected':''}>客戶反饋</option><option ${item?.category==='日記'?'selected':''}>日記</option><option ${item?.category==='お知らせ'?'selected':''}>お知らせ</option></select></div>
        <div class="form-group"><label>建立時間(YYYY.M.D HH:mm:ss)</label><input id="f-date" value="${item?.createdAt||item?.date||getNowStr()}" placeholder="例：2026.3.18 17:30:45"></div>
      </div>
      <div class="form-group">
        <label>圖片（選填，最多 3 張，列表卡片會動態切換顯示）</label>
        <div class="diary-images-row">
          <div class="img-upload-box" data-target="f-diary-images-0">
            <label class="img-upload-area" for="f-diary-images-0-file">
              <span class="img-upload-icon">📷</span>
              <span class="img-upload-text">圖片 1</span>
            </label>
            <input type="file" id="f-diary-images-0-file" accept="image/*" class="img-file-input" multiple>
            <div class="img-upload-preview" id="f-diary-images-0-preview"></div>
            <input id="f-diary-images-0" value="${(item?.images?.[0] ?? item?.thumbnail ?? '').replace(/"/g,'&quot;')}" class="img-url-input" placeholder="上傳後自動填入">
          </div>
          <div class="img-upload-box" data-target="f-diary-images-1">
            <label class="img-upload-area" for="f-diary-images-1-file">
              <span class="img-upload-icon">📷</span>
              <span class="img-upload-text">圖片 2</span>
            </label>
            <input type="file" id="f-diary-images-1-file" accept="image/*" class="img-file-input" multiple>
            <div class="img-upload-preview" id="f-diary-images-1-preview"></div>
            <input id="f-diary-images-1" value="${(item?.images?.[1] ?? item?.image ?? '').replace(/"/g,'&quot;')}" class="img-url-input" placeholder="上傳後自動填入">
          </div>
          <div class="img-upload-box" data-target="f-diary-images-2">
            <label class="img-upload-area" for="f-diary-images-2-file">
              <span class="img-upload-icon">📷</span>
              <span class="img-upload-text">圖片 3</span>
            </label>
            <input type="file" id="f-diary-images-2-file" accept="image/*" class="img-file-input" multiple>
            <div class="img-upload-preview" id="f-diary-images-2-preview"></div>
            <input id="f-diary-images-2" value="${(item?.images?.[2] ?? '').replace(/"/g,'&quot;')}" class="img-url-input" placeholder="上傳後自動填入">
          </div>
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
  if (type === 'diary') setupDiaryFormHelpers(id);
  document.querySelectorAll('.img-upload-box').forEach(box => {
    const targetId = box.dataset.target;
    const urlInput = document.getElementById(targetId);
    const previewEl = document.getElementById(targetId + '-preview');
    const area = box.querySelector('.img-upload-area');
    const fileInput = box.querySelector('.img-file-input');
    if (urlInput?.value && previewEl && area) {
      area.style.display = 'none';
      const img = document.createElement('img');
      img.src = urlInput.value;
      img.alt = '預覽';
      img.onerror = () => { previewEl.innerHTML = ''; area.style.display = 'flex'; if (fileInput) fileInput.value = ''; };
      const changeBtn = document.createElement('button');
      changeBtn.type = 'button';
      changeBtn.className = 'img-change-btn';
      changeBtn.textContent = '更換圖片';
      changeBtn.onclick = () => {
        urlInput.value = '';
        previewEl.innerHTML = '';
        area.style.display = 'flex';
        if (fileInput) fileInput.value = '';
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
  const images = [0, 1, 2]
    .map(i => document.getElementById(`f-girl-images-${i}`)?.value?.trim() || '')
    .filter(Boolean);
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
    images: images.length ? images : undefined,
    image: images[0] || undefined,
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
  const category = document.getElementById('f-category')?.value;
  const titleZh = document.getElementById('f-titleZh')?.value || '';
  const titleJa = document.getElementById('f-titleJa')?.value || '';
  if (category === '出勤情報') {
    const num = extractBangouFromTitle(titleZh) || extractBangouFromTitle(titleJa);
    if (num != null) {
      const used = getUsedBangouList(editingId);
      if (used.includes(num)) {
        alert('該番號已被使用過，請更換其他番號。');
        return;
      }
    }
  }
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
  const images = [0, 1, 2]
    .map(i => document.getElementById(`f-diary-images-${i}`)?.value?.trim() || '')
    .filter(Boolean);
  const data = {
    titleJa: document.getElementById('f-titleJa').value,
    titleZh: document.getElementById('f-titleZh').value,
    titleEn: document.getElementById('f-titleEn').value,
    excerpt: document.getElementById('f-excerpt').value,
    excerptZh: document.getElementById('f-excerptZh').value,
    excerptEn: document.getElementById('f-excerptEn').value,
    contentJa: document.getElementById('f-contentJa').value,
    contentZh: document.getElementById('f-contentZh').value,
    contentEn: document.getElementById('f-contentEn').value,
    category: document.getElementById('f-category').value,
    date: (() => { const v = document.getElementById('f-date').value; return v ? v.split(' ')[0] : ''; })(),
    createdAt: document.getElementById('f-date').value || (editingId ? undefined : getNowStr()),
    images: images.length ? images : undefined,
    thumbnail: images[0] || undefined,
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
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

const GITHUB_REPO_LIMIT_MB = 1024;

async function updateStorageUsage() {
  const el = document.getElementById('storage-usage');
  if (!el) return;
  const output = `// ===== 夜桜の夢 — Site Content Database =====
// Generated: ${new Date().toLocaleString()}

const siteData = ${JSON.stringify(adminData, null, 2)};

if (typeof module !== 'undefined') module.exports = siteData;`;
  const sizeBytes = new Blob([output]).size;
  const dataStr = JSON.stringify(adminData);
  const base64Matches = dataStr.match(/data:image[^"]+/g) || [];
  const base64Count = base64Matches.length;
  const base64Size = base64Matches.reduce((sum, m) => sum + m.length, 0);
  const girls = (adminData.girls || []).length;
  const reviews = (adminData.reviews || []).length;
  const diary = (adminData.diary || []).length;
  const warn = sizeBytes > 5 * 1024 * 1024 ? ' ⚠️ 超過 5MB，建議將 Base64 圖片改為 ImgBB 上傳' : (sizeBytes > 1024 * 1024 ? ' ⚠️ 超過 1MB' : '');

  el.innerHTML = `<div class="storage-usage-inner">
    <strong>data.js 預估大小：</strong> ${formatBytes(sizeBytes)}${warn}<br>
    <span class="storage-detail">女孩 ${girls} 則 · 客評 ${reviews} 則 · 日記 ${diary} 則${base64Count ? ` · Base64 圖片 ${base64Count} 張（${formatBytes(base64Size)}）` : ''}</span>
    <br><span class="storage-detail">取得剩餘空間中…</span>
  </div>`;

  let remainingHtml = '';
  const token = localStorage.getItem(GITHUB_TOKEN_STORAGE);
  const repo = localStorage.getItem(GITHUB_REPO_STORAGE) || 'dukelester3/dream_of_cherry';
  if (token && repo) {
    try {
      const res = await fetch(`https://api.github.com/repos/${repo}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const usedKB = data.size || 0;
        const usedMB = usedKB / 1024;
        const remainingMB = Math.max(0, GITHUB_REPO_LIMIT_MB - usedMB);
        remainingHtml = `<br><strong>剩餘空間：</strong> 約 ${remainingMB.toFixed(1)} MB（倉庫已使用約 ${usedMB.toFixed(1)} MB / ${GITHUB_REPO_LIMIT_MB} MB 限制）`;
      } else {
        remainingHtml = '<br><span class="storage-detail">無法取得倉庫大小（請檢查 Token 權限）</span>';
      }
    } catch (e) {
      remainingHtml = '<br><span class="storage-detail">無法取得倉庫大小（請檢查網路或 Token）</span>';
    }
  } else {
    remainingHtml = '<br><span class="storage-detail">設定 GitHub Token 與倉庫後可顯示剩餘空間</span>';
  }

  el.innerHTML = `<div class="storage-usage-inner">
    <strong>data.js 預估大小：</strong> ${formatBytes(sizeBytes)}${warn}<br>
    <span class="storage-detail">女孩 ${girls} 則 · 客評 ${reviews} 則 · 日記 ${diary} 則${base64Count ? ` · Base64 圖片 ${base64Count} 張（${formatBytes(base64Size)}）` : ''}</span>
    ${remainingHtml}
  </div>`;
}

function generateExport() {
  const output = `// ===== 夜桜の夢 — Site Content Database =====
// Generated: ${new Date().toLocaleString()}

const siteData = ${JSON.stringify(adminData, null, 2)};

if (typeof module !== 'undefined') module.exports = siteData;`;

  document.getElementById('export-textarea').value = output;
  document.getElementById('export-output').classList.remove('hidden');
  updateStorageUsage();
}

// ── Start ──
init();
