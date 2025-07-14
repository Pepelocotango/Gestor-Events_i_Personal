
### NOVA BRANCA DESENVOLUPAMENT -->DEV

### INICI FITXER: DEVELOPING.md ###

# Gestor d'Esdeveniments i Personal v0.3.0
---
# NOTES DE DESENVOLUPAMENT

Aquest document detalla l'arquitectura tècnica, les decisions clau i les guies per al desenvolupament del projecte.

---

## 🚀 Funcionalitats Clau

*   **Gestió d'Esdeveniments i Assignacions:** Creació d'esdeveniments marc i assignació de personal amb estats detallats (`Sí`, `No`, `Pendent` i `Mixt` per dies).
*   **Base de Dades de Personal:** Pàgina dedicada per a la gestió centralitzada de persones i grups.
*   **Visualització Avançada:** Calendari multi-vista, llista filtrable i resums exportables.
*   **Detecció de Conflictes:** El sistema avisa si una persona s'assigna a múltiples tasques en un mateix dia.
*   **Importació i Exportació:** Càrrega/desat en JSON i exportació a CSV.

*   **✨ [NOU] Integració Avançada amb Google Calendar:**
    *   **Motor de Sincronització unidireccional:**
        *   Escriu exclusivament en un calendari propi anomenat **"Gestor d'Esdeveniments (App)"**, creat automàticament per garantir la seguretat i aïllament de les dades.
        *   Puja canvis manualment amb el botó "Sincronitzar". Els canvis dels events fets a Google Calendar no es guarden a l'app i es perdran a la següent sincronització manual.
    *   **Visualització de Calendaris Addicionals:**
        *   Permet seleccionar altres calendaris del teu compte de Google per visualitzar-los com a només lectura, integrats a la vista principal.
    *   **Feedback Visual Clar:**
        *   El botó "Sincronitzar" mostra un **estat de càrrega** durant el procés.
        *   Els esdeveniments vinculats mostren una **icona de Google** per a una identificació ràpida.
    *   **Arquitectura Robusta:**
        *   Autenticació segura mitjançant el protocol **OAuth 2.0**.
        *   **Funcionament 100% offline** garantit. La integració és una capa addicional que no afecta la funcionalitat principal.

*   **✨ [NOU] Gestor d'Inventari de Material:**
    *   Pàgina dedicada per gestionar un inventari de material (nom, categoria, estoc, etc.).
    *   Permet carregar inventaris des de fitxers JSON externs.
    *   **Integració amb Fitxes de Bolo:** Suggereix material de l'inventari a les necessitats tècniques.
    *   **Control d'Estoc Dinàmic:**
        *   **Càlcul de Disponibilitat en Temps Real:** Quan s'afegeix un ítem de l'inventari a una fitxa de bolo, el sistema calcula automàticament l'estoc disponible per a les dates d'aquell esdeveniment.
        *   **Feedback Visual Immediat:** Al costat del camp de descripció apareix un text informatiu (ex: "Disp: 8 / 10"), i el camp de quantitat es ressalta si hi ha un conflicte d'estoc.

*   **✨ [NOU] Fitxes de Bolo Dinàmiques (v0.3.x):**
    *   **Gestió de Personal per Proveïdors:** Sistema flexible de **Proveïdors i Rols** que substitueix el model rígid anterior.
    *   **UI dinàmica i moderna:**
        *   Selectors SI/NO per a camps com Premuntatge o Vídeo, amb camps de detall que apareixen només quan cal.
        *   Dropdowns numèrics per a actors i tècnics de companyia.
        *   Combobox de Rols amb suggeriments i entrada lliure. El prefix de categoria (ex: "Tècnic:") s'elimina automàticament.
        *   Context visual del "Rol Base" del proveïdor.
    *   **Automatització Intel·ligent:** El botó `⟳` permet popular la llista de personal basant-se en les assignacions confirmades.
    *   **Exportació a PDF professional:** Generació d'una fitxa tècnica compacta, clara i basada en text que reflecteix la nova estructura.

*   **Interfície d'Usuari:**
    *   Suport per a tema clar i fosc.
    *   Notificacions (toasts) per a les accions de l'usuari.
    *   Visualització detallada d'estats mixts.

---

