// 食悠餐桌收支系統 — Service Worker
// 只快取網頁外殼（HTML/icons），不快取 API 資料
// 資料一律即時連線 Google Apps Script，確保多裝置同步正確

const CACHE_NAME = 'shiyou-shell-v1';
const SHELL_FILES = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(SHELL_FILES);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  const url = e.request.url;

  // API 請求（Google Apps Script）一律走網路，絕不快取
  if (url.indexOf('script.google.com') !== -1) {
    return; // 不攔截，交給瀏覽器正常處理
  }

  // 網頁外殼：網路優先，失敗才用快取（離線時仍可開啟介面）
  e.respondWith(
    fetch(e.request)
      .then(function(res) {
        // 同時更新快取
        if (e.request.method === 'GET' && res.ok) {
          var resClone = res.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, resClone);
          });
        }
        return res;
      })
      .catch(function() {
        return caches.match(e.request);
      })
  );
});
