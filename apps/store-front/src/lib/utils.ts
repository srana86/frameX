import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert hex color to oklch format
 * @param hex - Hex color string (e.g., "#ff0000" or "ff0000")
 * @returns oklch color string (e.g., "oklch(0.646 0.222 41.116)")
 */
export function hexToOklch(hex: string): string {
  // Remove # if present
  hex = hex.replace("#", "");

  if (hex.length !== 6) {
    // Default fallback color (orange)
    return "oklch(0.646 0.222 41.116)";
  }

  // Parse RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  // Convert RGB to linear RGB (sRGB to linear)
  const toLinear = (c: number) => {
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const rLinear = toLinear(r);
  const gLinear = toLinear(g);
  const bLinear = toLinear(b);

  // Convert linear RGB to XYZ (D65 white point)
  const x = rLinear * 0.4124564 + gLinear * 0.3575761 + bLinear * 0.1804375;
  const y = rLinear * 0.2126729 + gLinear * 0.7151522 + bLinear * 0.072175;
  const z = rLinear * 0.0193339 + gLinear * 0.119192 + bLinear * 0.9503041;

  // Convert XYZ to OKLab
  // OKLab uses a different transformation matrix
  const l = 0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z;
  const m = 0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z;
  const s = 0.0482003018 * x + 0.2643662691 * y + 0.633851707 * z;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  // OKLab to OKLCH
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const b_ok = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  // Calculate chroma and hue
  const C = Math.sqrt(a * a + b_ok * b_ok);
  let h = Math.atan2(b_ok, a) * (180 / Math.PI);
  if (h < 0) h += 360;

  // Clamp values to reasonable ranges
  const lightness = Math.max(0, Math.min(1, L));
  const chroma = Math.max(0, Math.min(0.4, C));
  const hue = h;

  // Format as oklch string
  return `oklch(${lightness.toFixed(3)} ${chroma.toFixed(3)} ${hue.toFixed(1)})`;
}
