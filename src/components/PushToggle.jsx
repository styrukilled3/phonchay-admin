import { useEffect, useState } from 'react'
import { disablePush, enablePush, pushState, testPush } from '../lib/push.js'

// Nút bật/tắt thông báo đẩy trên thiết bị này. Chỉ owner thấy.
export default function PushToggle({ variant, onMessage }) {
  const [st, setSt] = useState('loading')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    pushState().then((s) => alive && setSt(s))
    return () => {
      alive = false
    }
  }, [])

  if (st === 'loading' || st === 'unsupported') return null

  async function click() {
    if (busy) return
    if (st === 'need-install') {
      onMessage('Muốn nhận thông báo: mở app từ icon ở màn hình chính (Safari > Chia sẻ > Thêm vào Màn hình chính), rồi bật lại.')
      return
    }
    if (st === 'blocked') {
      onMessage('Thông báo đang bị chặn. Vào Cài đặt điện thoại > PHONCHAY > Thông báo để bật.')
      return
    }
    setBusy(true)
    try {
      const next = st === 'on' ? await disablePush() : await enablePush()
      setSt(next)
      if (next === 'on') onMessage('Đã bật thông báo trên thiết bị này.')
      if (next === 'blocked') onMessage('Thông báo đang bị chặn. Vào Cài đặt điện thoại để bật.')
    } catch {
      onMessage('Chưa bật được thông báo, thử lại sau.')
    }
    setBusy(false)
  }

  async function test() {
    if (busy) return
    setBusy(true)
    try {
      const r = await testPush()
      if (r.devices === 0) onMessage('Máy chủ chưa có thiết bị nào đăng ký. Tắt rồi bật lại thông báo.')
      else if (r.sent === 0) onMessage(`Có ${r.devices} thiết bị nhưng gửi chưa được${r.errors?.length ? ` (${r.errors[0]})` : ''}. Tắt rồi bật lại thông báo.`)
      else onMessage(`Đã gửi thử tới ${r.sent} thiết bị, đợi vài giây.`)
    } catch {
      onMessage('Không gọi được máy chủ gửi thông báo.')
    }
    setBusy(false)
  }

  if (variant === 'mobile' && st === 'on') {
    return (
      <button type="button" className="btn btn-secondary" onClick={test} disabled={busy}>
        Gửi thử thông báo
      </button>
    )
  }

  const label = busy ? 'Đang xử lý…' : st === 'on' ? 'Thông báo: bật (bấm để tắt)' : 'Bật thông báo'
  return (
    <>
      {st === 'on' && (
        <button type="button" className="link-btn" onClick={test} disabled={busy}>
          Gửi thử thông báo
        </button>
      )}
    <button type="button" className={variant === 'mobile' ? 'btn btn-secondary' : 'link-btn'} onClick={click} disabled={busy}>
      {variant === 'mobile' ? (st === 'on' ? 'Tắt thông báo' : 'Thông báo') : label}
    </button>
    </>
  )
}
