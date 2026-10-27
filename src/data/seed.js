// Dữ liệu mẫu cho bản demo. Thay bằng Supabase ở bước sau.

// fee = % phí hoặc hoa hồng kênh thu trên doanh thu gộp.
// Sàn ăn phí cao, kênh trực tiếp bằng 0. Sửa số ở đây khi biết phí thật.
export const CHANNELS = [
  { id: '808', code: '808', name: '808', fee: 0.0, v: '--ch-1' },
  { id: 'TLD', code: 'TLD', name: 'THAILAN', fee: 0.0, v: '--ch-2' },
  { id: 'HP', code: 'HP', name: 'HAIPHONG', fee: 0.0, v: '--ch-3' },
  { id: 'SHP', code: 'SHP', name: 'SHOPPE', fee: 0.11, v: '--ch-4' },
  { id: 'SPF', code: 'SPF', name: 'SHOPIFY', fee: 0.02, v: '--ch-5' },
]

export const PRODUCTS = [
  { sku: 'PC-TEE-PHO-BLK-M', name: 'Áo thun Phở', variant: 'Đen / M', base: 289000, cost: 118000 },
  { sku: 'PC-TEE-PHO-BLK-L', name: 'Áo thun Phở', variant: 'Đen / L', base: 289000, cost: 118000 },
  { sku: 'PC-TEE-PHO-WHT-M', name: 'Áo thun Phở', variant: 'Trắng / M', base: 289000, cost: 118000 },
  { sku: 'PC-HOO-UOM-CRM-XL', name: 'Hoodie Ươm', variant: 'Kem / XL', base: 559000, cost: 265000 },
  { sku: 'PC-HOO-UOM-BLK-L', name: 'Hoodie Ươm', variant: 'Đen / L', base: 559000, cost: 265000 },
  { sku: 'PC-CAP-SEN-BLK-OS', name: 'Nón Sen', variant: 'Đen / Freesize', base: 189000, cost: 72000 },
  { sku: 'PC-TOT-CHO-NAT-OS', name: 'Túi Chợ', variant: 'Mộc / Freesize', base: 149000, cost: 45000 },
  { sku: 'PC-SHO-DEM-IND-32', name: 'Short Đêm', variant: 'Indigo / 32', base: 329000, cost: 160000 },
]

// Sàn gánh phí nên giá niêm yết cộng thêm, kênh trực tiếp bớt lại
const CH_ADJ = { '808': 0, TLD: 0, HP: -10000, SHP: 10000, SPF: -10000 }

export function product(sku) {
  return PRODUCTS.find((p) => p.sku === sku)
}

// Sản phẩm tạo mới có thể đặt giá riêng từng kênh (p.prices), không thì theo giá gốc cộng điều chỉnh kênh
export function priceOf(sku, chId) {
  const p = product(sku)
  if (!p) return 0
  return p.prices?.[chId] ?? p.base + (CH_ADJ[chId] ?? 0)
}

// ---------- Kho ----------
// Hai tầng: kho tổng wh[sku] (owner nhập hàng) và tồn từng kênh stock[sku][chId]
// (có được khi owner duyệt yêu cầu lấy hàng; bán ra thì trừ tồn kênh).
// Kho tổng dưới LOW_BELOW là "sắp hết", bằng 0 là "hết hàng". Mọi số ở đây là số mẫu.
export const LOW_BELOW = 15

const STOCK_SEED = {
  'PC-TEE-PHO-BLK-M': { '808': 18, TLD: 10, HP: 8, SHP: 14, SPF: 6 },
  'PC-TEE-PHO-BLK-L': { '808': 20, TLD: 12, HP: 9, SHP: 16, SPF: 7 },
  'PC-TEE-PHO-WHT-M': { '808': 4, TLD: 2, HP: 1, SHP: 3, SPF: 0 },
  'PC-HOO-UOM-CRM-XL': { '808': 9, TLD: 6, HP: 5, SHP: 8, SPF: 3 },
  'PC-HOO-UOM-BLK-L': { '808': 2, TLD: 1, HP: 0, SHP: 2, SPF: 1 },
  'PC-CAP-SEN-BLK-OS': { '808': 22, TLD: 14, HP: 10, SHP: 18, SPF: 8 },
  'PC-TOT-CHO-NAT-OS': { '808': 0, TLD: 0, HP: 0, SHP: 0, SPF: 0 },
  'PC-SHO-DEM-IND-32': { '808': 7, TLD: 5, HP: 4, SHP: 6, SPF: 2 },
}

