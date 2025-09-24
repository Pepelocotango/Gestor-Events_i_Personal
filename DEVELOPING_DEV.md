branca de desenvolupament * REFAC_OK-PER-REVISAR16-9-25 ## ->PROVES DE REFACTORITZACIÓ
## DEVELOPING.md V1.1.0


# Guia de Desenvolupament: Gestor d'Esdeveniments i Personal

Aquest document proporciona una anàlisi tècnica detallada de l'arquitectura, les funcionalitats clau i les convencions de codi del projecte. Està dissenyat per a desenvolupadors que vulguin entendre el funcionament intern de l'aplicació, contribuir-hi o fer-ne el manteniment.

# NOVETATS V1.1.0 (Setembre 2025)

**Resum de canvis tècnics recents:**
- Refactorització completa de la gestió d'estat amb Zustand i zundo: stores independents, historial desfer/refer, partialize memoitzada per evitar bucles infinits.
- Nova lògica de backups automàtics i tancament intel·ligent: backups per document, neteja automàtica, eliminació de backups de sessió.
- Menú d'aplicació personalitzat en React: substitució del menú natiu d'Electron, comunicació frontend-backend via IPC.
- Gestió d'IPC centralitzada: canals segurs, separació de responsabilitats, API interna documentada.
- Solució als bucles infinits de renderitzat: selectors Zustand independents, gestió asíncrona de flags d'actualització.
- Exemples de selectors correctes amb Zustand:
```tsx
// Selector independent (evita bucles)
const materialItems = useEventDataStore(state => state.materialItems);

// Acció estable (no reactiva)
const { updateMaterialItem } = useEventDataStore.getState();

// Historial desfer/refer
import { useStore } from 'zustand';
const canUndo = useStore(useEventDataStore.temporal, s => s.pastStates.length > 0);
```

Consulta les seccions corresponents per a detalls i exemples complets.

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
2.  **[Frontend]** S'activa una funció que crida a l'acció `exportData()` de l'store de Zustand (`useEventDataStore`).
3.  **[Frontend - Zustand]** L'store recopila totes les dades del seu estat actual (`eventFrames`, `peopleGroups`, etc.) i les retorna com un objecte `AppData`.
4.  **[Frontend]** La funció crida a `window.electronAPI.showSaveDialog()` amb les dades serialitzades en format JSON.
5.  **[Pont]** `preload.cjs` rep la crida i, de forma segura, envia una petició IPC (`ipcRenderer.invoke`) al backend a través del canal `'show-save-dialog'`.
6.  **[Backend]** El gestor `ipcMain.handle('show-save-dialog', ...)` a `main.cjs` rep la petició.
7.  **[Backend]** Utilitzant el mòdul `dialog` d'Electron, obre una finestra de diàleg nativa del sistema operatiu perquè l'usuari triï on desar el fitxer.
8.  **[Backend]** Un cop l'usuari confirma, utilitza el mòdul `fs` de Node.js per escriure les dades rebudes al disc.
9.  **[Backend -> Pont -> Frontend]** El resultat de l'operació (èxit o error) es retorna a través de la `Promise` de `ipcRenderer.invoke`.
10. **[Frontend]** El component que va iniciar l'acció rep el resultat i mostra una notificació (toast) a l'usuari.

Aquest flux demostra la clara separació de responsabilitats: el frontend gestiona la UI i l'estat, mentre que el backend s'encarrega de les operacions a nivell de sistema, garantint seguretat i un rendiment natiu.



---

## 3. Backend: El Procés Principal d'Electron (`main.cjs`)

El fitxer `main.cjs` és el punt d'entrada i el nucli de l'aplicació. S'executa en un entorn Node.js complet, la qual cosa li atorga accés directe a les API del sistema operatiu per a la gestió de finestres, menús, sistema de fitxers i comunicacions de xarxa. Actua com el "cervell" que orquestra totes les operacions natives.

### 3.1. Sistema d'Arxius i Persistència de Dades

L'aplicació gestiona totes les dades de l'usuari localment, garantint el seu funcionament offline. La ubicació central de les dades de configuració és el directori de dades de l'usuari, proporcionat per Electron (`app.getPath('userData')`).

#### Estructura de Fitxers i Rutes Clau

Les rutes principals es defineixen com a constants a l'inici del fitxer:

-   `CONFIG_DIR`: Apunta a `app.getPath('userData')`. És el directori arrel per a totes les dades de configuració de l'aplicació.
-   `SESSION_FILE`: (`.../session.json`) Emmagatzema l'estat de la sessió. Les seves responsabilitats s'han ampliat:
    -   Estat de la finestra (mida i posició).
    -   `recentFiles`: Un array amb les rutes dels últims 10 documents oberts per l'usuari.
-   `BACKUP_DIR`: (`.../backups/`) Subdirectori on es guarden les còpies de seguretat del fitxer de dades per defecte. **Nota:** La lògica de backup actual encara està lligada a l'antic `events_data.json` i es manté per compatibilitat.
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

Per prevenir la pèrdua de dades, s'ha implementat un sistema de còpies de seguretat automàtic i millorat:

-   **Activació:** La funció `createBackup(filePath)` es crida automàticament des dels gestors IPC `save-file` i `show-save-dialog` cada vegada que un document es desa amb èxit.
-   **Nomenclatura:** Cada backup es desa a `BACKUP_DIR`. El nom del fitxer ara inclou el nom del document original per a una millor identificació (p. ex., `backup-ElMeuProjecte-2025-09-20T103000.json`), a més d'un timestamp per garantir que cada còpia sigui única.
-   **Neteja Automàtica:** La funció `cleanupOldBackups(filePath)` s'executa també després de cada desat. Revisa el directori de backups i elimina els més antics per a aquell document específic, conservant només els 5 més recents.

### 3.2. Cicle de Vida i Gestió de Finestres

El backend controla tots els aspectes del cicle de vida de l'aplicació, incloent un flux de tancament intel·ligent i segur.

#### Flux de Tancament Intel·ligent

El flux de sortida s'ha refactoritzat per eliminar els "backups de sessió" i alinear-se amb un model de gestió de documents, respectant sempre la decisió de l'usuari.

1.  **Interceptació del Tancament (`before-quit`):**
    -   Quan l'usuari intenta tancar l'aplicació, el listener `app.on('before-quit')` a `main.cjs` s'activa.
    -   Aquest listener desa l'estat de la finestra (mida/posició) i envia el senyal `'confirm-quit-signal'` al frontend, prevenint la sortida immediata per cedir el control.

