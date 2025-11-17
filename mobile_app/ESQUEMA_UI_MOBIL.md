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
  - **Botons de Capçalera**:
    - `[ Desar ]`:
      - **Acció**: Inicia el procés de desat del fitxer.
      - **Estat**: Activat només si hi ha canvis no desats (`hasUnsavedChanges`).
    - `[ Tancar ]`:
      - **Acció**: Tanca el fitxer actual. Si hi ha canvis no desats, demana confirmació abans de descartar-los.
- **Llista d'Esdeveniments**:
  - Cada element de la llista mostra:
    - **Nom de l'Esdeveniment** (ex: "Concert de Primavera").
    - **Data d'Inici**.
    - **Estat del Personal** ("Complet" o "Incomplet").
  - **Accions per cada element**:
    - `[ Veure Detalls ]` (en prémer sobre l'element):
      - **Acció**: Navega a la pantalla de detalls de l'esdeveniment.
    - `[ Editar ]`:
      - **Acció**: Obre el formulari (`EventFormScreen`) per editar l'esdeveniment.
    - `[ Eliminar ]`:
      - **Acció**: Mostra un diàleg de confirmació abans d'eliminar l'esdeveniment.

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
  - Gestió d'assignacions de personal.
- **Botons**:
  - `[ Desar ]` o `[ Crear ]`:
    - **Acció**: Guarda els canvis o crea el nou esdeveniment.

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
  - **Botó**: `[ Afegir ]`
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
