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

// Llegir la nova versió de package.json
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const newVersion = packageJson.version;

console.log(`🔄 Actualitzant versió a: ${newVersion}`);

// Fitxers a actualitzar
const filesToUpdate = [
  {
    path: path.join(__dirname, 'README.md'),
    pattern: /# Gestor d'Esdeveniments i Personal V\d+\.\d+\.\d+ \([^)]+\)/,
    replacement: `# Gestor d'Esdeveniments i Personal V${newVersion} (${getMonthYear()})`
  },
  {
    path: path.join(__dirname, 'DEVELOPING.md'), 
    pattern: /## DEVELOPING.md V\d+\.\d+\.\d+/,
    replacement: `## DEVELOPING.md V${newVersion}`
  },
  {
    path: path.join(__dirname, 'DEVELOPING.md'),
    pattern: /# NOVETATS V\d+\.\d+\.\d+ \([^)]+\)/,
    replacement: `# NOVETATS V${newVersion} (${getMonthYear()})`
  },
  {
    path: path.join(__dirname, 'ESQUEMA_UI_DESKTOP.md'),
    pattern: /# Esquema de la Interfície d'Usuari \(UI\) - Aplicació d'Escriptori \(v\d+\.\d+\.\d+\)/,
    replacement: `# Esquema de la Interfície d'Usuari (UI) - Aplicació d'Escriptori (v${newVersion})`
  }
];

// Funció per obtenir el mes i any actual
function getMonthYear() {
  const months = ['GENER', 'FEBRER', 'MARÇ', 'ABRIL', 'MAIG', 'JUNY', 
                  'JULIOL', 'AGOST', 'SETEMBRE', 'OCTUBRE', 'NOVEMBRE', 'DESEMBRE'];
  const now = new Date();
  return `${months[now.getMonth()]} ${now.getFullYear()}`;
}

// Funció per actualitzar un fitxer
function updateFile(filePath, pattern, replacement) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Fitxer no trobat: ${filePath}`);
      return false;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const newContent = content.replace(pattern, replacement);
    
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Actualitzat: ${path.basename(filePath)}`);
      return true;
    } else {
      console.log(`ℹ️  No cal actualitzar: ${path.basename(filePath)} (patró no trobat)`);
      return false;
    }
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
  console.log(`\n🎉 Versió actualitzada correctament!`);
  console.log(`   Recorda fer commit dels canvis:`);
  console.log(`   git add .`);
  console.log(`   git commit -m "chore: bump version to ${newVersion}"`);
} else {
  console.log(`\n⚠️  No s'ha actualitzat cap fitxer. Revisa els patrons de cerca.`);
}