export function initialStock() {
  return Object.fromEntries(Object.entries(STOCK_SEED).map(([sku, m]) => [sku, { ...m }]))
}

const WH_SEED = {
  'PC-TEE-PHO-BLK-M': 140,
  'PC-TEE-PHO-BLK-L': 120,
  'PC-TEE-PHO-WHT-M': 8,
  'PC-HOO-UOM-CRM-XL': 60,
  'PC-HOO-UOM-BLK-L': 5,
  'PC-CAP-SEN-BLK-OS': 180,
  'PC-TOT-CHO-NAT-OS': 0,
  'PC-SHO-DEM-IND-32': 45,
}

export function initialWarehouse() {
  return { ...WH_SEED }
}

export const RECEIPTS_SEED = [
  { id: 'PN-0270', date: '2026-10-24', qty: 120, total: 18600000 },
  { id: 'PN-0269', date: '2026-10-17', qty: 90, total: 14700000 },
  { id: 'PN-0268', date: '2026-10-09', qty: 150, total: 24300000 },
]

// Thêm sản phẩm mới vào danh mục chung (SKU search, bảng giá đọc từ PRODUCTS)
export function addProduct(p) {
  PRODUCTS.push(p)
}

export function channel(id) {
  return CHANNELS.find((c) => c.id === id)
}

function mulberry32(seed) {
  return function next() {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
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

// Mỗi kênh một nhịp bán khác nhau để biểu đồ có hình, không phải nhiễu đều
const CH_WEIGHT = { '808': 1.0, TLD: 0.6, HP: 0.5, SHP: 0.9, SPF: 0.4 }

function generate() {
  const rand = mulberry32(20261027)
  const lines = []
  DATES.forEach((dk, di) => {
    const dow = new Date(`${dk}T00:00:00`).getDay()
    const weekend = dow === 0 || dow === 6 ? 1.35 : 1
    const trend = 0.8 + 0.5 * (di / DAYS)
    CHANNELS.forEach((ch) => {
      const load = CH_WEIGHT[ch.id] * weekend * trend
      const n = Math.max(0, Math.round(load * (1.4 + rand() * 2.2)))
      for (let k = 0; k < n; k++) {
        const p = PRODUCTS[Math.floor(rand() * PRODUCTS.length)]
        const qty = 1 + Math.floor(rand() * 5)
        const price = priceOf(p.sku, ch.id)
        const discount =
          rand() < 0.22 ? Math.round((price * qty * (0.05 + rand() * 0.1)) / 1000) * 1000 : 0
        lines.push({
          date: dk,
          ch: ch.id,
          sku: p.sku,
          qty,
          price,
          discount,
          fee: ch.fee,
          cost: p.cost,
          type: 'sale',
        })
      }
      if (rand() < 0.1) {
        const pr = PRODUCTS[Math.floor(rand() * PRODUCTS.length)]
        lines.push({
          date: dk,
          ch: ch.id,
          sku: pr.sku,
          qty: 1,
          price: priceOf(pr.sku, ch.id),
          discount: 0,
          fee: ch.fee,
          cost: pr.cost,
          type: 'return',
        })
      }
    })
  })
  return lines
}

export const LINES = generate()

// Chốt sổ: mọi ngày trước 6 ngày gần nhất đã khóa
export const LOCK_FROM = DATES[DATES.length - 6]

export function isLocked(dk) {
  return dk < LOCK_FROM
}

// Yêu cầu lấy hàng từ kho tổng xuống kênh: pending | approved | rejected
export function initialRequests() {
  return [
    {
      id: 'YC-0012',
      ch: 'SPF',
      date: DATES[DATES.length - 1],
      status: 'pending',
      lines: [
        { sku: 'PC-CAP-SEN-BLK-OS', qty: 20 },
        { sku: 'PC-TEE-PHO-BLK-L', qty: 10 },
      ],
    },
  ]
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
      price: priceOf(r.sku, chId),
      discount: 0,
      fee: c.fee,
      cost: product(r.sku).cost,
      type: 'sale',
    })
  })
}

// Mục tiêu doanh thu gộp theo tháng (30 ngày) của từng kênh, số mẫu. Owner sửa được trên màn Kênh bán.
export function initialTargets() {
  return { '808': 120e6, SHP: 100e6, TLD: 70e6, HP: 55e6, SPF: 45e6 }
}