2.  **Gestió Centralitzada al Frontend (`onConfirmQuit`):**
    -   Un listener a `App.tsx` rep el senyal i centralitza tota la lògica.
    -   **Sempre** es mostra un diàleg de confirmació a l'usuari per prevenir un tancament accidental.
        -   Si hi ha canvis no desats, el diàleg ofereix les opcions: "Desa", "Tanca sense desar" i "Cancel·la".
        -   Si no hi ha canvis, el diàleg simplement pregunta: "Estàs segur que vols sortir de l'aplicació?" amb les opcions "Sortir" i "Cancel·lar".
    -   En funció de la resposta, l'aplicació desa les dades si és necessari i finalment crida a l'IPC `quit-application` per tancar-se, o bé avorta el procés si l'usuari cancel·la.

3.  **Tancament Definitiu (`quit-application`):**
    -   El nou gestor IPC `quit-application` al backend té una única responsabilitat: marcar la variable `isQuitting` com a `true` i cridar a `app.quit()`.
    -   Això assegura que el segon esdeveniment `before-quit` no sigui interceptat, permetent que l'aplicació es tanqui de manera neta i definitiva.

El sistema de backups de sessió (`backup_sessio.json`) ha estat completament eliminat. Els backups ara només es creen de manera explícita quan l'usuari desa un document, com es descriu a la secció `Còpies de Seguretat (Backups)`.

#### Separació de Configuració Google

- **Configuració Local:**
  - Es desa a `google-config.json` (usuari). Inclou calendaris gestionats, calendaris externs, selecció d'ID, etc.
  - Camps com `externalCalendars`, `selectedIds` i preferències visuals són exclusius de l'usuari i no es modifiquen en obrir documents.
- **Configuració de Document:**
  - Quan s'obre un document, només s'actualitzen `activeAppCalendarId` i `managedAppCalendars` a la store, la resta de camps romanen intactes.
    - Això garanteix que la configuració local de l'usuari no es perdi ni se sobreescrigui accidentalment.

> **Nota important:** Els IDs dels calendaris gestionats (`managedAppCalendars`, `activeAppCalendarId`) estan lligats als fitxers de dades. Un usuari pot tenir diferents documents amb calendaris diferents. El logging OAuth (autenticació Google) és independent del document: l'usuari pot canviar de fitxer i de calendaris gestionats sense perdre la sessió ni la vinculació amb el seu compte Google.


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

#### Flux de Tancament Intel·ligent

El flux de tancament de l'aplicació ha estat redissenyat per utilitzar un únic diàleg intel·ligent i garantir backups incondicionals. Per a una descripció detallada del procés, consulteu la secció **3.2. Cicle de Vida i Gestió de Finestres > Flux de Tancament Intel·ligent (Diàleg Únic)**.

#### Gestió d'Excepcions

El procés principal inclou un gestor `process.on('uncaughtException')` com a última línia de defensa. Si es produeix un error no controlat, s'escriu al fitxer de log, es mostra un diàleg d'error a l'usuari i es tanca l'aplicació de manera forçada per evitar un estat inconsistent.

### 3.3. Menú d'Aplicació Personalitzat (Custom Menu Bar)

Per solucionar un bug de renderitzat del menú natiu d'Electron en configuracions de múltiples pantalles a Linux, s'ha reemplaçat el menú natiu per un component de menú personalitzat construït amb React.

#### Arquitectura de la Solució

1.  **Desactivació del Menú Natiu (`main.cjs`):**
    -   A la configuració de `BrowserWindow`, s'ha afegit la propietat `autoHideMenuBar: true`. Això amaga la barra de menú per defecte, però encara permet accedir-hi prement la tecla `Alt`.
    -   Les línies `Menu.buildFromTemplate(template)` i `Menu.setApplicationMenu(menu)` han estat comentades per desactivar completament la creació del menú natiu.

2.  **Component de React (`src/components/ui/CustomMenuBar.tsx`):**
    -   S'ha creat un nou component de React que replica visualment i funcionalment l'estructura del menú anterior.
    -   Aquest component gestiona el seu propi estat per controlar la visibilitat dels menús desplegables.

3.  **Comunicació Frontend -> Backend (`trigger-menu-action`):**
    -   Quan un usuari fa clic a un element del menú, el component de React crida a la funció `window.electronAPI.triggerMenuAction(action)`, passant una cadena que identifica l'acció (p. ex., `'save-all'`, `'reload'`).
    -   Aquesta funció està exposada de manera segura a través de `preload.cjs`.

4.  **Gestor d'Accions Centralitzat (`main.cjs`):**
    -   S'ha implementat un nou listener `ipcMain.on('trigger-menu-action', ...)` que actua com un enrutador per a totes les accions del menú.
    -   **Accions del Procés Principal:** Les accions que requereixen accés a les API d'Electron o Node.js (com obrir diàlegs de fitxers, gestionar el zoom de la finestra o tancar l'aplicació) són gestionades directament dins d'aquest listener.
    -   **Accions del Procés de Renderitzat:** Les accions que afecten l'estat de la UI (com canviar de tema, desar dades, obrir modals, o executar desfer/refer) es redirigeixen al procés de renderitzat a través del canal IPC existent `'menu-action'`, on són gestionades pel listener corresponent a `App.tsx`.

Aquest enfocament no només soluciona el bug original, sinó que també proporciona un control total sobre l'aparença i el comportament del menú, permetent una integració més profunda amb el disseny de l'aplicació. El menú "Edita" s'ha afegit seguint aquest mateix patró.

### 3.4. API Interna: Gestors d'IPC (Inter-Process Communication)

La comunicació entre el frontend i el backend es realitza exclusivament a través de canals IPC. `main.cjs` defineix diversos gestors (`ipcMain.handle` i `ipcMain.on`) que conformen l'API interna de l'aplicació.

-   **Gestió de Dades de Documents:**
    -   `open-file-dialog`: Obre un diàleg natiu per seleccionar un fitxer i retorna la ruta seleccionada.
    -   `read-file`: Llegeix el contingut d'un fitxer donada una ruta.
    -   `save-file`: Desa un contingut a una ruta de fitxer específica, sobreescrivint-lo.
    -   `show-save-dialog`: Obre un diàleg de desat natiu i, si l'usuari confirma, desa el contingut a la nova ruta.

