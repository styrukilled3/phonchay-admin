import { CHANNELS, DATES } from '../data/seed.js'
import { aggOf } from '../lib/calc.js'
import { compact, dmy } from '../lib/format.js'
import { StatusChip } from '../components/bits.jsx'

export default function History({ statusOf }) {
  const days = [...DATES].reverse().slice(0, 12)

  return (
    <section className="card">
      <header>
        <h2>12 ngày gần nhất</h2>
        <span className="hint">Ngày đã chốt chỉ đọc.</span>
      </header>
      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Trạng thái</th>
              {CHANNELS.map((c) => (
                <th key={c.id} className="num">
                  {c.id}
                </th>
              ))}
              <th className="num">Tổng gộp</th>
            </tr>
          </thead>
          <tbody>
            {days.map((dk) => {
              const cells = CHANNELS.map((c) => aggOf([dk], c.id).gross)
              const tot = cells.reduce((a, v) => a + v, 0)
              return (
                <tr key={dk}>
                  <td className="mono">{dmy(dk)}</td>
                  <td>
                    <StatusChip status={statusOf(dk, 'SP')} />
                  </td>
                  {cells.map((v, i) => (
                    <td className="num" key={CHANNELS[i].id}>
                      {v ? compact(v) : <span className="muted">—</span>}
                    </td>
                  ))}
                  <td className="num">
                    <b>{compact(tot)}</b>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
