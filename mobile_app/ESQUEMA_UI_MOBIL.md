# Esquema Visual de la Interfície d'Usuari - App Mòbil (v1.4.0)

Aquest document descriu l'estructura de l'aplicació mòbil, les seves pantalles i les funcions associades, reflectint la refactorització de la UI cap a un model més visual i interactiu.

---

### Filosofia de la Interfície

La nova interfície es basa en els següents principis:
- **Visualització Primer:** Les pantalles principals mostren la informació de manera clara i concisa, sense controls d'edició directes.
- **Icones sobre Text:** S'utilitzen icones per a la majoria de les accions per a una UI més neta.
- **Accions Centralitzades:** Les accions de creació es realitzen a través d'un Botó d'Acció Flotant (FAB), mentre que les accions de context (editar, eliminar) es troben a cada element de la llista. Les accions globals (ordenar, filtrar) es gestionen a través de barres d'eines (`Toolbars`) i modals.

---

### Capçalera Global (`CustomHeader`)

La capçalera superior és persistent i s'ha redissenyat per ser més minimalista.

- **Fila Superior**:
  - **Títol**: Mostra el nom del fitxer obert o el nom de l'aplicació.
- **Fila Inferior**:
  - **Accions d'Historial (Esquerra)**:
    - **<Icona `undo`>**: Desfà l'última acció.
    - **<Icona `redo`>**: Refà l'última acció.
  - **Accions de Fitxer (Dreta)**:
    - **<Icona `folder-open`> Obrir**: Si no hi ha cap fitxer obert.
    - **<Icona `save`>**: Desa els canvis al fitxer. S'activa només si hi ha canvis.
    - **<Icona `close`>**: Tanca el fitxer actual.

El botó "Afegir" s'ha eliminat d'aquesta barra.

---

### Botó d'Acció Flotant (FAB)

A cada pantalla principal (Esdeveniments, Persones, Material), hi ha un botó `+` a la cantonada inferior dreta que permet crear un nou element corresponent a la secció.

---

### Navegació Principal (Barra de Pestanyes Inferior)

L'aplicació es divideix en cinc pestanyes principals, cadascuna amb la seva pròpia pila de navegació:

- **Esdeveniments**: Gestiona els esdeveniments.
- **Persones**: Gestiona la llista de personal.
- **Material**: Gestiona l'inventari de material.
- **Centre de Control**: Ofereix una vista global de l'estat del material.
- **Resums**: Mostra resums de les assignacions de personal.

---

### 1. Pestanya "Esdeveniments" (`EventsScreen`)

**Estat Inicial (sense fitxer obert):**
- **Missatge**: Indica a l'usuari que ha d'utilitzar el botó "Obrir" de la capçalera.

**Estat Principal (amb un fitxer obert):**
- **Controls de Filtre (`FilterControls`):**
  - **Cerca general**: Camp de text per a cerques lliures.
  - **Selectors**: Pickers per filtrar per persona i esdeveniment.
  - **<Icona `filter-remove`>**: Botó per netejar tots els filtres.
- **Barra d'Accions (`ActionToolbar`):**
  - **<Icona `sort-calendar`> Data**: Ordena la llista per data (ascendent/descendent).
  - **<Icona `archive-eye`> Veure arxivats**: Mostra o amaga els esdeveniments arxivats.
  - **<Icona `arrow-expand`> Expandir**: Expandeix o replega totes les targetes de la llista.
- **Llista d'Esdeveniments (`EventFrameCard`):**
  - **Indicador d'Estat**: Un cercle de color clicable a l'esquerra indica si el personal de l'esdeveniment està complet:
    - **Taronja**: Pendent (el personal no està complet).
    - **Verd**: Completat (tot el personal assignat està confirmat).
  - **Accions a la Targeta (expandida)**:
    - **<Icona `pencil`>**: Obre el formulari per editar l'esdeveniment.
    - **<Icona `delete`>**: Elimina l'esdeveniment (amb confirmació).
    - **Botó "Veure Fitxa de Bolo"**: Si l'esdeveniment té una fitxa associada, apareix un botó que porta a la pantalla de només lectura `TechSheetDetailScreen`.

#### 1.1. Pantalla de Detall de l'Esdeveniment (`EventDetailScreen`)

Accessible en fer clic a una targeta d'esdeveniment. Mostra una vista detallada de l'esdeveniment i les seves assignacions. Des d'aquí també es pot navegar a la fitxa de bolo.

#### 1.2. Pantalla de Visualització de Fitxa de Bolo (`TechSheetDetailScreen`)

- **Propòsit**: Mostra una versió de **només lectura** de la fitxa de bolo.
- **Estructura**:
  - **Informació General**: Nom, lloc, data.
  - **Personal Tècnic**: Llista de proveïdors i rols.
  - **Horaris**: Planning de muntatge.
  - **Necessitats Tècniques**: Seccions per a llums, so, vídeo, etc.
  - **Contactes i Observacions**.
- **Interacció**: No hi ha camps editables, només visualització de dades.

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

### 4. Pestanya "Centre de Control" (`MaterialControlScreen`)

(Sense canvis significatius en la UI en aquesta refactorització).

- **Controls de Filtre (`MaterialControlFilters`):**
  - Cerca, selectors per esdeveniment, origen i categoria, i botó de neteja.
- **Llista de Resultats (`MaterialControlList`):**
  - Mostra el balanç d'estoc per a cada ítem de material.

---

### 5. Pestanya "Resums" (`SummaryScreen`)

(Sense canvis significatius en la UI en aquesta refactorització).

- **Controls**:
  - Botó d'Ordenació per canviar l'ordre.
- **Llista de Resums (`SectionList`):**
  - Agrupa les assignacions per esdeveniment o per persona.
