import { CHANNELS, DATES, DAYS, LINES } from '../data/seed.js'
import { aggOf } from '../lib/calc.js'
import { compact, money, pct } from '../lib/format.js'
import { Delta, Kpi, Stamp } from '../components/bits.jsx'
import { Sparkline, StackedBars } from '../components/Chart.jsx'

export default function Dashboard({ range, setRange }) {
  const dates = DATES.slice(-range)
  const prevDates = DATES.slice(-range * 2, -range)
  const cur = aggOf(dates)
  const old = prevDates.length ? aggOf(prevDates) : null

  const rows = CHANNELS.map((c) => ({ c, a: aggOf(dates, c.id) })).sort((x, y) => y.a.net - x.a.net)
  const best = rows[0]
  const worst = [...rows].sort((x, y) => x.a.margin - y.a.margin)[0]

  return (
    <>
      <section className="card reveal" style={{ '--i': 0 }}>
        <header>
          <h2>Khoảng thời gian</h2>
          <span className="hint">
            Dữ liệu mẫu {DAYS} ngày, {LINES.length} dòng bán.
          </span>
        </header>
        <div className="tabs" role="group" aria-label="Khoảng thời gian">
          {[7, 14, 30].map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={range === n}
              style={{ '--ch': 'var(--accent)' }}
              onClick={() => setRange(n)}
            >
              <span className="code">{n}D</span>
              {n} ngày
            </button>
          ))}
        </div>
      </section>

      <div className="kpis">
        <Kpi label="Doanh thu gộp" value={money(cur.gross)} rule="var(--accent)">
          <Delta now={cur.gross} before={old?.gross} />
        </Kpi>
        <Kpi label="Doanh thu net" value={money(cur.net)} rule="var(--success)">
          <Delta now={cur.net} before={old?.net} />
        </Kpi>
        <Kpi label="Margin" value={pct(cur.margin)} rule="var(--warning)">
          <Delta now={cur.margin} before={old?.margin} points />
        </Kpi>
        <Kpi label="Sản phẩm bán" value={String(cur.qty)} rule="var(--ch-4)">
          <Delta now={cur.qty} before={old?.qty} />
        </Kpi>
      </div>

      <section className="card reveal" style={{ '--i': 2 }}>
        <div className="chart-head">
          <h2>Doanh thu gộp theo ngày và kênh</h2>
          <div className="legend">
            {CHANNELS.map((c) => (
              <Stamp key={c.id} ch={c} />
            ))}
          </div>
        </div>
        <div className="chart-wrap">
          <StackedBars dates={dates} />
        </div>
        <p className="hint">
          Cột chồng cộng lại là doanh thu gộp của ngày. Trỏ vào từng khối để xem số của kênh.
        </p>
      </section>

      <section className="card reveal" style={{ '--i': 3 }}>
        <header>
          <h2>So sánh 5 kênh</h2>
          <span className="hint">Xếp theo net. Margin thấp là kênh ăn phí nhiều.</span>
        </header>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>Kênh</th>
                <th className="num">Gộp</th>
                <th className="num">Giảm giá</th>
                <th className="num">Hoàn</th>
                <th className="num">Phí</th>
                <th className="num">Net</th>
                <th className="num">Giá vốn</th>
                <th className="num">Margin</th>
                <th className="num">Tỷ trọng</th>
                <th>Xu hướng</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.c.id}>
                  <td>
                    <Stamp ch={r.c} /> {r.c.name}
                  </td>
                  <td className="num">{compact(r.a.gross)}</td>
                  <td className="num">{r.a.discount ? `−${compact(r.a.discount)}` : '—'}</td>
                  <td className="num">{r.a.refund ? `−${compact(r.a.refund)}` : '—'}</td>
                  <td className="num">{r.a.fee ? `−${compact(r.a.fee)}` : '—'}</td>
                  <td className="num">
                    <b>{compact(r.a.net)}</b>
                  </td>
                  <td className="num">{compact(r.a.cogs)}</td>
                  <td
                    className="num"
                    style={{ color: r.a.margin < 0.25 ? 'var(--danger)' : 'var(--success)' }}
                  >
                    <b>{pct(r.a.margin)}</b>
                  </td>
                  <td className="num">{pct(cur.net > 0 ? r.a.net / cur.net : 0)}</td>
                  <td>
                    <Sparkline
                      series={dates.map((dk) => aggOf([dk], r.c.id).gross)}
                      color={`var(${r.c.v})`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Tổng</td>
                <td className="num">{compact(cur.gross)}</td>
                <td className="num">−{compact(cur.discount)}</td>
                <td className="num">−{compact(cur.refund)}</td>
                <td className="num">−{compact(cur.fee)}</td>
                <td className="num">{compact(cur.net)}</td>
                <td className="num">{compact(cur.cogs)}</td>
                <td className="num">{pct(cur.margin)}</td>
                <td className="num">100%</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <section className="card reveal" style={{ '--i': 4 }}>
        <header>
          <h2>Đọc nhanh</h2>
        </header>
        <p className="small">
          <b>{best.c.name}</b> dẫn đầu về net với {money(best.a.net)} ({pct(best.a.net / cur.net)} tổng).{' '}
          <b>{worst.c.name}</b> có margin thấp nhất {pct(worst.a.margin)} vì phí kênh {pct(worst.c.fee)} và
          giá vốn ăn {pct(worst.a.cogs / Math.max(1, worst.a.net))} doanh thu net.
        </p>
        <p className="hint">
          Số trong bản demo là dữ liệu giả sinh tại chỗ, không phải doanh thu thật của PHONCHAY.
        </p>
      </section>
    </>
  )
}
