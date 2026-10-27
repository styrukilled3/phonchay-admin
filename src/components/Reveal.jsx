import { useEffect, useRef, useState } from 'react'

/* Hiện dần khi cuộn tới: mờ + blur nhẹ + trượt lên vài px. Chạy một lần, không stagger.
   Sau khi hiện xong filter/transform về none nên không giữ stacking context. */
export default function Reveal({ as: Tag = 'div', className = '', children, ...rest }) {
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
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )
    io.observe(ref.current)
    return () => io.disconnect()
  }, [on])

  return (
    <Tag ref={ref} className={`rv${on ? ' is-in' : ''}${className ? ` ${className}` : ''}`} {...rest}>
      {children}
    </Tag>
  )
}