-   **Gestió de Sessió:**
    -   `get-recent-files`: Retorna la llista de fitxers recents des de `session.json`.
    -   `add-recent-file`: Afegeix una ruta a la llista de fitxers recents.

-   **Handlers Obsolets:**
    -   `load-app-data`: Encara existeix per a la seqüència d'inici, però ara només retorna `null`.
    -   `save-app-data`, `getDefaultDataPath`: Han estat eliminats.

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
    -   `factory-reset`: Realitza una restauració de fàbrica eliminant els fitxers de configuració de l'aplicació.
    -   `quit-application`: Inicia el procés de tancament definitiu de l'aplicació.

-   **Interacció amb UI Nativa:**
    -   `show-save-dialog`: Permet al frontend obrir un diàleg de desat natiu.
    -   `show-unsaved-changes-dialog`: Mostra el diàleg personalitzat de canvis no desats en sortir.

    ---

### 3.5. Integració amb Serveis Externs: Google Calendar API

Aquesta secció ha estat refactoritzada per suportar múltiples calendaris. Per a una descripció detallada del nou flux, vegeu la secció **5.1. Flux de Sincronització amb Google Calendar (Multi-Calendari)**.

---

## 4. Frontend: Gestió d'Estat i Lògica de la UI (React)

El frontend és una Single Page Application (SPA) construïda amb React i TypeScript. La seva arquitectura ha estat refactoritzada per utilitzar **Zustand** com a eina principal per a la gestió de l'estat global.

### 4.1. Gestió d'Estat Centralitzada amb Zustand

L'estat global del frontend es gestiona a través de *stores* de Zustand, la qual cosa desacobla la lògica de l'estat dels components de React i millora el rendiment.

#### Stores de Zustand (`src/stores/`)

1.  **`eventDataStore.ts`**:
    -   **Descripció:** És la **font única de veritat** per a totes les dades principals de l'aplicació (esdeveniments, contactes, material).
    -   **Contingut:**
        -   **Estat:** Emmagatzema els arrays de `eventFrames`, `peopleGroups`, `materialItems`, l'estat de `hasUnsavedChanges`, etc.
        -   **Accions:** Conté totes les funcions per manipular aquestes dades (CRUD: `addEventFrame`, `updateAssignment`, etc.), la lògica de negoci (detecció de conflictes, disponibilitat de material), i la interacció amb el backend per a la persistència de dades (`loadData`, `exportData`).
    -   **Middleware:**
        -   **`immer`**: Permet escriure lògica de mutació d'estat de manera més senzilla i segura, com si es mutés l'estat directament.
        -   **`temporal` (de `zundo`)**: Envolta l'store per afegir automàticament la funcionalitat de desfer/refer (`undo`/`redo`) a totes les modificacions de l'estat.

2.  **`googleConfigStore.ts`**:
    -   **Descripció:** Gestiona tot l'estat i la lògica relacionats amb la configuració de Google Calendar.
    -   **Contingut:**
        -   **Estat:** Emmagatzema els `managedCalendars`, `externalCalendars`, `selectedIds`, `activeCalendarId`, i els estats de `loading` i `error`.
        -   **Accions:** Centralitza tota la interacció amb el backend per a la configuració de Google, incloent `fetchAndLoadConfig`, `saveConfig`, `createNewCalendar`, `deleteCalendar` i `disconnectGoogle`.

3.  **`modalStore.ts`**:
    -   **Descripció:** Gestiona quin modal està obert (`type`), les dades inicials amb què es va obrir (`data`) i si és visible (`isOpen`). També actua com un vehicle per a funcionalitats globals com les notificacions.
    -   **Contingut:**
        -   **`showToast`**: Manté una referència a la funció `showToast` creada a `App.tsx`. Això permet que altres stores (com `googleConfigStore`) puguin disparar notificacions a la UI de manera desacoblada.

#### Middleware de Depuració (`loggingMiddleware.ts`)

El projecte inclou un middleware de Zustand personalitzat a `src/stores/loggingMiddleware.ts` dissenyat per a la depuració.

- **Funcionalitat:** Quan s'aplica a un store, aquest middleware registra automàticament cada acció que es crida, l'estat *abans* del canvi, i l'estat *després* del canvi. Això és extremadament útil durant el desenvolupament per traçar com i per què canvia l'estat.
- **Ús:** Actualment, aquest middleware **no està actiu** a cap dels stores de producció per evitar sobrecarregar la consola. No obstant això, un desenvolupador pot activar-lo fàcilment per depurar un store específic.

Per exemple, per activar-lo a `eventDataStore.ts`, s'hauria d'importar i embolcallar la definició de l'store:

```typescript
import { loggingMiddleware } from './loggingMiddleware';
// ...

export const useEventDataStore = create<...>()(
  loggingMiddleware( // <-- Embolcallar amb el middleware
    temporal(
      immer(
        (set, get) => ({
          // ... contingut de l'store
        })
      )
    ),
    'eventDataStore' // <-- Nom per al logging
  )
);
```

#### Patró d'Ús de Zustand als Components

-   **Accés a l'Estat (Reactiu):** Els components se subscriuen de manera selectiva només a les porcions (`slices`) de l'estat que necessiten per renderitzar-se. Això evita re-renderitzats innecessaris.
    ```tsx
    // Aquest component només es tornarà a renderitzar quan `hasUnsavedChanges` canviï.
    const hasUnsavedChanges = useEventDataStore(state => state.hasUnsavedChanges);
    ```

-   **Accés a les Accions (No Reactiu):** Com que les funcions d'acció són estables, es poden obtenir directament de l'store amb `getState()` dins de gestors d'esdeveniments (`event handlers`) per evitar passar-les com a `props` o incloure-les a les dependències dels `useEffect`.
    ```tsx
    const handleAdd = () => {
      const { addEventFrame } = useEventDataStore.getState();
      addEventFrame({ /* ...dades... */ });
    };
    ```

-   **Accés a l'Store Temporal (Desfer/Refer):** Per interactuar amb l'estat de l'historial (p. ex., per activar/desactivar botons), s'ha d'utilitzar un hook `useStore` específic importat de Zustand.
    ```tsx
    import { useStore } from 'zustand';

    const canUndo = useStore(useEventDataStore.temporal, state => state.pastStates.length > 0);
    const { undo } = useEventDataStore.temporal.getState();
    ```

