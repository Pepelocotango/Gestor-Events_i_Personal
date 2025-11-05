# Documentació de comandes i scripts — Gestor Esdeveniments i Personal

Aquest document explica les comandes disponibles, com executar-les (incloent exemples per PowerShell a Windows), i les recomanacions pràctiques per desenvolupament i distribució.

## Resum ràpid
- Projecte: monorepo amb workspaces: `packages/core`, `packages/desktop`, `packages/mobile`.
- Executa `npm install` a l'arrel per instal·lar i enllaçar els paquets locals.

## Scripts principals a l'arrel (`package.json`)

- `npm run postinstall` — Executa `node scripts/create-symlinks.js` per crear enllaços simbòlics del monorepo. Important després d'instal·lar dependències.
- `npm run eas-build-pre-install` — Prepara els fitxers de tema necessaris per a les builds EAS (corre `npm run build:theme --workspace=@gep/desktop`).
- `npm run build:electron` — Executa el build del paquet `@gep/desktop` i després `electron-builder` per empaquetar.
- `npm run build:mac|build:linux|build:win` — Variants que criden `build:electron` amb paràmetres de plataforma.

Nota: aquestes scripts assumeixen que tens instal·lat `electron-builder` i eines natives si embales localment.

## Workflow de desenvolupament — Escriptori (`packages/desktop`)

Principals scripts dins `packages/desktop/package.json`:

- `npm run dev` — Inicia Vite en mode desenvolupament.
- `npm run build:theme` — Genera els fitxers de tema (script Node a `scripts/build-theme.cjs`).
- `npm run build` — `npm run build:theme && tsc && vite build` — compila el tema, TypeScript i construeix la UI.
- `npm run electron-dev` — `concurrently "npm run dev" "npm run electron"` — executa Vite i Electron en paral·lel.
- `npm run electron` — `wait-on tcp:5173 && cross-env NODE_ENV=development electron .` — espera el servidor i inicia Electron.
- `npm run start` — `npm run build:theme && npm run wait && npm run electron-dev` — preparació + arrencada en mode desenvolupament.
- `npm run clean` — Neteja fitxers de build. (Veure nota de portabilitat: a Windows s'ha canviat a `rimraf` per ser creu de plataforma.)

Consell: per desenvolupar des de l'arrel sense cd a `packages/desktop`, utilitza `--workspace=@gep/desktop`, per exemple:

```powershell
npm run start --workspace=@gep/desktop
```

## Workflow mòbil (`packages/mobile`)

Principals scripts dins `packages/mobile/package.json`:

- `npm run start` — `expo start` (inicia Metro/Expo devtools).
- `npm run android` — `expo run:android` (si tens Android Studio i dispositiu/emulador configurat).
- `npm run ios` — `expo run:ios` (requer macOS + Xcode).
- `npm run web` — `expo start --web`.
- `npm run build:android-dev` — `npx eas build --platform android --profile poc --local` (build local amb EAS; requereix eas-cli i configuració SDK si es fa local).

Per a builds al núvol amb EAS (recomanat si no tens configuració local):

```powershell
eas build -p android --profile development
eas build -p android --profile poc
eas build -p android --profile preview
```

Requisits: compte Expo, `eas-cli` (p. ex. `npm i -g eas-cli`) i fitxer `eas.json` configurat.

## Exemples pràctics (PowerShell — Windows)

- Clonar, instal·lar i arrencar el desktop en mode dev des de l'arrel:

```powershell
git clone https://github.com/Pepelocotango/Gestor-Events_i_Personal.git
cd Gestor-Events_i_Personal
npm install
npm run start --workspace=@gep/desktop
```

- Construir l'executable Windows (des de l'arrel):

```powershell
npm run build:win
```

- Construir i provar app Android local (mòbil):

```powershell
npm run android --workspace=@gep/mobile
```

Nota sobre PowerShell i comandos Unix: alguns scripts del projecte usen ordres Unix (`rm -rf`). Al Windows preferim `rimraf` o utilitzar WSL. Hem actualitzat el `packages/desktop/package.json` per usar `rimraf` en el `clean` script (cal executar `npm install` per instal·lar la nova dependència dev si no està present).

## Scripts compostos — desglossament

- `build:electron` (arrel):
  1) `npm run build --workspace=@gep/desktop` — compila el paquet desktop (tema + TS + vite build).
  2) `electron-builder --projectDir packages/desktop` — empaqueta l'app segons la configuració `build` dins `packages/desktop/package.json`.

- `build:mac|build:linux|build:win` — simplement forwarden paràmetres a `build:electron` per empaquetar per la plataforma corresponent.

## Notes d'implementació i recomanacions (accions aplicades)

1. Portabilitat `clean` (Windows): hem substituït `rm -rf` per `rimraf` al `packages/desktop/package.json` i hem afegit `rimraf` a `devDependencies` per fer el script creu de plataforma. Executa `npm install` després d'aquesta modificació.

2. Dependència local `@gep/core` a `packages/mobile`: actualitzat perquè apunti al paquet local (`file:../core`) per garantir que s'utilitza la versió local durant el desenvolupament del monorepo.

3. Documentació afegida: secció de troubleshooting bàsic i errors comuns (veure més avall).

## Troubleshooting i errors comuns

- Error: `electron-builder` no trobat o falles d'enllaç natiu
  - Solució: instal·la a l'arrel `npm i --save-dev electron-builder` i assegura que tens les eines natives de la plataforma. En CI, comprova les accions que instal·len dependències abans d'executar l'script.

- Error: `wait-on` no troba el port 5173
  - Causa: Vite no s'ha iniciat o està en un port diferent.
  - Solució: comprova que `npm run dev` està corrent i escoltant el port 5173; o ajusta el port a `vite.config.ts` si cal.

- Error: fallada `postinstall` o enllaços simbòlics no creats
  - Solució: executar manualment

```powershell
node scripts/create-symlinks.js
```

  - I comprovar permisos on Windows (executa PowerShell com administrador si cal). Alternativa: utilitza WSL si tens problemes amb enllaços simbòlics a NTFS.

- Error: `rimraf` no trobat després del canvi
  - Solució: a l'arrel o a `packages/desktop`, executar `npm install` per instal·lar noves devDependencies.

## Revisions aplicades (resum dels canvis que he implementat)

- Actualitzat `COMANDS_&_SCRIPTS_DOCU.md` amb:
  - Exemples PowerShell i aclariments de plataforma.
  - Secció de troubleshooting i notes operatives.
  - Explicació detallada dels scripts compostos.

- Modificat `packages/desktop/package.json` per usar `rimraf` al `clean` i afegit `rimraf` a `devDependencies` (cal `npm install`).

- Modificat `packages/mobile/package.json` per referenciar `@gep/core` com a `file:../core` per al desenvolupament local.

## Passos següents recomanats per a tu

1. Executa `npm install` des de l'arrel per aplicar la nova devDependency (`rimraf`).
2. Prova `npm run clean --workspace=@gep/desktop` i `npm run start --workspace=@gep/desktop` a Windows (PowerShell) per verificar l'arrencada.
3. Si utilitzes CI (GitHub Actions), assegura't que `npm ci` s'executa abans dels passos d'empaquetat i que les credencials (google-credentials.json) estan disponibles a l'entorn.

Si vols, ara puc aplicar automàticament els canvis als `package.json` (ja ho he fet) i pujar una llista de verificació addicional per a CI o generar un petit script de comprovació local.

---
_Fi de la documentació actualitzada_.