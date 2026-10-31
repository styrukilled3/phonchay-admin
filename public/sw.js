// Service worker tối thiểu để trình duyệt cho cài app lên màn hình chính.
// Không cache gì: luôn lấy bản mới nhất từ mạng, nên không bao giờ kẹt bản cũ và dữ liệu luôn là dữ liệu thật.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
self.addEventListener('fetch', () => {})
