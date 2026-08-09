/* GEII Lab — minimal offline app-shell cache.
   Only activates when served over http(s); harmless no-op file otherwise. */
const CACHE = "geii-lab-v9";
const SHELL = [
  "./", "./index.html", "./styles-v9.css", "./store-v6.jsx", "./icons.jsx", "./shared-fixed.jsx",
  "./logo.jsx", "./molecule-atom-v3.jsx", "./dashboard-v6.jsx", "./tasks.jsx", "./pomodoro-final.jsx",
  "./revisions.jsx", "./exams.jsx", "./entreprise.jsx", "./media-embed.jsx", "./stats.jsx", "./settings-v2.jsx",
  "./onboarding.jsx", "./auth.jsx", "./cloud-sync.jsx", "./supabase-config.js",
  "./app-v5.jsx", "./manifest.webmanifest"
];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => cached))
  );
});
