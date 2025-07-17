### NOVA BRANCA DESENVOLUPAMENT -->DEV

### `DEVELOPING.md`**

# Gestor d'Esdeveniments i Personal v0.4.0-dev
---

 # NOTES DE DESENVOLUPAMENT #
---

## 🚀 **Millores a les Fitxes de Bolo i Documentació Tècnica (v0.3.x)** en desenvolupament!

Aquesta versió introdueix una refactorització completa de la secció **"Fitxes de Bolo"**, passant d'un formulari simple a un sistema de gestió de personal tècnic flexible i una interfície d'usuari dinàmica.

### **1. Visió General de les Noves Funcionalitats**

La principal millora és un sistema de gestió de personal tècnic que distingeix entre **Proveïdors** (empreses o autònoms) i els **Rols** que aquests subministren, permetent una representació més realista de les necessitats d'un esdeveniment.

*   **Gestió de Personal per Proveïdors:** En lloc d'una llista simple de persones, ara es gestionen "Proveïdors de Personal". Cada proveïdor, seleccionat des de l'agenda de contactes, pot tenir una llista associada de múltiples rols amb les seves respectives quantitats i notes.
*   **Interfície d'Usuari Dinàmica:**
    *   **Combobox de Rols:** El camp "Rol" ara és un camp combinat que suggereix una llista de rols predefinits i inclusius, però també permet l'entrada de text lliure. El prefix de la categoria (ex: "Tècnic:") s'elimina automàticament en seleccionar una opció.
    *   **Context Visual:** Al costat de cada proveïdor seleccionat, apareix el seu "Rol Base" (el que té definit a l'agenda), proporcionant context immediat.
*   **Automatització Intel·ligent:**
    *   **Actualització des d'Assignacions:** Un botó `⟳` permet popular la llista de personal tècnic. Per cada assignació confirmada, crea una nova línia de **rol buit** sota el proveïdor corresponent i hi copia les notes de l'assignació original.
    *   **Neteja i Coherència:** El sistema gestiona automàticament la creació de fitxes per a esdeveniments antics i sincronitza dades clau (nom, lloc, data) amb la fitxa quan s'editen des de la vista principal.
*   **Exportació a PDF Professional:** La funció d'exportació ha estat millorada per generar un document PDF net i ben format que reflecteix la nova estructura de proveïdors i rols.

### **2. Arquitectura i Responsabilitat dels Fitxers Clau**

#### **`src/types.ts` (El Contracte de Dades)**

Aquest fitxer és el nucli de la nova estructura.

*   **`TechSheetProvider`**: Nova interfície que defineix un proveïdor. Conté:
    *   `id`: Un identificador únic per a React.
    *   `personGroupId`: L'enllaç a un `PersonGroup` de l'agenda.
    *   `roles: TechSheetRoleItem[]`: Un array dels rols que aquest proveïdor subministra.
*   **`TechSheetRoleItem`**: Nova interfície que defineix un rol específic. Conté:
    *   `id`: Identificador únic.
    *   `role`: El nom del rol (ex: "Tècnic/a de So").
    *   `quantity`: La quantitat de persones per a aquest rol (el tipus és number | string per flexibilitat al formulari).
    *   `notes`: Notes específiques.
*   **`TechSheetData`**: S'ha modificat per reemplaçar `technicalPersonnel: TechSheetPersonnel[]` per `technicalProviders: TechSheetProvider[]`. Aquest és el canvi més important del model de dades.

#### **`src/constants.tsx` (Dades Estàtiques)**

*   **`TECH_SHEET_ROLE_SUGGESTIONS`**: Un nou array exportat que conté la llista de rols predefinits, organitzats per categories amb un prefix (ex: "Tècnic: ...", "Producció: ..."). Això centralitza els suggeriments i facilita futures modificacions.

#### **`src/components/tech_sheets/TechSheetField.tsx` (El Camp de Formulari Intel·ligent)**

Aquest component reutilitzable ha estat millorat per ser més versàtil.

*   **Propietat `suggestions?: string[]`**: Ara pot rebre un array de cadenes de text per generar un `<datalist>` associat, convertint un simple `<input>` en un combobox funcional.
*   **Propietat `disabled?: boolean`**: Permet desactivar el camp, donant-li un estil visual diferent i evitant l'edició, utilitzat per mostrar el "Rol Base" del proveïdor.
*   **Propietat `infoText?: string`**: Mostra un text informatiu al costat del camp, utilitzat per indicar l'estoc disponible.
*   **Propietat `className?: string`**: Permet injectar classes CSS addicionals per a estils condicionals, com ressaltar un camp amb un error.

#### **`src/components/tech_sheets/TechSheetSection.tsx` (El Contenidor de Secció Flexible)**

*   **Propietat `layout?: 'single-column' | 'multi-column'`**: Permet controlar la disposició dels camps interns, fent possible que seccions com "Informació General" tinguin un disseny d'una sola columna mentre altres mantenen un layout de graella.
*   **Propietat `headerActions?: React.ReactNode`**: Permet injectar botons o altres elements a la capçalera de la secció, com el botó "Actualitza des d'assignacions".

#### **`src/components/tech_sheets/TechSheetForm.tsx` (El Cervell del Formulari)**

Aquest fitxer concentra la major part de la lògica de la nova funcionalitat.

*   **Funcions de Gestió Jeràrquica:**
    *   `handleAddProvider`, `handleRemoveProvider`, `handleProviderChange`: Gestionen la llista principal de proveïdors.
    *   `handleAddRole`, `handleRemoveRole`, `handleRoleChange`: Gestionen la sub-llista de rols dins de cada proveïdor. La funció `handleRoleChange` inclou la lògica per eliminar els prefixos de categoria dels rols seleccionats.
*   **Funció d'Actualització des d'Assignacions (`headerActions`):** La lògica del botó `⟳` ha estat reescrita per:
        1.  Filtra les assignacions per trobar les confirmades (`Sí` o `Mixt` amb algun `Sí`).
        2.  Per a cada assignació, cerca o crea el proveïdor corresponent a la fitxa tècnica.
        3.  Afegeix una **nova línia de rol buida** per a aquesta assignació, copiant-hi les notes originals.
*   **Lògica d'Inicialització i Sincronització (`getInitialFormData`, `useEffect`):** Assegura que el formulari s'inicialitzi correctament, migrant dades antigues si cal (`technicalPersonnel` -> `technicalProviders`), i es mantingui sincronitzat amb canvis externs a l'`EventFrame`.
*   **Exportació a PDF (`handleExportToPdf`):** La funció ha estat actualitzada per llegir de la nova estructura `technicalProviders` i generar una secció de personal clara i ben formatada al document PDF.

---
---

## 📝 Logs, Backups i Càrrega Automàtica de Dades

### Logs de Sessió 

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

### 🆕 NOVETATS: Fitxes de Bolo Dinàmiques i Exportació PDF Professional (v0.3.x) <--- en desenvolupament!


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
- `src/components/tech_sheets/TechSheetField.tsx` (gestió intel·ligent de camps, amb suggeriments i estats)
- `src/types.ts` (nous camps i lògica de fitxa)


### 🆕 Millores a les Fitxes de Bolo (v0.3.x): Gestió de Personal per Proveïdors

Aquesta versió introdueix una refactorització completa de la secció **"Fitxes de Bolo"**, substituint el model de personal rígid per un sistema flexible de **Proveïdors i Rols**.

-   **Gestió de Personal per Proveïdors:**
    -   Ara es gestionen "Proveïdors de Personal" (empreses o autònoms) seleccionats des de l'agenda de contactes.
    -   Cada proveïdor pot tenir una llista associada de múltiples **rols**, cadascun amb la seva pròpia quantitat i notes.
-   **Interfície d'Usuari Millorada:**
    -   **Combobox de Rols:** El camp "Rol" suggereix una llista de rols predefinits i inclusius, però permet l'entrada de text lliure. El prefix de categoria (ex: "Tècnic:") s'elimina automàticament.
    -   **Context Visual:** Al costat de cada proveïdor, es mostra el seu "Rol Base" (el que té definit a l'agenda) per a una referència ràpida.
-   **Automatització Intel·ligent:**
    -   El botó `⟳` permet popular automàticament la llista de proveïdors i rols basant-se en el personal confirmat a les assignacions de l'esdeveniment.
    -   El sistema gestiona la creació de fitxes per a esdeveniments antics i sincronitza dades clau (nom, lloc, data) amb la fitxa.
-   **Exportació a PDF Professional:** La funció d'exportació ha estat actualitzada per generar un document net que reflecteix la nova estructura de proveïdors i rols.

> Consulta la secció corresponent més avall per a detalls d'ús i estructura.

---

#### 📑 Responsabilitat dels fitxers clau de Fitxes de Bolo (Refactorització Completada)

- **`src/utils/pdfGenerator.ts`**: **(NOU)** Mòdul d'utilitat dedicat exclusivament a generar el document PDF a partir de les dades de la fitxa tècnica.
- **`src/components/tech_sheets/TechSheetForm.tsx`**: Orquestra la fitxa tècnica. Gestiona l'estat general del formulari i coordina els components fills. **Ja no conté la lògica de generació de PDF.**
- **`src/components/tech_sheets/TechnicalPersonnelSection.tsx`**: **(NOU)** Component especialitzat que gestiona tota la secció de "Personal Tècnic", incloent la lògica per afegir i eliminar proveïdors i rols.
- **`src/components/tech_sheets/NeedsList.tsx`**: **(NOU)** Component reutilitzable per a renderitzar i gestionar llistes de necessitats (il·luminació, so, etc.), connectat amb l'inventari de material.
- **`src/components/tech_sheets/TechSheetSection.tsx`**: Component de presentació que encapsula cada secció de la fitxa, fent-les col·lapsables i permetent accions a la capçalera.
- **`src/components/tech_sheets/TechSheetField.tsx`**: Component reutilitzable per a camps de formulari individuals, ara amb suport per a suggeriments (`datalist`).
- **`src/components/TechSheetsDisplay.tsx`**: Component contenidor que mostra la fitxa de bolo seleccionada i permet navegar entre fitxes d'esdeveniments. Orquestra la visualització i la selecció de fitxes.
- **`src/types.ts`**: Defineix totes les interfícies TypeScript per a la fitxa tècnica, incloent la descripció de cada secció, llistes, camps opcionals i la seva estructura jeràrquica.
- **`src/hooks/useEventDataManager.ts`**: Gestiona l'estat global de l'aplicació, incloent la persistència i sincronització de les fitxes tècniques amb la resta de dades de l'esdeveniment.

> Amb aquesta arquitectura modular, cada fitxer té una responsabilitat clara i delimitada, facilitant el manteniment i l'escalabilitat.

---

### 🚀 Funcionalitats Clau

-   **Gestió d'Esdeveniments i Assignacions:** Creació d'esdeveniments marc i assignació de personal amb estats detallats (`Sí`, `No`, `Pendent` i `Mixt` per dies).
-   **Base de Dades de Personal:** Pàgina dedicada per a la gestió centralitzada de persones i grups.
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
    **✨ [NOU] Gestor d'Inventari de Material:**
    *   Pàgina dedicada per gestionar un inventari de material (nom, categoria, estoc, etc.).
    *   Permet carregar inventaris des de fitxers JSON externs.
    *   **Integració amb Fitxes de Bolo:** Suggereix material de l'inventari a les necessitats tècniques.
   *   **Control d'Estoc Dinàmic:**
    *   **Càlcul de Disponibilitat en Temps Real:** Quan s'afegeix un ítem de l'inventari a una fitxa de bolo, el sistema calcula automàticament l'estoc disponible per a les dates d'aquell esdeveniment. Per fer-ho, resta l'estoc compromès en altres esdeveniments que se solapen en dates.
    *   **Feedback Visual Immediat:**
        *   Al costat del camp de descripció del material, apareix un text informatiu (ex: "Disp: 8 / 10").
        *   Si la quantitat sol·licitada supera l'estoc disponible, el camp de quantitat es ressalta visualment amb una vora vermella per alertar d'un conflicte d'estoc.

-   **Interfície d'Usuari:**
    *   Suport per a tema clar i fosc.
    *   Notificacions (toasts) per a les accions de l'usuari.
    *   Visualització detallada d'estats mixts.

-   **✨ [NOU] Càrrega de Dades Flexible (Fusió o Reemplaçament):**
    *   **Modal de Decisió:** En carregar un fitxer de **persones** o de **material**, ara es mostra un diàleg que pregunta a l'usuari si desitja **fusionar** les dades noves amb les existents o **reemplaçar** completament les dades actuals.
    *   **Lògica de Fusió Intel·ligent:**
        *   **Persones:** La fusió afegeix només les persones del fitxer que no existeixen a la llista actual (la comprovació es fa per nom, ignorant majúscules/minúscules).
        *   **Material:** La fusió afegeix només els articles del fitxer que no existeixen a l'inventari actual (la comprovació es fa per nom, ignorant majúscules/minúscules).
    *   **Arquitectura:**
        *   **`MergeOrReplaceModal.tsx`**: Nou component de modal reutilitzable per a aquesta funcionalitat.
        *   **`useEventDataManager.ts`**: S'han afegit les funcions `mergePeopleGroups`, `replacePeopleGroups`, i `replaceMaterialItems` per gestionar la lògica de dades. La funció `addMaterialItemsFromFile` es reutilitza per a la fusió de material.
        *   **`Controls.tsx`**: Modificat per llegir el fitxer i obrir el modal amb les dades, en lloc d'executar l'acció directament.
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
    *   *   **Gestió Nativa i Cicle de Vida:**
    *   Controla les finestres, menús i l'accés segur al sistema de fitxers.
    *   **Flux de Tancament Robust:** Implementa un procés de tancament segur que primer demana les dades actuals al frontend, les desa al disc, crea un backup i, només després, tanca l'aplicació, evitant la pèrdua de dades.
    *   **Autenticació OAuth 2.0:** Implementa el flux complet de connexió amb Google, aixecant un **servidor HTTP temporal** per capturar la resposta de l'usuari de forma segura.
    *   **Gestió del Calendari Dedicat:** Conté la funció `findOrCreateAppCalendar`, que utilitza la constant `APP_CALENDAR_NAME` per crear (si no existeix) o localitzar el calendari propi de l'app a Google, garantint l'aïllament de les dades gestionades per l'aplicació.
    *   **Motor de Sincronització (`syncWithGoogle`):** Allotja la lògica principal per sincronitzar les dades locals amb Google Calendar. Aquest procés buida primer tots els esdeveniments del calendari dedicat de l'app a Google i després puja la versió actual dels esdeveniments locals. Això assegura que les dades locals siguin la font de veritat. Actualitza els esdeveniments locals amb els ID de Google després de la pujada.
    *   **Recuperació d'Esdeveniments de Google (`getGoogleEvents`):** Obté esdeveniments dels calendaris de Google que l'usuari ha seleccionat per a visualització (a través de `GoogleSettingsModal.tsx`), incloent el calendari dedicat de l'app.
    *    **Exposició de Ruta de Dades:** Conté un nou gestor IPC (`get-default-data-path`) per informar el frontend de la ubicació del fitxer de dades.


*   **`preload.cjs` (Pont de Comunicació Segur)**:
    *   Utilitza `contextBridge` per exposar de manera segura funcions del backend (`syncWithGoogle`, `startGoogleAuth`, `getDefaultDataPath`, etc.) al frontend mitjançant l'objecte `window.electronAPI`.

### 2. El Pont de Comunicació Segur

*   **`preload.cjs`:** Actua com un **pont segur i controlat** entre el backend (procés principal d'Electron) i el frontend (React). Exposa de manera explícita una llista blanca de funcions del procés principal (com `startGoogleAuth`, `syncWithGoogle`, `getGoogleEvents`, etc.) perquè el codi React les pugui invocar de forma segura mitjançant `window.electronAPI`.

### 3. La Interfície d'Usuari (Frontend - React)

*   **Gestor d'Estat Central (`hooks/useEventDataManager.ts`):** És el **cor lògic del frontend**.
    *   Centralitza totes les dades de l'aplicació: `eventFrames`, `peopleGroups`, `materialItems` i `googleEvents`.
    *   Proporciona funcions CRUD per a les dades locals.
    *   Orquestra les crides a les funcions del backend (exposades via `preload.cjs`) per a accions com l'autenticació (`startGoogleAuth`), la sincronització (`syncWithGoogle`), i la recuperació d'esdeveniments de Google (`refreshGoogleEvents` que internament crida `getGoogleEvents` del backend).
    *   Després d'una sincronització amb Google reeixida, carrega directament les dades actualitzades que el backend li retorna, les quals ja inclouen els nous ID de Google.
    *   Gestiona l'estat de la interfície relacionat amb la sincronització (p.ex., `isSyncing`).
    *   **Gestió de Material:** Inclou funcions CRUD per a l'inventari de material (`addMaterialItem`, `updateMaterialItem`, `deleteMaterialItem`) i una funció per afegir material des d'un fitxer (`addMaterialItemsFromFile`).
    *   **Càlcul de Disponibilitat:** Conté la funció `getMaterialAvailability` per calcular l'estoc disponible en un rang de dates.


*   **Components Reutilitzables (`src/components`):**
    *   **`Controls.tsx`:** La barra d'eines principal. Conté botons per a la gestió de dades (`Carregar Tot`, `Guardar Tot`, `Carregar Material`), la sincronització amb Google i la configuració. Mostra la ruta del fitxer de dades actual.
    *   **`MainDisplay.tsx`:** Orquestra la vista principal de l'aplicació. És responsable de combinar les dades dels `eventFrames` locals (editables) i els `googleEvents` (visualitzats des de Google, típicament de només lectura) per a la seva presentació al component `FullCalendar`. També gestiona la llista filtrable d'esdeveniments.
    *   **`EventFrameCard.tsx`:** Representa visualment cada esdeveniment (`EventFrame`) a la llista, mostrant les seves assignacions i permetent accions com editar o eliminar. Inclou un indicador visual si l'esdeveniment està vinculat a Google Calendar.

*   **Modals Interactius (`src/components/modals`):**
    *   **`GoogleSettingsModal.tsx`:** Permet a l'usuari configurar la connexió i seleccionar quins calendaris de només lectura vol visualitzar.
    *   **`src/components/modals`:** S'ha eliminat `PeopleGroupManagerModal.tsx` després de migrar la seva funcionalitat.
       **Noves Pàgines Dedicades:**
    *   **`PeopleDisplay.tsx`**: Nova pàgina que allotja el gestor de persones, abans en un modal.
    *   **`MaterialDisplay.tsx`**: Nova pàgina que conté la interfície per gestionar l'inventari de material.

    *   **Components d'Interacció (`src/components`):**
    *   **`Navigation.tsx`**: Renderitza la barra de navegació principal de l'aplicació (`Calendari`, `Fitxes de Bolo`, `Persones`, `Material`), permetent canviar entre les vistes principals.
    *   **`AssignmentCard.tsx`**: Mostra cada assignació individual dins d'un `EventFrameCard`, amb la seva vista detallada per dies.

*   **Components Modals (`src/components/modals`):**
    *   **`EventFrameFormModal.tsx`**: Formulari per crear i editar els **Marcs d'Esdeveniment**.
    *   **`AssignmentFormModal.tsx`**: Formulari per crear i editar les **Assignacions** de personal dins d'un marc.
    *   **`EventFrameDetailsModal.tsx`**: Vista de detall ràpida d'un esdeveniment i les seves assignacions.
    *   **`ConfirmDeleteModal.tsx`**: Diàleg genèric de confirmació utilitzat abans de realitzar accions destructives.
    *   **`GoogleSettingsModal.tsx`**: Permet a l'usuari configurar la connexió i seleccionar quins calendaris de només lectura vol visualitzar.

*   **Components d'UI Genèrics (`src/components/ui`):**
    *   **`Modal.tsx`**: Component **genèric i reutilitzable** que serveix de base per a tots els diàlegs, gestionant l'estat d'obertura, el títol i el contingut.

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
*   **`metadata.json`**: Fitxer de metadades utilitzat per eines auxiliars. Actualment conté el nom i la descripció del projecte.



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

    ---



## 🚀 Començar (Getting Started) MODE DEVELOPER

## 📦 Compilació i Desplegament (CI/CD)

El projecte utilitza **GitHub Actions** per automatitzar la compilació per a diferents sistemes operatius. Aquests processos es defineixen en fitxers `.yml` dins del directori `.github/workflows/`.

*   **`build-linuxv20-04.yml`**: Defineix el workflow per compilar l'aplicació en un entorn Ubuntu 22.04. Instal·la les dependències necessàries (com `libfuse2`) i genera un fitxer `.AppImage`.
*   **`build-macos12.yml`**: Configura l'entorn a `macos-latest` per compilar l'aplicació i generar els artefactes de distribució per a macOS (`.dmg` i `.zip`).
*   **`build-win10.yml`**: S'executa en un entorn `windows-latest` per crear l'instal·lador (`.exe`) i la versió portable per a Windows.

Tots els workflows inclouen un pas per crear el fitxer `google-credentials.json` a partir d'un secret de GitHub, assegurant que les credencials no quedin exposades al codi font.

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


## ⚠️ Nota sobre la configuració de TypeScript ACTUALMENT ESTÀ CANVIAT A "true" !!!

Per garantir que la compilació (`npm run build`) funcioni correctament encara que hi hagi imports de tipus o variables no utilitzades directament (per exemple, tipus utilitzats només en estructures o per claredat), s'ha modificat el fitxer `tsconfig.json`:

```jsonc
"noUnusedLocals": false, <-ACTUALITZAT A true
"noUnusedParameters": false, <-ACTUALITZAT A true
```

Això permet seleccionar el mode en que el projecte es compili sense errors per imports/tipus no utilitzats directament, mantenint la seguretat de tipus i la claredat del codi. *Si vols tornar a activar la comprovació estricta, només cal posar aquests valors a `true`.*

---
