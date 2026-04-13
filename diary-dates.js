/**
 * 日記 createdAt / date 為「YYYY.M.D HH:mm:ss」（月日未補零），不可用字串排序。
 */
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
