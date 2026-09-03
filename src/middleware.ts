import { defineMiddleware } from 'astro:middleware';
import esRedirects from './data/es-redirects.json';

// EasyStore（shop.winds.tw）舊網址 → winds.tw 新位置；2026-09-03 內容搬遷後啟用。
// 只攔 ES 專屬路徑前綴（winds.tw 本站沒有這些路徑），shop.winds.tw 路由掛上本 worker 後其餘一律導回 /shop/。
const MAP = new Map<string, string>(esRedirects as [string, string][]);
const ES_PREFIX = /^\/(blogs|pages|products|collections|cart|checkout|search)(\/|$)/;
const BASE = 'https://winds.tw';

export const onRequest = defineMiddleware((ctx, next) => {
  const { host, pathname } = ctx.url;
  const isShopHost = host === 'shop.winds.tw';
  if (!isShopHost && !ES_PREFIX.test(pathname)) return next();

  const p = pathname.replace(/\/+$/, '') || '/';
  let to = MAP.get(p);
  if (!to) {
    if (p.startsWith('/blogs')) to = '/blog/';
    else if (p.startsWith('/pages')) to = '/';
    else if (ES_PREFIX.test(p)) to = '/shop/';
    else if (isShopHost) to = '/shop/';
  }
  if (!to) return next();
  return new Response(null, { status: 301, headers: { Location: BASE + encodeURI(to) } });
});
