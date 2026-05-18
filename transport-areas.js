/**
 * 交通費／服務地區可選的行政區 id（與 i18n 鍵 area.<id>、首頁 #services…
 *
 * 東京：23 特別區（全列出；是否在收費頁掛價格由後台 pricingTransport 決定）
 * 大阪：大阪市 24 區 + 東大阪市（東大阪為府內單一市，非大阪市辖区）
 *
 * 之後若要「增加」區域：
 *   1. 在此檔對應城市的陣列尾端加入英文小寫 id（建議沿用郵便／官方拼字習慣，勿與另一城市重複 key）。
 *   2. 在 i18n.js 的 ja / zh / en 區塊各加一筆 'area.<id>': '…'。
 *   3. 在 index.html「服務地區」區塊加上 <span class="area-tag" data-area="<id>">…</span>
 *   4. 到後台「收費」→ 交通費，把新區域點選進適當的價格列，再儲存／匯出。
 *
 * 若要「刪除」區域：見以下反向操作；已發佈的 data.js 內舊 id 會在載入時被 normalize 濾除。
 */
window.PRICING_TRANSPORT_AREA_IDS = {
  osaka: [
    'miyakojima', 'fukushima', 'konohana', 'nishi', 'minato', 'taisho', 'tennoji', 'naniwa',
    'nishiyodogawa', 'higashiyodogawa', 'higashinari', 'ikuno', 'asahi', 'joto', 'abeno',
    'sumiyoshi', 'higashisumiyoshi', 'nishinari', 'yodogawa', 'tsurumi', 'suminoe', 'hirano',
    'kita', 'chuo',
    'higashiosaka'
  ],
  tokyo: [
    'chiyoda', 'chuo', 'minato', 'shinjuku', 'bunkyo', 'taito', 'sumida', 'koto',
    'shinagawa', 'meguro', 'ota', 'setagaya', 'shibuya', 'nakano', 'suginami',
    'toshima', 'kita', 'arakawa', 'itabashi', 'nerima', 'adachi', 'katsushika', 'edogawa'
  ]
};

/** 無自訂資料時「東京」交通費預設列僅掛這些區；其餘 23 區可後台點選後再納入 */
window.TRANSPORT_TOKYO_DEFAULT_PRICED_AREA_IDS = [
  'shinjuku', 'nakano', 'chiyoda', 'chuo', 'koto', 'shibuya', 'minato', 'meguro',
  'shinagawa', 'toshima', 'bunkyo', 'taito', 'sumida', 'arakawa', 'kita'
];