#### Historial d'Accions Visual (Desfer/Refer)

La funcionalitat d'historial desfer/refer utilitza Zustand + zundo amb una optimització clau:

- **Descripció d'acció:** Cada acció que modifica l'estat actualitza `lastActionDescription` amb un text clar (ex: "Creat esdeveniment: 'Nom'").
- **Notificacions:** Les funcions `undoWithToast` i `redoWithToast` mostren un toast amb la descripció de l'acció desfer/refer.
- **Neteja d'historial:** L'historial es neteja automàticament en carregar un nou document.
- **Visualitzador interactiu:** El modal `HistoryModal.tsx` mostra la llista d'accions passades/futures. Ara la descripció de cada acció a desfer/refer reflecteix l'acció que realment s'eliminarà (no la de l'estat actual), gràcies a una lògica que mostra la descripció del següent estat.
- **Optimització partialize:** La funció `partialize` del store està memoitzada per evitar bucles infinits de render, retornant el mateix objecte si l'estat no canvia.
### Correcció modal d'historial
El modal d'historial mostra ara la descripció de l'acció que es desfarà/refer, no la de l'estat actual. Això evita confusió i fa que el feedback sigui fidel a l'acció real.

### 4.2. Lògica de Gestió de Documents (`App.tsx`)
`App.tsx` orquestra tota la lògica del cicle de vida dels documents.

-   **Estat Clau:**
    -   `isDocumentOpen: boolean`: Controla si s'ha de mostrar la pantalla de benvinguda o la interfície principal de l'aplicació.
    -   `currentFilePath: string | null`: Emmagatzema la ruta del fitxer actualment obert. És `null` si es tracta d'un document nou que encara no s'ha desat.
    -   `recentFiles: string[]`: La llista de fitxers recents per mostrar a la UI.

-   **Funcions Gestores:**
    -   `handleNewDocument()`: Inicia un nou document buit.
    -   `handleOpenDocument(filePath?)`: Obre un document, ja sigui des d'un diàleg de fitxer o des de la llista de recents.
    -   `handleSaveDocument()`: Desa el document actual. Si no té ruta (`currentFilePath` és `null`), crida a `handleSaveAsDocument()`.
    -   `handleSaveAsDocument()`: Permet desar el document actual en una nova ubicació.
    -   `confirmContinueWithUnsavedChanges()`: Funció d'ajuda que comprova el "dirty flag" (`hasUnsavedChanges`) i mostra el diàleg de confirmació abans de realitzar una acció que podria causar pèrdua de dades (com crear un nou document o obrir-ne un altre).

### 4.3. Menú d'Aplicació i UI
-   **`WelcomeScreen.tsx`**: Nou component que actua com a pantalla d'inici, oferint accés ràpid a les accions de fitxer.
-   **`CustomMenuBar.tsx`**: El menú s'ha reestructurat per reflectir les accions estàndard de gestió de fitxers. Està connectat a l'estat d'`App.tsx` per activar/desactivar opcions de manera dinàmica (p. ex., "Guardar" només està actiu si hi ha canvis no desats).
-   **`Controls.tsx`**: Aquest component mostra ara la ruta del fitxer actiu (`currentFilePath`). La seva funcionalitat de càrrega/desat s'ha tornat redundant amb el nou menú, però es manté de moment.

### 4.4. Component Reutilitzable: `AutosizeTextarea`

Per donar resposta a la necessitat que les àrees de text s'ajustin al seu contingut, s'ha creat un nou component a `src/components/ui/AutosizeTextarea.tsx`.

-   **Funcionament:** El component embolcalla un `<textarea>` estàndard. Utilitza el hook `useLayoutEffect` per recalcular i ajustar l'alçada de l'element cada vegada que el seu valor canvia. `useLayoutEffect` es fa servir en lloc de `useEffect` per evitar un parpelleig visual, ja que el càlcul es realitza de manera síncrona després de les mutacions del DOM.
-   **Gestió de `ref` (Ref Forwarding):** Per solucionar l'advertència de React "Function components cannot be given refs", el component està embolicat amb `React.forwardRef`. Això li permet rebre una `ref` d'un component pare (com el component `Tooltip`, que la necessita per posicionar-se) i passar-la directament a l'element `<textarea>` intern. La lògica de `useLayoutEffect` també ha estat actualitzada per utilitzar aquesta `ref` reenviada.
-   **Integració:** Per aplicar aquest canvi de manera eficient, el component genèric `TechSheetField.tsx` ha estat modificat per renderitzar `AutosizeTextarea` quan se li passa la propietat `as="textarea"`. La resta de formularis de l'aplicació també han estat actualitzats per utilitzar aquest nou component.

### 4.4. Model de Dades i Tipus (`src/types.ts`)

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
-   **`MaterialDisplay.tsx`**: La vista per a la gestió de l'inventari de material. Ha estat **refactoritzada** per utilitzar el component `MaterialForm`.

-   **Components de Formularis Reutilitzables (`src/components/forms/`):**
    -   Aquest directori conté components de formulari dissenyats per ser reutilitzats en diferents parts de l'aplicació (p. ex., en vistes principals i en modals).
    -   `MaterialForm.tsx`: Un component controlat que encapsula la UI i la lògica de validació per crear i editar ítems de material. Rep `props` com `initialData`, `onSubmit` i `onCancel` per desacoblar-lo de la gestió de l'estat.

-   **Components de Lògica de Negoci:**
    -   `EventFrameCard.tsx`: Component complex que representa un esdeveniment a la llista. La seva capçalera està dissenyada per ser totalment clicable per expandir/col·lapsar el contingut. La lògica `onClick` de la capçalera comprova si el clic s'ha fet sobre un element interactiu (com un botó) per evitar l'expansió/col·lapse no desitjat, gestionant les interaccions de l'usuari de manera precisa. Conté la lògica per renderitzar la llista de `AssignmentCard`.
    -   `AssignmentCard.tsx`: Gestiona la presentació d'una única assignació. S'ha estandarditzat com `EventFrameCard` per permetre expandir/col·lapsar la vista diària fent clic a qualsevol lloc de la capçalera.
    -   `SummaryReports.tsx`: Calcula i renderitza les diferents vistes de resum de dades.

