import { useEffect, useRef, useState } from 'react'

const SIZE = 300
const C = SIZE / 2
const STROKE = 17
const GAP = 7
const R0 = C - STROKE / 2 - 4

/* Vòng đồng tâm: mỗi kênh một vòng theo màu kênh, độ dài = doanh thu / mục tiêu (kẹp 100% khi vẽ).
   Vòng chạy từ 0 tới giá trị khi cuộn tới, đổi khoảng ngày thì chạy từ vị trí cũ sang vị trí mới. */
export default function RevenueRings({ rings, children }) {
  const ref = useRef(null)
  const [on, setOn] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    if (on) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true)
          io.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    io.observe(ref.current)
    return () => io.disconnect()
  }, [on])

  return (
    <div className="rings" ref={ref}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label="Doanh thu từng kênh so với mục tiêu">
        {rings.map((r, i) => {
          const radius = R0 - i * (STROKE + GAP)
          const len = 2 * Math.PI * radius
          const p = on ? Math.min(1, Math.max(0, r.pct)) : 0
          return (
            <g key={r.id} style={{ '--ch': `var(${r.v})` }}>
              <circle className="ring-track" cx={C} cy={C} r={radius} strokeWidth={STROKE} fill="none" />
              <circle
                className="ring-val"
                cx={C}
                cy={C}
                r={radius}
                strokeWidth={STROKE}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={len}
                strokeDashoffset={len * (1 - p)}
                transform={`rotate(-90 ${C} ${C})`}
              />
              <g className="ring-cap" style={{ transform: `rotate(${p * 360}deg)`, transformOrigin: `${C}px ${C}px` }}>
                <circle cx={C} cy={C - radius} r={3.2} fill="var(--ink)" />
              </g>
            </g>
          )
        })}
      </svg>
      <div className="rings-center">{children}</div>
    </div>
  )
}
