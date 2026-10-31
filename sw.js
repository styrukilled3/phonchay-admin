// Service worker: (1) cho trình duyệt cho cài app lên màn hình chính, (2) nhận thông báo đẩy.
// Không cache gì: luôn lấy bản mới nhất từ mạng, nên không bao giờ kẹt bản cũ và dữ liệu luôn là dữ liệu thật.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
self.addEventListener('fetch', () => {})

self.addEventListener('push', (e) => {
  let d = {}
  try {
    d = e.data.json()
  } catch {
    d = { title: 'PHONCHAY', body: e.data ? e.data.text() : '' }
  }
  e.waitUntil(
    self.registration.showNotification(d.title || 'PHONCHAY', {
      body: d.body,
      icon: 'icon-192.png',
      badge: 'icon-192.png',
      tag: d.tag,
      data: { url: d.url || './' },
    }),
  )
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  e.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const c of all) {
        if ('focus' in c) {
          await c.focus()
          return
        }
      }
      await self.clients.openWindow(e.notification.data?.url || './')
    })(),
  )
})