-   **Ecosistema de Fitxes de Bolo (`src/components/tech_sheets/`):**
    -   Aquest directori encapsula tota la complexitat de la fitxa de bolo. `TechSheetForm.tsx` actua com a component pare, orquestrant components fills especialitzats com `TechnicalPersonnelSection.tsx` i `NeedsList.tsx`. Aquesta modularitat permet aïllar la lògica i optimitzar el rendiment.

-   **Modals (`src/components/modals/`):**
    -   Cada modal té el seu propi component. La gestió de la seva visibilitat i de les dades amb què s'inicialitzen es controla a través del `modalStore`, tal com es descriu a la secció "Gestió de l'Estat dels Formularis".

-   **Components d'UI Genèrics (`src/components/ui/`):**
    -   Conté components reutilitzables i de presentació.
    -   `Modal.tsx`: Component base per a totes les finestres modals.
    -   `CollapsibleSection.tsx`: Un component clau per a l'organització de la UI. Ha estat dissenyat per funcionar de dues maneres:
        -   **Mode no controlat (per defecte):** Gestiona el seu propi estat d'expansió internament amb `useState`.
        -   **Mode controlat:** Si rep les propietats `isOpen` i `onToggle`, cedeix el control del seu estat a un component pare, permetent que l'estat d'expansió sigui gestionat per un store global com Zustand. Aquest patró s'utilitza per a la secció de la "Llista d'Esdeveniments".

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
3.  **[Frontend]** En confirmar, el component crida a l'acció `createNewCalendar(suffix)` de l'store `useGoogleConfigStore`.
4.  **[Frontend - Zustand]** L'acció de l'store crida a `window.electronAPI.createNewAppCalendar(suffix)`.
5.  **[Backend]** El gestor `createNewAppCalendar` a `main.cjs` executa la mateixa lògica de creació i desat.
6.  **[Frontend - Zustand]** Un cop rep la resposta del backend, l'store actualitza el seu estat (`managedCalendars`, `activeCalendarId`) i refresca la llista completa de calendaris.
7.  **[Frontend]** Com que `GoogleSettingsModal` està subscrit a aquest store, es re-renderitza automàticament amb la nova llista de calendaris sense necessitat d'esdeveniments personalitzats. El modal de creació es tanca.

#### Flux de Sincronització Explícita

1.  **[UI]** L'usuari fa clic al botó principal "Sincronitzar" o al botó "Sincronitzar Ara" dins del modal de configuració.
2.  **[Frontend]** Es crida a l'acció `syncWithGoogle()` de l'store `useEventDataStore`.
3.  **[Frontend - Zustand]** L'acció `syncWithGoogle` conté la lògica d'orquestració:
    -   Crida a `window.electronAPI.loadGoogleConfig()` per obtenir la configuració actual.
    -   Si no hi ha calendaris gestionats, obre el modal de configuració (`googleSettings`) utilitzant `useModalStore`.
    -   Si n'hi ha, obre el modal de selecció (`selectSyncCalendar`), passant-li la llista de calendaris i l'ID actiu.
4.  **[Frontend]** Un cop l'usuari confirma el calendari al modal, s'invoca la funció `executeSync(targetCalendarId)` de l'store `useEventDataStore`.
5.  **[Frontend - Zustand]** L'acció `executeSync` crida a `window.electronAPI.syncWithGoogle({ localData, targetCalendarId })`.
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

-   **Reordenació de Personal Tècnic (Drag-and-Drop):**
    -   **Tecnologia:** S'utilitza la llibreria `dnd-kit` per implementar la funcionalitat d'arrossegar i deixar anar.
    -   **Implementació:**
        -   El component `TechnicalPersonnelSection.tsx` embolcalla la llista de proveïdors amb `DndContext` i `SortableContext`.
        -   S'ha creat un component reutilitzable `SortableProvider.tsx` que utilitza el hook `useSortable` per fer que cada proveïdor sigui arrossegable.
        -   S'ha afegit una icona de "drag handle" a cada proveïdor per iniciar l'arrossegament.
        -   L'esdeveniment `onDragEnd` calcula el nou ordre i crida a l'acció `reorderTechnicalProviders` de l'store `eventDataStore.ts`.
    -   **Flux de Dades:** `onDragEnd` -> `reorderTechnicalProviders` (Zustand) -> Actualització de l'estat -> Re-renderitzat de la llista.

-  **Actualització Interactiva des d'Assignacions:** Per donar un control més gran a l'usuari, el botó **`⟳ Actualitza des d'assignacions`** ja no modifica directament la fitxa, sinó que obre un diàleg de confirmació.
    1.  **Càlcul de Canvis:** En fer clic, la lògica a `TechnicalPersonnelSection.tsx` compara el personal actual de la fitxa amb les assignacions confirmades i genera tres llistes: personal per afegir, personal per eliminar i personal per mantenir.
    2.  **Modal de Previsualització (`UpdateFromAssignmentsModal`):** Aquestes llistes s'envien a un nou modal que mostra cada canvi proposat (addicions en verd, eliminacions en vermell) amb una casella de selecció.
    3.  **Confirmació de l'Usuari:** L'usuari pot seleccionar quins canvis vol aplicar. Pot acceptar totes les suggestions, cap, o una combinació.
    4.  **Aplicació Selectiva:** Un cop confirmat, el modal retorna només els canvis seleccionats a `TechSheetForm.tsx`, que els aplica a l'estat, garantint que no es perdi cap entrada manual ni s'apliquin canvis no desitjats.
    5.  **Gestió d'Esdeveniments de Diversos Dies:** La lògica d'afegir nous rols des del modal inclou la funcionalitat de detallar els dies específics per a assignacions de tipus `Mixt`.



### 5.3. Centre de Control de Material (Càlcul de Pic de Demanda)

Aquesta secció ha estat completament redissenyada per oferir una anàlisi més potent i realista de les necessitats de material. En lloc de sumar tota la demanda, ara calcula el **pic de demanda concurrent** per a un període determinat, responent a la pregunta: "Quin és el nombre màxim d'unitats d'un ítem que necessitaré en un sol dia?".

#### Lògica de Càlcul (`selectMaterialControlData`)

La lògica principal resideix al selector `selectMaterialControlData` dins de `eventDataStore.ts`.

-   **Condició d'Activació:** El càlcul de pic de demanda només s'activa si l'usuari aplica un **filtre per esdeveniments o un rang de dates**. Si no hi ha cap d'aquests filtres actius, la vista mostra tots els ítems de l'inventari amb una demanda de 0, per a una gestió ràpida de l'estoc.

