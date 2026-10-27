import { useEffect, useRef, useState } from 'react'

const SIZE = 300
const STROKE = 15
const GAP = 6

const clamp01 = (x) => Math.min(1, Math.max(0, x))
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

/* Vòng đồng tâm chạy theo cuộn trang (scrub): mỗi kênh một vòng theo màu kênh, gradient đậm sang nhạt dọc cung, độ dài = doanh thu so với kênh cao nhất.
   Cuộn xuống thì vòng thu dần khi biểu đồ trôi khỏi màn hình, cuộn lên thì vòng đầy lại; vào màn hình từ dưới lên
   cũng vẽ dần. Giá trị hiển thị lerp theo mục tiêu nên không giật, đổi khoảng ngày cũng chạy mượt.
   `center(shownTotal)` vẽ số ở giữa theo cùng tiến độ. */
export default function RevenueRings({ rings, total, center }) {
  const wrap = useRef(null)
  const raf = useRef(0)
  const shown = useRef({ pcts: rings.map(() => 0), total: 0 })
  const latest = useRef({ rings, total })
  latest.current = { rings, total }
  const [, force] = useState(0)

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    // Tiến độ theo vị trí cuộn: 0 khi vừa lọt mép dưới, 1 khi nằm trong khung nhìn, thu về 0 khi trôi ra mép trên
    function scrollT() {
      const r = wrap.current.getBoundingClientRect()
      const vh = window.innerHeight
      const tIn = clamp01((vh * 0.95 - r.top) / (vh * 0.55))
      // Thu dần ngay khi cuộn đi: đầy khi đỉnh vòng còn cách mép trên >= 170px, về 0 khi đã trôi 30% chiều cao
      const tOut = clamp01((r.top + r.height * 0.3) / (170 + r.height * 0.3))
      return Math.min(easeOutCubic(tIn), tOut)
    }

    function frame() {
      const { rings: rs, total: tot } = latest.current
      const t = reduce ? 1 : scrollT()
      const s = shown.current
      while (s.pcts.length < rs.length) s.pcts.push(0)
      let moving = false
      const k = reduce ? 1 : 0.16
      rs.forEach((r, i) => {
        const target = clamp01(r.pct) * t
        const d = target - s.pcts[i]
        if (Math.abs(d) > 0.0004) {
          s.pcts[i] += d * k
          moving = true
        } else s.pcts[i] = target
      })
      const tt = tot * t
      const dt = tt - s.total
      if (Math.abs(dt) > Math.max(1, tot * 0.0004)) {
        s.total += dt * k
        moving = true
      } else s.total = tt
      force((n) => n + 1)
      raf.current = moving ? requestAnimationFrame(frame) : 0
    }

    const kick = () => {
      if (!raf.current) raf.current = requestAnimationFrame(frame)
    }
    kick()
    window.addEventListener('scroll', kick, { passive: true })
    window.addEventListener('resize', kick)
    return () => {
      window.removeEventListener('scroll', kick)
      window.removeEventListener('resize', kick)
      cancelAnimationFrame(raf.current)
      raf.current = 0
    }
  }, [])

  // Đổi dữ liệu (khoảng ngày, mục tiêu) thì đánh thức vòng lặp
  useEffect(() => {
    if (!raf.current) raf.current = requestAnimationFrame(() => window.dispatchEvent(new Event('scroll')))
  }, [rings, total])

  return (
    <div className="rings" ref={wrap} role="img" aria-label="Doanh thu từng kênh, vòng ngoài là kênh bán nhiều nhất">
      {rings.map((r, i) => {
        const p = shown.current.pcts[i] ?? 0
        const inset = ((i * (STROKE + GAP) + 3) / SIZE) * 100
        const diameter = SIZE - 2 * (i * (STROKE + GAP) + 3)
        const hole = ((diameter / 2 - STROKE) / (diameter / 2)) * 100
        const cap = (STROKE / diameter) * 100
        return (
          <div
            key={r.id}
            className="ring"
            style={{ '--ch': `var(${r.v})`, '--p': p, '--hole': `${hole}%`, '--cap': `${cap}%`, inset: `${inset}%` }}
          >
            <i className="ring-track" />
            <i className="ring-arc" />
            <i className="ring-dot is-start" style={{ opacity: p > 0.004 ? 1 : 0 }} />
            <i className="ring-turn" style={{ transform: `rotate(${p * 360}deg)`, opacity: p > 0.004 ? 1 : 0 }}>
              <i className="ring-dot is-end" />
            </i>
          </div>
        )
      })}
      <div className="rings-center">{center(shown.current.total)}</div>
    </div>
  )
}
