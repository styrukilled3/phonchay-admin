// Dữ liệu mẫu cho bản demo. Thay bằng Supabase ở bước sau.

export const CHANNELS = [
  { id: 'SP', name: 'Shopee', fee: 0.11, v: '--ch-1' },
  { id: 'TT', name: 'TikTok Shop', fee: 0.09, v: '--ch-2' },
  { id: 'WEB', name: 'Website', fee: 0.02, v: '--ch-3' },
  { id: 'STORE', name: 'Cửa hàng', fee: 0.0, v: '--ch-4' },
  { id: 'ZL', name: 'Inbox / Zalo', fee: 0.0, v: '--ch-5' },
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
const CH_ADJ = { SP: 10000, TT: 0, WEB: -10000, STORE: 0, ZL: -20000 }

export function product(sku) {
  return PRODUCTS.find((p) => p.sku === sku)
}

export function priceOf(sku, chId) {
  const p = product(sku)
  return p ? p.base + (CH_ADJ[chId] ?? 0) : 0
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

export const DAYS = 30

const TODAY = new Date()
TODAY.setHours(0, 0, 0, 0)

export const DATES = Array.from({ length: DAYS }, (_, i) => dayKey(addDays(TODAY, -(DAYS - 1 - i))))

// Mỗi kênh một nhịp bán khác nhau để biểu đồ có hình, không phải nhiễu đều
const CH_WEIGHT = { SP: 1.0, TT: 0.85, WEB: 0.45, STORE: 0.6, ZL: 0.35 }

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
