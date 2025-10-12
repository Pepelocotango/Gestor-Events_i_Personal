
### **Esquema de la Interfície d'Usuari (UI)**

#### 1. 📺 Pantalla de Benvinguda (Estat Inicial)

Aquesta és la primera pantalla que veu l'usuari abans d'obrir o crear un document.

*   **Component Principal:** `WelcomeScreen.tsx`
*   **Seccions:**
    *   **Títol i Missatge de Benvinguda:** Text introductori.
    *   **Accions Principals:**
        *   Botó **"Nou Document"**: Per començar un projecte des de zero.
        *   Botó **"Obrir..."**: Per carregar un fitxer `.json` existent.
    *   **Llista de Documents Recents:**
        *   Mostra una llista de fins a 10 fitxers oberts recentment.
        *   Cada element de la llista és un botó que permet obrir el fitxer directament.

---

#### 2. 🖥️ Interfície Principal (Amb un Document Obert)

Un cop s'ha creat o obert un document, l'usuari accedeix a la interfície principal, que consta d'elements persistents i vistes navegables.

##### **2.1. Elements Persistents de la UI**

Aquests components són sempre visibles, independentment de la vista seleccionada.

*   **Barra de Menú Personalitzada (`CustomMenuBar.tsx`):**
    *   Substitueix el menú natiu de l'aplicació.
    *   **Menús:**
        *   `Arxiu`: Accions de gestió de documents (Nou, Obrir, Guardar, Importar/Exportar), configuració de Google i Sortir.
        *   `Edita`: Accions bàsiques (Desfer, Refer, Copiar, Enganxar).
        *   `Veure`: Opcions de visualització (Recarregar, Zoom, Eines de Desenvolupament, Pantalla Completa, Activar/Desactivar Splash Screen).

*   **Panell de Controls (`Controls.tsx`):**
    *   **Informació del Fitxer:** Mostra la ruta del document actual.
    *   **Controls d'Historial:** Botons per Desfer/Refer i obrir el modal d'Historial.
    *   **Exportació de Llista:** Botons per exportar la vista actual a **PDF** o **CSV**.
    *   **Indicador de Canvis:** Un avís visual (`Canvis sense desar`) quan hi ha modificacions pendents.
    *   **Controls de Google:** Botons per Sincronitzar, Configurar i Connectar amb Google Calendar.
    *   **Canvi de Tema:** Botó per alternar entre el tema clar i fosc.

*   **Barra de Navegació (`Navigation.tsx`):**
    *   Permet canviar entre les quatre vistes principals de l'aplicació.

##### **2.2. Vistes Principals (Navegables)**

###### **A. 🗓️ Vista Principal: Calendari i Llista (`MainDisplay.tsx`)**

*   **Secció de Calendari:**
    *   Component `FullCalendar` interactiu.
    *   **Vistes disponibles:** 2 Mesos, 4 Mesos, 6 Mesos, Mes, Setmana, Agenda.
    *   Mostra els esdeveniments de l'aplicació i els esdeveniments externs de Google Calendar.
    *   Permet crear nous esdeveniments fent clic en una data.

*   **Secció de Llista d'Esdeveniments:**
    *   **Barra de Filtres:** Permet filtrar la llista per:
        *   Cerca de text general (nom, lloc, persona, notes).
        *   Marc d'esdeveniment específic.
        *   Persona o grup.
        *   Estat de l'assignació (Pendent, Sí, No, Mixt).
        *   Data específica.
        *   Lloc.
    *   **Llista d'Esdeveniments (`EventFrameCard.tsx`):**
        *   Cada esdeveniment es mostra en una targeta expandible.
        *   **Capçalera:** Nom, lloc, dates, botons per Editar, Eliminar, Afegir Assignació i veure Detalls.
        *   **Contingut:** Notes generals i una llista d'assignacions.
    *   **Targeta d'Assignació (`AssignmentCard.tsx`):**
        *   Dins de cada esdeveniment, mostra la persona assignada, les dates i l'estat.
        *   Controls per canviar l'estat general o diari (si és multidia).
        *   Botons per Editar i Eliminar l'assignació.

*   **Secció de Resums (`SummaryReports.tsx`):**
    *   Secció col·lapsable que genera tres tipus de resums de dades:
        *   Resum per Nom d'Esdeveniment.
        *   Resum per Data d'Inici d'Assignació.
        *   Resum per Persona/Grup.
    *   Cada resum es pot exportar individualment a **PDF** o **CSV**.

