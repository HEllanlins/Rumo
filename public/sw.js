const V = 'rumo-v4'
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(['/offline.html', '/icon-192.png']))); self.skipWaiting() })
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())))
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url)
  if (r.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api/')) return
  if (r.mode === 'navigate') return e.respondWith(fetch(r).catch(() => caches.match('/offline.html')))
  e.respondWith(caches.match(r).then(h => h || fetch(r).then(res => { if (res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)) } return res })))
})
