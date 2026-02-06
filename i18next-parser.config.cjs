module.exports = {
  // Idiomes que vols mantenir
  locales: ['ca', 'es', 'en'],
  
  // On guardarà els fitxers JSON
  output: 'src/locales/$LOCALE.json',
  
  // On ha de buscar en el teu codi (Escriptori i Mòbil)
  input: [
    'src/**/*.{ts,tsx}',
    'mobile_app/src/**/*.{ts,tsx}'
  ],
  
  // Configuració de seguretat
  keySeparator: '.',
  namespaceSeparator: ':',
  defaultValue: (locale, namespace, key) => {
    return ""; // Si troba una clau nova al codi, la deixa buida al JSON
  },
  indentation: 4,
  keepRemoved: false, // Si esborres una traducció del codi, l'esborra del JSON (manté neteja)
  sort: true, // Ordena sempre per ordre alfabètic
}