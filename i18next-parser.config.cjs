/**
 * =============================================================================
 * I18NEXT PARSER CONFIG (DESKTOP)
 * =============================================================================
 * DESCRIPCIÓ:
 * Configuració de i18next parser per a l'aplicació desktop.
 *
 * ÍNDEX:
 * - LOCALES: Idiomes suportats (ca, es, en).
 * - OUTPUT: Ruta de sortida per a fitxers de traducció.
 * - INPUT: Rutes d'entrada per escanejar traduccions.
 * =============================================================================
 */

module.exports = {
  locales: ['ca', 'es', 'en'],
  output: 'src/locales/$LOCALE.json',
  input: ['src/**/*.{ts,tsx}'], // Només mira la carpeta de l'ordinador
  sort: true,
  indentation: 4,
  keepRemoved: true,
  keySeparator: '.',
  namespaceSeparator: ':',
  defaultValue: "*NO TRAD*" // El teu senyal per saber que falta traduir
}