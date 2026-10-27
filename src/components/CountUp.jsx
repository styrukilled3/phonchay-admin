import { useEffect, useRef, useState } from 'react'

const DURATION = 700
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/* Số chạy từ 0 tới giá trị thật khi vào màn hình, một lần mỗi lần mount.
   Đổi value sau đó (đổi khoảng 7/14/30 ngày) thì chạy từ số đang hiện sang số mới. */
export default function CountUp({ value, format = (n) => String(Math.round(n)), className }) {
  const ref = useRef(null)
  const shown = useRef(0)
  const started = useRef(false)
  const raf = useRef(0)
  const [text, setText] = useState(() => format(0))
  const fmt = useRef(format)
  fmt.current = format

  function run(from, to) {
    cancelAnimationFrame(raf.current)
    if (reduced() || from === to) {
      shown.current = to
      setText(fmt.current(to))
      return
    }
    const t0 = performance.now()
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / DURATION)
      const v = p >= 1 ? to : from + (to - from) * easeOutCubic(p)
      shown.current = v
      setText(fmt.current(v))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
  }

  useEffect(() => {
    const el = ref.current
    if (started.current) {
      run(shown.current, value)
      return
    }
    if (typeof IntersectionObserver === 'undefined') {
      started.current = true
      run(0, value)
      return
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        started.current = true
        io.disconnect()
        run(0, value)
      },
      { threshold: 0.2 },
    )
    io.observe(el)
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  return (
    <span ref={ref} className={`countup${className ? ` ${className}` : ''}`}>
      {text}
    </span>
  )
}
