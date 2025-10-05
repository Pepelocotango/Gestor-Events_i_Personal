// Aquest fitxer centralitza els colors del tema per a la generació de PDFs.
// Els colors es defineixen en format RGB [R, G, B] per a ser compatibles amb jsPDF-autoTable.
// Aquests valors són conversions dels colors HSL definits a src/index.css i altres colors necessaris.

export const pdfThemeColors = {
  // Colors principals
  primary: [37, 99, 235],       // --primary (blue-600)
  success: [34, 197, 94],       // --success (green-500)
  warning: [234, 179, 8],       // --warning (yellow-500)
  destructive: [220, 38, 38],   // --destructive (red-600)

  // Colors de text
  foreground: [0, 0, 0],             // Negre bàsic per a text
  foregroundMuted: [51, 51, 51],     // #333333
  foregroundWhite: [255, 255, 255],  // Blanc per a capçaleres fosques

  // Colors per a capçaleres de taules
  headerBlue: [59, 130, 246],        // Blau (blue-500)
  headerGreen: [16, 185, 129],       // Verd (green-600)
  headerGray: [75, 85, 99],          // Gris fosc (gray-600)
  headerGrayDark: [52, 73, 94],      // Un altre gris fosc
  headerOrange: [249, 115, 22],      // Taronja (orange-500)
  techSheetHeader: [64, 64, 64],     // Gris per fitxa tècnica

  // Colors per a fons i seccions
  sectionBg: [224, 224, 224],         // #e0e0e0
  categoryBg: [211, 211, 211],        // #d3d3d3
  originBg: [240, 240, 240],          // #f0f0f0
  notesBg: [245, 245, 245],           // #f5f5f5
  techSheetLabelBg: [230, 230, 230],  // #e6e6e6
  techSheetSubHeadBg: [200, 200, 200], // #c8c8c8
} as const;