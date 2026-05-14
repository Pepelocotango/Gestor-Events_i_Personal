// scripts/build-theme.js
const fs = require('fs');
const path = require('path');
const { themeConfig } = require('../theme.config.cjs');

// --- Paths ---
const CSS_OUTPUT_PATH = path.join(__dirname, '../src/index.css');
const TS_OUTPUT_PATH = path.join(__dirname, '../src/utils/themeDefinition.ts');
const CSS_TEMPLATE_PATH = path.join(__dirname, 'templates/index.css.template');

// --- Helpers ---
/**
 * Converteix un string HSL "H S% L%" a un array de números [H, S, L].
 * @param {string} hslString El string HSL.
 * @returns {[number, number, number]}
 */
const hslStringToArray = (hslString) => {
  if (!hslString) return [0, 0, 0];
  const parts = hslString.replace(/%/g, '').split(' ').map(parseFloat);
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
};

/**
 * Genera el bloc de variables CSS per a un tema específic (clar o fosc).
 * @param {object} themeColors - L'objecte de colors per al tema.
 * @returns {string} - El string de variables CSS.
 */
const generateCssVariables = (themeColors) => {
  return Object.entries(themeColors)
    .map(([name, value]) => `    --${name}: ${value};`)
    .join('\n');
};

// --- Main Logic ---

// 1. Generar el contingut per a themeDefinition.ts
console.log('Generant src/utils/themeDefinition.ts...');

const tsHeader = `/**
 * ATENCIÓ: AQUEST FITXER ÉS AUTO-GENERAT.
 * NO EDITAR MANUALMENT.
 *
 * Aquest fitxer defineix els colors del tema en format HSL per ser utilitzats
 * en contextos on les variables CSS no són accessibles, com la generació de PDFs.
 * Es genera a partir de 'theme.config.js' executant 'pnpm run build:theme'.
 * Per fer canvis, modifica 'theme.config.js' i torna a executar l'script.
 */
`;

let tsContent = `${tsHeader}\nexport const themeHslColors = {\n`;

// Mapeja els colors des de la configuració
const mappedColors = {};
for (const [key, configPath] of Object.entries(themeConfig.pdfMapping)) {
  const [theme, colorName] = configPath.split('.');
  mappedColors[key] = hslStringToArray(themeConfig[theme][colorName]);
}

// Afegeix els colors mapejats
for (const [key, value] of Object.entries(mappedColors)) {
  tsContent += `  ${key}: [${value.join(', ')}],\n`;
}

// Afegeix els colors extra per a PDF
for (const [key, value] of Object.entries(themeConfig.pdfExtras)) {
  tsContent += `  ${key}: [${value.join(', ')}],\n`;
}

tsContent += '} as const;\n';

fs.writeFileSync(TS_OUTPUT_PATH, tsContent);
console.log('✅ src/utils/themeDefinition.ts generat correctament.');


// 2. Generar el contingut per a index.css
console.log('Generant src/index.css...');

// Llegir la plantilla
if (!fs.existsSync(CSS_TEMPLATE_PATH)) {
  console.error(`❌ Error: La plantilla CSS no existeix a ${CSS_TEMPLATE_PATH}`);
  process.exit(1);
}
let cssTemplate = fs.readFileSync(CSS_TEMPLATE_PATH, 'utf-8');

// Generar les variables per a cada tema
const lightVars = generateCssVariables(themeConfig.light);
const darkVars = generateCssVariables(themeConfig.dark);

// Reemplaçar els marcadors a la plantilla
cssTemplate = cssTemplate.replace('/*__LIGHT_THEME_VARIABLES__*/', lightVars);
cssTemplate = cssTemplate.replace('/*__DARK_THEME_VARIABLES__*/', darkVars);

fs.writeFileSync(CSS_OUTPUT_PATH, cssTemplate);
console.log('✅ src/index.css generat correctament.');

console.log('\n✨ Procés de construcció del tema completat! ✨');