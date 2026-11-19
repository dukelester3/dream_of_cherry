#!/usr/bin/env node
/**
 * 月兔圖：去背（灰白棋盤／淺底）+ 圓形夜色藍底
 * 使用：node scripts/prepare-moon-rabbit.js
 */
const sharp = require('sharp');
const path = require('path');

const SIZE = 160;
const input = path.join(__dirname, '../icon/moon-rabbit.jpg');
const output = path.join(__dirname, '../icon/moon-rabbit.png');

function isBackground(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max - min;
  if (max > 210 && sat < 30) return true;
  if (max > 130 && max < 200 && sat < 22) return true;
  return false;
}

async function foregroundPng() {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (isBackground(r, g, b)) data[i + 3] = 0;
  }
  return sharp(data, { raw: { width, height, channels: 4 } })
    .trim({ threshold: 8 })
    .png()
    .toBuffer();
}

async function main() {
  const fgBuf = await foregroundPng();
  const nightBg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
      <defs>
        <radialGradient id="sky" cx="38%" cy="28%" r="72%">
          <stop offset="0%" stop-color="#6b85b5"/>
          <stop offset="50%" stop-color="#3d5278"/>
          <stop offset="100%" stop-color="#1a2845"/>
        </radialGradient>
      </defs>
      <circle cx="${SIZE / 2}" cy="${SIZE / 2}" r="${SIZE / 2}" fill="url(#sky)"/>
    </svg>`
  );
  const circleMask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
      <circle cx="${SIZE / 2}" cy="${SIZE / 2}" r="${SIZE / 2}" fill="#fff"/>
    </svg>`
  );

  const fgMeta = await sharp(fgBuf).metadata();
  const inner = Math.round(SIZE * 0.92);
  const resized = await sharp(fgBuf)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const rMeta = await sharp(resized).metadata();
  const left = Math.round((SIZE - rMeta.width) / 2);
  const top = Math.round((SIZE - rMeta.height) / 2);

  await sharp(await sharp(nightBg).png().toBuffer())
    .composite([{ input: resized, left, top }])
    .composite([{ input: circleMask, blend: 'dest-in' }])
    .png()
    .toFile(output);

  console.log('已儲存：', output);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});