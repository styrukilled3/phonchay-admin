import CountUp from './CountUp.jsx'

const N = 60
const CX = 150
const CY = 150
const R_OUT = 144
const START = 135 // độ, tính từ trục +x theo chiều kim đồng hồ: góc dưới trái
const SWEEP = 270

/* Vòng vạch kiểu đồng hồ: mỗi vạch thuộc một kênh theo tỷ trọng, màu theo thang xám của kênh.
   Mọi vạch cùng độ dài nên vòng tròn đều. Sáng dần theo thứ tự kênh. Vào màn hình thì vạch mọc lần lượt. */
export default function TickRing({ items, total, label, format }) {
  const sum = items.reduce((s, it) => s + it.value, 0) || 1
  const ticks = Array.from({ length: N }, (_, i) => {
    const u = i / (N - 1)
    const a = ((START + u * SWEEP) * Math.PI) / 180
    const r1 = R_OUT - 30
    // Vạch thuộc kênh nào: theo vị trí giữa vạch trên trục tích lũy tỷ trọng
    const pos = (i + 0.5) / N
    let acc = 0
    let owner = items[items.length - 1]
    for (const it of items) {
      acc += it.value / sum
      if (pos <= acc) {
        owner = it
        break
      }
    }
    return {
      i,
      x1: CX + r1 * Math.cos(a),
      y1: CY + r1 * Math.sin(a),
      x2: CX + R_OUT * Math.cos(a),
      y2: CY + R_OUT * Math.sin(a),
      v: owner.v,
    }
  })

  return (
    <div className="tickring">
      <svg viewBox="0 8 300 252" role="img" aria-label={`Tỷ trọng ${items.map((it) => `${it.name} ${Math.round((it.value / sum) * 100)}%`).join(', ')}`}>
        {ticks.map((t) => (
          <line
            key={t.i}
            className="tk"
            style={{ '--i': t.i, stroke: `var(${t.v})` }}
            x1={t.x1.toFixed(1)}
            y1={t.y1.toFixed(1)}
            x2={t.x2.toFixed(1)}
            y2={t.y2.toFixed(1)}
            pathLength="1"
            strokeWidth="4"
          />
        ))}
      </svg>
      <div className="tickring-c">
        <span className="k">{label}</span>
        <span className="v">
          <CountUp value={total} format={format} />
        </span>
      </div>
    </div>
  )
}
