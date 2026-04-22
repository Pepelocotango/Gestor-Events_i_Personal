/**
 * =============================================================================
 * I18NEXT PARSER CONFIG (MOBILE)
 * =============================================================================
 * DESCRIPCIÓ:
 * Configuració de i18next parser per a l'aplicació mòbil.
 *
 * ÍNDEX:
 * - LOCALES: Idiomes suportats (ca, es, en).
 * - OUTPUT: Ruta de sortida per a fitxers de traducció mòbil.
 * - INPUT: Rutes d'entrada per escanejar traduccions mòbil.
 * =============================================================================
 */

module.exports = {
  locales: ['ca', 'es', 'en'],
  output: 'mobile_app/src/locales/$LOCALE.json',
  input: ['mobile_app/src/**/*.{ts,tsx}'], // Només mira la carpeta del mòbil
  sort: true,
  indentation: 4,
  keepRemoved: true,
  keySeparator: '.',
  namespaceSeparator: ':',
  defaultValue: "*NO TRAD*"
}