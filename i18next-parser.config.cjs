module.exports = {
  locales: ['ca', 'es', 'en'],
  output: 'src/locales/$LOCALE.json',
  input: ['src/**/*.{ts,tsx}'], // Només mira la carpeta de l'ordinador
  sort: true,
  indentation: 4,
  keepRemoved: false,
  keySeparator: '.',
  namespaceSeparator: ':',
  defaultValue: "*NO TRAD*" // El teu senyal per saber que falta traduir
}