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
export declare function hslToRgb(h: number, s: number, l: number): [number, number, number];
//# sourceMappingURL=colorUtils.d.ts.map