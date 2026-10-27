import { CHANNELS, LOW_BELOW, PRODUCTS } from '../data/seed.js'

export function skuUnits(stock, sku) {
  return CHANNELS.reduce((s, c) => s + (stock[sku]?.[c.id] ?? 0), 0)
}

export function chUnits(stock, chId) {
  return PRODUCTS.reduce((s, p) => s + (stock[p.sku]?.[chId] ?? 0), 0)
}

// 'out' | 'low' | 'ok'
export function stockStatus(stock, p) {
  const t = skuUnits(stock, p.sku)
  if (t <= 0) return 'out'
  if (t < (p.low ?? LOW_BELOW)) return 'low'
  return 'ok'
}

export function stockStats(stock) {
  const out = { units: 0, ok: 0, low: 0, out: 0, skus: PRODUCTS.length }
  PRODUCTS.forEach((p) => {
    out.units += skuUnits(stock, p.sku)
    out[stockStatus(stock, p)] += 1
  })
  return out
}
