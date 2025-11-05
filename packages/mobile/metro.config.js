const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Vigilar tot el monorepo
config.watchFolders = [workspaceRoot];

// 2. Resoldre mòduls des de l'arrel i des del paquet local
config.resolver.nodeModulesPaths = [
path.resolve(projectRoot, 'node_modules'),
path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Assegurar que Metro resol els enllaços simbòlics
config.resolver.resolveSymlinks = true;

// 4. Configuració de source maps per a depuració fiable
// Metro genera source maps per defecte, però assegurem que funcionin correctament amb el monorepo
// Els source maps permetran que els stack traces a les DevTools apuntin al codi font original (.tsx)

module.exports = config;