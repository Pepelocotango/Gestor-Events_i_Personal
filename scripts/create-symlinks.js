const fs = require('fs');
const path = require('path');

const symlinkPaths = [
{
source: '../../../core', // Ruta relativa des de @gep a core
dest: './packages/mobile/node_modules/@gep/core'
}
];

console.log('Creating symlinks for monorepo...');

symlinkPaths.forEach(({ source, dest }) => {
const destPath = path.resolve(__dirname, '..', dest);
const destDir = path.dirname(destPath);
const sourcePath = path.resolve(destDir, source);

try {
// Assegurar que el directori de destí existeix
if (!fs.existsSync(destDir)) {
fs.mkdirSync(destDir, { recursive: true });
}

// Comprovar si ja existeix un symlink o fitxer i esborrar-lo si cal
if (fs.existsSync(destPath)) {
console.log(`Removing existing file/symlink at ${destPath}`);
fs.rmSync(destPath, { recursive: true, force: true });
}

// Crear l'enllaç simbòlic
fs.symlinkSync(sourcePath, destPath, 'dir');
console.log(`✅ Symlink created: ${destPath} -> ${sourcePath}`);

} catch (error) {
console.error(`❌ Failed to create symlink for ${dest}:`, error);
process.exit(1);
}
});

console.log('Symlinks created successfully.');
