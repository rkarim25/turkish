/* Offline-first for a plane: everything the site needs is precached on first
   visit. Serving strategy: CACHE-FIRST with background refresh (stale-while-
   revalidate) — pages open instantly from the device, and the cache quietly
   updates from the network; a new deploy is picked up one load later. This
   replaced network-first, which made every load wait on a network round-trip
   and felt slow on mobile. */
const CACHE = "tk-v7";
const CORE = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png",
  "articles/culture.html", "articles/history.html"];
// every item, conversation line and Core-31 sentence ships TWO mp3s (normal + slow) — all precached
const MODS = [["sounds", 10], ["polite", 15], ["survive", 12], ["numbers", 15], ["taxi", 12], ["hotel", 10], ["food", 14], ["work", 12], ["magic", 8], ["conv", 26], ["core", 31]];
const AUDIO = MODS.flatMap(([id, n]) => Array.from({ length: n }, (_, i) => [`audio/${id}-${i}.mp3`, `audio/${id}-${i}-slow.mp3`]).flat());

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c =>
    c.addAll(CORE).then(() => Promise.allSettled(AUDIO.map(u => c.add(u)))) // audio best-effort: one miss must not block install
  ).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith((async () => {
    const cached = await caches.match(e.request, { ignoreSearch: true });
    const refresh = fetch(e.request).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => null);
    if (cached) { e.waitUntil(refresh.then(() => {}).catch(() => {})); return cached; } // instant, refresh behind
    const res = await refresh;
    if (res) return res;
    if (e.request.mode === "navigate") return caches.match("index.html");
    return Response.error();
  })());
});
