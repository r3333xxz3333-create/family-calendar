// 家族カレンダーのサービスワーカー
// 通信できるときは毎回最新のページを取りに行き、つながらないときだけ前回の内容を出す。
// Apps Script や天気など、ほかのサイトへの通信には手を出さない。
const CACHE = 'famcal-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', ev => {
  ev.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', ev => {
  const req = ev.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  ev.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res.ok) {
        const copy = res.clone();
        ev.waitUntil(caches.open(CACHE).then(c => c.put(req, copy)));
      }
      return res;
    } catch (e) {
      const hit = await caches.match(req, { ignoreSearch: true });
      if (hit) return hit;
      throw e;
    }
  })());
});
