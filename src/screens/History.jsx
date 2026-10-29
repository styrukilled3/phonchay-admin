import { CHANNELS, DATES } from '../data/seed.js'
import { aggOf } from '../lib/calc.js'
import { compact, dmy } from '../lib/format.js'
import { StatusChip } from '../components/bits.jsx'
import Reveal from '../components/Reveal.jsx'

export default function History({ statusOf, role }) {
  const owner = role === 'owner'
  const days = [...DATES].reverse().slice(0, 12)

  return (
    <Reveal as="section" className="card">
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
                  {c.code}
                </th>
              ))}
              <th className="num">{owner ? 'Tổng gộp' : 'Tổng SL'}</th>
            </tr>
          </thead>
          <tbody>
            {days.map((dk) => {
              // Nhân viên chỉ thấy số lượng bán, doanh thu chỉ owner thấy
              const cells = CHANNELS.map((c) => (owner ? aggOf([dk], c.id).gross : aggOf([dk], c.id).qty))
              const tot = cells.reduce((a, v) => a + v, 0)
              return (
                <tr key={dk}>
                  <td className="mono">{dmy(dk)}</td>
                  <td>
                    <StatusChip status={statusOf(dk, CHANNELS[0].id)} />
                  </td>
                  {cells.map((v, i) => (
                    <td className="num" key={CHANNELS[i].id}>
                      {v ? (owner ? compact(v) : v) : <span className="muted">—</span>}
                    </td>
                  ))}
                  <td className="num">
                    <b>{owner ? compact(tot) : tot}</b>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Reveal>
  )
}
