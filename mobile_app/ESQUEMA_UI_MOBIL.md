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
  - **<Icona `content-save`> Desar**: Guarda els canvis al fitxer actual. Està desactivat si no hi ha canvis pendents.
  - **<Icona `content-save-all-outline`> Desar com...**: Permet desar el contingut actual en un fitxer nou, amb un nom o ubicació diferent.
  - **<Icona `close-circle-outline`> Tancar**: Tanca el fitxer actiu i torna a la pantalla de benvinguda.
- **Botons Globals (Sempre visibles):**
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

  ---

  ## Novetats i notes d'implementació (v1.5.0)

  Aquestes notes recullen els canvis recents a l'aplicació mòbil relacionats amb la unificació del tema, correcció d'ombres i petits ajustos d'interfície sol·licitats durant la refactorització.

  - **Font única de colors:** S'ha centralitzat la paleta en `mobile_app/src/utils/themeConfig.ts` (variables semàntiques) i s'exposen a través de `mobile_app/src/utils/themes.ts`. Els components han de consumir els colors via `themes.ts` (no usar hexos directes al codi).
  - **Colors semàntics:** S'han afegit claus semàntiques per estats (ex: `status-yes`, `status-pending`, `status-no`, `status-mixed`), color `destructive` per icones d'eliminació i `shadow` per a ombres coherents entre temes.
  - **Ombres grises (millor visibilitat):** `shadow` està configurat amb un gris (`#808080`) per ser visible tant en mode clar com fosc; s'ha substituït qualsevol `shadowColor: '#000'` per la clau semàntica del tema.
  - **Calendar:** El color del text del dia seleccionat ara depèn del tema (`selected-day-text`) perquè la selecció sigui llegible en ambdós modes.
  - **Pickers / Selectors:** s'han ajustat estils de contenidor (mínima alçada, padding i `overflow`) per evitar que la línia o la ombra del contenidor creui l'etiqueta del picker en pantalles petites o nadius (issue reportada a 'Totes les persones' / 'Tots els esdeveniments').
  - **Tech-sheet (camp de només lectura):** `ReadOnlyField.tsx` s'ha ajustat per usar colors del tema i millorar l'alineació i la llegibilitat del rètol i del valor.

  ## Fitxers principals modificats

  Per referència ràpida, aquí va una llista dels arxius del projecte mòbil que s'han actualitzat durant la refactorització del tema i les correccions UI (no exhaustiva, però inclou els punts clau):

  - `mobile_app/src/utils/themeConfig.ts`  — nova secció `semantic` i canvis de `shadow`.
  - `mobile_app/src/utils/themes.ts`       — mapatge de claus semàntiques a `lightTheme` i `darkTheme`.
  - `mobile_app/src/components/SummarySection.tsx`  — usa colors semàntics d'estat.
  - `mobile_app/src/components/EventFrameCard.tsx`   — indicador d'estat, icones i `shadowColor` actualitzats.
  - `mobile_app/src/components/MaterialControlList.tsx` — colors de saldo positius/negatius temàtics.
  - `mobile_app/src/components/CustomHeader.tsx`     — icona d'eliminar usa `destructive`.
  - `mobile_app/src/components/MaterialListItem.tsx`  — icona d'eliminar usa `destructive`.
  - `mobile_app/src/components/PersonListItem.tsx`    — icona d'eliminar usa `destructive`.
  - `mobile_app/src/components/TechSheetListItem.tsx` — ombres temàtiques.
  - `mobile_app/src/components/tech_sheet/ReadOnlySection.tsx` — ombres i estils temàtics.
  - `mobile_app/src/components/tech_sheet/ReadOnlyField.tsx`   — alineació i colors temàtics.
  - `mobile_app/src/components/FilterControls.tsx`    — ajustos d'altura/padding/overflow per pickers.
  - `mobile_app/src/components/MaterialControlFilters.tsx` — mateix ajust per pickers.
  - `mobile_app/src/screens/CalendarScreen.tsx`       — `selectedDayTextColor` ara utilitza `selected-day-text` del tema.
  - `mobile_app/src/screens/EventsScreen.tsx`         — substitucions de `shadowColor` per tema.
  - `mobile_app/src/screens/PeopleScreen.tsx`         — substitucions de `shadowColor` per tema.
  - `mobile_app/src/screens/EventDetailScreen.tsx`    — substitucions de `shadowColor` per tema.
  - `mobile_app/src/screens/MaterialScreen.tsx`       — substitucions de `shadowColor` per tema.

  Si necessites que generi una llista completa i automàtica (grep) de tots els arxius que encara contenen colors codificats, puc executar-la i incorporar el resultat aquí.

  ## Com provar (checklist ràpid)

  1. Instal·la dependències i executa l'app amb Expo (o el setup que utilitzeu localment):

  ```bash
  cd mobile_app
  npm install
  npm run start
  ```

  2. Obre l'app en emulador Android i iOS (o dispositiu físic) i comprova les següents pantalles en **mode clar** i **mode fosc**:
    - Pestanya `Esdeveniments` (`EventsScreen`): comprovar que l'indicador d'estat (círcul) mostra els colors semàntics correctes (pendent/complert) i que les icones d'eliminar apareixen amb color `destructive`.
    - `CalendarScreen`: comprovar que el text del dia seleccionat és llegible (color del tema) i que la selecció no es confon amb el fons.
    - Filtres (`FilterControls` / selectes): obrir els pickers/selector i comprovar que la línia/la ombra del contenidor no creua l'etiqueta del picker (especialment per llistes amb 'Totes les persones' i 'Tots els esdeveniments').
    - Tech-sheet (pantalla de només lectura): comprovar alineació i colors de `ReadOnlyField` i la lectura de seccions.
    - Material / Persones: comprovar que `shadow` és visible com a gris i no negre punyent en mode fosc.

  3. Checklist visual esperada:
    - No hi ha hexos literals (ex.: `#000000`, `#ffffff`) en components crítics; els colors provenen del tema.
    - Les ombres són grises i visibles en dark mode.
    - Pickers mostren correctament el text i l'etiqueta sense superposicions.

  ## Notes per a PR

  - Branche recomanat per fer PR: `DEV_DESKTOP+MOBILE` (ús com a font de veritat per a `.gitignore` i canvis mòbils).
  - Missatge suggerit per al PR: "Refactor: Unificar tema mòbil, afegir colors semàntics, arreglar ombres i pickers (v1.5.0)".
  - Incloure en la descripció del PR una breu "how to test" amb la checklist d'aquí dalt i una llista dels fitxers principals modificats.

  Si vols, puc: (a) executar una cerca automàtica per llistar qualsevol color codificat que quedi, (b) obrir un PR amb commits existents o (c) crear un branch nou amb aquests canvis i preparar el PR amb el missatge suggerit.
