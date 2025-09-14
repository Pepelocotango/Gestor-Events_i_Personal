---------------------
## COMPROVAR SOLUCIO 
# PROBLEMA GOOGLE CREDENTIALS A MAC:
Conclusió del Problema:
L'aplicació compilada per a Linux funciona perquè el fitxer google-credentials.json està correctament empaquetat a dins.
L'aplicació compilada per a macOS falla amb l'error AUTH ERROR: googleAuthClient no inicialitzat perquè el fitxer google-credentials.json no hi és, i la funció loadGoogleCredentials() falla silenciosament, tal com vam diagnosticar a la sessió anterior.
Solució Estratègica:
La solució és senzilla i directa: hem de corregir l'ordre de les passes al fitxer build-macos12.yml perquè sigui idèntic al del workflow de Linux. Hem de crear els fitxers de credencials abans de cridar l'script de compilació.
-----------------------------------------------

## reset en desfer/refer al carregar dades!

-----------------------------------------------



## PROBLEMA DE DESAT AUTOMATIC MODALS LLISTA: (s'ha posat missatges toast a 2seg.POTSER JA NO CAL FER RES!!)
Diagnòstic del Problema (La Causa Arrel):
Estat Intern del Modal: El formulari per crear/editar un marc d'esdeveniment (EventFrameFormModal.tsx) gestiona el seu propi estat. Quan s'obre, inicialitza variables com name, place, startDate, etc., amb useState. Aquest estat viu i mor amb el component.
El Component Pare (App.tsx): App.tsx és el responsable de renderitzar tot, incloent-hi els modals i les notificacions "toast".
L'Esdeveniment Extern: A l'aplicació, les notificacions "toast" desapareixen automàticament després d'uns segons. Quan un toast desapareix, actualitza una variable d'estat a App.tsx per ocultar-se.
La Condició de Cursa:
Realitzes una acció (p. ex., carregar dades) que mostra un toast: "Dades carregades correctament".
Immediatament, obres el modal per crear un nou marc i comences a escriure ràpid.
Mentre estàs escrivint, el temporitzador del toast expira.
El toast actualitza l'estat a App.tsx, provocant que App.tsx es torni a renderitzar completament.
En re-renderitzar-se, App.tsx torna a executar la funció renderModalContent(). Això destrueix la instància antiga del teu formulari modal i en crea una de completament nova.
La nova instància del modal executa el seu useState de nou, inicialitzant tots els camps a buit (o als valors per defecte), fent que sembli que "s'han esborrat".
Per què no passa a les Fitxes de Bolo?
La teva observació és clau. A les Fitxes de Bolo (TechSheetForm.tsx), l'estratègia de "Desat Continu" fa que els canvis es propaguin ràpidament a l'estat central. Però, més important, el component TechSheetForm no es renderitza dins d'un condicional a App.tsx, sinó que forma part d'una ruta de react-router-dom. El seu cicle de vida és molt més estable i no es veu afectat de la mateixa manera per re-renderitzacions globals menors.
Solució Estratègica (El Patró Correcte):
La solució és un patró estàndard a React anomenat "Lifting State Up" (Pujar l'Estat). L'estat del formulari del modal no ha de viure dins del propi modal, sinó al component pare que el gestiona (App.tsx).
Crearem una nova variable d'estat a App.tsx per emmagatzemar les dades del formulari del modal que estigui obert.
Quan s'obri el modal, App.tsx inicialitzarà aquest estat.
App.tsx passarà els valors d'aquest estat i les funcions per modificar-lo (setters) al component modal com a props.
El modal es convertirà en un "component controlat", que simplement mostra les dades que rep i notifica al pare quan canvien, en lloc de gestionar el seu propi estat.
D'aquesta manera, si App.tsx es re-renderitza per qualsevol motiu, conservarà les dades del formulari al seu propi estat i les tornarà a passar al modal, evitant que es perdin.

---------------------------------------------------------

## Perque funciona diferent el guardat automàtic a les fitxes de bolo i a les altres llocs?
(Fitxes de Bolo): Sistema d'Estat a Dos Nivells**
    1.  **Estat Intern (`TechSheetForm.tsx`):** Un estat local (`useState`) es modifica a cada pulsació de tecla per a una UI optimista i reactiva.
    2.  **Sincronització amb Temporitzador (Debouncing):** Després d'una pausa, l'estat local complet del formulari es "commita" (s'envia) en bloc a l'estat global de l'aplicació (`useEventDataManager`). Aquesta acció única és la que es registra per al Desfer/Refer.

 (Altres Llocs): Modificació Directa de l'Estat Global**
    1.  **Estat Global Únic:** Les accions (crear esdeveniment, editar persona) modifiquen directament l'únic estat central (`useEventDataManager`). No hi ha un estat intermedi al component.
    2.  **Desat Explícit (Sessió):** L'estat es manté en memòria (`hasUnsavedChanges = true`), i la persistència real al disc només es produeix quan l'usuari ho demana explícitament (desa o surt).


--------------------------------------------------------


## al premer en links mail iniciar servidor correu per defecte


REVISAR SECCIONS NECESSITATS TÈCNIQUES NOMS

REVISAR "Actors" per nom més genèri@s 

REVISAR exportacions PDF fitxes tècniques, valors generals, específics de cada camp....

### millorar sortides pdf

millorar visualment molt més atractiu les fitxes de bolo sortida pdf
fer un brainstorm d'aixó

millorar i implementar sortides existents csv a pdf també.

----------------------------

### 📝 **Pla d'Acció Recomanat (Tasques Pendents)**

Aquest és el pla actualitzat amb les tasques pendents, organitzades per prioritat.



### millorar formulari fitxes bolo
millores aplicades en stocks i assignacions



### modals ( finestres) més grans

### afegir als builders de github actions .yml incloure en els comprimits el readme, developing, llicència i carpeta exemples json. s'ha provat no funciona. resultat doble zip






  


#### **✨ Millores de Funcionalitat i UX (Prioritat Mitjana)**




2.  **Reorganitzar la Interfície (`Controls.tsx`):**
    *   **Proposta:** La barra de controls té molts botons. Podríem simplificar-la movent les accions de "Carregar/Guardar" (Tot, Persones, Material) a un submenú desplegable per netejar la interfície.
    *   **Acció Recomanada:** Crear un component de menú desplegable i reorganitzar els botons dins de `Controls.tsx`.

#### **🛠️ Millores Tècniques i Neteja (Prioritat Baixa)**

1.  **Optimitzar la Sincronització amb Google (`main.cjs`):**
    *   **Deute Tècnic:** La sincronització actual esborra i reescriu tots els esdeveniments, la qual cosa és ineficient.
    *   **Acció Recomanada (a futur):** Implementar una **sincronització diferencial (delta sync)** que només actualitzi, creï o esborri els esdeveniments que han canviat, basant-se en la data de modificació.



#### implementar factures i presupostos
nova "pagina"






---------------------------------------------------------------------



# PLA D'EXPANSIÓ:
* MODULS:
        *   **"Magatzem"**
        *   **"Pressupostos"**
        *   **"Factures"**
        *   **"Documents"**

Totalment cert. M'he centrat en els mòduls de gestió i he omès el gestor de documents. Molt bona correcció.

Aquí tens el *prompt* completat, amb el quart mòdul ("Documents") afegit i integrat en la mateixa filosofia d'una vista separada i dedicada.

---

**PROMPT COMPLET PER A JULES (AGENT DE CODI)**

**Assumpte:** Expansió Funcional amb Vistes Dedicades per a Gestió Integral d'Esdeveniments

**Context:**
Jules, ets un arquitecte de software encarregat d'ampliar les capacitats de l'aplicació. L'objectiu és afegir noves seccions per a la gestió de material de magatzem, pressupostos, facturació i documents associats als esdeveniments.

**Requisit Arquitectònic Clau:** Cada nova funcionalitat ha de ser un mòdul independent amb la seva pròpia vista principal, accessible des de la barra de navegació superior, mantenint l'estructura actual de l'aplicació.

A continuació, et detallo el pla d'acció per a cada nou mòdul.

### Pas 1: Ampliar l'Aplicació a Nivell Global

**Objectiu:** Preparar l'estructura de l'aplicació per a les noves vistes.

1.  **Modifica `src/components/Navigation.tsx`:**
    *   Afegeix nous enllaços (`<NavLink>`) a la barra de navegació per a:
        *   **"Magatzem"**
        *   **"Pressupostos"**
        *   **"Factures"**
        *   **"Documents"**
    *   Assigna una icona adequada i representativa a cada nou enllaç.

2.  **Modifica `src/App.tsx`:**
    *   Afegeix les noves rutes (`<Route>`) dins del component `<Routes>`:
        *   `<Route path="/warehouse" element={<WarehouseDisplay />} />`
        *   `<Route path="/budgets" element={<BudgetsDisplay />} />`
        *   `<Route path="/invoices" element={<InvoicesDisplay />} />`
        *   `<Route path="/documents" element={<DocumentsDisplay />} />`
    *   Assegura't d'importar (amb `lazy`) els nous components de vista que crearàs.

### Mòdul A: Vista de "Magatzem" (Full de Magatzem / Pull List)

**Objectiu:** Crear una nova vista dedicada a generar llistes de material per preparar per als esdeveniments.

1.  **Crea un nou component de vista: `src/components/WarehouseDisplay.tsx`:**
    *   Aquesta vista contindrà un **selector d'esdeveniments** a la part superior per triar de quin esdeveniment es vol generar el full de magatzem.
    *   Un cop seleccionat un esdeveniment, ha de mostrar una **taula de resum** de tot el material necessari, agregant les llistes de necessitats (`lightingNeeds`, `soundNeeds`, etc.) de la seva `techSheet`.
    *   La taula ha d'estar **agrupada per categories de material** (Il·luminació, So, etc.). Les columnes han de ser: "Quantitat", "Nom de l'Ítem", "Origen" i "Ubicació (de l'inventari)".
    *   Ha d'incloure un botó prominent **"Exportar a PDF"**.

2.  **Lògica d'Exportació (`src/utils/pdfGenerator.ts`):**
    *   Crea una nova funció: `exportWarehouseListToPdf(eventFrame: EventFrame, materialItems: MaterialItem[])`.
    *   Ha de generar un PDF funcional i fàcil de llegir per a un operari de magatzem.

### Mòdul B: Vista de "Pressupostos"

**Objectiu:** Crear una vista completa per a la gestió de tots els pressupostos.

1.  **Amplia el Model de Dades (`src/types.ts`):**
    *   Implementa les interfícies `BudgetLineItem` i `Budget`, assegurant que cada `Budget` estigui vinculat a un `eventFrameId`.
    *   Afegeix `budgets: Budget[]` a la interfície `AppData`.

2.  **Amplia la Gestió d'Estat (`src/hooks/useEventDataManager.ts`):**
    *   Afegeix l'estat `budgets` i les funcions CRUD corresponents.
    *   Integra `budgets` a les funcions `loadData` i `exportData`.

3.  **Crea un nou component de vista: `src/components/BudgetsDisplay.tsx`:**
    *   Mostrarà una **taula principal amb tots els pressupostos**, filtrable i ordenable.
    *   Permetrà crear nous pressupostos associant-los a un `EventFrame`.
    *   Inclourà un formulari per editar els detalls i les línies de cada pressupost, amb càlculs automàtics.
    *   Cada fila tindrà accions per "Editar", "Eliminar" i "Exportar a PDF".

4.  **Lògica d'Exportació (`src/utils/pdfGenerator.ts`):**
    *   Crea la funció `exportBudgetToPdf(budget: Budget, eventFrame: EventFrame)`.

### Mòdul C: Vista de "Factures"

**Objectiu:** Crear una vista dedicada per a la gestió de la facturació.

1.  **Amplia el Model de Dades (`src/types.ts`):**
    *   Implementa les interfícies `InvoiceLineItem` i `Invoice`, amb enllaços a `eventFrameId` i opcionalment a `budgetId`.
    *   Afegeix `invoices: Invoice[]` a `AppData`.

2.  **Amplia la Gestió d'Estat (`src/hooks/useEventDataManager.ts`):**
    *   Implementa l'estat i les funcions CRUD per a les factures.
    *   Crea una funció `createInvoiceFromBudget(budgetId: string)`.

3.  **Crea un nou component de vista: `src/components/InvoicesDisplay.tsx`:**
    *   Estructura anàloga a `BudgetsDisplay.tsx`, amb una taula principal de totes les factures (filtrable/ordenable).
    *   Permetrà crear factures des de zero o a partir d'un pressupost aprovat.
    *   Cada fila tindrà accions per editar, eliminar, exportar i canviar l'estat ('Pagada', 'Vençuda').

4.  **Lògica d'Exportació (`src/utils/pdfGenerator.ts`):**
    *   Crea la funció `exportInvoiceToPdf(invoice: Invoice, eventFrame: EventFrame)`.

---

### Mòdul D: Vista de "Documents" (Gestor de Fitxers)

**Objectiu:** Crear una interfície per visualitzar i gestionar fitxers externs associats a cada esdeveniment dins del sistema de fitxers de l'usuari.

1.  **Amplia el Backend (`main.cjs`) i `preload.cjs`:**
    *   **Implementa el sistema de creació de carpetes automàtic:** Modifica `addEventFrame` (al hook) i afegeix un canal IPC (`create-event-folder`) perquè cada nou esdeveniment creï una carpeta a `~/Documents/Gestor_Esdeveniments/Events_[ANY]/[DATA]_[NOM_EVENT]`. Desa aquesta ruta a la propietat `folderPath` de l'objecte `EventFrame`.
    *   **Crea el canal `get-folder-tree`:** Aquest IPC ha de rebre una ruta de carpeta i retornar una estructura JSON que representi el seu contingut (carpetes i fitxers de manera recursiva).
    *   **Crea el canal `copy-files-to-event-folder`:** Aquest IPC ha de rebre una llista d'arxius (amb la seva ruta original) i una ruta de destinació, i encarregar-se de copiar-los.
    *   **Crea el canal `open-file-in-explorer`:** Aquest IPC ha de rebre una ruta de fitxer i utilitzar `shell.openPath()` per obrir-lo amb l'aplicació per defecte.

2.  **Crea un nou component de vista: `src/components/DocumentsDisplay.tsx`:**
    *   La vista tindrà un **selector d'esdeveniments** a la part superior.
    *   Quan se selecciona un esdeveniment, la vista farà una crida a `window.electronAPI.getFolderTree` amb el `folderPath` de l'esdeveniment.
    *   **Renderitzarà l'arbre de fitxers:** Crea un subcomponent recursiu per mostrar la llista niada de carpetes i fitxers.
    *   **Implementa el Drag and Drop:** Tota l'àrea de visualització de l'arbre ha de ser una "zona d'arrossegament". Quan l'usuari deixi anar fitxers, la vista ha d'extreure les seves rutes i cridar a `window.electronAPI.copyFilesToEventFolder`.
    *   Després d'una operació de còpia, la vista ha de **refrescar automàticament l'arbre de fitxers** i mostrar una notificació d'èxit o error.
    *   Fes que els noms dels fitxers a l'arbre siguin **clicables** per invocar `open-file-in-explorer`.

**Acció Final:**
Jules, si us plau, implementa aquestes quatre noves vistes com a mòduls independents i funcionals. Assegura't que la navegació, la gestió de dades i les interaccions amb el backend estiguin correctament integrades, transformant l'aplicació en una eina de gestió integral d'esdeveniments.


------------------------------------------------------------------------------------



# implementar sqlite base de dades

La teva preocupació és extremadament pertinent i demostra una visió a llarg termini excel·lent per a l'aplicació. Estàs identificant correctament el **principal taló d'Aquil·les** de l'enfocament actual: l'escalabilitat.

Anem a analitzar a fons els límits del format JSON i quina seria la solució professional per a una aplicació robusta.

### Part 1: Els Límits del Fitxer JSON Únic

El format JSON en si mateix no té un límit de mida especificat, però el seu ús en una aplicació com aquesta imposa **límits pràctics i de rendiment** molt reals.

1.  **Límit de Memòria (RAM) - El Més Crític:**
    *   **El Problema:** L'estratègia actual és "llegeix-ho tot, escriu-ho tot". Cada vegada que l'aplicació s'inicia o desa, el fitxer JSON **complet** ha de ser llegit del disc, convertit de text a objectes JavaScript (un procés anomenat *parsing*), i carregat íntegrament a la memòria RAM.
    *   **Impacte:** Un fitxer JSON de 100 MB al disc pot fàcilment ocupar 200-300 MB o més de RAM un cop convertit en objectes de JavaScript. A mesura que el fitxer creix, el consum de memòria es dispara, fent que l'aplicació sigui lenta i pugui arribar a bloquejar-se en ordinadors amb menys recursos.

2.  **Límit de Rendiment (CPU):**
    *   **El Problema:** El *parsing* d'un fitxer JSON gran consumeix molt de temps de CPU. Obrir l'aplicació o desar els canvis deixa de ser instantani. Un usuari podria experimentar temps d'espera de diversos segons cada vegada que desa, la qual cosa congela la interfície i degrada totalment l'experiència.
    *   **Impacte:** Una operació de desat que triga més d'un segon ja es percep com a lenta. Imagina un fitxer de 500 MB que podria trigar 10-15 segons a processar-se.

3.  **Risc de Corrupció de Dades:**
    *   **El Problema:** Què passa si l'ordinador es penja o es va la llum just al mig d'una operació d'escriptura del fitxer JSON? Hi ha un risc molt alt que el fitxer quedi **corrupte i il·legible**, la qual cosa podria portar a la **pèrdua total de totes les dades de l'usuari**.
    *   **Impacte:** Aquest és el risc més greu. L'enfocament de fitxer únic no és transaccional i no garanteix la integritat de les dades davant d'una fallada.

### Part 2: La Solució Professional - Una Base de Dades Local

Per superar tots aquests límits, el pas lògic i correcte és moure les dades d'un fitxer JSON a una **base de dades incrustada (embedded database)**.

Pensa-ho com la diferència entre tenir tota la informació d'una biblioteca en un únic llibre gegant (el JSON) o tenir-la en milers de llibres ordenats en prestatgeries amb un índex per trobar-los (la base de dades). Per consultar una dada, ja no cal llegir el llibre sencer.

Per a una aplicació Electron, l'opció més estàndard, robusta i recomanada és **SQLite**.

#### Per què SQLite és la Solució Perfecta per a Aquesta App?

*   **És un simple fitxer:** La teva base de dades sencera (taules, índexs, dades) viu en un únic fitxer al disc dur de l'usuari (p. ex., `database.sqlite`). És igual de portable que el JSON, però infinitament més potent.
*   **No requereix servidor:** Funciona directament dins de la teva aplicació. L'usuari no ha d'instal·lar res.
*   **Rendiment Extrem:** Les lectures i escriptures són extremadament ràpides. Per actualitzar un sol esdeveniment, només es modifica una petita part del fitxer, no el fitxer sencer. Pot gestionar gigabytes de dades sense cap problema de rendiment.
*   **Transaccions (ACID):** Això soluciona el problema de la corrupció. Les operacions es fan dins de "transaccions". Si una operació falla a la meitat, la base de dades automàticament torna a l'estat anterior, garantint que les dades **mai queden en un estat inconsistent o corrupte**.
*   **Consultes Potents (SQL):** Pots fer consultes complexes, filtrar, ordenar i unir dades de manera molt eficient directament a la base de dades, en lloc de carregar-ho tot a la memòria de JavaScript per filtrar-ho allà.

### Part 3: Com s'Implementaria el Canvi?

Aquesta seria una refactorització important, però molt beneficiosa.

1.  **Afegir la Dependència:** Instal·lar una llibreria per interactuar amb SQLite des de Node.js. La més recomanada per a Electron és `better-sqlite3`.
    ```bash
    npm install better-sqlite3
    ```

2.  **Crear una Capa d'Abstracció de Dades (Backend - `main.cjs`):**
    *   Es crearia un nou mòdul (p. ex., `database.cjs`) que s'encarregaria de tota la lògica de la base de dades:
        *   Funció d'inicialització que crea el fitxer de la base de dades i les taules (`event_frames`, `people_groups`, `assignments`, etc.) si no existeixen.
        *   Funcions per a cada operació CRUD: `getEventFrameById(id)`, `getAllEventFrames()`, `updatePersonGroup(person)`, `deleteAssignment(id)`, etc. Aquestes funcions executarien les consultes SQL corresponents.

3.  **Refactoritzar els Canals IPC:**
    *   Els gestors IPC a `main.cjs` ja no llegirien/escriurien a `events_data.json`. En lloc d'això, cridarien a les funcions del nou mòdul `database.cjs`.
    *   El canal `save-app-data` desapareixeria. En el seu lloc, hi hauria canals més granulars per a cada acció (`update-event-frame`, `add-person-group`, etc.), ja que cada canvi es desa a la base de dades a l'instant.

4.  **Refactoritzar el Hook del Frontend (`useEventDataManager.ts`):**
    *   La funció `loadData` canviaria per fer una única crida inicial a un nou IPC (`get-all-data`) que li retornaria l'estat inicial de la base de dades.
    *   Les funcions d'acció (`addEventFrame`, `updateEventFrame`, etc.) ja no només actualitzarien l'estat de React. Ara farien dues coses:
        1.  Actualitzar l'estat local de React per a una resposta instantània de la UI (UI optimista).
        2.  Cridar al canal IPC corresponent per persistir aquest canvi a la base de dades de SQLite.

5.  **Implementar una Migració per als Usuaris Existents:**
    *   En iniciar l'aplicació, el codi comprovaria: "Existeix el fitxer `database.sqlite`?".
    *   Si no existeix, comprovaria: "Existeix l'antic `events_data.json`?".
    *   Si el JSON existeix, l'aplicació el llegiria **per última vegada**, inseriria totes les dades a la nova base de dades SQLite, i finalment canviaria el nom del fitxer JSON a `events_data.json.migrated` per no tornar-lo a llegir.
    *   A partir d'aquell moment, l'aplicació només utilitzaria la base de dades.

### Conclusió

Estàs absolutament en el cert. Encara que el fitxer JSON és perfecte per començar i per a projectes de mida petita a mitjana, té un sostre de vidre molt clar.

La implementació d'una base de dades com **SQLite** és la solució estàndard i robusta que faria que l'aplicació fos **escalable, molt més ràpida, i immensament més segura** contra la pèrdua de dades. És una inversió de desenvolupament que paga la pena per a qualsevol aplicació d'escriptori seriosa que gestioni un volum de dades creixent.