---

## 📝 Logs, Backups i Càrrega Automàtica de Dades

### Logs de Sessió (només desenvolupament)

- **Arxiu:** `main.cjs`
- **Ruta dels logs:** `logs/app-<timestamp>.log` dins la carpeta de dades de l'usuari (`app.getPath('userData')/logs`).
- **Funcionament:**
  - Cada execució de l'app crea un fitxer de log nou amb tots els `console.log`, `console.error` i `console.warn` de la sessió.
  - Si hi ha més de 20 fitxers de log, s'esborren els més antics automàticament.
  - Tots els missatges de log es mostren també per consola.
- **Codi relacionat:** Bloc de codi al principi de `main.cjs` (comentari: `// --- LOGS DE SESSIÓ PER DESENVOLUPAMENT ---`).

### Backups automàtics

- **Arxiu:** `main.cjs`
- **Funció:** `createBackup()`
- **Ruta dels backups:** `backups/backup-events_data-<timestamp>.json` dins la carpeta de dades de l'usuari.
- **Funcionament:**
  - Es crea una còpia de seguretat del fitxer principal de dades (`events_data.json`) cada cop que es confirma la sortida de l'app.
  - Es mantenen només els 5 backups més recents (funció `cleanupOldBackups()`).
- **Codi relacionat:** Funcions `createBackup()` i `cleanupOldBackups()` a `main.cjs`.

### Càrrega automàtica de sessió i dades

- **Arxiu:** `main.cjs`
- **Funció:** `loadSessionData()`
- **Fitxer:** `session.json` (estat de la finestra i, si està implementat, altres dades de sessió).
- **Càrrega de dades principals:**
  - **Funció:** `ipcMain.handle('load-app-data', ...)` i `saveDataWithErrorHandling()`
  - **Fitxer:** `events_data.json`
- **Funcionament:**
  - En iniciar l'app, es carrega l'estat de la finestra i les dades principals si existeixen.
  - Quan es tanquen o es guarden canvis, es desa l'estat i les dades.
- **Frontend:**
  - El frontend (React) crida la càrrega i el desat de dades via `window.electronAPI`.

> Consulta el codi de `main.cjs` per veure la implementació exacta de cada funció.

###NOVA BRANCA DESENVOLUPAMENT -->DEV

### `README.md`**

# Gestor d'Esdeveniments i Personal v0.3.0

Aplicació d'escriptori multiplataforma (construïda amb Electron, React i Vite) per a la gestió integral d'esdeveniments, personal i les seves assignacions. El projecte està actualment en fase de desenvolupament actiu.

## 💾 Descàrrega i Instal·lació

