# Esquema Visual de la Interfície d'Usuari - App Mòbil

A continuació es detalla l'estructura de l'aplicació, les seves pantalles i les funcions associades.

---

### Navegació Principal (Barra de Pestanyes Inferior)

L'aplicació es divideix en tres pestanyes principals:

- **Esdeveniments**: Gestiona tot el relacionat amb els esdeveniments.
- **Persones**: Gestiona la llista de personal i els seus rols.
- **Material**: Gestiona l'inventari de material.

---

### 1. Pestanya "Esdeveniments"

Gestiona el flux de treball principal de l'aplicació.

#### 1.1. Pantalla Inicial / Llista d'Esdeveniments (`EventsScreen`)

Aquesta és la pantalla principal de l'aplicació.

**Estat Inicial (sense fitxer obert):**
- **Text de Benvinguda**: "Benvingut".
- **Botó**: `[ Obrir Fitxer ]`
  - **Acció**: Obre el selector de fitxers del sistema per carregar un fitxer de dades (`.json`).

**Estat Principal (amb un fitxer obert):**
- **Barra de Navegació Superior:**
  - **Títol**: Mostra el nom del fitxer obert (ex: `projecte.json`).
  - **Botons de Capçalera (Esquerra)**:
    - `[ Desfer ]`: Anul·la l'última acció.
    - `[ Refer ]`: Reverteix l'última acció anul·lada.
  - **Botons de Capçalera (Dreta)**:
    - `[ Afegir ]`: Obre el formulari (`EventFormScreen`) per crear un nou esdeveniment.
    - `[ Desar ]`: Inicia el procés de desat. S'activa només si hi ha canvis.
    - `[ Tancar ]`: Tanca el fitxer actual, demanant confirmació si hi ha canvis no desats.
- **Controls de Filtre**:
  - Un component a la part superior de la llista que permet filtrar els esdeveniments per:
    - Text (nom, lloc, notes, personal assignat).
    - Persona específica.
    - Estat d'assignació (Pendent, Confirmat, etc.).
- **Llista d'Esdeveniments**:
  - Es mostra en format de targetes expandibles (`EventFrameCard`).
  - **Vista Replegada**:
    - Nom de l'Esdeveniment.
    - Data d'Inici.
    - Resum de l'estat del personal.
  - **Vista Expandida**:
    - Mostra un resum detallat de les assignacions de personal.
  - **Accions per cada targeta**:
    - `[ Replegar / Expandir ]`: Canvia la visibilitat del detall d'assignacions.
    - `[ Editar Esdeveniment ]`: Obre `EventFormScreen` per editar l'esdeveniment.
    - `[ Eliminar Esdeveniment ]`: Demana confirmació abans d'eliminar.
    - `[ Afegir Assignació ]`: Obre `AssignmentFormScreen` per afegir una nova assignació de personal a l'esdeveniment.

#### 1.2. Pantalla de Detalls de l'Esdeveniment (`EventDetailScreen`)

Mostra una vista de només lectura d'un esdeveniment seleccionat.

- **Informació Mostrada**:
  - Nom de l'esdeveniment.
  - Lloc.
  - Data d'inici i fi.
  - Notes generals.
- **Secció d'Assignacions**:
  - Llista les assignacions de personal per a l'esdeveniment (ex: "Tècnic de So: Joan Petit").
- **Botons**: Cap. És una pantalla purament informativa.

#### 1.3. Formulari d'Esdeveniment (`EventFormScreen`)

Permet crear un nou esdeveniment o editar-ne un d'existent.

- **Títol de la Pantalla**:
  - "Nou Esdeveniment" (si es crea).
  - "Editar Esdeveniment" (si s'edita).
- **Camps del Formulari**:
  - Nom.
  - Lloc.
  - Data d'inici.
  - Data de fi.
  - Notes generals.
- **Botons**:
  - `[ Desar ]`: Guarda els canvis o crea el nou esdeveniment.

#### 1.4. Formulari d'Assignació (`AssignmentFormScreen`)

Permet assignar personal a un esdeveniment.

- **Títol de la Pantalla**:
  - "Nova Assignació" (si es crea).
  - "Editar Assignació" (si s'edita).
- **Camps del Formulari**:
  - **Selector de Persona/Grup**: Tria un professional de la llista.
  - **Selector d'Estat**: Canvia l'estat de l'assignació (Pendent, Confirmat, Rebutjat).
  - **Notes**: Anotacions específiques per a aquesta assignació.
- **Botons**:
  - `[ Desar Assignació ]`: Guarda els canvis.

---

### 2. Pestanya "Persones"

Gestiona la base de dades de persones i els seus rols.

#### 2.1. Pantalla de Llista de Persones (`PeopleScreen`)

- **Barra de Navegació Superior**:
  - **Títol**: "Persones".
  - **Botó**: `[ Afegir ]`
    - **Acció**: Obre el formulari (`PersonFormScreen`) per afegir una nova persona.
- **Llista de Persones**:
  - Cada element mostra:
    - **Nom de la Persona**.
    - **Rol** (ex: "Tècnic de llums").
  - **Accions per cada element**:
    - `[ Editar ]`:
      - **Acció**: Obre el formulari (`PersonFormScreen`) per editar la persona.
    - `[ Eliminar ]`:
      - **Acció**: Demana confirmació abans d'eliminar la persona.

---

### 3. Pestanya "Material"

Gestiona l'inventari de material tècnic.

#### 3.1. Pantalla de Llista de Material (`MaterialScreen`)

- **Barra de Navegació Superior**:
  - **Títol**: "Material".
  - **Botons**:
    - `[ Centre de Control ]`:
      - **Acció**: Navega a la pantalla `MaterialControlScreen`.
    - `[ Afegir ]`:
      - **Acció**: Obre el formulari (`MaterialFormScreen`) per afegir un nou ítem.
- **Llista de Material**:
  - Cada element mostra:
    - **Nom de l'ítem**.
    - **Stock** disponible (ex: "Stock: 10").
  - **Accions per cada element**:
    - `[ Editar ]`:
      - **Acció**: Obre el formulari (`MaterialFormScreen`) per editar l'ítem.
    - `[ Eliminar ]`:
      - **Acció**: Demana confirmació abans d'eliminar l'ítem.

#### 3.2. Centre de Control de Material (`MaterialControlScreen`)

Ofereix una vista global de l'estat de l'inventari en relació a la demanda dels esdeveniments.

- **Filtre de Cerca**: Permet buscar material pel nom o la categoria.
- **Llista de Balanç**:
  - Per a cada ítem de material, mostra:
    - **Nom de l'ítem**.
    - **Estoc**: Quantitat total disponible a l'inventari.
    - **Demanda**: Quantitat total necessària per a tots els esdeveniments.
    - **Balanç**: Diferència entre l'estoc i la demanda.
      - Es mostra en **verd** si el balanç és positiu (hi ha prou material).
      - Es mostra en **vermell** si el balanç és negatiu (falta material).
