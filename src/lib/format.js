const vnd = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

// 1250000 -> "1.250.000 ₫"
export function money(n) {
  return vnd.format(Math.round(n))
}

// 4200000 -> "4,2 tr"
export function compact(n) {
  const a = Math.abs(n)
  if (a >= 1e9) return `${(n / 1e9).toFixed(1).replace('.', ',')} tỷ`
  if (a >= 1e6) return `${(n / 1e6).toFixed(1).replace('.', ',')} tr`
  if (a >= 1e3) return `${Math.round(n / 1e3)} k`
  return String(Math.round(n))
}

export function pct(x) {
  return `${(x * 100).toFixed(1).replace('.', ',')}%`
}

// 'YYYY-MM-DD' -> "27/10/2026"
export function dmy(dk) {
  const [y, m, d] = dk.split('-')
  return `${d}/${m}/${y}`
}

// 'YYYY-MM-DD' -> "27/10"
export function dm(dk) {
  const [, m, d] = dk.split('-')
  return `${d}/${m}`
}

// Bỏ dấu để tìm "pho den" ra "Phở / Đen"
export function deaccent(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
}
