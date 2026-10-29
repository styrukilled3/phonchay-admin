import { useState } from 'react'
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

/* Một đường tổng doanh thu gộp, mượt, nền mờ dần xuống đen như tham chiếu.
   Trỏ vào chart: đường dọc + chấm + pill ngày ở trục X + tooltip có tổng và từng kênh.
   Không trỏ thì ghim ở ngày cuối. */
export function StackedArea({ dates }) {
  const W = 680
  const H = 300
  const ml = 56
  const mr = 16
  const mt = 18
  const mb = 40
  const pw = W - ml - mr
  const ph = H - mt - mb
  const n = dates.length
  const [hover, setHover] = useState(null)

  const perDay = dates.map((dk) => ({
    dk,
    vals: CHANNELS.map((c) => aggOf([dk], c.id).gross),
  }))
  const totals = perDay.map((d) => d.vals.reduce((a, v) => a + v, 0))
  const max = niceMax(Math.max(...totals, 1))

  const x = (i) => ml + (n > 1 ? (i * pw) / (n - 1) : pw / 2)
  const y = (v) => mt + ph - (v / max) * ph

  const pts = totals.map((v, i) => [x(i), y(v)])
  const line = smooth(pts, mt, mt + ph)
  const area = `${line} L ${x(n - 1).toFixed(1)} ${y(0).toFixed(1)} L ${x(0).toFixed(1)} ${y(0).toFixed(1)} Z`
  const ticks = [0, 1, 2, 3, 4, 5].map((t) => (max * t) / 5)
  const act = hover ?? n - 1
  const ax = x(act)
  const ay = pts[act][1]
  const labelAt = (i) => (i % 5 === 0 || i === n - 1) && Math.abs(i - act) > 2

  function onMove(e) {
    const r = e.currentTarget.getBoundingClientRect()
    const vx = ((e.clientX - r.left) / r.width) * W
    const i = Math.round(((vx - ml) / pw) * (n - 1))
    setHover(Math.min(n - 1, Math.max(0, i)))
  }

  const dow = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][new Date(`${perDay[act].dk}T00:00:00`).getDay()]
  const flip = (ax / W) * 100 > 62

  return (
    <div className="area-wrap">
      <svg
        className="area"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Biểu đồ doanh thu gộp theo ngày, trỏ vào một ngày để xem tổng và từng kênh"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <clipPath id="clip-total">
            <rect className="reveal-rect" x="0" y="0" width={W} height={H} />
          </clipPath>
          <linearGradient id="g-total" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(1 0 0)" stopOpacity="0.2" />
            <stop offset="70%" stopColor="oklch(1 0 0)" stopOpacity="0.03" />
            <stop offset="100%" stopColor="oklch(1 0 0)" stopOpacity="0" />
          </linearGradient>
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
              strokeDasharray={v === 0 ? '0' : '2 5'}
              opacity={v === 0 ? 1 : 0.8}
            />
            <text x={ml - 12} y={(y(v) + 4).toFixed(1)} textAnchor="end" fontSize="11" fill="var(--ink-3)">
              {compact(v)}
            </text>
          </g>
        ))}

        <g clipPath="url(#clip-total)">
          <path d={area} fill="url(#g-total)" />
          <path d={line} fill="none" stroke="var(--ink)" strokeOpacity="0.75" strokeWidth="1.5" strokeLinecap="round" />
        </g>

        <g className="area-dot">
          <line x1={ax.toFixed(1)} y1={mt} x2={ax.toFixed(1)} y2={y(0).toFixed(1)} stroke="var(--ink)" strokeOpacity="0.4" strokeWidth="1" />
          <circle cx={ax.toFixed(1)} cy={ay.toFixed(1)} r="4" fill="var(--ink)" />
          <circle cx={ax.toFixed(1)} cy={ay.toFixed(1)} r="9" fill="var(--ink)" opacity="0.16" />
        </g>

        {perDay.map((d, i) =>
          labelAt(i) ? (
            <text
              key={d.dk}
              x={x(i)}
              y={H - 14}
              textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
              fontSize="11"
              fill="var(--ink-3)"
            >
              {dm(d.dk)}
            </text>
          ) : null,
        )}

        <g className="area-dot">
          <rect x={(ax - 28).toFixed(1)} y={H - 32} width="56" height="24" rx="12" fill="oklch(0.98 0 0)" />
          <text x={ax.toFixed(1)} y={H - 16} textAnchor="middle" fontSize="11" fontWeight="600" fill="oklch(0.11 0 0)">
            {dm(perDay[act].dk)}
          </text>
        </g>
      </svg>

      <div
        className="area-tip"
        style={{ left: `${(ax / W) * 100}%`, transform: `translateX(${flip ? 'calc(-100% - 16px)' : '16px'})` }}
        aria-hidden="true"
      >
        <b>{dow}, {dm(perDay[act].dk)}</b>
        <div className="tip-row is-total">
          <span>Tổng gộp</span>
          <em>{money(totals[act])}</em>
        </div>
        {CHANNELS.map((c, ci) => (
          <div className="tip-row" key={c.id}>
            <i style={{ background: `var(${c.v})` }} />
            <span>{c.name}</span>
            <em>{compact(perDay[act].vals[ci])}</em>
          </div>
        ))}
      </div>
    </div>
  )
}

