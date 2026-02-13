// sw.js - 极简缓存策略
const CACHE_NAME = 'zs-mark-v1.2';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/global.css',
    './js/main.js',
    './apps/desktop/index.js',
    './apps/desktop/style.css',
    './apps/desktop/template.html',
    // 如果有新的 App，记得加到这里，或者只缓存核心框架
];

// 安装：缓存核心文件
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
});

// 拦截请求：有缓存用缓存，没缓存去网络请求
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => response || fetch(e.request))
    );
});
