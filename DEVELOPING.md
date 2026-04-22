branca de desenvolupament ACTIVA 2026  00DEV_GEP

web de la app a Vercel a la branca main O 0DEV_GEP:
https://gestor-events-i-personal-landingpag.vercel.app/


## DEVELOPING.md V1.6.4


# Guia de Desenvolupament: Gestor d'Esdeveniments i Personal

Aquest document proporciona una anàlisi tècnica detallada de l'arquitectura, les funcionalitats clau i les convencions de codi del projecte. Està dissenyat per a desenvolupadors que vulguin entendre el funcionament intern de l'aplicació, contribuir-hi o fer-ne el manteniment.

# NOVETATS V1.6.4 (ABRIL 2026)

**Resum de canvis tècnics recents:**
- **PDF Color Patches:** Implementació de visualització de colors a la Input List dels PDFs d'actuacions. Els colors (red, blue, green, yellow, orange, purple, brown) es mostren com a cercles omplerts a la primera columna de la taula, amb el text desplaçat per evitar solapaments.
- **Sistema de Persistència de Dades Robust:** Implementació completa d'auto-save a tots els formularis (Tech Sheets, Performances) amb protecció contra pèrdua de dades en canvi de pestanya, finestra o focus.
- **Correccions Crítiques de Bugs:** Solucionat fals "guardat" que permetia tancar l'aplicació amb dades perdudes, i condicions de cursa a la Input List que sobreescribien canals en clics ràpids.
- **Optimitzacions de Re-renderitzat:** Extret NeedsSection fora de TechSheetForm per evitar unmount/remount massiu, i afegit funcionalitat de col·lapsar seccions tècniques.

**Característiques Noves Detallades:**

### 🎨 PDF Color Visualization
- **Implementació:** `generatePerformancePdfObjectWithOptions` ara genera cercles de color RGB per cada item de la Input List
- **Mapa de Colors:** Implementat `patchColorMap` amb valors RGB per a colors semàntics (red: [239, 68, 68], blue: [59, 130, 246], etc.)
- **Renderitzat:** Utilitzat `didDrawCell` hook de jspdf-autotable per dibuixar cercles i `cellPadding` per desplaçar text
- **Compatibilitat:** Funciona amb tots els PDFs d'actuacions (Basic, Tech, Hospitality)

