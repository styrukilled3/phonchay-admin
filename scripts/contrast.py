"""Đo contrast WCAG của design tokens (OKLCH). Chạy: python3 scripts/contrast.py"""
import math


def oklch_to_srgb(L, C, h):
    a = C * math.cos(math.radians(h))
    b = C * math.sin(math.radians(h))
    l_ = L + 0.3963377774 * a + 0.2158037573 * b
    m_ = L - 0.1055613458 * a - 0.0638541728 * b
    s_ = L - 0.0894841775 * a - 1.2914855480 * b
    l, m, s = l_ ** 3, m_ ** 3, s_ ** 3
    r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
    g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
    bl = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    return [min(1.0, max(0.0, v)) for v in (r, g, bl)]


def luminance(rgb_linear):
    r, g, b = rgb_linear
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    la, lb = luminance(oklch_to_srgb(*a)), luminance(oklch_to_srgb(*b))
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


T = {
    "bg": (0.17, 0.012, 270),
    "surface": (0.22, 0.014, 270),
    "surface-2": (0.27, 0.014, 270),
    "surface-3": (0.32, 0.014, 270),
    "line": (0.33, 0.012, 270),
    "line-strong": (0.61, 0.012, 270),
    "ink": (0.97, 0.004, 270),
    "ink-2": (0.73, 0.012, 270),
    "ink-3": (0.66, 0.012, 270),
    "accent": (0.70, 0.19, 28),
    "accent-2": (0.76, 0.16, 48),
    "accent-ink": (0.18, 0.02, 28),
    "up": (0.80, 0.15, 165),
    "down": (0.72, 0.18, 22),
    "ch-1": (0.70, 0.19, 28),
    "ch-2": (0.79, 0.15, 70),
    "ch-3": (0.72, 0.15, 320),
    "ch-4": (0.79, 0.12, 195),
    "ch-5": (0.70, 0.13, 268),
}

# (foreground, background, ngưỡng tối thiểu, ghi chú)
PAIRS = [
    ("ink", "bg", 4.5, "chữ chính / nền trang"),
    ("ink", "surface", 4.5, "chữ chính / card"),
    ("ink", "surface-2", 4.5, "chữ chính / ô nhập"),
    ("ink", "surface-3", 4.5, "chữ chính / nav đang chọn"),
    ("ink-2", "surface", 4.5, "chữ phụ / card"),
    ("ink-2", "surface-2", 4.5, "chữ phụ / ô nhập"),
    ("ink-3", "surface", 4.5, "chữ mờ / card"),
    ("ink-3", "surface-2", 4.5, "placeholder / ô nhập"),
    ("accent-ink", "accent", 4.5, "chữ trên nút coral"),
    ("accent-ink", "accent-2", 4.5, "chữ trên đầu gradient"),
    ("accent", "surface", 4.5, "chữ accent / card"),
    ("up", "surface", 4.5, "số tăng"),
    ("down", "surface", 4.5, "số giảm"),
    ("line", "surface", 1.0, "viền card (trang trí)"),
    ("line-strong", "surface-2", 3.0, "viền control"),
    ("ch-1", "surface", 3.0, "màu kênh 1 (đồ họa)"),
    ("ch-2", "surface", 3.0, "màu kênh 2 (đồ họa)"),
    ("ch-3", "surface", 3.0, "màu kênh 3 (đồ họa)"),
    ("ch-4", "surface", 3.0, "màu kênh 4 (đồ họa)"),
    ("ch-5", "surface", 3.0, "màu kênh 5 (đồ họa)"),
]

if __name__ == "__main__":
    fail = 0
    for fg, bg, need, note in PAIRS:
        r = contrast(T[fg], T[bg])
        ok = r >= need
        fail += not ok
        print(f"{'OK  ' if ok else 'FAIL'} {r:5.2f}:1 (cần {need}) {fg} / {bg}  - {note}")
    raise SystemExit(1 if fail else 0)
