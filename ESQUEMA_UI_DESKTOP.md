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

Aquesta secció és el cor de l'aplicació i està dividida en àrees plegables.

### 4.1. Vista de Calendari
- **Funcionalitat**: Mostra tots els esdeveniments locals i de Google.
- **Interaccions**:
  - **Clic en un dia buit**: Obre el modal per **crear un nou esdeveniment**.
  - **Clic en un esdeveniment**: Obre el modal de **detalls** (local o de Google).
- **Controls**: Botons per canviar de vista (Mes, Setmana, Agenda, 2/4/6 Mesos), navegar i tornar a "Avui".

### 4.2. Llista d'Esdeveniments
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
  - **Capçalera**: Nom, dates, lloc i botons per editar, eliminar, duplicar o arxivar.
  - **Cos (plegable)**: Llista de les assignacions de personal.
  - **Interaccions per Assignació**: Canvi d'estat general, vista diària i botons d'editar/eliminar.

### 4.3. Resums (`SummaryReports`)
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

---

## 7. Integració amb Google Calendar

### 7.1. Sincronització amb Google Calendar
- **Autenticació**: L'aplicació permet autenticar-se amb Google Calendar mitjançant OAuth 2.0.
- **Àmbits d'accés**:
  - `userinfo.email`: Per obtenir l'adreça de correu electrònic de l'usuari
  - `userinfo.profile`: Per obtenir informació bàsica del perfil
  - `calendar.readonly`: Per llegir i sincronitzar esdeveniments

### 7.2. Dades Sincronitzades
Quan es sincronitza un esdeveniment amb Google Calendar, s'envia la següent informació:

- **Títol de l'esdeveniment**: El nom del marc d'esdeveniment
- **Ubicació**: El lloc de l'esdeveniment (si s'ha especificat)
- **Data d'inici i finalització**: Amb el format adequat per a Google Calendar
- **Descripció detallada** que inclou:
  - Període de l'esdeveniment (data d'inici i final)
  - Notes generals de l'esdeveniment
  - Llista completa d'assignacions, que inclou:
    - Nom de la persona/grup assignat
    - Període de l'assignació
    - Estat de l'assignació (Confirmat, Pendent, No, o Mixt)
    - En cas d'estat Mixt, detall de les dates amb cada estat
    - Notes específiques de l'assignació (si n'hi ha)

### 7.3. Configuració de la Sincronització
- **Freqüència**: La sincronització es pot realitzar manualment des del menú d'ajustos
- **Sincronització automàtica**: Opció per activar/desactivar la sincronització automàtica
- **Selecció de calendaris**: Permet triar amb quins calendaris de Google sincronitzar

### 7.4. Seguretat i Privadesa
- Les credencials d'autenticació s'emmagatzemen de forma segura al sistema
- L'aplicació només té accés de lectura als calendaris de Google
- Es pot revocar l'accés en qualsevol moment des de la configuració del compte de Google
- **Taula de resultats**: Mostra estoc, demanda i balanç, amb un desglossament per esdeveniment.
- **Exportacions**: A PDF (resum o detallat) i CSV.

---

## 7. Secció de Fitxes Tècniques (`TechSheetsDisplay`)

- **Selector d'Esdeveniment**: Per triar la fitxa a consultar o editar.
- **Formulari de Fitxa Tècnica (`TechSheetForm`)**:
  - Mostra tots els camps de la fitxa (horaris, contactes, material, etc.).
  - Mostra l'estoc disponible en temps real en afegir material.
