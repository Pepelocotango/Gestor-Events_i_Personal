/**
 * =============================================================================
 * I18NEXT PARSER CONFIG (WEB)
 * =============================================================================
 * DESCRIPCIÓ:
 * Configuració de i18next parser per a l'aplicació web.
 *
 * ÍNDEX:
 * - LOCALES: Idiomes suportats (ca, es, en).
 * - OUTPUT: Ruta de sortida per a fitxers de traducció web.
 * - INPUT: Rutes d'entrada per escanejar traduccions web.
 * =============================================================================
 */

module.exports = {
  locales: ['ca', 'es', 'en'],
  output: 'apps_web/landing/src/i18n/translations/$LOCALE.json',
  input: ['apps_web/landing/src/**/*.{astro,ts,tsx}'], // Només mira la web
  sort: true,
  indentation: 4,
  keepRemoved: true,
  keySeparator: '.',
  namespaceSeparator: ':',
  defaultValue: "*NO TRAD*"
}