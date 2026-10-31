// Đăng nhập. Có VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY thì gọi thẳng API Auth của Supabase (GoTrue)
// bằng fetch, không cần thêm thư viện. Thiếu hai biến đó thì chạy chế độ thử: ai cũng vào được,
// KHÔNG phải bảo mật thật, giao diện có ghi rõ.
const URL_BASE = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const configured = Boolean(URL_BASE && ANON)

const STORE = 'phonchay-session'

function readStore(area) {
  try {
    return JSON.parse(area.getItem(STORE))
  } catch {
    return null
  }
}

function writeSession(s, remember) {
  try {
    // Ghi nhớ thiết bị: giữ qua lần đóng trình duyệt. Không thì chỉ giữ trong tab.
    ;(remember ? localStorage : sessionStorage).setItem(STORE, JSON.stringify({ ...s, remember }))
    ;(remember ? sessionStorage : localStorage).removeItem(STORE)
  } catch {
    /* trình duyệt chặn lưu: vẫn đăng nhập được trong phiên này */
  }
}

function clearStore() {
  try {
    localStorage.removeItem(STORE)
    sessionStorage.removeItem(STORE)
  } catch {
    /* bỏ qua */
  }
}

// Quyền lấy từ app_metadata (chỉ owner/admin database sửa được), không lấy từ user_metadata vì người dùng tự sửa được.
function roleOf(user) {
  return user?.app_metadata?.role === 'owner' ? 'owner' : 'staff'
}

function toSession(data) {
  return {
    email: data.user?.email ?? '',
    role: roleOf(data.user),
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at ?? Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600),
  }
}

async function call(path, { method = 'POST', body, token } = {}) {
  const res = await fetch(`${URL_BASE}/auth/v1/${path}`, {
    method,
    headers: {
      apikey: ANON,
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  let data = null
  try {
    data = await res.json()
  } catch {
    /* thân rỗng */
  }
  return { ok: res.ok, status: res.status, data }
}

// Khôi phục phiên khi mở app. Hết hạn thì thử làm mới bằng refresh_token.
export async function restore() {
  const s = readStore(localStorage) ?? readStore(sessionStorage)
  if (!s) return null
  if (!configured) return s.email ? s : null
  if (s.expires_at - 30 > Date.now() / 1000) return s
  try {
    const r = await call('token?grant_type=refresh_token', { body: { refresh_token: s.refresh_token } })
    if (!r.ok) throw new Error('refresh')
    const next = toSession(r.data)
    writeSession(next, Boolean(s.remember))
    return next
  } catch {
    clearStore()
    return null
  }
}

export async function signIn(email, password, remember) {
  const mail = email.trim().toLowerCase()
  if (!configured) {
    if (password.length < 6) return { ok: false, message: 'Email hoặc mật khẩu không đúng. Kiểm tra lại rồi thử lại.' }
    const s = { email: mail, role: mail.startsWith('owner') ? 'owner' : 'staff', demo: true }
    writeSession(s, remember)
    return { ok: true, session: s }
  }
  try {
    const r = await call('token?grant_type=password', { body: { email: mail, password } })
    if (!r.ok) {
      // Không nói sai email hay sai mật khẩu
      const msg = r.status === 400 || r.status === 401 ? 'Email hoặc mật khẩu không đúng. Kiểm tra lại rồi thử lại.' : 'Máy chủ đang lỗi. Thử lại sau ít phút.'
      return { ok: false, message: msg }
    }
    const s = toSession(r.data)
    writeSession(s, remember)
    return { ok: true, session: s }
  } catch {
    return { ok: false, message: 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.' }
  }
}

// Luôn báo đã gửi, kể cả email không tồn tại, để không lộ email nào có tài khoản.
export async function requestReset(email) {
  if (!configured) return { ok: true }
  try {
    const redirect = encodeURIComponent(window.location.origin + window.location.pathname)
    await call(`recover?redirect_to=${redirect}`, { body: { email: email.trim().toLowerCase() } })
    return { ok: true }
  } catch {
    return { ok: false, message: 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.' }
  }
}

// Link trong email đặt lại mật khẩu quay về app kèm #access_token=...&type=recovery
export function takeRecoveryToken() {
  const h = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  if (h.get('type') !== 'recovery' || !h.get('access_token')) return null
  const token = h.get('access_token')
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
  return token
}

export async function setPassword(token, password) {
  if (!configured) return { ok: true }
  try {
    const r = await call('user', { method: 'PUT', token, body: { password } })
    if (!r.ok) return { ok: false, message: 'Link đã hết hạn hoặc mật khẩu quá yếu. Xin link mới rồi thử lại.' }
    return { ok: true }
  } catch {
    return { ok: false, message: 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.' }
  }
}

export async function signOut(session) {
  clearStore()
  if (configured && session?.access_token) {
    try {
      await call('logout', { token: session.access_token })
    } catch {
      /* phiên local đã xóa là đủ */
    }
  }
}
