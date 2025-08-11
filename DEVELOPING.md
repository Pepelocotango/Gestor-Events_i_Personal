## DEVELOPING.md

## branca de desenvolupament --> DEV

# Guia de Desenvolupament: Gestor d'Esdeveniments i Personal

Aquest document proporciona una anàlisi tècnica detallada de l'arquitectura, les funcionalitats clau i les convencions de codi del projecte. Està dissenyat per a desenvolupadors que vulguin entendre el funcionament intern de l'aplicació, contribuir-hi o fer-ne el manteniment.

---

## 1. Visió General i Pila Tecnològica

### Visió General del Projecte

El "Gestor d'Esdeveniments i Personal" és una aplicació d'escriptori multiplataforma construïda amb Electron i React. El seu objectiu és oferir una solució integral per a la gestió d'esdeveniments, cobrint tot el cicle de vida:

-   **Planificació:** Creació d'esdeveniments marc i assignació de personal.
-   **Gestió de Recursos:** Manteniment d'una base de dades centralitzada de personal/proveïdors i un inventari de material amb control d'estoc.
-   **Documentació Tècnica:** Generació de "Fitxes de Bolo" detallades per a cada esdeveniment.
-   **Connectivitat:** Sincronització unidireccional amb múltiples calendaris de Google gestionats per l'app i visualització de calendaris externs.
-   **Anàlisi i Exportació:** Creació de resums de dades i exportació a formats estàndard com PDF i CSV.

L'aplicació està dissenyada per funcionar de manera totalment autònoma (offline), sent la integració amb serveis externs una capa opcional.

### Pila Tecnològica (Tech Stack)

El projecte es basa en un conjunt de tecnologies modernes de l'ecosistema JavaScript/TypeScript.

-   **Framework d'Aplicació:**
    -   **Electron `^29.4.6`**: Permet construir aplicacions d'escriptori multiplataforma utilitzant tecnologies web.
    -   **Electron Builder `^24.13.3`**: Eina per empaquetar i distribuir l'aplicació per a Windows, macOS i Linux.

-   **Frontend:**
    -   **React `^18.3.1`**: Llibreria per construir la interfície d'usuari.
    -   **Vite `^6.3.5`**: Eina de desenvolupament i empaquetat per al frontend, oferint una experiència de desenvolupament ràpida.
    -   **TypeScript `~5.5.3`**: Afegeix un sistema de tipus a JavaScript per a un codi més robust i mantenible.

-   **Estils i UI:**
    -   **Tailwind CSS `^3.4.17`**: Framework CSS "utility-first" per a un disseny ràpid i personalitzat.
    -   **FullCalendar `^6.1.17`**: Llibreria potent per a la creació de calendaris interactius.
    -   **Headless UI / Heroicons**: Utilitzats implícitament per a components d'UI i icones.

-   **Integracions i Utilitats Clau:**
    -   **Google APIs (`googleapis` `^150.0.1`)**: Llibreria client de Google per interactuar amb serveis com Google Calendar.
    -   **Generació de PDF (`jspdf` `^3.0.1`, `jspdf-autotable` `^5.0.2`)**: Per a la creació de documents PDF natius des del client.

---

## 2. Arquitectura del Projecte

L'aplicació segueix una **arquitectura de tres capes** dissenyada per separar clarament les responsabilitats, millorar la seguretat i facilitar el manteniment.

### El Model de 3 Capes

