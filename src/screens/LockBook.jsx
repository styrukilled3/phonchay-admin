import { DATES, isLocked } from '../data/seed.js'
import { aggOf } from '../lib/calc.js'
import { compact, dm, dmy } from '../lib/format.js'

const LOG = [
  ['27/10 16:42', 'Trang (staff)', 'Sửa số lượng', 'PC-TEE-PHO-BLK-M · SP', '3', '4'],
  ['27/10 16:40', 'Trang (staff)', 'Thêm dòng', 'PC-CAP-SEN-BLK-OS · SP', '—', '2 × 199.000 ₫'],
  ['27/10 09:15', 'STY (owner)', 'Chốt ngày', dmy(DATES[DATES.length - 7]), 'đang mở', 'đã chốt'],
  [
    '26/10 20:03',
    'Khoa (staff)',
    'Ghi đè giá',
    'PC-HOO-UOM-CRM-XL · ZL',
    '539.000 ₫',
    '470.000 ₫ (lý do: khách quen)',
  ],
  ['26/10 19:58', 'Khoa (staff)', 'Gửi ngày', '26/10 · TT', 'nháp', 'đã gửi'],
]

export default function LockBook() {
  return (
    <>
      <section className="card">
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
      </section>

      <section className="card">
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
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
