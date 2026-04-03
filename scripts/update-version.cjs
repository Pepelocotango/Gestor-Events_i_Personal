#!/usr/bin/env node

/**
 * Script d'actualització automàtica de versions
 * 
 * Aquest script s'executa automàticament després de `npm version` 
 * i actualitza tots els llocs on apareix la versió hardcoded.
 * 
 * Ús:
 * - npm version patch   (actualitza 1.6.0 → 1.6.1)
 * - npm version minor   (actualitza 1.6.0 → 1.7.0) 
 * - npm version major   (actualitza 1.6.0 → 2.0.0)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Arrel del projecte (el script és a scripts/, per això cal pujar un nivell)
const ROOT = path.resolve(__dirname, '..');

// Llegir la nova versió de package.json
const packageJsonPath = path.join(ROOT, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const newVersion = packageJson.version;

console.log(`🔄 Actualitzant versió a: ${newVersion}`);

// Fitxers a actualitzar
const filesToUpdate = [
  {
    path: path.join(ROOT, 'README.md'),
    pattern: /# Gestor d'Esdeveniments i Personal V\d+\.\d+\.\d+[^)]*\)/,
    replacement: `# Gestor d'Esdeveniments i Personal V${newVersion} (${getMonthYear()})` 
  },
  {
    path: path.join(ROOT, 'DEVELOPING.md'),
    pattern: /## DEVELOPING\.md V\d+\.\d+\.\d+/,
    replacement: `## DEVELOPING.md V${newVersion}` 
  },
  {
    path: path.join(ROOT, 'DEVELOPING.md'),
    pattern: /# NOVETATS V\d+\.\d+\.\d+[^)]*\)/,
    replacement: `# NOVETATS V${newVersion} (${getMonthYear()})` 
  },
  {
    path: path.join(ROOT, 'ESQUEMA_UI_DESKTOP.md'),
    pattern: /# Esquema de la Interf.cie d.Usuari \(UI\)[^\n]*\(v\d+\.\d+\.\d+\)/,
    replacement: `# Esquema de la Interfície d'Usuari (UI) - Aplicació d'Escriptori (v${newVersion})` 
  },
  {
    path: path.join(ROOT, 'index.html'),
    pattern: /<title>[^<]*V\d+\.\d+\.\d+<\/title>/,
    replacement: `<title>Gestor de Esdeveniments i Personal V${newVersion}</title>` 
  },
  {
    path: path.join(ROOT, 'ARBRE_DIRECTORIS.txt'),
    pattern: /\(v1\.6\.3\+\)/g,
    replacement: `(v${newVersion}+)`
  },
  {
    path: path.join(ROOT, 'apps_web', 'landing', 'src', 'layouts', 'Layout.astro'),
    pattern: /<span>Nova versió V\d+\.\d+\.\d+ [^ ]+ \d+ disponible<\/span>/,
    replacement: `<span>Nova versió V${newVersion} ${getMonthYearTitleCase()} disponible</span>`
  },
  {
    path: path.join(ROOT, 'apps_web', 'landing', 'src', 'i18n', 'translations', 'ca.json'),
    pattern: /"version":\s*"[^"]*\d+\.\d+\.\d+[^"]*GPL[^"]*"/,
    replacement: `"version": "Versió ${newVersion} - Sota llicència GPL v3.0"` 
  },
  {
    path: path.join(ROOT, 'apps_web', 'landing', 'src', 'i18n', 'translations', 'en.json'),
    pattern: /"version":\s*"[^"]*\d+\.\d+\.\d+[^"]*GPL[^"]*"/,
    replacement: `"version": "Version ${newVersion} - Under GPL v3.0 license"` 
  },
  {
    path: path.join(ROOT, 'apps_web', 'landing', 'src', 'i18n', 'translations', 'es.json'),
    pattern: /"version":\s*"[^"]*\d+\.\d+\.\d+[^"]*GPL[^"]*"/,
    replacement: `"version": "Versión ${newVersion} - Bajo licencia GPL v3.0"` 
  },
];

// Funció per obtenir el mes i any actual en majúscules (per documents)
function getMonthYear() {
  const months = ['GENER', 'FEBRER', 'MARÇ', 'ABRIL', 'MAIG', 'JUNY', 
                  'JULIOL', 'AGOST', 'SETEMBRE', 'OCTUBRE', 'NOVEMBRE', 'DESEMBRE'];
  const now = new Date();
  return `${months[now.getMonth()]} ${now.getFullYear()}`;
}

// Funció per obtenir el mes i any en format títol (per la web)
function getMonthYearTitleCase() {
  const months = ['Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny', 
                  'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre'];
  const now = new Date();
  return `${months[now.getMonth()]} ${now.getFullYear()}`;
}

// Funció per actualitzar un fitxer
function updateFile(filePath, pattern, replacement) {
  try {
    console.log('🔍 Checking file:', filePath);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Fitxer no trobat: ${filePath}`);
      return false;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const hasMatch = pattern.test(content);
    console.log(`🎯 Pattern test for ${path.basename(filePath)}:`, hasMatch);
    
    if (hasMatch) {
      const newContent = content.replace(pattern, replacement);
      if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✅ Actualitzat: ${path.basename(filePath)}`);
        return true;
      }
    }
    
    console.log(`ℹ️  No s'ha modificat: ${path.basename(filePath)}`);
    return false;
  } catch (error) {
    console.log(`❌ Error actualitzant ${path.basename(filePath)}:`, error.message);
    return false;
  }
}

// Actualitzar tots els fitxers
let updatedCount = 0;
filesToUpdate.forEach(file => {
  if (updateFile(file.path, file.pattern, file.replacement)) {
    updatedCount++;
  }
});

// Resum
console.log(`\n📋 Resum de l'actualització:`);
console.log(`   Versió actualitzada a: ${newVersion}`);
console.log(`   Fitxers actualitzats: ${updatedCount}/${filesToUpdate.length}`);

if (updatedCount > 0) {
  try {
    // Comprovem si som en un repo git abans de fer res
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
    execSync('git add -A', { stdio: 'inherit' });
    // Si venim de npm version, el commit de la versió ja s'ha fet, l'esmenem.
    // Si no, simplement deixem els fitxers a l'stage.
    console.log(`\n📂 Fitxers preparats per al commit.`);
  } catch (error) {
    console.log(`\nℹ️  No s'ha realitzat cap acció de git (no és un repositori o error de comanda).`);
  }
} else {
  console.log(`\n⚠️  No s'ha actualitzat cap fitxer. Revisa els patrons de cerca.`);
}
