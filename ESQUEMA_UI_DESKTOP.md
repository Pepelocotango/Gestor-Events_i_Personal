# Esquema de la Interfície d'Usuari (UI) - Aplicació d'Escriptori

Aquest document detalla l'estructura visual, les funcionalitats i les interaccions de l'usuari a l'aplicació d'escriptori.

## 1. Estructura General

L'aplicació es compon d'una única finestra principal amb els següents elements:

- **Barra de Menú Superior**: Accés a totes les funcions principals de l'aplicació.
- **Barra de Controls**: Conté botons d'accés ràpid per a accions comunes.
- **Barra de Navegació**: Pestanyes per canviar entre les diferents seccions principals.
- **Àrea de Contingut Principal**: On es mostra la secció seleccionada.
- **Peu de Pàgina**: Informació de l'aplicació i enllaços.

---

## 2. Pantalla de Benvinguda (`WelcomeScreen`)

Aquesta és la primera pantalla que veu l'usuari si no hi ha cap document obert.

- **Botó "Nou Document"**: Inicia un nou espai de treball buit.
- **Botó "Obrir Document"**: Obre un diàleg del sistema per seleccionar un fitxer `.json` existent.
- **Llista de "Fitxers Recents"**:
  - Mostra enllaços als darrers documents oberts.
  - Fer clic en un element obre directament aquell document.

---

## 3. Barra de Menú Superior (`CustomMenuBar`)

Aquesta barra substitueix el menú natiu i ofereix les següents opcions:

### 3.1. Menú "Fitxer"
- **Nou Document** (`Ctrl+N`): Crea un espai de treball net. Si hi ha canvis sense desar, demana confirmació.
- **Obrir Document** (`Ctrl+O`): Obre un fitxer `.json`. Demana confirmació si hi ha canvis sense desar.
- **Obrir Recent**: Submenú amb la llista de fitxers recents per a un accés ràpid.
- **Desar** (`Ctrl+S`): Desa els canvis al fitxer actual. Si és un document nou, es comporta com "Desar Com...".
- **Desar Com...** (`Ctrl+Shift+S`): Obre un diàleg per desar el document en un nou fitxer `.json`.
- **Importar**:
  - **Importar Persones**: Obre un diàleg per seleccionar un fitxer `.json` que contingui una llista de contactes. Després, mostra un modal per "Fusionar" o "Reemplaçar" les dades.
  - **Importar Material**: Similar a l'anterior, però per a l'inventari de material.
- **Exportar**:
  - **Exportar Persones**: Desa la llista actual de contactes a un fitxer `.json`.
  - **Exportar Material**: Desa l'inventari actual de material a un fitxer `.json`.
- **Sortir** (`Ctrl+Q`): Tanca l'aplicació. Demana confirmació si hi ha canvis sense desar.

### 3.2. Menú "Edita"
- **Desfer** (`Ctrl+Z`): Reverteix l'última acció realitzada.
- **Refer** (`Ctrl+Y`): Torna a aplicar l'última acció desfeta.
- **Historial de Canvis**: Obre un modal (`HistoryModal`) que mostra la llista d'accions realitzades per desfer o refer múltiples canvis de cop.

### 3.3. Menú "Eines"
- **Sincronitzar amb Google Calendar**: Inicia el procés de sincronització bidireccional amb el calendari de Google configurat.
- **Configuració de Google Calendar**: Obre el modal `GoogleSettingsModal` per gestionar la configuració de sincronització.
- **Connectar/Desconnectar de Google**: Inicia el flux d'autenticació o tanca la sessió amb Google.

### 3.4. Menú "Veure"
- **Canviar Tema**: Alterna entre el tema clar i fosc de la interfície.
- **Activar/Desactivar Pantalla de Benvinguda**: Controla si la `SplashScreen` animada es mostra a l'inici.

### 3.5. Menú "Ajuda"
- **Obrir Carpeta de Logs**: Obre la carpeta del sistema on l'aplicació desa els fitxers de registre.
- **Obrir Carpeta de Còpies de Seguretat**: Obre la carpeta on es guarden les còpies de seguretat automàtiques.
- **Restaurar Configuració de Fàbrica**: Esborra la configuració de Google i la llista de fitxers recents. Demana confirmació.
- **Sobre...**: Obre el modal `AboutModal` amb informació de la versió de l'aplicació.

---

## 4. Secció Principal (`MainDisplay`)

Aquesta secció és el cor de l'aplicació i està dividida en tres àrees plegables.

### 4.1. Vista de Calendari
- **Funcionalitat**: Mostra tots els esdeveniments locals i de Google en una interfície de calendari.
- **Interaccions**:
  - **Clic en un dia buit**: Obre el modal per **crear un nou esdeveniment**.
  - **Clic en un esdeveniment**:
    - Si és un esdeveniment local, obre el modal de **detalls de l'esdeveniment**.
    - Si és de Google, obre un modal amb els **detalls de l'esdeveniment de Google**.
- **Controls**: Botons per canviar de vista (Mes, Setmana, Agenda, Multi-mes), navegar entre mesos i tornar a "Avui".

### 4.2. Llista d'Esdeveniments
Aquesta àrea mostra els esdeveniments en format de llista de targetes.

- **Controls Generals**:
  - **Botó "Afegir Nou Marc"**: Obre el modal per crear un nou esdeveniment.
  - **Botó "Ordena"**: Canvia l'ordre de la llista per data (ascendent/descendent).
  - **Checkbox "Mostrar arxivats"**: Mostra o amaga els esdeveniments marcats com a arxivats.
  - **Botó "Expandir/Col·lapsar Tot"**: Mostra o amaga el detall de totes les targetes d'esdeveniment.
  - **Botó "Arxivar Antics"**: Busca esdeveniments finalitzats fa més d'un mes i demana confirmació per arxivar-los.
  - **Botons "Exportar a PDF / CSV"**: Exporten la llista d'esdeveniments (respectant els filtres) a un fitxer.
