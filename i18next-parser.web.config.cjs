module.exports = {
  locales: ['ca', 'es', 'en'],
  output: 'apps_web/landing/src/i18n/translations/$LOCALE.json',
  input: ['apps_web/landing/src/**/*.{astro,ts,tsx}'], // Només mira la web
  sort: true,
  indentation: 4,
  keepRemoved: false,
  keySeparator: '.',
  namespaceSeparator: ':',
  defaultValue: "*NO TRAD*"
}