-   **Flux de Càlcul de Pic de Demanda:**
    1.  **Identificació d'Esdeveniments Rellevants:** El selector primer filtra la llista global d'esdeveniments per quedar-se només amb aquells que coincideixen amb els filtres actius.
    2.  **Càlcul per Ítem:** Per a cada `MaterialItem` de l'inventari:
        a.  Recopila totes les necessitats (`NeedItem`) d'aquest ítem dins dels esdeveniments rellevants.
        b.  Determina el rang de dates global (mínim i màxim) cobert per aquestes necessitats.
        c.  **Iteració Diària:** Recorre aquest rang dia per dia. Per a cada dia, suma la quantitat total de l'ítem requerida per tots els esdeveniments que estan actius en aquella data.
        d.  **Determinació del Pic:** Emmagatzema el valor diari més alt trobat durant la iteració. Aquest valor és el `totalDemand`.
    3.  **Càlcul del Balanç:** El balanç es calcula com `item.stock - totalDemand`. Un valor negatiu indica un dèficit en el dia de màxima demanda.

#### Canvis a la Interfície d'Usuari (`MaterialControlTable.tsx`)

Per reflectir aquesta nova lògica, la interfície s'ha reorganitzat:

-   **Nou Ordre de Columnes:** Les columnes ara segueixen un ordre més lògic per a la gestió d'estoc: `Estoc`, `Nom`, `Categoria`, `Origen`, `Demanada`, `Balanç`.
-   **Ordenació per Defecte:** La taula s'ordena per defecte per la columna `Balanç` en ordre ascendent, destacant immediatament els ítems amb més problemes d'estoc (els balanços més negatius).
-   **Desglossament Enriquit:** En expandir una fila, el desglossament ara mostra no només la quantitat necessària per a cada esdeveniment, sinó també el rang de dates de l'esdeveniment, proporcionant un context crucial.

Aquesta refactorització converteix el Centre de Control de Material en una eina predictiva molt més precisa i útil per a la planificació logística.



 #### Flux de Càlcul (`getMaterialAvailability`)

La funció implementa una lògica granular per garantir un càlcul d'estoc precís. Per evitar re-renderitzats innecessaris durant el càlcul, accedeix a l'estat directament amb `get()` dins de l'store.

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

#### Propagació de Canvis i Font de Veritat

Per garantir la consistència de les dades a tota l'aplicació, s'ha implementat un sistema de propagació de canvis des de l'inventari mestre:

-   **Edició Centralitzada:** Qualsevol propietat d'un ítem de material es pot editar ara des de la vista de "Material".
-   **Bloqueig de UI:** En desar un canvi, la UI es bloqueja temporalment per garantir que l'operació sigui atòmica.
-   **Propagació Automàtica:** L'acció `updateMaterialItem` a `eventDataStore` no només actualitza l'ítem a la llista `materialItems`, sinó que també itera sobre tots els `eventFrames` i les seves `techSheet`. Si troba una necessitat (`NeedItem`) que utilitza el material modificat (comparant `materialItemId`), actualitza automàticament les seves propietats derivades (com `description` i `origin`).
-   **Font de Veritat:** Per reforçar aquest concepte, a `NeedsList.tsx`, els camps "Descripció" i "Origen" d'una necessitat es tornen de només lectura (`readOnly`) si estan vinculats a un ítem de l'inventari, evitant edicions manuals que podrien crear inconsistències.

### 5.4. Detecció de Conflictes d'Assignació

Aquesta lògica, similar al control d'estoc, preveu que una persona sigui assignada a dos llocs alhora.

#### Flux de Validació amb Confirmació de l'Usuari

Per oferir més flexibilitat, el sistema ja no bloqueja les assignacions duplicades, sinó que demana confirmació a l'usuari.

1.  **Detecció de Conflictes (`useEventDataStore.ts`):**
    -   Les accions `addAssignment` i `updateAssignment` de l'store contenen la lògica per detectar si una persona ja té una altra assignació en el mateix període.
    -   Aquestes funcions accepten un paràmetre opcional `force: boolean`. La comprovació de conflictes només s'executa si `force` és `false`.

2.  **Senyalització del Conflicte (Workaround):**
    -   Si es detecta un conflicte, la funció retorna un `warningMessage` que conté un prefix especial: `DUPLICATE_CONFLICT:`.
    -   Aquest mètode de prefixar el missatge es va adoptar com a solució alternativa robusta davant d'errors del compilador de TypeScript que impedien la correcta resolució de tipus més complexos.

3.  **Gestió a la UI (`AssignmentFormModal.tsx` i `MainDisplay.tsx`):**
    -   Els components que inicien una modificació d'assignació (`AssignmentFormModal` per a la creació/edició i `MainDisplay` per als canvis d'estat ràpids) criden a les accions de l'store amb `force: false` inicialment.
    -   En rebre una resposta amb el prefix `DUPLICATE_CONFLICT:`, comproven el missatge i invoquen `openModal` per mostrar el diàleg `ConfirmDuplicateModal`, garantint un comportament consistent a tota l'aplicació.

4.  **Confirmació de l'Usuari (`ConfirmDuplicateModal.tsx`):**
    -   Aquest modal mostra el missatge de conflicte (sense el prefix) i pregunta a l'usuari si vol procedir.
    -   En confirmar, s'executa una funció de `callback` que torna a cridar `handleSubmit` al formulari, aquest cop amb el paràmetre `force: true`.

5.  **Execució Forçada:**
    -   La segona crida a `addAssignment` o `updateAssignment`, ara amb `force: true`, omet la comprovació de conflictes i desa l'assignació duplicada.


---

### 5.5. Sistema d'Importació/Exportació (JSON, PDF, CSV)

L'aplicació ofereix múltiples opcions per externalitzar i internalitzar dades, proporcionant flexibilitat i capacitat de backup manual.

#### Importació/Exportació General (JSON)

-   **Backend (`main.cjs`):** Utilitza `dialog.showSaveDialog` i `fs.writeFileSync` per a la funcionalitat de desat. Aquesta interacció nativa permet a l'usuari triar la ubicació de l'arxiu de manera familiar.
-   **Frontend (`Controls.tsx`):** Orquestra el procés.
    -   **Guardar:** Crida a `exportData()` de `useEventDataStore` per obtenir l'estat actual i l'envia al backend.
    -   **Carregar:** Utilitza un `<input type="file">` ocult que, en seleccionar un fitxer, el llegeix amb `FileReader` i envia el contingut a la funció `loadData()` de l'store.