- **Panell de Filtres**:
  - **Cerca general**: Camp de text per buscar per nom d'esdeveniment, lloc, notes o persona assignada.
  - **Filtres desplegables**: Per Marc, Persona, Estat i Lloc.
  - **Filtre de Data**: Per mostrar només esdeveniments actius en una data específica.
  - **Botó "Netejar"**: Restableix tots els filtres.
- **Targeta d'Esdeveniment (`EventFrameCard`)**:
  - Cada esdeveniment es mostra en una targeta que conté:
    - **Capçalera**: Nom, dates, lloc i botons per editar, eliminar, duplicar o arxivar l'esdeveniment.
    - **Cos (plegable)**: Llista de totes les assignacions de personal per a aquell esdeveniment.
  - **Interaccions per Assignació**:
    - **Canvi d'estat general**: Un menú desplegable per canviar l'estat de l'assignació (`Pendent`, `Confirmat`, `Rebutjat`).
    - **Vista diària (botó "dies")**: Expandeix l'assignació per mostrar un control d'estat per a cada dia.
    - **Botons "Editar" i "Eliminar"**: Per modificar o esborrar una assignació específica (demana confirmació).

### 4.3. Resums (`SummaryReports`)
Aquesta secció, plegada per defecte, mostra informes basats en les dades filtrades.

- **Tres targetes de resum**:
  1.  **Per Nom d'Esdeveniment**: Agrupa assignacions per esdeveniment.
  2.  **Per Data d'Inici d'Assignació**: Agrupa assignacions per la seva data d'inici.
  3.  **Per Persona/Grup**: Agrupa assignacions per la persona o grup assignat.
- **Funcionalitats de cada targeta**:
  - **Ordenació**: Botó per ordenar les dades (generalment per data).
  - **Exportació**: Botons per exportar el resum complet (CSV/PDF) o per exportar només les dades d'un grup específic (p. ex., un sol esdeveniment o una sola persona).
  - **Detall d'estats**: Si una assignació té un estat "Mixt", es mostra un desglossament dels estats per dia.

---

## 5. Secció de Personal (`PeopleDisplay`)

Aquesta pantalla es divideix en un formulari i una llista per a la gestió de contactes.

### 5.1. Formulari d'Afegir/Editar Contacte
- **Camps**: Nom (obligatori, únic), Rol, Telèfons, Email, Web i Notes.
- **Accions**:
  - **Afegir/Actualitzar**: Desa el contacte.
  - **Cancel·lar Edició**: Neteja el formulari.
  - **Eliminar**: Botó visible durant l'edició per eliminar el contacte (demana confirmació).

### 5.2. Llista de Contactes
- **Controls**:
  - **Exportar a CSV/PDF**: Exporta la llista filtrada.
  - **Cerca**: Filtra contactes per nom, rol, email o telèfon.
  - **Ordenació**: Botons per ordenar la llista per Nom o Rol.
- **Llista**:
  - Mostra cada contacte amb totes les seves dades.
  - **Accions per contacte**: Botons per **Editar** (carrega al formulari) i **Eliminar** (demana confirmació).

---

## 6. Secció de Material (`MaterialDisplay`)

Dividida en gestió d'inventari i un centre de control.

### 6.1. Gestor de Material
- **Formulari (`MaterialForm`)**: Per afegir o editar ítems de l'inventari.
  - **Camps**: Nom (obligatori, únic), Categoria, Estoc, Ubicació, Preu i Notes.
- **Inventari (Llista)**:
  - **Controls**: Cerca, exportació a PDF, i un selector per canviar el mode d'ordenació.
  - **Modes de Visualització**:
    1.  **Per Categoria**: Agrupa els ítems en seccions plegables per categoria. Permet ordenar els ítems dins de cada categoria.
    2.  **Per Nom d'Ítem**: Una llista plana ordenada alfabèticament.
  - **Accions per ítem**: Botons per **Editar** i **Eliminar**.

### 6.2. Centre de Control de Material
- Secció plegada per defecte que ofereix una anàlisi de la demanda de material.
- **Filtres**: Permet filtrar per rang de dates, esdeveniments específics, ubicacions de material i categories.
- **Taula de resultats**:
  - Mostra, per a cada ítem de material, l'**estoc total**, la **demanda total** (suma del necessari per als esdeveniments filtrats) i el **balanç**.
  - Cada fila es pot expandir per veure un **desglossament** de la demanda per cada esdeveniment.
- **Exportacions**: Botons per exportar la vista de la taula a **PDF (resum o detallat)** i **CSV**.

---

## 7. Secció de Fitxes Tècniques (`TechSheetsDisplay`)

Permet consultar i editar la fitxa tècnica de cada esdeveniment.

- **Selector d'Esdeveniment**: Un menú desplegable per triar l'esdeveniment del qual es vol veure la fitxa.
- **Formulari de Fitxa Tècnica (`TechSheetForm`)**:
  - Un cop seleccionat un esdeveniment, es mostra el formulari amb tots els camps rellevants de la fitxa (horaris, contactes, notes tècniques, llistat de material, etc.).
  - **Disponibilitat de Material**: El formulari mostra l'estoc disponible de cada material per a les dates de l'esdeveniment seleccionat, facilitant la planificació.
  - **Accions**: Permet editar i desar els canvis a la fitxa, afegir material des de l'inventari, etc.
