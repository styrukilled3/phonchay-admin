import { useEffect, useRef, useState } from 'react'
import Logo from '../components/Logo.jsx'
import { configured, requestReset, setPassword, signIn } from '../lib/auth.js'
import '../styles/login.css'

const BAD_LOGIN = 'Email hoặc mật khẩu không đúng. Kiểm tra lại rồi thử lại.'

function Brand({ size }) {
  return (
    <>
      <Logo className="lg-star" size={size} />
      <span className="lg-word">PHONCHAY</span>
    </>
  )
}

function ErrorBox({ children }) {
  return (
    <div className="lg-alert" role="alert">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M9 5v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="9" cy="12.6" r="0.9" fill="currentColor" />
      </svg>
      <span>{children}</span>
    </div>
  )
}

export default function Login({ onSignedIn, recoveryToken, onRecovered }) {
  const [view, setView] = useState(recoveryToken ? 'reset' : 'login') // login | forgot | sent | reset
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const emailRef = useRef(null)
  const pwRef = useRef(null)
  const firstLoad = useRef(true)

  // Focus ô đầu của mỗi màn. Lần mở đầu tiên chờ intro chạy xong (card hiện lúc 1,5s).
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const wait = firstLoad.current && !reduce ? 1700 : 0
    firstLoad.current = false
    const t = setTimeout(() => (view === 'reset' ? pwRef : emailRef).current?.focus(), wait)
    return () => clearTimeout(t)
  }, [view])

  function go(next) {
    setError('')
    setShow(false)
    setView(next)
  }

  async function submitLogin(e) {
    e.preventDefault()
    if (busy) return
    setError('')
    if (!email.trim() || !pw) {
      setError('Nhập email và mật khẩu.')
      return
    }
    setBusy(true)
    const r = await signIn(email, pw, remember)
    setBusy(false)
    if (r.ok) {
      onSignedIn(r.session)
      return
    }
    // Giữ email, xóa mật khẩu, đưa con trỏ về ô mật khẩu
    setError(r.message || BAD_LOGIN)
    setPw('')
    pwRef.current?.focus()
  }

  async function submitForgot(e) {
    e.preventDefault()
    if (busy) return
    setError('')
    if (!email.trim()) {
      setError('Nhập email tài khoản.')
      return
    }
    setBusy(true)
    const r = await requestReset(email)
    setBusy(false)
    if (r.ok) go('sent')
    else setError(r.message)
  }

  async function submitReset(e) {
    e.preventDefault()
    if (busy) return
    setError('')
    if (pw.length < 8) {
      setError('Mật khẩu mới cần ít nhất 8 ký tự.')
      return
    }
    if (pw !== pw2) {
      setError('Hai mật khẩu chưa giống nhau.')
      return
    }
    setBusy(true)
    const r = await setPassword(recoveryToken, pw)
    setBusy(false)
    if (!r.ok) {
      setError(r.message)
      return
    }
    setPw('')
    setPw2('')
    onRecovered?.()
    go('login')
  }

  const pwField = (id, label, value, set, ref, auto) => (
    <div className="lg-field">
      <label htmlFor={id}>{label}</label>
      <div className="lg-pw">
        <input
          id={id}
          ref={ref}
          type={show ? 'text' : 'password'}
          autoComplete={auto}
          placeholder="Nhập mật khẩu"
          value={value}
          aria-invalid={error && view === 'login' ? 'true' : undefined}
          onChange={(e) => set(e.target.value)}
        />
        <button type="button" className="lg-toggle" aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShow((s) => !s)}>
          {show ? 'Ẩn' : 'Hiện'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="lg">
      <div className="lg-glow lg-glow-1" aria-hidden="true" />
      <div className="lg-glow lg-glow-2" aria-hidden="true" />
      <svg className="lg-ring" viewBox="0 0 200 200" aria-hidden="true">
        <circle cx="100" cy="100" r="88" fill="none" stroke="#fff" strokeOpacity="0.14" strokeWidth="16" pathLength="360" strokeDasharray="1.6 4.4" />
        <circle className="lg-ring-in" cx="100" cy="100" r="68" fill="none" stroke="#fff" strokeOpacity="0.07" strokeWidth="10" pathLength="360" strokeDasharray="1.2 4.8" />
      </svg>

      <div className="lg-intro" aria-hidden="true">
        <Logo className="lg-intro-star" size={220} />
        <span>PHON CHAY</span>
      </div>

      <div className="lg-top">
        <Brand size={52} />
      </div>

      <main className="lg-card">
        <div className="lg-brand">
          <Brand size={44} />
        </div>

        {view === 'login' && (
          <>
            <header>
              <h1>Đăng nhập</h1>
              <p>Dùng tài khoản do owner cấp.</p>
            </header>
            {error && <ErrorBox>{error}</ErrorBox>}
            <form onSubmit={submitLogin} noValidate>
              <div className="lg-field">
                <label htmlFor="lg-email">Email</label>
                <input
                  id="lg-email"
                  ref={emailRef}
                  type="email"
                  autoComplete="username"
                  placeholder="ten@phonchay.vn"
                  value={email}
                  aria-invalid={error ? 'true' : undefined}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {pwField('lg-pw', 'Mật khẩu', pw, setPw, pwRef, 'current-password')}
              <div className="lg-row">
                <label className="lg-check">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  Ghi nhớ thiết bị
                </label>
                <button type="button" className="lg-link" onClick={() => go('forgot')}>
                  Quên mật khẩu?
                </button>
              </div>
              <button type="submit" className="lg-btn" disabled={busy}>
                {busy ? 'Đang đăng nhập…' : 'Đăng nhập'}
              </button>
            </form>
          </>
        )}

        {view === 'forgot' && (
          <>
            <header>
              <h1>Quên mật khẩu</h1>
              <p>Nhập email tài khoản. Link đặt lại mật khẩu sẽ gửi vào hộp thư.</p>
            </header>
            {error && <ErrorBox>{error}</ErrorBox>}
            <form onSubmit={submitForgot} noValidate>
              <div className="lg-field">
                <label htmlFor="lg-email">Email</label>
                <input
                  id="lg-email"
                  ref={emailRef}
                  type="email"
                  autoComplete="username"
                  placeholder="ten@phonchay.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button type="submit" className="lg-btn" disabled={busy}>
                {busy ? 'Đang gửi…' : 'Gửi link đặt lại'}
              </button>
              <button type="button" className="lg-back" onClick={() => go('login')}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M13 8H4M7.5 4.5L4 8l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Quay lại đăng nhập
              </button>
            </form>
          </>
        )}

        {view === 'sent' && (
          <>
            <header>
              <h1>Đã gửi link</h1>
              <p>
                Nếu <b>{email.trim()}</b> có tài khoản, link đặt lại mật khẩu đã nằm trong hộp thư. Không thấy thì kiểm tra thư rác, hoặc nhờ owner đặt lại giúp.
              </p>
            </header>
            <button type="button" className="lg-btn" onClick={() => go('login')}>
              Về đăng nhập
            </button>
          </>
        )}

        {view === 'reset' && (
          <>
            <header>
              <h1>Đặt mật khẩu mới</h1>
              <p>Tối thiểu 8 ký tự.</p>
            </header>
            {error && <ErrorBox>{error}</ErrorBox>}
            <form onSubmit={submitReset} noValidate>
              {pwField('lg-new', 'Mật khẩu mới', pw, setPw, pwRef, 'new-password')}
              {pwField('lg-new2', 'Nhập lại mật khẩu', pw2, setPw2, null, 'new-password')}
              <button type="submit" className="lg-btn" disabled={busy}>
                {busy ? 'Đang lưu…' : 'Lưu mật khẩu'}
              </button>
            </form>
          </>
        )}
      </main>

      <p className="lg-foot">
        {configured ? 'Chưa có tài khoản? Liên hệ owner để được cấp.' : 'Chế độ thử: chưa nối Supabase nên ai cũng vào được (mật khẩu từ 6 ký tự). Email bắt đầu bằng "owner" thì vào quyền owner, còn lại là nhân viên.'}
      </p>
    </div>
  )
}
