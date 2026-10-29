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

// Đường gấp khúc (không làm mượt): nét góc cạnh như chart tham chiếu
function poly(points) {
  return points.map((p, i) => `${i ? 'L' : 'M'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
}

/* Vùng cam = tổng doanh thu gộp mọi kênh, đường xám mảnh = từng kênh chồng lên.
   Cam là màu duy nhất của chart, đúng như tham chiếu. */
export function StackedArea({ dates }) {
  const W = 680
  const H = 300
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

  const totalPts = totals.map((v, i) => [x(i), y(v)])
  const line = poly(totalPts)
  const area = `${line} L ${x(dates.length - 1).toFixed(1)} ${y(0).toFixed(1)} L ${x(0).toFixed(1)} ${y(0).toFixed(1)} Z`
  const ticks = [0, 1, 2, 3, 4].map((t) => (max * t) / 4)
  const last = totalPts[totalPts.length - 1]
  const labelAt = (i) => i % 5 === 0 || i === dates.length - 1

  return (
    <svg
      className="area"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Biểu đồ doanh thu gộp theo ngày: vùng cam là tổng mọi kênh, đường xám là từng kênh"
    >
      <defs>
        <linearGradient id="g-total" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--chart-hot)" stopOpacity="0.85" />
          <stop offset="55%" stopColor="var(--chart-hot)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--chart-hot)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {ticks.map((v) => (
        <g key={v}>
          <line x1={ml} y1={y(v).toFixed(1)} x2={W - mr} y2={y(v).toFixed(1)} stroke="var(--line)" strokeWidth="1" />
          <text x={ml - 10} y={(y(v) + 4).toFixed(1)} textAnchor="end" fontSize="10" fill="var(--ink-3)">
            {compact(v)}
          </text>
        </g>
      ))}
      {dates.map((dk, i) =>
        labelAt(i) ? (
          <line key={dk} x1={x(i).toFixed(1)} y1={mt} x2={x(i).toFixed(1)} y2={y(0).toFixed(1)} stroke="var(--line)" strokeWidth="1" opacity="0.55" />
        ) : null,
      )}

      <path d={area} fill="url(#g-total)" />
      <path d={line} fill="none" stroke="var(--chart-hot)" strokeWidth="1.5" strokeLinejoin="round" />

      {CHANNELS.map((c, ci) => (
        <path
          key={c.id}
          d={poly(perDay.map((d, i) => [x(i), y(d.vals[ci])]))}
          fill="none"
          stroke={`var(${c.v})`}
          strokeWidth="1"
          strokeLinejoin="round"
          opacity="0.8"
        />
      ))}

      <circle cx={last[0]} cy={last[1]} r="3.5" fill="var(--ink)" />
      <circle cx={last[0]} cy={last[1]} r="8" fill="var(--ink)" opacity="0.18" />

      {perDay.map((d, i) => (
        <g key={d.dk}>
          <rect x={x(i) - pw / dates.length / 2} y={mt} width={pw / dates.length} height={ph} fill="transparent">
            <title>{`${dmy(d.dk)} · tổng ${money(totals[i])}`}</title>
          </rect>
          {labelAt(i) && (
            <text
              x={x(i)}
              y={H - 12}
              // Nhãn hai đầu neo vào trong, không thì bị cắt ngoài viewBox
              textAnchor={i === 0 ? 'start' : i === perDay.length - 1 ? 'end' : 'middle'}
              fontSize="10"
              fill="var(--ink-3)"
            >
              {dm(d.dk)}
            </text>
          )}
        </g>
      ))}
    </svg>
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