/* Biểu đồ vùng một chuỗi: dùng cho page riêng của từng kênh */
export function AreaOne({ dates, series, color }) {
  const W = 640
  const H = 200
  const ml = 52
  const mr = 12
  const mt = 16
  const mb = 30
  const pw = W - ml - mr
  const ph = H - mt - mb

  const max = niceMax(Math.max(...series, 1))
  const x = (i) => ml + (dates.length > 1 ? (i * pw) / (dates.length - 1) : pw / 2)
  const y = (v) => mt + ph - (v / max) * ph
  const pts = series.map((v, i) => [x(i), y(v)])
  const line = smooth(pts, mt, mt + ph)
  const base = `L ${x(dates.length - 1).toFixed(1)} ${(mt + ph).toFixed(1)} L ${ml.toFixed(1)} ${(mt + ph).toFixed(1)} Z`
  const ticks = [0, 1, 2].map((t) => (max * t) / 2)
  const last = pts[pts.length - 1]

  return (
    <svg className="area" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Doanh thu gộp theo ngày của kênh">
      <defs>
        <linearGradient id="g-one" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.5" />
          <stop offset="100%" stopColor={color} stopOpacity="0.04" />
        </linearGradient>
      </defs>

      {ticks.map((v) => (
        <g key={v}>
          <line
            x1={ml}
            y1={y(v).toFixed(1)}
            x2={W - mr}
            y2={y(v).toFixed(1)}
            stroke="var(--line)"
            strokeDasharray={v === 0 ? '0' : '2 6'}
          />
          <text x={ml - 10} y={(y(v) + 4).toFixed(1)} textAnchor="end" fontSize="10" fill="var(--ink-3)">
            {compact(v)}
          </text>
        </g>
      ))}

      <path d={`${line} ${base}`} fill="url(#g-one)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2" />
      <circle cx={last[0].toFixed(1)} cy={last[1].toFixed(1)} r="4" fill={color} />

      {dates.map((dk, i) => {
        const show = i % 6 === 0 || i === dates.length - 1
        return (
          <g key={dk}>
            <rect x={x(i) - pw / dates.length / 2} y={mt} width={pw / dates.length} height={ph} fill="transparent">
              <title>{`${dmy(dk)}: ${money(series[i])}`}</title>
            </rect>
            {show && (
              <text
                x={x(i)}
                y={H - 10}
                textAnchor={i === 0 ? 'start' : i === dates.length - 1 ? 'end' : 'middle'}
                fontSize="10"
                fill="var(--ink-3)"
              >
                {dm(dk)}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// Xu hướng: trung bình nửa sau so với nửa đầu. Lệch dưới 3% coi là đi ngang.
function trendOf(series) {
  const h = Math.floor(series.length / 2)
  if (h < 1) return 'flat'
  const avg = (a) => a.reduce((s, v) => s + v, 0) / a.length
  const a = avg(series.slice(0, h))
  const b = avg(series.slice(series.length - h))
  if (a === 0) return b > 0 ? 'up' : 'flat'
  const r = (b - a) / a
  return r > 0.03 ? 'up' : r < -0.03 ? 'down' : 'flat'
}

export function Sparkline({ series }) {
  const trend = trendOf(series)
  const W = 88
  const H = 26
  const p = 3
  const max = Math.max(...series, 1)
  const step = series.length > 1 ? (W - p * 2) / (series.length - 1) : 0
  const pts = series.map((v, i) => [p + i * step, H - p - (v / max) * (H - p * 2)])
  const d = smooth(pts, 0, H)
  const last = pts[pts.length - 1]

  return (
    <svg className={`spark is-${trend}`} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Xu hướng ${series.length} ngày: ${trend === 'up' ? 'tăng' : trend === 'down' ? 'giảm' : 'đi ngang'}`}>
      <path d={d} fill="none" stroke="var(--spark)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx={last[0].toFixed(1)} cy={last[1].toFixed(1)} r="2" fill="var(--spark)" />
    </svg>
  )
}