#### Càrrega Flexible: Fusió vs. Reemplaçament

-   **Flux d'Execució:**
    1.  Quan l'usuari selecciona un fitxer de persones o material, `Controls.tsx` llegeix el JSON.
    2.  En lloc de processar les dades directament, crida a `openModal('mergeOrReplace', { ... })`, passant les dades noves (`newData`) al modal.
    3.  El modal `MergeOrReplaceModal.tsx` presenta a l'usuari les opcions.
    4.  Depenent del botó que es premi, s'executa una de les funcions del context: `mergePeopleGroups`, `replacePeopleGroups`, `addMaterialItemsFromFile` (per a fusió de material) o `replaceMaterialItems`.
-   **Lògica de Fusió (`useEventDataStore.ts`):** La fusió es realitza dins de les accions `mergePeopleGroups` i `addMaterialItemsFromFile` de l'store, comparant els noms per evitar duplicats.

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

### 6.1. Sistema de Tooltips (Basat en Portals)

Per millorar la fiabilitat i resoldre problemes de visibilitat (`z-index` i `clipping`), el sistema de tooltips ha estat refactoritzat per utilitzar `ReactDOM.createPortal`. Aquesta tècnica "teletransporta" el tooltip al final del `document.body`, traient-lo del flux normal del DOM i evitant que quedi atrapat dins de contenidors pares amb contextos de solapament propis.

#### Ús del Component `Tooltip`

L'ús del component no ha canviat. Per afegir un tooltip, simplement cal embolcallar qualsevol element amb el component `Tooltip` i passar-li el text a mostrar a través de la propietat `text`.

**Exemple d'ús:**

```tsx
import Tooltip from './ui/Tooltip';

// ...

<Tooltip text="Aquest és el text que es mostrarà al tooltip">
  <button onClick={laMevaFuncio}>
    La Meva Acció
  </button>
</Tooltip>
```

#### Funcionament Intern

-   **Component `Tooltip` (`src/components/ui/Tooltip.tsx`):**
    -   Clona l'element fill (`children`) per afegir-hi `event listeners` (`onMouseEnter`, `onMouseLeave`).
    -   Utilitza `useState` per controlar la visibilitat del tooltip.
    -   Utilitza `setTimeout` i `clearTimeout` per gestionar un retard de 0.5 segons abans de mostrar el tooltip.
    -   Calcula la posició de l'element fill amb `getBoundingClientRect()` per posicionar el tooltip de manera absoluta a la pantalla.
    -   Renderitza un `<div>` amb el contingut del tooltip mitjançant `ReactDOM.createPortal`, que l'injecta al final del `<body>`.
-   **Estils (`src/index.css`):**
    -   La classe `.tooltip-portal` defineix l'estil del tooltip (fons, color, mida de font, etc.).
    -   Utilitza `position: absolute` i `transform` per posicionar-se correctament respecte a l'element que l'activa.
    -   Té un `z-index` molt alt per assegurar que sempre es mostri per sobre de tots els altres elements.

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
-   **Consistència de la Interfície d'Usuari**: S'ha fet un esforç per estandarditzar el comportament dels components interactius. Per exemple, totes les seccions col·lapsables ara permeten expandir/col·lapsar fent clic a qualsevol lloc de la capçalera, no només a la icona.
-   **Programació Defensiva: El codi inclou comprovacions per a window.electronAPI abans de la seva execució, permetent que la base de codi del frontend sigui més resilient i pugui, teòricament, funcionar en un entorn de navegador sense trencar-se.
-   **Superfície d'Atac Mínima: L'API exposada a través de preload.cjs es manté al mínim necessari, eliminant qualsevol funció o listener IPC que no estigui en ús per reduir possibles vectors d'atac.

### 5.9. Càrrega de Dades Resilient (Migració -> Validació -> Reparació)

Per garantir la màxima robustesa i evitar pèrdues de dades o bloquejos de l'aplicació a causa de fitxers de dades corruptes o amb formats antics, s'ha implementat un pipeline de càrrega de dades de diversos passos. Aquest sistema prioritza una experiència d'usuari ràpida per a dades vàlides (el "camí feliç") mentre proporciona una xarxa de seguretat per a dades que requereixen correccions.

#### El Pipeline de Processament de Dades

La lògica central resideix a l'acció `loadData` de l'store `useEventDataStore` i segueix aquesta seqüència:

1.  **Migració (Sempre):**
    -   **Objectiu:** Assegurar que les dades, independentment de la seva versió original, tinguin sempre l'estructura de dades més recent definida a `types.ts`.
    -   **Implementació:** La funció itera sobre cada `eventFrame` i passa el seu `techSheet` a la funció `migrateTechSheetData` (`src/utils/techSheetMigration.ts`). Aquesta funció comprova si la fitxa ja té el format nou; si no, la transforma, afegint els camps nous amb valors per defecte i reestructurant els antics.
    -   **Tolerància a Errors:** La migració està dins d'un bloc `try...catch`. Si falla per qualsevol motiu (p. ex., un format de dades completament inesperat), es registra l'error i es genera una fitxa tècnica per defecte, evitant que l'aplicació es bloquegi.

2.  **Validació (Sempre):**
    -   **Objectiu:** Comprovar la integritat referencial de les dades ja migrades.
    -   **Implementació:** Les dades migradas es passen a la funció `validateData` (`src/utils/dataIntegrity.ts`). Aquesta funció comprova, per exemple, que cada `assignment` apunti a un `eventFrameId` i a un `personGroupId` que realment existeixin a les llistes corresponents.
    -   **Resultat:** Retorna un objecte `{ isValid: boolean, errors: ValidationError[] }`.

3.  **Decisió i Rutes Condicionals:**
    -   **Cas A: Dades Vàlides (isValid: true)**
        -   **Acció:** S'executa la funció `_applyDataToState`, que carrega les dades directament a l'estat de React.
        -   **Feedback:** Es mostra un missatge d'èxit simple i ràpid a l'usuari. El procés acaba aquí.
    -   **Cas B: Dades Invàlides (isValid: false)**
        -   **Reparació:** Les dades i l'informe d'errors es passen a la funció `repairData` (`src/utils/dataIntegrity.ts`). Aquesta funció elimina els elements trencats (p. ex., les assignacions invàlides) i retorna les dades netes i un array de missatges explicant les correccions (`fixes`).
        -   **Confirmació de l'Usuari:** S'obre el modal `ConfirmRepairModal.tsx`, mostrant la llista de `fixes` a l'usuari.
        -   **Decisió Final:** L'usuari pot triar entre carregar la versió reparada o cancel·lar l'operació. Les dades només es carreguen si l'usuari dona el seu consentiment explícit.

