// 浮水印共用設定（admin 與 demo-watermark.html 一致）
// sizeDivisor：越小 logo 越大（目前 2.4；右 3.7%、底 4.3%）
// padBottomRatio > padRightRatio：2:3 直式圖右側留白較多，底部需多一點距離才協調
const WATERMARK_DEFAULTS = {
  sizeDivisor: 2.4,
  padRightRatio: 0.037,
  padBottomRatio: 0.043,
  minPadRight: 8,
  minPadBottom: 14
};

const WATERMARK_CROP_ASPECT = 2 / 3;

function computeWatermarkLayout(outW, outH, logoImg, cfg) {
  const cellW = outW / cfg.sizeDivisor;
  const cellH = outH / cfg.sizeDivisor;
  let logoW, logoH;
  if (logoImg.width / logoImg.height >= cellW / cellH) {
    logoW = cellW;
    logoH = (logoImg.height / logoImg.width) * logoW;
  } else {
    logoH = cellH;
    logoW = (logoImg.width / logoImg.height) * logoH;
  }
  const padRight = Math.max(cfg.minPadRight, Math.round(outW * cfg.padRightRatio));
  const padBottom = Math.max(cfg.minPadBottom, Math.round(outH * cfg.padBottomRatio));
  const x = outW - logoW - padRight;
  const y = outH - logoH - padBottom;
  return { logoW, logoH, x, y, padRight, padBottom };
}

function applyWatermarkToImage(file, logoSrc, options = {}) {
  const cfg = { ...WATERMARK_DEFAULTS, ...options };
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const imgRatio = img.width / img.height;
      let outW, outH, sx, sy, sw, sh;
      if (imgRatio > WATERMARK_CROP_ASPECT) {
        outH = img.height;
        outW = Math.round(img.height * WATERMARK_CROP_ASPECT);
        sx = Math.round((img.width - outW) / 2);
        sy = 0;
        sw = outW;
        sh = img.height;
      } else if (imgRatio < WATERMARK_CROP_ASPECT) {
        outW = img.width;
        outH = Math.round(img.width / WATERMARK_CROP_ASPECT);
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
        const { logoW, logoH, x, y } = computeWatermarkLayout(outW, outH, logoImg, cfg);
        ctx.globalAlpha = 1;
        ctx.drawImage(logoImg, x, y, logoW, logoH);
        const outMime = file.type && file.type.startsWith('image/') ? file.type : 'image/jpeg';
        canvas.toBlob(blob => {
          URL.revokeObjectURL(objectUrl);
          if (blob && blob.size > 0) {
            resolve(new File([blob], file.name, { type: blob.type || outMime }));
          } else resolve(file);
        }, outMime, 0.92);
      };
      logoImg.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
      logoImg.src = logoSrc;
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
    img.src = objectUrl;
  });
}

if (typeof window !== 'undefined') {
  window.WATERMARK_DEFAULTS = WATERMARK_DEFAULTS;
  window.WATERMARK_CROP_ASPECT = WATERMARK_CROP_ASPECT;
  window.computeWatermarkLayout = computeWatermarkLayout;
  window.applyWatermarkToImage = applyWatermarkToImage;
}
