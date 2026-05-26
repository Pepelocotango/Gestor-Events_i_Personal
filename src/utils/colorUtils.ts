/**
 * =============================================================================
 * COLOR UTILS
 * =============================================================================
 * DESCRIPCIÓ:
 * Utilitats per a la conversió i manipulació de colors, especialment per a la generació de PDF.
 *
 * ÍNDEX:
 * - CONVERSIÓ HSL A RGB: Funció per convertir colors del tema HSL al format RGB necessari per PDF.
 * =============================================================================
 */

/**
 * Converteix un color HSL a un format RGB.
 * Aquesta funció és crucial per traduir els colors del tema (definits en HSL)
 * al format RGB que requereix la llibreria de generació de PDF (jspdf-autotable).
 *
 * @param h - Hue (to) [0, 360]
 * @param s - Saturació (saturació) [0, 100]
 * @param l - Lluminositat (lluminositat) [0, 100]
 * @returns Un array que representa el color RGB: [R, G, B]
 */
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return [r, g, b];
}