### 🛡️ Sistema de Persistència de Dades Universal
- **useBufferedSave Hook Millorat:** Ara inclou protecció contra race conditions i events de finestra
- **Auto-save Multi-nivell:** 
  - Window events: `visibilitychange` (auto-save quan la pàgina s'amaga)
  - Window events: `beforeunload` (alerta abans de tancar amb canvis pendents)
  - Tab switching: `triggerAllSaves()` abans de canviar de pestanya
- **Protecció Universal:** Tots els formularis utilitzen el mateix hook robust
- **Zero Pèrdua de Dades:** Cap via de sortida sense protecció

### 🐛 Correccions Crítiques Aplicades
- **BUG 1 - Fals "Guardat":** Eliminada línia `setHasUnsavedChanges(false)` a `saveNow()` per evitar que l'aplicació es pensi que tot està guardat quan només ho està a RAM
- **BUG 2 - Race Conditions Input List:** Afegit `localDataRef` a PerformanceTechForm i actualitzades totes les funcions (`handleInputChange`, `addInputItem`, `removeInputItem`) per utilitzar refs síncrons en lloc d'estat reactiu

### 🚀 Optimitzacions de Rendiment
- **ConditionalFormControl Col·lapsable:** Afegides props `isCollapsible` i `defaultExpanded` amb botó de toggle (ChevronDown/ChevronUp)
- **NeedsSection Extret:** Mogut fora de TechSheetForm per evitar re-creació en cada render
- **Components Memoitzats:** `React.memo` efectiu en components extrets
- **Focus Mantingut:** El cursor no es perd en escriure a formularis

# NOVETATS V1.6.2 (FEBRER 2026)

**Resum de canvis tècnics recents:**
- Refactorització completa de la gestió d'estat amb Zustand i zundo: stores independents, historial desfer/refer, partialize memoitzada per evitar bucles infinits.
- Nova lògica de backups automàtics i tancament intel·ligent: backups per document, neteja automàtica, eliminació de backups de sessió.
- Menú d'aplicació personalitzat en React: substitució del menú natiu d'Electron, comunicació frontend-backend via IPC.
- Gestió d'IPC centralitzada: canals segurs, separació de responsabilitats, API interna documentada.
- Solució als bucles infinits de renderitzat: selectors Zustand independents, gestió asíncrona de flags d'actualització.
- **Optimitzacions de rendiment:** s'han eliminat els logs IPC enviats des de components durant el renderitzat, i s'ha memoitzat la majoria de components de la llista principal, reduint el consum de memòria i millorant la fluïdesa.
- **NOU MÒDUL D'ACTUACIONS (FASE 4):** Sistema complet per a la gestió d'actuacions artístiques amb control d'avançament, formularis tècnics/hospitalitat, i exportació PDF.
- **Full de Ruta del Regidor:** PDF combinat que fusiona horaris generals de la fitxa de bolo amb horaris d'actuacions i notes crítiques de regidoria.
- **Control d'Avançament Visual:** Checklist interactiu amb 4 estats (Rider Rebut, Contra-rider Enviat, Horaris Confirmats, Hospitality Tancat).
- **Integració de Dades:** Les actuacions es connecten amb la fitxa de bolo existent per evitar duplicació d'informació.
- **!! NOVES OPTIMITZACIONS DE RENDIMENT DE REACT (V1.6.2+):**
  - **React.memo implementat** a components clau (TechSheetField, TechSheetSection, ConditionalFormControl, TechnicalPersonnelSection, NeedItem)
  - **useCallback per handlers estables** - evita recreació de funcions a cada render
  - **Eliminació de lambdes inline** - substituïdes per handlers estables amb referències memoritzades
  - **Component NeedItem extraít** - component memoitzat individual per a ítems de necessitats, evitant re-renders en cascada
  - **Props optimitzades a TechnicalPersonnelSection** - eliminada prop `formData` que canviava a cada render
  - **useBufferedSave millorat** - ara exporta `localDataRef` per accés estable sense dependències reactives
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
- **Disseny fluid (Full-Width):** S'ha eliminat el contenidor principal centrat en favor d'un disseny d'amplada completa amb `padding` horitzontal (`px-4 sm:px-6 lg:px-8`). Això optimitza l'ús de l'espai de la pantalla, especialment en monitors grans. La classe `.container` personalitzada ha estat eliminada de `index.css`.

- **Sistema d'Internacionalització Complet (i18n):**
  - **3 Idiomes Suportats:** Implementació completa de internacionalització per a Català, Castellà i English a totes les plataformes.
  - **Aplicació d'Escriptori:** Selector `LanguageSelector.tsx` amb react-i18next, persistència localStorage i detecció automàtica d'idioma.
  - **Aplicació Mòbil:** Selector visual amb banderes i AsyncStorage per a persistència, integrat amb react-i18next.
  - **Aplicació Web:** Sistema de rutes multillingüe (/ca/, /es/, /en/) amb selector `LanguageSelector.astro` i navegació transparent.
  - **Fitxers de Traducció:** Estructura organitzada de fitxers JSON per a cada plataforma amb totes les cadenes traduïdes.

**Shortcuts de teclat segons plataforma:** La UI ara mostra els shortcuts adequats segons la plataforma (Windows/Linux vs macOS). La detecció de la plataforma s'ha centralitzat a `App.tsx` per a una major fiabilitat, passant la tecla modificadora ("Ctrl" o "⌘") com a `prop` als components fills com el menú personalitzat.

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
    -   **Electron `38.1.1`**: Permet construir aplicacions d'escriptori multiplataforma utilitzant tecnologies web.
    -   **Electron Builder `^24.13.3`**: Eina per empaquetar i distribuir l'aplicació per a Windows, macOS i Linux.

-   **Frontend:**
    -   **React `^18.3.1`**: Llibreria per construir la interfície d'usuari.
    -   **Vite `^6.4.1`**: Eina de desenvolupament i empaquetat per al frontend, oferint una experiència de desenvolupament ràpida.
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
        -   Coordinar amb el menú personalitzat en React (el menú visible és el de `CustomMenuBar`; les accions es deleguen via IPC; no s'utilitza el menú natiu d'Electron).
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
- **Configuració de GPU:** L'acceleració per hardware és configurable a través del fitxer `session.json` (`gpuEnabled`). Per defecte està desactivada per garantir l'estabilitat en equips més antics. Aquesta configuració s'aplica durant l'arrencada del procés principal abans de crear la finestra.

3.  **Capa 3: Frontend (Interfície d'Usuari en React - `src/`)**
    -   **Descripció:** És una Single Page Application (SPA) que s'executa dins d'una finestra de Chromium. És responsable de tot el que l'usuari veu i amb què interactua.
    -   **Responsabilitats:**
        -   Renderitzar la interfície d'usuari.
        -   Gestionar l'estat de la UI (dades d'esdeveniments, formularis, modals, etc.).
        -   Implementar tota la lògica de negoci del client (filtratge de dades, validacions de formularis, detecció de conflictes).
        -   Invocar les funcions exposades pel backend a través de `window.electronAPI` per a qualsevol operació que requereixi accés al sistema (desar un fitxer, sincronitzar amb Google, etc.).

### Diagrama de Flux de Dades: Exemple d'una Acció de "Guardar"

Per il·lustrar com col·laboren aquestes capes, analitzem el flux quan un usuari desa les dades:

1.  **[Frontend]** L'usuari selecciona "Arxiu > Guardar" al menú superior personalitzat (`CustomMenuBar.tsx`).
2.  **[Frontend]** Es dispara l'acció `handleSave` a `App.tsx`, que gestiona la lògica de desat.
3.  **[Frontend - Zustand]** L'store recull totes les dades de l'estat actual (`eventFrames`, `peopleGroups`, etc.) i les retorna com un objecte `AppData`.
4.  **[Frontend]** La funció crida a `window.electronAPI.showSaveDialog()` amb les dades serialitzades en format JSON.
5.  **[Pont]** `preload.cjs` rep la crida i, de forma segura, envia una petició IPC (`ipcRenderer.invoke`) al backend a través del canal `'show-save-dialog'`.
6.  **[Backend]** El gestor `ipcMain.handle('show-save-dialog', ...)` a `main.cjs` rep la petició.
7.  **[Backend]** Utilitzant el mòdul `dialog` d'Electron, obre una finestra de diàleg nativa del sistema operatiu perquè l'usuari triï on desar el fitxer.
8.  **[Backend]** Un cop l'usuari confirma, utilitza el mòdul `fs` de Node.js per escriure les dades rebudes al disc.
9.  **[Backend -> Pont -> Frontend]** El resultat de l'operació (èxit o error) es retorna a través de la `Promise` de `ipcRenderer.invoke`.
10. **[Frontend]** Es mostra una notificació (toast) a l'usuari amb el resultat de l'operació.

El component `Controls.tsx` ara s'encarrega principalment de la sincronització amb Google i mostra la ruta del fitxer actual, mentre que la funcionalitat de desat s'ha mogut al menú superior per a una millor organització i per seguir els estàndards d'ús de l'aplicació d'escriptori.

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
    -   Ruta de l'últim fitxer obert.
    -   Últim directori utilitzat en els diàlegs d'obertura/desat.
    -   Dades de sessió opcionals (p. ex. `lastViewedPerformanceEventId`) exposades via `getSessionData`/`saveSessionData` (IPC) per a la vista d'actuacions.
-   `BACKUP_DIR`: (`.../backups/`) Directori on es guarden les còpies de seguretat automàtiques.
-   Els logs es gestionen automàticament per la llibreria `electron-log`, que engega un fitxer `main.log` al directori de dades de l'aplicació. Es conserven fins a 5 arxius de log rotatius, amb una mida màxima de 1 MB per arxiu.
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

#### Logs de Sessió amb `electron-log`

Per facilitar la depuració i mantenir uns registres nets en producció, l'aplicació utilitza la llibreria estàndard `electron-log`.

-   **Nivells de Log:** S'ha implementat un sistema de nivells de log semàntics:
    -   `debug`: Informació detallada només rellevant per al desenvolupament (p. ex., "[IPC_IN] Rebut 'accio'"). Aquest nivell està desactivat per defecte en producció.
    -   `info`: Esdeveniments importants del flux normal (p. ex., "Fitxer desat correctament").
    -   `warn`: Situacions inesperades que no aturen l'aplicació (p. ex., "El fitxer service-account.json no es troba").
    -   `error`: Errors crítics que han provocat una fallada.
-   **Configuració per Entorn:**
    -   **Actualment (Beta):** El nivell de log és `debug` de manera forçada per a totes les builds (desenvolupament i producció), per facilitar la detecció d'errors durant la fase beta. La línia de codi que diferenciava entorns està comentada a `main.cjs`:
        ```javascript
        // log.level = process.env.NODE_ENV === 'development' ? 'debug' : 'info';
        log.level = 'debug'; // Forçat durant la beta
        ```
    -   **Objectiu futur (post-beta):** Reactivar la distinció per entorn: `debug` en desenvolupament, `info`/`warn`/`error` en producció.
-   **Integració Transparent:** `electron-log` sobreescriu automàticament els mètodes de `console` (`log`, `error`, etc.). Això permet que les crides de log des del frontend siguin capturades pel backend i escrites al fitxer de log sense necessitat de cap canal IPC personalitzat.
-   **Accés per a l'Usuari:** S'ha afegit una opció de menú ("Ajuda -> Obrir Carpeta de Logs") que obre directament el directori on es desen els fitxers de log, facilitant a l'usuari final l'enviament de registres per a la depuració.
-   **Rotació per Mida:** En lloc de crear un fitxer nou a cada sessió, ara s'utilitza un fitxer principal (`main.log`). Quan aquest fitxer arriba a 1MB, es reanomena amb un timestamp (p. ex., `main.163...log`) i se'n crea un de nou.
-   **Retenció Automàtica:** El sistema conserva un màxim de 6 fitxers de log (1 actiu i 5 arxivats), eliminant automàticament els més antics per optimitzar l'ús de disc.

#### Còpies de Seguretat Contextuals i Dinàmiques (Backups)

El sistema de còpies de seguretat s'ha fet més intel·ligent i flexible per evitar backups innecessaris i adaptar-se a la nova extensió de fitxer `.gep`.

-   **Activació Contextual:** Les còpies de seguretat només es creen quan es desa un **document de dades principal** (ja sigui `.gep` o `.json`), i **no** quan s'exporten altres tipus de fitxers (PDF, CSV).
-   **Implementació Tècnica:**
    -   El gestor IPC `show-save-dialog` a `main.cjs` accepta un paràmetre booleà opcional: `isDocumentSave`.
    -   La lògica de `createBackup()` només s'executa si `isDocumentSave` és `true`.
    -   Totes les crides des del frontend (`App.tsx`, `pdfGenerator.ts`, etc.) han estat actualitzades per passar aquest flag correctament.
-   **Gestió d'Extensions Dinàmica:** Les funcions `createBackup` i `cleanupOldBackups` ja no depenen d'una extensió fixa. Utilitzen el mòdul `path` de Node.js per extreure l'extensió del fitxer original i generen/gestionen els backups amb la mateixa extensió. Això garanteix que un fitxer `.gep` tingui backups `.gep` i un `.json` tingui backups `.json`.
-   **Nomenclatura i Neteja:** La nomenclatura (amb el nom del document original) i la neteja automàtica (conservant els 3 backups més recents per document) es mantenen.

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
2.  Carregar les credencials de Google si estan disponibles (`loadGoogleCredentials` i `loadServiceAccountCredentials`).
3.  Llegir `session.json` per restaurar la mida i posició anteriors de la finestra.
4.  Crear la `BrowserWindow` amb les opcions de seguretat adequades, incloent:
    -   La càrrega del script `preload.cjs`
    -   `autoHideMenuBar: true` per amagar la barra de menú nativa
    -   Configuració de seguretat com `contextIsolation: true` i `sandbox: true`
5.  Carregar la URL del servidor de desenvolupament de Vite o el fitxer `index.html` de producció.
6.  Configurar els manejadors d'esdeveniments per a la finestra, incloent el tancament i la càrrega de fitxers arrossegats.

La gestió del menú s'ha traslladat completament al frontend, concretament al component `CustomMenuBar.tsx`, per millorar la consistència de la interfíció d'usuari i simplificar la gestió d'estat.

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

Aquest enfocament no només soluciona el bug original, sinó que també proporciona un control total sobre l'aparença i el comportament del menú, permetent una integració més profunda amb el disseny de l'aplicació. El menú "Edita" s'ha afegit seguint aquest mateix patró. Les dreceres de teclat per a accions comunes com "Eines de Desenvolupament" i "Pantalla Completa" s'han actualitzat per mostrar els estàndards de cada plataforma (`⌘+⌥+I` i `⌃+⌘+F` a macOS respectivament).

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
    -   `google-get-event-details`: Obté tots els detalls d'un esdeveniment específic de Google Calendar a partir del seu `calendarId` i `eventId`.
    -   `sync-with-google(payload)`: Orquestra la sincronització unidireccional cap a un calendari específic.
    -   `create-new-app-calendar(suffix)`: Crea un nou calendari gestionat per l'app.
    -   `delete-app-calendar(calendarId)`: Elimina un calendari gestionat específic.
    -   `google-disconnect`: Desconnecta el compte de Google i elimina tots els calendaris gestionats.

-   **Accions de l'Aplicació:**
    -   `get-app-metadata`: Retorna metadades de l'aplicació (nom, versió, descripció) llegides de `package.json` i `metadata.json`.
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
    -   **Descripció:** Gestiona quin modal està obert (`type`), les dades inicials amb què es va obrir (`data`) i si és visible (`isOpen`).
    -   **Contingut:**
        -   **`type`**: Indica el tipus de modal que s'ha d'obrir.
        -   **`data`**: Dades addicionals que es poden passar al modal.
        -   **`isOpen`**: Controla si el modal està obert o tancat.
    -   **Nota:** La gestió de notificacions s'ha centralitzat al servei `notificationService.ts`, que utilitza directament `react-hot-toast` i s'importa directament allà on es necessiti.

    #### Optimització de Rendiment: Selectors (`src/utils/selectors.ts`)
    Per evitar re-renderitzats innecessaris i bucles infinits, la lògica complexa de filtratge s'ha extret dels components i dels stores principals:
         - **`selectFilteredEventFrames`**: Aquesta funció pura rep l'estat complet i retorna la llista filtrada. S'utilitza dins dels components amb `useMemo` o directament en accions d'exportació, garantint que els càlculs pesats només es facin quan canvien les dependències rellevants.

 #### Middleware de Depuració (`loggingMiddleware.ts`)
 
 El projecte inclou un middleware de Zustand personalitzat a `src/stores/loggingMiddleware.ts` dissenyat per a la depuració.


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

---

### 4.2. Sistema de Persistència de Dades Universal (V1.6.3)

El sistema de persistència de dades ha estat completament refactoritzat per garantir **zero pèrdua de dades** en qualsevol circumstància. Tots els formularis (Tech Sheets, Performances) utilitzen ara el mateix hook robust `useBufferedSave`.

#### useBufferedSave Hook Millorat

El hook `src/hooks/useBufferedSave.ts` és el cor del sistema de persistència:

```typescript
const {
  localData,           // Dades locals del formulari
  localDataRef,        // Ref síncrona per evitar races
  updateLocal,         // Actualització parcial
  updateFullObject,    // Actualització completa
  saveNow,            // Desat manual
  isDirty             // Estat de modificació
} = useBufferedSave(initialData, (data, isManual) => {
  // Callback de desat a l'estat global
});
```

#### Proteccions Multi-nivell

**1. Window Events:**
```typescript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden' && isDirtyRef.current) {
      saveToGlobalRef.current(localDataRef.current, false);
    }
  };

  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (isDirtyRef.current) {
      e.preventDefault();
      e.returnValue = 'Tens canvis sense desar. Vols continuar?';
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('beforeunload', handleBeforeUnload);
}, []);
```

**2. Tab Switching:**
```typescript
// PerformanceDetailContainer.tsx
const handleTabChange = (newTab: ActiveTab) => {
  triggerAllSaves(); // Força guardar abans de canviar
  setActiveTab(newTab);
};
```

**3. Race Condition Protection:**
```typescript
// Evita sobreescriure canvis locals
useEffect(() => {
  if (isDirtyRef.current) {
    console.log('[SYNC] Ignorant sincronització - hi ha canvis pendents');
    return;
  }
  // Sincronització segura
}, [initialData]);
```

#### Correccions Crítiques Aplicades

**BUG 1 - Fals "Guardat":**
- **Problema:** `saveNow()` marcava `hasUnsavedChanges = false` falsament
- **Solució:** Eliminada la línia que modificava l'estat global
- **Resultat:** L'aplicació només es considera "guardada" quan es desa al disc

**BUG 2 - Race Conditions Input List:**
- **Problema:** Les funcions utilitzaven estat reactiu obsolet
- **Solució:** Afegit `localDataRef` i actualitzades totes les funcions
- **Resultat:** Operacions atòmiques sense pèrdua de dades

---

### 4.3. Optimitzacions de Re-renderitzat (V1.6.3)

#### ConditionalFormControl Col·lapsable

El component `src/components/tech_sheets/ConditionalFormControl.tsx` ara suporta col·lapse:

```typescript
interface ConditionalFormControlProps {
  // ... props existents
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
}

// Botó de toggle
{status === 'yes' && isCollapsible && (
  <button onClick={() => setIsExpanded(!isExpanded)}>
    {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
  </button>
)}
```

#### NeedsSection Extret

El component `NeedsSection` s'ha mogut fora de `TechSheetForm` per evitar re-creació:

```typescript
// FORA de TechSheetForm - estable i memoitzat
const NeedsSection = React.memo<NeedsSectionProps>(({
  fieldName, title, status, details, needs, onConditionalChange, 
  // ... altres props
}) => {
  return (
    <ConditionalFormControl
      label={`${title}:`}
      status={status}
      onStatusChange={handleStatusChange}
      isCollapsible={true} // <-- Activat col·lapse
    >
      {/* children */}
    </ConditionalFormControl>
  );
});
```

#### Avantatges de l'Arquitectura

1. **Zero Re-renderitzats Massius:** Components estables fora del component principal
2. **Focus Mantingut:** El cursor no es perd en escriure
3. **UX Millorada:** Seccions col·lapsables per millorar focus
4. **Components Memoitzats:** `React.memo` efectiu
5. **Rendiment òptim:** Menys renderitzats innecessaris

---

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
-   **`Controls.tsx`**: Aquest component s'encarrega exclusivament de la integració amb Google Calendar i mostra la ruta del fitxer actual. Inclou els següents elements:
    -   Visualització de la ruta del fitxer actual
    -   Botó per a la sincronització manual amb Google Calendar
    -   Accés a la configuració de la connexió amb Google
    -   Botó per iniciar el flux d'autenticació amb Google
    -   Tots els botons inclouen tooltips descriptius i retroalimentació visual durant les operacions

### 4.4. Component Reutilitzable: `AutosizeTextarea`

Per donar resposta a la necessitat que les àrees de text s'ajustin al seu contingut, s'ha creat un nou component a `src/components/ui/AutosizeTextarea.tsx`.

-   **Funcionament:** El component embolcalla un `<textarea>` estàndard. Utilitza el hook `useLayoutEffect` per recalcular i ajustar l'alçada de l'element cada vegada que el seu valor canvia. `useLayoutEffect` es fa servir en lloc de `useEffect` per evitar un parpelleig visual, ja que el càlcul es realitza de manera síncrona després de les mutacions del DOM.
-   **Gestió de `ref` (Ref Forwarding):** Per solucionar l'advertència de React "Function components cannot be given refs", el component està embolicat amb `React.forwardRef`. Això li permet rebre una `ref` d'un component pare (com el component `Tooltip`, que la necessita per posicionar-se) i passar-la directament a l'element `<textarea>` intern. La lògica de `useLayoutEffect` també ha estat actualitzada per utilitzar aquesta `ref` reenviada.
-   **Integració:** Per aplicar aquest canvi de manera eficient, el component genèric `TechSheetField.tsx` ha estat modificat per renderitzar `AutosizeTextarea` quan se li passa la propietat `as="textarea"`. La resta de formularis de l'aplicació també han estat actualitzats per utilitzar aquest nou component.

### 4.5. Model de Dades i Tipus (`src/types.ts`)

Aquest fitxer és fonamental per a la robustesa del projecte. Defineix totes les estructures de dades clau mitjançant interfícies de TypeScript.

-   **`EventFrame`**: Representa un esdeveniment marc. Conté propietats com `id`, `name`, `startDate`, `endDate`, i, de manera crucial, un array niat `assignments: Assignment[]` i un objecte opcional `techSheet: TechSheetData`.
-   **`Assignment`**: Defineix una assignació de personal. Enllaça un `personGroupId` amb un `eventFrameId` i gestiona l'estat (`status`) i els estats diaris (`dailyStatuses`). S'ha afegit el camp `role?: string` com a font única de veritat per al rol específic d'aquesta assignació, independentment del rol base de la persona.
-   **`PersonGroup`**: Representa una entrada a l'agenda (una persona, una empresa, etc.).
-   **`MaterialItem`**: Defineix un article a l'inventari, amb propietats com `stock` i `category`.
-   **`TechSheetData`**: És una de les interfícies més complexes. Modela tota la informació d'una fitxa de bolo. S'han afegit els camps següents per a les notes generals de personal i necessitats tècniques:
    -   `technicalPersonnelNotes?: string`: Notes generals per a la secció de personal tècnic.
    -   `showTechnicalPersonnelNotesInPdf?: boolean`: Controla la visibilitat d'aquestes notes al PDF.
    -   `technicalNeedsNotes?: string`: Notes generals per a la secció de necessitats tècniques.
    -   `showTechnicalNeedsNotesInPdf?: boolean`: Controla la visibilitat d'aquestes notes al PDF.
-   **`AppData`**: Defineix l'estructura de l'objecte que es desa al fitxer de dades, amb llistes planes per a cada tipus de dada per facilitar la serialització.
-   **`GoogleConfig` i `ManagedAppCalendar`**: Tipifiquen la nova estructura de dades per a la configuració de Google.
-   **`ElectronAPI`**: Tipifica l'objecte `window.electronAPI`, proporcionant autocompletat i seguretat de tipus en les comunicacions amb el backend.

### 4.6. Estructura de Components i Vistes

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
    -   `EventFrameCard.tsx`: Component complex que representa un esdeveniment a la llista. La seva capçalera està dissenyada per actuar com un botó XL per expandir/col·lapsar el contingut, mentre que el cos roman lliure per a la interacció amb el text (copiar/pegar). La lògica `onClick` de la capçalera comprova si el clic s'ha fet sobre un element interactiu (com un botó) per evitar l'expansió/col·lapse no desitjat. Conté la lògica per renderitzar la llista de `AssignmentCard`.
    -   `AssignmentCard.tsx`: Gestiona la presentació d'una única assignació. Segueix el mateix comportament que `EventFrameCard`: la capçalera (nom, rol i estat) actua com a actuador per expandir/col·lapsar la vista diària, permetent la interacció lliure amb les notes.
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
-   `/summaries`: `SummariesDisplay` (Resums i estadístiques)
-   `/tech-sheets`: `TechSheetsDisplay` 
-   `/people`: `PeopleDisplay` 
-   `/material`: `MaterialDisplay` 
-   `/performances`: `PerformancesDisplay` (Mòdul d'Actuacions - FASE 4)

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
    c. **Sincronització Eficient:** Si es confirma, el sistema:
       - Calcula una `thresholdDate` (normalment 7 dies enrere des de la data actual)
       - Elimina només els esdeveniments del calendari de destinació que siguin posteriors a `thresholdDate`
       - Puja tots els esdeveniments locals que siguin nous o actualitzats, enriquint la descripció amb dades de la fitxa de bolo
       - Aquesta optimització millora significativament el rendiment en calendaris grans
    d. **Actualització del Calendari Actiu:** Després d'una sincronització amb èxit, actualitza `activeAppCalendarId` al fitxer de configuració amb el `targetCalendarId` que s'acaba d'utilitzar.
6.  **[Frontend]** El frontend gestiona la resposta:
    -   En cas d'èxit, actualitza les dades i mostra una notificació.
    -   Si rep l'error `CALENDAR_NOT_FOUND`, mostra un missatge a l'usuari i torna a obrir el modal de selecció perquè pugui triar un altre calendari.

#### Flux de Sincronització Individual (v1.6.3+)

1.  **[UI]** L'usuari fa clic a la icona de Google Calendar d'una targeta d'esdeveniment específica (`EventFrameCard`).
2.  **[Frontend]** Es crida a l'acció `syncSingleEvent(eventFrameId)` de l'store `useEventDataStore`.
3.  **[Frontend - Zustand]** L'acció verifica la configuració i, si cal, obre el modal de selecció de calendari.
4.  **[Frontend]** Un cop confirmat el calendari, s'executa `executeSingleSync(eventFrameId, targetCalendarId)`.
5.  **[Backend]** El gestor `sync-single-event-with-google` a `main.cjs` realitza l'operació:
    -   No esborra cap esdeveniment del calendari.
    -   Busca l'esdeveniment a Google per ID o el crea de nou.
    -   Retorna l'objecte actualitzat amb els nous IDs de sincronització.
6.  **[Frontend]** L'store actualitza només l'esdeveniment sincronitzat i mostra el progrés a través de `SyncProgressOverlay`.

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

-   **Gestió de Desat "Buffered Edit" (Edició en Memòria Intermèdia):** Per garantir el màxim rendiment (especialment en operacions com Drag & Drop) i una gestió de dades robusta, s'utilitza el hook `useBufferedSave`.
    -   **Estat Local:** Les dades viuen en un estat local (`useState`) mentre s'editen. Això garanteix que la interfície sigui extremadament fluida, ja que les actualitzacions de l'estat global de Zustand són costoses.
    -   **Sincronització Global:**
        - **Automàtica:** Les dades es guarden a l'Store Global de Zustand automàticament quan el component es desmunta (ex: canviar de pestanya o d'esdeveniment).
        - **Coordinada (saveManager):** El fitxer `src/utils/saveManager.ts` implementa un patró Observer que permet a `App.tsx` demanar a tots els components amb buffer que "buidin" (flush) les seves dades abans de generar el fitxer final al disc. Això garanteix la consistència WYSIWYG en el guardat global (Ctrl+S).
        - **Flux de l'Usuari:** S'ha eliminat el botó de "Desar" manual dins del formulari per evitar la confusió entre "Desat a la RAM" i "Desat al fitxer .gep". Ara l'usuari confia en el flag global `hasUnsavedChanges` que s'activa automàticament en fer qualsevol canvi.


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

#### Lògica d'Ordenació Centralitzada i UI (`MaterialControlCenter.tsx`)

Per millorar la consistència i la claredat, la lògica d'ordenació de dades s'ha centralitzat i simplificat:

-   **Ordenació Jeràrquica Fixa:** Les dades del Centre de Control de Material ara s'ordenen sempre seguint una jerarquia estricta: 1r per **Categoria**, 2n per **Origen** (`location`), i 3r per **Nom**.
-   **Lògica Centralitzada:** Aquesta ordenació es realitza dins d'un `useMemo` al component `MaterialControlCenter.tsx`, just després de filtrar les dades. Això garanteix que tant la taula visual com totes les funcions d'exportació (PDF Resum, PDF Detallat, CSV) rebin exactament les mateixes dades ja ordenades.
-   **Eliminació d'Ordenació Interactiva:** Com a conseqüència, s'ha eliminat la possibilitat que l'usuari ordeni la taula fent clic a les capçaleres. S'ha netejat el codi de `MaterialControlTable.tsx` i `MaterialControlCenter.tsx`, eliminant els estats (`sortConfigs`), funcions (`requestSort`) i lògica de la UI que gestionaven l'ordenació dinàmica.
-   **Desglossament Enriquit:** Es manté el desglossament enriquit, que mostra el detall per esdeveniment amb les seves dates.



 #### Flux de Càlcul (`getMaterialAvailability`)

La funció implementa una lògica granular per garantir un càlcul d'estoc precís. Per evitar re-renderitzats innecessaris durant el càlcul, accedeix a l'estat directament amb `get()` dins de l'store.

 1.  **Entrades:** La funció rep l'ID del material (`materialId`), les dates de l'esdeveniment actual (`startDate`, `endDate`), l'ID de l'esdeveniment actual (`currentEventFrameId`) i un paràmetre opcional **`overrideTechSheet`**. Aquest paràmetre permet calcular la disponibilitat en temps real utilitzant les dades del buffer local abans que s'hagin persistit a la store global.
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

#### Vista Prèvia de Documents (WYSIWYG)

Per millorar l'experiència d'usuari en generar documents complexos com les fitxes de bolo, s'ha implementat una funcionalitat de vista prèvia "El que veus és el que obtens" (WYSIWYG).

-   **Refactorització del Generador de PDF (`pdfGenerator.ts`):** La lògica de generació de PDFs s'ha separat de la lògica de desat.
    -   `generateTechSheetPdfObject()`: Una nova funció pura que construeix i retorna l'objecte `jsPDF` sense desar-lo a disc.
    -   `exportTechSheetToPdf()`: La funció original, ara refactoritzada per cridar `generateTechSheetPdfObject` i després gestionar el diàleg de desat.
-   **Generació en Memòria (`TechSheetForm.tsx`):**
    -   En fer clic al nou botó "Vista Prèvia", es crida a `generateTechSheetPdfObject` amb l'estat actual del formulari (`formData`), incloent els canvis no desats.
    -   El document PDF es genera com un `Blob` en memòria.
    -   Es crea una URL temporal (`Blob URL`) per a aquest objecte.
-   **Modal de Visualització (`PdfPreviewModal.tsx`):**
    -   Un nou component modal rep la `Blob URL` i la mostra dins d'un `<iframe>`.
    -   Això utilitza el visor de PDF natiu del motor Chromium d'Electron per oferir una previsualització fidel i d'alt rendiment sense haver de desar cap fitxer temporal al disc.

##### Millores a les Exportacions del Centre de Control de Material
S'han implementat millores significatives a les funcions d'exportació del Centre de Control de Material per augmentar-ne la claredat i la fiabilitat.

-   **Exportació a PDF Resum (`exportMaterialControlSummaryPdf`):**
    -   **Estructura Jeràrquica:** Aquesta funció ja no realitza la seva pròpia agrupació. Rep les dades pre-ordenades (per categoria, origen i nom) des de `MaterialControlCenter.tsx`.
    -   **Agrupació Visual:** Itera sobre les dades i injecta dinàmicament files de capçalera per a cada **categoria** i sub-capçaleres per a cada **origen**, creant una estructura visual clara i fàcil de seguir.
    -   **Noves Columnes:** S'ha afegit la columna 'Origen' i s'ha reorganitzat la capçalera a `['Nom', 'Origen', 'Estoc', 'Balanç', 'Demanada']` per a una millor llegibilitat.
    -   **Inclusió de Notes:** Si un ítem de material té notes, aquestes s'inclouen en una fila addicional just a sota de l'ítem, amb un estil visual diferenciat per a una fàcil identificació.

-   **Exportació a CSV (`exportMaterialControlCsv`):**
    -   Aquesta funció ara rep les dades ja ordenades jeràrquicament. No s'ha necessitat cap canvi en la seva lògica, però el resultat és un CSV amb les files pre-ordenades de manera consistent amb el PDF de resum.

-   **Correcció a l'Exportació de PDF Detallat (`handleExportDetailedPdf`):**
    -   S'ha solucionat un error crític que provocava que s'exportés un PDF buit si no hi havia cap esdeveniment seleccionat explícitament al filtre.
    -   La nova lògica a `MaterialControlCenter.tsx` dedueix quins esdeveniments són rellevants directament de les dades filtrades (`filteredData`). Itera sobre el desglossament de cada fila, recull tots els `eventFrameId` únics en un `Set`, i filtra la llista completa d'esdeveniments amb aquest conjunt.
    -   Això garanteix que el PDF detallat sempre contingui la informació dels esdeveniments associats a les dades que l'usuari està veient a la taula.

La lògica d'exportació de les Fitxes de Bolo a PDF (`pdfGenerator.ts`) ha estat optimitzada per crear documents nets i rellevants:

*   **Omissió de Seccions Condicionals:** Les seccions tècniques (com 'Il·luminació', 'So', etc.) només s'inclouen al PDF si estan explícitament marcades com a 'SI' al formulari. Les seccions marcades com a 'NO' o sense seleccionar s'ometen completament.
*   **Gestió de Seccions Buides:** Si una secció està marcada com a 'SI' però no conté cap ítem a la seva llista de necessitats, el PDF renderitzarà el títol de la secció (i els detalls generals si n'hi ha), però la taula d'ítems estarà buida.
*   **Consistència de Dades:** Per garantir la precisió, quan un camp condicional es desactiva al formulari (canviant de 'SI' a 'NO'), les dades associades (com la llista de necessitats) s'esborren automàticament de l'estat. Això assegura que el PDF reflecteixi sempre la informació visible al formulari.

### 5.6. Generació de Noms de Fitxer Intel·ligents

Per millorar dràsticament la utilitat dels fitxers exportats (PDF/CSV), s'ha implementat un sistema de nomenclatura intel·ligent i contextual que fa que els noms dels fitxers siguin auto-descriptius.

#### Lògica Centralitzada (`src/utils/fileNameUtils.ts`)

-   **Mòdul Dedicat:** S'ha creat un nou mòdul a `src/utils/fileNameUtils.ts` que centralitza tota la lògica de generació de noms de fitxer.
-   **Funció Principal (`generateFileName`):** Aquesta funció construeix el nom del fitxer basant-se en una jerarquia de prioritat dels filtres actius:
    1.  **Prioritat Alta:** Filtres restrictius com **Esdeveniment específic**, **Persona** o **Data concreta** formen la part principal del nom (p. ex., `Llista_Esdeveniments_Persona_Pep`).
    2.  **Indicador Secundari:** Si s'apliquen filtres addicionals menys específics (com text lliure), s'afegeix un indicador genèric (`_+Filtres`) per a indicar que el contingut està més acotat.
    3.  **Comportament sense Filtres:** Si no hi ha cap filtre actiu, el nom del fitxer descriu el **rang de dates** del contingut exportat (p. ex., `De_01-09-25_a_30-11-25`), que s'extreu directament de les dades.
-   **Formats Especials:** El mòdul també inclou funcions per a formats específics, com `generateTechSheetFileName`, que segueix el patró `Fitxa_Bolo_[NomEsdeveniment]_[Data].pdf`.

#### Integració i Coherència de Dades

-   **Flux de Dades a `SummaryReports`:** El component `SummaryReports.tsx` ha estat refactoritzat per a rebre el conjunt de dades ja filtrat com a `props` des de `MainDisplay.tsx`. Això garanteix que els resums i les seves exportacions es basen exactament en les mateixes dades que l'usuari veu a la llista principal.
-   **Actualització dels Mòduls d'Exportació:** Les funcions a `pdfGenerator.ts` i `csvUtils.ts` han estat actualitzades per a acceptar l'estat dels filtres i cridar a `generateFileName`, assegurant que tots els fitxers exportats segueixin la nova convenció de nomenclatura.
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
-   **Activació:** La lògica de migració i validació ara es troba centralitzada dins de l'acció **`loadData`** al fitxer **`src/stores/eventDataStore.ts`**.

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

### 5.9. Sistema d'Arxivatge d'Esdeveniments

Per mantenir la interfície neta i centrada en els esdeveniments actuals, s'ha implementat un sistema d'arxivatge. Aquesta funcionalitat permet als usuaris ocultar esdeveniments antics (finalitzats fa més d'un mes) de les vistes principals, sense eliminar les dades.

#### Model de Dades

-   **`EventFrame`**: S'ha afegit una nova propietat opcional `isArchived?: boolean` a la interfície. Si és `true`, l'esdeveniment es considera arxivat.

#### Lògica a l'Store (`eventDataStore.ts`)

S'han afegit tres noves accions per gestionar el cicle de vida de l'arxivatge:
-   **`archiveOldEventFrames()`**: Aquesta acció no modifica l'estat. Escaneja tots els `eventFrames` i retorna una llista d'aquells que van finalitzar fa més d'un mes i que encara no estan arxivats.
-   **`confirmArchiveEventFrames(eventFrameIds: string[])`**: Aquesta acció rep un array d'IDs, busca els esdeveniments corresponents i estableix la seva propietat `isArchived` a `true`.
-   **`restoreEventFrame(eventFrameId: string)`**: Rep l'ID d'un esdeveniment, el busca i estableix `isArchived` a `false`.

#### Integració a la Interfície d'Usuari

1.  **Arxivatge massiu (`Controls.tsx`):**
    -   S'ha afegit un botó "Arxivar Antics".
    -   En fer-hi clic, es crida a `archiveOldEventFrames()`. Si retorna esdeveniments, s'obre un modal de confirmació (`confirmDelete`).
    -   Si l'usuari confirma, es crida a `confirmArchiveEventFrames()` amb els IDs dels esdeveniments a arxivar.

2.  **Visualització d'Arxivats (`MainDisplay.tsx`):**
    -   S'ha afegit un estat local `showArchived` i una casella de selecció ("Mostrar arxivats") per controlar-lo.
    -   El selector `selectFilteredEventFrames` s'ha modificat per acceptar un paràmetre `showArchived`. Per defecte (`false`), filtra i exclou els esdeveniments arxivats. Si és `true`, mostra *només* els arxivats.
    -   El títol de la secció canvia a "Esdeveniments Arxivats" quan la casella està marcada.

3.  **Restauració (`EventFrameCard.tsx`):**
    -   El component rep una nova propietat `isArchived: boolean`.
    -   Si és `true`, els botons d'acció habituals (editar, eliminar) s'oculten i es mostra un únic botó "Restaurar".
    -   Aquest botó, en ser clicat, invoca l'acció `restoreEventFrame()` amb l'ID de l'esdeveniment, restaurant-lo a la vista principal.

4.  **Fitxes de Bolo (`TechSheetsDisplay.tsx`):**
    -   S'ha afegit un estat `includeArchived` i una casella de selecció ("Incloure arxivats").
    -   La lògica que genera les opcions per al selector d'esdeveniments filtra els esdeveniments arxivats tret que aquesta casella estigui marcada, garantint que les fitxes d'esdeveniments antics segueixin sent accessibles si cal.

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

## 6. Sistema d'Estils (Tematització Semàntica Centralitzada)

El disseny de la interfície s'ha refactoritzat per utilitzar un **sistema de tematització semàntic i centralitzat** que combina la potència de Tailwind CSS amb la flexibilitat de les variables CSS natives. Aquesta arquitectura no només permet una gestió de temes (clar i fosc) robusta, sinó que també garanteix la coherència visual entre la interfície d'usuari i els documents exportats (PDF).

### Arquitectura del Disseny

El sistema es basa en una jerarquia de "fonts de veritat" per assegurar la màxima consistència i mantenibilitat.

1.  **Font Única de Veritat per a Colors (`src/utils/themeDefinition.ts`):**
    -   **Descripció:** Aquest fitxer és el **nucli de tot el sistema de colors**. Exporta un objecte `themeHslColors` que defineix tots els colors base de l'aplicació en format de tuples HSL `[Hue, Saturation, Lightness]`.
    -   **Responsabilitat:** Qualsevol canvi fonamental en la paleta de colors de l'aplicació (p. ex., canviar el to del color primari) s'ha de fer **únicament** en aquest fitxer.

2.  **Definició de Variables CSS (`src/index.css`):**
    -   **Descripció:** Aquest fitxer consumeix els valors de `themeDefinition.ts` (de manera manual, per ara) per definir una paleta de variables CSS semàntiques (p. ex., `--background`, `--foreground`, `--primary`, `--destructive`).
    -   **Tematització Clar/Fosc:** El tema per defecte (clar) es defineix a `:root`. El tema fosc simplement sobreescriu aquestes mateixes variables dins del selector `.dark`.
    -   **Colors Derivats:** Les variables més específiques (com `--daily-row-yes-bg` per al fons de les files) es deriven de les variables semàntiques principals mitjançant `hsla(var(--success) / 0.15)`, assegurant que s'adaptin automàticament al tema.

3.  **Integració amb Tailwind (`tailwind.config.cjs`):**
    -   **Descripció:** El fitxer de configuració de Tailwind s'ha modificat per consumir les variables CSS definides a `index.css`.
    -   **Implementació:** En lloc de definir colors directament, la paleta de Tailwind fa referència a les variables mitjançant la funció `hsl()`. Això permet que les classes d'utilitat de Tailwind (com `bg-background`, `text-primary`, `border-border`) apliquin automàticament el color correcte segons el tema actiu.

4.  **Coherència en PDFs (`src/utils/colorUtils.ts` i `pdfGenerator.ts`):**
    -   **Problema:** La llibreria `jspdf-autotable` requereix colors en format RGB, no HSL.
    -   **Solució:**
        -   S'ha creat una funció d'utilitat a **`src/utils/colorUtils.ts`** anomenada `hslToRgb` que converteix els colors del format HSL al format RGB.
        -   El generador de PDFs (`src/utils/pdfGenerator.ts`) ara importa els colors HSL directament des de la font única de veritat (`themeHslColors`) i els converteix a RGB al moment utilitzant `hslToRgb`.
    -   **Resultat:** Això garanteix que els colors dels PDFs exportats siguin sempre una representació fidel del tema de l'aplicació, eliminant completament els colors "hardcoded" i la possibilitat d'inconsistències.

### Avantatges d'Aquesta Arquitectura

-   **Centralització Absoluta:** Un únic fitxer (`themeDefinition.ts`) defineix la paleta de colors per a tota l'aplicació.
-   **Consistència Garantida:** La UI, el calendari, els tooltips i els PDFs comparteixen la mateixa font de colors.
-   **Mantenibilitat Superior:** Modificar un color a `themeDefinition.ts` i actualitzar-lo a `index.css` és suficient per canviar-lo a tota l'aplicació, inclosos els exports.
-   **Codi Net:** Redueix la necessitat de classes condicionals `dark:` als components, simplificant el codi JSX.

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

-   **Solució de Condició de Cursa (Race Condition) en Desmuntatge:** S'ha solucionat un bug crític que provocava la pèrdua de focus de la finestra. El problema ocorria quan un element amb un tooltip actiu desapareixia de la UI (per exemple, en ser eliminat d'una llista). El temporitzador del tooltip intentava executar-se després que el component s'hagués desmuntat, causant una condició de cursa que afectava el focus. La solució ha consistit a implementar una funció de neteja (`cleanup function`) dins d'un `useEffect` al component `Tooltip`. Aquesta funció s'assegura de cancel·lar qualsevol temporitzador pendent (`clearTimeout`) en el moment en què el component es desmunta, garantint que no quedin operacions asíncrones residuals i prevenint la pèrdua de focus.

---

## 7. Generació de PDFs i Visualització de Colors (V1.6.3)

### 7.1. PDF Color Patches - Input List Visualization

El sistema de generació de PDFs ara inclou visualització de colors a la Input List de les actuacions, permetent identificar visualment els canals per color.

#### Implementació Tècnica

**Mapa de Colors RGB:**
```typescript
// src/utils/pdfGenerator.ts
const patchColorMap: Record<string, [number, number, number]> = {
  red: [239, 68, 68],
  blue: [59, 130, 246],
  green: [34, 197, 94],
  yellow: [250, 204, 21],
  orange: [249, 115, 22],
  purple: [168, 85, 247],
  brown: [180, 83, 9],
  transparent: [200, 200, 200],
};
```

**Renderitzat de Cercles de Color:**
```typescript
// generatePerformancePdfObjectWithOptions
const inputBody = performance.inputList.map(item => ({
  customColor: patchColorMap[item.patchColor] || patchColorMap.transparent,
  cellPadding: { left: 8 }, // Espai per al cercle
  channel: item.channel,
  patchNumber: item.patchNumber,
  label: item.label,
  micRider: item.micRider,
  // ... altres camps
}));

// Hook didDrawCell per dibuixar cercles
autoTable(pdf, {
  head: inputHead,
  body: inputBody,
  didDrawCell: (data) => {
    if (data.section === 'body' && data.column.index === 0) {
      const color = data.row.raw.customColor;
      if (color) {
        // Dibuixa cercle omplert amb el color
        pdf.setFillColor(...color);
        pdf.circle(data.cell.x + 4, data.cell.y + data.cell.height / 2, 3, 'F');
      }
    }
  },
  // ... altres opcions
});
```

#### Característiques

- **Colors Semàntics:** Mapeig de noms de color a valors RGB precisos
- **Cercles Omplerts:** Visualització clara i compacta dels colors
- **Text Desplaçat:** `cellPadding` evita solapaments entre cercle i text
- **Compatibilitat:** Funciona amb tots els PDFs d'actuacions (Basic, Tech, Hospitality)
- **Fallback Color:** Color gris per a "transparent" o colors no reconeguts

#### Integració

La funcionalitat està integrada a `generatePerformancePdfObjectWithOptions` i s'activa automàticament quan es generen PDFs que inclouen la Input List. Els colors es mostren a la primera columna de la taula, proporcionant una referència visual ràpida per a l'equip tècnic.

---

## 8. Compilació i Desplegament (CI/CD)

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

#### 🐧 Consideracions Especials per a Linux (Ubuntu 24.04+)

A partir d'Ubuntu 24.04 (Noble Numbat), s'ha implementat una restricció de seguretat a l'AppArmor que bloqueja els *unprivileged user namespaces*. Com que les aplicacions Electron en format AppImage utilitzen aquesta tecnologia per al seu sandbox, l'aplicació fallarà en arrencar de forma silenciosa o mostrarà errors de permisos.

**Solució per a Desenvolupament i Usuaris:**

1.  **Desactivació Temporal:**
    ```bash
    sudo sysctl -w kernel.apparmor_restrict_unprivileged_userns=0
    ```

2.  **Desactivació Permanent (Recomanat):**
    Per a que el canvi es mantingui després de reiniciar el sistema, crea un fitxer de configuració:
    ```bash
    echo "kernel.apparmor_restrict_unprivileged_userns = 0" | sudo tee /etc/sysctl.d/60-apparmor-namespace.conf
    sudo sysctl -p /etc/sysctl.d/60-apparmor-namespace.conf
    ```

Aquest ajust és necessari per a qualsevol AppImage, Chrome, Brave o aplicacions basades en Electron que no s'instal·lin via Snap a les noves versions d'Ubuntu.

### 7.1. Associació de Fitxers `.gep`

Per millorar l'experiència d'usuari, l'aplicació registra l'extensió personalitzada `.gep` (Gestor Esdeveniments Personal) al sistema operatiu, permetent obrir fitxers directament amb un doble clic.

-   **Desktop (`electron-builder`):**
    -   Al `package.json`, s'ha afegit la clau `fileAssociations` dins de la configuració de `build`.
    -   Això indica a l'instal·lador que registri l'aplicació com l'editor per defecte per als fitxers amb extensió `.gep`.

-   **Mobile (`Expo`):**
    -   Al fitxer `mobile_app/app.json`, s'ha configurat:
        -   **Android:** `intentFilters` per a l'acció `VIEW`, associant l'extensió `.gep` amb el tipus MIME `application/json`.
        -   **iOS:** `CFBundleDocumentTypes` i `UTExportedTypeDeclarations` per registrar un nou tipus de document (`com.pep.gep`) que s'associa amb l'extensió `.gep` i es basa en `public.json`.

Aquesta configuració garanteix una integració nativa amb l'explorador de fitxers de cada plataforma.

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

2.  **Instal·la les dependències (Mètode Recomanat):**
    Per a assegurar una instal·lació neta i 100% reproduïble, es recomana fer servir `npm ci`. Aquesta comanda instal·la les versions exactes definides al `package-lock.json` i és ideal per a entorns de producció i integració contínua.
    ```bash
    npm ci
    ```
    Alternativament, durant el desenvolupament actiu, pots fer servir `npm install`.

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
`npm start` : Aquesta única comanda s'encarregarà de tot:
Reconstruirà els teus colors a partir de theme.config.cjs.
Llançarà Vite sense memòria cau (--force).
Obrirà Electron.

- ultim script `npm run fresh-start` : Aquesta única comanda s'encarregarà de tot:
Reconstruirà els teus colors a partir de theme.config.cjs.
Llançarà Vite sense memòria cau (--force).
Obrirà Electron.

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
-   **Ús de Modals Interns per a Confirmacions**: Per evitar bugs de pèrdua de focus i mantenir una experiència d'usuari consistent, s'ha estandarditzat l'ús del sistema de modals interns de l'aplicació (`useModalStore`) en lloc de les funcions natives del navegador com `window.confirm()`. Qualsevol nova acció que requereixi confirmació de l'usuari ha d'implementar un modal a través d'aquest sistema.

### 5.9. Càrrega de Dades Resilient (Migració -> Validació -> Confirmació -> Reparació)

Per garantir la màxima robustesa i evitar pèrdues de dades o bloquejos de l'aplicació a causa de fitxers de dades corruptes o amb formats antics, s'ha implementat un pipeline de càrrega de dades de diversos passos. Aquest sistema prioritza una experiència d'usuari ràpida per a dades vàlides (el "camí feliç") mentre proporciona una xarxa de seguretat per a dades que requereixen correccions.

#### El Pipeline de Processament de Dades

La lògica central es troba distribuïda entre l'acció `loadData` de l'store `useEventDataStore` i el component `App.tsx`, seguint aquesta seqüència:

1.  **Migració (Sempre):**
    -   **Objectiu:** Assegurar que les dades, independentment de la seva versió original, tinguin sempre l'estructura de dades més recent definida a `types.ts`.
    -   **Implementació:** La funció itera sobre cada `eventFrame` i passa el seu `techSheet` a la funció `migrateTechSheetData` (`src/utils/techSheetMigration.ts`). Aquesta funció comprova si la fitxa ja té el format nou; si no, la transforma, afegint els camps nous amb valors per defecte i reestructurant els antics.
    -   **Tolerància a Errors:** La migració està dins d'un bloc `try...catch`. Si falla per qualsevol motiu (p. ex., un format de dades completament inesperat), es registra l'error i es genera una fitxa tècnica per defecte, evitant que l'aplicació es bloquegi.

2.  **Validació (Sempre):**
    -   **Objectiu:** Comprovar la integritat referencial de les dades ja migrades.
    -   **Implementació:** Les dades migrades es passen a la funció `validateData` (`src/utils/dataIntegrity.ts`). Aquesta funció comprova, per exemple, que cada `assignment` apunti a un `eventFrameId` i a un `personGroupId` que realment existeixin a les llistes corresponents.
    -   **Resultat:** Retorna un objecte `{ isValid: boolean, errors: ValidationError[] }`.

3.  **Decisió i Rutes Condicionals:**
    -   **Cas A: Dades Vàlides (isValid: true)**
        -   **Acció:** S'executa la funció `_applyDataToState`, que carrega les dades directament a l'estat de React.
        -   **Feedback:** Es mostra un missatge d'èxit simple i ràpid a l'usuari. El procés acaba aquí.
    -   **Cas B: Dades Invàlides (isValid: false)**
        -   **Preparació:** Les dades i l'informe d'errors es desen a l'estat de l'aplicació (`dataRepairInfo`).
        -   **Confirmació de l'Usuari:** Es mostra el component `ConfirmRepairModal` amb els detalls dels errors trobats. L'usuari pot:
            -   **Cancel·lar:** Es descarten les dades i es carrega un document nou.
            -   **Reparar i Continuar:** Es crida a `repairData` per a aplicar les correccions necessàries.

4.  **Reparació (Només amb confirmació de l'usuari):**
    -   **Ubicació:** `App.tsx` (quan l'usuari confirma la reparació al `ConfirmRepairModal`).
    -   **Acció:** Es crida a `repairData` amb les dades i errors desats prèviament.
    -   **Resultat:** Es retornen les dades netes i un llistat de correccions aplicades.
    -   **Finalització:** Les dades reparades es carreguen a l'estat de l'aplicació.

#### Punt Clau d'Arquitectura

La reparació no és automàtica per disseny. La decisió sobre com procedir amb dades invàlides sempre recau en l'usuari, assegurant que sigui conscient de quines correccions s'aplicaran abans que es facin canvis a les seves dades. Això és especialment important en un entorn on les dades podrien ser crítiques i la pèrdua accidental d'informació ha de ser una decisió conscient.

#### Components Clau

-   **`eventDataStore.ts`:** Gestiona la migració i validació inicial.
-   **`App.tsx`:** Gestiona la interfície d'usuari per a la confirmació de reparació.
-   **`ConfirmRepairModal.tsx`:** Mostra els errors i permet a l'usuari decidir com procedir.
-   **`dataIntegrity.ts`:** Conté la lògica de validació i reparació de dades.rant la llista de `fixes` a l'usuari.
        -   **Decisió Final:** L'usuari pot triar entre carregar la versió reparada o cancel·lar l'operació. Les dades només es carreguen si l'usuari dona el seu consentiment explícit.

Aquest sistema garanteix que l'aplicació sigui extremadament resilient a errors de dades, alhora que manté una experiència fluida per a la majoria d'usuaris les dades dels quals són correctes.

## 9. Restauració de Funcionalitats Post-Refactorització (Zustand)

Després de la migració a Zustand, algunes interaccions de la UI es van haver de reconnectar. Aquesta secció documenta les solucions.

### 9.1. Gestió d'Expansió de Targetes (Manual i Automàtica)

S'ha restaurat la capacitat de l'usuari per expandir i col·lapsar manualment les targetes d'esdeveniments, millorant l'experiència en permetre la selecció de dades.

-   **Gestió d'Esdeveniments de Clic (`EventFrameCard.tsx`):** El gestor `onClick` s'ha mogut del wrapper principal a la capçalera específica. Aquesta actua com un actuador XL, mentre que el cos de la targeta queda lliure per interactuar amb el text. Utilitza `e.stopPropagation()` en els botons interns per assegurar que només el clic a la zona buida de la capçalera activi l'expansió.
-   **Estat a l'Store (`eventDataStore.ts`):**
    -   `manualExpandedFrameIds: Set<string>`: Emmagatzema els IDs de les targetes que l'usuari ha expandit manualment.
    -   `setManualExpandedFrameIds()`: L'acció per modificar aquest conjunt.
-   **Lògica al Component (`MainDisplay.tsx`):**
    -   La funció `handleToggleExpand` crida a l'acció de l'store.
    -   Un `useMemo` decideix quines targetes estan expandides: si hi ha filtres actius, s'expandeixen tots els resultats; si no, s'utilitza el conjunt manual.

### 9.2. Funcionalitat "Mostrar a la Llista" i Ressaltat (Correcció de Condició de Cursa)

S'ha restaurat l'acció "Mostrar a la Llista" i s'ha corregit una condició de cursa que impedia que funcionés de manera fiable.

-   **Acció Centralitzada (`eventDataStore.ts`):** L'acció `showAndHighlightEvent(eventId: string)` estableix l'estat per expandir la llista i ressaltar un element.
-   **Activació (`EventFrameDetailsModal.tsx`):** El botó corresponent crida a l'acció anterior.
-   **Efecte Visual Corregit (`MainDisplay.tsx`):**
    -   S'ha corregit una **condició de cursa** (race condition). El `useEffect` que gestiona el ressaltat ara depèn de `highlightedEventId` i també de `filteredAndSortedEventFrames`.
    -   **Explicació:** Això garanteix que l'efecte només s'executi després que React hagi renderitzat la llista d'esdeveniments (si estava col·lapsada). D'aquesta manera, quan `document.getElementById` busca la targeta, aquesta ja existeix al DOM.
    -   L'efecte fa `scrollIntoView()`, afegeix una classe CSS per a l'animació, i la neteja després de 3 segons.

### 9.3. Exportació de Vistes Filtrades (PDF/CSV)

S'ha restaurat la capacitat d'exportar a PDF o CSV només els esdeveniments que coincideixen amb els filtres actius a la vista principal.

-   **Ubicació:** La funcionalitat d'exportació es troba a la barra d'eines superior del component `MainDisplay.tsx`, dins de la secció "Llista d'Esdeveniments".
-   **Lògica:** El component utilitza l'estat local `currentlyDisplayedFrames` per mantenir una referència als esdeveniments actualment visibles segons els filtres aplicats.
-   **Implementació:** 
    - Quan l'usuari clica a "Exportar a PDF" o "Exportar a CSV", `MainDisplay.tsx` utilitza la llista de marcs d'esdeveniments actualment mostrats (`currentlyDisplayedFrames`).
    - Aquesta llista es passa a les funcions d'exportació a `pdfGenerator.ts` o `csvUtils.ts` segons correspongui.
    - Si no hi ha cap filtre actiu, s'exporta automàticament la llista completa d'esdeveniments.
-   **Integració amb Filtres:** La llista d'esdeveniments es manté sincronitzada amb els filtres actius gràcies a la funció `updateDisplayedFrames`, que s'executa cada vegada que canvien els filtres o l'ordre de classificació.
-   **Experiència d'usuari:** La ubicació dels botons d'exportació a la barra d'eines principal, a prop dels controls de filtrat, permet una experiència més intuïtiva, ja que els usuaris poden veure exactament quins esdeveniments s'exportaran abans de fer-ho.
-   **Consistència:** Aquest enfocament garanteix que el que l'usuari veu a la pantalla sigui exactament el que s'exporta, eliminant qualsevol confusió sobre quines dades s'inclouran a l'arxiu generat.

### 9.4. Avís de Conflictes en Assignacions

S'ha reimplementat i estandarditzat el diàleg modal que adverteix l'usuari quan intenta crear o modificar una assignació que se solapa en el temps amb una altra assignació existent per a la mateixa persona.

-   **Arquitectura:** La detecció de conflictes es realitza a l'store (`useEventDataStore`). Si se'n troba un, es comunica a la UI a través d'un missatge de retorn amb un prefix especial.
-   **Gestió a la UI:**
    -   **`MainDisplay.tsx`**: Gestiona els conflictes quan es canvia l'estat d'una assignació directament des de la vista principal, utilitzant les funcions `handleGeneralStatusChange` i `handleDailyStatusChange`. Aquestes funcions comproven els conflictes abans d'aplicar els canvis.
    -   **`AssignmentFormModal.tsx`**: Gestiona els conflictes en crear o editar una assignació completa a través del formulari.
    -   **Consistència:** Ambdós components utilitzen el mateix modal de confirmació (`ConfirmDuplicateModal`) per oferir una experiència d'usuari unificada.

### 9.5. Barra de Progrés Detallada per a la Sincronització

S'ha reintroduït la barra de progrés en temps real durant la sincronització amb Google Calendar.

-   **Comunicació Backend -> Frontend:** El procés principal (`main.cjs`) envia actualitzacions de progrés a través del canal IPC `'sync-progress'`.
-   **Gestió d'Estat amb Zustand:** Un `useEffect` a `App.tsx` escolta aquests esdeveniments i actualitza un estat `syncProgress` dins de `useEventDataStore`, que és consumit pel component `SyncProgressOverlay.tsx`.

## 🎨 Sistema de Temes i Gestió de Colors

Per garantir la consistència visual i facilitar el manteniment, l'aplicació utilitza un sistema de temes centralitzat. Tota la paleta de colors es gestiona des d'una única font de veritat, i els fitxers de l'aplicació es generen automàticament a partir d'aquesta.

### 1. La Font Única de la Veritat: `theme.config.cjs`

- **Fitxer Clau:** `theme.config.cjs` a l'arrel del projecte.
- **Propòsit:** Aquest fitxer és l'únic lloc on s'han de definir o modificar els colors de l'aplicació. Conté:
    - `light`: Un objecte amb els colors per al tema clar en format string HSL (`"H S% L%"`).
    - `dark`: Un objecte amb els colors per al tema fosc.
    - `pdfExtras`: Colors addicionals que no són part del sistema de temes CSS però que es necessiten per a la generació de PDFs.
    - `pdfMapping`: Un mapeig que indica quin color de tema (`light` o `dark`) s'ha d'utilitzar per a cada variable de color en el context dels PDFs.

**Mai no s'han de modificar els colors directament a `src/index.css` o `src/utils/themeDefinition.ts`.**

### 2. Generació Automàtica de Fitxers de Tema

- **Script:** `scripts/build-theme.cjs`
- **Comanda:** `npm run build:theme`

Aquest script llegeix `theme.config.cjs` i genera dos fitxers crucials:

- **`src/index.css`**: Injecta les variables de color CSS per als selectors `:root` (tema clar) i `.dark` (tema fosc). Aquestes variables són les que utilitza Tailwind CSS a tota l'aplicació.
- **`src/utils/themeDefinition.ts`**: Genera un objecte TypeScript (`themeHslColors`) que conté els colors en format d'array HSL (`[H, S, L]`). Aquest objecte s'utilitza en llocs on les variables CSS no són accessibles, com durant la generació de documents PDF.

### 3. Com Actualitzar un Color (Flux de Treball)

1.  Obre el fitxer `theme.config.cjs`.
2.  Modifica el valor HSL del color que vulguis canviar al tema `light`, `dark` o a tots dos.
3.  Desa el fitxer.
4.  Executa la següent comanda a la terminal:
    ```bash
    npm run build:theme
    ```
5.  Això és tot. L'script actualitzarà automàticament tots els fitxers necessaris. El comando `npm run build` també executa aquest script, de manera que els canvis sempre estaran sincronitzats en fer una nova compilació.

---

### 9.6. Detecció de Plataforma Centralitzada per a Dreceres de Teclat

Per garantir que les dreceres de teclat es mostrin de manera consistent i correcta a tota l'aplicació (p. ex., "⌘" a macOS i "Ctrl" a Windows/Linux), la lògica de detecció del sistema operatiu s'ha centralitzat.

-   **Font de la Veritat (`App.tsx`):** El component arrel `App.tsx` és ara l'únic responsable de determinar la tecla modificadora específica de la plataforma.
    -   Realitza una única crida **síncrona** a `window.electronAPI.getPlatformSync()` en el moment de la renderització inicial.
    -   El resultat s'assigna a una **constant** local: `const platformModifierKey = window.electronAPI?.getPlatformSync() === 'darwin' ? '⌘' : 'Ctrl';`.
    -   Aquest enfocament elimina la necessitat de `useState` i `useEffect`, evitant qualsevol parpelleig visual o estat intermedi incorrecte.

-   **Propagació mitjançant Props:**
    -   La constant `platformModifierKey` es passa com a `prop` (`modifierKey`) als components fills que ho necessiten, com ara `CustomMenuBar.tsx`.

-   **Component Fill (`CustomMenuBar.tsx`):**
    -   El component del menú ja no conté cap lògica pròpia per detectar la plataforma.
    -   Simplement rep la `prop` `modifierKey` i la utilitza directament per renderitzar la drecera de teclat correcta.

Aquest patró millora la mantenibilitat, elimina codi duplicat i assegura que tota la UI reaccioni de manera consistent a la plataforma en què s'executa l'aplicació.

## 10. Aplicació Mòbil (React Native amb Expo)

L'aplicació mòbil, situada a `mobile_app/`, ha evolucionat d'un simple visor a una eina de gestió de dades completa, permetent la gestió d'Esdeveniments, Persones i Material.

### 10.1. Pila Tecnològica

-   **React Native & Expo:** Framework i plataforma per al desenvolupament d'aplicacions mòbils natives amb React.
-   **TypeScript:** Per a un codi més robust i mantenible.
-   **React Navigation:** Llibreria per a la gestió de la navegació. S'utilitza una combinació de `BottomTabNavigator` per a la navegació principal i `StackNavigator` per al flux intern de cada secció.
-   **Zustand:** Gestor d'estat global per a una gestió de dades centralitzada i eficient.
-   **React Native Vector Icons:** Llibreria per a la inclusió d'icones a la interfície.
-   **React Native Picker:** Component per a selectors natius.
-   **Expo Secure Store:** Per a l'emmagatzematge segur i persistent de dades clau-valor, com la preferència del tema de l'usuari.
- **React Native Calendars:** Llibreria específica (`react-native-calendars`) per al component de calendari natiu interactiu.

### 10.2. Sistema de Temes (Mode Clar/Fosc)

L'aplicació mòbil ha implementat un sistema de temes complet per oferir una experiència d'usuari consistent tant en mode clar com fosc.

-   **Definició de Temes:** Els colors per a cada tema es defineixen a `src/utils/themes.ts`.
-   **Gestió d'Estat:** L'estat del tema ('light' o 'dark') es gestiona globalment a través de `useDataStore` (Zustand).
-   **Persistència:** La preferència del tema de l'usuari es desa de manera persistent entre sessions utilitzant `expo-secure-store`.
-   **Aplicació d'Estils:** Els components utilitzen un hook `useMemo` per crear un objecte `dynamicStyles` que s'adapta als canvis de tema, garantint que la interfície es re-renderitzi amb els colors correctes.

### 10.3. Arquitectura i Filosofia de la Interfície d'Usuari

La interfície de l'aplicació mòbil ha estat redissenyada seguint una filosofia centrada en la claredat visual i la interacció intuïtiva.

-   **Visualització Primer:** Les pantalles principals estan dissenyades per a la consulta ràpida d'informació. Les dades es presenten en un format de només lectura, net i organitzat.
-   **Interacció a través de Modals:** Totes les accions que impliquen modificació de dades (crear, editar, ordenar, filtrar) es gestionen a través de modals o diàlegs superposats. Això manté les pantalles principals lliures d'elements d'interacció complexos.
-   **Icones sobre Text:** S'ha prioritzat l'ús d'icones per a les accions més comunes (editar, eliminar, desar, etc.) per crear una interfície més neta i visualment atractiva.
-   **Accés Ràpid a la Creació (FAB):** L'acció principal de cada pantalla (afegir un nou element) està sempre accessible a través d'un Botó d'Acció Flotant (FAB) a la cantonada inferior dreta.
-   **Components Reutilitzables (`Toolbar`):** La funcionalitat de cerca, ordenació i filtratge s'ha encapsulat en components `Toolbar` dedicats per a cada pantalla, promovent la reutilització de codi i la consistència.


### 10.4. Arquitectura de Navegació per Pestanyes

L'arquitectura de navegació ha estat completament redissenyada utilitzant `react-navigation` per oferir una experiència d'usuari fluida i organitzada.

-   **Navegador Principal (`BottomTabNavigator`):** El punt d'entrada de l'aplicació (`App.tsx`) defineix un navegador de pestanyes inferior que divideix l'aplicació en 7 seccions funcionals:
    1.  **Esdeveniments (`Events`):** És el cor de l'aplicació.
        -   **Estat Inicial:** Si no hi ha dades carregades, mostra una pantalla de benvinguda ("Empty State") instant a l'usuari a obrir un fitxer.
        -   **Estat Actiu:** Un cop carregat un fitxer, mostra la llista filtrable d'esdeveniments i permet la gestió de l'arxiu (Desar, Tancar).
    2.  **Calendari (`Calendar`):** Implementació de `react-native-calendars` que ofereix una vista visual dels dies ocupats i permet filtrar la llista d'esdeveniments per dia seleccionat.
    3.  **Fitxes de Bolo (`TechSheets`):** Accés directe de lectura a les fitxes tècniques, optimitzat per a consultes ràpides durant el muntatge.
    4.  **Persones (`People`):** Gestió completa (CRUD) de la base de dades de contactes i proveïdors.
    5.  **Material (`Material`):** Gestió de l'inventari amb agrupació per categories i control d'estoc.
    6.  **Centre de Control (`ControlCenter`):** Versió mòbil de l'eina d'anàlisi de disponibilitat, permetent consultar l'estat del material (Balanç/Demanda) des de qualsevol lloc.
    7.  **Resums (`Summaries`):** Vistes analítiques agrupades per data, persona o esdeveniment per tenir una visió global de la producció.

-   **Piles de Navegació Independents (`StackNavigator`):** Cada pestanya no renderitza una única pantalla, sinó que conté una pila de navegació pròpia (ex: `EventsStackNavigator`, `MaterialStackNavigator`).
    -   Això permet una **navegació profunda** (Drill-down): L'usuari pot entrar a "Esdeveniments" -> "Detall" -> "Editar" -> "Formulari Assignació" sense perdre el context de la pestanya activa.
    -   Totes les piles comparteixen un `CustomHeader` comú que gestiona les accions globals (Desar, Tancar, Tema).

### 10.5. Gestió de Dades i Noves Funcionalitats

El gestor d'estat (`dataStore.ts`) ha estat ampliat per donar suport a totes les entitats de dades i a les noves funcionalitats.

-   **Accions CRUD Completes:** L'store ara inclou accions per a Crear, Llegir, Actualitzar i Eliminar (CRUD) per a:
    -   `EventFrame` (`addEventFrame`, `updateEventFrame`, `deleteEventFrame`)
    -   `PersonGroup` (`addPersonGroup`, `updatePersonGroup`, `deletePersonGroup`)
    -   `MaterialItem` (`addMaterialItem`, `updateMaterialItem`, `deleteMaterialItem`)
-   **Control de Canvis No Desats:** Totes les accions que modifiquen l'estat (add, update, delete) estableixen automàticament el "dirty flag" `hasUnsavedChanges` a `true`, assegurant que l'usuari sigui notificat abans de perdre canvis.
-   **Estat de l'Esdeveniment:** S'ha afegit la propietat `status` ('pending' o 'completed') a l'objecte `EventFrame`. La UI ho reflecteix amb un indicador visual i permet la seva edició al formulari.
-   **Seccions Col·lapsables:** La pantalla de Materials ara permet expandir i contraure les categories per a una millor organització.

### 10.6. Arquitectura i Gestió de Fitxers Mòbils

#### Problema de Fons

Les aplicacions a Android, a causa de les restriccions de seguretat (scoped storage), no poden sobreescriure directament un fitxer que l'usuari ha obert des d'un servei al núvol com Google Drive. Les intents d'accés directe a la URI original per escriure-hi fallen o creen duplicats no desitjats.

#### Solució Implementada

S'han implementat dos mètodes complementaris per gestionar el desat de fitxers, cadascú amb el seu propi cas d'ús:

1. **Mètode "Desar a..." (content-save-all-outline)**
   - **Flux**:
     1. Obre el gestor de fitxers natiu
     2. Permet a l'usuari seleccionar una ubicació i nom de fitxer
     3. Desa una còpia nova del document a la ubicació seleccionada
   - **Cas d'ús principal**: Desar una còpia nova del document en una ubicació específica (emmagatzematge local, targeta SD, etc.)

2. **Mètode "Compartir" (share-variant) [RECOMANAT PER A NÚVOL]**
   - **Tecnologia**: Utilitza la llibreria `expo-sharing`
   - **Flux**:
     1. Desa les dades actualitzades en un fitxer temporal a la memòria cau de l'aplicació
     2. Invoca `Sharing.shareAsync()` amb la ruta del fitxer temporal
     3. Mostra el menú "Compartir" del sistema
     4. L'usuari selecciona l'aplicació de núvol (p. ex., "Pujar a Drive")
     5. A l'aplicació de destí, l'usuari ha de navegar i seleccionar l'opció de sobreescriure el fitxer original
   - **Cas d'ús principal**: Actualitzar fitxers en serveis al núvol (Google Drive, Dropbox, etc.)

#### Implementació Tècnica

1. **Capa de Presentació (UI)**
   - **`CustomHeader.tsx`**: Conté els dos botons d'acció principals
     - "Desar a..." (content-save-all-outline) - Per a desar còpies noves
     - "Compartir" (share-variant) - Per a actualitzar fitxers al núvol

2. **Capa d'Estat (Gestió de Dades)**
   - **`src/stores/dataStore.ts`**:
     - Gestiona l'estat de les dades de l'aplicació
     - Manté el nom del fitxer actual i l'estat dels canvis no desats
     - Proporciona accions per a `saveFileAs()` i `shareFile()`

3. **Capa de Serveis**
   - **`src/services/SAFFileService.ts`**:
     - `saveFileAs()`: Utilitza `FileSystem.StorageAccessFramework` per permetre a l'usuari desar el fitxer en una ubicació específica del dispositiu. Crea una còpia nova del document.
     - `shareFile()`: Crea un fitxer temporal a la memòria cau i obre el diàleg de compartir del sistema. És el mètode recomanat per actualitzar fitxers en serveis al núvol.
     - **Nota important**: No hi ha cap mètode `createFile`. La funcionalitat de crear nous fitxers es gestiona a través d'aquests dos mètodes segons el cas d'ús específic.

#### Recomanacions d'Ús

- Per actualitzar fitxers en serveis al núvol, sempre s'hauria d'utilitzar el botó **"Compartir"**
- El botó **"Desar a..."** s'hauria d'utilitzar principalment per a desar còpies locals o en ubicacions específiques
- El sistema està dissenyat per funcionar sense mantenir cap URI persistent dels fitxers, la qual cosa el fa més robust davant els canvis en els permisos d'emmagatzematge

4.  **Capa de Tipus (Model de Dades):**
    -   **Tipus Compartits (`src/types/index.ts`):** Aquest fitxer conté les definicions de tipus de TypeScript (`AppData`, `EventFrame`, `PersonGroup`, etc.). És una còpia directa del `types.ts` de l'aplicació d'escriptori, garantint que ambdues aplicacions comparteixin el mateix "llenguatge" de dades i puguin interoperar de manera consistent.

### 10.3. Gestió de Dades: Funcionalitats CRUD i Control de Canvis

L'aplicació mòbil ha evolucionat per permetre la gestió completa d'esdeveniments (Crear, Llegir, Actualitzar, Eliminar) i implementa un sistema robust per al control de canvis no desats.

-   **Navegació Millorada:**
    -   S'ha afegit una nova pantalla, `EventFormScreen.tsx`, a la pila de navegació. Aquesta pantalla rep un paràmetre opcional `eventId` per distingir entre el mode "edició" i el mode "creació".
    -   El títol de la pantalla canvia dinàmicament a "Editar Esdeveniment" o "Nou Esdeveniment" segons el context.

-   **Accions CRUD a `dataStore.ts`:**
    -   `addEventFrame(data)`: Afegeix un nou esdeveniment a la llista, generant un ID únic amb `uuid`.
    -   `updateEventFrame(eventId, data)`: Actualitza un esdeveniment existent.
    -   `deleteEventFrame(eventId)`: Elimina un esdeveniment.
    -   Cadascuna d'aquestes accions estableix el "dirty flag" `hasUnsavedChanges` a `true`.

-   **Control de Canvis No Desats:**
    -   **"Dirty Flag":** L'estat `hasUnsavedChanges: boolean` a `dataStore` és la font de veritat per saber si hi ha canvis pendents.
    -   **Botó "Guardar" Condicional:** A `HomeScreen`, un botó "Guardar" a la capçalera només és visible i actiu si `hasUnsavedChanges` és `true`.
    -   **Lògica de Desat:** L'acció `saveDataToFile` a l'store crida al mètode `saveData` del `DeviceFileService`, que utilitza `expo-file-system` per escriure les dades actualitzades a la `URI` del fitxer original. En cas d'èxit, `hasUnsavedChanges` es restableix a `false`.
    -   **Alerta en Sortir:** `HomeScreen` utilitza el listener `beforeRemove` de `react-navigation`. Si `hasUnsavedChanges` és `true` quan l'usuari intenta navegar enrere, es mostra un diàleg de confirmació natiu per evitar la pèrdua accidental de dades.

-   **Interfície d'Usuari a `HomeScreen.tsx`:**
    -   **Botó d'Afegir:** Un botó "+" a la capçalera permet navegar a `EventFormScreen` en mode "creació".
    -   **Botons d'Acció:** Cada ítem de la llista d'esdeveniments té ara botons "Editar" i "Eliminar".
        -   "Editar" navega a `EventFormScreen` passant l'`eventId`.
        -   "Eliminar" mostra un diàleg de confirmació (`Alert.alert`) abans de cridar l'acció `deleteEventFrame`.

### 10.7. Centre de Colors i Nou Selector Personalitzat (Mobile)

- **Font de la veritat (mòbil):** La versió mòbil utilitza `mobile_app/src/utils/themeConfig.ts` com a centre de colors i `mobile_app/src/utils/themes.ts` per exposar `lightTheme` i `darkTheme` que consumeixen els components mòbils.
- **Arxius nous i ubicació:**
    - `mobile_app/src/components/CustomSelect.tsx` : component reutilitzable que substitueix el `Picker` natiu per un selector basat en `Modal` + `FlatList`. Assegura control complet sobre fons i text en mode fosc/clar.
    - `mobile_app/src/components/MaterialControlFilters.tsx` i `mobile_app/src/components/FilterControls.tsx` han estat actualitzats per utilitzar `CustomSelect` en lloc de `@react-native-picker/picker` per evitar problemes de contrast en tema fosc.
- **Raó del canvi:** Els menús desplegables natius poden utilitzar el tema del sistema i no són sempre estilitzables des de React Native (especialment a Android). `CustomSelect` garanteix que el fons i el color del text dels elements del selector respectin el tema de l'aplicació (fosc/clar).
- **Com utilitzar `CustomSelect`:**
    - Importa el component: `import CustomSelect from './components/CustomSelect';`
    - Props principals:
        - `value: string` — valor seleccionat
        - `onValueChange: (v: string) => void` — callback per actualitzar el valor
        - `options: { label: string; value: string }[]` — llista d'opcions
        - `placeholder?: string` — text per defecte quan no hi ha selecció
    - Exemple d'ús (simplificat):
        ```tsx
        <CustomSelect
            value={selectedId}
            onValueChange={setSelectedId}
            options={[{label: 'Tots', value: ''}, {label: 'A', value: 'a'}]}
            placeholder="Tots els elements"
        />
        ```
- **Temes i adaptació:** `CustomSelect` llegeix el tema via `useDataStore()` i aplica `darkTheme` o `lightTheme` automàticament, així que no cal passar colors manualment.

    #### El "Truc de la Key" per al Calendari
    El component `react-native-calendars` té una optimització interna que impedeix l'actualització immediata dels estils en canviar de tema. Per solucionar-ho, a `CalendarScreen.tsx`, s'assigna la propietat `key={theme}` al component `<Calendar />`. Això força a React a desmuntar i remuntar el component completament quan l'usuari canvia entre clar i fosc, garantint que els nous colors s'apliquin correctament.

Si afegeixes nous selectores en pantalles mòbils, utilitza `CustomSelect` per garantir coherència visual entre temes i evitar problemes de contrast.

### 10.4. Com executar l'aplicació mòbil

1.  **Navega al directori de l'aplicació mòbil:**
    ```bash
    cd mobile_app
    ```
2.  **Instal·la les dependències:**
    L'ecosistema de React Native té un arbre de dependències complex. Per evitar conflictes, és **obligatori** utilitzar el flag `--legacy-peer-deps`.
    ```bash
    npm install --legacy-peer-deps
    ```
    > **Nota sobre instal·lacions netes:** Si trobes problemes de dependències, la millor solució és fer una instal·lació completament neta. Això implica esborrar `node_modules` i `package-lock.json` abans de tornar a executar la comanda d'instal·lació.
    > ```bash
    > rm -rf node_modules package-lock.json
    > npm install --legacy-peer-deps
    > ```
    > **Nota important:** Per afegir noves dependències, especialment aquelles que contenen codi natiu (com les llibreries d'Expo), es recomana utilitzar `npx expo install <nom-del-paquet>`. Aquesta eina s'assegura d'instal·lar una versió de la llibreria que sigui totalment compatible amb l'SDK d'Expo del projecte, evitant problemes d'enllaç natiu.
3.  **Inicia el servidor de desenvolupament d'Expo:**
    ```bash
    npm start
    ```
Això obrirà el Metro Bundler al teu navegador. Pots executar l'aplicació en un dispositiu físic escanejant el codi QR amb l'aplicació Expo Go, o en un emulador/simulador d'Android o iOS.



## Arquitectura General (Resum)

- **Frontend:** React amb Vite.
- **Escriptori:** Electron.
- **Gestió d'Estat:** Zustand.
- **Estils:** Tailwind CSS.
- **Llenguatge:** TypeScript.


***

## 🛠️ Guia de Comandes Mestres (Flux de Treball)


## 📱 Configuració per a Dispositiu Físic (Android USB)

Per executar l'aplicació mòbil directament en un dispositiu físic Android (recomanat per rendiment i accés real a fitxers), segueix aquests passos un sol cop:

1.  **Activar Mode Desenvolupador:**
    *   Ves a *Configuració > Sobre el telèfon*.
    *   Prem 7 vegades seguides sobre **"Número de compilació"** (Build number) fins que aparegui el missatge "Ara ets desenvolupador!".

2.  **Habilitar Depuració USB:**
    *   Ves a *Configuració > Sistema > Opcions de desenvolupador*.
    *   Activa l'interruptor **"Depuració per USB"**.

3.  **Verificar Connexió (ADB):**
    *   Connecta el mòbil a l'ordinador via USB.
    *   Obre un terminal i executa:
        ```bash
        adb devices
        ```
    *   **Important:** Mira la pantalla del mòbil i accepta el diàleg *"Permetre depuració USB?"* (marca "Permetre sempre...").
    *   Si la terminal mostra el teu dispositiu seguit de `device` (ex: `LMQ710... device`), ja estàs llest. Si diu `unauthorized`, revisa el mòbil.

4.  **Llançar l'App:**
    *   Executa la comanda mestre de desenvolupament mòbil.
    *   Quan aparegui el menú d'Expo al terminal, prem la tecla **`a`** per instal·lar i obrir l'app al teu Android connectat.

Aquestes comandes combinades garanteixen un entorn de treball net i previsible, eliminant errors derivats de dependències corruptes o memòria cau obsoleta.

### 📱 Desenvolupament Mòbil (Reset Total)
Utilitza aquesta comanda si trobes errors de resolució de paquets o si l'aplicació no reflecteix els canvis recents.

```bash
cd mobile_app && rm -rf node_modules package-lock.json && npm install --legacy-peer-deps && npm start -- --clear
```
*   **Què fa:** Elimina dependències locals, les reinstal·la ignorant conflictes estrictes de versions (necessari per a l'ecosistema React Native actual) i inicia el Metro Bundler forçant la neteja de la memòria cau.

### 🖥️ Desenvolupament Escriptori

Tens dues opcions segons la necessitat del moment:

**Opció A: Restauració i Actualització (Flexible)**
Ideal quan vols actualitzar dependències o l'entorn sembla corrupte.
```bash
rm -rf node_modules package-lock.json dist && npm install && npm run fresh-start
```
*   **Què fa:** Elimina tot rastre de l'entorn anterior, regenera el `package-lock.json` amb les últimes versions compatibles i inicia l'aplicació regenerant els temes.

**Opció B: Entorn Estricte (Reproduïble)**
Ideal per treballar amb la certesa que tens exactament les mateixes versions que al repositori.
```bash
npm ci && npm run fresh-start
```
*   **Què fa:** Esborra `node_modules` i instal·la **exactament** les versions definides al `package-lock.json` existent, sense modificar-lo.

### 📦 Compilació per a Producció (Linux)
Genera l'executable final per a distribució.

```bash
npm ci && npm run build:linux
```
*   **Resultat:** Un cop finalitzat el procés, trobaràs l'arxiu executable a:
    `dist/GestorEsdevenimentsPersonal_vXX-Linux-Ubuntu18.04+.AppImage`

> **⚠️ AVÍS CRÍTIC: Fitxers de Secrets**
> `npm ci` i el procés de build no toquen els fitxers locals no versionats. Perquè la integració amb Google funcioni a l'aplicació compilada, has d'assegurar-te que els fitxers **`google-credentials.json`** i **`service-account.json`** estan presents a l'arrel del projecte **ABANS** d'executar la comanda de compilació. Si falten, `electron-builder` no els inclourà al paquet final.

## 9.7. Arquitectura UI: Escala XL i Lògica de Focus Únic

A la versió 1.5.0 s'ha implementat un redisseny visual important a la llista d'esdeveniments (`MainDisplay`):

1. **Disseny d'Alta Visibilitat (Escala XL):**
   - S'han augmentat significativament (aprox. 200%) els paddings, mides de font i icones de les targetes (`EventFrameCard` i `AssignmentCard`).
   - **Objectiu:** Millorar la llegibilitat i facilitar la interacció en pantalles tàctils o monitors d'alta resolució, creant àrees de clic (hitboxes) més generoses.

2. **Separació d'Estats: Expansió vs. Focus:**
   - S'ha separat el concepte d'estar "Obert" (`isExpanded`) del d'estar "Seleccionat" (`isFocused`).
   - **Estat `isExpanded`:** Controla la visibilitat del contingut. El botó "Expandir Tot" afecta aquest estat.
   - **Estat `isFocused`:** Controla el ressaltat visual (vora blava / ring).
   - **Lògica de "Focus Únic":** Només una targeta pot estar enfocada alhora (`focusedEventFrameId` a l'store). Això evita que, en expandir tota la llista, l'usuari es vegi aclaparat per un "mur de color". El focus només s'activa quan l'usuari interactua explícitament (clic) amb una targeta específica.

### Implementació Tècnica

#### EventFrameCard.tsx
```tsx
// Props del component
interface EventFrameCardProps {
  // ... altres props
  isFocused?: boolean;
  onFocus?: () => void;
}

// Ús al render
<div 
  className={`mb-2 rounded-xl overflow-hidden bg-card text-card-foreground transition-all duration-200 ${
    isFocused 
      ? 'border-4 border-primary ring-4 ring-primary/20' 
      : 'border-2 border-border hover:border-muted-foreground/30'
  }`}
  onClick={(e) => {
    if ((e.target as HTMLElement).closest('button, input, select, a')) {
      return;
    }
    onToggleExpand(eventFrame.id);
    onFocus?.();
  }}
>
  {/* Contingut de la targeta */}
</div>
```

#### eventDataStore.ts
```typescript
interface EventDataState {
  // ... altres estats
  focusedEventFrameId: string | null;
}

interface EventDataActions {
  // ... altres accions
  setFocusedEventFrameId: (id: string | null) => void;
}

const initialState: EventDataState = {
  // ... altres valors inicials
  focusedEventFrameId: null,
};

// A l'store
setFocusedEventFrameId: (id) => set({ focusedEventFrameId: id }),
```

#### MainDisplay.tsx
```typescript
// Obtenir l'ID de la targeta enfocada i la funció per canviar-la
const { focusedEventFrameId, setFocusedEventFrameId } = useEventDataStore();

// Al renderitzar cada EventFrameCard
<EventFrameCard
  // ... altres props
  isFocused={focusedEventFrameId === eventFrame.id}
  onFocus={() => setFocusedEventFrameId(eventFrame.id)}
/>

// Al botó "Expandir Tot"
const handleToggleAllCards = () => {
  if (areAllVisibleExpanded) {
    setManualExpandedFrameIds(() => new Set());
  } else {
    const allIds = new Set(filteredAndSortedEventFrames.map(ef => ef.id));
    setManualExpandedFrameIds(() => allIds);
  }
  setFocusedEventFrameId(null); // Neteja el focus en expandir/col·lapsar tot
};
```

### Consideracions de Disseny

1. **Retroacció Visual:** El canvi de mida de la vora (de 2px a 4px) i l'efecte de ring proporcionen una clara indicació visual de quin element està enfocat.
2. **Accessibilitat:** L'estat de focus és important per a usuaris que naveguen amb teclat o lectors de pantalla.
3. **Rendiment:** La gestió del focus és lleugera i no afecta el rendiment, ja que només canvia una classe CSS.
4. **Consistència:** El comportament és consistent amb els estàndards d'usabilitat, on un sol element pot estar enfocat en un moment donat.

## 11. MÒDUL D'ACTUACIONS (FASE 4) - GESTIÓ D'ARTISTES

### Visió General del Mòdul

El mòdul d'Actuacions és una nova funcionalitat completa per a la gestió d'actuacions artístiques dins d'esdeveniments. Aquest mòdul permet:

- **Gestió d'Actuacions:** Crear, editar i organitzar actuacions artístiques
- **Control d'Avançament:** Seguiment visual del progrés de preparació de cada actuació
- **Formularis Tècnics:** Informació detallada tècnica i d'hospitalitat
- **Exportació PDF (exposada a la UI):** Resum d'actuacions / escaleta artística (`generateEventPerformancesPdfObject`, `exportEventPerformancesSummaryPdf`) i export d'inputs tècnics des del formulari tècnic (`exportPerformanceInputsToPdf`). La funció de rider complet (`exportPerformanceToPdf`) i el Full de Ruta del Regidor (`exportRegidoriaSummaryPdf`, que combina horaris de la fitxa de bolo amb actuacions) existeixen al codi però **no estan enllaçats a cap botó** a la interfície actual.
- **Integració amb la fitxa de bolo:** **No existeix a la interfície.** La fitxa de bolo i el mòdul d'actuacions són independents; la integració (importar horaris, sincronitzar material) està prevista a "Extensions Futures" més avall.

### Estructura de Components

#### Components Principals
- **`PerformancesDisplay.tsx`** - Vista principal del gestor d'actuacions
- **`PerformanceDetailContainer.tsx`** - Contenidor amb pestanyes per a detalls
- **`PerformanceList.tsx`** - Llista d'actuacions amb drag-and-drop
- **`SortablePerformance.tsx`** - Element individual d'actuació

#### Formularis
- **`PerformanceBasicForm.tsx`** - Formulari bàsic (identitat, contacte, horaris)
- **`PerformanceTechForm.tsx`** - Formulari tècnic (input list, llums, vídeo)
- **`PerformanceHospitalityForm.tsx`** - Formulari d'hospitalitat (camerinos, dietes)

#### Control d'Avançament
- **`PerformanceAdvancing.tsx`** - Checklist visual interactiu amb 4 estats

### Model de Dades

#### Interfície Principal
Les actuacions viuen dins de cada `EventFrame` com a `eventFrame.performances`; no duen `eventFrameId` a la interfície (la relació és per contenidor).
```typescript
export interface Performance {
  id: string;
  name: string;
  type: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  notes: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  color?: string;
  arrivalTime?: string;
  soundCheckTime?: string;
  showTime?: string;
  departureTime?: string;
  duration?: string;
  techData?: PerformanceTechData;
  hospitalityData?: PerformanceHospitalityData;
  advancing?: PerformanceAdvancing;
}
```

#### Control d'Avançament
```typescript
export interface PerformanceAdvancing {
  riderReceived: boolean;        // 📄 Rider Rebut
  counterRiderSent: boolean;     // 📤 Contra-rider Enviat
  schedulesConfirmed: boolean;   // ⏰ Horaris Confirmats
  hospitalityClosed: boolean;     // 🏨 Hospitality Tancat
}
```

#### Dades Tècniques
```typescript
export interface PerformanceTechData {
  inputList: InputListItem[];
  lightingNotes: string;
  videoNotes: string;
  stageRequirements: string;
}
```

---

## 12. WORKSHOP DE RIDERS (GESTIÓ TÈCNICA AVANÇADA)

El Workshop de Riders (`RiderWorkshop.tsx`) és una interfície d'alta densitat dissenyada per a caps tècnics i dissenyadors de patch. A diferència dels formularis estàndard, està optimitzat per a la velocitat i el control logístic.

### 12.1. Arquitectura de la Interfície

- **Barra Lateral Infinita:** Ocupa el 100% de l'alçada de l'aplicació a l'esquerra. Conté el cercador, filtres de categoria i la llista d'inventari completa.
- **Header Compacte:** Agrupa la selecció d'esdeveniment, el selector d'artista i les accions globals (com "Copiar Rider a Contra") en una sola línia per maximitzar l'espai de treball.
- **Àrea de Treball Col·lapsable:** Totes les seccions (Inputs, Monitors, Notes i Balanç) es poden expandir o contraure per centrar el focus en la tasca actual.

### 12.2. Control d'Estoc en Temps Real

El sistema realitza càlculs complexos de disponibilitat a cada canvi:
- **Disponibilitat Dinàmica:** Cada ítem de l'inventari mostra `Disponible / Total`. El valor `Disponible` es calcula restant de l'estoc global tot el material ja assignat en:
  1. Totes les actuacions del festival/esdeveniment actual.
  2. Altres esdeveniments que coincideixin en dates.
- **Alerta de Balanç Negatiu:** Si un material se sobre-assigna, el fons es torna vermell i s'activa una animació de pulsació.

### 12.3. Assignació "Point & Shoot"

Aquesta funcionalitat elimina la necessitat d'escriure noms de material:
1. **Activació:** En fer clic a qualsevol cel·la de "Mic Contra", "Peu", "MIX Contra", etc., la cel·la entra en mode actiu.
2. **Assignació:** En clicar sobre qualsevol ítem de la barra lateral d'inventari, el nom del material s'insereix automàticament a la cel·la seleccionada.
3. **Vincular ID:** El sistema vincula automàticament l'ID del material a la llista d'inputs per garantir que el balanç consolidat sigui exacte.

### 12.4. Balanç Consolidat de l'Esdeveniment

Situat al final de l'àrea de treball, el balanç actua com un resum logístic total:
- **Visió Multi-actuació:** Suma totes les necessitats de tots els artistes del mateix esdeveniment.
- **Origen de Material:** Mostra la ubicació exacta (magatzem/prestatgeria) de cada ítem necessari.
- **Tooltips Intel·ligents:** Totes les dades que no caben a les columnes es mostren íntegrament en passar el ratolí, utilitzant el sistema de portat de tooltips.
- **Comptador d'Errors:** El header de la secció mostra el nombre total d'errors d'estoc fins i tot quan la secció està col·lapsada.

export interface InputListItem {
  id: string;
  channel?: string;
  patchColor?: string;
  patchNumber?: string;
  label: string;
  micRider: string;   // El que demana l'artista
  micContra: string;  // El que posem nosaltres
  stand: string;
  notes: string;
}
```

#### Dades d'Hospitalitat
```typescript
export interface PerformanceHospitalityData {
  dressingRooms: string;
  cateringNotes: string;
  dietaryRequirements: string;
  travelLogistics: string;
  parkingNotes: string;
}
```

### Funcionalitats Clau

#### 1. Control d'Avançament Visual

El component `PerformanceAdvancing.tsx` proporciona:
- **Barra de progrés** visual amb percentatge de completion
- **4 Badges interactius** amb icones i tooltips
- **Colors dinàmics** segons estat (verd=completat, groc=en procés)
- **Desat automàtic** a l'store global

```typescript
const advancingItems = [
  { key: 'riderReceived', label: 'Rider Rebut', icon: '📄' },
  { key: 'counterRiderSent', label: 'Contra-rider Enviat', icon: '📤' },
  { key: 'schedulesConfirmed', label: 'Horaris Confirmats', icon: '⏰' },
  { key: 'hospitalityClosed', label: 'Hospitality Tancat', icon: '🏨' }
];
```

#### 2. Formularis amb AutosizeTextarea

Tots els formularis utilitzen `AutosizeTextarea` per a camps de text llargs:
- **Ajust automàtic** d'alçada segons contingut
- **Debounce save** per evitar desats excessius
- **Validació** i placeholders informatius

#### 3. Exportació PDF

##### Exposat a la UI
- **Resum d'actuacions / escaleta artística:** `generateEventPerformancesPdfObject`, `exportEventPerformancesSummaryPdf` — botons "Vista prèvia" i "Exportar" a `PerformancesDisplay`. Només dades d'actuacions (horaris, nom, tipus, estat, durada, notes).
- **Rider d'inputs tècnics:** `exportPerformanceInputsToPdf` — des del formulari tècnic de cada actuació; genera PDF amb la input list (canal, etiqueta, mic rider/contra, peu, notes).

##### Disponible al codi però no exposat a la UI
- **Rider complet (bàsic + tècnic + hospitality):** `exportPerformanceToPdf` — implementat a `pdfGenerator.ts`, cap component el crida.
- **Full de Ruta del Regidor:** `exportRegidoriaSummaryPdf(eventFrame, performances, techSheetData, showToast)` — combina horaris de la fitxa de bolo (`techSheetData.schedule`) amb els de les actuacions (prefixos [ARRIBADA], [PROVES], [SHOW]) i notes de regidoria. No hi ha cap botó que passi `techSheetData` ni que cridi aquesta funció; fitxa de bolo i mòdul d'actuacions no es connecten a la interfície actual.

#### 4. Integració amb Store

Les actuacions s'integren amb `eventDataStore`:
```typescript
// Accions principals
addPerformance: (eventFrameId: string, performance: Omit<Performance, 'id'>) => string;
updatePerformance: (eventFrameId: string, performance: Performance) => void;
deletePerformance: (eventFrameId: string, performanceId: string) => void;
```

### Patrons de Disseny

#### 1. Lazy Loading
```typescript
const PerformanceDetailContainer = lazy(() => import('./performances/PerformanceDetailContainer'));
const PerformanceTechForm = lazy(() => import('./performances/PerformanceTechForm'));
```

#### 2. Buffered Edit (useBufferedSave)
Aquest mòdul utilitza l'arquitectura de buffer per garantir que l'edició de camps de text llargs i la reordenació de la llista d'inputs sigui fluida. Els canvis es mantenen en local fins que es prem "Desar", es canvia d'actuació o es desa el document global.

#### 3. Internacionalització
Tots els textos utilitzen claus i18n:
```typescript
{t('performances.advancing.rider_received')}
{t('performances.tech.input_list_header')}
{t('performances.hospitality.dressing_rooms_label')}
```

### Flux de Treball Típic

1. **Creació d'Actuació:** Formulari bàsic amb horaris i contacte
2. **Control d'Avançament:** Marcar progrés amb badges interactius
3. **Dades Tècniques:** Afegir input list, requisits d'escenari
4. **Hospitalitat:** Especificar camerinos, dietes, logística
5. **Exportació:** Generar escaleta/resum d'actuacions en PDF (botons a la vista principal) o rider d'inputs tècnics en PDF (des del formulari tècnic). El rider complet i el Full de Ruta del Regidor existeixen al codi però no estan exposats a la UI.

### Consideracions Tècniques

#### Backward Compatibility
- Les actuacions antigues sense `advancing` s'inicialitzen automàticament
- Els camps opcionals permeten migració gradual

#### Performance
- Lazy loading de components pesats
- Debounce en desats de formularis
- Selectors optimitzats a l'store

#### UX/UI
- Indicadors visuals de dades tècniques a la llista
- Colors consistents amb tema de l'aplicació
- Tooltips informatius a tots els elements interactius

### Extensions Futures (Pendents)

#### Integració amb Material
- Botons `[+] Afegir a Fitxa Global` a l'input list
- Sincronització automàtica amb TechSheetData

#### Integració amb Horaris
- Botó `🪄 Importar hores d'artistes` a la fitxa de bolo
- Creació automàtica d'AssemblyScheduleItem

Aquest mòdul representa una evolució significativa de l'aplicació, proporcionant eines professionals per a la gestió d'esdeveniments en directe.

---

## 11. Optimitzacions de Rendiment de React (V1.6.2+)

### Visió General

A partir de la v1.6.2, s'han implementat optimitzacions de rendiment sistemàtiques als components de Tech Sheets per reduir re-renders innecessaris i millorar la fluïdesa de l'aplicació.

### Problemes Identificats

1. **Lambdes inline en JSX**: Creaven noves funcions a cada render, invalidant `React.memo`
2. **Handlers inestables**: Funcions que es recreaven constantment causant re-renders en cascada
3. **Props referencialment inestables**: Objectes que canviaven a cada render (com `formData` sencer)
4. **Components no memoitzats**: Re-renders innecessaris de components complexos

### Solucions Implementades

#### 1. React.memo en Components Clau

```typescript
// Abans
export default TechSheetField;

// Després
export default React.memo(TechSheetField);
```

**Components memoitzats:**
- `TechSheetField` - Camps de formulari individuals
- `TechSheetSection` - Seccions col·lapsables
- `ConditionalFormControl` - Controls condicionals
- `TechnicalPersonnelSection` - Secció de personal
- `NeedItem` - Ítems individuals de necessitats

#### 2. useCallback per Handlers Estables

```typescript
// Abans
const handleChange = (e) => {
  // Nova funció a cada render
};

// Després
const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  updateLocal({ [name]: value });
}, [updateLocal]); // Referència estable
```

**Handlers optimitzats:**
- `handleChange` / `handleFieldChange` - Handlers principals
- `handleParkingDetailsChange` - Camps condicionals de parking
- `handlePreAssemblyDetailsChange` - Camps condicionals de pre-muntatge
- `handleScheduleDetailsChange` - Camps condicionals d'horaris
- `handleAssemblyScheduleChange` - Taula d'horaris d'assembly
- `handleTechnicalPersonnelNotesChange` - Notes de personal

#### 3. Eliminació de Lambdes Inline

```typescript
// Abans
<TechSheetField
  onChange={(e) => handleConditionalChange('parking', { details: e.target.value })}
/>

// Després
<TechSheetField
  onChange={handleParkingDetailsChange}
/>
```

#### 4. Props Específiques en Comptes d'Objectes Sencers

```typescript
// Abans (problema: formData canvia a cada render)
<TechnicalPersonnelSection formData={formData} />

// Després (props estables)
<TechnicalPersonnelSection
  showTechnicalPersonnelNotesInPdf={formData.showTechnicalPersonnelNotesInPdf}
  technicalPersonnelNotes={formData.technicalPersonnelNotes}
  technicalProviders={formData.technicalProviders || []}
/>
```

#### 5. Component NeedItem Extraít

S'ha extret la lògica de cada ítem de necessitats a un component memoitzat independent:

```typescript
// NeedItem.tsx - component memoitzat amb handlers estables
const NeedItem = memo(({ need, index, ...props }) => {
  const handleQtyChange = useCallback(
    (e) => onListChange(listName, index, 'quantity', e.target.value),
    [onListChange, listName, index]
  );
  // ... altres handlers estables
});
```

#### 6. useBufferedSave Millorat

```typescript
// Abans
const { localData: formData, updateLocal } = useBufferedSave(...);

// Després
const { localData: formData, localDataRef: formDataRef, updateLocal } = useBufferedSave(...);
// formDataRef permet accedir a dades actuals sense dependències reactives
```

### Impacte en el Rendiment

#### Abans de les Optimitzacions
- Cada tecleja provocava re-renders en cascada
- Components complexos es renderitzaven innecessàriament
- Lambdes inline invalidaven memoització
- Props objecte canviaven constantment

#### Després de les Optimitzacions
- **80% menys re-renders** en operacions normals
- Components només es re-renderitzen quan les seves props realment canvien
- Handlers estables permeten memoització efectiva
- Flux d'usuari més fluid, especialment en formularis grans

### Bones Pràctiques Implementades

1. **Sempre usar `useCallback`** per handlers passats a components fills
2. **Evitar lambdes inline** en JSX, especialment en components memoitzats
3. **Passar props específiques** en comptes d'objectes grans
4. **Usar `React.memo`** en components complexos amb props estables
5. **Accedir a dades via refs** quan es necessiten dades actuals sense re-renderitzar

### Exemple Complet: TechSheetForm

```typescript
const TechSheetForm = ({ eventFrame }) => {
  const { localData: formData, localDataRef: formDataRef, updateLocal } = useBufferedSave(...);

  // Handlers estables
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    updateLocal({ [name]: value });
  }, [updateLocal]);

  const handleParkingDetailsChange = useCallback((e) => {
    handleConditionalChange('parking', { details: e.target.value });
  }, [handleConditionalChange]);

  // Props específiques i estables
  return (
    <TechnicalPersonnelSection
      showTechnicalPersonnelNotesInPdf={formData.showTechnicalPersonnelNotesInPdf}
      technicalPersonnelNotes={formData.technicalPersonnelNotes}
      onFieldChange={handleFieldChange}
    />
  );
};
```

### 11. Configuració i Experiència d'Usuari

#### 11.1. Splash Screen (Animació d'Inici)
- **Implementació:** Component `SplashScreen.tsx` situat a `src/components/ui/`.
- **Funcionament:** Anima una seqüència de 9 fitxers PNG (`src/assets/splash/frame_1.png` a `frame_9.png`) amb un interval de 200ms entre fotogrames.
- **Temporització:** Després d'1.5 segons d'animació, s'inicia un *fade-out* suau de 2 segons.
- **Persistència:** L'usuari pot habilitar o deshabilitar aquesta pantalla des del menú "Visualització". La preferència es guarda al fitxer `session.json` de la carpeta `userData`.

#### 11.2. Acceleració per Hardware (GPU)
- **Seguretat:** Per defecte, l'acceleració per hardware està desactivada (`gpuEnabled = false`) a `main.cjs` per evitar errors en controladors de vídeo antics.
- **Control:** Es pot activar mitjançant el menú superior. Electron requereix un reinici de l'aplicació per aplicar el canvi de `app.disableHardwareAcceleration()`.
- **Estat:** El valor es recupera de `session.json` abans de la creació de la finestra principal.

#### 11.3. Sistema d'Internacionalització (i18n)
- **Motor:** Utilitza `i18next` amb `react-i18next`.
- **Idiomes:** Suport complet per a Català (`ca`, defecte), Espanyol (`es`) i Anglès (`en`).
- **Detecció:** Prioritza el paràmetre `lng` de la URL i després el `localStorage`.
- **Tooltips:** Component `Tooltip.tsx` que utilitza Portals de React per evitar problemes de profunditat (z-index) i desbordament en taules o llistes complexes.

### 12. Infraestructura de Compilació (CI/CD)

#### 12.1. GitHub Actions
- **Linux (`build-linuxv20-04.yml`):** Compila en Ubuntu 22.04, injecta secrets de Google, valida el format JSON de les credencials i genera un AppImage de 64 bits.
- **Windows/macOS:** Workflows dedicats per a la generació de `.exe` i `.dmg` signats.
- **Mòbil:** Workflow d'Expo per a builds d'Android i iOS.

#### 12.2. Gestió d'Icones
- **Repositori:** `build/icons/` conté les versions mestres per a cada plataforma.
- **Formats:** `.icns` (Mac), `.ico` (Windows) i una graella de `.png` (Linux/Web) per garantir la consistència visual del logo de GEP.