## 🛠️ Pila Tecnològica (Tech Stack)

*   **Electron:** `^29.4.6`
*   **Vite:** `^6.3.5`
*   **React:** `^18.3.1`
*   **TypeScript:** `~5.5.3`
*   **Tailwind CSS:** `^3.4.17`
*   **FullCalendar:** `^6.1.17`
*   **Electron Builder:** `^24.13.3`

---

## 🏗️ Arquitectura i Fitxers Clau

El projecte segueix una arquitectura de tres capes per separar responsabilitats.

### 1. Fitxers de Configuració i Arrel del Projecte

*   **`package.json`**: El manifest del projecte. Defineix dependències clau com `googleapis` i scripts de compilació. La clau `build.files` inclou `google-credentials.json` per empaquetar-lo a la versió final.
*   **`google-credentials.json`**: Emmagatzema les claus secretes de l'API de Google. És un fitxer local, ignorat per `.gitignore`.
*   **`vite.config.ts`**: Configuració de Vite, on es defineixen àlies d'import (`@/components`) i s'exclouen mòduls natius.
*   **`tailwind.config.cjs`**: Configuració de TailwindCSS, incloent un plugin personalitzat per als estils del calendari.
*   **`postcss.config.cjs` i `tsconfig.json`**: Fitxers auxiliars per a PostCSS i TypeScript.
*   **`index.html`**: El punt d'entrada HTML on es munta l'aplicació React.
*   **`metadata.json`**: Fitxer de metadades utilitzat per eines auxiliars.

### 2. El Nucli Natiu (Backend - Electron)

*   **`main.cjs`:** És el **cervell de l'aplicació**. Les seves responsabilitats principals són:
    *   **Gestió Nativa i Cicle de Vida:** Controla les finestres, menús i l'accés segur al sistema de fitxers.
    *   **Flux de Tancament Robust:** Implementa un procés de tancament segur que desa dades i crea backups abans de sortir.
    *   **Autenticació OAuth 2.0:** Gestiona el flux de connexió amb Google mitjançant un servidor HTTP temporal.
    *   **Gestió del Calendari Dedicat:** Conté la funció `findOrCreateAppCalendar`.
    *   **Motor de Sincronització Unidireccional (`syncWithGoogle`):** Allotja la lògica per buidar i pujar dades a Google Calendar.
    *   **Recuperació d'Esdeveniments (`getGoogleEvents`):** Obté esdeveniments dels calendaris de Google.
    *   **Exposició de Ruta de Dades:** Informa el frontend de la ubicació del fitxer de dades mitjançant `get-default-data-path`.

### 3. El Pont de Comunicació Segur

*   **`preload.cjs`:** Actua com un pont segur entre backend i frontend, exposant funcions via `window.electronAPI`.

### 4. La Interfície d'Usuari (Frontend - React)

#### Models de Dades i Utilitats
*   **`src/types.ts`**: Defineix totes les interfícies TypeScript (`EventFrame`, `Assignment`, etc.). L'actualització més important ha estat a `TechSheetData`, reemplaçant `technicalPersonnel` per `technicalProviders` i creant `TechSheetRoleItem` per a més flexibilitat.
*   **`src/constants.tsx`**: Emmagatzema constants com icones SVG i l'array `TECH_SHEET_ROLE_SUGGESTIONS` per als suggeriments de rols.
*   **`src/utils/`**: Conté funcions auxiliars per a `dataMigration.ts`, `dateFormat.ts`, `statusUtils.ts` i `dateRangeFormatter.ts`.

#### Gestió d'Estat Global
*   **`hooks/useEventDataManager.ts`**: És el **cor lògic del frontend**. Centralitza l'estat (`eventFrames`, `peopleGroups`, etc.), proporciona funcions CRUD, gestiona la detecció de conflictes i orquestra les crides al backend.
*   **`contexts/EventDataContext.tsx`**: Posa les dades i funcions del hook anterior a disposició de tota l'aplicació.

