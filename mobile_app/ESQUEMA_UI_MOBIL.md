# Esquema Visual de la Interfície d'Usuari - App Mòbil

A continuació es detalla l'estructura de l'aplicació, les seves pantalles i les funcions associades.

---

### Capçalera Global (`CustomHeader`)

A la part superior de l'aplicació, hi ha una capçalera persistent que és visible a totes les pantalles. Està dividida en dues files:

- **Fila Superior**:
  - **Títol**: Mostra el nom del fitxer obert (ex: `projecte.json`) o "Gestor d'Esdeveniments" si no n'hi ha cap.
- **Fila Inferior**:
  - **Botons Esquerra**:
    - `[ Desfer ]`: Anul·la l'última acció.
    - `[ Refer ]`: Reverteix l'última acció anul·lada.
  - **Botons Dreta**:
    - `[ Obrir ]`: Si no hi ha cap fitxer obert, permet carregar-ne un.
    - `[ Afegir ]`: Si hi ha un fitxer obert, permet crear un nou esdeveniment.
    - `[ Desar ]`: Desa els canvis fets al fitxer. S'activa només si hi ha canvis.
    - `[ Tancar ]`: Tanca el fitxer actual.

---

### Navegació Principal (Barra de Pestanyes Inferior)

L'aplicació es divideix en quatre pestanyes principals:

- **Esdeveniments**: Gestiona el flux de treball principal relacionat amb els esdeveniments.
- **Persones**: Gestiona la llista de personal.
- **Material**: Gestiona l'inventari de material.
- **Centre de Control**: Ofereix una vista global de l'estat del material.

---

### 1. Pestanya "Esdeveniments" (`EventsScreen`)

**Estat Inicial (sense fitxer obert):**
- **Missatge**: Indica a l'usuari que ha d'utilitzar el botó "Obrir" de la capçalera.

**Estat Principal (amb un fitxer obert):**
- **Controls de Filtre (`FilterControls`):**
  - **Cerca general**: Camp de text per a cerques lliures.
  - **Selectors**: Pickers per filtrar per esdeveniment, persona, estat i lloc.
  - **Botó `[ Netejar ]`**: Restableix tots els filtres.
- **Barra d'Accions (`ActionToolbar`):**
  - **Ordenació**: Botó per canviar l'ordre de la llista (ascendent/descendent).
  - **Arxivats**: Interruptor per mostrar o amagar els esdeveniments arxivats.
  - **Expansió**: Botó per expandir o replegar totes les targetes de la llista.
- **Llista d'Esdeveniments (`EventFrameCard`):**
  - Targetes expandibles que mostren la informació de cada esdeveniment i les seves assignacions.

---

### 2. Pestanya "Persones" (`PeopleScreen`)

- Llista el personal disponible.
- Permet afegir, editar i eliminar persones.

---

### 3. Pestanya "Material" (`MaterialScreen`)

- Llista l'inventari de material.
- Permet afegir, editar i eliminar ítems.

---

### 4. Pestanya "Centre de Control" (`MaterialControlScreen`)

- **Controls de Filtre (`MaterialControlFilters`):**
  - **Cerca general**: Camp de text.
  - **Selectors**: Pickers per filtrar per esdeveniment, origen del material i categoria.
  - **Botó `[ Netejar ]`**: Restableix els filtres.
- **Llista de Resultats (`MaterialControlList`):**
  - Mostra una llista de cada ítem de material amb el seu balanç (estoc - demanda).
  - Cada ítem es pot expandir per veure un desglossament de la demanda per esdeveniment.
  - El balanç es ressalta en vermell si és negatiu.
