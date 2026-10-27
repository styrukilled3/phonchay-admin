import { useEffect, useState } from 'react'
import { pct } from '../lib/format.js'

export function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flex: 'none' }}>
      <rect x="3" y="7" width="10" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 5h10M6.5 5V3.5h3V5M5 5l.6 8h4.8L11 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Tag({ ch, children }) {
  return (
    <span className="tag" style={{ '--ch': `var(${ch.v})` }}>
      <span className="sw" />
      {children ?? ch.id}
    </span>
  )
}

export function StatusChip({ status }) {
  if (status === 'locked')
    return (
      <span className="chip chip-locked">
        <LockIcon /> Đã chốt
      </span>
    )
  if (status === 'sent') return <span className="chip chip-sent">Đã gửi</span>
  return <span className="chip chip-draft">Nháp</span>
}

export function Delta({ now, before, points = false }) {
  if (before == null || before === 0) {
    return <span className="delta">
      <span className="since">kỳ trước không đủ dữ liệu</span>
    </span>
  }
  const raw = points ? (now - before) * 100 : (now - before) / before
  const up = raw >= 0
  const text = points ? `${Math.abs(raw).toFixed(1).replace('.', ',')} điểm` : pct(Math.abs(raw))
  return (
    <span className={`delta ${up ? 'up' : 'down'}`}>
      {up ? '↑' : '↓'} {text} <span className="since">so với kỳ trước</span>
    </span>
  )
}

export function Kpi({ label, value, exact, hero, children }) {
  return (
    <div className={`kpi${hero ? ' kpi-hero' : ''}`}>
      <span className="lbl">{label}</span>
      <span className="val">{value}</span>
      {exact && <span className="val-exact">{exact}</span>}
      {children}
    </div>
  )
}

/* Ô số: giữ text cục bộ để gõ được, commit khi hợp lệ */
export function NumInput({ value, onCommit, className = '', ...rest }) {
  const [text, setText] = useState(String(value))

  useEffect(() => {
    setText(String(value))
  }, [value])

  function change(e) {
    const next = e.target.value
    setText(next)
    const digits = next.replace(/[^\d]/g, '')
    if (digits !== '') onCommit(parseInt(digits, 10))
  }

  function blur() {
    const digits = text.replace(/[^\d]/g, '')
    if (digits === '') setText(String(value))
  }

  return (
    <input
      className={className}
      inputMode="numeric"
      autoComplete="off"
      value={text}
      onChange={change}
      onBlur={blur}
      {...rest}
    />
  )
}
