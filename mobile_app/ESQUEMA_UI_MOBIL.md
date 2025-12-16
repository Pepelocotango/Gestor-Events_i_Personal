# Esquema Visual de la Interfície d'Usuari - App Mòbil (v1.5.0)

Aquest document descriu l'estructura de l'aplicació mòbil, les seves pantalles i les funcions associades, reflectint la refactorització de la UI cap a un model més visual i interactiu.

---

### Filosofia de la Interfície

La nova interfície es basa en els següents principis:
- **Visualització Primer:** Les pantalles principals mostren la informació de manera clara i concisa, sense controls d'edició directes.
- **Icones sobre Text:** S'utilitzen icones per a la majoria de les accions per a una UI més neta.
- **Accions Centralitzades:** Les accions de creació es realitzen a través d'un Botó d'Acció Flotant (FAB), mentre que les accions de context (editar, eliminar) es troben a cada element de la llista. Les accions globals (ordenar, filtrar) es gestionen a través de barres d'eines (`Toolbars`) i modals.

---

### Capçalera Global i Accions

La capçalera superior és persistent a totes les pantalles i conté accions globals i de gestió de fitxers.

- **Títol**: Mostra el nom del fitxer obert o el nom de l'aplicació.
- **Botons d'Acció (Visibles amb un fitxer obert):**
  - **<Icona `content-save-all-outline`> Desar a...**: Obre el gestor de fitxers per desar una còpia del document en una ubicació específica (emmagatzematge local, targeta SD, etc.). Ideal per a desar versions noves del document.
  - **<Icona `share-variant`> Compartir/Actualitzar**: **Acció recomanada per actualitzar fitxers en serveis al núvol** (Google Drive, Dropbox, etc.). Obre el menú de compartir per reemplaçar el fitxer original o enviar-lo a una altra app.
  - **<Icona `close-circle-outline`> Tancar**: Tanca el fitxer actiu i torna a la pantalla de benvinguda. Demana confirmació si hi ha canvis no desats.
- **Botons Globals (Sempre visibles):**
  - **<Icona `information-outline`> Sobre l'aplicació**: Obre un modal amb la informació de l'app.
  - **<Icona `sunny` / `moon`> Commutador de Tema**: Canvia entre el mode clar i fosc.
  - **<Icona `arrow-left`> Enrere**: Apareix quan es pot navegar a la pantalla anterior dins d'una pestanya.

---

### Botó d'Acció Flotant (FAB)

A cada pantalla principal de llista (Esdeveniments, Persones, Material), hi ha un botó `+` a la cantonada inferior dreta que permet crear un nou element corresponent a la secció.

---

### Navegació Principal (Barra de Pestanyes Inferior)

L'aplicació es divideix en pestanyes principals a la part inferior, cadascuna amb la seva pròpia pila de navegació:

- **Esdeveniments**: Llista i gestiona els esdeveniments. És també la pantalla principal per a la gestió de fitxers.
- **Calendari**: Vista de calendari dels esdeveniments.
- **Fitxes de Bolo**: Consulta de les fitxes tècniques.
- **Persones**: Gestiona la llista de contactes/personal.
- **Material**: Gestiona l'inventari de material.
- **Centre de Control**: Analitza la disponibilitat de material.
- **Resums**: Mostra vistes analítiques de les dades.

---

### 1. Pestanya "Esdeveniments" (`EventsScreen`)

**Estat Inicial (sense fitxer obert):**
- **Missatge**: Indica a l'usuari que ha d'utilitzar el botó "Obrir" de la capçalera.

**Estat Principal (amb un fitxer obert):**
- **Controls de Filtre (`FilterControls`):**
  - **Cerca general**: Camp de text per a cerques lliures.
  - **Selectors**: Per filtrar per persona i per esdeveniment específic.
  - **<Icona `filter-remove`>**: Botó per netejar tots els filtres.
- **Barra d'Accions (`ActionToolbar`):**
  - **<Icona `sort-calendar`> Data**: Ordena la llista per data (ascendent/descendent).
  - **<Icona `archive-eye`> Veure arxivats**: Mostra o amaga els esdeveniments arxivats.
  - **<Icona `arrow-expand`> Expandir**: Expandeix o replega totes les targetes de la llista.
- **Llista d'Esdeveniments (`EventFrameCard`):**
  - **Accions a la Targeta (expandida)**:
    - **<Icona `pencil`>**: Obre el formulari per editar l'esdeveniment.
    - **<Icona `delete`>**: Elimina l'esdeveniment (amb confirmació).
  - **Editor d'Assignacions**: Dins de la targeta expandida, cada assignació mostra el nom de la persona i, si s'ha especificat, el seu rol (`Nom - Rol`). També permet expandir-la per veure i editar l'estat diari (Confirmat, Pendent, No disponible).

---

### 2. Pestanya "Persones" (`PeopleScreen`)

- **Barra d'Eines (`PeopleToolbar`):**
  - **Cerca**: Camp de text per cercar persones.
  - **<Icona `sort`>**: Obre un modal per seleccionar el criteri d'ordenació (Nom, Rol).
  - **<Icona `filter-variant`>**: (Funcionalitat futura) Obre un modal per a filtres avançats.
- **Llista de Persones**:
  - Mostra el nom, rol i detalls de contacte de cada persona.
  - **Accions a cada element**:
    - **<Icona `pencil`>**: Obre el formulari per editar la persona.
    - **<Icona `delete`>**: Elimina la persona (amb confirmació).

---

### 3. Pestanya "Material" (`MaterialScreen`)

- **Barra d'Eines (`MaterialToolbar`):**
  - **Cerca**: Camp de text per cercar material.
  - **<Icona `sort`>**: Obre un modal per seleccionar el mètode d'agrupació (per Categoria, per Nom).
  - **<Icona `filter-variant`>**: (Funcionalitat futura).
  - **Fila d'Expansió**:
    - **<Icona `arrow-expand-vertical`>**: Expandeix totes les categories.
    - **<Icona `arrow-collapse-vertical`>**: Replega totes les categories.
- **Llista de Material (`SectionList`):**
  - Agrupada per categories.
  - **Capçaleres de Secció Col·lapsables**: Fent clic a la capçalera d'una categoria, s'expandeix o replega la llista d'ítems d'aquesta categoria.
  - **Accions a cada element**:
    - **<Icona `pencil`>**: Obre el formulari per editar l'ítem.
    - **<Icona `delete`>**: Elimina l'ítem (amb confirmació).

---

### 4. Formularis de Creació/Edició

Totes les pantalles de formulari (Esdeveniment, Persona, Material, Assignació) comparteixen una estructura similar:

- **Camps d'Entrada**: Controls natius (`TextInput`, `Switch`, etc.) per introduir les dades.
- **Validació**: Mostra missatges d'error si les dades no són correctes.
- **Botó "Desar"**: Desa els canvis i torna a la pantalla de llista.

#### Formulari d'Assignació (`AssignmentFormScreen`)

Aquest formulari inclou una funcionalitat addicional per al camp "Rol":

-   **Camp "Rol"**: Un nou camp de text permet especificar el rol d'una persona per a una assignació concreta.
-   **Autocompletat Intel·ligent**: Si se selecciona una persona que té un "Rol Base" definit a la seva fitxa de contacte i el camp "Rol" del formulari està buit, aquest s'omplirà automàticament amb el rol base. Això agilitza l'entrada de dades, però permet a l'usuari sobreescriure'l si cal un rol específic per a aquella assignació.

  