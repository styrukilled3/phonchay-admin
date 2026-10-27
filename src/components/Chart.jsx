import { CHANNELS } from '../data/seed.js'
import { aggOf } from '../lib/calc.js'
import { compact, dm, dmy, money } from '../lib/format.js'

function niceMax(v) {
  if (v <= 0) return 1
  const mag = 10 ** Math.floor(Math.log10(v))
  const n = v / mag
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10
  return step * mag
}

// Catmull-Rom chuyển sang bezier: đường cong mượt như chart trong reference,
// kẹp lại trong khung để không vọt ra ngoài vùng vẽ.
function smooth(points, lo, hi) {
  if (points.length < 2) return ''
  const clamp = (v) => Math.min(hi, Math.max(lo, v))
  let d = `M ${points[0][0].toFixed(1)} ${clamp(points[0][1]).toFixed(1)}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? points[i + 1]
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = clamp(p1[1] + (p2[1] - p0[1]) / 6)
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = clamp(p2[1] - (p3[1] - p1[1]) / 6)
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${clamp(p2[1]).toFixed(1)}`
  }
  return d
}

export function StackedArea({ dates }) {
  const W = 680
  const H = 280
  const ml = 56
  const mr = 14
  const mt = 18
  const mb = 34
  const pw = W - ml - mr
  const ph = H - mt - mb

  const perDay = dates.map((dk) => ({
    dk,
    vals: CHANNELS.map((c) => aggOf([dk], c.id).gross),
  }))
  const totals = perDay.map((d) => d.vals.reduce((a, v) => a + v, 0))
  const max = niceMax(Math.max(...totals, 1))

  const x = (i) => ml + (dates.length > 1 ? (i * pw) / (dates.length - 1) : pw / 2)
  const y = (v) => mt + ph - (v / max) * ph

  // Ranh giới tích lũy: ch-1 ở đáy, cộng dồn lên
  const boundaries = [dates.map((_, i) => [x(i), y(0)])]
  const running = dates.map(() => 0)
  CHANNELS.forEach((c, ci) => {
    perDay.forEach((d, i) => {
      running[i] += d.vals[ci]
    })
    boundaries.push(dates.map((_, i) => [x(i), y(running[i])]))
  })

  const ticks = [0, 1, 2, 3, 4].map((t) => (max * t) / 4)
  const lastTop = boundaries[boundaries.length - 1][dates.length - 1]

  return (
    <svg
      className="area"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Biểu đồ vùng chồng doanh thu gộp theo ngày, tách theo 5 kênh bán"
    >
      <defs>
        {CHANNELS.map((c, i) => (
          <linearGradient key={c.id} id={`g-${c.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={`var(${c.v})`} stopOpacity={0.55 - i * 0.05} />
            <stop offset="100%" stopColor={`var(${c.v})`} stopOpacity={0.08} />
          </linearGradient>
        ))}
      </defs>

      {ticks.map((v) => (
        <g key={v}>
          <line
            x1={ml}
            y1={y(v).toFixed(1)}
            x2={W - mr}
            y2={y(v).toFixed(1)}
            stroke="var(--line)"
            strokeWidth="1"
            strokeDasharray={v === 0 ? '0' : '2 6'}
          />
          <text
            x={ml - 10}
            y={(y(v) + 4).toFixed(1)}
            textAnchor="end"
            fontSize="10"
            fill="var(--ink-3)"
          >
            {compact(v)}
          </text>
        </g>
      ))}

      {CHANNELS.map((c, ci) => {
        const top = boundaries[ci + 1]
        const bottom = boundaries[ci]
        const topPath = smooth(top, mt, mt + ph)
        const bottomPts = [...bottom].reverse()
        const bottomPath = smooth(bottomPts, mt, mt + ph).replace(/^M/, 'L')
        return (
          <g key={c.id}>
            <path d={`${topPath} ${bottomPath} Z`} fill={`url(#g-${c.id})`} />
            <path d={topPath} fill="none" stroke={`var(${c.v})`} strokeWidth="1.75" />
          </g>
        )
      })}

      <circle cx={lastTop[0]} cy={lastTop[1]} r="4" fill="var(--accent)" />
      <circle cx={lastTop[0]} cy={lastTop[1]} r="8" fill="var(--accent)" opacity="0.25" />

      {perDay.map((d, i) => {
        const show = i % 5 === 0 || i === perDay.length - 1
        return (
          <g key={d.dk}>
            <rect x={x(i) - pw / dates.length / 2} y={mt} width={pw / dates.length} height={ph} fill="transparent">
              <title>{`${dmy(d.dk)} · tổng ${money(totals[i])}`}</title>
            </rect>
            {show && (
              <text x={x(i)} y={H - 12} textAnchor="middle" fontSize="10" fill="var(--ink-3)">
                {dm(d.dk)}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

export function Sparkline({ series, color }) {
  const W = 88
  const H = 26
  const p = 3
  const max = Math.max(...series, 1)
  const step = series.length > 1 ? (W - p * 2) / (series.length - 1) : 0
  const pts = series.map((v, i) => [p + i * step, H - p - (v / max) * (H - p * 2)])
  const d = smooth(pts, 0, H)
  const last = pts[pts.length - 1]

  return (
    <svg className="spark" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Xu hướng ${series.length} ngày`}>
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx={last[0].toFixed(1)} cy={last[1].toFixed(1)} r="2" fill={color} />
    </svg>
  )
}
