// Bản dùng thử với số thật: không còn dữ liệu mẫu, lưu trong trình duyệt. Thay bằng Supabase ở bước sau.

// fee = % phí hoặc hoa hồng kênh thu trên doanh thu gộp.
// Sàn ăn phí cao, kênh trực tiếp bằng 0. Sửa số ở đây khi biết phí thật.
export const CHANNELS = [
  { id: '808', code: '808', name: '808', fee: 0.0, v: '--ch-1' },
  { id: 'TLD', code: 'TLD', name: 'THAILAN', fee: 0.0, v: '--ch-2' },
  { id: 'HP', code: 'HP', name: 'HAIPHONG', fee: 0.0, v: '--ch-3' },
  { id: 'SHP', code: 'SHP', name: 'SHOPPE', fee: 0.11, v: '--ch-4' },
  { id: 'SPF', code: 'SPF', name: 'SHOPIFY', fee: 0.02, v: '--ch-5' },
]

// Rỗng: SKU do mày tạo ở Kho tổng. Dữ liệu lưu trong trình duyệt (lib/persist.js).
export const PRODUCTS = []

// Công thức giá từng kênh: giá kênh = giá gốc cộng/trừ (số tiền hoặc %). Owner sửa ở màn Sản phẩm.
// kind: 'amount' (đ) | 'pct' (%), sign: 1 cộng, -1 trừ. Không làm tròn.
export const CH_RULE = {
  '808': { kind: 'amount', sign: 1, value: 0 },
  TLD: { kind: 'amount', sign: 1, value: 0 },
  HP: { kind: 'amount', sign: -1, value: 10000 },
  SHP: { kind: 'amount', sign: 1, value: 10000 },
  SPF: { kind: 'amount', sign: -1, value: 10000 },
}

export function setRule(chId, patch) {
  Object.assign(CH_RULE[chId], patch)
}

export function channelPrice(base, chId) {
  if (!(base > 0)) return 0
  const r = CH_RULE[chId]
  if (!r) return base
  const delta = r.kind === 'pct' ? (base * r.value) / 100 : r.value
  return Math.max(0, base + r.sign * delta)
}

export function product(sku) {
  return PRODUCTS.find((p) => p.sku === sku)
}

// Sản phẩm tạo mới có thể đặt giá riêng từng kênh (p.prices), không thì theo giá gốc cộng điều chỉnh kênh
export function priceOf(sku, chId) {
  const p = product(sku)
  if (!p || !(p.base > 0)) return 0
  return p.prices?.[chId] ?? channelPrice(p.base, chId)
}

// SP nhân viên tạo chưa có giá gốc hoặc giá vốn thì owner phải điền mới duyệt chuyển kho được
export function needsPrice(p) {
  return !(p.base > 0 && p.cost > 0)
}

// ---------- Kho ----------
// Hai tầng: kho tổng wh[sku] (owner nhập hàng) và tồn từng kênh stock[sku][chId]
// (có được khi owner duyệt yêu cầu lấy hàng; bán ra thì trừ tồn kênh).
// Kho tổng dưới LOW_BELOW là "sắp hết", bằng 0 là "hết hàng". Mọi số ở đây là số mẫu.
export const LOW_BELOW = 15

const STOCK_SEED = {}

export function initialStock() {
  return Object.fromEntries(Object.entries(STOCK_SEED).map(([sku, m]) => [sku, { ...m }]))
}

const WH_SEED = {}

export function initialWarehouse() {
  return { ...WH_SEED }
}

export const RECEIPTS_SEED = []

// Thêm sản phẩm mới vào danh mục chung (SKU search, bảng giá đọc từ PRODUCTS)
export function addProduct(p) {
  PRODUCTS.push(p)
}

export function channel(id) {
  return CHANNELS.find((c) => c.id === id)
}

export function dayKey(d) {
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  )
}

function addDays(d, n) {
  const x = new Date(d.getTime())
  x.setDate(x.getDate() + n)
  return x
}

// 60 ngày để dashboard so sánh được với kỳ trước (30 ngày này vs 30 ngày trước)
export const DAYS = 60

const TODAY = new Date()
TODAY.setHours(0, 0, 0, 0)

export const DATES = Array.from({ length: DAYS }, (_, i) => dayKey(addDays(TODAY, -(DAYS - 1 - i))))

// Dòng bán thật, thêm khi nhân viên gửi ngày (setDayLines)
export const LINES = []

// Chốt sổ: mọi ngày trước 6 ngày gần nhất đã khóa
export const LOCK_FROM = DATES[DATES.length - 6]

export function isLocked(dk) {
  return dk < LOCK_FROM
}

// Yêu cầu lấy hàng từ kho tổng xuống kênh: pending | approved | rejected
export function initialRequests() {
  return []
}

// Báo cáo bán của một ngày/kênh thay thế dữ liệu cũ của ngày đó, từ đó doanh thu kênh và tổng tự tính lại
export function setDayLines(date, chId, rows) {
  for (let i = LINES.length - 1; i >= 0; i--) {
    if (LINES[i].date === date && LINES[i].ch === chId) LINES.splice(i, 1)
  }
  const c = channel(chId)
  rows.forEach((r) => {
    if (r.qty <= 0) return
    LINES.push({
      date,
      ch: chId,
      sku: r.sku,
      qty: r.qty,
      price: r.price ?? priceOf(r.sku, chId),
      discount: 0,
      fee: c.fee,
      cost: product(r.sku).cost,
      type: 'sale',
    })
  })
}
