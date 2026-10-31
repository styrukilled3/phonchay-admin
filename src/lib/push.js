// Thông báo đẩy (Web Push) cho owner. Máy chủ gửi qua Edge Function notify-owner (supabase/functions).
import { configured, supabase } from './auth.js'
import { authHeaders } from './sync.js'

const FN = `${supabase.url}/functions/v1/notify-owner`

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true

function keyToBytes(b64) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

// 'unsupported' | 'need-install' | 'blocked' | 'off' | 'on'
export async function pushState() {
  if (!configured || !('serviceWorker' in navigator)) return 'unsupported'
  if (isIOS() && !isStandalone()) return 'need-install' // iPhone chỉ nhận thông báo khi mở từ icon ở màn hình chính
  if (!('PushManager' in window) || !('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'denied') return 'blocked'
  try {
    const reg = await navigator.serviceWorker.getRegistration()
    const sub = await reg?.pushManager.getSubscription()
    return sub && Notification.permission === 'granted' ? 'on' : 'off'
  } catch {
    return 'off'
  }
}

export async function enablePush() {
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return perm === 'denied' ? 'blocked' : 'off'
  const reg = await navigator.serviceWorker.register('./sw.js')
  await navigator.serviceWorker.ready
  const r = await fetch(FN, { method: 'POST', headers: await authHeaders(), body: JSON.stringify({ action: 'public-key' }) })
  if (!r.ok) throw new Error(`key ${r.status}`)
  const { publicKey } = await r.json()
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(publicKey) }))
  const j = sub.toJSON()
  const s = await fetch(`${supabase.url}/rest/v1/push_subs?on_conflict=endpoint`, {
    method: 'POST',
    headers: { ...(await authHeaders()), Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth }),
  })
  if (!s.ok) throw new Error(`save ${s.status}`)
  return 'on'
}

export async function disablePush() {
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  if (!sub) return 'off'
  try {
    await fetch(`${supabase.url}/rest/v1/push_subs?endpoint=eq.${encodeURIComponent(sub.endpoint)}`, { method: 'DELETE', headers: await authHeaders() })
  } catch {
    /* bỏ qua, máy chủ sẽ tự xóa khi thiết bị hết hạn */
  }
  await sub.unsubscribe()
  return 'off'
}

// Nhân viên vừa lưu yêu cầu lấy hàng: báo máy chủ gửi thông báo cho owner
export async function notifyNewRequest(requestId) {
  await fetch(FN, { method: 'POST', headers: await authHeaders(), body: JSON.stringify({ action: 'notify', request_id: requestId }) })
}
