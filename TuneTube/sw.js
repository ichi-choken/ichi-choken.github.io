// TubeTune service worker
// アプリ本体だけをキャッシュする．YouTube の API・動画・サムネイルはキャッシュせず，そのまま通信する．
const CACHE_VERSION = 'tubetune-v2';
const APP_SHELL = [
  './', './index.html', './terms.html', './privacy.html', './manifest.webmanifest',
  './styles/base.css', './styles/senior.css', './styles/exam.css',
  './js/main.js', './js/api.js', './js/channel-input.js', './js/config.js', './js/exam.js',
  './js/filters.js', './js/format.js', './js/pin.js', './js/player.js', './js/pwa.js',
  './js/quota.js', './js/settings.js', './js/storage.js', './js/ui.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then((c) => Promise.allSettled(APP_SHELL.map((u) => c.add(u))))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 外部（YouTube等）は触らない

  // アプリ本体（HTML・JS・CSS）はネット優先で最新を使い，失敗したらキャッシュ
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(async () => (await caches.match(req)) || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()))
  );
});
