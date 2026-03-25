# Esquema de la Interfície d'Usuari (UI) - Aplicació d'Escriptori (v1.6.3)

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
- **Acceleració per Hardware (GPU)**: Permet activar o desactivar l'acceleració gràfica per hardware. Millora l'estabilitat en equips antics si es desactiva.

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
  - **Lògica d'Expansió**: L'expansió i el col·lapse del contingut s'activa exclusivament fent clic a la capçalera de la targeta (àrea XL). El cos de la targeta permet la selecció de text sense tancar-se.
  - **Capçalera**: Estat complet (icona gran), Títol, Lloc, Dates i accions ràpides. Actua com l'únic actuador per al plegat/expandit.
  - **Cos**: Notes generals i llista d'assignacions.
  - **Targeta d'Assignació (`AssignmentCard`)**:
    - Mostra el nom de la persona i el seu rol específic (`Nom - Rol`) si està definit.
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

---

## 8. Secció d'Actuacions (`PerformancesDisplay`) - **NOVA FUNCIONALITAT FASE 4**

### 8.1. Vista Principal del Gestor d'Actuacions

- **Selector d'Esdeveniment**: Desplegable per seleccionar l'esdeveniment marc on gestionar les actuacions.
- **Botó "Exportar Resum d'Actuacions (PDF)"**: Genera un PDF amb la llista completa d'actuacions de l'esdeveniment.
- **Missatge si no hi ha esdeveniment seleccionat**: Indicador visual quan no s'ha seleccionat cap esdeveniment.

### 8.2. Layout de Dues Columnes

#### Columna 1: Llista d'Actuacions (`PerformanceList`)
- **Llista ordenable**: Drag-and-drop per reorganitzar l'ordre de les actuacions.
- **Botó "Afegir Actuació"**: Crea una nova actuació amb dades per defecte.
- **Indicadors visuals**: Icones especials quan una actuació té dades tècniques (input list).
- **Element d'actuació (`SortablePerformance`)**:
  - **Nom de l'actuació** amb horaris principals (show time)
  - **Botons d'acció**: Editar, Eliminar
  - **Indicador de dades tècniques**: Icona 📋 si té input list o dades tècniques

#### Columna 2: Detall de l'Actuació (`PerformanceDetailContainer`)
- **Pestanyes horitzontals**: Bàsic | Tècnic | Hospitality
- **Contingut condicional**: Només es mostra si hi ha una actuació seleccionada

### 8.3. Control d'Avançament (`PerformanceAdvancing`)

Situat a la part superior del detall de l'actuació, proporciona:

- **Barra de progrés visual**: Percentatge de completion amb colors dinàmics
- **4 Badges interactius** amb icones i tooltips:
  - 📄 **Rider Rebut**: El rider tècnic ha estat rebut
  - 📤 **Contra-rider Enviat**: El contra-rider ha estat enviat
  - ⏰ **Horaris Confirmats**: Els horaris han estat confirmats
  - 🏨 **Hospitality Tancat**: Els requeriments d'hospitalitat estan tancats
- **Colors segons estat**: Verd (completat), Groc (en procés), Gris (pendent)
- **Desat automàtic**: Cada canvi es desa immediatament a l'store

### 8.4. Pestanya "Bàsic" (`PerformanceBasicForm`)

Formulari amb informació essencial de l'actuació:

#### Secció d'Identitat
- **Nom de l'Actuació**: Camp de text obligatori
- **Persona de Contacte**: Nom del contacte principal
- **Email de Contacte**: Correu electrònic del contacte
- **Telèfon de Contacte**: Telèfon del contacte

#### Secció d'Horaris
- **Hora d'Arribada**: Quan arriba l'artista
- **Hora de Proves (Soundcheck)**: Quan comencen les proves
- **Hora del Show**: Quan comença l'actuació
- **Hora de Sortida**: Quan se'n va l'artista

