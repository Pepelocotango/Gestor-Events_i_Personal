module.exports = {
  locales: ['ca', 'es', 'en'],
  output: 'mobile_app/src/locales/$LOCALE.json',
  input: ['mobile_app/src/**/*.{ts,tsx}'], // Només mira la carpeta del mòbil
  sort: true,
  indentation: 4,
  keepRemoved: false,
  keySeparator: '.',
  namespaceSeparator: ':',
  defaultValue: "*NO TRAD*"
}