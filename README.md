# 夜桜の夢 — 東京出張サービス

日本発・完全予約制の高級出張サービス網站。

## 技術

- 純靜態網站（HTML / CSS / JavaScript）
- 無需後端，可部署至 GitHub Pages 免費託管

---

## 部署到 GitHub Pages（免費）

### 1. 建立儲存庫

1. 登入 [GitHub](https://github.com)
2. 點 **New repository**
3. 名稱例如：`yozakura` 或 `yuyu`
4. 選 Public，建立

### 2. 上傳程式碼

在專案目錄執行：

```bash
cd /Users/arseneliao/Documents/yuyu

git init
git add .
git commit -m "Initial commit: 夜桜の夢 網站"
git branch -M main
git remote add origin https://github.com/你的帳號/你的儲存庫名.git
git push -u origin main
```

### 3. 開啟 GitHub Pages

1. 儲存庫 → **Settings** → **Pages**
2. Source 選 **Deploy from a branch**
3. Branch 選 `main`，資料夾選 `/ (root)`
4. 儲存

幾分鐘後網站會出現在：

```
https://你的帳號.github.io/你的儲存庫名/
```

---

## 日常維護流程

### 更新內容

1. 編輯 `data.js`（女孩、日記、客評等）
2. 或點擊右上角「夜桜の夢」登入後台編輯
3. 後台修改後需在「匯出資料」複製內容，貼回 `data.js`

### 推送更新

```bash
git add .
git commit -m "更新：描述你的修改"
git push
```

GitHub Pages 會自動重新部署，約 1–2 分鐘後生效。

---

## 專案結構

```
yuyu/
├── index.html          # 首頁
├── data.js             # 內容資料（女孩、日記、客評）
├── main.js             # 主要邏輯
├── i18n.js             # 多語系
├── styles.css          # 樣式
├── map.js              # 地圖
├── admin/              # 後台管理
│   ├── index.html
│   ├── app.js
│   └── admin.css
├── hot/                # 人気出勤圖片
├── feedback/           # 客戶反饋圖片
├── picture/            # 關於我們、Hero 圖片
├── attendance/         # 出勤資訊縮圖
└── diary/              # 日記縮圖
```

---

## 後台登入

- 點擊右上角「夜桜の夢」→ 輸入密碼
- 預設密碼請見 `main.js` 與 `admin/app.js` 中的 `ADMIN_PASSWORD`

---

## 本地預覽

```bash
npx serve .
# 或
npm start
```

開啟 http://localhost:3000
