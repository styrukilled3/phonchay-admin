import { CHANNELS, LOW_BELOW, PRODUCTS } from '../data/seed.js'

// Tổng tồn của SKU trên tất cả kênh
export function skuUnits(stock, sku) {
  return CHANNELS.reduce((s, c) => s + (stock[sku]?.[c.id] ?? 0), 0)
}

// Tổng tồn của một kênh
export function chUnits(stock, chId) {
  return PRODUCTS.reduce((s, p) => s + (stock[p.sku]?.[chId] ?? 0), 0)
}

// Trạng thái kho tổng của SKU: 'out' | 'low' | 'ok'
export function stockStatus(wh, p) {
  const t = wh[p.sku] ?? 0
  if (t <= 0) return 'out'
  if (t < (p.low ?? LOW_BELOW)) return 'low'
  return 'ok'
}

export function stockStats(wh) {
  const out = { units: 0, ok: 0, low: 0, out: 0, skus: PRODUCTS.length }
  PRODUCTS.forEach((p) => {
    out.units += wh[p.sku] ?? 0
    out[stockStatus(wh, p)] += 1
  })
  return out
}
