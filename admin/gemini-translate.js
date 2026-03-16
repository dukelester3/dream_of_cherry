// ===== Gemini 翻譯模組 =====
// 專案 gen-lang-client-0879457781
(function() {
  function getApiKey() {
    return localStorage.getItem('yuyu_gemini_key') || (typeof GEMINI_API_KEY !== 'undefined' ? GEMINI_API_KEY : '');
  }
  // 每次呼叫時讀取，以支援後台設定
  const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

  window.translateWithGemini = async function(text, fromLang, toLang) {
    const key = getApiKey();
    if (!key || key === 'CHANGE_ME') {
      throw new Error('請在 config.js 設定 GEMINI_API_KEY，或於後台「設定」→ Gemini API Key 儲存');
    }
    if (!text || !text.trim()) {
      throw new Error('請先輸入要翻譯的內容');
    }

    const langNames = { ja: '日文', zh: '繁體中文', en: '英文' };
    let prompt;
    if (fromLang === 'ja' && toLang === 'en') {
      prompt = `將以下日文轉成羅馬拼音（romaji），不要翻譯成英文。只輸出羅馬拼音，不要加任何說明或引號。\n\n${text.trim()}`;
    } else if (fromLang === 'ja' && toLang === 'zh') {
      prompt = `將以下日文轉成繁體中文。翻譯時盡量保留日文中與中文共通的漢字寫法，假名轉成對應漢字，讓中文讀者能理解。只輸出結果，不要加任何說明或引號。\n\n${text.trim()}`;
    } else {
      prompt = `將以下${langNames[fromLang] || fromLang}翻譯成${langNames[toLang] || toLang}。只輸出翻譯結果，不要加任何說明或引號。\n\n${text.trim()}`;
    }

    const res = await fetch(API_URL + '?key=' + encodeURIComponent(key), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048
        }
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Gemini API 錯誤: ' + res.status);
    }

    const data = await res.json();
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!result) throw new Error('翻譯結果為空');
    return result;
  };
})();
