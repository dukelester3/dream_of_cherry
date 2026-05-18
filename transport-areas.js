/**
 * 交通費／服務地區可選的行政區 id（與 i18n 鍵 area.<id>、首頁 #services…
 *
 * ── 東京 23 特別區（與陣列 tokyo 順序一致）──
 * • 預設「交通費價格列」有掛到金額的區：見下方 TRANSPORT_TOKYO_DEFAULT_PRICED_AREA_IDS（共 15 區）。
 * • 其餘 8 區預設未出現在交通費列，但仍在總清單內，後台可開通服務並勾進價格：
 *   ota, setagaya, suginami, itabashi, nerima, adachi, katsushika, edogawa
 *   （＝ TRANSPORT_TOKYO_EXTENDED_AREA_IDS）
 * • 實際「有服務」以 pricingTransport.tokyoServingAreas 為準；價格分區以 pricingTransport.tokyo 各列 areas 為準。
 *
 * ── 大阪（osaka 陣列：市轄 24 區 + higashiosaka）──
 * • 無舊站資料時，admin 內建 DEFAULT_PRICING_TRANSPORT_ADMIN 預設為兩檔交通費：
 *   - ¥4000：konohana, minato, taisho, nishi, abeno, fukushima, naniwa, tennoji, ikuno, kita, chuo,
 *            higashinari, miyakojima, joto（14 區）
 *   - ¥6000：nishiyodogawa, yodogawa, higashiyodogawa, asahi, tsurumi, suminoe, sumiyoshi,
 *            higashisumiyoshi, hirano, higashiosaka（10 區）
 * • 清單中的 nishinari（西成）預設未列入上兩檔之列，需在後台「服務區域」開通並在價格列指定。
 *
 * 之後若要「增加」區域：
 *   1. 在此檔對應城市的陣列尾端加入英文小寫 id（建議沿用郵便／官方拼字習慣，勿與另一城市重複 key）。
 *   2. 在 i18n.js 的 ja / zh / en 區塊各加一筆 'area.<id>': '…'。
 *   3. 在 index.html「服務地區」區塊加上 <span class="area-tag" data-area="<id>">…</span>
 *   4. 到後台「收費」→ 交通費：先在「服務區域」開通該 id，再在價格列底下勾選納入，儲存／匯出。
 *
 * 首頁 #services 的行政區標籤若 data.js 含 osakaServingAreas／tokyoServingAreas，
 *   會將「未開通」者以淡色顯示（與後台服務區域開關一致）。
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

/** 無自訂資料時「東京」交通費預設列僅掛這 15 區；其餘 8 區見 TRANSPORT_TOKYO_EXTENDED_AREA_IDS */
window.TRANSPORT_TOKYO_DEFAULT_PRICED_AREA_IDS = [
  'shinjuku', 'nakano', 'chiyoda', 'chuo', 'koto', 'shibuya', 'minato', 'meguro',
  'shinagawa', 'toshima', 'bunkyo', 'taito', 'sumida', 'arakawa', 'kita'
];

/** 東京 23 區中，預設未含在交通費價格列之 8 區（大田・世田谷・杉並・板橋・練馬・足立・葛飾・江戸川） */
window.TRANSPORT_TOKYO_EXTENDED_AREA_IDS = [
  'ota', 'setagaya', 'suginami', 'itabashi', 'nerima', 'adachi', 'katsushika', 'edogawa'
];
