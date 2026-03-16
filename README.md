# 夜桜の夢

日本発・完全予約制の高級出張サービス網站。

## 技術

靜態網站（HTML / CSS / JavaScript），可部署至 GitHub Pages。

## 首次設定

編輯 `config.js` 將 `CHANGE_ME` 改為你的後台密碼。若含真實密碼，請勿提交至 Git。

## 本地預覽

```bash
npm start
```

開啟 http://localhost:3000

## 更新內容

1. 登入後台（點右上角「夜桜の夢」）→ 編輯 → 匯出資料
2. 將匯出內容貼回 `data.js`
3. `git push` 更新網站

## 敏感資料

- 後台密碼：請在 `config.js` 設定，勿提交
- 照片：建議使用後台「選擇上傳」存至 ImgBB，避免敏感照片進入專案
