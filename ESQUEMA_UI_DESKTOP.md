# Esquema de la Interfície d'Usuari (UI) - Aplicació d'Escriptori (v1.5.0)

Aquest document detalla l'estructura visual, les funcionalitats i les interaccions de l'usuari a l'aplicació d'escriptori.

## 1. Estructura General

L'aplicació es compon d'una única finestra principal amb els següents elements:

- **Barra de Menú Superior**: Accés a totes les funcions principals de l'aplicació, amb icones d'accés ràpid a la dreta.
- **Barra de Navegació**: Pestanyes per canviar entre les diferents seccions principals.
- **Àrea de Contingut Principal**: On es mostra la secció seleccionada.

---

## 2. Pantalla de Benvinguda (`WelcomeScreen`)

Aquesta és la primera pantalla que veu l'usuari si no hi ha cap document obert.

- **Botó "Nou Document"**: Inicia un nou espai de treball buit.
- **Botó "Obrir Document"**: Obre un diàleg del sistema per seleccionar un fitxer `.gep` o `.json` existent.
- **Llista de "Fitxers Recents"**:
  - Mostra enllaços als darrers documents oberts.
  - Fer clic en un element obre directament aquell document.

---

## 3. Barra de Menú Superior (`CustomMenuBar`)

Aquesta barra substitueix el menú natiu. A la dreta, inclou icones d'accés ràpid per a **Desfer**, **Refer**, **Historial** i **Canviar Tema**.

### 3.1. Menú "Arxiu"
- **Nou Document**: Crea un espai de treball net.
- **Obrir...**: Obre un fitxer.
- **Obrir Recents**: Submenú amb la llista de fitxers recents.
- **Guardar** (`Ctrl+S`): Desa els canvis. Desactivat si no hi ha canvis.
- **Guardar com...** (`Ctrl+Shift+S`): Desa el document en un nou fitxer.
- **Importar / Exportar** (Submenú):
  - Importar/Exportar Persones...
  - Importar/Exportar Material...
- **Configuració Google Calendar** (Submenú):
  - Sincronitzar
  - Configurar
  - Connectar amb Google
- **Avançat** (Submenú):
  - Restaurar Configuració de Fàbrica...
- **Sortir** (`Ctrl+Q`): Tanca l'aplicació.

### 3.2. Menú "Edita"
- **Desfer** (`Ctrl+Z`): Reverteix l'última acció.
- **Refer** (`Ctrl+Y`): Torna a aplicar l'última acció desfeta.
- **Tallar** (`Ctrl+X`)
- **Copiar** (`Ctrl+C`)
- **Enganxar** (`Ctrl+V`)
- **Seleccionar tot** (`Ctrl+A`)

### 3.3. Menú "Veure"
- **Recarregar** (`Ctrl+R`)
- **Forçar Recàrrega** (`Ctrl+Shift+R`)
- **Eines de Desenvolupament** (`Ctrl+Alt+I`)
- **Restablir/Apropar/Allunyar Zoom**
- **Pantalla Completa** (`F11`)
- **Mostrar Animació d'Inici**: Activa o desactiva l'animació de benvinguda.

### 3.4. Menú "Ajuda"
- **Sobre l'aplicació...**: Obre el modal `AboutModal`.
- **Obrir Carpeta de Còpies de Seguretat**
- **Obrir Carpeta de Logs**

---

## 4. Secció Principal (`MainDisplay`)

Aquesta pantalla presenta una estructura plana (sense contenidor mestre plegable) per a un accés més directe a la informació.

### 4.1. Vista de Calendari (Secció Plegable Independent)
- **Funcionalitat**: Mostra tots els esdeveniments locals i de Google.
- **Interaccions**:
  - **Clic en un dia buit**: Obre el modal per **crear un nou esdeveniment**.
  - **Clic en un esdeveniment**: Obre el modal de **detalls** (local o de Google).
- **Controls**: Botons per canviar de vista (Mes, Setmana, Agenda, 2/4/6 Mesos), navegar i tornar a "Avui".

### 4.2. Llista d'Esdeveniments (Secció Plegable Independent)
- **Disseny XL**: Targetes de gran format per a millor llegibilitat.
- **Controls Generals**:
  - **Botó "Afegir Nou Marc"**: Obre el modal per crear un nou esdeveniment.
  - **Botó "Ordena"**: Canvia l'ordre per data (ascendent/descendent).
  - **Checkbox "Mostrar arxivats"**: Mostra o amaga els esdeveniments arxivats.
  - **Botó "Expandir/Col·lapsar Tot"**.
  - **Botó "Arxivar Antics"**: Busca i arxiva esdeveniments finalitzats fa més d'un mes.
  - **Botons "Exportar a PDF / CSV"**: Exporten la llista filtrada.
- **Panell de Filtres**:
  - **Cerca general**: Camp de text per buscar per nom, lloc, notes o persona.
  - **Filtres desplegables**: Per **Marc**, **Persona**, **Estat** i **Lloc**.
  - **Filtre de Data**: Per mostrar esdeveniments actius en una data específica.
  - **Botó "Netejar"**: Restableix tots els filtres.
- **Targeta d'Esdeveniment (`EventFrameCard`)**:
  - **Comportament de Focus**: En fer clic, la targeta es marca visualment (vora blava) per indicar que és l'element actiu, diferenciant-la de la resta encara que estiguin obertes.
  - **Capçalera**: Estat complet (icona gran), Títol, Lloc, Dates i accions ràpides.
  - **Cos**: Notes generals i llista d'assignacions.
  - **Targeta d'Assignació (`AssignmentCard`)**:
    - Inclou indicadors visuals d'estat (vora lateral de color) i botons d'acció grans.
    - Suport per a vista detallada de dies (multidia).

### 4.3. Resums (Secció Plegable Independent)
- Secció plegada per defecte.
- Genera informes basats en les dades filtrades actualment visibles a la llista.
- Secció plegada per defecte que mostra informes basats en les dades filtrades (per Esdeveniment, Data o Persona).
- Cada informe té opcions d'ordenació i exportació (CSV/PDF).

---

## 5. Secció de Personal (`PeopleDisplay`)

- **Formulari d'Afegir/Editar Contacte**: Camps per a Nom, Rol, Telèfons, Email, Web i Notes.
- **Llista de Contactes**: Amb controls per exportar (CSV/PDF), cercar i ordenar (per Nom o Rol). Cada contacte té botons per Editar i Eliminar.

---

## 6. Secció de Material (`MaterialDisplay`)

### 6.1. Gestor de Material
- **Formulari (`MaterialForm`)**: Per afegir/editar ítems (Nom, Categoria, Estoc, etc.).
- **Inventari (Llista)**: Amb controls de cerca i exportació. Es pot visualitzar **Per Categoria** (agrupat) o **Per Nom** (llista plana).

### 6.2. Centre de Control de Material
- Secció plegada per defecte per analitzar la demanda.
- **Filtres**: Per rang de dates, esdeveniments, ubicacions i categories.
- **Taula de resultats**: Mostra estoc, demanda i balanç, amb un desglossament per esdeveniment.
- **Exportacions**: A PDF (resum o detallat) i CSV.

---

## 7. Secció de Fitxes Tècniques (`TechSheetsDisplay`)

- **Selector d'Esdeveniment**: Per triar la fitxa a consultar o editar.
- **Formulari de Fitxa Tècnica (`TechSheetForm`)**:
  - Mostra tots els camps de la fitxa (horaris, contactes, material, etc.).
  - Mostra l'estoc disponible en temps real en afegir material.