1.  **Capa 1: Backend (Procés Principal d'Electron - `main.cjs`)**
    -   **Descripció:** És el "cervell" natiu de l'aplicació. S'executa en un entorn Node.js complet i té accés a les API del sistema operatiu.
    -   **Responsabilitats:**
        -   Gestionar el cicle de vida de l'aplicació i les finestres (`BrowserWindow`).
        -   Crear menús natius.
        -   Interactuar directament amb el sistema de fitxers (lectura/escriptura de JSON, gestió de backups i logs).
        -   Gestionar processos complexos com l'autenticació OAuth 2.0 amb Google.
        -   Realitzar totes les comunicacions amb API externes (Google Calendar).
        -   Exposar una API interna segura a través de canals IPC (Comunicació Inter-Processos).

2.  **Capa 2: Pont Segur (`preload.cjs`)**
    -   **Descripció:** És un script especial d'Electron que s'executa en un context privilegiat, actuant com a pont entre el backend i el frontend.
    -   **Responsabilitats:**
        -   Utilitzar el mòdul `contextBridge` per exposar de manera selectiva i segura funcions del backend al món del frontend.
        -   Garantir que el frontend no tingui accés directe a les API de Node.js, una pràctica de seguretat fonamental en Electron.
        -   Definir l'API `window.electronAPI`, que és l'únic punt de contacte entre les dues capes.
        -   Habilitació de la Sandbox: L'aplicació s'executa amb la sandbox d'Electron activada (sandbox: true). Això aïlla completament el procés de renderitzat (frontend), prevenint que pugui executar codi natiu directament. Tota operació que requereixi accés al sistema ha de passar obligatòriament a través dels canals IPC definits aquí.

3.  **Capa 3: Frontend (Interfície d'Usuari en React - `src/`)**
    -   **Descripció:** És una Single Page Application (SPA) que s'executa dins d'una finestra de Chromium. És responsable de tot el que l'usuari veu i amb què interactua.
    -   **Responsabilitats:**
        -   Renderitzar la interfície d'usuari.
        -   Gestionar l'estat de la UI (dades d'esdeveniments, formularis, modals, etc.).
        -   Implementar tota la lògica de negoci del client (filtratge de dades, validacions de formularis, detecció de conflictes).
        -   Invocar les funcions exposades pel backend a través de `window.electronAPI` per a qualsevol operació que requereixi accés al sistema (desar un fitxer, sincronitzar amb Google, etc.).

### Diagrama de Flux de Dades: Exemple d'una Acció de "Guardar"

Per il·lustrar com col·laboren aquestes capes, analitzem el flux quan un usuari desa totes les dades:

1.  **[Frontend]** L'usuari fa clic al botó "Guardar Tot" al component `Controls.tsx`.
2.  **[Frontend]** S'activa la funció `handleSaveData('all')`, que crida a la funció `exportData()` del hook `useEventDataManager.ts`.
3.  **[Frontend]** El hook `useEventDataManager` recopila totes les dades de l'estat actual de React (`eventFrames`, `peopleGroups`, etc.) i les retorna com un objecte `AppData`.
4.  **[Frontend]** La funció `handleSaveData` crida a `window.electronAPI.showSaveDialog()` amb les dades serialitzades en format JSON.
5.  **[Pont]** `preload.cjs` rep la crida i, de forma segura, envia una petició IPC (`ipcRenderer.invoke`) al backend a través del canal `'show-save-dialog'`.
6.  **[Backend]** El gestor `ipcMain.handle('show-save-dialog', ...)` a `main.cjs` rep la petició.
7.  **[Backend]** Utilitzant el mòdul `dialog` d'Electron, obre una finestra de diàleg nativa del sistema operatiu perquè l'usuari triï on desar el fitxer.
8.  **[Backend]** Un cop l'usuari confirma, utilitza el mòdul `fs` de Node.js per escriure les dades rebudes al disc.
9.  **[Backend -> Pont -> Frontend]** El resultat de l'operació (èxit o error) es retorna a través de la `Promise` de `ipcRenderer.invoke`.
10. **[Frontend]** El component `Controls.tsx` rep el resultat i mostra una notificació (toast) a l'usuari informant de l'èxit o el fracàs de l'operació.

Aquest flux demostra la clara separació de responsabilitats: el frontend gestiona la UI i l'estat, mentre que el backend s'encarrega de les operacions a nivell de sistema, garantint seguretat i un rendiment natiu.



---

## 3. Backend: El Procés Principal d'Electron (`main.cjs`)

El fitxer `main.cjs` és el punt d'entrada i el nucli de l'aplicació. S'executa en un entorn Node.js complet, la qual cosa li atorga accés directe a les API del sistema operatiu per a la gestió de finestres, menús, sistema de fitxers i comunicacions de xarxa. Actua com el "cervell" que orquestra totes les operacions natives.

### 3.1. Sistema d'Arxius i Persistència de Dades

L'aplicació gestiona totes les dades de l'usuari localment, garantint el seu funcionament offline. La ubicació central de les dades és el directori de dades de l'usuari, proporcionat per Electron (`app.getPath('userData')`), per assegurar la compatibilitat entre sistemes operatius.

#### Estructura de Fitxers i Rutes Clau

Les rutes principals es defineixen com a constants a l'inici del fitxer:

-   `CONFIG_DIR` / `DATA_DIR`: Apunten a `app.getPath('userData')`. És el directori arrel per a totes les dades de l'aplicació.
-   `DATA_FILE`: (`.../events_data.json`) L'arxiu principal que conté totes les dades de l'aplicació: esdeveniments, persones, material i assignacions.
-   `SESSION_FILE`: (`.../session.json`) Emmagatzema l'estat de la finestra (mida i posició) per restaurar-lo en la següent execució.
-   `BACKUP_DIR`: (`.../backups/`) Subdirectori on es guarden les còpies de seguretat automàtiques.
-   `LOGS_DIR`: (`.../logs/`) Subdirectori per als fitxers de log de cada sessió.
-   `GOOGLE_TOKENS_PATH`: (`.../google-tokens.json`) Emmagatzema els tokens d'accés i de refresc d'OAuth 2.0 un cop l'usuari s'ha autenticat.
-   `GOOGLE_CONFIG_PATH`: (`.../google-config.json`) Desa la configuració de Google Calendar. La seva estructura ha evolucionat per suportar múltiples calendaris:
    ```json
    {
      "userEmail": "usuari@exemple.com",
      "activeAppCalendarId": "id_calendari_actiu_123",
      "managedAppCalendars": [
        {
          "id": "id_calendari_actiu_123",
          "name": "Gestor d'Esdeveniments (App) - Teatre Principal",
          "suffix": "Teatre Principal"
        }
      ],
      "selectedCalendarIds": ["id_calendari_extern_per_visualitzar_abc"]
    }
    ```
    - `activeAppCalendarId`: L'ID del calendari que s'utilitzarà per defecte per a la propera sincronització.
    - `managedAppCalendars`: Una llista de tots els calendaris que l'aplicació ha creat i sobre els quals té permís d'escriptura.
    - `selectedCalendarIds`: Una llista d'IDs de calendaris (tant gestionats com externs) que l'usuari vol visualitzar al calendari principal.

#### Logs de Sessió

Per facilitar la depuració, l'aplicació implementa un sistema de logging robust:

-   **Creació de Logs:** A cada inici, es crea un nou fitxer de log a `LOGS_DIR` amb el format `app-<timestamp>.log`.
-   **Redirecció de Consola:** Totes les crides a `console.log`, `console.warn` i `console.error` des del procés principal són interceptades i redirigides a la funció `logToFile`, que les escriu al fitxer de log de la sessió actual i les mostra simultàniament a la terminal.
-   **Logs del Frontend:** Els missatges de log generats al frontend (a través del servei `logger.ts`) s'envien al backend mitjançant el canal IPC `log-message` i s'escriuen al mateix fitxer, prefixats amb `[FRONTEND]`.
-   **Rotació Automàtica:** La funció `rotateLogs` s'executa a l'inici per garantir que només es conservin els 20 fitxers de log més recents, evitant l'acumulació excessiva d'arxius.

#### Còpies de Seguretat (Backups)

Per prevenir la pèrdua de dades, s'ha implementat un sistema de còpies de seguretat automàtic:

-   **Activació:** La funció `createBackup()` es crida durant el procés de tancament segur de l'aplicació, just abans de sortir.
-   **Nomenclatura:** Cada backup es desa a `BACKUP_DIR` amb un nom que inclou un timestamp (`backup-events_data-<timestamp>.json`), garantint que cada còpia sigui única.
-   **Neteja Automàtica:** La funció `cleanupOldBackups()` s'executa també durant el tancament. Revisa el directori de backups i elimina els més antics, conservant només els 5 més recents.

### 3.2. Cicle de Vida i Gestió de Finestres

El backend controla tots els aspectes del cicle de vida de l'aplicació, des de la creació de la finestra fins al tancament segur.


#### Bloqueig d'Instància Única (Single Instance Lock)

Per prevenir errors crítics de tipus `write EIO` (Error d'Entrada/Sortida) i condicions de cursa (`race conditions`), l'aplicació implementa un bloqueig que assegura que només una instància pugui estar en execució al mateix temps.

Aquest error es produïa quan dues instàncies de l'aplicació intentaven escriure simultàniament al mateix fitxer de configuració (p. ex., `session.json`) durant el procés de tancament, causant una fallada del sistema de fitxers.

La solució s'implementa a l'inici de `main.cjs` utilitzant `app.requestSingleInstanceLock()`. La primera instància que s'obre obté el "candau" i s'executa amb normalitat. Si un usuari intenta obrir una segona instància, aquesta detectarà que el candau ja està agafat, posarà la finestra de la primera instància en primer pla (`mainWindow.focus()`) i es tancarà automàticament.

Això no només soluciona el bug d'escriptura, sinó que també millora l'experiència d'usuari evitant finestres duplicades.


#### Creació de la Finestra (`createWindow`)

Aquesta funció s'encarrega de:
1.  Assegurar que tots els directoris necessaris existeixin (`ensureDirectoriesExist`).
2.  Carregar les credencials de Google si estan disponibles (`loadGoogleCredentials`).
3.  Llegir `session.json` per restaurar la mida i posició anteriors de la finestra.
4.  Crear la `BrowserWindow` amb les opcions de seguretat adequades, incloent la càrrega del script `preload.cjs`.
5.  Carregar la URL del servidor de desenvolupament de Vite o el fitxer `index.html` de producció.
6.  Construir i establir el menú natiu de l'aplicació (`Menu.buildFromTemplate`).

#### Flux de Tancament Segur

Per evitar la pèrdua de dades no desades, l'aplicació implementa un flux de tancament controlat:

1.  **Interceptació:** L'esdeveniment `window.on('close')` no tanca la finestra directament, sinó que inicia el procés de sortida de l'aplicació (`app.quit()`).
2.  **`before-quit`:** Aquest esdeveniment d'Electron és el nucli del procés.
    -   Utilitza una variable de control `isQuitting` per evitar execucions múltiples.
    -   Desa l'estat actual de la finestra a `session.json`.
    -   Mostra un diàleg de confirmació natiu a l'usuari.
    -   Si l'usuari cancel·la, el procés de tancament s'atura.
    -   Si l'usuari confirma, s'envia un senyal IPC (`'confirm-quit-signal'`) al frontend. **L'aplicació no es tanca encara.**
3.  **Confirmació del Frontend:** L'aplicació espera una resposta del frontend. El hook `useEventDataManager.ts` escolta aquest senyal, desa les dades si hi ha canvis (`hasUnsavedChanges`), i finalment envia un senyal de tornada (`'quit-confirmed-by-renderer-signal'`).
4.  **Tancament Final:** Un cop el backend rep `quit-confirmed-by-renderer-signal`, executa les últimes tasques (crear backup, netejar backups antics) i finalment tanca l'aplicació amb `app.exit()`.

#### Gestió d'Excepcions

El procés principal inclou un gestor `process.on('uncaughtException')` com a última línia de defensa. Si es produeix un error no controlat, s'escriu al fitxer de log, es mostra un diàleg d'error a l'usuari i es tanca l'aplicació de manera forçada per evitar un estat inconsistent.

### 3.3. API Interna: Gestors d'IPC (Inter-Process Communication)

La comunicació entre el frontend i el backend es realitza exclusivament a través de canals IPC. `main.cjs` defineix diversos gestors (`ipcMain.handle` i `ipcMain.on`) que conformen l'API interna de l'aplicació.

-   **Gestió de Dades:**
    -   `load-app-data`: Llegeix `events_data.json` i l'envia al frontend.
    -   `save-app-data`: Rep un objecte de dades del frontend i el desa a `events_data.json`.

-   **Integració amb Google:**
    -   `google-auth-start`: Inicia el flux d'autenticació OAuth 2.0.
    -   `load-google-config`, `save-google-config`: Llegeixen i escriuen les preferències de l'usuari per a Google Calendar.
    -   `google-get-calendar-list`: Obté la llista de calendaris del compte de l'usuari.
    -   `get-google-events`: Recupera esdeveniments dels calendaris seleccionats per a visualització.
    -   `sync-with-google(payload)`: Orquestra la sincronització unidireccional cap a un calendari específic.
    -   `create-new-app-calendar(suffix)`: Crea un nou calendari gestionat per l'app.
    -   `delete-app-calendar(calendarId)`: Elimina un calendari gestionat específic.
    -   `google-disconnect`: Desconnecta el compte de Google i elimina tots els calendaris gestionats.

-   **Accions de l'Aplicació:**
    -   `perform-hard-reset`: Realitza un "reset de fàbrica" eliminant els fitxers de dades, configuració i tokens, permetent a l'usuari començar de zero.
    -   `get-default-data-path`: Retorna la ruta relativa del fitxer de dades per mostrar-la a la UI.

-   **Interacció amb UI Nativa:**
    -   `show-save-dialog`: Permet al frontend obrir un diàleg de desat natiu, rebent les dades i la configuració del diàleg des de React.

    ---

### 3.4. Integració amb Serveis Externs: Google Calendar API

Aquesta secció ha estat refactoritzada per suportar múltiples calendaris. Per a una descripció detallada del nou flux, vegeu la secció **5.1. Flux de Sincronització amb Google Calendar (Multi-Calendari)**.

---

## 4. Frontend: Gestió d'Estat i Lògica de la UI (React)

El frontend és una Single Page Application (SPA) construïda amb React i TypeScript. S'encarrega de tota la presentació visual i la interacció amb l'usuari. La seva arquitectura està dissenyada per ser reactiva, mantenible i fortament tipada.

### 4.1. Gestió d'Estat Centralitzada: El Hook `useEventDataManager`

El fitxer **`src/hooks/useEventDataManager.ts`** és el component més important de la lògica del frontend. És un hook personalitzat de React que actua com una **"font única de veritat" (Single Source of Truth)** per a totes les dades de l'aplicació.

#### Responsabilitats Clau

1.  **Centralització de l'Estat:**
    -   Gestiona els estats principals de l'aplicació mitjançant `useState`:
        -   `eventFrames`: L'array complet d'esdeveniments, incloent les seves assignacions niades.
        -   `peopleGroups`: La llista de contactes (persones i proveïdors).
        -   `materialItems`: L'inventari complet de material.
        -   `googleEvents`: L'array d'esdeveniments obtinguts de Google Calendar (només per a visualització).
        -   `hasUnsavedChanges`: Un booleà que controla si hi ha canvis pendents de desar.
        -   `isSyncing`: Un booleà per controlar l'estat de la interfície durant la sincronització amb Google.

2.  **Exposició de Funcions d'Acció (CRUD):**
    -   Proporciona un conjunt de funcions, memoritzades amb `useCallback` per optimitzar el rendiment, per manipular l'estat de manera segura i consistent:
        -   `addEventFrame`, `updateEventFrame`, `deleteEventFrame`.
        -   `addPersonGroup`, `updatePersonGroup`, `deletePersonGroup`.
        -   `addMaterialItem`, `updateMaterialItem`, `deleteMaterialItem`.
        -   `addAssignment`, `updateAssignment`, `deleteAssignment`.
        -   També inclou funcions de cerca com `getEventFrameById`, `getPersonGroupById`, etc.

3.  **Implementació de la Lògica de Negoci:**
    -   **Detecció de Conflictes:** Les funcions `addAssignment` i `updateAssignment` contenen la lògica per comprovar si una persona ja està assignada a un altre esdeveniment en un rang de dates solapat. Si es detecta un conflicte, la funció retorna un `warningMessage` que es mostra a l'usuari sense impedir l'operació.
    -   **Control d'Estoc:** La funció `getMaterialAvailability` calcula l'estoc disponible en temps real per a un ítem de material en un rang de dates específic, tenint en compte el material ja compromès en altres esdeveniments.
    -   **Gestió d'Estats Mixts:** La lògica per calcular i actualitzar l'estat `Mixt` d'una assignació quan es modifiquen els estats diaris resideix aquí.

4.  **Interacció amb el Backend:**
    -   Orquestra les crides a les funcions exposades a `window.electronAPI` per a operacions que requereixen accés natiu. Exemples:
        -   `syncWithGoogle`: Inicia el flux de sincronització, que ara obre un modal de selecció.
        -   `executeSync`: Executa la sincronització real contra un calendari específic.
        -   `refreshGoogleEvents`: Demana al backend la llista actualitzada d'esdeveniments de Google Calendar.

5.  **Persistència de Dades:**
    -   `loadData`: Rep un objecte `AppData` (normalment del backend) i hidrata tot l'estat del hook. Conté la lògica per reconstruir la relació entre marcs d'esdeveniments i assignacions, i per garantir la creació de fitxes tècniques per defecte en dades antigues.
    -   `exportData`: Recopila tot l'estat actual i el transforma en un objecte `AppData` pla, llest per ser serialitzat a JSON.

#### Context Global (`EventDataContext`)

El resultat del hook `useEventDataManager` es proporciona a tota l'arbre de components de React a través de `src/contexts/EventDataContext.tsx`. Això permet que qualsevol component, a qualsevol nivell de profunditat, pugui accedir a les dades i a les funcions d'acció mitjançant el hook `useEventData()`, evitant el "prop drilling".

### 4.2. Model de Dades i Tipus (`src/types.ts`)

Aquest fitxer és fonamental per a la robustesa del projecte. Defineix totes les estructures de dades clau mitjançant interfícies de TypeScript.

-   **`EventFrame`**: Representa un esdeveniment marc. Conté propietats com `id`, `name`, `startDate`, `endDate`, i, de manera crucial, un array niat `assignments: Assignment[]` i un objecte opcional `techSheet: TechSheetData`.
-   **`Assignment`**: Defineix una assignació de personal. Enllaça un `personGroupId` amb un `eventFrameId` i gestiona l'estat (`status`) i els estats diaris (`dailyStatuses`).
-   **`PersonGroup`**: Representa una entrada a l'agenda (una persona, una empresa, etc.).
-   **`MaterialItem`**: Defineix un article a l'inventari, amb propietats com `stock` i `category`.
-   **`TechSheetData`**: És una de les interfícies més complexes. Modela tota la informació d'una fitxa de bolo, incloent sub-estructures com `TechSheetProvider` i `TechSheetNeed`.
-   **`AppData`**: Defineix l'estructura de l'objecte que es desa al fitxer `events_data.json`, amb llistes planes per a cada tipus de dada per facilitar la serialització.
-   **`GoogleConfig` i `ManagedAppCalendar`**: Tipifiquen la nova estructura de dades per a la configuració de Google.
-   **`ElectronAPI`**: Tipifica l'objecte `window.electronAPI`, proporcionant autocompletat i seguretat de tipus en les comunicacions amb el backend.

### 4.3. Estructura de Components i Vistes

El directori `src/components/` està organitzat seguint una lògica de funcionalitat.

-   **Vistes Principals (`src/components/`):**
    -   `MainDisplay.tsx`: La vista per defecte, que conté el calendari i la llista d'esdeveniments. També implementa la **lògica d'expansió automàtica** de la llista en aplicar filtres per millorar la usabilitat.
    -   `TechSheetsDisplay.tsx`: La vista per gestionar les fitxes de bolo.
    -   `PeopleDisplay.tsx`: La vista per a la gestió de la llibreta d'adreces.
    -   `MaterialDisplay.tsx`: La vista per a la gestió de l'inventari de material.

-   **Components de Lògica de Negoci:**
    -   `EventFrameCard.tsx`: Component complex que representa un esdeveniment a la llista. Gestiona el seu propi estat d'expansió i conté la lògica per renderitzar la llista de `AssignmentCard`.
    -   `AssignmentCard.tsx`: Gestiona la presentació d'una única assignació, incloent la lògica per mostrar i interactuar amb la vista detallada per dies.
    -   `SummaryReports.tsx`: Calcula i renderitza les diferents vistes de resum de dades.

-   **Ecosistema de Fitxes de Bolo (`src/components/tech_sheets/`):**
    -   Aquest directori encapsula tota la complexitat de la fitxa de bolo. `TechSheetForm.tsx` actua com a component pare, orquestrant components fills especialitzats com `TechnicalPersonnelSection.tsx` i `NeedsList.tsx`. Aquesta modularitat permet aïllar la lògica i optimitzar el rendiment.

-   **Modals (`src/components/modals/`):**
    -   Cada modal té el seu propi component, gestionant el seu estat intern de formulari i cridant a les funcions del context (`useEventData`) en enviar-se.

-   **Components d'UI Genèrics (`src/components/ui/`):**
    -   Conté components reutilitzables i de presentació, com `Modal.tsx` i `CollapsibleSection.tsx`, que no tenen lògica de negoci pròpia.

### 4.4. Enrutament de l'Aplicació (`src/App.tsx`)

L'aplicació utilitza `react-router-dom` amb `HashRouter` per a la navegació entre les vistes principals. `HashRouter` és l'elecció estàndard per a aplicacions Electron, ja que funciona bé amb el protocol `file://` utilitzat en les builds de producció i evita problemes de configuració del servidor.

Les rutes principals definides són:
-   `/`: `MainDisplay`
-   `/tech-sheets`: `TechSheetsDisplay`
-   `/people`: `PeopleDisplay`
-   `/material`: `MaterialDisplay`

El component `Navigation.tsx` renderitza els enllaços (`NavLink`) que permeten a l'usuari moure's entre aquestes vistes.

---

## 5. Anàlisi Detallada de Funcionalitats Clau

Aquesta secció descriu el funcionament intern de les característiques més importants de l'aplicació, detallant la interacció entre el backend, el frontend i la lògica de negoci.

### 5.1. Flux de Sincronització amb Google Calendar (Multi-Calendari)

La integració amb Google Calendar s'ha refactoritzat per passar d'un model 1-a-1 (una app, un calendari) a un model **1-a-N** (una app, N calendaris). L'aplicació local continua sent sempre la font de veritat.

#### Arquitectura Híbrida d'Autenticació

El model híbrid es manté:
-   **Compte de Servei (`service-account.json`):** És l'autenticació principal de l'aplicació. Actua com una entitat pròpia i és la **propietària** dels calendaris de l'app. S'encarrega de totes les operacions d'escriptura (crear/eliminar calendaris, afegir/esborrar esdeveniments).
-   **OAuth 2.0 per a l'Usuari (`google-credentials.json`):** El flux de l'usuari s'utilitza per obtenir el seu email i per llegir els seus calendaris personals (només lectura).

#### Flux de Creació d'un Nou Calendari Gestionat

1.  **[UI]** L'usuari obre el modal de configuració de Google (`GoogleSettingsModal`) i fa clic a "+ Crear Nou".
2.  **[Frontend]** S'obre un nou modal dedicat (`CreateCalendarModal`) que demana un sufix per al nou calendari.
3.  **[Frontend]** En confirmar, es crida a `window.electronAPI.createNewAppCalendar(suffix)`.
4.  **[Backend]** El gestor `createNewAppCalendar` a `main.cjs`:
    a. Comprova que no existeixi ja un calendari gestionat amb el mateix nom per evitar duplicats a la configuració.
    b. Invoca `findOrCreateAppCalendar` que, utilitzant el Compte de Servei, crea un nou calendari a Google Calendar amb el nom `Gestor d'Esdeveniments (App) - [Sufix]` o reutilitza un d'existent amb el mateix nom.
    c. Afegeix el nou calendari (amb el seu ID, nom i sufix) a la llista `managedAppCalendars` de `google-config.json`.
    d. Estableix aquest nou calendari com a `activeAppCalendarId`.
    e. Desa el fitxer de configuració i retorna la nova llista de calendaris al frontend.
5.  **[Frontend]** El modal de creació es tanca i notifica al modal de configuració (mitjançant un `CustomEvent`) que ha de refrescar la seva llista de calendaris.

#### Flux de Sincronització Explícita

1.  **[UI]** L'usuari fa clic al botó principal "Sincronitzar" o al botó "Sincronitzar Ara" dins del modal de configuració.
2.  **[Frontend]** S'activa la lògica a `useEventDataManager`:
    -   Si la sincronització es va iniciar des del botó principal, s'obre el modal `SelectSyncCalendarModal`, que mostra la llista de `managedAppCalendars` i permet a l'usuari triar una destinació. El calendari actiu (`activeAppCalendarId`) apareix preseleccionat.
    -   Si es va iniciar des de la configuració, se salta aquest pas i s'utilitza directament l'ID del calendari actiu.
3.  **[Frontend]** S'invoca la funció `executeSync(targetCalendarId)` amb l'ID del calendari escollit.
4.  **[Frontend]** Es crida a `window.electronAPI.syncWithGoogle({ localData, targetCalendarId })`.
5.  **[Backend]** El gestor `sync-with-google` a `main.cjs` executa la lògica:
    a. **Verificació i Autoreparació:** Comprova si `targetCalendarId` encara existeix a Google. Si rep un error `404 Not Found`, l'elimina de la llista `managedAppCalendars` a la configuració local i retorna un error `CALENDAR_NOT_FOUND` al frontend.
    b. **Confirmació de l'Usuari:** Mostra un diàleg advertint que l'operació sobreescriurà les dades.
    c. **Buidatge i Càrrega:** Si es confirma, buida completament el calendari de destinació i hi puja tots els esdeveniments locals, enriquint la descripció amb dades de la fitxa de bolo.
    d. **Actualització del Calendari Actiu:** Després d'una sincronització amb èxit, actualitza `activeAppCalendarId` al fitxer de configuració amb el `targetCalendarId` que s'acaba d'utilitzar.
6.  **[Frontend]** El frontend gestiona la resposta:
    -   En cas d'èxit, actualitza les dades i mostra una notificació.
    -   Si rep l'error `CALENDAR_NOT_FOUND`, mostra un missatge a l'usuari i torna a obrir el modal de selecció perquè pugui triar un altre calendari.

#### Flux de Neteja i Desconnexió

-   **Eliminació d'un Sol Calendari (`delete-app-calendar`):** Des del modal de configuració, l'usuari pot eliminar un calendari gestionat específic. Aquesta acció l'esborra de Google i de la llista `managedAppCalendars` a la configuració.
-   **Desconnexió Completa (`google-disconnect`):** Aquesta acció itera sobre **tots** els calendaris a `managedAppCalendars`, els elimina un per un de Google, revoca els tokens de l'usuari i esborra els fitxers de configuració locals.

### 5.2. Gestor de Fitxes de Bolo (`Tech Sheets`)

La gestió de fitxes de bolo és una de les funcionalitats més complexes, amb un model de dades jeràrquic i una interfície altament dinàmica.

#### Estructura de Dades (`types.ts`)

-   La informació es desa dins de cada `EventFrame` a la propietat `techSheet: TechSheetData`.
-   La clau de la gestió de personal és l'array `technicalProviders: TechSheetProvider[]`.
-   Cada `TechSheetProvider` enllaça un proveïdor de l'agenda (`personGroupId`) amb un array de rols (`roles: TechSheetRoleItem[]`). Aquesta estructura permet, per exemple, que l'empresa "So i Llum SL" (`PersonGroup`) proporcioni "2x Tècnic de So" i "1x Tècnic de Llums" (`TechSheetRoleItem[]`).

#### Lògica del Formulari (`TechSheetForm.tsx`)

-   **Inicialització:** Quan se selecciona un esdeveniment, el component `TechSheetForm` s'inicialitza amb les dades de `eventFrame.techSheet`. Si la propietat no existeix (dades antigues), la funció `createDefaultTechSheet` genera una estructura buida per evitar errors.

-   **Gestió de Desat Intel·ligent (UI Optimista + Debouncing):** Per solucionar la manca de fiabilitat del desat amb `onBlur` (propens a errors de *stale state*) i garantir la integritat de dades en temps real (especialment per al control d'estoc), s'ha implementat un sistema de desat híbrid i robust.
    -   **UI Optimista:** La interfície respon a l'instant als canvis de l'usuari. Quan es modifica una quantitat de material, per exemple, el càlcul de disponibilitat es refresca immediatament basant-se en l'estat intern del formulari, sense esperar el desat a l'estat central.
    -   **Desat Automàtic amb Temporitzador (Debouncing):** Quan l'usuari edita un camp, s'inicia un temporitzador. Si l'usuari fa una pausa, el sistema desa automàticament els canvis a l'estat central de l'aplicació. Això es gestiona amb un `useEffect` que observa canvis a `formData` i una referència (`useRef`) per al flag `isDirty` per evitar l'estat caduc.
    -   **Botó de Desat Manual:** S'ha afegit un botó "Desar Canvis" que s'activa només quan hi ha canvis pendents. Això dona a l'usuari control explícit per forçar un desat immediat si ho desitja.
    -   **Desat de Seguretat:** Com a mesura final de seguretat, una funció de neteja en un `useEffect` garanteix que qualsevol canvi pendent es desi automàticament si l'usuari canvia d'esdeveniment o navega fora de la pàgina, evitant qualsevol pèrdua de dades.

-   **Gestió de Llistes Dinàmiques:**
    -   Les funcions `handleListChange`, `onAddListItem`, i `onRemoveListItem` són **funcions d'ordre superior** que reben el nom de la llista (`'lightingNeeds'`, `'assemblySchedule'`, etc.) com a paràmetre. Aquesta abstracció permet reutilitzar la mateixa lògica per a totes les llistes de la fitxa.
    -   Cada ítem de llista ha de tenir un `id` únic (generat localment amb `generateLocalId`) per a un renderitzat eficient a React.

-  **Actualització Intel·ligent des d'Assignacions:** El botó **`⟳ Actualitza des d'assignacions`** executa una sincronització intel·ligent per evitar duplicats i respectar les entrades manuals.
     1.  **Identifica Assignacions Confirmades:** Obté una llista de tot el personal amb assignacions en estat `Sí` o `Mixt` (amb algun dia `Sí`). Aquesta és la "font de la veritat".
     2.  **Preserva Entrades Manuals:** Analitza els proveïdors existents a la fitxa i separa aquells que han estat afegits manualment (marcats amb la propietat `isManual: true`) i que no corresponen a una assignació confirmada. Aquests es mantenen intactes.
     3.  **Neteja i Reconstrueix:** Elimina totes les entrades anteriors que provenien d'assignacions i les reconstrueix de zero a partir de la llista actual de personal confirmat.
     4.  **Unifica:** Combina les entrades manuals preservades amb les noves entrades generades a partir de les assignacions i desa el resultat final.



### 5.3. Control d'Estoc de Material en Temps Real

Aquesta funcionalitat evita la sobre-assignació de material. La lògica principal resideix a `useEventDataManager.ts`.



 #### Flux de Càlcul (`getMaterialAvailability`)

La funció implementa una lògica granular per garantir un càlcul d'estoc precís, especialment quan hi ha esdeveniments solapats en el temps. Utilitza `useRef` per accedir a l'estat actual de `eventFrames` i `materialItems` sense provocar re-renderitzats, garantint un càlcul eficient.

 1.  **Entrades:** La funció rep l'ID del material (`materialId`), les dates de l'esdeveniment actual (`startDate`, `endDate`) i l'ID de l'esdeveniment actual (`currentEventFrameId`).
 2.  **Obtenció de l'Ítem:** Busca l'ítem de material a `materialItemsRef.current` per obtenir el seu estoc total (`materialItem.stock`). Si no el troba, retorna 0.
 3.  **Iteració per Dia i Càlcul de Disponibilitat Mínima:**
     -   La funció no comprova un simple solapament de rangs, sinó que itera sobre **cada dia individual** dins del rang de dates de l'esdeveniment que s'està consultant (`for (let d = new Date(start); d <= end; ...)`).
     -   Per a cada dia (`currentDate`), calcula l'estoc total compromès (`dailyCommittedStock`) per a aquest dia específic:
         -   Recorre tots els altres `eventFrames` (excloent l'actual per permetre l'edició).
         -   Comprova si l'altre esdeveniment està actiu en `currentDate`.
         -   Si és així, itera sobre les seves necessitats de material (`lightingNeeds`, `soundNeeds`, etc.) a la fitxa tècnica.
         -   Si una necessitat correspon al `materialId` consultat, suma la seva `quantity` a `dailyCommittedStock`.
     -   Calcula l'estoc disponible per a aquell dia (`availableOnDay = materialItem.stock - dailyCommittedStock`).
     -   Actualitza una variable `minAvailable` amb el valor més baix trobat fins ara. Aquest enfocament conservador assegura que el material estigui disponible durant **tot** el període.
 4.  **Resultat:** La funció retorna un objecte `{ total: materialItem.stock, available: minAvailable }`. El valor `available` representa la quantitat d'estoc que es pot garantir com a disponible durant tot el rang de dates de l'esdeveniment.


#### Integració a la UI (`NeedsList.tsx`)

-   El component `NeedsList` crida a `getMaterialAvailability` per a cada ítem de la llista.
-   Mostra el resultat com a text informatiu (`infoText`) al component `TechSheetField`.
-   Aplica una classe CSS d'error al camp de quantitat si `need.quantity > availability.available`.

### 5.4. Detecció de Conflictes d'Assignació

Aquesta lògica, similar al control d'estoc, preveu que una persona sigui assignada a dos llocs alhora.

#### Flux de Validació (`addAssignment` i `updateAssignment`)

1.  **Recopilació d'Assignacions:** Abans de crear o actualitzar una assignació, el sistema recopila totes les altres assignacions de la persona implicada (`personGroupId`) de tots els esdeveniments.
2.  **Iteració per Dies:** Itera sobre cada dia del rang de dates de la nova assignació (o de la que s'està modificant).
3.  **Comprovació de Conflictes:** Per a cada dia, comprova si existeix alguna altra assignació per a aquesta persona en aquest dia concret que tingui un estat de `Sí`, `Pendent` o `Mixt` amb un `Sí` per a aquest dia.
4.  **Generació d'Advertència:**
    -   Si es troba un conflicte, l'operació **no es bloqueja**.
    -   En lloc d'això, es genera un missatge d'advertència detallat (`warningMessage`) que especifica a quin altre esdeveniment i en quina data es produeix el conflicte.
    -   La funció retorna `{ success: true, warningMessage: "..." }`.
5.  **Presentació a l'Usuari:** El component `MainDisplay` rep aquest `warningMessage` i el mostra en un diàleg modal (`conflictDialog`), informant l'usuari del conflicte perquè pugui prendre una decisió informada, però sense impedir-li crear l'assignació si és necessari (p. ex., si són tasques compatibles).


---

### 5.5. Sistema d'Importació/Exportació (JSON, PDF, CSV)

L'aplicació ofereix múltiples opcions per externalitzar i internalitzar dades, proporcionant flexibilitat i capacitat de backup manual.

#### Importació/Exportació General (JSON)

-   **Backend (`main.cjs`):** Utilitza `dialog.showSaveDialog` i `fs.writeFileSync` per a la funcionalitat de desat. Aquesta interacció nativa permet a l'usuari triar la ubicació de l'arxiu de manera familiar.
-   **Frontend (`Controls.tsx`):** Orquestra el procés.
    -   **Guardar:** Crida a `exportData()` de `useEventDataManager` per obtenir l'estat actual i l'envia al backend.
    -   **Carregar:** Utilitza un `<input type="file">` ocult que, en seleccionar un fitxer, el llegeix amb `FileReader` i envia el contingut a `loadData()` del hook.

#### Càrrega Flexible: Fusió vs. Reemplaçament

-   **Flux d'Execució:**
    1.  Quan l'usuari selecciona un fitxer de persones o material, `Controls.tsx` llegeix el JSON.
    2.  En lloc de processar les dades directament, crida a `openModal('mergeOrReplace', { ... })`, passant les dades noves (`newData`) al modal.
    3.  El modal `MergeOrReplaceModal.tsx` presenta a l'usuari les opcions.
    4.  Depenent del botó que es premi, s'executa una de les funcions del context: `mergePeopleGroups`, `replacePeopleGroups`, `addMaterialItemsFromFile` (per a fusió de material) o `replaceMaterialItems`.
-   **Lògica de Fusió (`useEventDataManager.ts`):** La fusió es realitza comparant els noms (en minúscules i sense accents) dels elements nous amb els existents per evitar duplicats. Només s'afegeixen els elements que no existeixen prèviament.

#### Exportació a PDF i CSV

-   **Lògica Centralitzada:** Tota la lògica de generació de documents es troba a **`src/utils/pdfGenerator.ts`** per als PDF i a **`src/utils/csvUtils.ts`** per a les utilitats de CSV. Aquesta centralització fa que el manteniment dels formats d'exportació sigui més senzill.
-   **Exportació de Vistes Filtrades:**
    -   `MainDisplay.tsx` manté un estat (`currentlyDisplayedFrames`) que reflecteix la llista d'esdeveniments actualment visibles segons els filtres aplicats.
    -   Quan l'usuari clica "Exportar a CSV/PDF", aquesta llista filtrada és la que es passa a les funcions d'exportació, assegurant que l'arxiu generat sigui un reflex fidel del que l'usuari veu a la pantalla.
-   **Compatibilitat amb Excel (BOM):** Per garantir la correcta visualització d'accents i caràcters especials en programes com Microsoft Excel, els components que generen fitxers CSV (com `PeopleDisplay.tsx`) afegeixen un **Byte Order Mark (BOM)** (`\uFEFF`) a l'inici del contingut del fitxer.

La lògica d'exportació de les Fitxes de Bolo a PDF (`pdfGenerator.ts`) ha estat optimitzada per crear documents nets i rellevants:

-   **Omissió de Seccions Buides:** Les seccions completes (com 'Il·luminació', 'So', etc.) només apareixen al PDF si contenen alguna dada. Si una llista de necessitats està buida, la secció sencera no s'inclou.
-   **Gestió de Camps Condicionals:** Els camps que depenen d'un selector (com 'Vídeo' o 'Lloguers') només s'inclouen si estan marcats com a 'SI' i tenen informació addicional. Les opcions 'NO' o buides s'ometen.
-   **Consistència de Dades:** Per garantir la precisió, quan un camp condicional es desactiva al formulari (p. ex., canviant de 'SI' a 'NO'), les dades associades s'esborren de l'estat, assegurant que el PDF reflecteixi sempre la informació visible.
---------


 #### Utilitat Centralitzada per a CSV (`csvUtils.ts`)

 Per garantir la consistència i evitar la duplicació de codi (principi DRY), la lògica de formatació de cel·les CSV ha estat refactoritzada:

 1.  **Mòdul Dedicat:** S'ha creat el fitxer **`src/utils/csvUtils.ts`**.
 2.  **Funció d'Escapament (`escapeCsvCell`):** Aquest mòdul exporta una funció reutilitzable, `escapeCsvCell`, que s'encarrega de gestionar correctament els caràcters especials (comes, cometes dobles, salts de línia) dins d'una cel·la. La funció embolcalla el contingut amb cometes dobles si és necessari i escapa les cometes internes segons l'estàndard CSV.
 3.  **Implementació:** Components com `PeopleDisplay.tsx` i `SummaryReports.tsx` importen i utilitzen `escapeCsvCell` per formatar cada cel·la abans de construir el fitxer CSV final.

--------------
### 5.6. Migració de Dades Antigues

Per garantir la retrocompatibilitat amb versions anteriors de l'estructura de dades, s'ha implementat un sistema de migració transparent.

-   **Fitxer Clau:** `src/utils/dataMigration.ts`.
-   **Funció `migrateData`:** Aquesta funció accepta objectes de dades amb l'estructura antiga (p. ex., amb `people` en lloc de `peopleGroups`, ID numèrics, etc.) i els transforma a l'estructura `AppData` moderna.
-   **Activació:** A `Controls.tsx`, dins de `handleLoadAllData`, després de parsejar el JSON, es comprova si el fitxer té l'estructura nova. Si no, es passa a `migrateData` i `validateMigratedData` abans de carregar-lo a l'estat, assegurant una transició suau per a l'usuari.

---

### 5.7. Gestió de l'Estat de "Completat" dels Esdeveniments

L'aplicació permet marcar un esdeveniment marc com a "completat" a nivell de personal. Aquesta és una eina visual ràpida per a l'usuari, que té efectes tant a la llista d'esdeveniments com al calendari.

#### El Model de Dades

La "font de veritat" d'aquest estat és la propietat booleana `personnelComplete` dins de la interfície `EventFrame` a `src/types.ts`. Si és `true`, l'esdeveniment es considera complet; si és `false` o no està definit, es considera incomplet.

#### La Interfície d'Usuari (UI)

La interacció i la representació visual d'aquest estat es gestionen de manera consistent a tota l'aplicació:

1.  **A la Llista d'Esdeveniments (`EventFrameCard.tsx`):**
    -   Cada targeta d'esdeveniment té una icona de cercle de verificació (`CheckCircleIcon`) a la capçalera.
    -   El color d'aquesta icona és condicional: **verd** si l'esdeveniment està completat i **groc** si està incomplet.
    -   En fer-hi clic, s'invoca la funció `updateEventFrame` del gestor d'estat, que inverteix el valor del booleà `personnelComplete`.

2.  **Al Calendari (`MainDisplay.tsx`):**
    -   Quan es generen els esdeveniments per a FullCalendar, s'assigna una classe CSS específica a cada esdeveniment basant-se en l'estat de `personnelComplete`.
    -   S'assigna la classe `event-complete` o `event-incomplete`.

#### Els Estils

Les classes CSS esmentades no són classes de Tailwind per defecte. Estan definides dins del **plugin personalitzat** a `tailwind.config.cjs`. Aquest plugin injecta CSS pur que estableix el color de la vora dels esdeveniments al calendari: una **vora verda** per als completats i una **vora groga** per als incomplets.

Aquesta arquitectura connecta de manera eficient una simple dada booleana amb múltiples representacions visuals a tota la UI, proporcionant un feedback clar i immediat a l'usuari.

### 5.8. Format de Dates: Intern (YYYY-MM-DD) vs. Visual (DD/MM/YYYY)

L'aplicació utilitza deliberadament dos formats de data diferents per a dues finalitats diferents, una pràctica estàndard per garantir la integritat de les dades i una bona experiència d'usuari.

#### La Raó del Doble Format

1.  **Format Intern (`YYYY-MM-DD`):**
    -   **Estàndard i Robustesa:** Aquest format, basat en la norma ISO 8601, és inequívoc, independent de la configuració regional i ideal per a l'emmagatzematge de dades, la comunicació amb API (com la de Google Calendar) i l'ordenació algorítmica.
    -   **Compatibilitat:** És el format natiu que utilitzen els controls `<input type="date">` en HTML5.

2.  **Format Visual (`DD/MM/YYYY`):**
    -   **Experiència d'Usuari (UX):** És el format convencional i familiar per a l'usuari final a la nostra regió. Presentar les dates d'aquesta manera fa que l'aplicació sigui més intuïtiva i llegible.

#### La Implementació

La conversió entre aquests dos formats es gestiona de manera centralitzada per garantir la consistència.

-   **Utilitat Centralitzada:** El mòdul **`src/utils/dateFormat.ts`** conté les funcions `formatDateDMY` i `formatDateRangeDMY`, que són les úniques responsables de realitzar aquesta conversió de format per a la presentació.

-   **Ús a l'Aplicació:**
    -   **Entrada de Dades:** Els formularis amb camps de data utilitzen `<input type="date">`, que internament treballa amb el format `YYYY-MM-DD`. Aquest és el format que es desa a l'estat de React.
    -   **Visualització de Dades:** Tots els components que mostren una data a l'usuari (les targetes d'esdeveniments, els modals de detalls, els resums, etc.) importen i utilitzen les funcions de `dateFormat.ts` per mostrar-les en format `DD/MM/YYYY`. De la mateixa manera, el generador de documents (`pdfGenerator.ts`) utilitza aquestes funcions per garantir que els PDF exportats siguin fàcilment llegibles.

---

## 6. Sistema d'Estils (Tailwind CSS)

El disseny de la interfície es basa en Tailwind CSS, un framework "utility-first" que permet construir dissenys personalitzats de manera ràpida.

### `tailwind.config.cjs`

Aquest fitxer és el centre de la configuració d'estils.

-   **Mode Fosc (`darkMode: 'class'`)**: L'aplicació suporta un tema fosc. Aquesta configuració fa que Tailwind apliqui les variants `dark:` quan la classe `dark` està present a l'element `<html>`. La gestió d'aquesta classe es fa a `App.tsx`.
-   **Plugin Personalitzat**: Per estilitzar components de tercers com FullCalendar, que no utilitzen classes de Tailwind directament, s'ha creat un plugin personalitzat.
    -   Aquest plugin utilitza la funció `addBase` per injectar estils CSS purs.
    -   Permet accedir a les variables de disseny de Tailwind (com `theme('colors.gray.900')`) per mantenir la coherència visual entre els estils personalitzats i la resta de la interfície.
    -   Defineix estils específics per al calendari en mode clar i fosc.

### `index.css`

-   Conté les directives base de Tailwind (`@tailwind base;`, `@tailwind components;`, `@tailwind utilities;`).
-   Defineix algunes classes personalitzades a `@layer components`, com `assignment-card-*`, que agrupen diverses utilitats de Tailwind per a una reutilització més senzilla.

---

## 7. Compilació i Desplegament (CI/CD)

El projecte està configurat per a la Integració i Desplegament Continus (CI/CD) mitjançant GitHub Actions.

### Workflows de GitHub Actions (`.github/workflows/`)

Existeixen tres arxius de workflow, un per a cada sistema operatiu principal:

-   `build-linuxv20-04.yml`
-   `build-macos12.yml`
-   `build-win10.yml`

Tots els workflows s'activen manualment (`workflow_dispatch`) i segueixen un patró similar:

1.  **Checkout:** Descarreguen el codi font del repositori.
2.  **Setup Node.js:** Configuren l'entorn amb la versió de Node.js especificada.
3.  **Install Dependencies:** Executen `npm install` per instal·lar totes les dependències.
4.  **Create `google-credentials.json`:** Aquest és un pas crucial. El contingut del fitxer de credencials s'emmagatzema com un **Secret de GitHub** (`GOOGLE_CREDENTIALS_JSON`). L'acció llegeix aquest secret i crea el fitxer `google-credentials.json` a l'entorn de compilació. Això permet que les credencials s'incloguin de manera segura a l'aplicació empaquetada sense que estiguin exposades al codi font.
5.  **Build Application:** Executen l'script `npm run build:electron` amb les banderes corresponents a cada sistema operatiu (`--linux`, `--win`, `--mac`).
6.  **Upload Artifact:** Empaqueten els binaris generats (`.AppImage`, `.dmg`, `.exe`) com a artefactes de la build, que es poden descarregar des de la pàgina de l'acció a GitHub.

### Configuració d'Electron Builder (`package.json`)

La clau `build` del `package.json` conté la configuració per a `electron-builder`:

-   `appId`: Identificador únic de l'aplicació.
-   `files`: Especifica quins fitxers i directoris s'han d'incloure a l'empaquetat final. És important que `dist/**/*` (el frontend compilat), `main.cjs`, `preload.cjs` i `google-credentials.json` estiguin aquí.
-   `extraResources`: Permet incloure fitxers addicionals (com exemples o la llicència) que seran accessibles des de l'aplicació instal·lada.
-   **Configuracions per Plataforma (`linux`, `win`, `mac`):** Defineixen les opcions específiques per a cada sistema operatiu, com els formats de sortida (`AppImage`, `nsis`, `dmg`) i les icones.

---

## 8. Guia per a Desenvolupadors

* nota * Per mantenir una alta qualitat i robustesa del codi, la configuració de TypeScript a `tsconfig.json` és estricta. Les següents regles estan activades (`true`):

-   `"strict": true`: Activa totes les comprovacions de tipus estrictes.
-   `"noUnusedLocals": true`: Marca un error si es declaren variables que no s'utilitzen.
-   `"noUnusedParameters": true`: Marca un error si es declaren paràmetres de funció que no s'utilitzen.

Això obliga a mantenir un codi net i evita variables residuals que puguin portar a errors.

### Instal·lació i Configuració

1.  **Clona el repositori:**
    ```bash
    git clone https://github.com/Pepelocotango/Gestor-Events_i_Personal.git
    cd Gestor-Events_i_Personal
    ```

2.  **Instal·la les dependències:**
    ```bash
    npm install
    ```

3.  **Configura les Credencials de Google (Opcional, per a desenvolupament):**
    -   Crea un fitxer anomenat `google-credentials.json` a l'arrel del projecte.
    -   Enganxa-hi el contingut JSON de les teves credencials d'OAuth 2.0 per a "Aplicació d'escriptori" obtingudes des de Google Cloud Console.

### Scripts `npm` Disponibles

-   `npm run dev`: Inicia el servidor de desenvolupament de Vite. (Normalment no s'utilitza sol).
-   `npm run electron`: Inicia l'aplicació Electron esperant que el servidor de Vite estigui actiu. (Normalment no s'utilitza sol).
-   `npm run electron-dev`: El comandament principal per al desenvolupament. Llança Vite i Electron simultàniament amb recàrrega en calent (`hot-reloading`).
-   `npm run build`: Compila el codi TypeScript i el frontend amb Vite a la carpeta `dist`.
-   `npm run build:electron`: Comanda genèrica per construir l'empaquetat d'Electron.
-   `npm run build:linux`, `npm run build:win`, `npm run build:mac`: Scripts específics per compilar l'aplicació per a cada sistema operatiu.

### Depuració (Debugging)

-   **Procés Principal (Backend):** Els logs es mostren a la terminal on has executat `npm run electron-dev` i es guarden als fitxers de log a la carpeta de dades de l'usuari.
-   **Procés de Renderitzat (Frontend):** Pots obrir les "Developer Tools" de Chromium des del menú `Veure -> Forçar Recàrrega` i `Veure -> Obrir Eines de Desenvolupament` (o amb el corresponent drecera de teclat). Això et dona accés a la consola, inspector d'elements, etc., com en un navegador web normal.

## Pràctiques de Qualitat i Seguretat del Codi
El projecte segueix una sèrie de bones pràctiques per garantir un codi segur, robust i mantenible:

-   **Immutabilitat de l'Estat: Tota la gestió de l'estat de React segueix el principi d'immutabilitat. En lloc de modificar directament objectes o arrays de l'estat, sempre es creen noves instàncies ([...array], {...objecte}), la qual cosa evita efectes secundaris i bugs de renderitzat.
-   **Separació de Responsabilitats: Les funcions d'utilitat (com la generació de CSV o la migració de dades) s'abstrauen en mòduls dedicats a src/utils/ per promoure la reutilització de codi i seguir el principi DRY (Don't Repeat Yourself).
-   **Programació Defensiva: El codi inclou comprovacions per a window.electronAPI abans de la seva execució, permetent que la base de codi del frontend sigui més resilient i pugui, teòricament, funcionar en un entorn de navegador sense trencar-se.
-   **Superfície d'Atac Mínima: L'API exposada a través de preload.cjs es manté al mínim necessari, eliminant qualsevol funció o listener IPC que no estigui en ús per reduir possibles vectors d'atac.
---

### 9. Solució de Bug de Renderitzat del Calendari

S'ha solucionat un bug visual a la llibreria FullCalendar on alguns elements (com els números dels dies) desapareixien quan altres components de la UI (com les notificacions toast) apareixien. Això es deu a un problema de *repaint/reflow* del navegador que FullCalendar no gestiona automàticament.

La solució implementada força el calendari a recalcular les seves dimensions i redibuixar-se cada vegada que l'estat d'una notificació canvia.

-   **`src/components/MainDisplay.tsx`**: Utilitza `forwardRef` i `useImperativeHandle` per exposar una funció `handleResize` que internament crida a `calendarApi.updateSize()`.
-   **`src/App.tsx`**: Crea una referència (`useRef`) al component `MainDisplay` i utilitza un `useEffect` que, en detectar un canvi a `toastState`, crida a la funció `handleResize` del component fill.