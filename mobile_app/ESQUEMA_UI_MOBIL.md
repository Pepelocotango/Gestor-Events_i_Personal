# Esquema Visual de la Interfície d'Usuari - App Mòbil (v1.5.0)

Aquest document descriu l'estructura de l'aplicació mòbil, les seves pantalles i les funcions associades, reflectint la refactorització de la UI cap a un model més visual i interactiu.

---

### Filosofia de la Interfície

La nova interfície es basa en els següents principis:
- **Visualització Primer:** Les pantalles principals mostren la informació de manera clara i concisa, sense controls d'edició directes.
- **Icones sobre Text:** S'utilitzen icones per a la majoria de les accions per a una UI més neta.
- **Accions Centralitzades:** Les accions de creació es realitzen a través d'un Botó d'Acció Flotant (FAB), mentre que les accions de context (editar, eliminar) es troben a cada element de la llista. Les accions globals (ordenar, filtrar) es gestionen a través de barres d'eines (`Toolbars`) i modals.

---

### Capçalera Global i Gestió de Fitxers (`EventsScreen`)

La gestió de fitxers es centralitza a la pantalla d'esdeveniments:

- **Estat Inicial (sense fitxer obert):**
  - Un missatge de benvinguda i un botó gran per **"Obrir Fitxer"**.
- **Estat Principal (amb fitxer obert):**
  - **Capçalera**: Mostra el nom del fitxer obert.
  - **Botons**:
    - **Desar**: Actiu només si hi ha canvis. Activa el flux de "Desar Com a".
    - **Tancar**: Tanca el fitxer i torna a la pantalla de benvinguda.
    - **Desfer / Refer**: Icones per a la gestió de l'historial de canvis.

---

### Botó d'Acció Flotant (FAB)

A cada pantalla principal de llista (Esdeveniments, Persones, Material), hi ha un botó `+` a la cantonada inferior dreta que permet crear un nou element corresponent a la secció.

---

### Navegació Principal (Barra de Pestanyes Inferior)

L'aplicació es divideix en pestanyes principals a la part inferior, cadascuna amb la seva pròpia pila de navegació:

- **Esdeveniments**: Llista i gestiona els esdeveniments. És també la pantalla principal per a la gestió de fitxers.
- **Calendari**: Vista de calendari dels esdeveniments.
- **Persones**: Gestiona la llista de contactes/personal.
- **Material**: Gestiona l'inventari de material.

Les seccions de "Fitxes de Bolo", "Centre de Control" i "Resums" són funcionalitats exclusives de l'aplicació d'escriptori i no es troben a l'aplicació mòbil.

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
  - **Editor d'Assignacions**: Dins de la targeta expandida, cada assignació es pot expandir per veure i editar l'estat diari (Confirmat, Pendent, No disponible). Aquest canvi es pot fer directament a la llista.

---

### 3. Pestanya "Persones" (`PeopleScreen`)

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
