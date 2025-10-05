/**
 * Aquesta és la font única de veritat per als colors base del tema.
 * Els colors es defineixen com a tuples HSL [Hue, Saturation, Lightness].
 * Aquests valors han d'estar sincronitzats amb els del tema clar a `index.css`.
 */
export const themeHslColors = {
  // Colors semàntics principals
  primary: [221, 83, 53],      // --primary
  success: [142, 71, 45],      // --success
  warning: [38, 92, 50],       // --warning
  destructive: [0, 84, 60],    // --destructive

  // Colors de text
  foreground: [240, 5.9, 10],   // --foreground
  foregroundMuted: [240, 3.8, 46.1], // --muted-foreground
  foregroundWhite: [0, 0, 100], // blanc

  // Grisos del tema
  grayDark: [240, 5.1, 26.1],   // --secondary (dark)
  grayMedium: [75, 85, 99],     // Un gris neutre per a PDFs
  grayBorder: [240, 5.9, 90],    // --border
  graySubtle: [240, 5, 92],      // Un gris molt suau per a sub-capçaleres
  grayMuted: [240, 5, 96.1],     // --muted
  grayLightest: [240, 5, 98],    // Un gris quasi blanc per a notes

  // Altres
  orange: [25, 95, 53],         // Taronja per a la llibreta d'adreces
} as const;