/* Offline-first for a plane: everything the site needs is precached on first
   visit. Network-first when online (never stale), cache fallback when not. */
const CACHE = "tk-v3";
const CORE = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png"];
// every course item + conversation line ships its own mp3 — precache them all so audio works on the plane
const MODS = [["sounds", 10], ["polite", 15], ["survive", 12], ["numbers", 15], ["taxi", 12], ["hotel", 10], ["food", 14], ["work", 12], ["magic", 8], ["conv", 26]];
const AUDIO = MODS.flatMap(([id, n]) => Array.from({ length: n }, (_, i) => `audio/${id}-${i}.mp3`));

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
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
        return res;
      })
      .catch(async () => {
        const hit = await caches.match(e.request, { ignoreSearch: true });
        if (hit) return hit;
        if (e.request.mode === "navigate") return caches.match("index.html");
        return Response.error();
      })
  );
});
