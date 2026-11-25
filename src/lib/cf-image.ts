// Cloudflare 圖片縮放（2026-11-25 Jeffery 在後台開 winds.tw 的「轉換」）：
// 原圖不動，經 /cdn-cgi/image/ 縮到指定寬度、自動換 AVIF／WebP。只處理 winds.tw 自家網域的圖。
// 每月免費 5,000 種「圖×尺寸」，用完新圖會失敗 → 搭配 cfImgFallback 讓 <img> 退回原圖。
const OWN = /^https:\/\/(?:(?:wp|cdn)\.)?winds\.tw\//;

export function cfImg(url: string | undefined | null, width: number): string {
  if (!url || !OWN.test(url)) return url || '';
  return `/cdn-cgi/image/width=${width},quality=80,format=auto/${url}`;
}

/** 放在 <img onerror> 的字串：縮圖失敗就換回原圖（只換一次）。 */
export function cfImgFallback(url: string | undefined | null): string | undefined {
  if (!url || !OWN.test(url)) return undefined;
  return `this.onerror=null;this.src=${JSON.stringify(url).replace(/"/g, "'")}`;
}
