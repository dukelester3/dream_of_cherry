#!/usr/bin/env node
/**
 * 裁切 icon 空白邊緣，讓圖案更貼近內容，favicon 顯示時會更大
 * 使用：node scripts/trim-icon.js
 */
const sharp = require('sharp');
const path = require('path');

const inputPath = path.join(__dirname, '../icon/icon.png');
const outputPath = path.join(__dirname, '../icon/icon-trimmed.png');

sharp(inputPath)
  .trim({ threshold: 10 })
  .toFile(outputPath)
  .then(() => console.log('已儲存：icon/icon-trimmed.png'))
  .catch((err) => {
    console.error('裁切失敗：', err.message);
    process.exit(1);
  });