#### Secció d'Notes
- **Notes Generals**: Camp de text llarg per observacions addicionals

### 8.5. Pestanya "Tècnic" (`PerformanceTechForm`)

#### Input List (Taula Dinàmica)
- **Columnes**: Canal, Etiqueta, Mic/DI, Notes
- **Botó "Afegir Fila"**: Afegeix noves línies a la taula
- **Botó "Eliminar"**: Elimina cada fila individualment
- **Autosave**: Cada canvi es desa automàticament

#### Notes Tècniques
- **Notes de Llums**: Requeriments d'il·luminació
- **Notes de Vídeo**: Requeriments de vídeo
- **Necessitats d'Escenari**: Requeriments d'escenari i estructura

### 8.6. Pestanya "Hospitality" (`PerformanceHospitalityForm`)

#### Camerinos i Catering
- **Camerinos**: Descripció dels espais necessaris
- **Càtering i Dietes**: Requeriments de menjar i begudes
- **Requeriments Dietètics**: Restriccions i preferències alimentàries

#### Logística
- **Logística de Viatge**: Informació de transport i horaris
- **Pàrquing**: Requeriments d'aparcament

### 8.7. Funcionalitats d'Exportació PDF

#### Rider Individual
- **Botó "Exportar Rider PDF"**: Disponible al detall de cada actuació
- **Contingut**: Tota la informació de l'actuació (bàsic, tècnic, hospitality)
- **Format**: PDF professional amb capçaleres i taules formatades

#### Full de Ruta del Regidor ⚠️ PENDENT D'IMPLEMENTACIÓ A LA UI
- **Estat**: La funció `exportRegidoriaSummaryPdf()` **existeix a `pdfGenerator.ts`** però **no està accessible des de la interfície** (no hi ha cap botó que la cridi).
- **Contingut previst**: Escaleta combinada amb horaris generals de la fitxa de bolo + horaris d'actuacions
- **Característiques previstes**:
  - Horaris generals de la fitxa de bolo (`techSheetData.schedule`)
  - Horaris d'actuacions amb prefixos [ARRIBADA], [PROVES], [SHOW]
  - Notes crítiques de regidoria extretes automàticament
  - Ordenació cronològica per prioritat i hora
- **Per implementar**: Cal afegir un botó a `PerformancesDisplay` que passi `techSheetData` i cridi `exportRegidoriaSummaryPdf(eventFrame, performances, techSheetData, showToast)`.

### 8.8. Interaccions i UX

#### Estat Visual
- **Colors consistents**: Utilitza el tema de colors de l'aplicació
- **Tooltips informatius**: Tots els elements interactius tenen ajuda contextual
- **Indicadors de progrés**: Feedback visual constant sobre l'estat d'avançament

#### Rendiment
- **Lazy loading**: Els components pesats es carreguen sota demanda
- **Debounce save**: Evita desats excessius als formularis
- **Optimització de renderitzat**: Selectors eficients a l'store

#### Accessibilitat
- **Navegació per teclat**: Tot l'interfície és accessible via teclat
- **Contrastes adequats**: Cumpleix amb estàndars d'accessibilitat
- **Textos descriptius**: Tots els elements tenen etiquetes clares

### 8.9. Flux de Treball Típic

1. **Selecció d'Esdeveniment**: Triar l'esdeveniment marc
2. **Creació d'Actuacions**: Afegir actuacions amb informació bàsica
3. **Control d'Avançament**: Marcar progrés amb els badges interactius
4. **Compleció de Dades**: Omplir formularis tècnics i d'hospitalitat
5. **Exportació**: Generar riders individuals o resum d'actuacions en PDF. *(El Full de Ruta del Regidor és pendent d'exposar a la UI)*

Aquesta nova secció proporciona eines professionals per a la gestió completa d'actuacions artístiques, integrant-se perfectament amb la resta de funcionalitats de l'aplicació.
