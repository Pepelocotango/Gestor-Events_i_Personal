# Esquema Visual de la Interfície d'Usuari - App Mòbil (v1.5.0)

Aquest document descriu l'estructura de l'aplicació mòbil, les seves pantalles i les funcions associades, reflectint la seva arquitectura actual.

---

### Filosofia de la Interfície

La interfície es basa en els següents principis:
- **Visualització Clara:** Les pantalles principals mostren la informació de manera clara i concisa, prioritzant la llegibilitat.
- **Navegació Intuïtiva:** L'ús d'una barra de pestanyes inferior (`BottomTabNavigator`) permet un accés ràpid a les seccions principals de l'aplicació.
- **Accions Contextuals:** Les accions de creació, edició i eliminació estan directament accessibles des de les pantalles de llista, ja sigui a través de botons a les capçaleres o en cada element individual.
- **Formularis Dedicats:** L'edició i creació de dades es realitza en pantalles de formulari dedicades per a una experiència d'usuari més enfocada.

---

### Capçalera Global (`CustomHeader`)

La capçalera superior és persistent a totes les pantalles i centralitza les accions més importants a nivell de fitxer:

- **Títol**: Mostra el nom del fitxer obert o el nom de l'aplicació.
- **Accions d'Historial (Esquerra)**:
  - **<Icona `undo`>**: Desfà l'última acció.
  - **<Icona `redo`>**: Refà l'última acció.
- **Accions de Fitxer (Dreta)**:
  - **<Icona `folder-open`> Obrir**: Si no hi ha cap fitxer obert.
  - **<Icona `save`>**: Desa els canvis al fitxer. S'activa només si hi ha canvis.
  - **<Icona `close`>**: Tanca el fitxer actual.

---

### Navegació Principal (Barra de Pestanyes Inferior)

L'aplicació es divideix en sis pestanyes principals, cadascuna amb la seva pròpia pila de navegació (`StackNavigator`):

- **Esdeveniments**: Gestiona els esdeveniments, les seves assignacions i els detalls.
- **Fitxes de Bolo**: Visualitza una llista centralitzada de totes les fitxes tècniques.
- **Persones**: Gestiona la llista de personal i proveïdors.
- **Material**: Gestiona l'inventari de material.
- **Centre de Control**: Ofereix una vista global de la demanda de material vs. l'estoc.
- **Resums**: Mostra resums de les assignacions de personal.

---

### 1. Pestanya "Esdeveniments"

Gestiona tot el cicle de vida dels esdeveniments.

#### 1.1. `EventsScreen`
- **Propòsit**: Pantalla principal que mostra la llista d'esdeveniments.
- **Estat Inicial (sense fitxer obert):**
  - Mostra un missatge de benvinguda i un botó "Obrir" per carregar un fitxer de dades.
- **Estat Principal (amb fitxer obert):**
  - **Controls de Filtre (`FilterControls`):** Permet filtrar la llista d'esdeveniments.
  - **Barra d'Accions (`ActionToolbar`):** Ofereix opcions per ordenar, veure arxivats i expandir/replegar totes les targetes.
  - **Llista d'Esdeveniments (`EventFrameCard`):** Mostra cada esdeveniment en una targeta expandible amb les seves assignacions.
- **Navegació**:
  - Un botó a la capçalera permet navegar a `EventFormScreen` per crear un nou esdeveniment.
  - Clicant en un esdeveniment, es navega a `EventDetailScreen`.
  - Botons a la targeta permeten editar (`EventFormScreen`) o eliminar l'esdeveniment.

#### 1.2. `EventDetailScreen`
- **Propòsit**: Mostra una vista detallada d'un sol esdeveniment i les seves assignacions.
- **Navegació**:
  - Permet navegar a `TechSheetDetailScreen` si l'esdeveniment té una fitxa de bolo associada.

#### 1.3. `EventFormScreen`
- **Propòsit**: Formulari per crear o editar un esdeveniment (`EventFrame`).
- **Mode**: El títol i la funcionalitat canvien dinàmicament ("Nou Esdeveniment" vs. "Editar Esdeveniment") en funció de si es passa un `eventId`.

#### 1.4. `AssignmentFormScreen`
- **Propòsit**: Formulari per crear o editar una assignació de personal a un esdeveniment.

---

### 2. Pestanya "Fitxes de Bolo"

Accés centralitzat a totes les fitxes tècniques.

#### 2.1. `TechSheetListScreen`
- **Propòsit**: Mostra una llista de tots els esdeveniments que tenen una fitxa de bolo.
- **Navegació**:
  - Clicant en un element de la llista, es navega a `TechSheetDetailScreen`.

#### 2.2. `TechSheetDetailScreen`
- **Propòsit**: Mostra una versió de **només lectura** d'una fitxa de bolo, amb tota la informació tècnica, horaris, personal, etc.
- **Reutilització**: Aquesta pantalla és accessible des de la pila d'Esdeveniments i des de la pila de Fitxes de Bolo.

---

### 3. Pestanya "Persones"

Gestiona la base de dades de contactes.

#### 3.1. `PeopleScreen`
- **Propòsit**: Mostra la llista de totes les persones i proveïdors.
- **Barra d'Eines (`PeopleToolbar`):** Inclou cerca i opcions d'ordenació.
- **Llista de Persones (`PersonListItem`):** Cada element mostra el nom, rol i detalls de contacte.
- **Navegació**:
  - Un botó a la capçalera permet navegar a `PersonFormScreen` per crear una nova persona.
  - Cada element té botons per editar (`PersonFormScreen`) o eliminar.

#### 3.2. `PersonFormScreen`
- **Propòsit**: Formulari per crear o editar una persona (`PersonGroup`).

---

### 4. Pestanya "Material"

Gestiona l'inventari de material tècnic.

#### 4.1. `MaterialScreen`
- **Propòsit**: Mostra l'inventari de material, agrupat per categories.
- **Barra d'Eines (`MaterialToolbar`):** Inclou cerca, opcions d'agrupació i botons per expandir/replegar totes les categories.
- **Llista de Material (`MaterialListItem`):** Les categories es poden expandir o replegar individualment.
- **Navegació**:
  - Un botó a la capçalera permet navegar a `MaterialFormScreen` per afegir un nou ítem.
  - Cada ítem té botons per editar (`MaterialFormScreen`) o eliminar.

#### 4.2. `MaterialFormScreen`
- **Propòsit**: Formulari per crear o editar un ítem de material (`MaterialItem`).

---

### 5. Pestanya "Centre de Control"

Analitza la disponibilitat del material.

#### 5.1. `MaterialControlScreen`
- **Propòsit**: Mostra una anàlisi del balanç entre l'estoc de material disponible i la demanda total requerida per tots els esdeveniments en un període.
- **Controls de Filtre (`MaterialControlFilters`):** Permet acotar l'anàlisi per esdeveniment, dates, etc.
- **Llista de Resultats (`MaterialControlList`):** Mostra cada ítem amb el seu estoc, demanda i el balanç resultant.

---

### 6. Pestanya "Resums"

Ofereix vistes agregades de les dades.

#### 6.1. `SummaryScreen`
- **Propòsit**: Mostra informes i resums de les assignacions de personal, agrupades per esdeveniment o per persona.
- **Controls**: Permet canviar el criteri d'agrupació i ordenació.
- **Llista de Resums (`SummarySection`):** Presenta les dades de manera agrupada i clara.