#### Components i Vistes
*   **`App.tsx`**: Component arrel que munta tota la interfície, gestiona el routing, els modals i les notificacions.
*   **`Navigation.tsx`**: Renderitza la barra de navegació principal de l'aplicació.
*   **`Controls.tsx`**: Barra d'eines principal amb botons per a gestió de dades, sincronització, etc.
*   **`MainDisplay.tsx`**: Orquestra la vista principal, combinant `FullCalendar` i la llista filtrable d'esdeveniments.
*   **`PeopleDisplay.tsx`**: Pàgina dedicada que allotja el gestor de persones i contactes.
*   **`MaterialDisplay.tsx`**: Pàgina dedicada amb la interfície per gestionar l'inventari de material.
*   **`SummaryReports.tsx`**: Genera els resums de dades i permet la seva exportació a CSV.
*   **`EventFrameCard.tsx` / `AssignmentCard.tsx`**: Components que representen visualment els esdeveniments i les seves assignacions.

#### Components de les Fitxes de Bolo (`src/components/tech_sheets`)
*   **`TechSheetsDisplay.tsx`**: Component contenidor que mostra la fitxa de bolo seleccionada.
*   **`TechSheetForm.tsx`**: Formulari principal i lògica de la fitxa tècnica, on es gestiona l'estat, la dinàmica dels camps i l'exportació a PDF.
*   **`TechSheetSection.tsx`**: Component de presentació que encapsula cada secció de la fitxa i permet injectar accions a la capçalera.
*   **`TechSheetField.tsx`**: Component reutilitzable per a camps de la fitxa, amb suport per a suggeriments, estats i text informatiu.

#### Components Modals (`src/components/modals`)
*   **`EventFrameFormModal.tsx`**: Formulari per crear i editar els **Marcs d'Esdeveniment**.
*   **`AssignmentFormModal.tsx`**: Formulari per crear i editar les **Assignacions**.
*   **`EventFrameDetailsModal.tsx`**: Mostra una vista de detall d'un esdeveniment.
*   **`ConfirmDeleteModal.tsx`**: Diàleg de confirmació genèric.
*   **`GoogleSettingsModal.tsx`**: Permet configurar la connexió amb Google.
*   **`ui/Modal.tsx`**: Component genèric que serveix de base per a tots els diàlegs.

---

## 🚀 Començar (Getting Started)

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
---

## 📦 Compilació i Desplegament

### Scripts de Compilació Local
Per crear una versió de producció de l'aplicació, utilitza els següents scripts:
*   **Per a Linux (`.AppImage`):**
    ```sh
    npm run build:linux
    ```
*   **Per a Windows (Instal·lador i Portable):**
    ```sh
    npm run build:win
    ```
*   **Per a macOS (`.dmg` i `.zip`):**
    ```sh
    npm run build:mac
    ```
El resultat es desarà al directori `dist`.

### Desplegament Continu (CI/CD) amb GitHub Actions
El projecte utilitza **GitHub Actions** per automatitzar la compilació. Els workflows es troben a `.github/workflows/`:
*   **`build-linuxv20-04.yml`**: Compila l'aplicació per a Linux (Ubuntu).
*   **`build-macos12.yml`**: Compila per a macOS.
*   **`build-win10.yml`**: Compila per a Windows.
Tots els workflows inclouen un pas per crear el fitxer `google-credentials.json` a partir d'un secret de GitHub.

---

## 📝 Logs, Backups i Dades d'Usuari

*   **Logs de Sessió**: Cada execució de l'app genera un fitxer de log a `<userData>/logs`. Es mantenen els últims 20 logs.
*   **Backups Automàtics**: En sortir de l'aplicació, es crea una còpia de seguretat del fitxer de dades a `<userData>/backups`. Es conserven els 5 backups més recents.
*   **Dades de Sessió**: L'estat de la finestra es desa a `<userData>/session.json`.

---

## ⚠️ Nota sobre la configuració de TypeScript

Per mantenir un codi net i robust, el fitxer `tsconfig.json` té activades per defecte les opcions `"noUnusedLocals": true` i `"noUnusedParameters": true`. Això vol dir que la compilació (`npm run build`) fallarà si hi ha variables o paràmetres declarats que no s'utilitzen.

Si durant el desenvolupament necessites desactivar temporalment aquestes comprovacions, la manera recomanada és fer-ho directament al codi amb comentaris de TypeScript (`// @ts-ignore` per a una línia específica) o modificant temporalment aquests valors a `false` al `tsconfig.json`.