###### **B. 📄 Vista de Fitxes de Bolo (`TechSheetsDisplay.tsx`)**

*   **Selector d'Esdeveniment:** Un menú desplegable per triar de quin esdeveniment es vol veure/editar la fitxa tècnica.
*   **Formulari de Fitxa Tècnica (`TechSheetForm.tsx`):** Un formulari complex dividit en seccions col·lapsables:
    *   **Informació General:** Nom, lloc, data, hora, durada, notes generals i pàrquing.
    *   **Personal Tècnic:** Gestiona proveïdors i rols. Inclou un botó per actualitzar la llista a partir de les assignacions confirmades.
    *   **Premuntatge i Horaris:** Seccions per detallar la planificació.
    *   **Logística:** Gestió de camerinos, intèrprets i personal de la companyia.
    *   **Necessitats Tècniques:** Llistes detallades per a Il·luminació, So, Vídeo, Maquinària, Lloguers, etc.
    *   **Altres Detalls:** Ubicació del control i plànols.
    *   **Contacte i Observacions:** Llista de contactes i un camp per a notes finals.

###### **C. 👥 Vista de Persones (`PeopleDisplay.tsx`)**

*   **Formulari d'Edició/Creació:**
    *   Camps per a Nom, Rol, Telèfons, Email, Web i Notes.
    *   Validació per evitar noms duplicats.
*   **Llista de Contactes:**
    *   **Barra de Cerca i Accions:** Camp de cerca, botons per ordenar (per nom/rol) i botons per exportar la llista a **PDF** o **CSV**.
    *   **Targetes de Contacte:** Cada contacte es mostra amb les seves dades i botons per **Editar** o **Eliminar**.

###### **D. 📦 Vista de Material (`MaterialDisplay.tsx`)**

*   **Formulari d'Edició/Creació de Material (`MaterialForm.tsx`):**
    *   Camps per a Nom, Categoria, Estoc, Ubicació i Notes.
    *   Validació per evitar noms duplicats.
*   **Llista d'Inventari:**
    *   **Barra de Cerca i Accions:** Camp de cerca i botó per exportar l'inventari a **PDF**.
    *   **Controls d'Ordenació:** Permet ordenar la llista per **Categoria** (agrupat) o per **Nom d'Ítem** (llista plana).
    *   **Llista de Material:** Mostra cada ítem amb les seves dades i botons per **Editar** o **Eliminar**.
*   **Centre de Control de Material (`MaterialControlCenter.tsx`):**
    *   Una secció avançada i col·lapsable.
    *   **Filtres Avançats:** Permet filtrar per rang de dates, esdeveniments, orígens, categories i text.
    *   **Taula de Resultats:** Mostra una anàlisi de l'inventari amb columnes per a "Demanada", "Estoc" i "Balanç", ressaltant els desequilibris d'estoc.

#### 3. 💬 Modals (Finestres Emergents)

La majoria de les accions de creació, edició i confirmació es realitzen a través de modals.

*   **Creació i Edició:**
    *   `EventFrameFormModal`: Per a marcs d'esdeveniment.
    *   `AssignmentFormModal`: Per a assignacions.
    *   `AddMaterialFromTechSheetModal`: Per afegir un ítem a l'inventari des de la fitxa de bolo.
*   **Confirmació i Diàlegs:**
    *   `ConfirmDeleteModal`: Un diàleg genèric per a qualsevol acció d'eliminació.
    *   `ConfirmDuplicateModal`: Adverteix sobre assignacions duplicades.
    *   `ConfirmRepairModal`: Es mostra si es carreguen dades corruptes i s'han reparat.
    *   `MergeOrReplaceModal`: Pregunta si es vol fusionar o reemplaçar en importar dades.
*   **Visualització d'Informació:**
    *   `EventFrameDetailsModal`: Mostra un resum complet d'un esdeveniment.
    *   `HistoryModal`: Mostra l'historial de canvis (desfer/refer).
*   **Integració amb Google:**
    *   `GoogleSettingsModal`: Panell complet per gestionar calendaris, sincronització i desconnexió.
    *   `CreateCalendarModal`: Formulari per crear un nou calendari de l'app.
    *   `SelectSyncCalendarModal`: Permet triar el calendari de destinació per a la sincronització.
*   **Interaccions Específiques:**
    *   `UpdateFromAssignmentsModal`: Previsualitza i permet seleccionar els canvis a aplicar a la fitxa de bolo des de les assignacions.
