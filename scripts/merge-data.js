#!/usr/bin/env node
/**
 * 合併兩份 data.js，整合不同之處
 * 用法：node scripts/merge-data.js <檔案A> <檔案B> [輸出檔]
 * 範例：node scripts/merge-data.js data.js data-backup.js data-merged.js
 * 若未指定輸出檔，會輸出到 data-merged.js
 */

const fs = require('fs');
const path = require('path');

function parseDataJs(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  const fn = new Function(code + '; return typeof siteData !== "undefined" ? siteData : null;');
  return fn();
}

/** 與 diary-dates.js 一致：YYYY.M.D 未補零不可用字串排序 */
function diaryCreatedAtMs(d) {
  const s = (d.createdAt || (d.date ? d.date + ' 00:00:00' : '')).trim();
  if (!s) return 0;
  const m = s.match(/^(\d+)\.(\d+)\.(\d+)\s+(\d+):(\d+):(\d+)/);
  if (m) {
    const t = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]).getTime();
    return Number.isFinite(t) ? t : 0;
  }
  const m2 = s.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (m2) {
    const t = new Date(+m2[1], +m2[2] - 1, +m2[3]).getTime();
    return Number.isFinite(t) ? t : 0;
  }
  return 0;
}

function compareDiaryDesc(a, b) {
  const diff = diaryCreatedAtMs(b) - diaryCreatedAtMs(a);
  if (diff !== 0) return diff;
  return (b.id || 0) - (a.id || 0);
}

function mergeArrayById(arrA, arrB, preferNewer = true, sortKey = null) {
  const map = new Map();
  const add = (item) => {
    const id = item?.id;
    if (id == null) return;
    const existing = map.get(id);
    if (!existing) {
      map.set(id, { ...item });
      return;
    }
    if (preferNewer) {
      const dateA = existing.date || '';
      const dateB = item.date || '';
      const contentLenA = JSON.stringify(existing).length;
      const contentLenB = JSON.stringify(item).length;
      if (dateB > dateA || (dateB === dateA && contentLenB > contentLenA)) {
        map.set(id, { ...item });
      }
    } else {
      map.set(id, { ...item });
    }
  };
  (arrA || []).forEach(add);
  (arrB || []).forEach(add);
  let result = Array.from(map.values());
  if (sortKey === 'diary') {
    result.sort(compareDiaryDesc);
  } else if (result.some((x) => x.order != null)) {
    result.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  } else {
    result.sort((a, b) => (b.id || 0) - (a.id || 0));
  }
  return result;
}

function mergeAbout(a, b) {
  const merged = { ...a };
  if (!b) return merged;
  const photoSet = new Set([...(a?.photos || []), ...(b?.photos || [])]);
  merged.photos = [...photoSet];
  for (const key of Object.keys(b)) {
    if (key === 'photos') continue;
    const va = (a && a[key]) || '';
    const vb = (b && b[key]) || '';
    merged[key] = vb.length > va.length ? vb : va;
  }
  return merged;
}

function mergeData(dataA, dataB) {
  const diaryDeletedIds = [...new Set([...(dataA?.diaryDeletedIds || []), ...(dataB?.diaryDeletedIds || [])])];
  const deletedSet = new Set(diaryDeletedIds);
  const diaryMerged = mergeArrayById(dataA?.diary, dataB?.diary, true, 'diary');
  const diary = diaryMerged.filter((d) => !deletedSet.has(d.id));
  return {
    about: mergeAbout(dataA?.about, dataB?.about),
    girls: mergeArrayById(dataA?.girls, dataB?.girls),
    reviews: mergeArrayById(dataA?.reviews, dataB?.reviews),
    diary,
    ...(diaryDeletedIds.length ? { diaryDeletedIds } : {}),
  };
}

function main() {
  const args = process.argv.slice(2);
  const fileA = args[0] || 'data.js';
  const fileB = args[1];
  const outFile = args[2] || 'data-merged.js';

  if (!fileB) {
    console.log('用法：node scripts/merge-data.js <檔案A> <檔案B> [輸出檔]');
    console.log('範例：node scripts/merge-data.js data.js data-backup.js data-merged.js');
    process.exit(1);
  }

  const root = path.resolve(__dirname, '..');
  const pathA = path.isAbsolute(fileA) ? fileA : path.join(root, fileA);
  const pathB = path.isAbsolute(fileB) ? fileB : path.join(root, fileB);
  const pathOut = path.isAbsolute(outFile) ? outFile : path.join(root, outFile);

  if (!fs.existsSync(pathA)) {
    console.error('找不到檔案 A:', pathA);
    process.exit(1);
  }
  if (!fs.existsSync(pathB)) {
    console.error('找不到檔案 B:', pathB);
    process.exit(1);
  }

  const dataA = parseDataJs(pathA);
  const dataB = parseDataJs(pathB);
  if (!dataA || !dataB) {
    console.error('無法解析 data.js');
    process.exit(1);
  }

  const merged = mergeData(dataA, dataB);

  const output = `// ===== 夜桜の夢 — Site Content Database (合併) =====
// Generated: ${new Date().toLocaleString()}
// 合併自: ${fileA} + ${fileB}

const siteData = ${JSON.stringify(merged, null, 2)};

if (typeof module !== 'undefined') module.exports = siteData;`;

  fs.writeFileSync(pathOut, output, 'utf8');

  console.log('合併完成！');
  console.log('  檔案 A:', fileA, '→ diary:', dataA?.diary?.length || 0, '則');
  console.log('  檔案 B:', fileB, '→ diary:', dataB?.diary?.length || 0, '則');
  console.log('  合併後:', outFile, '→ diary:', merged.diary?.length || 0, '則');
  console.log('');
  console.log('請檢查', outFile, '無誤後，複製覆蓋 data.js 並推送到 GitHub');
}

main();