Pots descarregar l'última versió de l'aplicació directament des de la nostra secció de [**Releases a GitHub**](https://github.com/Pepelocotango/Gestor-Events_i_Personal/releases).

Cada versió inclou binaris compilats per a Windows, macOS i Linux. Assegura't de descarregar el fitxer correcte per al teu sistema operatiu.

### Requisits Mínims del Sistema

*   **Windows:** Windows 10 (64-bit) o superior.
*   **macOS:** macOS 10.15 (Catalina) o superior.
*   **Linux:** Ubuntu 18.04, Debian 10, Fedora 28 o qualsevol distribució equivalent o més recent.

### Instruccions per Plataforma

#### 🪟 **Windows**

Oferim dues versions per a Windows:

1.  **Instal·lador (`...-Installer.exe`):**
    *   **Recomanat per a la majoria d'usuaris.**
    *   Descarrega i executa el fitxer `.exe` que conté la paraula `Installer`.
    *   Això instal·larà l'aplicació al teu sistema, creant una drecera a l'escriptori i una entrada al menú d'inici per a un accés fàcil.

2.  **Versió Portable (`...-Portable.exe`):**
    *   **Ideal per executar sense instal·lar, per exemple des d'un pen-drive.**
    *   Descarrega el fitxer `.exe` que conté la paraula `Portable`.
    *   Pots executar l'aplicació directament amb un doble clic sense que s'instal·li res al teu sistema.

####  **macOS**

Per a macOS, la distribució es fa a través d'un fitxer `.dmg`:

*   Descarrega el fitxer `...-macOS-10.15+.dmg`.
*   Fes-hi doble clic per obrir-lo. S'obrirà una finestra del Finder.
*   Per instal·lar l'aplicació, simplement **arrossega la icona de l'aplicació a la drecera de la carpeta d'Aplicacions** que apareix a la mateixa finestra.
*   Ja pots executar l'aplicació des de la teva carpeta d'Aplicacions o mitjançant Launchpad.

> **Nota:** La primera vegada que obris l'aplicació, com que no està descarregada des de l'App Store, macOS podria mostrar un avís de seguretat.
Per obrir-la, fes clic dret sobre la icona de l'aplicació, selecciona "Obrir" i confirma l'acció al diàleg que apareixerà.
Si el pas anterior no funciona, prova de anar a preferències de sistema i donar-li permís d'execució a la App. ( gràcies Isaac!)

#### 🐧 **Linux**

Per a Linux, utilitzem el format `AppImage`, que no requereix instal·lació:

*   Descarrega el fitxer `...-Linux-Ubuntu18.04+.AppImage`.
*   **Dona-li permisos d'execució.** La manera més fàcil és fent clic dret sobre el fitxer > Propietats > Permisos > i marcar la casella "Permet executar el fitxer com un programa".
    *   Alternativament, des de la terminal: `chmod +x GestorEsdeveniments-*.AppImage`
*   Fes doble clic sobre el fitxer per executar l'aplicació.

---


### 📂 Fitxers d'Exemple

Per ajudar-te a començar, hem inclòs una carpeta anomenada `examples_json` amb fitxers de dades d'exemple que pots carregar a l'aplicació:

*   **`example_all.json`**: Un fitxer complet amb esdeveniments, personal i assignacions per veure totes les funcionalitats de l'aplicació en acció.
*   **`example_person.json`**: Un fitxer més senzill centrat en la gestió de la base de dades de persones.

Pots carregar aquests fitxers des de l'aplicació utilitzant el botó "Carregar dades" per familiaritzar-te amb l'estructura de dades.


---

### 🆕 NOVETATS: Fitxes de Bolo Dinàmiques i Exportació PDF Professional (v0.3.x)

A la branca `feat/fitxes-bolo-complet` s'han implementat grans millores a la funcionalitat de fitxes tècniques de bolo:

- **UI dinàmica i moderna:**
  - Selectors SI/NO per a camps com Premuntatge, Zona reservada parking, Vídeo, Lloguers, Material d’altres equipaments, amb camps de detall que apareixen només quan cal.
  - Dropdowns numèrics per a actors i tècnics de companyia, amb text condicionat per noms.
  - Botons d'eliminació compactes (X) i accions col·locades de forma més intuïtiva (ex: "Actualitza des d'assignacions" al capçalera de secció).
  - Sincronització automàtica de notes d'assignació i eliminació del camp "Origen Personal".
- **Exportació a PDF professional:**
  - El botó "Exportar a PDF" genera una fitxa tècnica compacta, clara i totalment basada en text (no captura de pantalla).
  - El PDF inclou seccions, taules i formatació optimitzada per impressió professional.
  - S'han solucionat tots els errors de TypeScript relacionats amb valors indefinits a l'exportació.
- **Millores d'UX i robustesa:**
  - Camps i seccions s'actualitzen i desen automàticament.
  - Validació i persistència de seleccions SI/NO i camps dinàmics.
  - Tots els canvis s'han documentat i provat amb usuaris reals.

**Arxius clau modificats:**
- `src/components/tech_sheets/TechSheetForm.tsx` (UI, lògica, PDF)
- `src/components/tech_sheets/TechSheetSection.tsx` (accions de capçalera)
- `src/types.ts` (nous camps i lògica de fitxa)

> Consulta la secció corresponent més avall per a detalls d'ús i estructura.

---

#### 📑 Responsabilitat dels fitxers clau de Fitxes de Bolo

- **`src/components/tech_sheets/TechSheetForm.tsx`**: Formulari principal i lògica de tota la fitxa tècnica. Gestiona l'estat intern, la dinàmica dels camps (SI/NO, dropdowns, camps condicionals), la sincronització de notes, la validació i l'exportació professional a PDF. Tota la interacció de l'usuari amb la fitxa passa per aquest component.
- **`src/components/tech_sheets/TechSheetSection.tsx`**: Component de presentació que encapsula cada secció de la fitxa (ex: Personal Tècnic, Horaris, Logística...). Permet injectar accions personalitzades a la capçalera de cada secció (com el botó "Actualitza des d'assignacions").
- **`src/components/tech_sheets/TechSheetField.tsx`**: Component reutilitzable per a camps individuals de la fitxa (inputs, selects, textareas), amb suport per a validació, focus i accessibilitat.
- **`src/types.ts`**: Defineix totes les interfícies i tipus TypeScript per a la fitxa tècnica, incloent la descripció de cada secció, llistes, camps opcionals i la seva estructura jeràrquica. Qualsevol canvi d'estructura de dades de la fitxa s'ha de reflectir aquí.
- **`src/hooks/useEventDataManager.ts`**: Gestiona l'estat global de l'aplicació, incloent la persistència i sincronització de les fitxes tècniques amb la resta de dades de l'esdeveniment. S'encarrega de desar automàticament els canvis i d'actualitzar la fitxa quan canvien les assignacions.
- **`src/components/TechSheetsDisplay.tsx`**: Component contenidor que mostra la fitxa de bolo seleccionada i permet navegar entre fitxes d'esdeveniments. Orquestra la visualització i la selecció de fitxes.

> Amb aquesta arquitectura modular, cada fitxer té una responsabilitat clara i delimitada, facilitant el manteniment, l'escalabilitat i la col·laboració entre desenvolupadors.

---

### 🚀 Funcionalitats Clau

-   **Gestió d'Esdeveniments i Assignacions:** Creació d'esdeveniments marc i assignació de personal amb estats detallats (`Sí`, `No`, `Pendent` i `Mixt` per dies).
-   **Base de Dades de Personal:** Gestor centralitzat de persones i grups.
-   **Visualització Avançada:** Calendari multi-vista, llista filtrable i resums exportables.
-   **Detecció de Conflictes:** El sistema avisa si una persona s'assigna a múltiples tasques en un mateix dia.
-   **Importació i Exportació:** Càrrega/desat en JSON i exportació a CSV.

-   **✨ [NOU] Integració Avançada amb Google Calendar:**
    *   **Motor de Sincronització unidireccional:**
        *   Escriu exclusivament en un calendari propi anomenat **"Gestor d'Esdeveniments (App)"**, creat automàticament per garantir la seguretat i aïllament de les dades.
        *   Puja canvis manualment amb el botó "Sincronitzar". Els canvis dels events fets a Google Calendar, no es guarden a la app, es perdràn a la seguent sincronització manual. 
        
    *   **Visualització de Calendaris Addicionals:**
        *   Permet seleccionar altres calendaris del teu compte de Google (personal, feina, etc.) per a visualitzar-los com a només lectura, integrats a la vista principal.
    *   **Feedback Visual Clar:**
        *   El botó "Sincronitzar" mostra un **estat de càrrega** durant el procés.
        *   Els esdeveniments vinculats mostren una **icona de Google** per a una identificació ràpida.
    *   **Arquitectura Robusta:**
        *   Autenticació segura mitjançant el protocol **OAuth 2.0**.
        *   **Funcionament 100% offline** garantit. La integració és una capa addicional que no afecta la funcionalitat principal.

-   **Interfície d'Usuari:**
    *   Suport per a tema clar i fosc.
    *   Notificacions (toasts) per a les accions de l'usuari.
    *   Visualització detallada d'estats mixts.
---
## 🛠️ Pila Tecnològica (Tech Stack)

-   **Electron:** `^29.4.6`
-   **Vite:** `^6.3.5`
-   **React:** `^18.3.1`
-   **TypeScript:** `~5.5.3`
-   **Tailwind CSS:** `^3.4.17`
-   **FullCalendar:** `^6.1.17`
-   **Electron Builder:** `^24.13.3`

## 🏗️ Arquitectura i Fitxers Clau

El projecte segueix una arquitectura de tres capes per separar responsabilitats, ideal per a aplicacions Electron amb un frontend complex.

### 1. El Nucli Natiu (Backend - Electron)

*   **`main.cjs`:** És el **cervell de l'aplicació**. Les seves responsabilitats principals són:
    *   **Gestió Nativa:** Controla el cicle de vida de l'aplicació, les finestres, els menús i l'accés segur al sistema de fitxers.
    *   **Autenticació OAuth 2.0:** Implementa el flux complet de connexió amb Google, aixecant un **servidor HTTP temporal** per capturar la resposta de l'usuari de forma segura.
    *   **Gestió del Calendari Dedicat:** Conté la funció `findOrCreateAppCalendar`, que utilitza la constant `APP_CALENDAR_NAME` per crear (si no existeix) o localitzar el calendari propi de l'app a Google, garantint l'aïllament de les dades gestionades per l'aplicació.
    *   **Motor de Sincronització (`syncWithGoogle`):** Allotja la lògica principal per sincronitzar les dades locals amb Google Calendar. Aquest procés buida primer tots els esdeveniments del calendari dedicat de l'app a Google i després puja la versió actual dels esdeveniments locals. Això assegura que les dades locals siguin la font de veritat. Actualitza els esdeveniments locals amb els ID de Google després de la pujada.
    *   **Recuperació d'Esdeveniments de Google (`getGoogleEvents`):** Obté esdeveniments dels calendaris de Google que l'usuari ha seleccionat per a visualització (a través de `GoogleSettingsModal.tsx`), incloent el calendari dedicat de l'app.

### 2. El Pont de Comunicació Segur

*   **`preload.cjs`:** Actua com un **pont segur i controlat** entre el backend (procés principal d'Electron) i el frontend (React). Exposa de manera explícita una llista blanca de funcions del procés principal (com `startGoogleAuth`, `syncWithGoogle`, `getGoogleEvents`, etc.) perquè el codi React les pugui invocar de forma segura mitjançant `window.electronAPI`.

### 3. La Interfície d'Usuari (Frontend - React)

*   **Gestor d'Estat Central (`hooks/useEventDataManager.ts`):** És el **cor lògic del frontend**.
    *   Centralitza totes les dades de l'aplicació: `eventFrames` (esdeveniments locals gestionats per l'app), `peopleGroups` (persones/grups), i `googleEvents` (esdeveniments recuperats de Google Calendar per a visualització).
    *   Proporciona funcions CRUD per a les dades locals.
    *   Orquestra les crides a les funcions del backend (exposades via `preload.cjs`) per a accions com l'autenticació (`startGoogleAuth`), la sincronització (`syncWithGoogle`), i la recuperació d'esdeveniments de Google (`refreshGoogleEvents` que internament crida `getGoogleEvents` del backend).
    *   Després d'una sincronització amb Google reeixida, utilitza la funció `loadData` per actualitzar els `eventFrames` locals amb els `googleEventId` retornats pel backend.
    *   Gestiona l'estat de la interfície relacionat amb la sincronització (p.ex., `isSyncing`).

*   **Components Reutilitzables (`src/components`):**
    *   **`Controls.tsx`:** La barra d'eines principal, que conté botons d'acció com "Guardar", "Carregar", "Gestionar Persones", i el botó "Sincronitzar" (que mostra un estat de càrrega durant l'operació).
    *   **`MainDisplay.tsx`:** Orquestra la vista principal de l'aplicació. És responsable de combinar les dades dels `eventFrames` locals (editables) i els `googleEvents` (visualitzats des de Google, típicament de només lectura) per a la seva presentació al component `FullCalendar`. També gestiona la llista filtrable d'esdeveniments.
    *   **`EventFrameCard.tsx`:** Representa visualment cada esdeveniment (`EventFrame`) a la llista, mostrant les seves assignacions i permetent accions com editar o eliminar. Inclou un indicador visual si l'esdeveniment està vinculat a Google Calendar.

*   **Modals Interactius (`src/components/modals`):**
    *   **`GoogleSettingsModal.tsx`:** Permet a l'usuari configurar la connexió i seleccionar quins calendaris de només lectura vol visualitzar.
---

### 📁 Estructura i Responsabilitat dels Fitxers

L'organització del projecte separa clarament la configuració, el codi del backend, el pont de comunicació i el frontend.

#### 1. Fitxers de Configuració i Arrel del Projecte

Aquests fitxers defineixen el projecte, les seves dependències i com es construeix l'aplicació.

*   **`package.json`**: El manifest del projecte. Defineix dependències clau com `googleapis` i scripts de compilació com `build:electron`. **[Modificat]** La clau `build.files` s'ha actualitzat per incloure `google-credentials.json`, assegurant que s'empaqueti a la versió final.
*   **[NOU] `google-credentials.json`**: Emmagatzema les claus secretes `client_id` i `client_secret` de l'API de Google. És un fitxer local, ignorat per `.gitignore`, per seguretat.
*   **`vite.config.ts`**: Configuració de Vite, on es defineixen àlies d'import (`@/components`) i s'exclouen mòduls natius d'Electron del *bundle*.
*   **`tailwind.config.cjs`**: Configuració de TailwindCSS, incloent un **plugin personalitzat** per aplicar estils al calendari en mode fosc.
*   **`postcss.config.cjs` i `tsconfig.json`**: Fitxers auxiliars per a PostCSS i TypeScript.
*   **`index.html`**: El punt d'entrada HTML on es munta l'aplicació React.

#### 2. Nucli Natiu (Backend - Electron)

*   **`main.cjs` (Procés Principal)**: És el **backend central** de l'aplicació.
    *   **Gestió Nativa:** Controla el cicle de vida de l'aplicació, les finestres, els menús i l'accés segur al sistema de fitxers.
    *   **Autenticació OAuth 2.0:** Implementa el flux de connexió amb Google, aixecant un **servidor web temporal** per capturar la resposta.
    *   **Motor de Sincronització:** Conté la lògica de `syncWithGoogle` (pujada/baixada), `findOrCreateAppCalendar` (gestió del calendari dedicat), 

*   **`preload.cjs` (Pont de Comunicació Segur)**:
    *   Utilitza `contextBridge` per exposar de manera segura una llista blanca de funcions del backend (`syncWithGoogle`, `startGoogleAuth`, etc.) al frontend mitjançant l'objecte `window.electronAPI`.

#### 3. Interfície d'Usuari i Lògica de Frontend (`src/`)

*   **Punt d'Entrada i Gestió de l'Estat Global:**
    *   **`App.tsx`**: Component arrel que munta tota la interfície i gestiona els modals i notificacions.
    *   **`hooks/useEventDataManager.ts`**: El **"cervell" del frontend**. Centralitza l'estat, les operacions CRUD, la detecció de conflictes d'assignació i orquestra les crides a l'API d'Electron.
    *   **`contexts/EventDataContext.tsx`**: Posa les dades del hook a disposició de tota l'aplicació.

*   **Dades i Utilitats (`src/utils/`):**
    *   **`types.ts`**: Defineix totes les interfícies de TypeScript, com `EventFrame` i `Conflict`.
    *   **`constants.tsx`**: Emmagatzema constants i icones SVG (`GoogleIcon`, `SyncIcon`, etc.).
    *   **`dataMigration.ts`**: Conté la lògica per **importar dades de versions antigues**, garantint la retrocompatibilitat.
    *   **Altres utilitats**: `dateFormat.ts`, `statusUtils.ts` i `dateRangeFormatter.ts`.

*   **Components de la Interfície (`src/components/`):**
    *   **`MainDisplay.tsx`**: Orquestra la vista principal. Implementa la **lògica d'expansió automàtica** de la llista en aplicar filtres.
    *   **`Controls.tsx`**: Barra d'eines amb el botó "Sincronitzar", que mostra un estat de càrrega.
    *   **`EventFrameCard.tsx`**: Mostra la targeta de cada esdeveniment, incloent l'indicador de Google.
    *   **`AssignmentCard.tsx`**: Mostra la targeta de cada assignació amb la seva vista detallada per dies.
    *   **`SummaryReports.tsx`**: Component que genera els resums de dades i permet l'**exportació granular** de cada grup a CSV.
    *   **`ui/Modal.tsx`**: Component **genèric i reutilitzable** que serveix de base per a tots els diàlegs.
    *   **`modals/`**: Directori que conté els modals específics, com `GoogleSettingsModal.tsx`.


## 🚀 Començar (Getting Started) MODE DEVELOPER

### Prerequisits

Assegura't de tenir instal·lat [Node.js](https://nodejs.org/) (versió 18 o superior) i `npm`.

### Instal·lació

1.  Clona el repositori.
2.  Navega al directori del projecte.
3.  Instal·la les dependències:
    ```sh
    npm install
    ```

### Execució en Mode Desenvolupament

Aquest comandament iniciarà el servidor de Vite i l'aplicació Electron simultàniament amb recàrrega automàtica.

```sh
npm run electron-dev
```

## 📦 Compilació (Build)
### Compilar per a Linux

Per crear una versió de producció de l'aplicació (p. ex., un fitxer `.AppImage` per a Linux):

```sh
npm run build:linux
```

### Compilar per a Windows

Aquest comandament crearà tant l'instal·lador (-Setup.exe) com la versió portable (.exe).

```sh
npm run build:win
```
### Compilar per a macOS

Aquest comandament crearà els fitxers `.dmg` i `.zip` per a macOS.

```sh
npm run build:mac
```

El resultat es desarà al directori `dist`.

## ✒️ Autoria

-   **Autor Principal:** Pëp 
-   **Co-autoria i Suport Tècnic:** Isaac ;) / Gemini / Github Copilot / Perplexity / ChatGPT

### Captures de pantalla:    
![Captura de pantalla del gestor d'events i personal](imatges%20i%20recursos/screenshot1mac.jpeg)


## 📄 Llicència

Aquest projecte està sota la llicència MIT.

> Copyright (c) 2025 Pëp
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all
> copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
> SOFTWARE.

---

## ⚠️ Nota sobre la configuració de TypeScript ACTUALMENT ESTÀ CANVIAT A "true" !!!

Per garantir que la compilació (`npm run build`) funcioni correctament encara que hi hagi imports de tipus o variables no utilitzades directament (per exemple, tipus utilitzats només en estructures o per claredat), s'ha modificat el fitxer `tsconfig.json`:

```jsonc
"noUnusedLocals": false, <-ACTUALITZAT A true
"noUnusedParameters": false, <-ACTUALITZAT A true
```

Això permet que el projecte es compili sense errors per imports/tipus no utilitzats directament, mantenint la seguretat de tipus i la claredat del codi. Si vols tornar a activar la comprovació estricta, només cal posar aquests valors a `true`.

---