Aquest sistema garanteix que l'aplicació sigui extremadament resilient a errors de dades, alhora que manté una experiència fluida per a la majoria d'usuaris les dades dels quals són correctes.

### 9. Solució de Bug de Renderitzat del Calendari

S'ha solucionat un bug visual a la llibreria FullCalendar on alguns elements (com els números dels dies) desapareixien quan altres components de la UI (com les notificacions toast) apareixien. Això es deu a un problema de *repaint/reflow* del navegador que FullCalendar no gestiona automàticament.

La solució implementada força el calendari a recalcular les seves dimensions i redibuixar-se cada vegada que l'estat d'una notificació canvia.

-   **`src/components/MainDisplay.tsx`**: Utilitza `forwardRef` i `useImperativeHandle` per exposar una funció `handleResize` que internament crida a `calendarApi.updateSize()`.
-   **`src/App.tsx`**: Crea una referència (`useRef`) al component `MainDisplay` i utilitza un `useEffect` que, en detectar un canvi a `toastState`, crida a la funció `handleResize` del component fill.

---

## 10. Restauració de Funcionalitats Post-Refactorització (Zustand)

Després de la migració a Zustand, algunes interaccions de la UI es van haver de reconnectar. Aquesta secció documenta les solucions.

### 10.1. Gestió d'Expansió de Targetes (Manual i Automàtica)

S'ha restaurat la capacitat de l'usuari per expandir i col·lapsar manualment les targetes d'esdeveniments.

-   **Gestió d'Esdeveniments de Clic (`EventFrameCard.tsx`):** La capçalera de la targeta gestiona els clics per evitar conflictes. Utilitza `e.stopPropagation()` en els botons interns per assegurar que només el clic a la capçalera activi l'expansió, cridant a la funció `onToggleExpand`.
-   **Estat a l'Store (`eventDataStore.ts`):**
    -   `manualExpandedFrameIds: Set<string>`: Emmagatzema els IDs de les targetes que l'usuari ha expandit manualment.
    -   `setManualExpandedFrameIds()`: L'acció per modificar aquest conjunt.
-   **Lògica al Component (`MainDisplay.tsx`):**
    -   La funció `handleToggleExpand` crida a l'acció de l'store.
    -   Un `useMemo` decideix quines targetes estan expandides: si hi ha filtres actius, s'expandeixen tots els resultats; si no, s'utilitza el conjunt manual.

### 10.2. Funcionalitat "Mostrar a la Llista" i Ressaltat (Correcció de Condició de Cursa)

S'ha restaurat l'acció "Mostrar a la Llista" i s'ha corregit una condició de cursa que impedia que funcionés de manera fiable.

-   **Acció Centralitzada (`eventDataStore.ts`):** L'acció `showAndHighlightEvent(eventId: string)` estableix l'estat per expandir la llista i ressaltar un element.
-   **Activació (`EventFrameDetailsModal.tsx`):** El botó corresponent crida a l'acció anterior.
-   **Efecte Visual Corregit (`MainDisplay.tsx`):**
    -   S'ha corregit una **condició de cursa** (race condition). El `useEffect` que gestiona el ressaltat ara depèn de `highlightedEventId` i també de `filteredAndSortedEventFrames`.
    -   **Explicació:** Això garanteix que l'efecte només s'executi després que React hagi renderitzat la llista d'esdeveniments (si estava col·lapsada). D'aquesta manera, quan `document.getElementById` busca la targeta, aquesta ja existeix al DOM.
    -   L'efecte fa `scrollIntoView()`, afegeix una classe CSS per a l'animació, i la neteja després de 3 segons.

### 10.3. Exportació de Vistes Filtrades (PDF/CSV)

S'ha restaurat la capacitat d'exportar a PDF o CSV només els esdeveniments que coincideixen amb els filtres actius a la vista principal.

-   **Lògica:** La funcionalitat d'exportació, ubicada a `Controls.tsx`, utilitza un selector (`selectFilteredEventFrames`) per accedir a la llista filtrada directament des de l'store `useEventDataStore`.
-   **Implementació:** Quan l'usuari clica a "Exportar a PDF/CSV", `Controls.tsx` obté l'estat complet de l'store, el passa al selector per obtenir la llista filtrada, i finalment envia aquesta llista a les utilitats `pdfGenerator` o `csvUtils`. Si no hi ha cap filtre actiu, s'exporta la llista completa per defecte.

### 10.4. Avís de Conflictes en Assignacions

S'ha reimplementat i estandarditzat el diàleg modal que adverteix l'usuari quan intenta crear o modificar una assignació que se solapa en el temps amb una altra assignació existent per a la mateixa persona.

-   **Arquitectura:** La detecció de conflictes es realitza a l'store (`useEventDataStore`). Si se'n troba un, es comunica a la UI a través d'un missatge de retorn amb un prefix especial.
-   **Gestió a la UI:**
    -   **`AssignmentFormModal.tsx`**: Gestiona els conflictes en crear o editar una assignació completa.
    -   **`MainDisplay.tsx`**: S'ha corregit un error pel qual l'avís no apareixia en modificar l'estat d'una assignació directament des de la vista principal. Ara, els seus gestors també comproven el missatge de conflicte.
    -   **Consistència:** Ambdós components utilitzen el mateix modal de confirmació (`ConfirmDuplicateModal`) per oferir una experiència d'usuari unificada.

### 10.5. Barra de Progrés Detallada per a la Sincronització

S'ha reintroduït la barra de progrés en temps real durant la sincronització amb Google Calendar.

-   **Comunicació Backend -> Frontend:** El procés principal (`main.cjs`) envia actualitzacions de progrés a través del canal IPC `'sync-progress'`.
-   **Gestió d'Estat amb Zustand:** Un `useEffect` a `App.tsx` escolta aquests esdeveniments i actualitza un estat `syncProgress` dins de `useEventDataStore`, que és consumit pel component `SyncProgressOverlay.tsx`.