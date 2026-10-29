const N = 56

/* Thanh vạch đứng: số vạch sáng = tỷ lệ. Vạch mọc lần lượt từ trái sang khi vào màn hình. */
export default function TickBar({ ratio, label }) {
  const lit = Math.round(Math.min(1, Math.max(0, ratio)) * N)
  return (
    <div className="tickbar" role="img" aria-label={`${label}: ${Math.round(ratio * 100)}%`}>
      {Array.from({ length: N }, (_, i) => (
        <i key={i} className={i < lit ? 'is-lit' : ''} style={{ '--i': i }} />
      ))}
    </div>
  )
}
