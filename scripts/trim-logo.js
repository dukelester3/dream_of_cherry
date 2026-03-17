#!/usr/bin/env node
/**
 * 裁切 logo 空白邊緣，只保留圖案部分
 * 使用：node scripts/trim-logo.js
 */
const sharp = require('sharp');
const path = require('path');

const inputPath = path.join(__dirname, '../logo/logo.png');
const outputPath = path.join(__dirname, '../logo/logo-trimmed.png');

sharp(inputPath)
  .trim({ threshold: 10 })
  .toFile(outputPath)
  .then(() => console.log('已儲存：logo/logo-trimmed.png'))
  .catch((err) => {
    console.error('裁切失敗：', err.message);
    process.exit(1);
  });
