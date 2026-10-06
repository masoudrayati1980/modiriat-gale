const CACHE = 'galleyar-v1'
const CORE = ['/', '/herd', '/reports', '/pens', '/backup', '/animals/new', '/animals/view', '/animals/edit']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(CORE).catch(() => undefined))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy))
        }
        return response
      })
      .catch(async () => {
        const cached = await caches.match(request, { ignoreSearch: request.mode === 'navigate' })
        if (cached) return cached
        if (request.mode === 'navigate') {
          const url = new URL(request.url)
          const fallback = await caches.match(url.pathname)
          if (fallback) return fallback
          return (await caches.match('/')) || Response.error()
        }
        return Response.error()
      }),
  )
})
