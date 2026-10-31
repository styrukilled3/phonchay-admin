import { DATES, isLocked } from '../data/seed.js'
import { aggOf } from '../lib/calc.js'
import { compact, dm } from '../lib/format.js'
import Reveal from '../components/Reveal.jsx'

// Chưa có audit log thật (cần database). Bảng để trống thay vì số giả.
const LOG = []

export default function LockBook() {
  return (
    <>
      <Reveal as="section" className="card">
        <header>
          <h2>Trạng thái 30 ngày</h2>
          <span className="hint">Chốt rồi là chỉ đọc. Mở khóa được ghi vào audit log.</span>
        </header>
        <div className="cal">
          {[...DATES].slice(-30).reverse().map((dk) => {
            const lk = isLocked(dk)
            return (
              <div className={`day ${lk ? 'is-locked' : 'is-open'}`} key={dk}>
                <span className="d">{dm(dk)}</span>
                <span className="num day-v">{compact(aggOf([dk]).gross)}</span>
                <span className="muted">{lk ? 'đã chốt' : 'đang mở'}</span>
              </div>
            )
          })}
        </div>
      </Reveal>

      <Reveal as="section" className="card">
        <header>
          <h2>Audit log</h2>
          <span className="hint">Chỉ thêm, không sửa, không xóa.</span>
        </header>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>Thời điểm</th>
                <th>Người</th>
                <th>Hành động</th>
                <th>Đối tượng</th>
                <th>Trước</th>
                <th>Sau</th>
              </tr>
            </thead>
            <tbody>
              {LOG.map((r) => (
                <tr key={r[0] + r[3]}>
                  <td className="mono">{r[0]}</td>
                  <td>{r[1]}</td>
                  <td>{r[2]}</td>
                  <td className="mono">{r[3]}</td>
                  <td className="muted">{r[4]}</td>
                  <td>{r[5]}</td>
                </tr>
              ))}
              {LOG.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted">Chưa có thao tác nào. Audit log thật cần database, bản này chưa ghi.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Reveal>
    </>
  )
}
