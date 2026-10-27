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

export function StackedBars({ dates }) {
  const W = 640
  const H = 260
  const ml = 60
  const mr = 10
  const mt = 14
  const mb = 34
  const pw = W - ml - mr
  const ph = H - mt - mb

  const data = dates.map((dk) => {
    const segs = CHANNELS.map((c) => ({ c, v: aggOf([dk], c.id).gross }))
    return { dk, segs, tot: segs.reduce((a, s) => a + s.v, 0) }
  })
  const max = niceMax(Math.max(...data.map((d) => d.tot), 1))
  const slot = pw / data.length
  const bw = Math.min(16, slot * 0.68)
  const y = (v) => mt + ph - (v / max) * ph

  const ticks = [0, 1, 2, 3, 4].map((t) => (max * t) / 4)

  return (
    <svg
      className="bars"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Biểu đồ cột chồng doanh thu gộp theo ngày, tách theo 5 kênh bán"
    >
      {ticks.map((v) => (
        <g key={v}>
          <line
            x1={ml}
            y1={y(v).toFixed(1)}
            x2={W - mr}
            y2={y(v).toFixed(1)}
            stroke="var(--border)"
            strokeWidth="1"
          />
          <text
            x={ml - 8}
            y={(y(v) + 4).toFixed(1)}
            textAnchor="end"
            fontSize="10"
            fontFamily="var(--font-mono)"
            fill="var(--ink-muted)"
          >
            {compact(v)}
          </text>
        </g>
      ))}

      {data.map((d, i) => {
        const x = ml + i * slot + (slot - bw) / 2
        let acc = 0
        const bars = d.segs
          .filter((s) => s.v > 0)
          .map((sg) => {
            const hh = (sg.v / max) * ph
            const yTop = mt + ph - ((acc + sg.v) / max) * ph
            acc += sg.v
            return (
              <rect
                key={sg.c.id}
                className="seg"
                x={x.toFixed(1)}
                y={yTop.toFixed(1)}
                width={bw.toFixed(1)}
                height={Math.max(0.8, hh).toFixed(1)}
                fill={`var(${sg.c.v})`}
              >
                <title>{`${dmy(d.dk)} · ${sg.c.id} ${sg.c.name}: ${money(sg.v)}`}</title>
              </rect>
            )
          })
        const showLabel = i % 5 === 0 || i === data.length - 1
        return (
          <g key={d.dk}>
            {bars}
            {showLabel && (
              <text
                x={(x + bw / 2).toFixed(1)}
                y={H - 12}
                textAnchor="middle"
                fontSize="10"
                fontFamily="var(--font-mono)"
                fill="var(--ink-muted)"
              >
                {dm(d.dk)}
              </text>
            )}
          </g>
        )
      })}

      <line x1={ml} y1={mt + ph} x2={W - mr} y2={mt + ph} stroke="var(--rule)" strokeWidth="1.5" />
    </svg>
  )
}

export function Sparkline({ series, color }) {
  const W = 92
  const H = 28
  const p = 3
  const max = Math.max(...series, 1)
  const step = series.length > 1 ? (W - p * 2) / (series.length - 1) : 0
  const pts = series.map(
    (v, i) => `${(p + i * step).toFixed(1)},${(H - p - (v / max) * (H - p * 2)).toFixed(1)}`,
  )
  const [lx, ly] = pts[pts.length - 1].split(',')

  return (
    <svg className="spark" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Xu hướng ${series.length} ngày`}>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="2.2" fill={color} />
    </svg>
  )
}
